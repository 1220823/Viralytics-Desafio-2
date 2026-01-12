"use client";

import { useState } from "react";
import {
  Ad,
  DEVICE_OPTIONS,
  LOCATION_OPTIONS,
  AGE_OPTIONS,
  GENDER_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  AD_TOPIC_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  ENGAGEMENT_LEVEL_OPTIONS,
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
    return ad.name || `Ad ${label}`;
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
          {/* Ad Name */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ad Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ad.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter ad name"
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
            />
          </div>

          {/* Device Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Device Type <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.device_type}
                onChange={(e) => onUpdate({ device_type: e.target.value as Ad['device_type'] })}
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
                onChange={(e) => onUpdate({ location: e.target.value as Ad['location'] })}
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
                value={ad.age_group}
                onChange={(e) => onUpdate({ age_group: e.target.value as Ad['age_group'] })}
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
                onChange={(e) => onUpdate({ gender: e.target.value as Ad['gender'] })}
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

          {/* Content Type & Engagement Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Content Type <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.content_type}
                onChange={(e) => onUpdate({ content_type: e.target.value as Ad['content_type'] })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {CONTENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Engagement Level <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.engagement_level}
                onChange={(e) => onUpdate({ engagement_level: e.target.value as Ad['engagement_level'] })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {ENGAGEMENT_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ad Topic & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ad Topic <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.ad_topic}
                onChange={(e) => onUpdate({ ad_topic: e.target.value as Ad['ad_topic'] })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {AD_TOPIC_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                value={ad.ad_target_audience}
                onChange={(e) => onUpdate({ ad_target_audience: e.target.value as Ad['ad_target_audience'] })}
                className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 px-3"
              >
                {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Performance Metrics Row */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Click Through Rate
              </label>
              <input
                type="number"
                step="0.01"
                value={ad.click_through_rate}
                onChange={(e) =>
                  onUpdate({ click_through_rate: parseFloat(e.target.value) || 0 })
                }
                className="block w-full rounded-lg border border-slate-200 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                View Time (sec)
              </label>
              <input
                type="number"
                value={ad.view_time}
                onChange={(e) =>
                  onUpdate({ view_time: parseInt(e.target.value) || 0 })
                }
                className="block w-full rounded-lg border border-slate-200 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cost Per Click
              </label>
              <div className="relative rounded-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={ad.cost_per_click}
                  onChange={(e) =>
                    onUpdate({ cost_per_click: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full rounded-lg border border-slate-200 pl-7 pr-4 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ROI
              </label>
              <input
                type="number"
                step="0.01"
                value={ad.roi}
                onChange={(e) =>
                  onUpdate({ roi: parseFloat(e.target.value) || 0 })
                }
                className="block w-full rounded-lg border border-slate-200 focus:border-[#4A90A4] focus:ring-[#4A90A4] sm:text-sm h-11 bg-white px-3"
              />
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
