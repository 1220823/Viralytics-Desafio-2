"use client";

import { Lightbulb, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface RecommendationsCardProps {
  recommendations: string[];
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  if (recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{rec}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
