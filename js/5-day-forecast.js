// 5-day forecast helpers (moved out of app.js)
// Depends on globals from app.js: API_KEY, fetchWeatherJson, lastForecastData

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
    // cache and render
    lastForecastData = data;
    render5DayForecast(data);
    return data;
  } catch (err) {
    console.warn('Failed to fetch 5-day forecast', err);
    throw err;
  }
}

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

// end 5-day-forecast.js
