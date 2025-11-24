// Weather App JavaScript
// Default placeholder API key (replace locally).
let API_KEY = '';
// Allow override from a local config file (create `config.local.js` that sets `window.OPENWEATHER_API_KEY`)
if (typeof window !== 'undefined' && window.OPENWEATHER_API_KEY) {
  API_KEY = window.OPENWEATHER_API_KEY;
}

function hasValidApiKey() {
  if (!API_KEY) return false;
  const placeholderPatterns = [/YOUR_/i, /REPLACE_ME/i, /CHANGE_ME/i];
  // If API_KEY looks like a URL that already includes an appid value, treat as valid
  if (/^https?:\/\//i.test(API_KEY) && /appid=[^\{\s]+/i.test(API_KEY)) return true;
  return !placeholderPatterns.some(p => p.test(API_KEY));
}

function buildWeatherUrl({ city, lat, lon } = {}) {
  // If API_KEY appears to be a full URL/template, try to use/complete it.
  if (/^https?:\/\//i.test(API_KEY)) {
    let tpl = API_KEY;
    // If template contains {lat}/{lon}, replace them
    if (lat != null) tpl = tpl.replace(/\{lat\}/g, encodeURIComponent(lat));
    if (lon != null) tpl = tpl.replace(/\{lon\}/g, encodeURIComponent(lon));
    // If template contains {API key} placeholder, we cannot proceed without a real key
    if (/\{\s*API key\s*\}/i.test(tpl) || /\{\s*API_key\s*\}/i.test(tpl)) {
      throw new Error('OpenWeatherMap configuration contains a URL template with a {API key} placeholder — supply a real API key in config.local.js (window.OPENWEATHER_API_KEY = "YOUR_KEY").');
    }
    // If template already has appid param, return it. Otherwise append appid using API_KEY if it looks like a key
    if (/appid=/i.test(tpl)) return tpl;
    // No appid present — if we have a sensible API key value, append it
    if (hasValidApiKey()) {
      return tpl + (tpl.includes('?') ? '&' : '?') + 'appid=' + encodeURIComponent(API_KEY);
    }
    throw new Error('OpenWeatherMap configuration is incomplete — please provide an API key.');
  }

  // Default behavior: build standard OpenWeatherMap URL using API_KEY as the key string
  if (city) return `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${encodeURIComponent(API_KEY)}`;
  return `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&appid=${encodeURIComponent(API_KEY)}`;
}

// Helpful debug/info about the API key during development (non-intrusive)
function debugApiKey() {
  try {
    const masked = API_KEY && API_KEY.length > 8 ? `${API_KEY.slice(0,4)}...${API_KEY.slice(-4)}` : (API_KEY || '(none)');
    console.info('OpenWeatherMap API key: a39a01836baa52d8ccc9a26a6da70afd', masked);
    if (!hasValidApiKey()) {
        // Do not insert a visible DOM warning here to avoid cluttering pages.
        // Log a clear developer message to the console with steps to generate the frontend config.
        console.warn('OpenWeatherMap API key not configured. Set the env var OPENWEATHER_API_KEY or add it to a local .env file, then run scripts/generate-config.js (or scripts\\generate-config.ps1 on Windows) to create config.local.js and reload the page. See README for details.');
    }
  } catch (e) {
    console.warn('API key debug failed', e);
  }
}

let currentCity = null;
let currentCoords = null;
let autoRefreshTimer = null;
let map = null;
let mapMarker = null;
let mapOwmTiles = null;
let lastForecastData = null; // cache the most recent forecast response

function showAlert(message, type = 'danger', timeout = 5000) {
  // If the dedicated alert container exists on this page, render there.
  const container = document.getElementById('alert-container');
  if (container) {
    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    if (timeout) setTimeout(() => { if (container) container.innerHTML = ''; }, timeout);
    return;
  }

  // No alert container on this page — redirect the user to alert.html and pass the alert via sessionStorage
  try {
    const payload = { message: String(message), type: String(type), timeout: Number(timeout) || 0 };
    sessionStorage.setItem('pendingAlert', JSON.stringify(payload));
    // navigate to the alert page (relative path)
    window.location.href = 'alert.html';
  } catch (err) {
    // As a last-resort fallback show a native alert and log the error.
    console.warn('Could not save pending alert to sessionStorage', err);
    alert(message);
  }
}

async function fetchWeatherJson(url) {
  console.debug('fetchWeatherJson ->', url);
  const res = await fetch(url);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.warn('fetchWeatherJson failed', res.status, errBody);
    const msg = errBody.message || res.statusText || 'Failed fetching weather';
    throw new Error(msg);
  }
  return res.json();
}

// Fetch Air Quality Index (AQI) for given coordinates using OpenWeatherMap Air Pollution API
async function getAirQualityByCoords(lat, lon) {
  if (!hasValidApiKey()) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(API_KEY)}`;
    const data = await fetchWeatherJson(url);
    // data.list[0].main.aqi is 1-5 (1 Good -> 5 Very Poor)
    if (data && Array.isArray(data.list) && data.list.length > 0 && data.list[0].main) {
      return data.list[0].main.aqi;
    }
  } catch (e) {
    console.warn('Failed to fetch air quality', e);
  }
  return null;
}

// Save the currently-displayed location as a favourite.
function saveCurrentAsFavorite() {
  const cityFromUI = (document.getElementById('weather-city') && document.getElementById('weather-city').textContent)
    ? document.getElementById('weather-city').textContent.split(',')[0].trim()
    : null;
  const countryFromUI = (document.getElementById('weather-city') && document.getElementById('weather-city').textContent)
    ? (document.getElementById('weather-city').textContent.split(',')[1] || '').trim()
    : '';

  const city = currentCity || cityFromUI;
  const country = countryFromUI || '';
  const lat = currentCoords && currentCoords.lat != null ? currentCoords.lat : null;
  const lon = currentCoords && currentCoords.lon != null ? currentCoords.lon : null;

  if (!city && (lat == null || lon == null)) {
    showAlert('No location available to save. Search for a city first.', 'warning');
    return false;
  }

  try {
    if (typeof window !== 'undefined' && typeof window.saveLocation === 'function') {
      const ok = window.saveLocation(lat, lon, city, country);
      if (ok) showAlert(`Saved ${city} to favourites`, 'success');
      else showAlert(`${city} is already in favourites`, 'info');
      return ok;
    }
  } catch (e) {
    console.warn('window.saveLocation threw', e);
  }

  // Fallback to localStorage
  try {
    const STORAGE_KEY = 'weatherAppFavorites';
    let favorites = [];
    try { favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { favorites = []; }
    const exists = favorites.some(f => f.city === city && f.country === country);
    if (exists) { showAlert(`${city} is already in favourites`, 'info'); return false; }
    favorites.push({ lat, lon, city, country });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    showAlert(`Saved ${city} to favourites`, 'success');
    return true;
  } catch (e) {
    console.warn('Failed to save favourite', e);
    showAlert('Failed to save favourite', 'danger');
    return false;
  }
}

if (typeof window !== 'undefined') window.saveCurrentAsFavorite = saveCurrentAsFavorite;

function updateUI(data) {
  const card = document.getElementById('weather-card');
  document.getElementById('weather-city').textContent = `${data.name}, ${data.sys?.country || ''}`;
  document.getElementById('weather-desc').textContent = data.weather?.[0]?.description || '';
  document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('weather-humidity').textContent = data.main.humidity;
  document.getElementById('weather-wind').textContent = (data.wind?.speed ?? '') ;
  // Update 'feels like' if available
  try {
    const feelsEl = document.getElementById('weather-feelslike');
    if (feelsEl) {
      if (data.main && (data.main.feels_like != null)) feelsEl.textContent = `${Math.round(data.main.feels_like)}°C`;
      else feelsEl.textContent = '--';
    }
  } catch (e) { /* ignore */ }
  // Kick off AQI fetch for the current coordinates (populate #weather-aqi when available)
  try {
    const aqiEl = document.getElementById('weather-aqi');
    if (aqiEl) {
      aqiEl.textContent = 'Loading...';
      const lat = data?.coord?.lat; const lon = data?.coord?.lon;
      if (lat != null && lon != null) {
        getAirQualityByCoords(lat, lon).then(aqi => {
          try {
            if (aqi == null) { aqiEl.textContent = 'N/A'; return; }
            // Map numeric AQI (1-5) to friendly labels
            const map = {1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor'};
            aqiEl.textContent = `${aqi} (${map[aqi] || 'Unknown'})`;
          } catch (e) { aqiEl.textContent = 'N/A'; }
        }).catch(() => { if (aqiEl) aqiEl.textContent = 'N/A'; });
      } else {
        aqiEl.textContent = 'N/A';
      }
    }
  } catch (e) { /* ignore */ }
  const icon = data.weather?.[0]?.icon;
  if (icon) {
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    document.getElementById('weather-icon').alt = data.weather[0].description;
  }
  document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleString()}`;
  card.classList.remove('d-none');
  // update map view to the returned coordinates if available
  if (data?.coord?.lat != null && data?.coord?.lon != null) {
    setMapView(data.coord.lat, data.coord.lon, `${data.name}${data.sys?.country ? ', ' + data.sys.country : ''}`);
  }
}

// Ensure the weather card exists on the current page; create it dynamically if missing
function ensureWeatherCardExists() {
  if (document.getElementById('weather-card')) return;
  const controls = document.querySelector('.controls-row');
  const insertAfter = controls ? controls.closest('.row') : null;
  const markup = `\n    <div class="row mb-3">\n      <div class="col-12">\n        <div id="weather-card" class="card shadow-sm">\n          <div class="card-body d-flex gap-4 align-items-center">\n            <img id="weather-icon" src="assets/images/logo1.png" alt="icon" width="96" height="96">\n            <div>\n              <h3 id="weather-city" class="card-title mb-0">City, Country</h3>\n              <div id="weather-desc" class="text-muted">--</div>\n              <h1 id="weather-temp" class="display-4 mb-0">--°C</h1>\n              <div class="small text-muted" id="last-updated">Last updated: --</div>\n            </div>\n            <div class="ms-auto text-end">\n              <div>Humidity: <span id="weather-humidity">--</span>%</div>\n              <div>Wind: <span id="weather-wind">--</span> m/s</div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  `;
  // Add a 5-day forecast container right after the weather card
  const forecastWrap = `\n    <div class="row">\n      <div class="col-12">\n        <div id="forecast-5day" class="d-flex flex-wrap gap-3 mt-3"></div>\n      </div>\n    </div>\n  `;
  // hourly forecast container (hidden by default) — will be toggled by hourly/daily buttons
  const hourlyWrap = `\n    <div class="row">\n      <div class="col-12">\n        <div id="forecast-hourly" class="d-flex gap-3 mt-3 overflow-auto" style="display:none;"></div>\n      </div>\n    </div>\n  `;
  // weekly forecast container (hidden by default)
  const weeklyWrap = `\n    <div class="row">\n      <div class="col-12">\n        <div id="forecast-weekly" class="d-flex flex-wrap gap-3 mt-3" style="display:none;"></div>\n      </div>\n    </div>\n  `;
  if (insertAfter && insertAfter.parentNode) {
    insertAfter.insertAdjacentHTML('afterend', markup + forecastWrap + hourlyWrap + weeklyWrap);
  } else {
    // fallback: append to main
    const main = document.querySelector('main') || document.body;
    main.insertAdjacentHTML('beforeend', markup + forecastWrap + hourlyWrap + weeklyWrap);
  }
  // Ensure the save button exists in the newly-inserted card and wire handler
  try {
    const cardBody = document.querySelector('#weather-card .card-body');
    if (cardBody) {
      // Ensure the right-side container exists, then add Feels-like and AQI first,
      // with the Save button appended below them (per UI ordering request).
      const right = cardBody.querySelector('.ms-auto.text-end') || cardBody;
      if (right) {
        // Append 'Feels like' and 'AQI' displays if missing
        if (!document.getElementById('weather-feelslike')) {
          const fwrap = document.createElement('div');
          fwrap.className = 'mt-2';
          fwrap.innerHTML = `Feels like: <span id="weather-feelslike">--</span>`;
          right.appendChild(fwrap);
        }
        if (!document.getElementById('weather-aqi')) {
          const awrap = document.createElement('div');
          awrap.className = 'mt-2';
          awrap.innerHTML = `AQI: <span id="weather-aqi">--</span>`;
          right.appendChild(awrap);
        }

        // Then append save button below the AQI/Feels-like elements
        if (!document.getElementById('save-location-btn')) {
          const btn = document.createElement('button');
          btn.id = 'save-location-btn';
          btn.type = 'button';
          btn.className = 'btn btn-sm btn-outline-primary';
          btn.textContent = 'Save as favourite';
          const wrap = document.createElement('div');
          wrap.className = 'mt-2';
          wrap.appendChild(btn);
          right.appendChild(wrap);
          btn.addEventListener('click', () => { try { saveCurrentAsFavorite(); } catch (e) { console.warn('Save favourite failed', e); } });
        }
      }
    }
  } catch (e) { /* ignore DOM wiring errors */ }
}

// 5-day forecast helpers moved to `js/5-day-forecast.js` to keep app.js smaller.

function renderHourlyForecast(forecastData, hoursWindow = 12) {
  if (!forecastData || !forecastData.list) return;
  // Ensure containers exist
  const container = document.getElementById('forecast-hourly');
  const container5 = document.getElementById('forecast-5day');
  if (container5) container5.style.display = 'none';
  if (!container) return;
  container.style.display = 'flex';
  container.innerHTML = '';

  const now = Math.floor(Date.now() / 1000);
  const end = now + hoursWindow * 3600;
  let entries = forecastData.list.filter(i => i.dt >= now && i.dt <= end);
  if (!entries || entries.length === 0) {
    // fallback: take the next up-to-8 entries from the list
    entries = forecastData.list.slice(0, 8);
  }

  entries.forEach(item => {
    const d = new Date(item.dt * 1000);
    const timeLabel = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const icon = item.weather && item.weather[0] && item.weather[0].icon ? item.weather[0].icon : '';
    const desc = item.weather && item.weather[0] && item.weather[0].description ? item.weather[0].description : '';
    const temp = Math.round(item.main.temp);

    const el = document.createElement('div');
    el.className = 'forecast-card p-2 text-center';
    el.style.minWidth = '110px';
    el.style.flex = '0 0 auto';
    el.innerHTML = `
      <div class="fw-bold mb-1">${timeLabel}</div>
      <div class="mb-1">${ icon ? `<img src=\"https://openweathermap.org/img/wn/${icon}@2x.png\" width=56 height=56 alt=\"${desc}\">` : '' }</div>
      <div class="small text-muted mb-1">${desc}</div>
      <div class="h5 mb-0">${temp}°</div>
    `;
    container.appendChild(el);
  });
  // update button active state
  try {
    const hourlyBtnEl = document.getElementById('hourlyButton');
    const dailyBtnEl = document.getElementById('dailyButton');
    if (hourlyBtnEl) { hourlyBtnEl.classList.add('active'); hourlyBtnEl.setAttribute('aria-pressed', 'true'); }
    if (dailyBtnEl) { dailyBtnEl.classList.remove('active'); dailyBtnEl.setAttribute('aria-pressed', 'false'); }
  } catch (e) { /* ignore */ }
}

// Weekly forecast helpers moved to `js/weekly-forecast.js` to keep app.js smaller.

function render5DayForecast(forecastData) {
  if (!forecastData || !forecastData.list) return;
  // show 5-day container and hide hourly when rendering daily view
  const hourlyContainer = document.getElementById('forecast-hourly');
  const dailyContainer = document.getElementById('forecast-5day');
    if (hourlyContainer) hourlyContainer.style.display = 'none';
  if (dailyContainer) dailyContainer.style.display = 'flex';
  // update button active state
  try {
    const hourlyBtnEl = document.getElementById('hourlyButton');
    const dailyBtnEl = document.getElementById('dailyButton');
    if (dailyBtnEl) { dailyBtnEl.classList.add('active'); dailyBtnEl.setAttribute('aria-pressed', 'true'); }
    if (hourlyBtnEl) { hourlyBtnEl.classList.remove('active'); hourlyBtnEl.setAttribute('aria-pressed', 'false'); }
      } catch (e) { /* ignore */ }
  // Group forecast entries by date string YYYY-MM-DD
  const groups = {};
  forecastData.list.forEach(item => {
    const d = new Date(item.dt * 1000);
    const key = d.toISOString().slice(0,10);
    groups[key] = groups[key] || [];
    groups[key].push(item);
  });
  // Sort dates and take up to 5 days
  const dates = Object.keys(groups).sort().slice(0,5);
  const container = document.getElementById('forecast-5day');
  if (!container) return;
  container.innerHTML = '';
  // Iterate over each date group and render a summary card
  dates.forEach(dateStr => {
    const entries = groups[dateStr] || [];
    if (entries.length === 0) return;

    // compute min/max temps for the day (use temp_min/temp_max when available)
    let min = Infinity, max = -Infinity;
    entries.forEach(e => {
      const tMin = (e.main && (e.main.temp_min != null)) ? e.main.temp_min : (e.main ? e.main.temp : Infinity);
      const tMax = (e.main && (e.main.temp_max != null)) ? e.main.temp_max : (e.main ? e.main.temp : -Infinity);
      min = Math.min(min, tMin);
      max = Math.max(max, tMax);
    });
    if (!isFinite(min) && entries[0] && entries[0].main) min = entries[0].main.temp;
    if (!isFinite(max) && entries[0] && entries[0].main) max = entries[0].main.temp;

    // pick a representative entry (midday or first) for icon/description
    let rep = entries.find(it => {
      try { return new Date(it.dt * 1000).getHours() === 12; } catch (e) { return false; }
    });
    if (!rep) rep = entries[Math.floor(entries.length / 2)] || entries[0];

    const dayName = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
    const icon = rep && rep.weather && rep.weather[0] && rep.weather[0].icon ? rep.weather[0].icon : '';
    const desc = rep && rep.weather && rep.weather[0] && rep.weather[0].description ? rep.weather[0].description : '';

    const el = document.createElement('div');
    el.className = 'forecast-card p-3 text-center';
    el.style.minWidth = '120px';
    el.style.flex = '1 0 140px';
    el.innerHTML = `
      <div class="fw-bold mb-2">${dayName}</div>
      <div class="mb-2">${ icon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" width="56" height="56" alt="${desc}">` : '' }</div>
      <div class="small text-muted mb-2">${desc}</div>
      <div class="h5 mb-0">${Math.round(max)}°</div>
      <div class="text-muted">${Math.round(min)}°</div>
    `;
    container.appendChild(el);
  });
}

function initMap() {
  try {
    map = L.map('map', { preferCanvas: true }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add OpenWeatherMap tiles overlay (requires a valid OpenWeatherMap API key).
    // Template: http://maps.openweathermap.org/maps/2.0/weather/{op}/{z}/{x}/{y}?appid={API key}
    try {
      if (hasValidApiKey()) {
        // Use the requested OpenWeatherMap tiles template (TA2) with fixed params
        const owmTpl = `http://maps.openweathermap.org/maps/2.0/weather/TA2/{z}/{x}/{y}?date=1552861800&opacity=0.9&fill_bound=true&appid=${encodeURIComponent(API_KEY)}`;
        mapOwmTiles = L.tileLayer(owmTpl, { opacity: 0.9, attribution: '&copy; OpenWeatherMap' }).addTo(map);
      } else {
        console.warn('Skipping OpenWeatherMap tiles — API key missing or appears to be a placeholder.');
      }
    } catch (e) {
      console.warn('Could not add OpenWeatherMap tile layer', e);
    }

    // map canvas overlay / demo removed (heatmap feature removed)
  } catch (err) {
    console.warn('Leaflet map could not be initialized', err);
  }
}

function setMapView(lat, lon, label) {
  if (!map) return;
  try {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    map.setView([latNum, lonNum], 10);
    if (!mapMarker) {
      mapMarker = L.marker([latNum, lonNum]).addTo(map).bindPopup(label || 'Location').openPopup();
    } else {
      mapMarker.setLatLng([latNum, lonNum]);
      if (label) mapMarker.bindPopup(label);
    }
    // if image marker exists, move it as well
    // image marker feature removed
  } catch (err) {
    console.warn('Failed to set map view', err);
  }
}

async function getWeatherByCity(city) {
  if (!hasValidApiKey()) {
    showAlert('OpenWeatherMap API key not configured. Set the env var OPENWEATHER_API_KEY (or add it to .env) and run scripts/generate-config.js (or scripts\\generate-config.ps1 on Windows) to create config.local.js, then reload.', 'warning', 10000);
    return;
  }
  try {
    const url = buildWeatherUrl({ city });
    console.debug('getWeatherByCity -> url:', url);
    const data = await fetchWeatherJson(url);
    currentCity = data.name;
    currentCoords = { lat: data.coord.lat, lon: data.coord.lon };
    updateUI(data);
    // also fetch and render the 5-day forecast for this city
    try { await getForecastByCity(data.name || city); } catch (e) { /* non-fatal */ }
  } catch (err) {
    showAlert(err.message || 'Unable to get weather');
  }
}

async function getWeatherByCoords(lat, lon) {
  if (!hasValidApiKey()) {
    showAlert('OpenWeatherMap API key not configured. Set the env var OPENWEATHER_API_KEY (or add it to .env) and run scripts/generate-config.js (or scripts\\generate-config.ps1 on Windows) to create config.local.js, then reload.', 'warning', 10000);
    return;
  }
  try {
    const url = buildWeatherUrl({ lat, lon });
    const data = await fetchWeatherJson(url);
    currentCity = data.name;
    currentCoords = { lat, lon };
    updateUI(data);
  } catch (err) {
    showAlert(err.message || 'Unable to get weather by coords');
  }
}

function startAutoRefresh(enabled) {
  const intervalSelect = document.getElementById('refresh-interval');
  const minutes = parseInt(intervalSelect.value, 10) || 5;
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (enabled) {
    autoRefreshTimer = setInterval(() => {
      if (currentCity) getWeatherByCity(currentCity);
      else if (currentCoords) getWeatherByCoords(currentCoords.lat, currentCoords.lon);
    }, minutes * 60 * 1000);
    showAlert(`Auto-refresh enabled (${minutes} minute${minutes>1?'s':''})`, 'info', 3000);
  } else {
    showAlert('Auto-refresh disabled', 'info', 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // initialize the map early so updateUI can call setMapView
  try { initMap(); } catch (e) { /* initMap handles its own errors */ }
  // Run API key debug helper (non-intrusive)
  try { debugApiKey(); } catch (e) { /* ignore */ }
  const searchBtn = document.getElementById('search-btn');
  const locBtn = document.getElementById('loc-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const autoCheckbox = document.getElementById('auto-refresh');
  const cityInput = document.getElementById('city-input');

  // Guarded event attachments so js/app.js can safely run on pages without the controls
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      // re-query the input element at click-time in case DOM changed
      const cityInputEl = document.getElementById('city-input');
      const city = cityInputEl ? cityInputEl.value.trim() : '';
      const respEl = document.getElementById('search-response');
      console.debug('Search button clicked; city=', city);
      if (!city) {
        showAlert('Please enter a city name', 'warning');
        if (respEl) respEl.textContent = '';
        return;
      }
      // Show immediate feedback
      if (respEl) respEl.textContent = `Searching for "${city}"...`;
      // Ensure card exists and run the search
      try {
        ensureWeatherCardExists();
        await getWeatherByCity(city);
        if (respEl) {
          respEl.textContent = `Showing weather for ${city}`;
          setTimeout(() => { if (respEl) respEl.textContent = ''; }, 4000);
        }
      } catch (e) {
        const msg = (e && e.message) ? e.message : 'Search failed';
        if (respEl) respEl.textContent = `Error: ${msg}`;
        console.warn('Search failed', e);
      }
    });
  }

  if (cityInput && searchBtn) {
    cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });
  }

  if (locBtn) {
    locBtn.addEventListener('click', () => {
      if (!navigator.geolocation) { showAlert('Geolocation not supported by this browser'); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      }, err => {
        showAlert('Unable to get your location: ' + (err.message || 'permission denied'));
      });
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (currentCity) getWeatherByCity(currentCity);
      else if (currentCoords) getWeatherByCoords(currentCoords.lat, currentCoords.lon);
      else showAlert('No location to refresh. Search a city or use your location.', 'warning');
    });
  }

  if (autoCheckbox) {
    autoCheckbox.addEventListener('change', (e) => startAutoRefresh(e.target.checked));
  }
  // Hourly / Daily view buttons
  const hourlyBtn = document.getElementById('hourlyButton');
  const dailyBtn = document.getElementById('dailyButton');
  if (hourlyBtn) {
    hourlyBtn.addEventListener('click', async () => {
      if (!currentCity) { showAlert('Please search for a city first', 'warning'); return; }
      try {
        // Use cached forecast if it matches currentCity, otherwise fetch
        let data = null;
        if (lastForecastData && lastForecastData.city && lastForecastData.city.name && lastForecastData.city.name.toLowerCase() === String(currentCity).toLowerCase()) {
          data = lastForecastData;
        } else {
          data = await getForecastByCity(currentCity);
        }
        if (data) renderHourlyForecast(data);
      } catch (e) {
        console.warn('Hourly view failed', e);
        showAlert('Failed to load hourly forecast', 'danger');
      }
    });
  }
  // Weekly button handler
  const weeklyBtn = document.getElementById('weeklyButton');
  if (weeklyBtn) {
    weeklyBtn.addEventListener('click', async () => {
      try {
        // prefer coordinates if available
        let lat = null, lon = null;
        if (currentCoords && currentCoords.lat != null && currentCoords.lon != null) {
          lat = currentCoords.lat; lon = currentCoords.lon;
        } else if (lastForecastData && lastForecastData.city && lastForecastData.city.coord) {
          lat = lastForecastData.city.coord.lat; lon = lastForecastData.city.coord.lon;
        }
        if (lat == null || lon == null) {
          if (currentCity) {
            // try to fetch current weather to populate coords
            await getWeatherByCity(currentCity);
            if (currentCoords && currentCoords.lat != null) { lat = currentCoords.lat; lon = currentCoords.lon; }
          }
        }
        if (lat == null || lon == null) {
          showAlert('Please search for a city or use your location first', 'warning');
          return;
        }
        const data = await getWeeklyByCoords(lat, lon);
        if (data) renderWeeklyForecast(data);
      } catch (e) {
        console.warn('Weekly view failed', e);
        showAlert('Failed to load weekly forecast', 'danger');
      }
    });
  }
  if (dailyBtn) {
    dailyBtn.addEventListener('click', async () => {
      try {
        // Prefer cached forecast data when available
        let data = null;
        if (lastForecastData && lastForecastData.list) {
          data = lastForecastData;
        } else {
          // Try to determine a city to fetch forecast for: currentCity first, then the displayed city text
          let city = currentCity;
          if (!city) {
            const cityEl = document.getElementById('weather-city');
            if (cityEl && cityEl.textContent) {
              city = cityEl.textContent.split(',')[0].trim();
            }
          }
          if (!city) {
            showAlert('Please search for a city first', 'warning');
            return;
          }
          data = await getForecastByCity(city);
        }
        if (data) render5DayForecast(data);
      } catch (e) {
        console.warn('Daily view failed', e);
        showAlert('Failed to load daily forecast', 'danger');
      }
    });
  }
  // Map image toggle removed — no-op
  // Heatmap feature removed — no heatmap toggle or demo canvas

  // If this page is the alerts page or the standalone weather card page, handle any pending city search or pending alert
  try {
    const path = (location.pathname || '').toLowerCase();
    const isTargetPage = path.includes('alert.html') || path.includes('/alert') || path.includes('weather-card.html') || path.includes('weather-card');
    if (isTargetPage) {
      const pendingCity = sessionStorage.getItem('pendingCity');
      if (pendingCity) {
        // trigger a fetch for the pending city and then clear it
        try { getWeatherByCity(pendingCity); } catch (e) { console.warn('Failed to fetch pending city', e); }
        sessionStorage.removeItem('pendingCity');
      }

      // Also support rendering a pending alert if present (some pages set this)
      const pendingAlert = sessionStorage.getItem('pendingAlert');
      if (pendingAlert) {
        try {
          const payload = JSON.parse(pendingAlert);
          const container = document.getElementById('alert-container');
          if (container && payload && payload.message) {
            container.innerHTML = `\n              <div class="alert alert-${payload.type || 'info'} alert-dismissible fade show" role="alert">\n                ${payload.message}\n                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\n              </div>`;
            if (payload.timeout) setTimeout(() => { if (container) container.innerHTML = ''; }, payload.timeout);
          }
        } catch (e) {
          console.warn('Invalid pendingAlert payload', e);
        }
        sessionStorage.removeItem('pendingAlert');
      }
    }
  } catch (e) {
    console.warn('Error handling pending sessionStorage values', e);
  }
});

// Front-end-only contact form handling (no backend)
document.addEventListener('DOMContentLoaded', () => {
  try {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const feedback = document.getElementById('contact-feedback');
    const nameEl = document.getElementById('contact-name');
    const emailEl = document.getElementById('contact-email');
    const msgEl = document.getElementById('contact-message');

    function showFeedback(text, type = 'success', timeout = 6000) {
      if (!feedback) return;
      feedback.innerHTML = `<div class="alert alert-${type} py-1">${text}</div>`;
      if (timeout) setTimeout(() => { if (feedback) feedback.innerHTML = ''; }, timeout);
    }

    function isValidEmail(v) {
      if (!v) return false;
      // simple email pattern
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      try {
        const name = (nameEl && nameEl.value || '').trim();
        const email = (emailEl && emailEl.value || '').trim();
        const message = (msgEl && msgEl.value || '').trim();

        if (!name) { showFeedback('Please enter your name.', 'warning'); return; }
        if (!isValidEmail(email)) { showFeedback('Please enter a valid email address.', 'warning'); return; }
        if (!message || message.length < 6) { showFeedback('Please enter a message (at least 6 characters).', 'warning'); return; }

        // Save submission to localStorage (front-end only)
        const STORAGE_KEY = 'contactSubmissions';
        const now = new Date().toISOString();
        const entry = { name, email, message, createdAt: now };
        try {
          const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          list.push(entry);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
          console.warn('Failed to persist contact submission', e);
        }

        // Show confirmation and clear form
        showFeedback('Thank you!', 'success', 8000);
        form.reset();
      } catch (e) {
        console.warn('Contact form submit failed', e);
        showFeedback('Failed to save message locally. Please try again.', 'danger');
      }
    });
  } catch (e) { console.warn('Contact form init failed', e); }
});
