"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Rocket,
  DollarSign,
  Target,
  Users,
  Smartphone,
  Tag,
  Search,
} from "lucide-react";

import {
  campaignSchema,
  CampaignFormData,
  defaultCampaignValues,
} from "@/lib/validations/campaign.schema";
import {
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  DEVICE_OPTIONS,
  AD_TOPIC_OPTIONS,
} from "@/types/campaign";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  MultiSelect,
  TagInput,
} from "@/components/ui";

export function CampaignForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: defaultCampaignValues,
  });

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      // Store form data in sessionStorage for results page
      sessionStorage.setItem("campaignData", JSON.stringify(data));
      // Navigate to results page
      router.push("/results");
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campaign Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Campaign Details
          </CardTitle>
          <CardDescription>
            Give your campaign a unique, descriptive name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            label="Campaign Name"
            placeholder="e.g., Summer Tech Sale 2024"
            error={errors.campaignName?.message}
            {...register("campaignName")}
          />
        </CardContent>
      </Card>

      {/* Budget & Bidding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Budget & Bidding
          </CardTitle>
          <CardDescription>
            Set your total budget and maximum cost per thousand impressions
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Total Budget"
            type="number"
            prefix="$"
            placeholder="10000"
            hint="Min: $100 | Max: $1,000,000"
            error={errors.budget?.message}
            {...register("budget", { valueAsNumber: true })}
          />
          <Input
            label="Max Bid CPM"
            type="number"
            prefix="$"
            placeholder="2.50"
            hint="Cost per 1,000 impressions"
            error={errors.maxBidCpm?.message}
            step="0.01"
            {...register("maxBidCpm", { valueAsNumber: true })}
          />
        </CardContent>
      </Card>

      {/* Demographic Targeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Demographic Targeting
          </CardTitle>
          <CardDescription>
            Select the age groups and genders you want to target
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Controller
            name="targetAgeGroups"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Target Age Groups"
                options={AGE_GROUP_OPTIONS}
                selected={field.value}
                onChange={field.onChange}
                error={errors.targetAgeGroups?.message}
                columns={3}
              />
            )}
          />
          <Controller
            name="targetGenders"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Target Genders"
                options={GENDER_OPTIONS}
                selected={field.value}
                onChange={field.onChange}
                error={errors.targetGenders?.message}
                columns={3}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Device Targeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Device Targeting
          </CardTitle>
          <CardDescription>
            Choose which device types to show your ads on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="deviceTypes"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={DEVICE_OPTIONS}
                selected={field.value}
                onChange={field.onChange}
                error={errors.deviceTypes?.message}
                columns={3}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Ad Topic & Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Content Targeting
          </CardTitle>
          <CardDescription>
            Select your ad topic and add relevant search keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Controller
            name="adTopic"
            control={control}
            render={({ field }) => (
              <Select
                label="Ad Topic"
                options={AD_TOPIC_OPTIONS}
                error={errors.adTopic?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="searchTags"
            control={control}
            render={({ field }) => (
              <TagInput
                label="Search Tags / Keywords"
                tags={field.value}
                onChange={field.onChange}
                placeholder="Add keywords (press Enter)"
                hint="Add 1-20 keywords that describe your product or service"
                error={errors.searchTags?.message}
                maxTags={20}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Card className="bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Ready to optimize your campaign?
              </p>
              <p className="text-sm text-muted-foreground">
                Our AI will analyze demographics and allocate budget efficiently
              </p>
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Analyzing..." : "Get Predictions"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
