"use client";

import { useState } from "react";
import {
  Ad,
  DEVICE_OPTIONS,
  LOCATION_OPTIONS,
  AGE_OPTIONS,
  GENDER_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from "@/types";

interface AdCardProps {
  ad: Ad;
  label: string;
  isOpen: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<Ad>) => void;
}

export default function AdCard({
  ad,
  label,
  isOpen,
  canRemove,
  onRemove,
  onUpdate,
}: AdCardProps) {
  const [open, setOpen] = useState(isOpen);

  const getDisplayName = () => {
    const parts = [];
    if (ad.deviceType && ad.deviceType !== "All Devices") {
      parts.push(ad.deviceType.replace(" Only", ""));
    } else {
      parts.push("All Devices");
    }
    if (ad.targetAudience) {
      parts.push(ad.targetAudience);
    }
    if (ad.contentType) {
      parts.push(ad.contentType.replace(" Ad", ""));
    }
    return parts.length > 1 ? parts.join(" - ") : `Ad ${label}`;
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
                ? "bg-[#4A90A4]/10 text-[#4A90A4]"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {label}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Device Type <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.deviceType}
                onChange={(e) => onUpdate({ deviceType: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {DEVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.location}
                onChange={(e) => onUpdate({ location: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Age Group & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Age Group <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.ageGroup}
                onChange={(e) => onUpdate({ ageGroup: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {AGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.gender}
                onChange={(e) => onUpdate({ gender: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Content Type <span className="text-red-500">*</span>
            </label>
            <select
              value={ad.contentType}
              onChange={(e) => onUpdate({ contentType: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
            >
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Ad Topic */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ad Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ad.adTopic}
              onChange={(e) => onUpdate({ adTopic: e.target.value })}
              placeholder="e.g., CRM Software for Enterprise"
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
            />
          </div>

          {/* Target Audience & Cost Per Click */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:col-span-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ad.targetAudience}
                onChange={(e) => onUpdate({ targetAudience: e.target.value })}
                placeholder="e.g., IT Managers, CTOs"
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cost Per Click (Max) <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={ad.costPerClick}
                  onChange={(e) =>
                    onUpdate({ costPerClick: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full rounded-lg border border-slate-200 pl-7 pr-4 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
