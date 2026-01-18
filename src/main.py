import json
from datetime import date, datetime
import random
import time
from typing import List, Literal, Optional, Dict, Any
from src.Classes.models import Campaign, Ad, AllMarketingData, OptimizationRequest
from pydantic import BaseModel
from pydantic.dataclasses import dataclass
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

# Import the main orchestration function from genetic_algorithm_core
from src.Genetic_Algorithm.geneticAlgorithm import Individual, run_genetic_optimization

# Import the tabu search orchestration function
from src.Tabu_Search_Algorithm.tabuSearchAlgorithm import run_tabu_search_optimization

# --- 2. Data Storage (in-memory, loaded from JSON) ---
campaigns_db: List[Campaign] = []
ads_db: List[Ad] = []

from src.Predictors.AdsPredictor import predict_ads_conversion_rates_ml 
from src.Predictors.CampaignsPredictor import predict_campaigns_overcosts_ml

def load_data_from_json():
    """Loads campaign and ad data from JSON files into the in-memory databases."""
    global campaigns_db, ads_db
    
    # Load Campaigns
    try:
        with open('src/DB/campaigns.json', 'r') as lc:
            raw_campaigns = json.load(lc)
            campaigns_db = [Campaign(**c) for c in raw_campaigns]
        print(f"Loaded {len(campaigns_db)} campaigns successfully.")
    except FileNotFoundError:
        print("Error: campaigns.json not found. Please generate it first.")
    except Exception as e:
        print(f"Error loading campaigns.json: {e}")

    # Load Ads
    try:
        with open('src/DB/ads.json', 'r') as la:
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
    #return predict_ads_conversion_rates_ml(ads)

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
    #for campaign in campaigns:
        #campaign.overcost = round(random.uniform(-7000.0, 7000.0), 4)
        # campaign.overcost = 7000.0
    campaigns = predict_campaigns_overcosts_ml(campaigns)
    return campaigns

def predict_ads_conversion_rates(ads: List[Ad]) -> List[Ad]:
    # """Generates random conversion rates for a list of ads."""
    #for ad in ads:
         #ad.conversion_rate = round(random.uniform(0.1, 0.2), 4)
          #ad.conversion_rate = 0.2
    ads = predict_ads_conversion_rates_ml(ads)
    return ads
    

# --- 6. Additional Request Models ---
class TabuSearchRequest(BaseModel):
    """Request model for Tabu Search optimization"""
    campaigns: List[Campaign]
    ads: List[Ad]
    max_iterations: int = 200
    tabu_tenure: int = 10
    neighborhood_size: int = 30
    total_budget: float
    risk_factor: float = 0.0
    use_aspiration: bool = True
    intensification_threshold: int = 50
    diversification_threshold: int = 100
    ts_verbose: bool = True


class ComparisonRequest(BaseModel):
    """Request model for comparing GA and Tabu Search"""
    campaigns: List[Campaign]
    ads: List[Ad]
    total_budget: float
    risk_factor: float = 0.0
    
    # GA parameters
    population_size: int = 100
    max_generations: int = 200
    mutation_rate: float = 0.2
    crossover_rate: float = 0.8
    ga_verbose: bool = True
    
    # Tabu Search parameters
    max_iterations: int = 200
    tabu_tenure: int = 10
    neighborhood_size: int = 30
    use_aspiration: bool = True
    intensification_threshold: int = 50
    diversification_threshold: int = 100
    ts_verbose: bool = True


class AlgorithmComparison(BaseModel):
    """Response model for algorithm comparison"""
    ga_result: Optional[Dict[str, Any]]
    ts_result: Optional[Dict[str, Any]]
    comparison: Dict[str, Any]
    winner: str


# --- 7. New Optimization Endpoints ---

def optimize_tabu_core(request, predicted_ads, predicted_campaigns):
    best_solution = run_tabu_search_optimization(
        campaigns=predicted_campaigns,
        ads=predicted_ads,
        max_iterations=request.max_iterations,
        tabu_tenure=request.tabu_tenure,
        neighborhood_size=request.neighborhood_size,
        total_budget=request.total_budget,
        risk_factor=request.risk_factor,
        use_aspiration=request.use_aspiration,
        intensification_threshold=request.intensification_threshold,
        diversification_threshold=request.diversification_threshold,
        verbose=request.ts_verbose
    )

    return best_solution

import random

def random_tabu_params():
    return {
        "max_iterations": random.randint(50, 300),
        "tabu_tenure": random.randint(5, 30),
        "neighborhood_size": random.randint(10, 100),
        "total_budget": random.randint(50_000_000, 200_000_000),
        "risk_factor": round(random.uniform(0.5, 2.0), 2),
        "use_aspiration": random.choice([True, False]),
        "intensification_threshold": random.randint(20, 100),
        "diversification_threshold": random.randint(50, 200),
        "ts_verbose": False
    }

@app.post("/optimize_tabu_search", response_model=Optional[Individual], tags=["Optimization"])
async def optimize_with_tabu_search(request: TabuSearchRequest):
    if not request.campaigns or not request.ads:
        raise HTTPException(status_code=400, detail="Campaigns and Ads lists cannot be empty.")

    total_approved_budgets = sum(c.approved_budget for c in request.campaigns)
    if request.total_budget < total_approved_budgets:
        raise HTTPException(status_code=400, detail="Total budget too low.")

    try:
        # Predict values
        predicted_ads = predict_ads_conversion_rates(request.ads)
        predicted_campaigns = predict_campaign_overcosts(request.campaigns)
        return optimize_tabu_core(request, predicted_ads, predicted_campaigns)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


import csv
from datetime import datetime
from copy import deepcopy

@app.post("/optimize_tabu_search_experiments", tags=["Optimization"])
async def run_tabu_experiments(request: TabuSearchRequest):
    results = []

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"tabu_experiments_{timestamp}.csv"
    predicted_ads = predict_ads_conversion_rates(request.ads)
    predicted_campaigns = predict_campaign_overcosts(request.campaigns)
    
    for i in range(100):
        print("Running tabu search experiment:", i+1)

        random_params = random_tabu_params()

        experiment_request = deepcopy(request)
        for key, value in random_params.items():
            setattr(experiment_request, key, value)

        try:
            # Predict values
            solution = optimize_tabu_core(experiment_request, predicted_ads, predicted_campaigns)
        except Exception as e:
            solution = None

        row = {
            **random_params,
            "fitness": getattr(solution, "fitness", None),
            "total_roi": getattr(solution, "total_roi", None),
            "total_cost": getattr(solution, "total_cost", None),
            "total_media_cost": getattr(solution, "total_media_cost", None),
            "total_media_revenue": getattr(solution, "total_media_revenue", None),
        }

        results.append(row)

    # Sort results by fitness (descending)
    results.sort(
        key=lambda x: (x["fitness"] is None, x["fitness"]),
        reverse=True
    )

    # Write CSV
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

    return {
        "runs": 100,
        "file": filename,
        "message": "Tabu Search experiments completed successfully"
    }

@app.post("/compare_algorithms", response_model=AlgorithmComparison, tags=["Optimization"])
async def compare_optimization_algorithms(request: ComparisonRequest):
    """
    Runs both Genetic Algorithm and Tabu Search on the same data and returns a comparison.
    """
    if not request.campaigns or not request.ads:
        raise HTTPException(status_code=400, detail="Campaigns and Ads lists cannot be empty.")
    
    # Validate total_budget
    total_approved_budgets = sum(campaign.approved_budget for campaign in request.campaigns)
    if request.total_budget < total_approved_budgets:
        raise HTTPException(
            status_code=400, 
            detail=f"Total budget (${request.total_budget:,.2f}) is less than the sum of approved budgets (${total_approved_budgets:,.2f})."
        )
    
    # Predict values once (use same predictions for both algorithms)
    predicted_ads = predict_ads_conversion_rates(request.ads)
    predicted_campaigns = predict_campaign_overcosts(request.campaigns)
    
    # Initialize results
    ga_result = None
    ts_result = None
    ga_time = 0
    ts_time = 0
    ga_error = None
    ts_error = None
    
    # Run Genetic Algorithm
    print("\n" + "="*70)
    print("RUNNING GENETIC ALGORITHM")
    print("="*70)
    try:
        start_time = time.time()
        ga_solution = run_genetic_optimization(
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
        ga_time = time.time() - start_time
        
        if ga_solution:
            ga_result = {
                "fitness": ga_solution.fitness,
                "total_roi": ga_solution.total_roi,
                "total_cost": ga_solution.total_cost,
                "total_media_revenue": ga_solution.total_media_revenue,
                "total_media_cost": ga_solution.total_media_cost,
                "profit": ga_solution.total_media_revenue - ga_solution.total_media_cost,
                "execution_time_seconds": ga_time,
                "allocation": ga_solution.allocation,
                "campaign_metrics": ga_solution.campaign_metrics
            }
    except Exception as e:
        ga_error = str(e)
        print(f"GA Error: {ga_error}")
    
    # Run Tabu Search
    print("\n" + "="*70)
    print("RUNNING TABU SEARCH")
    print("="*70)
    try:
        start_time = time.time()
        ts_solution = run_tabu_search_optimization(
            campaigns=predicted_campaigns,
            ads=predicted_ads,
            max_iterations=request.max_iterations,
            tabu_tenure=request.tabu_tenure,
            neighborhood_size=request.neighborhood_size,
            total_budget=request.total_budget,
            risk_factor=request.risk_factor,
            use_aspiration=request.use_aspiration,
            intensification_threshold=request.intensification_threshold,
            diversification_threshold=request.diversification_threshold,
            verbose=request.ts_verbose
        )
        ts_time = time.time() - start_time
        
        if ts_solution:
            ts_result = {
                "fitness": ts_solution.fitness,
                "total_roi": ts_solution.total_roi,
                "total_cost": ga_solution.total_cost,
                "total_media_revenue": ga_solution.total_media_revenue,
                "total_media_cost": ga_solution.total_media_cost,
                "profit": ga_solution.total_media_revenue - ga_solution.total_media_cost,
                "execution_time_seconds": ts_time,
                "allocation": ts_solution.allocation,
                "campaign_metrics": ts_solution.campaign_metrics
            }
    except Exception as e:
        ts_error = str(e)
        print(f"Tabu Search Error: {ts_error}")
    
    # Determine winner and create comparison
    if ga_result and ts_result:
        # Compare based on fitness
        if ga_result["fitness"] > ts_result["fitness"]:
            winner = "Genetic Algorithm"
            fitness_diff = ga_result["fitness"] - ts_result["fitness"]
            roi_diff = ga_result["total_roi"] - ts_result["total_roi"]
        elif ts_result["fitness"] > ga_result["fitness"]:
            winner = "Tabu Search"
            fitness_diff = ts_result["fitness"] - ga_result["fitness"]
            roi_diff = ts_result["total_roi"] - ga_result["total_roi"]
        else:
            winner = "Tie"
            fitness_diff = 0
            roi_diff = 0
        
        comparison = {
            "winner": winner,
            "fitness_difference": fitness_diff,
            "roi_difference_percentage": roi_diff,
            "ga_execution_time": ga_time,
            "ts_execution_time": ts_time,
            "time_difference": abs(ga_time - ts_time),
            "faster_algorithm": "Genetic Algorithm" if ga_time < ts_time else "Tabu Search",
            "metrics_comparison": {
                "ga_fitness": ga_result["fitness"],
                "ts_fitness": ts_result["fitness"],
                "ga_roi": ga_result["total_roi"],
                "ts_roi": ts_result["total_roi"],
                "ga_profit": ga_result["profit"],
                "ts_profit": ts_result["profit"]
            }
        }
    elif ga_result:
        winner = "Genetic Algorithm (Tabu Search failed)"
        comparison = {
            "winner": winner,
            "error": f"Tabu Search failed: {ts_error}",
            "ga_execution_time": ga_time
        }
    elif ts_result:
        winner = "Tabu Search (Genetic Algorithm failed)"
        comparison = {
            "winner": winner,
            "error": f"Genetic Algorithm failed: {ga_error}",
            "ts_execution_time": ts_time
        }
    else:
        winner = "Both algorithms failed"
        comparison = {
            "winner": winner,
            "ga_error": ga_error,
            "ts_error": ts_error
        }
    
    print("\n" + "="*70)
    print("COMPARISON SUMMARY")
    print("="*70)
    print(f"Winner: {winner}")
    if ga_result and ts_result:
        print(f"GA Fitness: {ga_result['fitness']:.3f} | TS Fitness: {ts_result['fitness']:.3f}")
        print(f"GA ROI: {ga_result['total_roi']:.2%} | TS ROI: {ts_result['total_roi']:.2%}")
        print(f"GA Time: {ga_time:.2f}s | TS Time: {ts_time:.2f}s")
    print("="*70)
    
    return AlgorithmComparison(
        ga_result=ga_result,
        ts_result=ts_result,
        comparison=comparison,
        winner=winner
    )