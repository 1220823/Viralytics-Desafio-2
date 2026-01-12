"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CampaignSection from "@/components/CampaignSection";
import AdSection from "@/components/AdSection";
import LoadModal from "@/components/LoadModal";
import { Campaign, Ad, DEFAULT_CAMPAIGN, DEFAULT_AD, OptimizationResponse } from "@/types";

let nextCampaignId = 1;
let nextAdId = 1;

function generateCampaignId() {
  return nextCampaignId++;
}

function generateAdId() {
  return nextAdId++;
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      ...DEFAULT_CAMPAIGN,
      id: generateCampaignId(),
      name: "Campaign 1",
      time: new Date().toISOString().split('T')[0]
    },
  ]);
  const [ads, setAds] = useState<Ad[]>([
    {
      ...DEFAULT_AD,
      id: generateAdId(),
      name: "Ad 1",
      timestamp: new Date().toISOString()
    },
  ]);
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

  const addCampaign = () => {
    const newId = generateCampaignId();
    setCampaigns([...campaigns, {
      ...DEFAULT_CAMPAIGN,
      id: newId,
      name: `Campaign ${newId}`,
      time: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeCampaign = (id: number) => {
    if (campaigns.length > 1) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const updateCampaign = (id: number, updates: Partial<Campaign>) => {
    setCampaigns(
      campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const addAd = () => {
    const newId = generateAdId();
    setAds([...ads, {
      ...DEFAULT_AD,
      id: newId,
      name: `Ad ${newId}`,
      timestamp: new Date().toISOString()
    }]);
  };

  const removeAd = (id: number) => {
    if (ads.length > 1) {
      setAds(ads.filter((a) => a.id !== id));
    }
  };

  const updateAd = (id: number, updates: Partial<Ad>) => {
    setAds(ads.map((a) => (a.id === id ? { ...a, ...updates } : a)));
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
    const newId = generateCampaignId();
    setCampaigns([...campaigns, { ...campaign, id: newId }]);
    setShowCampaignModal(false);
  };

  const handleSelectAd = (item: Campaign | Ad) => {
    const ad = item as Ad;
    const newId = generateAdId();
    setAds([...ads, { ...ad, id: newId }]);
    setShowAdModal(false);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setResults(null);

    const requestPayload = {
      campaigns: campaigns,
      ads: ads,
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
        alert(`Optimization failed: ${errorData.detail || 'Unknown error'}`);
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
                        const value = parseFloat(e.target.value) || 0;
                        setTotalBudgetOverride(value < minBudget ? minBudget : value);
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
          <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Optimization Results</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-500">Total Fitness</p>
                <p className="text-xl font-semibold">{results.total_fitness?.toFixed(4) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Budget Used</p>
                <p className="text-xl font-semibold">${results.total_budget_used?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Expected Revenue</p>
                <p className="text-xl font-semibold">${results.total_expected_revenue?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Expected Cost</p>
                <p className="text-xl font-semibold">${results.total_expected_cost?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Full results logged to console</p>
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
