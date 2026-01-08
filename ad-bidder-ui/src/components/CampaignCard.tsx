"use client";

import { useState } from "react";
import {
  Campaign,
  SERVICE_OPTIONS,
  CHANNEL_OPTIONS,
  CATEGORY_OPTIONS,
} from "@/types";

interface CampaignCardProps {
  campaign: Campaign;
  index: number;
  isOpen: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<Campaign>) => void;
}

export default function CampaignCard({
  campaign,
  index,
  isOpen,
  canRemove,
  onRemove,
  onUpdate,
}: CampaignCardProps) {
  const [open, setOpen] = useState(isOpen);

  const getDisplayName = () => {
    if (campaign.serviceName) {
      const service = SERVICE_OPTIONS.find((s) => s.value === campaign.serviceName);
      return service?.label || campaign.serviceName;
    }
    return `Campaign ${index}`;
  };

  return (
    <details
      className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="px-6 py-4 cursor-pointer flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors select-none">
        <div className="flex items-center gap-3">
          <span
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              open
                ? "bg-[#1d3d5d]/10 text-[#1d3d5d]"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {index}
          </span>
          <span className="font-bold text-slate-800">{getDisplayName()}</span>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          )}
          <span className="material-symbols-outlined text-slate-400 transform group-open:rotate-180 transition-transform duration-200">
            expand_more
          </span>
        </div>
      </summary>

      <div className="p-6 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Service Name <span className="text-red-500">*</span>
            </label>
            <select
              value={campaign.serviceName}
              onChange={(e) => onUpdate({ serviceName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 px-3"
            >
              <option value="">Select a service...</option>
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Channel Name <span className="text-red-500">*</span>
            </label>
            <select
              value={campaign.channelName}
              onChange={(e) => onUpdate({ channelName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 px-3"
            >
              <option value="">Select a channel...</option>
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget & Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Approved Budget <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={campaign.approvedBudget}
                  onChange={(e) =>
                    onUpdate({ approvedBudget: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full rounded-lg border border-slate-200 pl-7 pr-12 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-slate-500 sm:text-sm">USD</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md">
                <input
                  type="number"
                  value={campaign.duration}
                  onChange={(e) =>
                    onUpdate({ duration: parseInt(e.target.value) || 0 })
                  }
                  className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-slate-500 sm:text-sm">Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start Date & Category Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={campaign.startDate}
                onChange={(e) => onUpdate({ startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Category Tags
              </label>
              <select
                multiple
                value={campaign.categoryTags}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (opt) => opt.value
                  );
                  onUpdate({ categoryTags: selected });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 px-3"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">
                Hold Ctrl/Cmd to select multiple
              </div>
            </div>
          </div>

          {/* Impressions, Clicks, Media Cost Row */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Impressions
              </label>
              <input
                type="number"
                value={campaign.impressions}
                onChange={(e) =>
                  onUpdate({ impressions: parseInt(e.target.value) || 0 })
                }
                className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Clicks
              </label>
              <input
                type="number"
                value={campaign.clicks}
                onChange={(e) =>
                  onUpdate({ clicks: parseInt(e.target.value) || 0 })
                }
                className="block w-full rounded-lg border border-slate-200 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Media Cost (USD)
              </label>
              <div className="relative rounded-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={campaign.mediaCost}
                  onChange={(e) =>
                    onUpdate({ mediaCost: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full rounded-lg border border-slate-200 pl-7 pr-4 focus:border-[#1d3d5d] focus:ring-[#1d3d5d] sm:text-sm h-11 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
