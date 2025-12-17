"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { BudgetAllocation, SegmentPrediction } from "@/types/prediction";

interface BudgetAllocationChartProps {
  allocations: BudgetAllocation[];
  predictions: SegmentPrediction[];
}

const COLORS = [
  "#1565C0", // primary blue
  "#2E7D32", // success green
  "#00897B", // teal
  "#EF6C00", // orange
  "#7B1FA2", // purple
  "#C62828", // red
  "#00838F", // cyan
  "#6A1B9A", // deep purple
];

export function BudgetAllocationChart({
  allocations,
  predictions,
}: BudgetAllocationChartProps) {
  // Create chart data by matching allocations with segment info
  const chartData = allocations
    .map((allocation) => {
      const segment = predictions.find(
        (p) => p.segmentId === allocation.segmentId
      );
      if (!segment) return null;

      return {
        name: `${segment.ageGroup} / ${segment.gender} / ${segment.deviceType}`,
        value: allocation.allocatedBudget,
        percentage: allocation.percentageOfTotal,
      };
    })
    .filter((item): item is { name: string; value: number; percentage: number } => item !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ payload }) => `${(payload as { percentage: number })?.percentage || 0}%`}
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value) || 0)}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
