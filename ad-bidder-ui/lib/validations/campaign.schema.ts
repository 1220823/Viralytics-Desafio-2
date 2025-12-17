import { z } from "zod";

// Age group validation
const ageGroupSchema = z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]);

// Gender validation
const genderSchema = z.enum(["male", "female", "all"]);

// Device type validation
const deviceTypeSchema = z.enum(["mobile", "desktop", "tablet"]);

// Ad topic validation
const adTopicSchema = z.enum([
  "technology",
  "finance",
  "healthcare",
  "education",
  "entertainment",
  "travel",
  "food",
  "fashion",
  "sports",
  "automotive",
]);

// Main campaign form schema
export const campaignSchema = z.object({
  campaignName: z
    .string()
    .min(3, "Campaign name must be at least 3 characters")
    .max(100, "Campaign name must be less than 100 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Campaign name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),

  budget: z
    .number({ message: "Budget must be a valid number" })
    .min(100, "Minimum budget is $100")
    .max(1000000, "Maximum budget is $1,000,000"),

  maxBidCpm: z
    .number({ message: "Max bid CPM must be a valid number" })
    .min(0.01, "Minimum CPM is $0.01")
    .max(100, "Maximum CPM is $100"),

  targetAgeGroups: z
    .array(ageGroupSchema)
    .min(1, "Select at least one age group"),

  targetGenders: z
    .array(genderSchema)
    .min(1, "Select at least one gender option"),

  deviceTypes: z
    .array(deviceTypeSchema)
    .min(1, "Select at least one device type"),

  adTopic: adTopicSchema,

  searchTags: z
    .array(z.string().min(1).max(50))
    .min(1, "Add at least one search tag")
    .max(20, "Maximum 20 search tags allowed"),
});

// Type inference from schema
export type CampaignFormData = z.infer<typeof campaignSchema>;

// Default values for form
export const defaultCampaignValues: CampaignFormData = {
  campaignName: "",
  budget: 1000,
  maxBidCpm: 2.5,
  targetAgeGroups: ["25-34"],
  targetGenders: ["all"],
  deviceTypes: ["mobile", "desktop"],
  adTopic: "technology",
  searchTags: [],
};
