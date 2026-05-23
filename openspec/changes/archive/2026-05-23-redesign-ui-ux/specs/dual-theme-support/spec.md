## ADDED Requirements

### Requirement: Default Theme Detection
The system SHALL detect the browser's preferred color scheme on the initial page load and initialize the layout theme accordingly (Light or Dark).

#### Scenario: Init dark mode from system settings
- **WHEN** the user visits the site for the first time and their browser prefers dark color scheme
- **THEN** the root element is initialized with the dark theme.

### Requirement: Persistent Theme Selection
The system SHALL allow the user to toggle the current theme between Light and Dark modes manually, and save the preference in localStorage to persist across page reloads.

#### Scenario: Toggle and persist theme
- **WHEN** the user clicks the Theme Toggle button and reloads the page
- **THEN** the root element maintains the toggled theme state.

### Requirement: Red Accent Allocation
The system SHALL strictly restrict the use of red accents to active recording states, destructive actions (Clear, Delete), or warning/error messages in both light and dark modes.

#### Scenario: Action accent colors
- **WHEN** any button is rendered in the interface
- **THEN** only the Record button, the Clear action, Delete cards, and error indicators are allowed to use red highlights.
