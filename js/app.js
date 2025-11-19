// Weather App JavaScript
// Default placeholder API key (replace locally).
let API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
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
    console.info('OpenWeatherMap API key:', masked);
    if (!hasValidApiKey()) {
      // Insert a small warning banner at the top of <main> (do not use showAlert to avoid redirect)
      const main = document.querySelector('main') || document.body;
      const existing = document.getElementById('api-key-warning');
      if (!existing) {
        const warn = document.createElement('div');
        warn.id = 'api-key-warning';
        warn.className = 'alert alert-warning';
        warn.style.margin = '0 0 1rem 0';
        warn.role = 'alert';
        warn.innerHTML = `OpenWeatherMap API key not configured. To run the app, create <code>config.local.js</code> in the project root with <code>window.OPENWEATHER_API_KEY = 'YOUR_KEY'</code>. See <code>config.sample.js</code>.`;
        main.prepend(warn);
      }
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
let mapCanvas = null;
let mapCanvasCtx = null;

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
  const res = await fetch(url);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody.message || res.statusText || 'Failed fetching weather';
    throw new Error(msg);
  }
  return res.json();
}

function updateUI(data) {
  const card = document.getElementById('weather-card');
  document.getElementById('weather-city').textContent = `${data.name}, ${data.sys?.country || ''}`;
  document.getElementById('weather-desc').textContent = data.weather?.[0]?.description || '';
  document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('weather-humidity').textContent = data.main.humidity;
  document.getElementById('weather-wind').textContent = (data.wind?.speed ?? '') ;
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
  if (insertAfter && insertAfter.parentNode) {
    insertAfter.insertAdjacentHTML('afterend', markup + forecastWrap);
  } else {
    // fallback: append to main
    const main = document.querySelector('main') || document.body;
    main.insertAdjacentHTML('beforeend', markup + forecastWrap);
  }
}

// Build forecast URL for OpenWeatherMap 5-day/3-hour endpoint
function buildForecastUrl(city) {
  if (!city) throw new Error('City required for forecast');
  if (/^https?:\/\//i.test(API_KEY)) {
    // If API_KEY is a template URL, try to use it for forecast if possible
    let tpl = API_KEY;
    if (tpl.includes('{city}')) {
      tpl = tpl.replace(/\{city\}/g, encodeURIComponent(city));
      return tpl + (tpl.includes('?') ? '&' : '?') + 'units=metric';
    }
    // otherwise fall through to normal construction
  }
  return `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${encodeURIComponent(API_KEY)}`;
}

async function getForecastByCity(city) {
  try {
    const url = buildForecastUrl(city);
    const data = await fetchWeatherJson(url);
    render5DayForecast(data);
  } catch (err) {
    console.warn('Failed to fetch 5-day forecast', err);
  }
}

function render5DayForecast(forecastData) {
  if (!forecastData || !forecastData.list) return;
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
  dates.forEach(dateStr => {
    const entries = groups[dateStr];
    // pick midday entry if available
    let rep = entries.find(e => new Date(e.dt * 1000).getHours() === 12) || entries[Math.floor(entries.length/2)];
    let min = Infinity, max = -Infinity;
    entries.forEach(e => { min = Math.min(min, e.main.temp_min); max = Math.max(max, e.main.temp_max); });
    if (!isFinite(min)) min = rep.main.temp;
    if (!isFinite(max)) max = rep.main.temp;
    const dayName = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
    const icon = rep.weather && rep.weather[0] && rep.weather[0].icon ? rep.weather[0].icon : '';
    const desc = rep.weather && rep.weather[0] && rep.weather[0].description ? rep.weather[0].description : '';

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

    // create a canvas overlay in the overlayPane
    try {
      mapCanvas = L.DomUtil.create('canvas', 'leaflet-heatmap-canvas', map.getPanes().overlayPane);
      mapCanvas.id = 'map-canvas-overlay';
      mapCanvasCtx = mapCanvas.getContext && mapCanvas.getContext('2d');
      // prevent events on canvas from blocking map interactions
      L.DomEvent.disableClickPropagation(mapCanvas);
      L.DomEvent.disableScrollPropagation(mapCanvas);

      function resizeMapCanvas() {
        if (!mapCanvas) return;
        const size = map.getSize();
        const ratio = window.devicePixelRatio || 1;
        mapCanvas.style.width = size.x + 'px';
        mapCanvas.style.height = size.y + 'px';
        mapCanvas.width = Math.round(size.x * ratio);
        mapCanvas.height = Math.round(size.y * ratio);
        if (mapCanvasCtx) mapCanvasCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      function clearMapCanvas() {
        if (!mapCanvasCtx) return;
        mapCanvasCtx.clearRect(0,0,mapCanvas.width, mapCanvas.height);
      }

      function drawMapCanvasDemo() {
        if (!map || !mapCanvasCtx) return;
        clearMapCanvas();
        const size = map.getSize();
        // Draw demo overlay: semi-transparent radial blobs at a few lat/lng positions
        const demoPoints = [
          {lat: 51.5, lon: -0.12}, // London
          {lat: 40.7, lon: -74.0}, // NYC
          {lat: 35.7, lon: 139.7}, // Tokyo
          {lat: -33.9, lon: 151.2}, // Sydney
        ];
        mapCanvasCtx.globalCompositeOperation = 'lighter';
        demoPoints.forEach((p, i) => {
          try {
            const pt = map.latLngToContainerPoint([p.lat, p.lon]);
            const gradient = mapCanvasCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, Math.max(60, Math.min(size.x, size.y) * 0.12));
            const alpha = 0.35 + (i % 2) * 0.15;
            gradient.addColorStop(0, `rgba(255,${80 + i*30},0,${alpha})`);
            gradient.addColorStop(0.6, `rgba(255,${40 + i*20},0,${alpha*0.6})`);
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            mapCanvasCtx.fillStyle = gradient;
            mapCanvasCtx.beginPath();
            mapCanvasCtx.arc(pt.x, pt.y, Math.max(60, Math.min(size.x, size.y) * 0.12), 0, Math.PI * 2);
            mapCanvasCtx.fill();
          } catch (e) {
            // latLngToContainerPoint can throw if map not ready
          }
        });
        mapCanvasCtx.globalCompositeOperation = 'source-over';
      }

      // redraw on relevant map events
      map.on('move resize zoomend viewreset', () => {
        resizeMapCanvas();
        drawMapCanvasDemo();
      });
      // initial sizing + draw
      setTimeout(() => {
        if (map) {
          resizeMapCanvas();
          drawMapCanvasDemo();
        }
      }, 200);
    } catch (err) {
      console.warn('Could not create map canvas overlay', err);
    }
    // end canvas overlay setup
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
    showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
    return;
  }
  try {
    const url = buildWeatherUrl({ city });
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
    showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
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
      const city = cityInput ? cityInput.value.trim() : '';
      const respEl = document.getElementById('search-response');
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
  // Map image toggle removed — no-op
  // Heatmap toggle handling
  const heatToggle = document.getElementById('heatmap-toggle');
  const heatContainer = document.getElementById('heatmap-container');
  const heatCanvas = document.getElementById('heatmap-canvas');

  function resizeCanvas() {
    if (!heatCanvas) return;
    const rect = heatContainer.getBoundingClientRect();
    heatCanvas.width = Math.max(300, Math.floor(rect.width));
    heatCanvas.height = Math.max(200, Math.floor(rect.height));
  }

  function drawHeatmapDemo() {
    if (!heatCanvas) return;
    const ctx = heatCanvas.getContext('2d');
    const w = heatCanvas.width;
    const h = heatCanvas.height;
    ctx.clearRect(0,0,w,h);
    // draw background subtle
    ctx.fillStyle = 'rgba(255,255,255,0.0)';
    ctx.fillRect(0,0,w,h);

    // draw several soft colored circles as demo hotspots
    const hotspots = 6;
    for (let i = 0; i < hotspots; i++) {
      const gx = Math.random() * w;
      const gy = Math.random() * h;
      const r = (Math.min(w,h) * (0.12 + Math.random()*0.18));
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      const alpha = 0.35 + Math.random()*0.25;
      // color ramp from yellow -> red
      g.addColorStop(0, `rgba(255, ${160 + Math.floor(Math.random()*80)}, 0, ${alpha})`);
      g.addColorStop(0.6, `rgba(255, ${80 + Math.floor(Math.random()*60)}, 20, ${alpha*0.6})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function showHeatmap(enabled) {
    if (!heatContainer) return;
    if (enabled) {
      heatContainer.classList.remove('d-none');
      resizeCanvas();
      drawHeatmapDemo();
    } else {
      heatContainer.classList.add('d-none');
    }
  }

  if (heatToggle) {
    heatToggle.addEventListener('change', (e) => showHeatmap(e.target.checked));
    window.addEventListener('resize', () => { if (!heatContainer.classList.contains('d-none')) { resizeCanvas(); drawHeatmapDemo(); } });
  }

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
