## Why

The current user interface is built on a dark blue/slate theme with a heavy sidebar structure and boxed-in panels, which mimics a generic web dashboard rather than a focused, native-feeling audio transcription utility. This redesign aims to simplify the layout completely into a "zero chrome", minimalist blank-canvas editor featuring a custom dual light/dark color theme (Black, White, and Red) that is optimized for both desktop and mobile viewports.

## What Changes

- **Visual Layout:** Remove the sidebar, organization headers, and boxed-in panels entirely. Introduce a full-bleed text canvas that flows edge-to-edge.
- **Floating Controls (Transport Dock):** Shift the recording controls (Record button, Language selector, Save/Clear buttons, and status waveform) to a centered floating pill hovering at the bottom of the screen.
- **Top Utility Actions:** Add a floating cluster of borderless buttons in the top-right corner for sliding open the Library and toggling the color theme.
- **Responsive Optimization:** Redesign margins, paddings, and heights so that mobile users can see all transcription text and floating controls without awkward scrolling.
- **Dual-Theme Support:** Implement light mode (dominant white, complementary black) and dark mode (dominant black, complementary white), with crimson red strictly reserved for recording states, errors, and destructive actions (Clear, Delete).
- **Speaker Diarization Styling:** Update segment labels to use high-contrast shades of black, red, and gray.

## Capabilities

### New Capabilities
- `minimalist-ui-redesign`: Outlines the full-bleed canvas layout, floating controls, overlay library, and mobile responsive structure.
- `dual-theme-support`: Outlines the light and dark color variables, theme persistence, and specific rules for red accents.

### Modified Capabilities
<!-- None. No existing capabilities in openspec/specs/ are being modified. -->

## Impact

- **UI Components:** Affects `app/page.tsx`, `components/TranscriptionStudio.tsx`, and `components/Library.tsx`.
- **CSS Stylesheets:** Affects `app/globals.css`, modifying global color variables, layout rules, and adding theme-specific overrides.
- **No Backend/Logic Impact:** Core transcription logic, audio recording, IndexedDB storage, and Soniox client APIs remain completely unchanged.
