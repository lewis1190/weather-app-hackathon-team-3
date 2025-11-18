**User Story:** As a user, I want to view the current weather conditions for my location (Using "Current Location") (MUST HAVE)

- So that I can plan my day accordingly

**Acceptance Criteria:**

- [ ] Current temperature is displayed prominently
- [ ] Weather condition (sunny, rainy, cloudy) is shown with an icon
- [ ] Humidity and wind speed are visible
- [ ] Location name is clearly displayed

**Tasks:**

- [ ] Set up weather API integration
- [ ] Create HTML structure for weather display
- [ ] Style weather card with Bootstrap
- [ ] Fetch and display current weather data with JavaScript

---

**User Story:** As a user, I want to search for weather in different cities (MUST HAVE)

- So that I can check weather conditions anywhere

**Acceptance Criteria:**

- [ ] Search bar is accessible and intuitive
- [ ] User can type a city name
- [ ] Results update when search is submitted
- [ ] Invalid cities show an error message

**Tasks:**

- [ ] Add search input field to HTML
- [ ] Create search functionality in JavaScript
- [ ] Implement API call with city parameter
- [ ] Add error handling for invalid searches

---

**User Story:** As a user, I want to see a 5-day weather forecast (MUST HAVE)

- So that I can plan ahead for the week

**Acceptance Criteria:**

- [ ] Five cards display showing date, temperature, and condition
- [ ] Cards are arranged horizontally on desktop
- [ ] Cards stack vertically on mobile
- [ ] Weather icons are displayed for each day

**Tasks:**

- [ ] Fetch forecast data from API
- [ ] Create forecast card HTML structure
- [ ] Style forecast cards with Bootstrap grid
- [ ] Populate cards with JavaScript data

---

**User Story:** As a user, I want the site to be responsive on mobile devices (MUST HAVE)

- So that I can check weather on my phone

**Acceptance Criteria:**

- [ ] Layout adapts to mobile screen sizes
- [ ] Text is readable without horizontal scrolling
- [ ] Touch-friendly buttons and inputs
- [ ] Images scale appropriately

**Tasks:**

- [ ] Add Bootstrap responsive classes
- [ ] Test on various screen sizes
- [ ] Adjust font sizes for mobile
- [ ] Ensure buttons have adequate spacing

---

**User Story:** As a user, I want to see weather alerts if severe conditions are expected (COULD HAVE)

- So that I can prepare for dangerous weather

**Acceptance Criteria:**

- [ ] Alert banner appears when severe weather is detected
- [ ] Alert message is clear and prominent
- [ ] Alert can be dismissed
- [ ] Alert styling draws attention

**Tasks:**

- [ ] Add alert HTML structure
- [ ] Create JavaScript logic to detect severe weather
- [ ] Style alert with Bootstrap alert component
- [ ] Implement close button functionality

---

**User Story:** As a user, I want to toggle between Celsius and Fahrenheit (SHOULD HAVE)

- So that I can view temperature in my preferred unit

**Acceptance Criteria:**

- [ ] Toggle button is visible on the page
- [ ] Current unit is clearly indicated
- [ ] All temperatures update when toggled
- [ ] Preference persists on page refresh

**Tasks:**

- [ ] Add toggle button to HTML
- [ ] Create JavaScript toggle function
- [ ] Implement temperature conversion
- [ ] Add localStorage for preference persistence

---

**User Story:** As a user, I want to see UV index information (SHOULD HAVE)

- So that I know if I need sun protection

**Acceptance Criteria:**

- [ ] UV index value is displayed
- [ ] UV risk level (low, moderate, high) is shown
- [ ] Visual indicator (color-coded) represents risk
- [ ] Information is easy to understand

**Tasks:**

- [ ] Fetch UV index from API
- [ ] Create UV display component
- [ ] Add color-coding based on risk level
- [ ] Style component with Bootstrap

---

**User Story:** As a user, I want to see sunrise and sunset times (SHOULD HAVE)

- So that I can plan outdoor activities

**Acceptance Criteria:**

- [ ] Sunrise time is displayed
- [ ] Sunset time is displayed
- [ ] Times are in user's local timezone
- [ ] Icons indicate sunrise/sunset

**Tasks:**

- [ ] Fetch sunrise/sunset data from API
- [ ] Create display section in HTML
- [ ] Format times appropriately
- [ ] Add relevant icons and styling

---

**User Story:** As a user, I want to see air quality index (AQI) (COULD HAVE)

- So that I can assess if air is safe to breathe

**Acceptance Criteria:**

- [ ] AQI value is displayed
- [ ] Air quality rating (good, moderate, poor) is shown
- [ ] Color indicator reflects quality level
- [ ] Health recommendations are provided

**Tasks:**

- [ ] Integrate AQI data from API
- [ ] Create AQI display card
- [ ] Implement color-coding system
- [ ] Add health advisory text

---

**User Story:** As a user, I want to see the "feels like" temperature (COULD HAVE)

- So that I understand what the weather actually feels like

**Acceptance Criteria:**

- [ ] "Feels like" temperature is displayed alongside actual temperature
- [ ] Difference is explained
- [ ] Displayed prominently
- [ ] Updates with current data

**Tasks:**

- [ ] Fetch "feels like" data from API
- [ ] Add to HTML weather display
- [ ] Style to distinguish from actual temperature
- [ ] Ensure data updates correctly

---

**User Story:** As a user, I want my location to be automatically detected via my IP address (COULD HAVE)

- So that I don't have to manually enter my location on first visit

**Acceptance Criteria:**

- [ ] Location is automatically determined on page load
- [ ] Weather displays for detected location
- [ ] User can override auto-detected location with search
- [ ] Detection works reliably across different networks
- [ ] User is notified that location was detected (Broadband and Cellular Data)

**Tasks:**

- [ ] Integrate IP geolocation API if needed?
- [ ] Fetch user's IP address
- [ ] Convert IP to approximate coordinates/city
- [ ] Trigger weather fetch with detected location
- [ ] Add notification banner showing detected location
- [ ] Implement override/dismiss functionality