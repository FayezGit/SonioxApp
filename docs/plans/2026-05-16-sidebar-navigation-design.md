# Design Document: Sidebar & Bottom Bar Navigation

## Overview
Transition the application from a top-centered navigation bar to a responsive layout featuring a fixed sidebar on desktop and a bottom navigation bar on mobile.

## Requirements
- **Desktop (>= 1024px):** Fixed vertical sidebar on the left.
- **Mobile (< 1024px):** Fixed horizontal navigation bar at the bottom.
- **Styling:** Maintain glassmorphism aesthetic and smooth transitions.
- **Usability:** Ensure content is properly padded and accessible on all screen sizes.

## Architecture & Layout
The layout will rely on CSS Flexbox and media queries to reorder and reposition the navigation elements.

### 1. App Shell (`.app-shell`)
- **Desktop:** `display: flex; flex-direction: row;`
- **Mobile:** `display: flex; flex-direction: column;`

### 2. Navigation Container (`.app-header` / `.sidebar`)
- **Desktop:**
    - Width: `280px` (fixed).
    - Height: `100vh`.
    - Position: `sticky` or `fixed`.
    - Layout: `flex-direction: column`.
- **Mobile:**
    - Width: `100%`.
    - Height: `auto`.
    - Position: `fixed; bottom: 0;`.
    - Layout: `flex-direction: row`.
    - Z-index: `100` (ensure it stays above content).

### 3. Main Content (`.app-main`)
- **Desktop:** `flex: 1; overflow-y: auto;`
- **Mobile:** `padding-bottom: 80px;` (to clear the bottom bar).

## Components & Styling
- **Logo:** Add a dedicated logo section at the top of the sidebar for desktop.
- **Nav Buttons:**
    - Sidebar: Full width, left-aligned text, icon on the left.
    - Bottom Bar: Centered icons, labels below icons (optional based on space).
- **Glassmorphism:** Use `backdrop-filter: blur()` and semi-transparent backgrounds to maintain the premium feel.

## Implementation Steps
1. Update `app/globals.css` with new layout tokens and responsive classes.
2. Modify `app/page.tsx` to include the logo and adjust navigation structure.
3. Refactor component layouts to ensure responsiveness with the new sidebar/bottom bar.
