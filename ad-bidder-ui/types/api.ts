// API Types for Ad-Bidder

import type { CampaignInput } from "./campaign";
import type { PredictionResponse } from "./prediction";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Request payload for prediction endpoint
export interface PredictRequest {
  budget: number;
  max_bid_cpm: number;
  target_age_groups: string[];
  target_genders: string[];
  device_types: string[];
  ad_topic: string;
  search_tags: string[];
}

// Transform CampaignInput to PredictRequest (for Python backend)
export function toPredictRequest(input: CampaignInput): PredictRequest {
  return {
    budget: input.budget,
    max_bid_cpm: input.maxBidCpm,
    target_age_groups: input.targetAgeGroups,
    target_genders: input.targetGenders,
    device_types: input.deviceTypes,
    ad_topic: input.adTopic,
    search_tags: input.searchTags,
  };
}

export type { CampaignInput, PredictionResponse };
