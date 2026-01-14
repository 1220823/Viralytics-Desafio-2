"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CampaignSection from "@/components/CampaignSection";
import AdSection from "@/components/AdSection";
import LoadModal from "@/components/LoadModal";
import { Campaign, Ad, DEFAULT_CAMPAIGN, DEFAULT_AD, OptimizationResponse } from "@/types";

let keyCounter = 0;

function generateUniqueKey(prefix: string) {
  return `${prefix}-${Date.now()}-${keyCounter++}`;
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<OptimizationResponse | null>(null);

  // Load modal state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [loadedCampaigns, setLoadedCampaigns] = useState<Campaign[]>([]);
  const [loadedAds, setLoadedAds] = useState<Ad[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(false);

  // Advanced parameters state
  const [populationSize, setPopulationSize] = useState(100);
  const [maxGenerations, setMaxGenerations] = useState(150);
  const [mutationRate, setMutationRate] = useState(0.15);
  const [crossoverRate, setCrossoverRate] = useState(0.85);
  const [riskFactor, setRiskFactor] = useState(1.0);
  const [totalBudgetOverride, setTotalBudgetOverride] = useState<number | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const calculateNetProfit = (revenue: number, cost: number): number => {
    return revenue - cost;
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

  const handleOptimize = async () => {
    // Validation: Check if at least one campaign exists
    if (campaigns.length === 0) {
      alert('Please add at least one campaign before optimizing.');
      return;
    }

    // Validation: Check if at least one ad exists
    if (ads.length === 0) {
      alert('Please add at least one ad before optimizing.');
      return;
    }

    // Validation: Check all campaign fields
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      if (!campaign.name || campaign.name.trim() === '') {
        alert(`Campaign ${i + 1}: Name is required.`);
        return;
      }
      if (!campaign.no_of_days || campaign.no_of_days <= 0) {
        alert(`Campaign ${i + 1}: Number of days must be greater than 0.`);
        return;
      }
      if (!campaign.time || campaign.time.trim() === '') {
        alert(`Campaign ${i + 1}: Date is required.`);
        return;
      }
      if (!campaign.approved_budget || campaign.approved_budget <= 0) {
        alert(`Campaign ${i + 1}: Approved budget must be greater than 0.`);
        return;
      }
      if (campaign.impressions === null || campaign.impressions === undefined || campaign.impressions < 0) {
        alert(`Campaign ${i + 1}: Impressions must be a valid number (0 or greater).`);
        return;
      }
      if (campaign.clicks === null || campaign.clicks === undefined || campaign.clicks < 0) {
        alert(`Campaign ${i + 1}: Clicks must be a valid number (0 or greater).`);
        return;
      }
      if (campaign.media_cost_usd === null || campaign.media_cost_usd === undefined || campaign.media_cost_usd < 0) {
        alert(`Campaign ${i + 1}: Media cost must be a valid number (0 or greater).`);
        return;
      }
      if (!campaign.ext_service_name) {
        alert(`Campaign ${i + 1}: External service name is required.`);
        return;
      }
      if (!campaign.channel_name) {
        alert(`Campaign ${i + 1}: Channel name is required.`);
        return;
      }
      if (!campaign.search_tag_cat) {
        alert(`Campaign ${i + 1}: Search tag category is required.`);
        return;
      }
    }

    // Validation: Check all ad fields
    for (let i = 0; i < ads.length; i++) {
      const ad = ads[i];
      if (!ad.name || ad.name.trim() === '') {
        alert(`Ad ${i + 1}: Name is required.`);
        return;
      }
      if (!ad.click_through_rate || ad.click_through_rate <= 0) {
        alert(`Ad ${i + 1}: Click-through rate must be greater than 0.`);
        return;
      }
      if (!ad.view_time || ad.view_time <= 0) {
        alert(`Ad ${i + 1}: View time must be greater than 0.`);
        return;
      }
      if (!ad.cost_per_click || ad.cost_per_click <= 0) {
        alert(`Ad ${i + 1}: Cost per click must be greater than 0.`);
        return;
      }
      if (ad.roi === null || ad.roi === undefined) {
        alert(`Ad ${i + 1}: ROI must be a valid number.`);
        return;
      }
      if (!ad.timestamp || ad.timestamp.trim() === '') {
        alert(`Ad ${i + 1}: Timestamp is required.`);
        return;
      }
      if (!ad.age_group) {
        alert(`Ad ${i + 1}: Age group is required.`);
        return;
      }
      if (!ad.engagement_level) {
        alert(`Ad ${i + 1}: Engagement level is required.`);
        return;
      }
      if (!ad.device_type) {
        alert(`Ad ${i + 1}: Device type is required.`);
        return;
      }
      if (!ad.location) {
        alert(`Ad ${i + 1}: Location is required.`);
        return;
      }
      if (!ad.gender) {
        alert(`Ad ${i + 1}: Gender is required.`);
        return;
      }
      if (!ad.content_type) {
        alert(`Ad ${i + 1}: Content type is required.`);
        return;
      }
      if (!ad.ad_topic) {
        alert(`Ad ${i + 1}: Ad topic is required.`);
        return;
      }
      if (!ad.ad_target_audience) {
        alert(`Ad ${i + 1}: Target audience is required.`);
        return;
      }
    }

    setIsOptimizing(true);
    setResults(null);

    // Prepare payload: assign sequential IDs, strip _key, ensure required fields exist
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

      setResults(data);
    } catch (error) {
      console.error("=== OPTIMIZATION FAILED ===");
      console.error("Error:", error);
      alert("Failed to connect to API. Make sure the server is running.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-2xl mx-auto px-4 py-8 space-y-8">
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

        {/* Advanced Parameters Section */}
        <section className="space-y-4">
          <details
            className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            open={advancedOpen}
            onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="px-6 py-4 cursor-pointer flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6B7280]">tune</span>
                <span className="font-bold text-slate-800">Advanced Parameters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-500">
                  GA Settings
                </span>
                <span className="material-symbols-outlined text-slate-400 transform group-open:rotate-180 transition-transform duration-200">
                  expand_more
                </span>
              </div>
            </summary>

            <div className="p-6 border-t border-slate-100">
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
          </details>
        </section>

        {/* Optimize Button */}
        <div className="flex justify-center pt-8">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full md:w-auto inline-flex justify-center items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-[#1d3d5d] hover:bg-[#1d3d5d]/90 focus:outline-none focus:ring-4 focus:ring-[#1d3d5d]/30 shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="material-symbols-outlined mr-2 text-2xl">auto_fix_high</span>
            {isOptimizing ? "Optimizing..." : "Optimize All Campaigns"}
          </button>
        </div>

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
        {results && (
          <div className="mt-8 space-y-6">
            {/* Section A: Overall Metrics */}
            <div className="p-6 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Overall Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Fitness Score</p>
                  <p className="text-2xl font-semibold text-slate-900">{results.fitness.toFixed(4)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Total ROI</p>
                  <p className={`text-2xl font-semibold ${results.total_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(results.total_roi * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Total Cost</p>
                  <p className="text-2xl font-semibold text-slate-900">${results.total_cost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-semibold text-slate-900">${results.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Net Profit</p>
                  <p className={`text-2xl font-semibold ${calculateNetProfit(results.total_revenue, results.total_cost) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${calculateNetProfit(results.total_revenue, results.total_cost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>

            {/* Section B & C: Campaign Allocations */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Campaign Allocations</h3>
              {Object.entries(results.allocation).length === 0 ? (
                <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
                  No campaigns allocated
                </div>
              ) : (
                Object.entries(results.allocation).map(([campaignId, adIds]) => {
                  const campaign = getCampaignByApiId(parseInt(campaignId));
                  const metrics = results.campaign_metrics[campaignId];
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
                })
              )}
            </div>
          </div>
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
