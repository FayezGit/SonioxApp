## Why

The application underwent a major redesign to a high-contrast Black/White/Red zero-chrome aesthetic, but a set of legacy UI components and styles were never fully migrated. These remnants cause visual inconsistency, break the mobile layout, and expose old green color accents and hardcoded background colors that clash with the new design language.

## What Changes

- **Transcription panel**: Migrate remaining old-style borders, backgrounds, and padding to theme-aware CSS variables so it matches the redesigned surface style.
- **Confirm card (clear modal)**: Align the confirmation overlay card — including its backdrop, card surface, typography sizing, and button layout — to the new Black/White/Red design language.
- **`btn-danger-solid` (delete active transcription)**: Replace oversized font size and fix mobile layout collapse; ensure it uses the design system's `--red` variable and standard pill geometry.
- **Library delete button (broken)**: The `.btn-danger-soft` delete button in the library list and transcript details modal is not responding to clicks — fix the event propagation issue and confirm correct wiring.
- **Mobile horizontal padding**: Standardize `padding-inline` (or equivalent `padding-left`/`padding-right`) across `app-main`, `library-body`, `modal-body`, and floating dock on small screens so no content bleeds edge-to-edge.
- **Green color accents**: Remove all uses of `--green` / `--green-dim` from interactive states (`.save-btn:hover`, `.alert-saved`) and replace with appropriate neutral or accent-based styling that fits the theme.
- **Transcript Details modal**: Rebuild the `modal-panel` background — currently hardcoded to `#151b2b` — to use `var(--bg-surface)` and correct dark/light mode token usage throughout its header, body, and footer.
- **Studio Status box**: Remove the `.studio-status-box` floating indicator entirely; it is a legacy element that no longer fits the zero-chrome layout direction.

## Capabilities

### New Capabilities
- `theme-consistent-ui`: A fully theme-consistent UI layer covering all components — transcription panel, confirm modal, library card actions, transcript details modal, and floating dock — across both light and dark modes with correct CSS variable usage and no hardcoded legacy colors.

### Modified Capabilities
*(none — no spec-level behavior changes, this is entirely a visual/layout fix)*

## Impact

- **`app/globals.css`**: Primary target — update `.modal-panel`, `.btn-danger-solid`, `.save-btn`, `.alert-saved`, `.confirm-card`, `.confirm-actions`, `.transcript-panel`, `.studio-status-box`, and mobile media queries.
- **`components/TranscriptionStudio.tsx`**: Remove the `studio-status-box` JSX block; fix any inline styles that override theme variables.
- **`components/Library.tsx`**: Fix delete button click propagation; ensure `badge-blue` usages are replaced if they introduce unwanted blue accent color.
- No API, routing, or data-layer changes.
