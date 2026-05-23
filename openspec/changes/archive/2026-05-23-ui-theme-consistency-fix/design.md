## Context

The Soniox transcription app recently completed a major design overhaul adopting a zero-chrome, high-contrast Black/White/Red aesthetic with CSS custom properties (design tokens) defined in `globals.css`. However, several UI pieces were not fully migrated during that effort:

- `modal-panel` has a hardcoded `#151b2b` dark navy background — unaware of the light/dark theme.
- `.btn-danger-solid` in the confirm modal uses hardcoded hex red and produces oversized text on mobile.
- `.save-btn:hover` and `.alert-saved` use `--green` / `--green-dim` colors that contradict the monochrome palette.
- The `studio-status-box` is a floating status bubble above the dock that was part of an earlier design iteration and conflicts with the clean dock layout.
- The library delete button does not fire because a parent `onClick={stopCardClick}` wrapper absorbs events, and `.btn-danger-soft` styling has no `pointer-events` issue but the inner confirm() dialog is blocked when the event wrapper is misrouted.
- Mobile padding is missing in several containers: `library-body`, `modal-body`, and the `app-main` column at `< 480px`.

The design system uses CSS custom properties throughout. All component styles are co-located in `app/globals.css`. Components are in `components/`.

## Goals / Non-Goals

**Goals:**
- Replace all hardcoded color values (`#151b2b`, `#ef4444` literals, `rgba(52,211,153,…)`) with the appropriate design tokens (`var(--bg-surface)`, `var(--red)`, `var(--accent)`, etc.).
- Fix the confirm modal's mobile button layout and text sizing.
- Remove the Studio Status Box JSX and its CSS class entirely.
- Resolve the library delete button click event issue.
- Standardize horizontal padding on mobile across all content containers.
- Replace all green color accents (save button hover, saved alert) with neutral or red-palette alternatives.
- Ensure the Transcript Details modal is fully theme-aware (light + dark).

**Non-Goals:**
- Redesigning the information architecture or feature set.
- Changing any API, state management, or data layer code.
- Adding new animations or interaction patterns not already in the system.
- Accessibility overhaul (ARIA improvements are welcome but not the primary focus).

## Decisions

### D1: Use CSS variables exclusively — no hardcoded hex values in component styles

**Decision**: All color values in `.modal-panel`, `.btn-danger-solid`, `.alert-saved`, and related classes will be converted to CSS custom property references. Hardcoded hex values will be removed.

**Rationale**: The design token system already exists and handles light/dark switching correctly. Hardcoded values break this automatically — they create a maintenance surface and produce incorrect rendering in the opposite theme mode.

**Alternative considered**: Conditionally applying different classes via `data-theme` selectors — rejected because it duplicates values and is harder to maintain than a single token reference.

---

### D2: Replace green accents with neutral accent or red alternatives

**Decision**:
- `.save-btn:hover` → use `var(--accent-dim)` / `var(--accent)` instead of `var(--green-dim)` / `var(--green)`.
- `.alert-saved` → use a neutral dark pill badge with a ✓ checkmark in `var(--text-primary)` rather than a green banner.

**Rationale**: Green is explicitly outside the B/W/R palette. The saved state is a positive confirmation, which can be communicated through the checkmark icon and neutral styling without introducing an out-of-palette hue.

---

### D3: Remove studio-status-box entirely

**Decision**: Delete the `studio-status-box` div from `TranscriptionStudio.tsx` and remove the `.studio-status-box` + `.status-text-italic` + `.anim-dots` classes from `globals.css`.

**Rationale**: The status information (listening/connecting) is already surfaced by the dock button state (pulse-ring, spinner, stop icon). The floating pill above the dock creates visual noise and conflicts with the cleaner zero-chrome direction. Recording state is unambiguous without it.

---

### D4: Fix library delete button via event propagation correction

**Decision**: The `library-card-actions` div wraps buttons with `onClick={stopCardClick}`. The delete button's `onClick` calls `handleDelete(t.id)` which calls `confirm()` — this works correctly, but the issue is that in some environments `confirm()` is synchronous and the card-level click isn't the blocker. The real bug is that the delete button in the Library card is wrapped correctly but the `handleDelete` function uses `await deleteTranscript(id)` — confirmed the wiring is correct. The fix is to ensure `stopCardClick` is applied only to the wrapper `div`, not swallowing the button events. No code change needed if testing reveals the buttons fire — but we will add an explicit `e.stopPropagation()` to each button's own `onClick` as a defensive guard.

**Alternative considered**: Restructuring the card layout to pull action buttons outside the card click zone — deferred as structural overkill for a single bug.

---

### D5: Standardize mobile padding with `padding-inline`

**Decision**: Use `padding-inline: 1.25rem` on `app-main`, `library-body`, and `modal-body` at `max-width: 480px` breakpoint. The floating dock already handles its own safe-area padding.

**Rationale**: Consistent horizontal breathing room prevents content from touching screen edges on narrow viewports. `padding-inline` is well-supported and semantically clearest for horizontal-only adjustments.

## Risks / Trade-offs

- **Green removal visible regression** → The green saved banner was a strong positive signal. Replacing with neutral styling may feel less celebratory. Mitigation: keep the ✓ icon prominent and ensure the neutral styling is still visually distinct from error/default states.
- **Status box removal information loss** → Users who relied on the floating "listening…" text for feedback lose that signal. Mitigation: the pulse-ring animation on the stop button and the waveform bars (if kept in dock) still communicate active recording clearly.
- **`confirm()` dialog in Library** → Using the native browser `confirm()` for delete feels inconsistent with the custom confirm modal used in the studio. Left as-is for this change; a future task could unify these into a shared confirmation component.
