"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  Users,
  MousePointerClick,
  DollarSign,
  PieChart,
  BarChart3,
  Table,
  ArrowLeft,
  Loader2,
  FileQuestion,
} from "lucide-react";

import type { PredictionResponse } from "@/types/prediction";
import type { CampaignInput } from "@/types/campaign";
import { generateMockPredictions } from "@/lib/mock/predictions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Button,
  Badge,
} from "@/components/ui";
import { BudgetAllocationChart } from "./BudgetAllocationChart";
import { ROIBySegmentChart } from "./ROIBySegmentChart";
import { SegmentTable } from "./SegmentTable";
import { RecommendationsCard } from "./RecommendationsCard";

export function ResultsDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoCampaign, setHasNoCampaign] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignInput | null>(null);
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    // Get campaign data from sessionStorage
    const stored = sessionStorage.getItem("campaignData");
    if (!stored) {
      setHasNoCampaign(true);
      setIsLoading(false);
      return;
    }

    const data = JSON.parse(stored) as CampaignInput;
    setCampaignData(data);

    // Simulate API call delay
    const timer = setTimeout(() => {
      const results = generateMockPredictions(data);
      setPredictions(results);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  // Empty state when no campaign has been created
  if (hasNoCampaign) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <FileQuestion className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Campaign Data
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Create a campaign first to see AI-powered predictions and budget optimization results.
        </p>
        <Button onClick={() => router.push("/")}>
          Create Campaign
        </Button>
      </div>
    );
  }

  if (isLoading || !predictions || !campaignData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium text-foreground">Analyzing your campaign...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Running demographic predictions and budget optimization
        </p>
      </div>
    );
  }

  const { summary, predictions: segments, budgetAllocation } = predictions;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const getRoiBadgeVariant = (level: string) => {
    switch (level) {
      case "very_high":
        return "success";
      case "high":
        return "primary";
      case "medium":
        return "warning";
      default:
        return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Form
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {campaignData.campaignName || "Campaign"} Results
          </h1>
          <p className="text-muted-foreground mt-1">
            Budget: {formatCurrency(campaignData.budget)} • CPM: {formatCurrency(campaignData.maxBidCpm)}
          </p>
        </div>
        <Badge
          variant={getRoiBadgeVariant(summary.overallRoi)}
          size="md"
          className="self-start sm:self-center"
        >
          {summary.overallRoi.replace("_", " ").toUpperCase()} ROI POTENTIAL
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Optimization Score"
          value={summary.optimizationScore}
          suffix="/100"
          icon={<Target className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          title="Estimated Reach"
          value={summary.estimatedTotalReach}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Expected Clicks"
          value={summary.estimatedTotalClicks}
          icon={<MousePointerClick className="w-5 h-5" />}
        />
        <StatCard
          title="Average CTR"
          value={summary.averageCtr}
          suffix="%"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Budget Allocation
            </CardTitle>
            <CardDescription>
              AI-optimized distribution across segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetAllocationChart
              allocations={budgetAllocation}
              predictions={segments}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              ROI by Segment
            </CardTitle>
            <CardDescription>
              Predicted performance by demographic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ROIBySegmentChart predictions={segments} />
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <RecommendationsCard recommendations={summary.recommendations} />

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            Segment Details
          </CardTitle>
          <CardDescription>
            Click column headers to sort • Top performing segment:{" "}
            <span className="font-medium text-foreground">
              {summary.topPerformingSegment}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SegmentTable predictions={segments} allocations={budgetAllocation} />
        </CardContent>
      </Card>

      {/* Action Footer */}
      <Card className="bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Expected {summary.estimatedTotalConversions.toLocaleString()} conversions
              </p>
              <p className="text-sm text-muted-foreground">
                Based on {segments.length} optimized demographic segments
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              Modify Campaign
            </Button>
            <Button variant="success">
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
