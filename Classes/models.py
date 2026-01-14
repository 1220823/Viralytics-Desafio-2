# models.py
from datetime import date, datetime
from typing import List, Literal
from pydantic.dataclasses import dataclass

@dataclass
class Campaign:
    """Represents a marketing campaign."""
    id: int
    name: str
    no_of_days: int
    time: date
    approved_budget: float
    impressions: int
    clicks: int
    media_cost_usd: float
    ext_service_name: Literal['Facebook Ads', 'DV360', 'Google Ads']
    channel_name: Literal['Mobile', 'Social', 'Video', 'Display', 'Search']
    search_tag_cat: Literal['Youtube', 'Inmarket', 'Retargeting']
    overcost: float 

@dataclass
class Ad:
    """Represents an individual advertisement."""
    id: int
    name: str
    click_through_rate: float
    view_time: int
    cost_per_click: float
    roi: float 
    timestamp: datetime
    age_group: Literal['18-24', '25-34', '35-44', '45-54', '55+']
    engagement_level: Literal['Ignored', 'Liked', 'Commented', 'Shared']
    device_type: Literal['Tablet', 'Desktop', 'Mobile']
    location: Literal['UK', 'Germany', 'India', 'USA', 'Canada']
    gender: Literal['Male', 'Female']
    content_type: Literal['Image', 'Text', 'Video']
    ad_topic: Literal['Health', 'Electronics', 'Fashion', 'Travel', 'Automotive']
    ad_target_audience: Literal[
        'Young Adults', 'Family Oriented', 'Travel Lovers', 'Fitness Lovers',
        'Tech Enthusiasts', 'Health Conscious', 'Wellness Seekers', 'Busy Professionals'
    ]
    conversion_rate: float 

@dataclass
class AllMarketingData:
    """Represents a combined response of all campaigns and ads."""
    campaigns: List[Campaign]
    ads: List[Ad]

@dataclass
class OptimizationRequest:
    campaigns: List[Campaign]
    ads: List[Ad]
    total_budget: float
    population_size: int = 100
    max_generations: int = 250
    mutation_rate: float = 0.15
    crossover_rate: float = 0.85
    risk_factor: float = 0.0
    ga_verbose: bool = True