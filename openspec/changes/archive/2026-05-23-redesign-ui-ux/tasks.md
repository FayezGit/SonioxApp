## 1. Theme Configuration & Styling

- [x] 1.1 Update `app/globals.css` with Light and Dark variables for `--bg-base`, `--bg-surface`, `--bg-card`, `--text-primary`, `--text-secondary`, `--accent`, `--red`, `--overlay-bg`, and `--glass-border`.
- [x] 1.2 Update speaker color variables (`--speaker-1` to `--speaker-4`) in `app/globals.css` with the new high-contrast red, black, and gray variables.
- [x] 1.3 Modify hardcoded layout background values in `app/globals.css` (e.g. modals, status boxes, select elements) to use the new CSS variables.

## 2. Layout Structure & Navigation Refactor

- [x] 2.1 Modify `app/page.tsx` to remove the 280px sidebar, sidebar header, and text headers.
- [x] 2.2 Add initial theme detection and `localStorage` persistence logic inside `app/page.tsx`.
- [x] 2.3 Implement the floating top-right utility menu (Library Toggle, Theme Toggle) inside `app/page.tsx`.
- [x] 2.4 Update layout classes in `app/globals.css` to make the main content wrapper take up the full screen width and height.

## 3. Transcription Studio Refactor

- [x] 3.1 Refactor `components/TranscriptionStudio.tsx` to display the transcript area as a full-bleed document layout.
- [x] 3.2 Redesign the action triggers (Record, Save, Clear) into a floating centered command dock pill at the bottom.
- [x] 3.3 Update the recording state and waveform layout to fit within the bottom dock.
- [x] 3.4 Update button styling in `components/TranscriptionStudio.tsx` to map correctly to the Light/Dark/Red theme rules.

## 4. Overlay Library & Modals Refactor

- [x] 4.1 Update `components/Library.tsx` to slide in as an overlay panel and support dismissal (close button, backdrop click, Escape key, and auto-dismiss on selection).
- [x] 4.2 Restructure the library card items to use the high-contrast light and dark borders.
- [x] 4.3 Verify modal confirm overlay backgrounds and delete actions use the correct warning accents.

## 5. Verification & Testing

- [x] 5.1 Run the local server and verify responsive layout rendering in both desktop and mobile viewports.
- [x] 5.2 Test theme toggling and confirm persistence of preferences in localStorage.
- [x] 5.3 Verify that red accents are only shown on active recording indicators, error views, and clear/delete actions.
