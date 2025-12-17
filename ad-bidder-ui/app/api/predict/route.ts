import { NextRequest, NextResponse } from "next/server";
import { campaignSchema } from "@/lib/validations/campaign.schema";
import { toPredictRequest } from "@/types/api";
import { generateMockPredictions } from "@/lib/mock/predictions";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = campaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid campaign data",
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const campaignData = validationResult.data;

    // Use mock data in development or when backend is unavailable
    if (USE_MOCK) {
      const mockPredictions = generateMockPredictions(campaignData);
      return NextResponse.json({
        success: true,
        data: mockPredictions,
      });
    }

    // Transform to Python backend format
    const predictRequest = toPredictRequest(campaignData);

    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BACKEND_ERROR",
            message: errorData.detail || "Failed to get predictions from backend",
          },
        },
        { status: response.status }
      );
    }

    const predictions = await response.json();

    return NextResponse.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error("Prediction API error:", error);

    // Fallback to mock data on error
    if (error instanceof Error && error.message.includes("fetch")) {
      // Network error - backend probably not running
      try {
        const body = await request.clone().json();
        const validationResult = campaignSchema.safeParse(body);
        if (validationResult.success) {
          const mockPredictions = generateMockPredictions(validationResult.data);
          return NextResponse.json({
            success: true,
            data: mockPredictions,
            _note: "Using mock data - backend unavailable",
          });
        }
      } catch {
        // Ignore parse errors in fallback
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
