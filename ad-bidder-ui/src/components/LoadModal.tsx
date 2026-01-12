"use client";

import { Campaign, Ad } from "@/types";

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: Campaign[] | Ad[];
  type: "campaign" | "ad";
  onSelect: (item: Campaign | Ad) => void;
  isLoading: boolean;
}

export default function LoadModal({
  isOpen,
  onClose,
  title,
  items,
  type,
  onSelect,
  isLoading,
}: LoadModalProps) {
  if (!isOpen) return null;

  const getCampaignSummary = (campaign: Campaign) => {
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-800">{campaign.name}</span>
        <span className="text-sm text-slate-500">
          {campaign.ext_service_name} &bull; {campaign.channel_name} &bull; ${campaign.approved_budget.toLocaleString()}
        </span>
      </div>
    );
  };

  const getAdSummary = (ad: Ad) => {
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-800">{ad.name}</span>
        <span className="text-sm text-slate-500">
          {ad.ad_topic} &bull; {ad.device_type} &bull; {ad.ad_target_audience}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d3d5d]"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No {type}s found in the database.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-[#1d3d5d] hover:bg-slate-50 transition-all"
                  >
                    {type === "campaign"
                      ? getCampaignSummary(item as Campaign)
                      : getAdSummary(item as Ad)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
