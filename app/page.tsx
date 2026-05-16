"use client";

import { useState } from "react";
import TranscriptionStudio from "@/components/TranscriptionStudio";
import Library from "@/components/Library";

type Tab = 'studio' | 'library';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  return (
    <div className="app-shell">
      {/* Sticky header */}
      <header className="app-header">
        <div className="app-logo">
          Soniox<span>App</span>
        </div>

        <nav className="app-nav">
          {(['studio', 'library'] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`nav-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`nav-btn${activeTab === tab ? ' active' : ''}`}
            >
              {tab === 'studio'  && '🎙 Studio'}
              {tab === 'library' && '📚 Library'}
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
