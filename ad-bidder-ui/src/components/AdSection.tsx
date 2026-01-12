"use client";

import { Ad } from "@/types";
import AdCard from "./AdCard";

interface AdSectionProps {
  ads: Ad[];
  onAdd: () => void;
  onLoad: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Ad>) => void;
}

export default function AdSection({
  ads,
  onAdd,
  onLoad,
  onRemove,
  onUpdate,
}: AdSectionProps) {
  const getAdLabel = (index: number) => {
    const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    return labels[index] || String(index + 1);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4A90A4]">target</span>
          Ad Targeting List
        </h3>
        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-500">
          {ads.length} Active Ad{ads.length !== 1 ? "s" : ""}
        </span>
      </div>

      {ads.map((ad, index) => (
        <AdCard
          key={ad.id}
          ad={ad}
          label={getAdLabel(index)}
          isOpen={index === 0}
          canRemove={ads.length > 1}
          onRemove={() => onRemove(ad.id)}
          onUpdate={(updates) => onUpdate(ad.id, updates)}
        />
      ))}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-[#4A90A4] hover:text-[#4A90A4] hover:bg-slate-50 transition-all font-semibold text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Another Ad
        </button>
        <button
          type="button"
          onClick={onLoad}
          className="flex-1 py-3 border-2 border-slate-300 rounded-xl text-slate-500 hover:border-[#4A90A4] hover:text-[#4A90A4] hover:bg-slate-50 transition-all font-semibold text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">download</span>
          Load Ad
        </button>
      </div>
    </section>
  );
}
