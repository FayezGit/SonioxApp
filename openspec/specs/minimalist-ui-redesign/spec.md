# minimalist-ui-redesign Specification

## Purpose
TBD - created by archiving change redesign-ui-ux. Update Purpose after archive.
## Requirements
### Requirement: Full-Bleed Editor Canvas
The application SHALL render the main workspace as a full-bleed, edge-to-edge canvas where transcription text flows down the page without any sidebar or header container.

#### Scenario: View clean workspace
- **WHEN** the application is loaded
- **THEN** no sidebar, navigation panel, or brand title header SHALL be visible, and the transcription page occupies the entire viewport.

### Requirement: Floating Top Utility Menu
The application SHALL render a floating utility cluster in the top-right corner containing a Library action button and a Theme Toggle button. These buttons SHALL be borderless and background-less by default.

#### Scenario: Open Library overlay
- **WHEN** the user clicks the floating Library button in the top-right corner
- **THEN** the Library view SHALL slide/fade open as an overlay over the current canvas.

### Requirement: Library Overlay Dismissal
The Library overlay SHALL provide clear, accessible mechanisms for dismissal, including a close button, clicking the backdrop, or pressing the Escape key, to return the user to the main canvas.

#### Scenario: Close Library overlay via close button
- **WHEN** the Library overlay is open and the user clicks the close icon button
- **THEN** the Library overlay SHALL close, restoring view to the main transcription canvas.

#### Scenario: Close Library overlay via backdrop click
- **WHEN** the Library overlay is open and the user clicks the background backdrop area outside the content card
- **THEN** the Library overlay SHALL close.

### Requirement: Floating Command Dock
The application SHALL render a centered, floating pill-shaped command dock at the bottom of the screen containing language selection, a prominent red record button, and context-dependent action buttons (Save/Clear).

#### Scenario: Expand dock during recording
- **WHEN** the user clicks the red Record button to start recording
- **THEN** the command dock SHALL display active waveform indicator, timer, and recording status.

### Requirement: Mobile Viewport Optimization
The application layout SHALL dynamically adjust to mobile screen sizes so that the full-bleed canvas and the bottom floating dock fit within the viewport height without layout clipping.

#### Scenario: Render mobile layout
- **WHEN** the page width is less than 768px
- **THEN** all elements in the floating command dock remain fully accessible and visible on a single screen without vertical viewport scroll requirements.

