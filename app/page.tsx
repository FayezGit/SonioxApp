"use client";

import { useState, useEffect } from "react";
import TranscriptionStudio from "@/components/TranscriptionStudio";
import Library from "@/components/Library";

export default function Home() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage or system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="app-shell">
      {/* Floating Top Utility cluster */}
      <div className="floating-utility-cluster">
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="utility-btn"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === "light" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <button
          id="library-toggle-btn"
          onClick={() => setIsLibraryOpen(true)}
          className="utility-btn"
          title="Open Library"
          aria-label="Open Library"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </button>
      </div>

      {/* Main text canvas */}
      <main className="app-main">
        <TranscriptionStudio />
      </main>

      {/* Slide-over library overlay */}
      <Library isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
    </div>
  );
}
