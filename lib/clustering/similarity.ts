/**
 * Similarity Calculation Functions
 * 
 * Rule-based similarity scoring for email clustering.
 * Uses string similarity and weighted signals to determine
 * how likely two emails belong to the same project.
 */

import stringSimilarity from "string-similarity";
import type {
  EmailForClustering,
  SimilaritySignal,
  EmailSimilarity,
  ClusteringConfig,
} from "./types";
import { DEFAULT_CLUSTERING_CONFIG } from "./types";

// ============================================
// String Normalization
// ============================================

/**
 * Normalize a string for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common prefixes/suffixes
 */
function normalizeString(str: string | null | undefined): string {
  if (!str) return "";
  
  return str
    .toLowerCase()
    .trim()
    // Remove common email subject prefixes
    .replace(/^(re:|fwd:|fw:)\s*/gi, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    // Remove special characters that don't affect meaning
    .replace(/[^\w\s-]/g, "");
}

/**
 * Calculate string similarity between two values
 * Returns 0 if either value is empty
 */
function calculateStringSimilarity(
  value1: string | null | undefined,
  value2: string | null | undefined
): number {
  const normalized1 = normalizeString(value1);
  const normalized2 = normalizeString(value2);
  
  // If both are empty, consider them "similar" (neutral)
  if (!normalized1 && !normalized2) return 0;
  
  // If only one is empty, they're not similar
  if (!normalized1 || !normalized2) return 0;
  
  // Exact match
  if (normalized1 === normalized2) return 1.0;
  
  // Calculate Dice coefficient (good for short strings)
  return stringSimilarity.compareTwoStrings(normalized1, normalized2);
}

// ============================================
// Signal Calculations
// ============================================

/**
 * Calculate similarity for a specific signal
 */
function calculateSignalSimilarity(
  signal: SimilaritySignal["signal"],
  email1: EmailForClustering,
  email2: EmailForClustering,
  weight: number
): SimilaritySignal {
  let value1: string | null = null;
  let value2: string | null = null;
  
  switch (signal) {
    case "subject":
      value1 = email1.subject;
      value2 = email2.subject;
      break;
    case "projectName":
      value1 = email1.projectName;
      value2 = email2.projectName;
      break;
    case "address":
      value1 = email1.projectAddress;
      value2 = email2.projectAddress;
      break;
    case "gc":
      value1 = email1.generalContractor;
      value2 = email2.generalContractor;
      break;
    case "engineer":
      value1 = email1.engineer;
      value2 = email2.engineer;
      break;
    case "architect":
      value1 = email1.architect;
      value2 = email2.architect;
      break;
  }
  
  const score = calculateStringSimilarity(value1, value2);
  
  return {
    signal,
    weight,
    value1,
    value2,
    score,
  };
}

// ============================================
// Main Similarity Function
// ============================================

/**
 * Calculate overall similarity between two emails
 * Returns a weighted score based on configured signals
 */
export function calculateEmailSimilarity(
  email1: EmailForClustering,
  email2: EmailForClustering,
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): EmailSimilarity {
  const weights = config.signalWeights;
  
  const signals: SimilaritySignal[] = [
    calculateSignalSimilarity("subject", email1, email2, weights.subject),
    calculateSignalSimilarity("projectName", email1, email2, weights.projectName),
    calculateSignalSimilarity("address", email1, email2, weights.address),
    calculateSignalSimilarity("gc", email1, email2, weights.gc),
    calculateSignalSimilarity("engineer", email1, email2, weights.engineer),
    calculateSignalSimilarity("architect", email1, email2, weights.architect),
  ];
  
  // Calculate weighted average, but only for signals with non-zero values
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const signal of signals) {
    // Only count signals where at least one email has a value
    if (signal.value1 || signal.value2) {
      totalWeight += signal.weight;
      weightedSum += signal.score * signal.weight;
    }
  }
  
  // If no comparable signals, return 0 similarity
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    emailId1: email1.emailId,
    emailId2: email2.emailId,
    signals,
    overallScore,
  };
}

// ============================================
// Batch Similarity Matrix
// ============================================

/**
 * Calculate similarity matrix for a batch of emails
 * Returns all pairwise similarities above the threshold
 */
export function calculateSimilarityMatrix(
  emails: EmailForClustering[],
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): EmailSimilarity[] {
  const similarities: EmailSimilarity[] = [];
  
  // Calculate all pairwise similarities
  for (let i = 0; i < emails.length; i++) {
    for (let j = i + 1; j < emails.length; j++) {
      const similarity = calculateEmailSimilarity(emails[i], emails[j], config);
      
      // Only include similarities above threshold
      if (similarity.overallScore >= config.similarityThreshold) {
        similarities.push(similarity);
      }
    }
  }
  
  // Sort by similarity score (highest first)
  return similarities.sort((a, b) => b.overallScore - a.overallScore);
}

// ============================================
// Thread-based Grouping
// ============================================

/**
 * Group emails by thread ID
 * Emails in the same thread are automatically in the same cluster
 */
export function groupByThread(
  emails: EmailForClustering[]
): Map<string, EmailForClustering[]> {
  const threads = new Map<string, EmailForClustering[]>();
  
  for (const email of emails) {
    const existing = threads.get(email.threadId) || [];
    existing.push(email);
    threads.set(email.threadId, existing);
  }
  
  return threads;
}

// ============================================
// Find Similar Emails
// ============================================

/**
 * Find all emails similar to a given email
 */
export function findSimilarEmails(
  targetEmail: EmailForClustering,
  allEmails: EmailForClustering[],
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): EmailSimilarity[] {
  const similarities: EmailSimilarity[] = [];
  
  for (const email of allEmails) {
    // Skip self-comparison
    if (email.emailId === targetEmail.emailId) continue;
    
    const similarity = calculateEmailSimilarity(targetEmail, email, config);
    
    if (similarity.overallScore >= config.similarityThreshold) {
      similarities.push(similarity);
    }
  }
  
  return similarities.sort((a, b) => b.overallScore - a.overallScore);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get the best match for an email from a list
 */
export function getBestMatch(
  targetEmail: EmailForClustering,
  candidates: EmailForClustering[],
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): { email: EmailForClustering; similarity: EmailSimilarity } | null {
  const similarities = findSimilarEmails(targetEmail, candidates, config);
  
  if (similarities.length === 0) return null;
  
  const bestSimilarity = similarities[0];
  const bestEmail = candidates.find(
    e => e.emailId === bestSimilarity.emailId2 || e.emailId === bestSimilarity.emailId1
  );
  
  if (!bestEmail) return null;
  
  return {
    email: bestEmail,
    similarity: bestSimilarity,
  };
}

/**
 * Check if two emails are likely about the same project
 */
export function areSameProject(
  email1: EmailForClustering,
  email2: EmailForClustering,
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): boolean {
  // Same thread = same project
  if (email1.threadId === email2.threadId) return true;
  
  const similarity = calculateEmailSimilarity(email1, email2, config);
  return similarity.overallScore >= config.similarityThreshold;
}
