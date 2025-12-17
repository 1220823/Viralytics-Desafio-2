// Prediction Response Types for Ad-Bidder

import type { AgeGroup, Gender, DeviceType, AdTopic } from "./campaign";

export type ROILevel = "low" | "medium" | "high" | "very_high";

export interface SegmentPrediction {
  segmentId: string;
  ageGroup: AgeGroup;
  gender: Gender;
  deviceType: DeviceType;
  predictedCtr: number; // Click-through rate (0-1)
  predictedConversionRate: number; // Conversion rate (0-1)
  estimatedReach: number;
  estimatedCost: number;
  roiScore: number; // 0-100
  roiLevel: ROILevel;
}

export interface BudgetAllocation {
  segmentId: string;
  allocatedBudget: number;
  percentageOfTotal: number;
  expectedImpressions: number;
  expectedClicks: number;
  expectedConversions: number;
}

export interface CampaignSummary {
  overallRoi: ROILevel;
  optimizationScore: number; // 0-100
  estimatedTotalReach: number;
  estimatedTotalClicks: number;
  estimatedTotalConversions: number;
  averageCtr: number;
  averageCpm: number;
  topPerformingSegment: string;
  recommendations: string[];
}

export interface PredictionResponse {
  success: boolean;
  campaignId: string;
  createdAt: string;
  predictions: SegmentPrediction[];
  budgetAllocation: BudgetAllocation[];
  summary: CampaignSummary;
}

// Chart data types for dashboard visualization
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface SegmentChartData {
  segment: string;
  ctr: number;
  reach: number;
  budget: number;
  roi: number;
}
