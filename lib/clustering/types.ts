/**
 * Project Clustering Types
 * 
 * Types for grouping related emails into projects using
 * AI-assisted similarity analysis.
 */

import { z } from "zod";

// ============================================
// Core Clustering Types
// ============================================

export const ProjectClusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Canonical project info (merged from emails)
  project: z.object({
    name: z.string().nullable(),
    address: z.string().nullable(),
    generalContractor: z.string().nullable(),
    engineer: z.string().nullable(),
    architect: z.string().nullable(),
  }),
  // All email IDs in this cluster
  emailIds: z.array(z.string()),
  // Confidence that these emails belong together
  confidence: z.number().min(0).max(1),
  // How the cluster was formed
  clusteringMethod: z.enum(["ai", "rule_based", "manual"]),
  // Timestamp
  createdAt: z.string().datetime(),
});

export const ClusteringResultSchema = z.object({
  clusters: z.array(ProjectClusterSchema),
  // Emails that couldn't be clustered
  unclustered: z.array(z.string()),
  // Overall stats
  summary: z.object({
    totalEmails: z.number(),
    totalClusters: z.number(),
    averageClusterSize: z.number(),
    averageConfidence: z.number(),
  }),
  // Metadata
  processedAt: z.string().datetime(),
  method: z.enum(["ai", "rule_based", "hybrid"]),
});

// ============================================
// Similarity Calculation Types
// ============================================

export const SimilaritySignalSchema = z.object({
  signal: z.enum(["subject", "projectName", "address", "gc", "engineer", "architect"]),
  weight: z.number().min(0).max(1),
  value1: z.string().nullable(),
  value2: z.string().nullable(),
  score: z.number().min(0).max(1),
});

export const EmailSimilaritySchema = z.object({
  emailId1: z.string(),
  emailId2: z.string(),
  signals: z.array(SimilaritySignalSchema),
  overallScore: z.number().min(0).max(1),
  aiReasoning: z.string().optional(),
});

// ============================================
// AI Clustering Types
// ============================================

export const AIClusterSuggestionSchema = z.object({
  clusterName: z.string(),
  emailIds: z.array(z.string()),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  projectInfo: z.object({
    name: z.string().nullable(),
    address: z.string().nullable(),
    generalContractor: z.string().nullable(),
    engineer: z.string().nullable(),
    architect: z.string().nullable(),
  }),
});

export const AIClusteringResponseSchema = z.object({
  clusters: z.array(AIClusterSuggestionSchema),
  unclustered: z.array(z.string()),
  notes: z.array(z.string()),
});

// ============================================
// Configuration Types
// ============================================

export const ClusteringConfigSchema = z.object({
  // Minimum similarity score to consider emails related
  similarityThreshold: z.number().min(0).max(1).default(0.6),
  // Whether to use AI for clustering decisions
  useAI: z.boolean().default(true),
  // Signal weights for rule-based similarity
  signalWeights: z.object({
    subject: z.number().default(0.2),
    projectName: z.number().default(0.25),
    address: z.number().default(0.35),
    gc: z.number().default(0.1),
    engineer: z.number().default(0.05),
    architect: z.number().default(0.05),
  }).default({}),
  // Maximum emails to process in one batch
  maxBatchSize: z.number().default(50),
});

// ============================================
// Type Exports
// ============================================

export type ProjectCluster = z.infer<typeof ProjectClusterSchema>;
export type ClusteringResult = z.infer<typeof ClusteringResultSchema>;
export type SimilaritySignal = z.infer<typeof SimilaritySignalSchema>;
export type EmailSimilarity = z.infer<typeof EmailSimilaritySchema>;
export type AIClusterSuggestion = z.infer<typeof AIClusterSuggestionSchema>;
export type AIClusteringResponse = z.infer<typeof AIClusteringResponseSchema>;
export type ClusteringConfig = z.infer<typeof ClusteringConfigSchema>;

// ============================================
// Input Type (what we cluster)
// ============================================

export interface EmailForClustering {
  emailId: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  // Extracted data (from Stage 2)
  projectName: string | null;
  projectAddress: string | null;
  generalContractor: string | null;
  engineer: string | null;
  architect: string | null;
  purchaserCompany: string | null;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
  similarityThreshold: 0.6,
  useAI: true,
  signalWeights: {
    subject: 0.2,
    projectName: 0.25,
    address: 0.35,
    gc: 0.1,
    engineer: 0.05,
    architect: 0.05,
  },
  maxBatchSize: 50,
};
