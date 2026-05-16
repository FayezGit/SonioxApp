"use client";

import { useState } from "react";
import TranscriptionStudio from "@/components/TranscriptionStudio";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'dashboard'>('studio');

  return (
    <div className="min-h-screen p-8 sm:p-20 font-sans">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Soniox<span className="text-blue-500">App</span></h1>
        <nav className="flex gap-6 bg-white/5 p-1 rounded-full border border-white/10">
          <button onClick={() => setActiveTab('studio')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'studio' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Studio</button>
          <button onClick={() => setActiveTab('library')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'library' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Library</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Dashboard</button>
        </nav>
      </header>
      
      <main className="flex flex-col gap-8 items-center sm:items-start w-full">
        {activeTab === 'studio' && <TranscriptionStudio />}
        {activeTab === 'library' && <div className="text-center w-full mt-24 text-gray-500 text-lg">Library coming soon...</div>}
        {activeTab === 'dashboard' && <div className="text-center w-full mt-24 text-gray-500 text-lg">Dashboard coming soon...</div>}
      </main>
    </div>
  );
}
