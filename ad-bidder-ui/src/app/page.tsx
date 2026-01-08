"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CampaignSection from "@/components/CampaignSection";
import AdSection from "@/components/AdSection";
import { Campaign, Ad, DEFAULT_CAMPAIGN, DEFAULT_AD } from "@/types";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { ...DEFAULT_CAMPAIGN, id: generateId() },
  ]);
  const [ads, setAds] = useState<Ad[]>([
    { ...DEFAULT_AD, id: generateId() },
  ]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const addCampaign = () => {
    setCampaigns([...campaigns, { ...DEFAULT_CAMPAIGN, id: generateId() }]);
  };

  const removeCampaign = (id: string) => {
    if (campaigns.length > 1) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(
      campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const addAd = () => {
    setAds([...ads, { ...DEFAULT_AD, id: generateId() }]);
  };

  const removeAd = (id: string) => {
    if (ads.length > 1) {
      setAds(ads.filter((a) => a.id !== id));
    }
  };

  const updateAd = (id: string, updates: Partial<Ad>) => {
    setAds(ads.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch("http://localhost:8000/health");
      const data = await response.json();
      console.log("Health Check:", data);
    } catch (error) {
      console.error("Health check failed:", error);
    }
  };

  const testMockData = async () => {
    try {
      const response = await fetch("http://localhost:8000/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaigns: [{ service_name: "Test", approved_budget: 1000, no_of_days: 30, time: "2024-01-01", channel_name: "Google", search_tag_cat: "tech" }],
          ads: [{ device_type: "Desktop", location: "US", age_group: "25-34", gender: "All", content_type: "Video", ad_topic: "Test", ad_target_audience: "Developers", cost_per_click: 2.5 }],
          budget: 1000,
        }),
      });
      const data = await response.json();
      console.log("Mock Optimization Result:", data);
    } catch (error) {
      console.error("Mock data fetch failed:", error);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch("http://localhost:8000/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaigns: campaigns.map((c) => ({
            service_name: c.serviceName,
            approved_budget: c.approvedBudget,
            no_of_days: c.duration,
            time: c.startDate,
            channel_name: c.channelName,
            search_tag_cat: c.categoryTags.join(","),
          })),
          ads: ads.map((a) => ({
            device_type: a.deviceType,
            location: a.location,
            age_group: a.ageGroup,
            gender: a.gender,
            content_type: a.contentType,
            ad_topic: a.adTopic,
            ad_target_audience: a.targetAudience,
            cost_per_click: a.costPerClick,
          })),
          budget: campaigns.reduce((sum, c) => sum + c.approvedBudget, 0),
        }),
      });
      const data = await response.json();
      console.log("Optimization results:", data);
      // TODO: Display results
    } catch (error) {
      console.error("Optimization failed:", error);
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
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">history</span>
              Load Preset
            </button>
          </div>
        </div>

        {/* Campaign Section */}
        <CampaignSection
          campaigns={campaigns}
          onAdd={addCampaign}
          onRemove={removeCampaign}
          onUpdate={updateCampaign}
        />

        {/* Divider */}
        <div className="border-t border-slate-200 my-8"></div>

        {/* Ad Section */}
        <AdSection
          ads={ads}
          onAdd={addAd}
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
            Test Health
          </button>
          <button
            onClick={testMockData}
            className="px-3 py-1 text-xs text-slate-500 border border-slate-300 rounded hover:bg-slate-100"
          >
            Test Mock Data
          </button>
        </div>
      </main>
    </div>
  );
}
