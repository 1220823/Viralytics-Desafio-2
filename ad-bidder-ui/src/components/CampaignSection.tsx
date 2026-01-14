"use client";

import { Campaign } from "@/types";
import CampaignCard from "./CampaignCard";

interface CampaignSectionProps {
  campaigns: Campaign[];
  onAdd: () => void;
  onLoad: () => void;
  onRemove: (key: string) => void;
  onUpdate: (key: string, updates: Partial<Campaign>) => void;
}

export default function CampaignSection({
  campaigns,
  onAdd,
  onLoad,
  onRemove,
  onUpdate,
}: CampaignSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1d3d5d]">campaign</span>
          Campaign Details List
        </h3>
        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-500">
          {campaigns.length} Campaign{campaigns.length !== 1 ? "s" : ""}
        </span>
      </div>

      {campaigns.map((campaign, index) => (
        <CampaignCard
          key={campaign._key}
          campaign={campaign}
          index={index + 1}
          isOpen={index === 0}
          canRemove={true}
          onRemove={() => onRemove(campaign._key)}
          onUpdate={(updates) => onUpdate(campaign._key, updates)}
        />
      ))}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-[#1d3d5d] hover:text-[#1d3d5d] hover:bg-slate-50 transition-all font-semibold text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Another Campaign
        </button>
        <button
          type="button"
          onClick={onLoad}
          className="flex-1 py-3 border-2 border-slate-300 rounded-xl text-slate-500 hover:border-[#1d3d5d] hover:text-[#1d3d5d] hover:bg-slate-50 transition-all font-semibold text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">download</span>
          Load Campaign
        </button>
      </div>
    </section>
  );
}
