'use client';

import React from 'react';

const DashboardCharts = ({ data = null }) => {
  // Defensive check: Ensure data is an array before processing
  const isDataValid = Array.isArray(data) && data.length > 0;
  
  // Use real data from props, or a baseline if empty/all zeros
  const rawData = isDataValid && data.some(v => v > 0) ? data : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  // To make the chart look better even with small data, we ensure a minimum height reference
  const maxValue = Math.max(...rawData, 1000); 
  const width = 800;
  const height = 240;
  
  // Convert data points to SVG coordinates
  const points = rawData.map((val, i) => ({
    x: (i / (rawData.length - 1)) * width,
    y: height - (val / maxValue) * height,
  }));

  const pathData = points.reduce((acc, point, i) => 
    i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  , '');

  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-all hover:shadow-md animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Revenue Growth</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Real-time successful deposits over the current year.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/20"></span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Successful Deposits</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[240px]">
        {!data ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-800/10 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
             <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-zinc-400">Syncing History...</p>
             </div>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d overflow-visible drop-shadow-2xl">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path 
              d={areaData} 
              fill="url(#chartGradient)" 
              className="transition-all duration-1000 ease-in-out"
            />

            {/* Line Chart */}
            <path
              d={pathData}
              fill="none"
              stroke="#6366f1"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-in-out"
            />

            {/* Data Points (Dots) */}
            {points.map((p, i) => (
              <g key={i} className="group">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  className="fill-white dark:fill-zinc-900 stroke-indigo-500 stroke-[3] transition-all hover:r-8 cursor-help"
                />
                {rawData[i] > 0 && (
                   <text
                     x={p.x}
                     y={p.y - 15}
                     textAnchor="middle"
                     className="text-[10px] font-black fill-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     ₦{rawData[i].toLocaleString()}
                   </text>
                )}
              </g>
            ))}
          </svg>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
          <span key={i} className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${new Date().getMonth() === i ? 'text-indigo-600' : 'text-zinc-400'}`}>
            {month}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DashboardCharts;
