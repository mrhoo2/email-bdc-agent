/**
 * Project Clustering API Route
 * 
 * POST /api/cluster
 * Groups emails into project clusters using AI-assisted analysis.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  clusterEmails,
  clusterEmailsRuleBased,
  clusterEmailsWithAI,
  DEFAULT_CLUSTERING_CONFIG,
} from "@/lib/clustering";
import type { EmailForClustering, ClusteringConfig } from "@/lib/clustering";

// ============================================
// Request Schema
// ============================================

const ClusterRequestSchema = z.object({
  // Array of emails with extracted data
  emails: z.array(
    z.object({
      emailId: z.string(),
      threadId: z.string(),
      subject: z.string(),
      from: z.string(),
      date: z.string(),
      projectName: z.string().nullable(),
      projectAddress: z.string().nullable(),
      generalContractor: z.string().nullable(),
      engineer: z.string().nullable(),
      architect: z.string().nullable(),
      purchaserCompany: z.string().nullable(),
    })
  ),
  // Optional configuration
  config: z.object({
    similarityThreshold: z.number().min(0).max(1).optional(),
    useAI: z.boolean().optional(),
    signalWeights: z.object({
      subject: z.number().optional(),
      projectName: z.number().optional(),
      address: z.number().optional(),
      gc: z.number().optional(),
      engineer: z.number().optional(),
      architect: z.number().optional(),
    }).optional(),
    maxBatchSize: z.number().optional(),
  }).optional(),
  // Clustering method override
  method: z.enum(["ai", "rule_based", "auto"]).optional(),
});

type ClusterRequest = z.infer<typeof ClusterRequestSchema>;

// ============================================
// API Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validationResult = ClusterRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { emails, config: requestConfig, method } = validationResult.data;
    
    // Check for empty input
    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          clusters: [],
          unclustered: [],
          summary: {
            totalEmails: 0,
            totalClusters: 0,
            averageClusterSize: 0,
            averageConfidence: 0,
          },
          processedAt: new Date().toISOString(),
          method: "none",
        },
      });
    }
    
    // Build configuration
    const config: ClusteringConfig = {
      ...DEFAULT_CLUSTERING_CONFIG,
      ...(requestConfig?.similarityThreshold !== undefined && {
        similarityThreshold: requestConfig.similarityThreshold,
      }),
      ...(requestConfig?.useAI !== undefined && {
        useAI: requestConfig.useAI,
      }),
      ...(requestConfig?.maxBatchSize !== undefined && {
        maxBatchSize: requestConfig.maxBatchSize,
      }),
      signalWeights: {
        ...DEFAULT_CLUSTERING_CONFIG.signalWeights,
        ...requestConfig?.signalWeights,
      },
    };
    
    // Override useAI based on method if specified
    if (method === "ai") {
      config.useAI = true;
    } else if (method === "rule_based") {
      config.useAI = false;
    }
    
    // Convert emails to EmailForClustering format
    const emailsForClustering: EmailForClustering[] = emails.map(email => ({
      emailId: email.emailId,
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      date: email.date,
      projectName: email.projectName,
      projectAddress: email.projectAddress,
      generalContractor: email.generalContractor,
      engineer: email.engineer,
      architect: email.architect,
      purchaserCompany: email.purchaserCompany,
    }));
    
    // Perform clustering
    let result;
    if (method === "ai") {
      result = await clusterEmailsWithAI(emailsForClustering, config);
    } else if (method === "rule_based") {
      result = await clusterEmailsRuleBased(emailsForClustering, config);
    } else {
      result = await clusterEmails(emailsForClustering, config);
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error("Clustering error:", error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler (for testing/debugging)
// ============================================

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/cluster",
    description: "Project clustering endpoint",
    methods: ["POST"],
    requestBody: {
      emails: "Array of EmailForClustering objects",
      config: "Optional ClusteringConfig",
      method: "Optional: 'ai' | 'rule_based' | 'auto'",
    },
    response: {
      success: "boolean",
      data: {
        clusters: "Array of ProjectCluster objects",
        unclustered: "Array of email IDs that couldn't be clustered",
        summary: {
          totalEmails: "number",
          totalClusters: "number",
          averageClusterSize: "number",
          averageConfidence: "number",
        },
        processedAt: "ISO timestamp",
        method: "'ai' | 'rule_based' | 'hybrid'",
      },
    },
  });
}
