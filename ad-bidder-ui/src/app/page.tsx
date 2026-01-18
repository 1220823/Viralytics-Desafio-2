"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CampaignSection from "@/components/CampaignSection";
import AdSection from "@/components/AdSection";
import LoadModal from "@/components/LoadModal";
import { Campaign, Ad, DEFAULT_CAMPAIGN, DEFAULT_AD, OptimizationResponse, AlgorithmComparison } from "@/types";

let keyCounter = 0;

function generateUniqueKey(prefix: string) {
  return `${prefix}-${Date.now()}-${keyCounter++}`;
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [gaResults, setGaResults] = useState<OptimizationResponse | null>(null);
  const [tsResults, setTsResults] = useState<OptimizationResponse | null>(null);

  // Load modal state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [loadedCampaigns, setLoadedCampaigns] = useState<Campaign[]>([]);
  const [loadedAds, setLoadedAds] = useState<Ad[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(false);

  // Advanced parameters state - Genetic Algorithm
  const [populationSize, setPopulationSize] = useState(100);
  const [maxGenerations, setMaxGenerations] = useState(250);
  const [mutationRate, setMutationRate] = useState(0.15);
  const [crossoverRate, setCrossoverRate] = useState(0.85);
  const [riskFactor, setRiskFactor] = useState(1.0);
  const [totalBudgetOverride, setTotalBudgetOverride] = useState<number | null>(null);

  // Advanced parameters state - Tabu Search
  const [maxIterations, setMaxIterations] = useState(200);
  const [tabuTenure, setTabuTenure] = useState(10);
  const [neighborhoodSize, setNeighborhoodSize] = useState(30);
  const [useAspiration, setUseAspiration] = useState(true);
  const [intensificationThreshold, setIntensificationThreshold] = useState(50);
  const [diversificationThreshold, setDiversificationThreshold] = useState(100);

  // Tab and optimization state
  const [activeTab, setActiveTab] = useState<'ga' | 'ts' | 'compare'>('ga');
  const [runningAlgorithm, setRunningAlgorithm] = useState<'ga' | 'ts' | 'compare' | null>(null);
  const [comparisonResults, setComparisonResults] = useState<AlgorithmComparison | null>(null);

  // Results sub-tab state
  const [activeResultsTab, setActiveResultsTab] = useState<'ga' | 'ts' | 'compare'>('ga');

  // Calculate minimum budget from campaigns
  const minBudget = campaigns.reduce((sum, c) => sum + c.approved_budget, 0);
  const effectiveBudget = totalBudgetOverride !== null ? totalBudgetOverride : minBudget;

  // Helper functions for results display
  // Results use sequential IDs (1, 2, 3...) that we assign before sending
  // Map API ID to the campaign/ad at that index
  const getCampaignByApiId = (apiId: number): Campaign | undefined => {
    return campaigns[apiId - 1]; // API IDs are 1-indexed
  };

  const getAdByApiId = (apiId: number): Ad | undefined => {
    return ads[apiId - 1]; // API IDs are 1-indexed
  };

  const getAdKey = (apiId: number): string | undefined => {
    return ads[apiId - 1]?._key; // Return the _key of the ad for scrolling
  };

  const scrollToAd = (adKey: string) => {
    const element = document.getElementById(`ad-${adKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      element.classList.add('ring-2', 'ring-[#4A90A4]', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-[#4A90A4]', 'ring-offset-2');
      }, 2000);
    }
  };

  const addCampaign = () => {
    setCampaigns([...campaigns, {
      ...DEFAULT_CAMPAIGN,
      _key: generateUniqueKey('campaign'),
      name: `Campaign ${campaigns.length + 1}`,
      time: new Date().toISOString().split('T')[0],
      overcost: 0
    }]);
  };

  const removeCampaign = (key: string) => {
    setCampaigns(campaigns.filter((c) => c._key !== key));
  };

  const updateCampaign = (key: string, updates: Partial<Campaign>) => {
    setCampaigns(
      campaigns.map((c) => (c._key === key ? { ...c, ...updates } : c))
    );
  };

  const addAd = () => {
    setAds([...ads, {
      ...DEFAULT_AD,
      _key: generateUniqueKey('ad'),
      name: `Ad ${ads.length + 1}`,
      timestamp: new Date().toISOString(),
      conversion_rate: 0
    }]);
  };

  const removeAd = (key: string) => {
    setAds(ads.filter((a) => a._key !== key));
  };

  const updateAd = (key: string, updates: Partial<Ad>) => {
    setAds(ads.map((a) => (a._key === key ? { ...a, ...updates } : a)));
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch("http://localhost:8000/");
      const data = await response.json();
      console.log("API Root:", data);
    } catch (error) {
      console.error("API check failed:", error);
    }
  };

  const testMockData = async () => {
    try {
      const response = await fetch("http://localhost:8000/allData");
      const data = await response.json();
      console.log("All Data from API:", data);
    } catch (error) {
      console.error("Data fetch failed:", error);
    }
  };

  const openLoadCampaignModal = async () => {
    setShowCampaignModal(true);
    setIsLoadingCampaigns(true);
    try {
      const response = await fetch("http://localhost:8000/campaigns");
      const data = await response.json();
      setLoadedCampaigns(data);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
      setLoadedCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const openLoadAdModal = async () => {
    setShowAdModal(true);
    setIsLoadingAds(true);
    try {
      const response = await fetch("http://localhost:8000/ads");
      const data = await response.json();
      setLoadedAds(data);
    } catch (error) {
      console.error("Failed to load ads:", error);
      setLoadedAds([]);
    } finally {
      setIsLoadingAds(false);
    }
  };

  const handleSelectCampaign = (item: Campaign | Ad) => {
    const campaign = item as Campaign;
    // Keep the original ID from the API, add unique _key, ensure overcost field exists
    setCampaigns([...campaigns, {
      ...campaign,
      _key: generateUniqueKey('campaign'),
      overcost: campaign.overcost ?? 0
    }]);
    setShowCampaignModal(false);
  };

  const handleSelectAd = (item: Campaign | Ad) => {
    const ad = item as Ad;
    // Keep the original ID from the API, add unique _key, ensure conversion_rate field exists
    setAds([...ads, {
      ...ad,
      _key: generateUniqueKey('ad'),
      conversion_rate: ad.conversion_rate ?? 0
    }]);
    setShowAdModal(false);
  };

  // Validation helper function
  const validateOptimizationInputs = (): boolean => {
    // Check if at least one campaign exists
    if (campaigns.length === 0) {
      alert('Please add at least one campaign before optimizing.');
      return false;
    }

    // Check if at least one ad exists
    if (ads.length === 0) {
      alert('Please add at least one ad before optimizing.');
      return false;
    }

    // Validation: Check all campaign fields
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      if (!campaign.name || campaign.name.trim() === '') {
        alert(`Campaign ${i + 1}: Name is required.`);
        return false;
      }
      if (!campaign.no_of_days || campaign.no_of_days <= 0) {
        alert(`Campaign ${i + 1}: Number of days must be greater than 0.`);
        return false;
      }
      if (!campaign.time || campaign.time.trim() === '') {
        alert(`Campaign ${i + 1}: Date is required.`);
        return false;
      }
      if (!campaign.approved_budget || campaign.approved_budget <= 0) {
        alert(`Campaign ${i + 1}: Approved budget must be greater than 0.`);
        return false;
      }
      if (campaign.impressions === null || campaign.impressions === undefined || campaign.impressions < 0) {
        alert(`Campaign ${i + 1}: Impressions must be a valid number (0 or greater).`);
        return false;
      }
      if (campaign.clicks === null || campaign.clicks === undefined || campaign.clicks < 0) {
        alert(`Campaign ${i + 1}: Clicks must be a valid number (0 or greater).`);
        return false;
      }
      if (campaign.media_cost_usd === null || campaign.media_cost_usd === undefined || campaign.media_cost_usd < 0) {
        alert(`Campaign ${i + 1}: Media cost must be a valid number (0 or greater).`);
        return false;
      }
      if (!campaign.ext_service_name) {
        alert(`Campaign ${i + 1}: External service name is required.`);
        return false;
      }
      if (!campaign.channel_name) {
        alert(`Campaign ${i + 1}: Channel name is required.`);
        return false;
      }
      if (!campaign.search_tag_cat) {
        alert(`Campaign ${i + 1}: Search tag category is required.`);
        return false;
      }
    }

    // Validation: Check all ad fields
    for (let i = 0; i < ads.length; i++) {
      const ad = ads[i];
      if (!ad.name || ad.name.trim() === '') {
        alert(`Ad ${i + 1}: Name is required.`);
        return false;
      }
      if (!ad.click_through_rate || ad.click_through_rate <= 0) {
        alert(`Ad ${i + 1}: Click-through rate must be greater than 0.`);
        return false;
      }
      if (!ad.view_time || ad.view_time <= 0) {
        alert(`Ad ${i + 1}: View time must be greater than 0.`);
        return false;
      }
      if (!ad.cost_per_click || ad.cost_per_click <= 0) {
        alert(`Ad ${i + 1}: Cost per click must be greater than 0.`);
        return false;
      }
      if (ad.roi === null || ad.roi === undefined) {
        alert(`Ad ${i + 1}: ROI must be a valid number.`);
        return false;
      }
      if (!ad.timestamp || ad.timestamp.trim() === '') {
        alert(`Ad ${i + 1}: Timestamp is required.`);
        return false;
      }
      if (!ad.age_group) {
        alert(`Ad ${i + 1}: Age group is required.`);
        return false;
      }
      if (!ad.engagement_level) {
        alert(`Ad ${i + 1}: Engagement level is required.`);
        return false;
      }
      if (!ad.device_type) {
        alert(`Ad ${i + 1}: Device type is required.`);
        return false;
      }
      if (!ad.location) {
        alert(`Ad ${i + 1}: Location is required.`);
        return false;
      }
      if (!ad.gender) {
        alert(`Ad ${i + 1}: Gender is required.`);
        return false;
      }
      if (!ad.content_type) {
        alert(`Ad ${i + 1}: Content type is required.`);
        return false;
      }
      if (!ad.ad_topic) {
        alert(`Ad ${i + 1}: Ad topic is required.`);
        return false;
      }
      if (!ad.ad_target_audience) {
        alert(`Ad ${i + 1}: Target audience is required.`);
        return false;
      }
    }

    return true;
  };

  // Payload preparation helper
  const preparePayloads = () => {
    const campaignsPayload = campaigns.map((campaign, index) => {
      const { _key, ...rest } = campaign;
      return {
        ...rest,
        id: index + 1,
        overcost: campaign.overcost ?? 0
      };
    });

    const adsPayload = ads.map((ad, index) => {
      const { _key, ...rest } = ad;
      return {
        ...rest,
        id: index + 1,
        conversion_rate: ad.conversion_rate ?? 0
      };
    });

    return { campaignsPayload, adsPayload };
  };

  // Handler for Genetic Algorithm optimization
  const handleGeneticAlgorithm = async () => {
    if (!validateOptimizationInputs()) return;

    setRunningAlgorithm('ga');
    setIsOptimizing(true);
    setGaResults(null);
    setComparisonResults(null);

    const { campaignsPayload, adsPayload } = preparePayloads();

    const requestPayload = {
      campaigns: campaignsPayload,
      ads: adsPayload,
      total_budget: effectiveBudget,
      population_size: populationSize,
      max_generations: maxGenerations,
      mutation_rate: mutationRate,
      crossover_rate: crossoverRate,
      risk_factor: riskFactor,
      ga_verbose: false,
    };

    console.log("=== OPTIMIZATION REQUEST ===");
    console.log("Endpoint: POST /optimize_marketing_allocation");
    console.log("Campaigns:", campaigns.length);
    console.log("Ads:", ads.length);
    console.log("Total Budget:", effectiveBudget);
    console.log("Full Request Payload:", requestPayload);

    try {
      const response = await fetch("http://localhost:8000/optimize_marketing_allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      console.log("Response Status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("=== OPTIMIZATION ERROR ===");
        console.error("Error Data:", errorData);

        // Try to extract detailed error information
        let errorMessage = 'Unknown error';
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // FastAPI validation errors come as an array
            errorMessage = errorData.detail.map((err: any) => {
              const field = err.loc ? err.loc.join(' -> ') : 'Unknown field';
              return `${field}: ${err.msg}`;
            }).join('\n');
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        }

        alert(`Optimization failed:\n\n${errorMessage}`);
        return;
      }

      const data = await response.json();
      console.log("=== OPTIMIZATION SUCCESS ===");
      console.log("Full Response:", data);
      console.log("Total Fitness:", data.total_fitness);
      console.log("Budget Used:", data.total_budget_used);
      console.log("Expected Revenue:", data.total_expected_revenue);
      console.log("Expected Cost:", data.total_expected_cost);
      console.log("Number of Allocations:", data.allocations?.length || 0);

      setGaResults(data);
      setActiveResultsTab('ga');
    } catch (error) {
      console.error("=== OPTIMIZATION FAILED ===");
      console.error("Error:", error);
      alert("Failed to connect to API. Make sure the server is running.");
    } finally {
      setIsOptimizing(false);
      setRunningAlgorithm(null);
    }
  };

  // Handler for Tabu Search optimization
  const handleTabuSearch = async () => {
    if (!validateOptimizationInputs()) return;

    setRunningAlgorithm('ts');
    setIsOptimizing(true);
    setTsResults(null);
    setComparisonResults(null);

    const { campaignsPayload, adsPayload } = preparePayloads();

    const requestPayload = {
      campaigns: campaignsPayload,
      ads: adsPayload,
      total_budget: effectiveBudget,
      max_iterations: maxIterations,
      tabu_tenure: tabuTenure,
      neighborhood_size: neighborhoodSize,
      risk_factor: riskFactor,
      use_aspiration: useAspiration,
      intensification_threshold: intensificationThreshold,
      diversification_threshold: diversificationThreshold,
      ts_verbose: false,
    };

    console.log("=== TABU SEARCH REQUEST ===");
    console.log("Endpoint: POST /optimize_tabu_search");
    console.log("Campaigns:", campaigns.length);
    console.log("Ads:", ads.length);
    console.log("Total Budget:", effectiveBudget);
    console.log("Full Request Payload:", requestPayload);

    try {
      const response = await fetch("http://localhost:8000/optimize_tabu_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      console.log("Response Status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("=== TABU SEARCH ERROR ===");
        console.error("Error Data:", errorData);

        let errorMessage = 'Unknown error';
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => {
              const field = err.loc ? err.loc.join(' -> ') : 'Unknown field';
              return `${field}: ${err.msg}`;
            }).join('\n');
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        }

        alert(`Tabu Search failed:\n\n${errorMessage}`);
        return;
      }

      const data = await response.json();
      console.log("=== TABU SEARCH SUCCESS ===");
      console.log("Full Response:", data);

      setTsResults(data);
      setActiveResultsTab('ts');
    } catch (error) {
      console.error("=== TABU SEARCH FAILED ===");
      console.error("Error:", error);
      alert("Failed to connect to API. Make sure the server is running.");
    } finally {
      setIsOptimizing(false);
      setRunningAlgorithm(null);
    }
  };

  // Handler for Algorithm Comparison
  const handleCompare = async () => {
    if (!validateOptimizationInputs()) return;

    setRunningAlgorithm('compare');
    setIsOptimizing(true);
    setGaResults(null);
    setTsResults(null);
    setComparisonResults(null);

    const { campaignsPayload, adsPayload } = preparePayloads();

    const requestPayload = {
      campaigns: campaignsPayload,
      ads: adsPayload,
      total_budget: effectiveBudget,
      // GA params
      population_size: populationSize,
      max_generations: maxGenerations,
      mutation_rate: mutationRate,
      crossover_rate: crossoverRate,
      ga_verbose: false,
      // TS params
      max_iterations: maxIterations,
      tabu_tenure: tabuTenure,
      neighborhood_size: neighborhoodSize,
      use_aspiration: useAspiration,
      intensification_threshold: intensificationThreshold,
      diversification_threshold: diversificationThreshold,
      ts_verbose: false,
      // Shared
      risk_factor: riskFactor,
    };

    console.log("=== ALGORITHM COMPARISON REQUEST ===");
    console.log("Endpoint: POST /compare_algorithms");
    console.log("Campaigns:", campaigns.length);
    console.log("Ads:", ads.length);
    console.log("Total Budget:", effectiveBudget);
    console.log("Full Request Payload:", requestPayload);

    try {
      const response = await fetch("http://localhost:8000/compare_algorithms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      console.log("Response Status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("=== COMPARISON ERROR ===");
        console.error("Error Data:", errorData);

        let errorMessage = 'Unknown error';
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => {
              const field = err.loc ? err.loc.join(' -> ') : 'Unknown field';
              return `${field}: ${err.msg}`;
            }).join('\n');
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        }

        alert(`Algorithm comparison failed:\n\n${errorMessage}`);
        return;
      }

      const data = await response.json();
      console.log("=== COMPARISON SUCCESS ===");
      console.log("Full Response:", data);

      setComparisonResults(data);
      setGaResults(data.ga_result);
      setTsResults(data.ts_result);
      setActiveResultsTab('compare');
    } catch (error) {
      console.error("=== COMPARISON FAILED ===");
      console.error("Error:", error);
      alert("Failed to connect to API. Make sure the server is running.");
    } finally {
      setIsOptimizing(false);
      setRunningAlgorithm(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">New Campaign Setup</h2>
            <p className="text-slate-500 mt-1">
              Configure your parameters to generate optimized bidding strategies.
            </p>
          </div>
        </div>

        {/* Campaign Section */}
        <CampaignSection
          campaigns={campaigns}
          onAdd={addCampaign}
          onLoad={openLoadCampaignModal}
          onRemove={removeCampaign}
          onUpdate={updateCampaign}
        />

        {/* Divider */}
        <div className="border-t border-slate-200 my-8"></div>

        {/* Ad Section */}
        <AdSection
          ads={ads}
          onAdd={addAd}
          onLoad={openLoadAdModal}
          onRemove={removeAd}
          onUpdate={updateAd}
        />

        {/* Divider */}
        <div className="border-t border-slate-200 my-8"></div>

        {/* Optimization Parameters Section - Tabbed Interface */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6B7280]">tune</span>
              Optimization Parameters
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('ga')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'ga'
                    ? 'bg-white text-[#1d3d5d] border-b-2 border-[#1d3d5d]'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Genetic Algorithm
              </button>
              <button
                onClick={() => setActiveTab('ts')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'ts'
                    ? 'bg-white text-[#4A90A4] border-b-2 border-[#4A90A4]'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Tabu Search
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'compare'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Compare Algorithms
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Tab 1: Genetic Algorithm */}
              {activeTab === 'ga' && (
                <div className="space-y-6">
                  {/* Shared Parameters */}
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-4">General Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Budget */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Total Budget
                  </label>
                  <div className="relative rounded-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min={minBudget}
                      value={totalBudgetOverride !== null ? totalBudgetOverride : minBudget}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === '-') {
                          setTotalBudgetOverride(minBudget);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            setTotalBudgetOverride(numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value) || value < minBudget) {
                          setTotalBudgetOverride(minBudget);
                        }
                      }}
                      className={`block w-full rounded-lg border pl-7 pr-12 sm:text-sm h-11 bg-white ${
                        totalBudgetOverride !== null && totalBudgetOverride < minBudget
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d]'
                      }`}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-slate-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum: ${minBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (sum of campaign budgets)
                  </p>
                </div>

                      {/* Risk Factor Slider */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Risk Factor: {riskFactor.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={riskFactor}
                          onChange={(e) => setRiskFactor(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1d3d5d]"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>High Risk</span>
                          <span>Low Risk</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GA-Specific Parameters */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4A90A4] text-[20px]">psychology</span>
                      Genetic Algorithm Parameters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Population Size */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Population Size
                  </label>
                  <input
                    type="number"
                    value={populationSize}
                    onChange={(e) => setPopulationSize(parseInt(e.target.value) || 0)}
                    className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of solutions per generation</p>
                </div>

                {/* Max Generations */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Max Generations
                  </label>
                  <input
                    type="number"
                    value={maxGenerations}
                    onChange={(e) => setMaxGenerations(parseInt(e.target.value) || 0)}
                    className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum iterations for the algorithm</p>
                </div>

                {/* Mutation Rate Slider */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mutation Rate: {mutationRate.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mutationRate}
                    onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1d3d5d]"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>

                {/* Crossover Rate Slider */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Crossover Rate: {crossoverRate.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={crossoverRate}
                    onChange={(e) => setCrossoverRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1d3d5d]"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>
                    </div>
                  </div>

                  {/* GA Optimize Button */}
                  <div className="pt-4 border-t">
                    <button
                      onClick={handleGeneticAlgorithm}
                      disabled={isOptimizing}
                      className="w-full py-4 bg-[#1d3d5d] text-white rounded-xl font-bold hover:bg-[#1d3d5d]/90 focus:outline-none focus:ring-4 focus:ring-[#1d3d5d]/30 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-2xl">psychology</span>
                      {isOptimizing && runningAlgorithm === 'ga' ? 'Optimizing...' : 'Optimize with Genetic Algorithm'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Tabu Search */}
              {activeTab === 'ts' && (
                <div className="space-y-6">
                  {/* Shared Parameters */}
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1d3d5d] text-[20px]">settings</span>
                      General Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Total Budget Override */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Total Budget Override (Optional)
                        </label>
                        <div className="relative rounded-md">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-slate-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={totalBudgetOverride ?? ''}
                            onChange={(e) => setTotalBudgetOverride(e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={`Auto: ${minBudget.toFixed(2)}`}
                            className="block w-full rounded-lg border border-slate-200 pl-7 pr-12 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-slate-500 sm:text-sm">USD</span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Leave empty to use sum of campaign budgets: ${minBudget.toFixed(2)}
                        </p>
                      </div>

                      {/* Risk Factor */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Risk Factor: {riskFactor.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={riskFactor}
                          onChange={(e) => setRiskFactor(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1d3d5d]"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Conservative (0.1)</span>
                          <span>Aggressive (2.0)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabu Search-Specific Parameters */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1d3d5d] text-[20px]">analytics</span>
                      Tabu Search Parameters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Max Iterations */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Max Iterations
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="1000"
                          value={maxIterations}
                          onChange={(e) => setMaxIterations(parseInt(e.target.value) || 200)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Number of search iterations</p>
                      </div>

                      {/* Tabu Tenure */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Tabu Tenure
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={tabuTenure}
                          onChange={(e) => setTabuTenure(parseInt(e.target.value) || 10)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Tabu list size</p>
                      </div>

                      {/* Neighborhood Size */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Neighborhood Size
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={neighborhoodSize}
                          onChange={(e) => setNeighborhoodSize(parseInt(e.target.value) || 30)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Number of neighbors to explore</p>
                      </div>

                      {/* Intensification Threshold */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Intensification Threshold
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={intensificationThreshold}
                          onChange={(e) => setIntensificationThreshold(parseInt(e.target.value) || 50)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Iterations before intensification</p>
                      </div>

                      {/* Diversification Threshold */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Diversification Threshold
                        </label>
                        <input
                          type="number"
                          min="20"
                          max="300"
                          value={diversificationThreshold}
                          onChange={(e) => setDiversificationThreshold(parseInt(e.target.value) || 100)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Iterations before diversification</p>
                      </div>

                      {/* Use Aspiration */}
                      <div className="flex items-center">
                        <div className="mt-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useAspiration}
                              onChange={(e) => setUseAspiration(e.target.checked)}
                              className="w-5 h-5 rounded border-slate-300 text-[#1d3d5d] focus:ring-[#1d3d5d] cursor-pointer"
                            />
                            <div>
                              <span className="text-sm font-semibold text-slate-700">Use Aspiration Criteria</span>
                              <p className="text-xs text-slate-500">Override tabu restrictions for better solutions</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimize Button */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleTabuSearch}
                      disabled={isOptimizing}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        isOptimizing
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-[#1d3d5d] hover:bg-[#2d4d6d] shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {isOptimizing && runningAlgorithm === 'ts' ? 'progress_activity' : 'analytics'}
                      </span>
                      {isOptimizing && runningAlgorithm === 'ts' ? 'Optimizing with Tabu Search...' : 'Optimize with Tabu Search'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Compare Algorithms */}
              {activeTab === 'compare' && (
                <div className="space-y-6">
                  {/* Shared Parameters */}
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1d3d5d] text-[20px]">settings</span>
                      General Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Total Budget Override */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Total Budget Override (Optional)
                        </label>
                        <div className="relative rounded-md">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-slate-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={totalBudgetOverride ?? ''}
                            onChange={(e) => setTotalBudgetOverride(e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={`Auto: ${minBudget.toFixed(2)}`}
                            className="block w-full rounded-lg border border-slate-200 pl-7 pr-12 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-slate-500 sm:text-sm">USD</span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Leave empty to use sum of campaign budgets: ${minBudget.toFixed(2)}
                        </p>
                      </div>

                      {/* Risk Factor */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Risk Factor: {riskFactor.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={riskFactor}
                          onChange={(e) => setRiskFactor(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1d3d5d]"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Conservative (0.1)</span>
                          <span>Aggressive (2.0)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Genetic Algorithm Parameters */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4A90A4] text-[20px]">psychology</span>
                      Genetic Algorithm Parameters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Population Size */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Population Size
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="500"
                          value={populationSize}
                          onChange={(e) => setPopulationSize(parseInt(e.target.value) || 100)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Number of individuals per generation</p>
                      </div>

                      {/* Max Generations */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Max Generations
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="1000"
                          value={maxGenerations}
                          onChange={(e) => setMaxGenerations(parseInt(e.target.value) || 250)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Maximum evolutionary cycles</p>
                      </div>

                      {/* Mutation Rate */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Mutation Rate: {mutationRate.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.01"
                          max="0.5"
                          step="0.01"
                          value={mutationRate}
                          onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4A90A4]"
                        />
                        <p className="mt-1 text-xs text-slate-500">Probability of random changes</p>
                      </div>

                      {/* Crossover Rate */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Crossover Rate: {crossoverRate.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.0"
                          step="0.01"
                          value={crossoverRate}
                          onChange={(e) => setCrossoverRate(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4A90A4]"
                        />
                        <p className="mt-1 text-xs text-slate-500">Probability of gene mixing</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabu Search Parameters */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1d3d5d] text-[20px]">analytics</span>
                      Tabu Search Parameters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Max Iterations */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Max Iterations
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="1000"
                          value={maxIterations}
                          onChange={(e) => setMaxIterations(parseInt(e.target.value) || 200)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Number of search iterations</p>
                      </div>

                      {/* Tabu Tenure */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Tabu Tenure
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={tabuTenure}
                          onChange={(e) => setTabuTenure(parseInt(e.target.value) || 10)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Tabu list size</p>
                      </div>

                      {/* Neighborhood Size */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Neighborhood Size
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={neighborhoodSize}
                          onChange={(e) => setNeighborhoodSize(parseInt(e.target.value) || 30)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Number of neighbors to explore</p>
                      </div>

                      {/* Intensification Threshold */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Intensification Threshold
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={intensificationThreshold}
                          onChange={(e) => setIntensificationThreshold(parseInt(e.target.value) || 50)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Iterations before intensification</p>
                      </div>

                      {/* Diversification Threshold */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Diversification Threshold
                        </label>
                        <input
                          type="number"
                          min="20"
                          max="300"
                          value={diversificationThreshold}
                          onChange={(e) => setDiversificationThreshold(parseInt(e.target.value) || 100)}
                          className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                        />
                        <p className="mt-1 text-xs text-slate-500">Iterations before diversification</p>
                      </div>

                      {/* Use Aspiration */}
                      <div className="flex items-center">
                        <div className="mt-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useAspiration}
                              onChange={(e) => setUseAspiration(e.target.checked)}
                              className="w-5 h-5 rounded border-slate-300 text-[#1d3d5d] focus:ring-[#1d3d5d] cursor-pointer"
                            />
                            <div>
                              <span className="text-sm font-semibold text-slate-700">Use Aspiration Criteria</span>
                              <p className="text-xs text-slate-500">Override tabu restrictions for better solutions</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compare Button */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCompare}
                      disabled={isOptimizing}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        isOptimizing
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#4A90A4] to-[#1d3d5d] hover:shadow-xl shadow-lg'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {isOptimizing && runningAlgorithm === 'compare' ? 'progress_activity' : 'compare_arrows'}
                      </span>
                      {isOptimizing && runningAlgorithm === 'compare' ? 'Comparing Algorithms...' : 'Compare Both Algorithms'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Debug Buttons */}
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={testHealthCheck}
            className="px-3 py-1 text-xs text-slate-500 border border-slate-300 rounded hover:bg-slate-100"
          >
            Test API
          </button>
          <button
            onClick={testMockData}
            className="px-3 py-1 text-xs text-slate-500 border border-slate-300 rounded hover:bg-slate-100"
          >
            Fetch All Data
          </button>
        </div>

        {/* Results Section */}
        {(gaResults || tsResults || comparisonResults) && (
          <section className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Results Sub-Tab Navigation */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveResultsTab('ga')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative flex items-center justify-center gap-2 ${
                    activeResultsTab === 'ga'
                      ? 'bg-[#4A90A4]/5 text-[#4A90A4] border-b-2 border-[#4A90A4]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>GA Results</span>
                  {gaResults && (
                    <span className="h-2 w-2 rounded-full bg-[#4A90A4]"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveResultsTab('ts')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative flex items-center justify-center gap-2 ${
                    activeResultsTab === 'ts'
                      ? 'bg-[#1d3d5d]/5 text-[#1d3d5d] border-b-2 border-[#1d3d5d]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>TS Results</span>
                  {tsResults && (
                    <span className="h-2 w-2 rounded-full bg-[#1d3d5d]"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveResultsTab('compare')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative flex items-center justify-center gap-2 ${
                    activeResultsTab === 'compare'
                      ? 'bg-gradient-to-r from-[#4A90A4]/5 to-[#1d3d5d]/5 text-slate-800 border-b-2 border-slate-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Comparison</span>
                  {comparisonResults && (
                    <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                  )}
                </button>
              </div>

              {/* Results Content */}
              <div className="p-6">
                {/* GA Results Tab */}
                {activeResultsTab === 'ga' && (
                  gaResults ? (
                    <div className="space-y-6">
                      {/* Overall Metrics */}
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#4A90A4]">psychology</span>
                          Genetic Algorithm Results
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Fitness Score</p>
                            <p className="text-2xl font-semibold text-slate-900">{gaResults.fitness.toFixed(4)}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Total ROI</p>
                            <p className={`text-2xl font-semibold ${gaResults.total_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(gaResults.total_roi * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Media Cost</p>
                            <p className="text-2xl font-semibold text-slate-900">${gaResults.total_media_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Media Revenue</p>
                            <p className="text-2xl font-semibold text-slate-900">${gaResults.total_media_revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Profit</p>
                            <p className={`text-2xl font-semibold ${gaResults.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${gaResults.profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Allocations */}
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-3">Campaign Allocations</h4>
                        {Object.entries(gaResults.allocation).length === 0 ? (
                          <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500">
                            No campaigns allocated
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(gaResults.allocation).map(([campaignId, adIds]) => {
                              const campaign = getCampaignByApiId(parseInt(campaignId));
                              const metrics = gaResults.campaign_metrics[campaignId];
                  const campaignName = campaign?.name || `Unknown Campaign #${campaignId}`;
                  const isPositiveROI = metrics.roi >= 0;

                  return (
                    <details key={campaignId} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <summary className="px-6 py-4 cursor-pointer flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors select-none">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-800">{campaignName}</span>
                          <span className="text-sm text-slate-500">
                            {metrics.n_ads} {metrics.n_ads === 1 ? 'ad' : 'ads'} allocated
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isPositiveROI ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            ROI: {(metrics.roi * 100).toFixed(1)}%
                          </span>
                          <span className="material-symbols-outlined text-slate-400 transform group-open:rotate-180 transition-transform duration-200">
                            expand_more
                          </span>
                        </div>
                      </summary>

                      <div className="p-6 border-t border-slate-100">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                          {/* Left side - Campaign Info */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">Campaign Information</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Approved Budget:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    ${metrics.approved_budget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Budget Cost:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    ${metrics.budget_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Overcost:</span>
                                  <span className={`text-sm font-semibold ${metrics.overcost < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${metrics.overcost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Media Cost:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    ${metrics.media_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Performance Metrics */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">Performance Metrics</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Revenue:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    ${metrics.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Cost:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    ${metrics.cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">ROI:</span>
                                  <span className={`text-sm font-semibold ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
                                    {(metrics.roi * 100).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Avg Conversion Rate:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    {(metrics.avg_conversion_rate * 100).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Ads Cost:</span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    ${metrics.ads_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Allocated Ads List */}
                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Allocated Ads ({adIds.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {adIds.map((apiAdId) => {
                              const ad = getAdByApiId(apiAdId);
                              const adKey = getAdKey(apiAdId);
                              const adName = ad?.name || `Unknown Ad #${apiAdId}`;
                              return (
                                <button
                                  key={apiAdId}
                                  onClick={() => adKey && scrollToAd(adKey)}
                                  className="px-3 py-2 bg-[#4A90A4]/10 border border-[#4A90A4]/20 rounded-lg hover:bg-[#4A90A4]/20 hover:border-[#4A90A4]/40 transition-all cursor-pointer"
                                  title="Click to scroll to this ad"
                                >
                                  <div className="flex flex-col text-left">
                                    <span className="text-sm font-semibold text-slate-800">{adName}</span>
                                    {ad && (
                                      <span className="text-xs text-slate-500">
                                        {ad.device_type} • {ad.ad_topic} • {ad.ad_target_audience}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </details>
                  );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">analytics</span>
                      <p className="text-lg font-medium">No GA results yet</p>
                      <p className="text-sm mt-2">Run Genetic Algorithm optimization to see results here</p>
                    </div>
                  )
                )}

                {/* TS Results Tab */}
                {activeResultsTab === 'ts' && (
                  tsResults ? (
                    <div className="space-y-6">
                      {/* Overall Metrics */}
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1d3d5d]">analytics</span>
                          Tabu Search Results
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Fitness Score</p>
                            <p className="text-2xl font-semibold text-slate-900">{tsResults.fitness.toFixed(4)}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Total ROI</p>
                            <p className={`text-2xl font-semibold ${tsResults.total_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(tsResults.total_roi * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Media Cost</p>
                            <p className="text-2xl font-semibold text-slate-900">${tsResults.total_media_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Media Revenue</p>
                            <p className="text-2xl font-semibold text-slate-900">${tsResults.total_media_revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Profit</p>
                            <p className={`text-2xl font-semibold ${tsResults.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${tsResults.profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Allocations */}
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-3">Campaign Allocations</h4>
                        {Object.entries(tsResults.allocation).length === 0 ? (
                          <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500">
                            No campaigns allocated
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(tsResults.allocation).map(([campaignId, adIds]) => {
                              const campaign = getCampaignByApiId(parseInt(campaignId));
                              const metrics = tsResults.campaign_metrics[campaignId];
                              const campaignName = campaign?.name || `Unknown Campaign #${campaignId}`;
                              const isPositiveROI = metrics.roi >= 0;

                              return (
                                <details key={campaignId} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                  <summary className="px-6 py-4 cursor-pointer flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors select-none">
                                    <div className="flex items-center gap-4">
                                      <span className="font-bold text-slate-800">{campaignName}</span>
                                      <span className="text-sm text-slate-500">
                                        {metrics.n_ads} {metrics.n_ads === 1 ? 'ad' : 'ads'} allocated
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isPositiveROI ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        ROI: {(metrics.roi * 100).toFixed(1)}%
                                      </span>
                                      <span className="material-symbols-outlined text-slate-400 transform group-open:rotate-180 transition-transform duration-200">
                                        expand_more
                                      </span>
                                    </div>
                                  </summary>

                                  <div className="p-6 border-t border-slate-100">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                      {/* Left side - Campaign Info */}
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Campaign Information</h4>
                                          <div className="space-y-2">
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Approved Budget:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                ${metrics.approved_budget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Budget Cost:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                ${metrics.budget_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Overcost:</span>
                                              <span className={`text-sm font-semibold ${metrics.overcost < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${metrics.overcost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Media Cost:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                ${metrics.media_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right side - Performance Metrics */}
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Performance Metrics</h4>
                                          <div className="space-y-2">
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Revenue:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                ${metrics.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Cost:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                ${metrics.cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">ROI:</span>
                                              <span className={`text-sm font-semibold ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
                                                {(metrics.roi * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Avg Conversion Rate:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                {(metrics.avg_conversion_rate * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-sm text-slate-500">Ads Cost:</span>
                                              <span className="text-sm font-semibold text-slate-800">
                                                ${metrics.ads_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Allocated Ads List */}
                                    <div className="pt-4 border-t border-slate-100">
                                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Allocated Ads ({adIds.length})</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {adIds.map((apiAdId) => {
                                          const ad = getAdByApiId(apiAdId);
                                          const adKey = getAdKey(apiAdId);
                                          const adName = ad?.name || `Unknown Ad #${apiAdId}`;
                                          return (
                                            <button
                                              key={apiAdId}
                                              onClick={() => adKey && scrollToAd(adKey)}
                                              className="px-3 py-2 bg-[#4A90A4]/10 border border-[#4A90A4]/20 rounded-lg hover:bg-[#4A90A4]/20 hover:border-[#4A90A4]/40 transition-all cursor-pointer"
                                              title="Click to scroll to this ad"
                                            >
                                              <div className="flex flex-col text-left">
                                                <span className="text-sm font-semibold text-slate-800">{adName}</span>
                                                {ad && (
                                                  <span className="text-xs text-slate-500">
                                                    {ad.device_type} • {ad.ad_topic} • {ad.ad_target_audience}
                                                  </span>
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </details>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">analytics</span>
                      <p className="text-lg font-medium">No TS results yet</p>
                      <p className="text-sm mt-2">Run Tabu Search optimization to see results here</p>
                    </div>
                  )
                )}

                {/* Comparison Tab */}
                {activeResultsTab === 'compare' && (
                  comparisonResults ? (
                    <div className="space-y-6">
                      {/* Winner Banner */}
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl">
                        <div className="flex items-center justify-center gap-3">
                          <span className="material-symbols-outlined text-amber-600 text-3xl">emoji_events</span>
                          <div>
                            <p className="text-sm font-medium text-amber-900">Winner</p>
                            <p className="text-xl font-bold text-amber-900">{comparisonResults.winner}</p>
                          </div>
                        </div>
                      </div>

                      {/* Side-by-side comparison */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* GA Results */}
                        <div className="border-2 border-[#4A90A4] rounded-xl p-4 bg-[#4A90A4]/5">
                          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#4A90A4]">psychology</span>
                            Genetic Algorithm
                          </h4>
                          {comparisonResults.ga_result ? (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Fitness:</span>
                                <span className="text-sm font-semibold">{comparisonResults.ga_result.fitness.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">ROI:</span>
                                <span className={`text-sm font-semibold ${comparisonResults.ga_result.total_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {(comparisonResults.ga_result.total_roi * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Media Cost:</span>
                                <span className="text-sm font-semibold">${comparisonResults.ga_result.total_media_cost.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Media Revenue:</span>
                                <span className="text-sm font-semibold">${comparisonResults.ga_result.total_media_revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Profit:</span>
                                <span className={`text-sm font-semibold ${comparisonResults.ga_result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${comparisonResults.ga_result.profit.toLocaleString('en-US', {minimumFractionDigits: 2})}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No results</p>
                          )}
                        </div>

                        {/* TS Results */}
                        <div className="border-2 border-[#1d3d5d] rounded-xl p-4 bg-[#1d3d5d]/5">
                          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#1d3d5d]">analytics</span>
                            Tabu Search
                          </h4>
                          {comparisonResults.ts_result ? (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Fitness:</span>
                                <span className="text-sm font-semibold">{comparisonResults.ts_result.fitness.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">ROI:</span>
                                <span className={`text-sm font-semibold ${comparisonResults.ts_result.total_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {(comparisonResults.ts_result.total_roi * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Media Cost:</span>
                                <span className="text-sm font-semibold">${comparisonResults.ts_result.total_media_cost.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Media Revenue:</span>
                                <span className="text-sm font-semibold">${comparisonResults.ts_result.total_media_revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Profit:</span>
                                <span className={`text-sm font-semibold ${comparisonResults.ts_result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${comparisonResults.ts_result.profit.toLocaleString('en-US', {minimumFractionDigits: 2})}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No results</p>
                          )}
                        </div>
                      </div>

                      {/* Detailed results note */}
                      <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
                        <p>Switch to individual algorithm tabs to see detailed campaign allocations</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">compare_arrows</span>
                      <p className="text-lg font-medium">No comparison results yet</p>
                      <p className="text-sm mt-2">Run algorithm comparison to see results here</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Load Modals */}
      <LoadModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title="Load Campaign from Database"
        items={loadedCampaigns}
        type="campaign"
        onSelect={handleSelectCampaign}
        isLoading={isLoadingCampaigns}
      />

      <LoadModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        title="Load Ad from Database"
        items={loadedAds}
        type="ad"
        onSelect={handleSelectAd}
        isLoading={isLoadingAds}
      />
    </div>
  );
}
