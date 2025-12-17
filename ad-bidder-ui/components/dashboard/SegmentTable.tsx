"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SegmentPrediction, BudgetAllocation } from "@/types/prediction";
import { Badge } from "@/components/ui";

interface SegmentTableProps {
  predictions: SegmentPrediction[];
  allocations: BudgetAllocation[];
}

type SortKey = "segment" | "ctr" | "roi" | "reach" | "budget";
type SortDirection = "asc" | "desc";

export function SegmentTable({ predictions, allocations }: SegmentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("roi");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Combine predictions with allocations
  const tableData = predictions.map((p) => {
    const allocation = allocations.find((a) => a.segmentId === p.segmentId);
    return {
      ...p,
      allocatedBudget: allocation?.allocatedBudget || 0,
      expectedClicks: allocation?.expectedClicks || 0,
    };
  });

  // Sort data
  const sortedData = [...tableData].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case "segment":
        comparison = `${a.ageGroup}${a.gender}${a.deviceType}`.localeCompare(
          `${b.ageGroup}${b.gender}${b.deviceType}`
        );
        break;
      case "ctr":
        comparison = a.predictedCtr - b.predictedCtr;
        break;
      case "roi":
        comparison = a.roiScore - b.roiScore;
        break;
      case "reach":
        comparison = a.estimatedReach - b.estimatedReach;
        break;
      case "budget":
        comparison = a.allocatedBudget - b.allocatedBudget;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortHeader = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {sortKey === sortKeyName ? (
        sortDirection === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-card-border">
            <th className="text-left py-3 px-4">
              <SortHeader label="Segment" sortKeyName="segment" />
            </th>
            <th className="text-right py-3 px-4">
              <SortHeader label="CTR" sortKeyName="ctr" />
            </th>
            <th className="text-right py-3 px-4">
              <SortHeader label="ROI Score" sortKeyName="roi" />
            </th>
            <th className="text-right py-3 px-4">
              <SortHeader label="Est. Reach" sortKeyName="reach" />
            </th>
            <th className="text-right py-3 px-4">
              <SortHeader label="Budget" sortKeyName="budget" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row.segmentId}
              className="border-b border-card-border/50 hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {row.ageGroup} / {row.gender}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {row.deviceType}
                  </span>
                </div>
              </td>
              <td className="text-right py-3 px-4">
                <span className="font-mono text-sm">
                  {(row.predictedCtr * 100).toFixed(2)}%
                </span>
              </td>
              <td className="text-right py-3 px-4">
                <Badge variant={getRoiBadgeVariant(row.roiLevel)} size="md">
                  {row.roiScore}
                </Badge>
              </td>
              <td className="text-right py-3 px-4">
                <span className="font-mono text-sm">
                  {row.estimatedReach.toLocaleString()}
                </span>
              </td>
              <td className="text-right py-3 px-4">
                <span className="font-mono text-sm font-medium">
                  {formatCurrency(row.allocatedBudget)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
