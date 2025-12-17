// Campaign Input Types for Ad-Bidder

export type AgeGroup = "18-24" | "25-34" | "35-44" | "45-54" | "55+";

export type Gender = "male" | "female" | "all";

export type DeviceType = "mobile" | "desktop" | "tablet";

export type AdTopic =
  | "technology"
  | "finance"
  | "healthcare"
  | "education"
  | "entertainment"
  | "travel"
  | "food"
  | "fashion"
  | "sports"
  | "automotive";

export interface CampaignInput {
  campaignName: string;
  budget: number;
  maxBidCpm: number;
  targetAgeGroups: AgeGroup[];
  targetGenders: Gender[];
  deviceTypes: DeviceType[];
  adTopic: AdTopic;
  searchTags: string[];
}

// Options for form selects
export const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "18-24", label: "18-24 years" },
  { value: "25-34", label: "25-34 years" },
  { value: "35-44", label: "35-44 years" },
  { value: "45-54", label: "45-54 years" },
  { value: "55+", label: "55+ years" },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "all", label: "All Genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const DEVICE_OPTIONS: { value: DeviceType; label: string }[] = [
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
];

export const AD_TOPIC_OPTIONS: { value: AdTopic; label: string }[] = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance & Banking" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "travel", label: "Travel & Tourism" },
  { value: "food", label: "Food & Beverage" },
  { value: "fashion", label: "Fashion & Lifestyle" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "automotive", label: "Automotive" },
];
