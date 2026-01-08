export interface Campaign {
  id: string;
  serviceName: string;
  channelName: string;
  approvedBudget: number;
  duration: number;
  startDate: string;
  categoryTags: string[];
  impressions: number;
  clicks: number;
  mediaCost: number;
}

export interface Ad {
  id: string;
  deviceType: string;
  location: string;
  ageGroup: string;
  gender: string;
  contentType: string;
  adTopic: string;
  targetAudience: string;
  costPerClick: number;
}

export interface OptimizationResult {
  campaignName: string;
  matchedAds: string[];
  predictedConversionRate: number;
  estimatedCost: number;
  expectedRoi: number;
}

export interface OptimizationResponse {
  totalRoi: number;
  totalBudgetAllocated: number;
  averageConversionRate: number;
  results: OptimizationResult[];
}

export const DEFAULT_CAMPAIGN: Omit<Campaign, 'id'> = {
  serviceName: '',
  channelName: '',
  approvedBudget: 5000,
  duration: 30,
  startDate: new Date().toISOString().split('T')[0],
  categoryTags: [],
  impressions: 0,
  clicks: 0,
  mediaCost: 0,
};

export const DEFAULT_AD: Omit<Ad, 'id'> = {
  deviceType: 'All Devices',
  location: 'United States',
  ageGroup: '25-34',
  gender: 'All',
  contentType: 'Video Ad',
  adTopic: '',
  targetAudience: '',
  costPerClick: 2.50,
};

export const SERVICE_OPTIONS = [
  { value: 'cloud_hosting', label: 'Enterprise Cloud Hosting' },
  { value: 'cyber_security', label: 'Cyber Security Suite' },
  { value: 'data_analytics', label: 'Big Data Analytics Platform' },
  { value: 'crm_solution', label: 'CRM Professional' },
  { value: 'marketing_auto', label: 'Marketing Automation Tool' },
];

export const CHANNEL_OPTIONS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'programmatic', label: 'Programmatic Display' },
  { value: 'dv360', label: 'Display & Video 360' },
];

export const CATEGORY_OPTIONS = [
  { value: 'tech', label: 'Technology' },
  { value: 'saas', label: 'SaaS' },
  { value: 'b2b', label: 'B2B' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
];

export const DEVICE_OPTIONS = [
  'Desktop Only',
  'Mobile Only',
  'Tablet Only',
  'All Devices',
];

export const LOCATION_OPTIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'European Union',
];

export const AGE_OPTIONS = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
];

export const GENDER_OPTIONS = [
  'All',
  'Male',
  'Female',
];

export const CONTENT_TYPE_OPTIONS = [
  'Image Ad',
  'Video Ad',
  'Carousel',
  'Text Only',
];
