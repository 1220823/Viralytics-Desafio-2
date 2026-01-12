import json
from datetime import date, datetime
import random
from typing import List, Literal, Optional
from models import Campaign, Ad, AllMarketingData, OptimizationRequest 
from pydantic.dataclasses import dataclass
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import the main orchestration function from genetic_algorithm_core
from geneticAlgorithm import Individual, run_genetic_optimization

# --- 2. Data Storage (in-memory, loaded from JSON) ---
campaigns_db: List[Campaign] = []
ads_db: List[Ad] = []

def load_data_from_json():
    """Loads campaign and ad data from JSON files into the in-memory databases."""
    global campaigns_db, ads_db
    
    # Load Campaigns
    try:
        with open('DB/campaigns.json', 'r') as lc:
            raw_campaigns = json.load(lc)
            campaigns_db = [Campaign(**c) for c in raw_campaigns]
        print(f"Loaded {len(campaigns_db)} campaigns successfully.")
    except FileNotFoundError:
        print("Error: campaigns.json not found. Please generate it first.")
    except Exception as e:
        print(f"Error loading campaigns.json: {e}")

    # Load Ads
    try:
        with open('DB/ads.json', 'r') as la:
            raw_ads = json.load(la)
            ads_db = [Ad(**a) for a in raw_ads]
        print(f"Loaded {len(ads_db)} ads successfully.")
    except FileNotFoundError:
        print("Error: ads.json not found. Please generate it first.")
    except Exception as e:
        print(f"Error loading ads.json: {e}")

# Load data immediately when the application starts
load_data_from_json()

# --- 3. Initialize FastAPI App ---
app = FastAPI(
    title="Marketing Data API",
    description="A simple API to retrieve campaign and advertisement data.",
    version="1.0.0",
)

# --- Add CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- 4. API Endpoints ---

@app.get("/", tags=["Root"])
async def read_root():
    """Welcome message for the API."""
    return {"message": "Welcome to the Marketing Data API!"}

@app.get("/campaigns", response_model=List[Campaign], tags=["Campaigns"])
async def get_all_campaigns():
    """Retrieve a list of all marketing campaigns."""
    return campaigns_db

@app.get("/campaigns/{campaign_id}", response_model=Campaign, tags=["Campaigns"])
async def get_campaign_by_id(campaign_id: int):
    """Retrieve a single marketing campaign by its ID."""
    campaign = next((c for c in campaigns_db if c.id == campaign_id), None)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@app.get("/ads", response_model=List[Ad], tags=["Ads"])
async def get_all_ads():
    """Retrieve a list of all advertisements."""
    return ads_db

@app.get("/ads/{ad_id}", response_model=Ad, tags=["Ads"])
async def get_ad_by_id(ad_id: int):
    """Retrieve a single advertisement by its ID."""
    ad = next((a for a in ads_db if a.id == ad_id), None)
    if ad is None:
        raise HTTPException(status_code=404, detail="Ad not found")
    return ad

@app.get("/allData", response_model=AllMarketingData, tags=["Combined Data"])
async def get_all_data():
    """Retrieve all campaigns and all ads in a single response."""
    return AllMarketingData(campaigns=campaigns_db, ads=ads_db)

@app.post("/campaigns/predict_overcosts", response_model=List[Campaign], tags=["Prediction"])
async def predict_campaign_overcosts_endpoint(campaigns: List[Campaign]):
    """
    Receives a list of campaigns and returns them with predicted overcost values.
    """
    return predict_campaign_overcosts(campaigns)

@app.post("/ads/predict_conversion_rates", response_model=List[Ad], tags=["Prediction"])
async def predict_ads_conversion_rates_endpoint(ads: List[Ad]):
    """
    Receives a list of ads and returns them with predicted conversion rates.
    """
    return predict_ads_conversion_rates(ads)

@app.post("/optimize_marketing_allocation", response_model=Optional[Individual], tags=["Optimization"])
async def optimize_marketing_allocation(request: OptimizationRequest):
    """
    Receives campaign and ad data and runs a Genetic Algorithm to find an optimal allocation.
    The GA internally handles predicting overcosts and conversion rates based on its logic.
    """
    if not request.campaigns or not request.ads:
        raise HTTPException(status_code=400, detail="Campaigns and Ads lists cannot be empty.")
    
    # Validate total_budget against sum of approved budgets
    total_approved_budgets = sum(campaign.approved_budget for campaign in request.campaigns)
    if request.total_budget < total_approved_budgets:
        raise HTTPException(
            status_code=400, 
            detail=f"Total budget (${request.total_budget:,.2f}) is less than the sum of approved budgets (${total_approved_budgets:,.2f}). Please increase the total budget to at least ${total_approved_budgets:,.2f}."
        )
    
    predicted_ads = predict_ads_conversion_rates(request.ads)
    predicted_campaigns = predict_campaign_overcosts(request.campaigns)

    try:
        best_solution = run_genetic_optimization(
        campaigns=predicted_campaigns,
        ads=predicted_ads,
        population_size=request.population_size,
        max_generations=request.max_generations,
        mutation_rate=request.mutation_rate,
        crossover_rate=request.crossover_rate,
        total_budget=request.total_budget,
        risk_factor=request.risk_factor,
        verbose=request.ga_verbose 
    )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if best_solution is None:
        raise HTTPException(status_code=500, detail="Genetic Algorithm failed to find a solution or encountered an internal error.")

    return best_solution

# --- 5. Prediction Logic ---
def predict_campaign_overcosts(campaigns: List[Campaign]) -> List[Campaign]:
    """Generates random overcost values for a list of campaigns."""
    for campaign in campaigns:
        campaign.overcost = round(random.uniform(-7000.0, 7000.0), 4)
    return campaigns

def predict_ads_conversion_rates(ads: List[Ad]) -> List[Ad]:
    """Generates random conversion rates for a list of ads."""
    for ad in ads:
        ad.conversion_rate = round(random.uniform(0.1, 0.4), 4)
    return ads