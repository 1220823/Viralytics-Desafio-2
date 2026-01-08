from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import OptimizationRequest, OptimizationResponse, OptimizationResult

app = FastAPI(
    title="Ad-Bidder API",
    description="Demographic & Budget Optimization Engine",
    version="1.0.0"
)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint to verify API is running"""
    return {"status": "ok", "message": "Ad-Bidder API is running"}


@app.post("/optimize", response_model=OptimizationResponse)
def optimize(request: OptimizationRequest):
    """
    Optimize ad-campaign combinations for maximum ROI.
    Currently returns dummy data for testing.
    Will be replaced with actual ML model + genetic algorithm.
    """
    # Dummy response for testing connection
    dummy_results = []

    for i, campaign in enumerate(request.campaigns):
        dummy_results.append(
            OptimizationResult(
                campaign_name=campaign.service_name,
                matched_ads=[f"Ad {j+1}" for j in range(min(3, len(request.ads)))],
                predicted_conversion_rate=0.15 + (i * 0.02),
                estimated_cost=campaign.approved_budget * 0.8,
                expected_roi=1.25 + (i * 0.1)
            )
        )

    return OptimizationResponse(
        total_roi=sum(r.expected_roi for r in dummy_results) / len(dummy_results) if dummy_results else 0,
        total_budget_allocated=request.budget * 0.85,
        average_conversion_rate=0.18,
        results=dummy_results
    )
