# theme-consistent-ui Specification

## Purpose
TBD - created by archiving change ui-theme-consistency-fix. Update Purpose after archive.
## Requirements
### Requirement: Transcript Details modal uses theme-aware background
The modal panel for Transcript Details SHALL use `var(--bg-surface)` as its background color instead of any hardcoded hex value, ensuring correct rendering in both light and dark modes.

#### Scenario: Transcript Details opens in light mode
- **WHEN** the user opens a transcript from the Library in light mode
- **THEN** the modal panel background SHALL be white (`#ffffff`) as provided by `--bg-surface` in light mode

#### Scenario: Transcript Details opens in dark mode
- **WHEN** the user opens a transcript from the Library in dark mode
- **THEN** the modal panel background SHALL be the dark surface color (`#0f0f11`) as provided by `--bg-surface` in dark mode

---

### Requirement: Confirm card (clear modal) is aligned to new design language
The clear-session confirmation card SHALL use design system CSS variables for all colors and the action buttons SHALL be uniformly sized with standard pill geometry and appropriate font sizing on all viewports including mobile.

#### Scenario: Confirm card renders on desktop
- **WHEN** the user triggers the clear action on a desktop viewport
- **THEN** the confirm card SHALL display a centered modal with theme-correct background, legible body text, and two side-by-side action buttons of equal size

#### Scenario: Confirm card renders on mobile
- **WHEN** the user triggers the clear action on a viewport narrower than 480px
- **THEN** the action buttons SHALL stack vertically and span the full card width with no layout overflow or text truncation

---

### Requirement: Danger solid button uses design token and correct sizing
The `.btn-danger-solid` class SHALL use `var(--red)` as its background color and SHALL apply the same font size and padding as other standard buttons (`0.875rem` / `10px 20px`) to prevent text overflow on mobile.

#### Scenario: Delete/clear button displays correctly on mobile
- **WHEN** the confirm card is open on a narrow viewport (< 480px)
- **THEN** the "Clear Everything" button SHALL fit within its container without text overflow, clipping, or font size inconsistency relative to the Cancel button

---

### Requirement: No green color accents appear in the interface
The application SHALL NOT use green color values (`--green`, `--green-dim`, or any `rgba(52,211,153,…)` literal) in any interactive or feedback element visible to the user.

#### Scenario: Save button hover state uses neutral accent
- **WHEN** the user hovers over the Save (checkmark) button in the dock
- **THEN** the button SHALL apply `var(--accent-dim)` background and `var(--accent)` color, with no green tint

#### Scenario: Saved confirmation banner uses neutral styling
- **WHEN** a transcript is successfully saved
- **THEN** the feedback banner SHALL display in a neutral style (no green background or green text) while remaining visually distinct from the default and error states

---

### Requirement: Studio Status box is removed from the UI
The floating status bubble ("listening…", "connecting…") that appears above the transport dock SHALL be completely removed from the interface.

#### Scenario: Recording is active without status bubble
- **WHEN** the user starts recording
- **THEN** no floating status text pill SHALL appear above or below the dock; recording state SHALL be communicated solely through the dock button's visual state (pulse-ring, stop icon)

---

### Requirement: Library delete button fires correctly
The delete button inside each library card's action area SHALL respond to user clicks and trigger the delete confirmation dialog without being intercepted by the card's own click handler.

#### Scenario: Delete button click in library list
- **WHEN** the user clicks the "Delete" button on a library card
- **THEN** the browser SHALL display a confirmation dialog and, upon confirmation, the transcript SHALL be removed from the list without navigating away or opening the transcript detail view

#### Scenario: Delete button click in Transcript Details modal
- **WHEN** the user clicks "Delete File" in the Transcript Details modal footer
- **THEN** the confirmation dialog SHALL appear and, upon confirmation, the transcript SHALL be deleted and the modal SHALL close

---

### Requirement: Consistent horizontal padding on mobile
All primary content containers — `app-main`, `library-body`, and `modal-body` — SHALL have at least `1.25rem` horizontal padding on viewports narrower than 480px, preventing content from bleeding to the screen edge.

#### Scenario: App main area on narrow mobile
- **WHEN** the viewport width is 375px
- **THEN** the main content area SHALL have at least 1.25rem left and right padding, with no element visually touching the screen edge

#### Scenario: Library body on narrow mobile
- **WHEN** the Library drawer is open on a 375px viewport
- **THEN** the transcript list items SHALL have at least 1.25rem horizontal padding from the drawer edge

#### Scenario: Transcript Details modal body on narrow mobile
- **WHEN** the Transcript Details modal is open on a 375px viewport
- **THEN** the transcript content inside the modal body SHALL have at least 1.25rem horizontal padding

