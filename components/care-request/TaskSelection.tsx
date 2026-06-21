"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, ClipboardList, CheckSquare, AlertCircle } from "lucide-react";

interface TaskSelectionProps {
  careType: string;
  tasks: string[];
  onChangeTasks: (newTasks: string[]) => void;
  error?: string;
}

export default function TaskSelection({ careType, tasks, onChangeTasks, error }: TaskSelectionProps) {
  const t = useTranslations("bookingForm");
  const [customTask, setCustomTask] = useState("");

  let recommendations: string[] = [];
  if (careType) {
    try {
      const rawRecs = t.raw(`tasks.recommendations.${careType}`);
      if (Array.isArray(rawRecs)) {
        recommendations = rawRecs;
      }
    } catch (e) {
      console.warn("Could not load recommendations for careType:", careType, e);
    }
  }

  const handleAddTask = (taskText: string) => {
    const trimmed = taskText.trim();
    if (!trimmed) return;
    if (tasks.includes(trimmed)) return;
    onChangeTasks([...tasks, trimmed]);
  };

  const handleRemoveTask = (taskText: string) => {
    onChangeTasks(tasks.filter((t) => t !== taskText));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask(customTask);
      setCustomTask("");
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-sand-high/60">
        <ClipboardList className="w-5 h-5 text-[#005c53]" />
        <div className="space-y-0.5">
          <h3 className="font-display font-bold text-[#012d1d] text-lg flex items-center gap-1">
            {t("tasks.title")} <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-gray-400 font-semibold">
            {t("tasks.subtitle")}
          </p>
        </div>
      </div>

      {/* Recommended suggestions */}
      {recommendations.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-gray-500">{t("tasks.recommended")}</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((rec) => {
              const isSelected = tasks.includes(rec);
              return (
                <button
                  key={rec}
                  type="button"
                  onClick={() => isSelected ? handleRemoveTask(rec) : handleAddTask(rec)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#005c53] bg-[#005c53]/5 text-[#005c53]"
                      : "border-sand-highest text-gray-600 hover:border-[#005c53]/40 bg-gray-50/50"
                  }`}
                >
                  <CheckSquare className={`w-3.5 h-3.5 ${isSelected ? "text-[#005c53] fill-current text-white" : "text-gray-400"}`} />
                  {rec}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Task Input container containing the field and validation error */}
      <div className="space-y-1.5 flex flex-col">
        <div className="flex gap-2">
          <input
            type="text"
            value={customTask}
            onChange={(e) => setCustomTask(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t("tasks.placeholder")}
            className={`flex-1 bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-sand-highest"
            }`}
          />
          <button
            type="button"
            onClick={() => {
              handleAddTask(customTask);
              setCustomTask("");
            }}
            className="bg-[#005c53] hover:bg-[#00473c] text-white px-5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>{t("tasks.addButton")}</span>
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1.5 font-bold mt-1 pl-1 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </p>
        )}
      </div>

      {/* Added Tasks List */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500">{t("tasks.tasksAdded")} ({tasks.length})</p>
        
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50/30 p-3 border border-dashed border-gray-100 rounded-xl">
            {t("tasks.emptyTasks")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tasks.map((task) => (
              <div
                key={task}
                className="flex items-center justify-between p-3 bg-[#fcf9f6]/60 border border-sand-high rounded-xl gap-2 animate-fade-in"
              >
                <span className="text-xs font-semibold text-gray-700 leading-relaxed">
                  {task}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTask(task)}
                  className="text-gray-400 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
