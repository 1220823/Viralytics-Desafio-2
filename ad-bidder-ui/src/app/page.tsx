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

    const totalBudget = campaigns.reduce((sum, c) => sum + c.approved_budget, 0);

    const requestPayload = {
      campaigns: campaigns,
      ads: ads,
      total_budget: totalBudget,
      population_size: 100,
      max_generations: 150,
      mutation_rate: 0.15,
      crossover_rate: 0.85,
      risk_factor: 1.0,
      ga_verbose: false,
    };

    console.log("=== OPTIMIZATION REQUEST ===");
    console.log("Endpoint: POST /optimize_marketing_allocation");
    console.log("Campaigns:", campaigns.length);
    console.log("Ads:", ads.length);
    console.log("Total Budget:", totalBudget);
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
