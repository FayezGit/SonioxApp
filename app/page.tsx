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
                {tab === 'studio' ? 'Studio' : 'Library'}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main content — both panels stay mounted to preserve recording state */}
      <main className="app-main">
        <div hidden={activeTab !== 'studio'}>
          <TranscriptionStudio />
        </div>
        <div hidden={activeTab !== 'library'}>
          <Library refreshKey={activeTab} />
        </div>
      </main>
    </div>
  );
}
