import type { PredictionResponse, SegmentPrediction, BudgetAllocation } from "@/types/prediction";
import type { CampaignInput, AgeGroup, Gender, DeviceType } from "@/types/campaign";

// Generate mock predictions based on campaign input
export function generateMockPredictions(input: CampaignInput): PredictionResponse {
  const segments: SegmentPrediction[] = [];
  const allocations: BudgetAllocation[] = [];

  let segmentIndex = 0;
  const totalCombinations =
    input.targetAgeGroups.length *
    input.targetGenders.length *
    input.deviceTypes.length;

  // Generate predictions for each demographic combination
  for (const ageGroup of input.targetAgeGroups) {
    for (const gender of input.targetGenders) {
      for (const device of input.deviceTypes) {
        const segmentId = `seg_${segmentIndex}`;

        // Generate realistic-looking metrics
        const baseCtr = getBaseCtr(input.adTopic);
        const ageMultiplier = getAgeMultiplier(ageGroup);
        const deviceMultiplier = getDeviceMultiplier(device);

        const predictedCtr = Math.min(0.15, baseCtr * ageMultiplier * deviceMultiplier * (0.8 + Math.random() * 0.4));
        const predictedConversionRate = predictedCtr * (0.05 + Math.random() * 0.1);
        const roiScore = Math.round(50 + (predictedCtr * 100 + predictedConversionRate * 500) * (0.7 + Math.random() * 0.6));

        const segment: SegmentPrediction = {
          segmentId,
          ageGroup: ageGroup as AgeGroup,
          gender: gender as Gender,
          deviceType: device as DeviceType,
          predictedCtr: Math.round(predictedCtr * 10000) / 10000,
          predictedConversionRate: Math.round(predictedConversionRate * 10000) / 10000,
          estimatedReach: Math.round((input.budget / input.maxBidCpm) * 1000 * (1 / totalCombinations) * (0.7 + Math.random() * 0.6)),
          estimatedCost: Math.round(input.budget / totalCombinations),
          roiScore: Math.min(100, roiScore),
          roiLevel: roiScore >= 80 ? "very_high" : roiScore >= 60 ? "high" : roiScore >= 40 ? "medium" : "low",
        };

        segments.push(segment);
        segmentIndex++;
      }
    }
  }

  // Sort by ROI score and allocate budget using "knapsack-like" optimization
  const sortedSegments = [...segments].sort((a, b) => b.roiScore - a.roiScore);
  let remainingBudget = input.budget;

  for (const segment of sortedSegments) {
    // Allocate more to higher-performing segments
    const baseAllocation = input.budget / segments.length;
    const performanceBonus = segment.roiScore / 100;
    let allocatedBudget = Math.round(baseAllocation * (0.5 + performanceBonus));

    // Don't exceed remaining budget
    allocatedBudget = Math.min(allocatedBudget, remainingBudget);
    remainingBudget -= allocatedBudget;

    const impressions = Math.round((allocatedBudget / input.maxBidCpm) * 1000);

    allocations.push({
      segmentId: segment.segmentId,
      allocatedBudget,
      percentageOfTotal: Math.round((allocatedBudget / input.budget) * 1000) / 10,
      expectedImpressions: impressions,
      expectedClicks: Math.round(impressions * segment.predictedCtr),
      expectedConversions: Math.round(impressions * segment.predictedCtr * segment.predictedConversionRate),
    });
  }

  // Distribute any remaining budget to top performers
  if (remainingBudget > 0 && allocations.length > 0) {
    allocations[0].allocatedBudget += remainingBudget;
    allocations[0].percentageOfTotal = Math.round((allocations[0].allocatedBudget / input.budget) * 1000) / 10;
  }

  // Calculate summary
  const totalReach = segments.reduce((sum, s) => sum + s.estimatedReach, 0);
  const avgCtr = segments.reduce((sum, s) => sum + s.predictedCtr, 0) / segments.length;
  const totalClicks = allocations.reduce((sum, a) => sum + a.expectedClicks, 0);
  const totalConversions = allocations.reduce((sum, a) => sum + a.expectedConversions, 0);
  const avgRoi = segments.reduce((sum, s) => sum + s.roiScore, 0) / segments.length;

  const topSegment = sortedSegments[0];
  const topSegmentLabel = `${topSegment.ageGroup} ${topSegment.gender} on ${topSegment.deviceType}`;

  return {
    success: true,
    campaignId: `camp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    predictions: segments,
    budgetAllocation: allocations,
    summary: {
      overallRoi: avgRoi >= 70 ? "very_high" : avgRoi >= 55 ? "high" : avgRoi >= 40 ? "medium" : "low",
      optimizationScore: Math.round(avgRoi),
      estimatedTotalReach: totalReach,
      estimatedTotalClicks: totalClicks,
      estimatedTotalConversions: totalConversions,
      averageCtr: Math.round(avgCtr * 10000) / 100,
      averageCpm: input.maxBidCpm,
      topPerformingSegment: topSegmentLabel,
      recommendations: generateRecommendations(segments, input),
    },
  };
}

function getBaseCtr(topic: string): number {
  const ctrByTopic: Record<string, number> = {
    technology: 0.035,
    finance: 0.028,
    healthcare: 0.032,
    education: 0.038,
    entertainment: 0.045,
    travel: 0.042,
    food: 0.04,
    fashion: 0.038,
    sports: 0.041,
    automotive: 0.03,
  };
  return ctrByTopic[topic] || 0.035;
}

function getAgeMultiplier(ageGroup: string): number {
  const multipliers: Record<string, number> = {
    "18-24": 1.2,
    "25-34": 1.15,
    "35-44": 1.0,
    "45-54": 0.9,
    "55+": 0.85,
  };
  return multipliers[ageGroup] || 1.0;
}

function getDeviceMultiplier(device: string): number {
  const multipliers: Record<string, number> = {
    mobile: 1.1,
    desktop: 0.95,
    tablet: 0.9,
  };
  return multipliers[device] || 1.0;
}

function generateRecommendations(segments: SegmentPrediction[], input: CampaignInput): string[] {
  const recommendations: string[] = [];

  // Find best and worst segments
  const sorted = [...segments].sort((a, b) => b.roiScore - a.roiScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  recommendations.push(
    `Focus on ${best.ageGroup} ${best.gender} users on ${best.deviceType} - highest predicted ROI`
  );

  if (worst.roiScore < 40 && segments.length > 3) {
    recommendations.push(
      `Consider removing ${worst.ageGroup} ${worst.gender} on ${worst.deviceType} - low predicted performance`
    );
  }

  if (!input.deviceTypes.includes("mobile")) {
    recommendations.push("Consider adding mobile targeting - typically has higher engagement");
  }

  if (input.searchTags.length < 5) {
    recommendations.push("Add more search keywords to improve targeting precision");
  }

  if (input.budget > 50000 && segments.length < 5) {
    recommendations.push("With your budget, consider expanding to more demographic segments");
  }

  return recommendations.slice(0, 4);
}
