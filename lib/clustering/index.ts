/**
 * Project Clustering Service
 * 
 * Groups related emails into projects using a hybrid approach:
 * 1. Thread-based grouping (emails in same thread = same project)
 * 2. Rule-based similarity scoring
 * 3. AI-assisted clustering for ambiguous cases
 */

import { createFastAIProviderFromEnv } from "@/lib/ai";
import type {
  EmailForClustering,
  ProjectCluster,
  ClusteringResult,
  ClusteringConfig,
  AIClusteringResponse,
} from "./types";
import {
  DEFAULT_CLUSTERING_CONFIG,
  AIClusteringResponseSchema,
} from "./types";
import {
  groupByThread,
  calculateSimilarityMatrix,
  areSameProject,
} from "./similarity";

// ============================================
// AI Clustering Prompt
// ============================================

const AI_CLUSTERING_SYSTEM_PROMPT = `You are an expert at analyzing construction and HVAC bid-related emails and grouping them by project.

Your task is to analyze a list of emails (with extracted metadata) and group them into logical project clusters. 
Emails about the same construction project should be grouped together.

Key signals to consider:
- Project name (most important)
- Project address/location
- General contractor name
- Engineer/architect names
- Email subject patterns
- Purchaser/contractor company

Rules:
1. Each email should belong to exactly one cluster OR be marked as unclustered
2. Emails from the same email thread should be in the same cluster
3. When project signals match closely (same project name, address, or GC), group together
4. When uncertain, prefer to keep emails separate rather than incorrectly grouping
5. Generate a descriptive cluster name based on the project (e.g., "Byron WWTP - Improvements")

Respond with valid JSON only.`;

const AI_CLUSTERING_PROMPT_TEMPLATE = `Analyze these emails and group them into project clusters:

EMAILS:
{{EMAILS}}

Respond with this exact JSON structure:
{
  "clusters": [
    {
      "clusterName": "Project Name - Description",
      "emailIds": ["id1", "id2"],
      "reasoning": "Why these emails belong together",
      "confidence": 0.85,
      "projectInfo": {
        "name": "Inferred project name or null",
        "address": "Project address or null",
        "generalContractor": "GC name or null",
        "engineer": "Engineer or null",
        "architect": "Architect or null"
      }
    }
  ],
  "unclustered": ["email_ids_that_dont_fit_any_cluster"],
  "notes": ["Any observations about the clustering"]
}`;

// ============================================
// AI Clustering Function
// ============================================

/**
 * Use AI to cluster emails into projects
 */
async function aiClusterEmails(
  emails: EmailForClustering[]
): Promise<AIClusteringResponse> {
  // Use fast-tier model for clustering (optimized for speed)
  const provider = createFastAIProviderFromEnv();
  
  // Format emails for the prompt
  const emailsJson = emails.map(email => ({
    id: email.emailId,
    threadId: email.threadId,
    subject: email.subject,
    from: email.from,
    date: email.date,
    projectName: email.projectName,
    projectAddress: email.projectAddress,
    generalContractor: email.generalContractor,
    engineer: email.engineer,
    architect: email.architect,
    purchaser: email.purchaserCompany,
  }));
  
  const prompt = AI_CLUSTERING_PROMPT_TEMPLATE.replace(
    "{{EMAILS}}",
    JSON.stringify(emailsJson, null, 2)
  );
  
  const response = await provider.complete(prompt, AI_CLUSTERING_SYSTEM_PROMPT);
  
  // Clean potential markdown code blocks
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  
  const parsed = JSON.parse(cleanedResponse);
  
  // Validate the response
  return AIClusteringResponseSchema.parse(parsed);
}

// ============================================
// Rule-based Clustering (Union-Find)
// ============================================

/**
 * Simple Union-Find data structure for clustering
 */
class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();
  
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    
    return this.parent.get(x)!;
  }
  
  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;
    
    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;
    
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }
  
  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      const group = groups.get(root) || [];
      group.push(key);
      groups.set(root, group);
    }
    
    return groups;
  }
}

/**
 * Rule-based clustering using similarity scores
 */
function ruleBasedCluster(
  emails: EmailForClustering[],
  config: ClusteringConfig
): Map<string, string[]> {
  const uf = new UnionFind();
  
  // Initialize all emails
  for (const email of emails) {
    uf.find(email.emailId);
  }
  
  // First pass: group by thread
  const threads = groupByThread(emails);
  for (const threadEmails of threads.values()) {
    if (threadEmails.length > 1) {
      const first = threadEmails[0].emailId;
      for (let i = 1; i < threadEmails.length; i++) {
        uf.union(first, threadEmails[i].emailId);
      }
    }
  }
  
  // Second pass: group by similarity
  const similarities = calculateSimilarityMatrix(emails, config);
  for (const similarity of similarities) {
    uf.union(similarity.emailId1, similarity.emailId2);
  }
  
  return uf.getGroups();
}

// ============================================
// Cluster Info Extraction
// ============================================

/**
 * Extract canonical project info from a cluster of emails
 * Prioritizes the most confident/complete information
 */
function extractClusterInfo(
  emails: EmailForClustering[]
): ProjectCluster["project"] {
  // Find the best value for each field
  const findBestValue = (
    getter: (e: EmailForClustering) => string | null
  ): string | null => {
    const values = emails.map(getter).filter((v): v is string => v !== null);
    if (values.length === 0) return null;
    
    // Return most common value, or first if all unique
    const counts = new Map<string, number>();
    for (const v of values) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    
    let best = values[0];
    let bestCount = 0;
    for (const [value, count] of counts) {
      if (count > bestCount) {
        best = value;
        bestCount = count;
      }
    }
    
    return best;
  };
  
  return {
    name: findBestValue(e => e.projectName),
    address: findBestValue(e => e.projectAddress),
    generalContractor: findBestValue(e => e.generalContractor),
    engineer: findBestValue(e => e.engineer),
    architect: findBestValue(e => e.architect),
  };
}

/**
 * Generate a cluster name from project info
 */
function generateClusterName(
  project: ProjectCluster["project"],
  emailSubjects: string[]
): string {
  // Try project name first
  if (project.name) return project.name;
  
  // Try address
  if (project.address) return `Project at ${project.address}`;
  
  // Try GC
  if (project.generalContractor) return `${project.generalContractor} Project`;
  
  // Fall back to email subject
  if (emailSubjects.length > 0) {
    // Clean subject and use as name
    const subject = emailSubjects[0]
      .replace(/^(re:|fwd:|fw:)\s*/gi, "")
      .trim();
    return subject.substring(0, 50) + (subject.length > 50 ? "..." : "");
  }
  
  return "Unknown Project";
}

// ============================================
// Main Clustering Functions
// ============================================

/**
 * Cluster emails using rule-based similarity only
 */
export async function clusterEmailsRuleBased(
  emails: EmailForClustering[],
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): Promise<ClusteringResult> {
  if (emails.length === 0) {
    return {
      clusters: [],
      unclustered: [],
      summary: {
        totalEmails: 0,
        totalClusters: 0,
        averageClusterSize: 0,
        averageConfidence: 0,
      },
      processedAt: new Date().toISOString(),
      method: "rule_based",
    };
  }
  
  const emailMap = new Map(emails.map(e => [e.emailId, e]));
  const groups = ruleBasedCluster(emails, config);
  
  const clusters: ProjectCluster[] = [];
  
  for (const [, emailIds] of groups) {
    const clusterEmails = emailIds
      .map(id => emailMap.get(id))
      .filter((e): e is EmailForClustering => e !== undefined);
    
    const project = extractClusterInfo(clusterEmails);
    const name = generateClusterName(
      project,
      clusterEmails.map(e => e.subject)
    );
    
    // Calculate average confidence based on how well emails match
    let totalSimilarity = 0;
    let comparisons = 0;
    for (let i = 0; i < clusterEmails.length; i++) {
      for (let j = i + 1; j < clusterEmails.length; j++) {
        if (areSameProject(clusterEmails[i], clusterEmails[j], config)) {
          totalSimilarity += 1;
        }
        comparisons++;
      }
    }
    const confidence = comparisons > 0 ? totalSimilarity / comparisons : 1;
    
    clusters.push({
      id: `cluster_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      project,
      emailIds,
      confidence: Math.round(confidence * 100) / 100,
      clusteringMethod: "rule_based",
      createdAt: new Date().toISOString(),
    });
  }
  
  // Sort clusters by size (largest first)
  clusters.sort((a, b) => b.emailIds.length - a.emailIds.length);
  
  const totalConfidence = clusters.reduce((sum, c) => sum + c.confidence, 0);
  
  return {
    clusters,
    unclustered: [], // Rule-based always assigns to a cluster
    summary: {
      totalEmails: emails.length,
      totalClusters: clusters.length,
      averageClusterSize: emails.length / clusters.length,
      averageConfidence: clusters.length > 0 ? totalConfidence / clusters.length : 0,
    },
    processedAt: new Date().toISOString(),
    method: "rule_based",
  };
}

/**
 * Cluster emails using AI
 */
export async function clusterEmailsWithAI(
  emails: EmailForClustering[],
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): Promise<ClusteringResult> {
  if (emails.length === 0) {
    return {
      clusters: [],
      unclustered: [],
      summary: {
        totalEmails: 0,
        totalClusters: 0,
        averageClusterSize: 0,
        averageConfidence: 0,
      },
      processedAt: new Date().toISOString(),
      method: "ai",
    };
  }
  
  // For large batches, chunk the emails
  const maxBatchSize = config.maxBatchSize;
  if (emails.length > maxBatchSize) {
    // Process in chunks and merge
    const chunks: EmailForClustering[][] = [];
    for (let i = 0; i < emails.length; i += maxBatchSize) {
      chunks.push(emails.slice(i, i + maxBatchSize));
    }
    
    const results: ClusteringResult[] = [];
    for (const chunk of chunks) {
      const result = await clusterEmailsWithAI(chunk, config);
      results.push(result);
    }
    
    // Merge results (simple concatenation for now)
    const allClusters = results.flatMap(r => r.clusters);
    const allUnclustered = results.flatMap(r => r.unclustered);
    
    return {
      clusters: allClusters,
      unclustered: allUnclustered,
      summary: {
        totalEmails: emails.length,
        totalClusters: allClusters.length,
        averageClusterSize: emails.length / Math.max(allClusters.length, 1),
        averageConfidence: allClusters.reduce((sum, c) => sum + c.confidence, 0) / Math.max(allClusters.length, 1),
      },
      processedAt: new Date().toISOString(),
      method: "ai",
    };
  }
  
  const aiResponse = await aiClusterEmails(emails);
  
  const clusters: ProjectCluster[] = aiResponse.clusters.map(suggestion => ({
    id: `cluster_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: suggestion.clusterName,
    project: suggestion.projectInfo,
    emailIds: suggestion.emailIds,
    confidence: suggestion.confidence,
    clusteringMethod: "ai" as const,
    createdAt: new Date().toISOString(),
  }));
  
  const totalConfidence = clusters.reduce((sum, c) => sum + c.confidence, 0);
  
  return {
    clusters,
    unclustered: aiResponse.unclustered,
    summary: {
      totalEmails: emails.length,
      totalClusters: clusters.length,
      averageClusterSize: emails.length / Math.max(clusters.length, 1),
      averageConfidence: clusters.length > 0 ? totalConfidence / clusters.length : 0,
    },
    processedAt: new Date().toISOString(),
    method: "ai",
  };
}

/**
 * Cluster emails using hybrid approach (rule-based + AI verification)
 */
export async function clusterEmails(
  emails: EmailForClustering[],
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): Promise<ClusteringResult> {
  if (!config.useAI) {
    return clusterEmailsRuleBased(emails, config);
  }
  
  // Use AI for clustering
  return clusterEmailsWithAI(emails, config);
}

// ============================================
// Utility Exports
// ============================================

export { DEFAULT_CLUSTERING_CONFIG } from "./types";
export type {
  EmailForClustering,
  ProjectCluster,
  ClusteringResult,
  ClusteringConfig,
} from "./types";
export {
  calculateEmailSimilarity,
  findSimilarEmails,
  areSameProject,
} from "./similarity";
