// Weather App JavaScript
// Replace with your OpenWeatherMap API key
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';

let currentCity = null;
let currentCoords = null;
let autoRefreshTimer = null;

function showAlert(message, type = 'danger', timeout = 5000) {
  const container = document.getElementById('alert-container');
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  if (timeout) setTimeout(() => container.innerHTML = '', timeout);
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
}

async function getWeatherByCity(city) {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
    return;
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const data = await fetchWeatherJson(url);
    currentCity = data.name;
    currentCoords = { lat: data.coord.lat, lon: data.coord.lon };
    updateUI(data);
  } catch (err) {
    showAlert(err.message || 'Unable to get weather');
  }
}

async function getWeatherByCoords(lat, lon) {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
    return;
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
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
  const searchBtn = document.getElementById('search-btn');
  const locBtn = document.getElementById('loc-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const autoCheckbox = document.getElementById('auto-refresh');
  const cityInput = document.getElementById('city-input');

  searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) { showAlert('Please enter a city name', 'warning'); return; }
    getWeatherByCity(city);
  });

  cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });

  locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { showAlert('Geolocation not supported by this browser'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    }, err => {
      showAlert('Unable to get your location: ' + (err.message || 'permission denied'));
    });
  });

  refreshBtn.addEventListener('click', () => {
    if (currentCity) getWeatherByCity(currentCity);
    else if (currentCoords) getWeatherByCoords(currentCoords.lat, currentCoords.lon);
    else showAlert('No location to refresh. Search a city or use your location.', 'warning');
  });

  autoCheckbox.addEventListener('change', (e) => startAutoRefresh(e.target.checked));
});
