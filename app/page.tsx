"use client";

import { useState } from "react";
import TranscriptionStudio from "@/components/TranscriptionStudio";
import Library from "@/components/Library";

type Tab = 'studio' | 'library';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  return (
    <div className="app-shell">
      {/* Sidebar / Header */}
      <header className="app-header">
        <nav className="app-nav">
          {(['studio', 'library'] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`nav-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`nav-btn${activeTab === tab ? ' active' : ''}`}
            >
              <span className="nav-icon">
                {tab === 'studio'  && '🎙'}
                {tab === 'library' && '📚'}
              </span>
              <span className="nav-text">
                {tab === 'studio'  && (tab === 'studio' ? 'Studio' : '')}
                {tab === 'library' && (tab === 'library' ? 'Library' : '')}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="app-main">
        {activeTab === 'studio'  && <TranscriptionStudio />}
        {activeTab === 'library' && <Library />}
      </main>
    </div>
  );
}
