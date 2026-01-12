// Types matching backend models.py

export interface Campaign {
  id: number;
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
  id: number;
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
  ideal_roi?: number;
  ga_verbose?: boolean;
}

// Response from GA optimization (Individual)
export interface CampaignAllocation {
  campaign: Campaign;
  allocated_ads: Ad[];
  allocated_budget: number;
}

export interface OptimizationResponse {
  allocations: CampaignAllocation[];
  total_fitness: number;
  total_budget_used: number;
  total_expected_revenue: number;
  total_expected_cost: number;
}

// Default values for forms
export const DEFAULT_CAMPAIGN: Omit<Campaign, 'id'> = {
  name: '',
  no_of_days: 30,
  time: new Date().toISOString().split('T')[0],
  approved_budget: 5000,
  impressions: 0,
  clicks: 0,
  media_cost_usd: 0,
  ext_service_name: 'Google Ads',
  channel_name: 'Display',
  search_tag_cat: 'Inmarket',
};

export const DEFAULT_AD: Omit<Ad, 'id'> = {
  name: '',
  click_through_rate: 0.05,
  view_time: 30,
  cost_per_click: 2.50,
  roi: 0,
  timestamp: new Date().toISOString(),
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
