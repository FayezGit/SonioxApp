## 1. Fix Modal Panel Theme Awareness

- [x] 1.1 In `globals.css`, replace the hardcoded `background: #151b2b` on `.modal-panel` with `background: var(--bg-surface)`
- [x] 1.2 Ensure `.modal-panel` border uses `var(--glass-border)` and box-shadow uses theme-appropriate rgba values (no hardcoded dark-only values)
- [x] 1.3 Verify `.modal-header`, `.modal-body`, and `.modal-footer` all reference theme tokens — not hardcoded colors

## 2. Fix Confirm Card and Danger Solid Button

- [x] 2.1 In `globals.css`, update `.btn-danger-solid` to use `var(--red)` instead of the hardcoded `#ef4444`
- [x] 2.2 In `.confirm-actions .btn-primary, .confirm-actions .btn-secondary`, set `font-size: 0.875rem` and `padding: 10px 20px` (remove `!important` overrides where possible; keep only what's needed)
- [x] 2.3 Add a `@media (max-width: 480px)` rule under `.confirm-actions` to stack the buttons vertically (`flex-direction: column`) and set `width: 100%` on each button

## 3. Remove Green Color Accents

- [x] 3.1 In `globals.css`, change `.save-btn:hover:not(:disabled)` to use `var(--accent-dim)` background and `var(--accent)` color (remove `var(--green-dim)` and `var(--green)` references)
- [x] 3.2 Remove the green box-shadow line from `.save-btn:hover:not(:disabled)` (`0 0 16px var(--green-dim)`)
- [x] 3.3 In `globals.css`, update `.alert-saved` to use `var(--accent-dim)` as background and `var(--accent)` as text color; replace the green border (`rgba(52,211,153,0.3)`) with `var(--glass-border)`

## 4. Remove Studio Status Box

- [x] 4.1 In `TranscriptionStudio.tsx`, remove the entire `{isRecording && (<div className="studio-status-box">…</div>)}` JSX block (lines ~594–606)
- [x] 4.2 In `TranscriptionStudio.tsx`, remove the `dotCount` state (`useState(3)`) and the `useEffect` that cycles it (lines ~28–37), since they are only used by the status box
- [x] 4.3 In `globals.css`, remove the `.studio-status-box` CSS rule block and the `@keyframes status-breath` animation
- [x] 4.4 In `globals.css`, remove `.status-text-italic` and `.anim-dots` CSS classes

## 5. Fix Library Delete Button

- [x] 5.1 In `Library.tsx`, add `e.stopPropagation()` as the first line inside each delete button's `onClick` handler in the library card list (before calling `handleDelete(t.id)`)
- [x] 5.2 In `Library.tsx`, add `e.stopPropagation()` inside the delete button's `onClick` in the modal footer as well (before calling `handleDelete(activeTranscript.id)`)
- [x] 5.3 Replace `className="badge badge-blue"` with `className="badge"` or a theme-neutral badge variant on duration badges in `Library.tsx` to remove the blue accent color

## 6. Standardize Mobile Horizontal Padding

- [x] 6.1 In `globals.css`, under the `@media (max-width: 480px)` block, ensure `.app-main` has `padding-inline: 1.25rem` (or explicit `padding-left` / `padding-right: 1.25rem`)
- [x] 6.2 Add a `@media (max-width: 480px)` rule for `.library-body` with `padding: 1rem 1.25rem`
- [x] 6.3 Add a `@media (max-width: 480px)` rule for `.modal-body` with `padding: 1rem 1.25rem`
- [x] 6.4 Verify `.library-panel` on mobile (`max-width: 100%`) does not introduce horizontal scroll — confirm padding is inside the panel width

## 7. Verify and Smoke Test

- [x] 7.1 Toggle between light and dark mode and confirm the Transcript Details modal renders correctly in both
- [x] 7.2 Trigger the Clear session confirm modal on both desktop and mobile widths; verify button layout and sizing
- [x] 7.3 Save a transcript and confirm no green banner appears; confirm the saved notification uses the correct theme colors
- [x] 7.4 Start a recording session and verify no status bubble appears above the dock
- [x] 7.5 Open the Library, click the Delete button on a card, and confirm the confirmation dialog fires and the transcript is removed
- [x] 7.6 Open a Transcript Details modal, click "Delete File", and confirm it works correctly
- [x] 7.7 Test on a 375px-wide viewport and confirm no horizontal overflow in any section
