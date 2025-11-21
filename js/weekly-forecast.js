// Weekly forecast helpers (moved out of app.js for separation)
// Relies on globals from app.js: fetchWeatherJson, hasValidApiKey, lastForecastData, renderWeeklyForecast DOM elements

function buildOneCallUrl(lat, lon) {
  if (lat == null || lon == null) throw new Error('lat/lon required for onecall');
  if (!hasValidApiKey()) throw new Error('API key required for One Call API');
  return `https://api.openweathermap.org/data/2.5/onecall?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&exclude=minutely,hourly,alerts&units=metric&appid=${encodeURIComponent(API_KEY)}`;
}

async function getWeeklyByCoords(lat, lon) {
  try {
    const url = buildOneCallUrl(lat, lon);
    const data = await fetchWeatherJson(url);
    // note: One Call response shape differs from forecast — store under lastForecastData.weekly for caching
    lastForecastData = lastForecastData || {};
    lastForecastData.weekly = data;
    renderWeeklyForecast(data);
    return data;
  } catch (err) {
    console.warn('Failed to fetch weekly forecast', err);
    throw err;
  }
}

function renderWeeklyForecast(oneCallData) {
  if (!oneCallData || !oneCallData.daily) return;
  const container = document.getElementById('forecast-weekly');
  const dailyContainer = document.getElementById('forecast-5day');
  const hourlyContainer = document.getElementById('forecast-hourly');
  if (dailyContainer) dailyContainer.style.display = 'none';
  if (hourlyContainer) hourlyContainer.style.display = 'none';
  if (!container) return;
  container.style.display = 'flex';
  container.innerHTML = '';

  const days = oneCallData.daily.slice(0, 7);
  days.forEach(day => {
    const d = new Date(day.dt * 1000);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const icon = day.weather && day.weather[0] && day.weather[0].icon ? day.weather[0].icon : '';
    const desc = day.weather && day.weather[0] && day.weather[0].description ? day.weather[0].description : '';
    const min = Math.round(day.temp.min);
    const max = Math.round(day.temp.max);
    const pop = typeof day.pop === 'number' ? Math.round(day.pop * 100) : null;

    const el = document.createElement('div');
    el.className = 'forecast-card p-3 text-center';
    el.style.minWidth = '120px';
    el.style.flex = '1 0 140px';
    el.innerHTML = `
      <div class="fw-bold mb-2">${dayName}</div>
      <div class="mb-2">${ icon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" width="56" height="56" alt="${desc}">` : '' }</div>
      <div class="small text-muted mb-2">${desc}</div>
      <div class="h5 mb-0">${max}°</div>
      <div class="text-muted">${min}° ${pop!=null?('| ' + pop + '%') : ''}</div>
    `;
    container.appendChild(el);
  });

  // update button active state
  try {
    const hourlyBtnEl = document.getElementById('hourlyButton');
    const dailyBtnEl = document.getElementById('dailyButton');
    const weeklyBtnEl = document.getElementById('weeklyButton');
    if (weeklyBtnEl) { weeklyBtnEl.classList.add('active'); weeklyBtnEl.setAttribute('aria-pressed', 'true'); }
    if (hourlyBtnEl) { hourlyBtnEl.classList.remove('active'); hourlyBtnEl.setAttribute('aria-pressed', 'false'); }
    if (dailyBtnEl) { dailyBtnEl.classList.remove('active'); dailyBtnEl.setAttribute('aria-pressed', 'false'); }
  } catch (e) { /* ignore */ }
}

// End of weekly-forecast.js
