"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  name: string;
  label: string;
  icon: string;
  defaultValue: string;
  options: Option[];
}

export default function CustomSelect({
  name,
  label,
  icon,
  defaultValue,
  options,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update selection if default value changes
  useEffect(() => {
    setSelected(defaultValue);
  }, [defaultValue]);

  const selectedOption = options.find((o) => o.value === selected) || options[0];

  return (
    <div
      ref={containerRef}
      className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center gap-2 relative cursor-pointer select-none min-h-[72px] hover:border-stitch-outline/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-200"
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="material-symbols-outlined text-[#005f56] text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="block text-[9px] font-bold text-stitch-on-surface-variant/40 tracking-wider uppercase">
          {label}
        </span>
        <span className="block text-xs font-extrabold text-stitch-on-surface truncate mt-0.5">
          {selectedOption.label}
        </span>
      </div>
      <span
        className={`material-symbols-outlined text-stitch-on-surface-variant/40 transition-transform shrink-0 ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        expand_more
      </span>

      {/* Hidden native input for form submission */}
      <input type="hidden" name={name} value={selected} />

      {/* Styled custom dropdown menu with deep drop shadow */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-50 py-1.5 max-h-60 overflow-y-auto animate-fade-in">
          {options.map((option) => {
            const isSelected = option.value === selected;
            return (
              <div
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${
                  isSelected ? "text-[#005f56] bg-[#005f56]/5" : "text-stitch-on-surface"
                }`}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
