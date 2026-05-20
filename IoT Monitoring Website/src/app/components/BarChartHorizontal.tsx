import React from 'react';
import { CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

interface BarData {
  day?: string;
  label?: string;
  value: number;
  maxValue: number;
}

interface BarChartHorizontalProps {
  data: BarData[];
}

export function BarChartHorizontal({ data }: BarChartHorizontalProps) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const label = item.label || item.day || `Hari ${index + 1}`;
        const percentage = Math.round((item.value / item.maxValue) * 100);
        
        // Dynamic styling & color palette based on achievement percentage
        let barColorClass = "from-rose-500 to-amber-500";
        let badgeColorClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        let statusText = "Rendah";
        let Icon = AlertCircle;

        if (percentage >= 85) {
          barColorClass = "from-emerald-400 via-teal-500 to-cyan-500";
          badgeColorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
          statusText = "Target Tercapai";
          Icon = CheckCircle2;
        } else if (percentage >= 60) {
          barColorClass = "from-blue-500 via-indigo-500 to-violet-500";
          badgeColorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
          statusText = "Optimal";
          Icon = TrendingUp;
        }

        return (
          <div 
            key={index} 
            className="group relative bg-gray-900/40 hover:bg-gray-700/30 border border-gray-800 hover:border-gray-700 p-4 rounded-xl transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 shadow-inner"
          >
            {/* Day Label & Status Badge */}
            <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-36 shrink-0">
              <span className="font-semibold text-gray-200 text-sm tracking-wide group-hover:text-white transition-colors">
                {label}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${badgeColorClass}`}>
                <Icon size={12} />
                {statusText}
              </span>
            </div>

            {/* Progress Track & Bar */}
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="group-hover:text-gray-300 transition-colors">Progress Harian</span>
                <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{percentage}%</span>
              </div>
              <div className="relative w-full bg-gray-950/80 rounded-full h-3 overflow-hidden p-[2px] border border-gray-800">
                <div
                  className={`bg-gradient-to-r ${barColorClass} h-full rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Detailed Values */}
            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-36 shrink-0 text-right">
              <div className="flex flex-col text-left md:text-right">
                <span className="text-sm font-black text-white tracking-tight">
                  {item.value} <span className="text-xs font-normal text-gray-400">/ {item.maxValue}</span>
                </span>
                <span className="text-[10px] text-gray-500">Box Container</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
