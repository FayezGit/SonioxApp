# Code Review Fix Tracker

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | `finalCharCount` never updated — stats footer dead | 🔴 Critical | ✅ done |
| 2 | Stale closure in `updateFinalDuration` (`sessionStartTime`) | 🔴 Critical | ✅ done |
| 3 | Token expiry not tracked — expired tokens fail silently | 🔴 Critical | ✅ done |
| 4 | No localStorage quota/size error surfaced to user | 🔴 Critical | ✅ done |
| 5 | Tab switch unmounts Studio, killing active recording | 🟡 Important | ✅ done |
| 6 | `speakerMap` mutated in `buildFinalSegments` (impure) | 🟡 Important | ✅ done |
| 7 | Array index used as key in `TranscriptView` | 🟡 Important | ✅ done |
| 8 | Library doesn't refresh when Studio saves a transcript | 🟡 Important | ✅ done |
| 9 | Duplicate scrollbar CSS rules | 🟡 Important | ✅ done |
| 10 | `package.json` name is `temp_app` | 🟡 Important | ✅ done |
| 11 | Missing `type="button"` on buttons in Studio | 🟢 Minor | ✅ done |
| 12 | `.alert-error` and `.alert-saved` defined twice in CSS | 🟢 Minor | ✅ done |
| 13 | Inline styles in Library should be CSS classes | 🟢 Minor | ✅ done |
| 14 | `handleDownload` doesn't guard empty transcript | 🟢 Minor | ✅ done |
| 15 | No error feedback in Library if storage is corrupt | 🟢 Minor | ✅ done |
| 16 | Enable `react-hooks/exhaustive-deps` ESLint rule | 🟢 Minor | ✅ done |
| 17 | Unused CSS classes cleanup | 🟢 Minor | ✅ done |
