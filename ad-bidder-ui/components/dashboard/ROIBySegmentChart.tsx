"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SegmentPrediction } from "@/types/prediction";

interface ROIBySegmentChartProps {
  predictions: SegmentPrediction[];
}

export function ROIBySegmentChart({ predictions }: ROIBySegmentChartProps) {
  // Create chart data sorted by ROI score
  const chartData = predictions
    .map((p) => ({
      name: `${p.ageGroup}\n${p.gender}`,
      shortName: p.ageGroup,
      roi: p.roiScore,
      ctr: p.predictedCtr * 100,
      device: p.deviceType,
    }))
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 8);

  const getBarColor = (roi: number) => {
    if (roi >= 80) return "#1B5E20"; // dark green
    if (roi >= 60) return "#2E7D32"; // green
    if (roi >= 40) return "#1565C0"; // blue
    return "#EF6C00"; // orange
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 12 }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            formatter={(value, name) => {
              if (name === "roi") return [`${value}`, "ROI Score"];
              return [String(value), String(name)];
            }}
            labelFormatter={(label) => `Age Group: ${label}`}
          />
          <Bar dataKey="roi" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.roi)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
