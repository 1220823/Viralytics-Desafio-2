// Types matching backend models.py

export interface Campaign {
  _key: string; // Unique key for React (always present)
  id?: number; // Only present for API-loaded items
  name: string;
  no_of_days: number;
  time: string; // date as ISO string
  approved_budget: number;
  impressions: number;
  clicks: number;
  media_cost_usd: number;
  ext_service_name: 'Facebook Ads' | 'DV360' | 'Google Ads';
  channel_name: 'Mobile' | 'Social' | 'Video' | 'Display' | 'Search';
  search_tag_cat: 'Youtube' | 'Inmarket' | 'Retargeting';
  overcost?: number; // Set by prediction
}

export interface Ad {
  _key: string; // Unique key for React (always present)
  id?: number; // Only present for API-loaded items
  name: string;
  click_through_rate: number;
  view_time: number;
  cost_per_click: number;
  roi: number;
  timestamp: string; // datetime as ISO string
  age_group: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  engagement_level: 'Ignored' | 'Liked' | 'Commented' | 'Shared';
  device_type: 'Tablet' | 'Desktop' | 'Mobile';
  location: 'UK' | 'Germany' | 'India' | 'USA' | 'Canada';
  gender: 'Male' | 'Female';
  content_type: 'Image' | 'Text' | 'Video';
  ad_topic: 'Health' | 'Electronics' | 'Fashion' | 'Travel' | 'Automotive';
  ad_target_audience: 'Young Adults' | 'Family Oriented' | 'Travel Lovers' | 'Fitness Lovers' | 'Tech Enthusiasts' | 'Health Conscious' | 'Wellness Seekers' | 'Busy Professionals';
  conversion_rate?: number; // Set by prediction
}

export interface OptimizationRequest {
  campaigns: Campaign[];
  ads: Ad[];
  total_budget: number;
  population_size?: number;
  max_generations?: number;
  mutation_rate?: number;
  crossover_rate?: number;
  risk_factor?: number;
  ga_verbose?: boolean;
}

export interface TabuSearchRequest {
  campaigns: Campaign[];
  ads: Ad[];
  total_budget: number;
  max_iterations?: number;
  tabu_tenure?: number;
  neighborhood_size?: number;
  risk_factor?: number;
  use_aspiration?: boolean;
  intensification_threshold?: number;
  diversification_threshold?: number;
  ts_verbose?: boolean;
}

export interface ComparisonRequest {
  campaigns: Campaign[];
  ads: Ad[];
  total_budget: number;
  // GA params
  population_size?: number;
  max_generations?: number;
  mutation_rate?: number;
  crossover_rate?: number;
  ga_verbose?: boolean;
  // TS params
  max_iterations?: number;
  tabu_tenure?: number;
  neighborhood_size?: number;
  use_aspiration?: boolean;
  intensification_threshold?: number;
  diversification_threshold?: number;
  ts_verbose?: boolean;
  // Shared
  risk_factor?: number;
}

// Response from GA optimization
export interface CampaignMetrics {
  cost: number;
  revenue: number;
  roi: number;
  overcost: number;
  budget_cost: number;
  media_cost: number;
  ads_cost: number;
  approved_budget: number;
  avg_conversion_rate: number;
  n_ads: number;
}

export interface OptimizationResponse {
  allocation: {
    [campaignId: string]: number[];  // Campaign ID -> Ad IDs array
  };
  fitness: number;
  total_roi: number;
  total_cost: number;
  total_revenue?: number; // Deprecated, use total_media_revenue
  total_media_cost: number;
  total_media_revenue: number;
  campaign_metrics: {
    [campaignId: string]: CampaignMetrics;
  };
}

export interface AlgorithmComparison {
  ga_result: OptimizationResponse | null;
  ts_result: OptimizationResponse | null;
  comparison: Record<string, any>;
  winner: string;
}

// Default values for forms (exclude _key and id as they're generated dynamically)
export const DEFAULT_CAMPAIGN: Omit<Campaign, '_key' | 'id'> = {
  name: '',
  no_of_days: 30,
  time: '2026-01-01',
  approved_budget: 5000,
  impressions: 0,
  clicks: 0,
  media_cost_usd: 0,
  ext_service_name: 'Google Ads',
  channel_name: 'Display',
  search_tag_cat: 'Inmarket',
};

export const DEFAULT_AD: Omit<Ad, '_key' | 'id'> = {
  name: '',
  click_through_rate: 0.05,
  view_time: 30,
  cost_per_click: 2.50,
  roi: 0,
  timestamp: '2026-01-01T00:00:00.000Z',
  age_group: '25-34',
  engagement_level: 'Liked',
  device_type: 'Desktop',
  location: 'USA',
  gender: 'Male',
  content_type: 'Video',
  ad_topic: 'Electronics',
  ad_target_audience: 'Tech Enthusiasts',
};

// Dropdown options matching backend Literal types
export const EXT_SERVICE_OPTIONS: Campaign['ext_service_name'][] = [
  'Facebook Ads',
  'DV360',
  'Google Ads',
];

export const CHANNEL_OPTIONS: Campaign['channel_name'][] = [
  'Mobile',
  'Social',
  'Video',
  'Display',
  'Search',
];

export const SEARCH_TAG_OPTIONS: Campaign['search_tag_cat'][] = [
  'Youtube',
  'Inmarket',
  'Retargeting',
];

export const DEVICE_OPTIONS: Ad['device_type'][] = [
  'Desktop',
  'Mobile',
  'Tablet',
];

export const LOCATION_OPTIONS: Ad['location'][] = [
  'USA',
  'UK',
  'Canada',
  'Germany',
  'India',
];

export const AGE_OPTIONS: Ad['age_group'][] = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55+',
];

export const GENDER_OPTIONS: Ad['gender'][] = [
  'Male',
  'Female',
];

export const CONTENT_TYPE_OPTIONS: Ad['content_type'][] = [
  'Image',
  'Text',
  'Video',
];

export const AD_TOPIC_OPTIONS: Ad['ad_topic'][] = [
  'Health',
  'Electronics',
  'Fashion',
  'Travel',
  'Automotive',
];

export const TARGET_AUDIENCE_OPTIONS: Ad['ad_target_audience'][] = [
  'Young Adults',
  'Family Oriented',
  'Travel Lovers',
  'Fitness Lovers',
  'Tech Enthusiasts',
  'Health Conscious',
  'Wellness Seekers',
  'Busy Professionals',
];

export const ENGAGEMENT_LEVEL_OPTIONS: Ad['engagement_level'][] = [
  'Ignored',
  'Liked',
  'Commented',
  'Shared',
];
