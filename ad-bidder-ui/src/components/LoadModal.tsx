"use client";

import { useState, useEffect } from "react";
import { Campaign, Ad } from "@/types";

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: Campaign[] | Ad[];
  type: "campaign" | "ad";
  onSelect: (items: (Campaign | Ad)[]) => void;
  isLoading: boolean;
  existingIds: number[]; // IDs of items already added (to filter out)
}

export default function LoadModal({
  isOpen,
  onClose,
  title,
  items,
  type,
  onSelect,
  isLoading,
  existingIds,
}: LoadModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filter out items that are already added
  const availableItems = items.filter(item => item.id !== undefined && !existingIds.includes(item.id));

  // Reset selection when modal opens/closes or items change
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItem = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    const allIds = availableItems
      .filter(item => item.id !== undefined)
      .map(item => item.id as number);
    setSelectedIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAddSelected = () => {
    const selectedItems = availableItems.filter(
      item => item.id !== undefined && selectedIds.has(item.id)
    );
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
    }
    onClose();
  };

  const allSelected = availableItems.length > 0 &&
    availableItems.every(item => item.id !== undefined && selectedIds.has(item.id));

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

        {/* Select All / Deselect All bar */}
        {!isLoading && availableItems.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-600">
              {selectedIds.size} of {availableItems.length} selected
            </span>
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="text-sm font-semibold text-[#1d3d5d] hover:text-[#4A90A4] transition-colors"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d3d5d]"></div>
            </div>
          ) : availableItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {items.length === 0
                ? `No ${type}s found in the database.`
                : `All ${type}s have already been added.`}
            </div>
          ) : (
            <ul className="space-y-2">
              {availableItems.map((item) => {
                const isSelected = item.id !== undefined && selectedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <label
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#1d3d5d] bg-[#1d3d5d]/5"
                          : "border-slate-200 hover:border-[#1d3d5d] hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => item.id !== undefined && toggleItem(item.id)}
                        className="w-5 h-5 rounded border-slate-300 text-[#1d3d5d] focus:ring-[#1d3d5d]"
                      />
                      <div className="flex-1">
                        {type === "campaign"
                          ? getCampaignSummary(item as Campaign)
                          : getAdSummary(item as Ad)}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selectedIds.size === 0}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              selectedIds.size > 0
                ? "bg-[#1d3d5d] text-white hover:bg-[#2a4f73]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Add Selected ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
