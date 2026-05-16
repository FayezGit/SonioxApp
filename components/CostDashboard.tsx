"use client";

import React, { useState, useEffect } from 'react';

interface UsageData {
  month_to_date_seconds: number;
  estimated_cost_usd: number;
  currency: string;
  sessions_count: number;
}

export default function CostDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => res.json())
      .then((data) => {
        setUsage(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch usage', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-3xl font-bold mb-8">Cost Dashboard</h2>
      
      {loading ? (
        <p className="text-gray-400 animate-pulse text-center py-12">Loading usage data...</p>
      ) : usage && !usage.hasOwnProperty('error') ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-panel p-8 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
            <h3 className="text-lg text-gray-400 mb-2">Audio Processed</h3>
            <p className="text-4xl font-bold text-blue-400">{(usage.month_to_date_seconds / 60).toFixed(1)} <span className="text-xl">min</span></p>
            <p className="text-sm text-gray-500 mt-2">{usage.sessions_count} sessions</p>
          </div>
          <div className="glass-panel p-8 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
            <h3 className="text-lg text-gray-400 mb-2">Estimated Cost</h3>
            <p className="text-4xl font-bold text-green-400">${usage.estimated_cost_usd.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">{usage.currency}</p>
          </div>
        </div>
      ) : (
        <p className="text-red-400 text-center py-12">Failed to load usage data.</p>
      )}
      <p className="text-xs text-gray-500 mt-8 text-center max-w-md mx-auto leading-relaxed">
        Data is fetched from Soniox usage logs and calculated based on standard pricing. Real-time metrics might have a slight delay.
      </p>
    </div>
  );
}
