## Context

The current transcription application uses a dark-blue glassmorphism sidebar-and-panel dashboard layout. It has responsiveness limitations on mobile and a visual theme that clashes with the red recording indicators. We are restructuring the layout into a "zero chrome" canvas with a custom Light and Dark theme using Black, White, and Red accents.

## Goals / Non-Goals

**Goals:**
- Implement a minimalist, "zero chrome" full-bleed text canvas.
- Provide a dual-theme toggle (Light and Dark) that automatically inherits system preferences and persists in `localStorage`.
- Restrict Red accents solely to active recording states, destructive actions (Clear, Delete), and error alerts.
- Optimize the layout to be fully responsive and touch-ergonomic on mobile viewports.

**Non-Goals:**
- Modifying the IndexedDB database schema or storage mechanisms (Dexie.js).
- Changing backend token generation or audio capture stream logic.
- Editing text segment generation, Speaker Diarization algorithms, or export formatting.

## Decisions

### 1. Theme Configuration via Root Attributes
- **Decision:** Manage the dual themes (Light and Dark) using a `data-theme` root attribute on `<html>`. In `globals.css`, define default light variables under `:root` and dark mode overrides under `:root[data-theme='dark']` and `@media (prefers-color-scheme: dark)`.
- **Alternatives Considered:** Multiple CSS class names or inline React style injection.
- **Rationale:** Using standard CSS variables ensures theme changes compile instantly across all components without recalculating component states or triggering React re-renders.

### 2. Layout Structure Simplification
- **Decision:** Completely remove the 280px sidebar layout and the header bar.
- **Alternatives Considered:** A collapsable sidebar or dynamic top header bar.
- **Rationale:** The application only contains two view modes (Studio and Library). A floating, borderless top-right icon cluster is far cleaner and keeps the canvas zero-distraction.

### 3. Floating Control Dock
- **Decision:** Place all recording and action triggers in a single bottom-centered floating pill.
- **Alternatives Considered:** Docking controls at the bottom of the screen or inside a standard footer.
- **Rationale:** A floating dock elevates controls visually, keeps them easily reachable on mobile touchscreens, and frees up vertical screen space.

### 4. Overlap Library Sheet
- **Decision:** Render the Library as a sliding overlay panel rather than a separate page. It can be dismissed by clicking a close ('X') button inside the panel, clicking the translucent backdrop, pressing the Escape key, or selecting an item to load.
- **Alternatives Considered:** Completely replacing the page contents or rendering in a center modal.
- **Rationale:** Slide-overs maintain the editor's visual context behind them, make transitions feel cohesive, and offer intuitive dismissal patterns.

## Risks / Trade-offs

- **[Risk]** Floating dock blocking the bottom of the transcript text.
  - **Mitigation:** Apply a dynamic padding-bottom to the transcript canvas matching the dock's height plus margins.
- **[Risk]** Unintentional data clears when the sidebar navigation is removed.
  - **Mitigation:** Ensure the destructive "Clear" action has a double-confirm modal wrapper using red caution indicators.
