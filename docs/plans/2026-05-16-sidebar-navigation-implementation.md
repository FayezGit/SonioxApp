# Sidebar & Bottom Bar Navigation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transition the application navigation to a fixed sidebar on desktop and a fixed bottom bar on mobile.

**Architecture:** Use CSS Flexbox on the main `.app-shell` to switch between `column` (mobile) and `row` (desktop) layouts. Use media queries to reposition the navigation container.

**Tech Stack:** React, Vanilla CSS, Next.js.

---

### Task 1: Update App Shell and Global Layout
**Files:**
- Modify: `app/globals.css:110-129`

**Step 1: Update .app-shell to be responsive**
```css
.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column; /* Mobile first */
  overflow-x: hidden;
}

@media (min-width: 1024px) {
  .app-shell {
    flex-direction: row; /* Desktop sidebar */
  }
}
```

**Step 2: Update .app-header for responsive positioning**
```css
.app-header {
  position: fixed;
  z-index: 50;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  transition: all var(--ease);
}

/* Mobile Bottom Bar */
@media (max-width: 1023px) {
  .app-header {
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
    border-width: 1px 0 0 0;
    justify-content: center;
  }
}

/* Desktop Sidebar */
@media (min-width: 1024px) {
  .app-header {
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    padding: 2.5rem 1.5rem;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    border-width: 0 1px 0 0;
    background: var(--bg-surface);
  }
}
```

**Step 3: Commit**
```bash
git add app/globals.css
git commit -m "style: make app shell and header responsive for sidebar/bottom bar"
```

---

### Task 2: Refactor Navigation Component and Buttons
**Files:**
- Modify: `app/globals.css:142-195`

**Step 1: Update .app-nav for responsive layouts**
```css
.app-nav {
  display: flex;
  gap: 4px;
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;
}

@media (max-width: 1023px) {
  .app-nav {
    flex-direction: row;
    width: 100%;
    max-width: 400px;
    justify-content: space-around;
  }
}

@media (min-width: 1024px) {
  .app-nav {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    margin-top: 2rem;
  }
}
```

**Step 2: Update .nav-btn for sidebar/bottom bar**
```css
.nav-btn {
  width: auto;
  padding: 10px 18px;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--ease);
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1023px) {
  .nav-btn {
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
    padding: 8px;
    flex: 1;
  }
  .nav-icon { font-size: 1.25rem; }
}

@media (min-width: 1024px) {
  .nav-btn {
    width: 100%;
    justify-content: flex-start;
  }
  .nav-btn:hover {
    background: var(--glass-hover);
    color: var(--text-primary);
  }
}
```

**Step 3: Commit**
```bash
git add app/globals.css
git commit -m "style: refactor navigation buttons for sidebar and bottom bar"
```

---

### Task 3: Update Page Structure and Main Content
**Files:**
- Modify: `app/page.tsx:15-35`
- Modify: `app/globals.css:196-203`

**Step 1: Add Logo and adjust structure in app/page.tsx**
```tsx
      <header className="app-header">
        <div className="app-logo" style={{ marginBottom: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎙</span> Soniox <span>Studio</span>
        </div>
        <nav className="app-nav">
          {/* ... existing nav mapping ... */}
        </nav>
      </header>
```

**Step 2: Adjust .app-main padding for fixed navs**
```css
.app-main {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 2.5rem 1.5rem 6rem; /* extra bottom padding for mobile */
}

@media (min-width: 1024px) {
  .app-main {
    margin-left: 280px; /* Offset for sidebar */
    max-width: calc(100% - 280px);
    padding: 4rem 3rem;
  }
}
```

**Step 3: Commit**
```bash
git add app/page.tsx app/globals.css
git commit -m "feat: update page structure and main content offsets"
```

---

### Task 4: Verification and Final Polish
**Files:**
- Modify: `app/globals.css` (any remaining cleanup)

**Step 1: Verify layout on different breakpoints**
- Check desktop (>=1024px) for sidebar.
- Check mobile (<1024px) for bottom bar.

**Step 2: Ensure glassmorphism consistency**
- Check that the bottom bar blur doesn't conflict with other elements.

**Step 3: Commit**
```bash
git add .
git commit -m "chore: final navigation layout polish"
```
