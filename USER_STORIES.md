# Weather App — User Stories (MoSCoW)

This file contains prioritized user stories for the Weather App with acceptance criteria.

## Overview
- Project: Weather App (static frontend using OpenWeatherMap)
- Goal: Provide current weather for a city or the user's location, with refresh and basic UX features.

---

## Must-Have

### US-001 — Search weather by city
- Role: User
- Story: As a user, I want to search for the current weather by entering a city name so I can see up-to-date weather information for that city.
- Acceptance Criteria:
  - Given the app is loaded, when I enter a valid city name and press Search (or Enter), then the app displays a weather card showing city name, description, temperature (°C), humidity and wind.
  - Given the API returns success, when the search completes, then the UI shows a last-updated timestamp.
  - Given the city is not found, when the API returns an error, then the app shows a user-friendly error alert.

- Tasks:
  - Implement search input UI and `Search` button behavior.
  - Validate input and show a validation alert for empty searches.
  - Integrate with OpenWeatherMap current-weather API and parse response.
  - Render response data into the weather card and update timestamp.
  - Add basic unit tests / manual test checklist for the flow.

### US-002 — Use device location
- Role: User
- Story: As a user, I want the app to fetch weather using my device geolocation so I can quickly see local weather.
- Acceptance Criteria:
  - Given I click "Use my location" and grant permission, when coordinates are retrieved, then the app fetches and displays weather for those coordinates.
  - Given geolocation is denied or fails, when retrieval fails, then the app shows a clear error alert explaining the issue.

- Tasks:
  - Add a "Use my location" control and wire to `navigator.geolocation`.
  - Implement lat/lon based API call and reuse weather card renderer.
  - Show clear error messages for permission denial and fallback guidance.
  - Add tests for denied/failed geolocation scenarios.

### US-003 — Manual refresh
- Role: User
- Story: As a user, I want a button to refresh the currently shown weather so I can update stale data on demand.
- Acceptance Criteria:
  - Given a weather card is visible, when I click "Update now", then the app re-fetches weather for the current city or coordinates and updates the UI and timestamp.
  - Given no city or location is selected, when I click refresh, then the app shows a warning asking to search or use location first.

- Tasks:
  - Implement "Update now" button to re-use current city/coords and re-fetch data.
  - Disable refresh while a fetch is in progress to avoid duplicate calls.
  - Add success/error handling and update the last-updated timestamp.
  - Add manual test steps to verify refresh behavior.

### US-004 — Error handling & alerts
- Role: User
- Story: As a user, I want clear alerts for network/API/geolocation errors so I understand failures.
- Acceptance Criteria:
  - Given a fetch fails or API returns an error body, when the error occurs, then the app displays a dismissible alert with a concise explanation.
  - Given invalid input (empty search), when I submit, then the app shows a validation alert and does not call the API.

- Tasks:
  - Centralize error handling for fetch failures and show consistent alerts.
  - Add client-side validation for user inputs and show validation alerts.
  - Log errors to console with helpful debug info (no secrets).
  - Provide QA steps to reproduce common error cases (network down, invalid city).

### US-005 — Keep API key private guidance
- Role: Developer/Operator
- Story: As a developer, I want instructions to avoid committing secrets so the API key is not leaked.
- Acceptance Criteria:
  - README contains a clear note about not committing the API key and suggests a proxy or environment-based approach.
  - Following README steps allows local testing without committing the key to the repo.

- Tasks:
  - Add clear README instructions for keeping the API key out of source control.
  - Provide an example Node/Express proxy snippet and run instructions.
  - Add a note in `js/app.js` commenting where to set an API key for local testing.
  - Add acceptance test to confirm README instructions allow a successful local run.

---

## Should-Have

### US-006 — Auto-refresh with configurable interval
- Story: As a user, I want optional auto-refresh that updates the weather every N minutes so I can keep the info current.
- Acceptance Criteria:
  - Given auto-refresh is enabled with a selected interval, when the time elapses, then the app refreshes the current weather automatically.
  - Given auto-refresh is disabled, when toggled off, then automatic refresh stops immediately.

- Tasks:
  - Implement auto-refresh toggle and interval selector in the UI.
  - Create a reliable timer that re-fetches the current weather without duplicating requests.
  - Ensure auto-refresh can be enabled/disabled and persists choice if desired.
  - Add tests to verify interval behavior and toggling.

### US-007 — Responsive layout & accessibility
- Story: As a user, I want the UI to be responsive and accessible so the app works on mobile and with assistive tech.
- Acceptance Criteria:
  - Given different viewport sizes, when page resized, then layout adapts (stacking and spacing for small screens).
  - Given keyboard-only navigation, controls are reachable and operable via Tab/Enter and inputs have accessible labels.

- Tasks:
  - Verify and adjust CSS for responsive breakpoints and mobile layout.
  - Add ARIA attributes and ensure interactive elements have keyboard focus styles.
  - Run an accessibility checklist (contrast, labels, semantic elements).
  - Add responsive visual tests or manual test steps.

### US-008 — Units toggle (Celsius / Fahrenheit)
- Story: As a user, I want to switch between Celsius and Fahrenheit so I can view temperature in my preferred unit.
- Acceptance Criteria:
  - Given the unit toggle is set to Fahrenheit, when fetching weather or toggling, then temperature displays in °F consistently.

- Tasks:
  - Add a units toggle (C / F) to the UI and persist selection if needed.
  - Convert displayed temperature values on toggle or re-fetch with correct units parameter.
  - Add tests to confirm conversion accuracy and toggle behavior.

### US-009 — Recent searches
- Story: As a user, I want recent search history so I can quickly re-open weather for cities I checked earlier.
- Acceptance Criteria:
  - Given searches are performed, when opening the search input, then a list of recent unique searches (e.g., last 5) is available to select.

- Tasks:
  - Implement a lightweight recent-searches store (localStorage) with deduplication and max length.
  - Show recent searches in a dropdown below the search input for quick selection.
  - Add tests/manual steps to confirm recent item selection triggers new search.

---

## Could-Have

### US-010 — 5-day forecast view
- Story: As a user, I want a short forecast so I can plan ahead.
- Acceptance Criteria:
  - Given a city is displayed, when toggling to forecast view, then the app shows a multi-day list with date, expected high/low and icons.

- Tasks:
  - Add UI control to toggle between current weather and forecast view.
  - Integrate with OpenWeatherMap forecast APIs and transform the response for a 3–5 day summary.
  - Render forecast cards with date, icon and high/low temperatures.
  - Add tests or manual verification steps for forecast correctness.

### US-011 — Save favorite locations
- Story: As a user, I want to save favorite cities so I can access them quickly later.
- Acceptance Criteria:
  - Given I save a city, when saved, then it appears in a persisted favorites list (localStorage) and can be selected later.

- Tasks:
  - Add a "Save favorite" action on the weather card and a favorites list UI.
  - Persist favorites to localStorage and allow removal/editing.
  - Add tests/manual steps to confirm selecting a favorite triggers a fetch and updates UI.

### US-012 — Theme toggle (light/dark)
- Story: As a user, I want a light/dark theme toggle so the app better suits my environment.
- Acceptance Criteria:
  - Given I toggle theme, when changed, then UI colors update and preference is remembered (localStorage).

- Tasks:
  - Add a theme toggle control and CSS variables for light/dark palettes.
  - Persist theme preference to localStorage and apply on load.
  - Add manual checks to confirm contrast and layout in both themes.

### US-013 — Share weather snapshot
- Story: As a user, I want to share the current weather via URL or OS share so I can send it to others.
- Acceptance Criteria:
  - Given a weather view, when I click Share, then a copyable summary or native share sheet is provided.

- Tasks:
  - Add a Share button that copies a short weather summary to clipboard.
  - Integrate Web Share API where available to open native share sheet.
  - Add tests/manual checks to ensure copied text is accurate and share dialog works on supported platforms.

---

## Prioritized Backlog (Top → Lower)
1. US-001 Search weather by city (Must)
2. US-002 Use device location (Must)
3. US-003 Manual refresh (Must)
4. US-004 Error handling & alerts (Must)
5. US-005 Keep API key private guidance (Must)
6. US-006 Auto-refresh (Should)
7. US-007 Responsive layout & accessibility (Should)
8. US-008 Units toggle (Should)
9. US-009 Recent searches (Should)
10. US-010 Forecast view (Could)
11. US-011 Save favorites (Could)
12. US-012 Theme toggle (Could)
13. US-013 Share weather snapshot (Could)

---

If you want, I can also create one GitHub Issue per story, include labels and estimates, or convert the Acceptance Criteria into Gherkin scenarios.
