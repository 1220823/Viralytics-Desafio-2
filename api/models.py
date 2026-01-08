from pydantic import BaseModel
from typing import List, Optional


class Campaign(BaseModel):
    service_name: str
    approved_budget: float
    no_of_days: int
    time: str
    channel_name: str
    search_tag_cat: str


class Ad(BaseModel):
    device_type: str
    location: str
    age_group: str
    gender: str
    content_type: str
    ad_topic: str
    ad_target_audience: str
    cost_per_click: float


class OptimizationRequest(BaseModel):
    campaigns: List[Campaign]
    ads: List[Ad]
    budget: float


class OptimizationResult(BaseModel):
    campaign_name: str
    matched_ads: List[str]
    predicted_conversion_rate: float
    estimated_cost: float
    expected_roi: float


class OptimizationResponse(BaseModel):
    total_roi: float
    total_budget_allocated: float
    average_conversion_rate: float
    results: List[OptimizationResult]
