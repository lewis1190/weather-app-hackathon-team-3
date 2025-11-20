import { updateForecastUI } from './five-day-forecast.js';
import { saveLocation, removeLocation, isLocationSaved } from './save-location.js';

// TrueWeather JavaScript
// Replace with your OpenWeatherMap API key

// Lewis API Key - Replace with your own - 0bcd555b9f589fa92e927350a8fed8e4
document.addEventListener('DOMContentLoaded', () => {
  // UI Button Declarations
  const searchBtn = document.getElementById('search-btn');
  const locBtn = document.getElementById('loc-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const autoCheckbox = document.getElementById('auto-refresh');
  const cityInput = document.getElementById('city-input');
  const saveLocationBtn = document.getElementById('save-location-btn');
  const intervalSelect = document.getElementById('refresh-interval');

  const API_KEY = '0bcd555b9f589fa92e927350a8fed8e4';

  let currentCity = null;
  let currentCountry = null;
  let currentCoords = null;
  let autoRefreshTimer = null;

  // Check for lat/lon query parameters and fetch weather if provided
  const params = new URLSearchParams(window.location.search);
  const queryLat = params.get('lat');
  const queryLon = params.get('lon');
  if (queryLat && queryLon) {
    getWeatherByCoords(parseFloat(queryLat), parseFloat(queryLon));
  }

  function showAlert(message, type = 'danger', timeout) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    if (timeout) setTimeout(() => (container.innerHTML = ''), timeout);
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

  function updateUI(weatherData, AQIData) {
    // Update weather card UI with fetched data
    const card = document.getElementById('weather-card');
    document.getElementById('weather-city').textContent = `${weatherData.name}, ${
      weatherData.sys?.country || ''
    }`;
    document.getElementById('weather-desc').textContent = weatherData.weather?.[0]?.description || '';
    document.getElementById('weather-temp').textContent = `${Math.round(weatherData.main.temp)}°C`;
    document.getElementById('weather-humidity').textContent = weatherData.main.humidity;
    document.getElementById('weather-wind').textContent = weatherData.wind?.speed ?? '';
    document.getElementById('weather-feels-like').textContent = Math.round(weatherData.main.feels_like);

    switch (AQIData.list[0].main.aqi) {
      case 1:
        document.getElementById('weather-air-quality-index').textContent = '1 (Very Good)';
        break;
      case 2:
        document.getElementById('weather-air-quality-index').textContent = '2 (Good)';
        break;
      case 3:
        document.getElementById('weather-air-quality-index').textContent = '3 (Moderate)';
        break;
      case 4:
        document.getElementById('weather-air-quality-index').textContent = '4 (Bad)';
        break;
      case 5:
        document.getElementById('weather-air-quality-index').textContent = '5 (Very Bad)';
        break;
      default:
        break;
    }

    // Get colour from AQI value
    const AQIValue = AQIData.list[0].main.aqi || '';
    const AQIElement = document.getElementById('weather-air-quality-index');

    // Remove any existing AQI classes
    AQIElement.className = '';
    // Add the appropriate AQI color class
    if (AQIValue >= 1 && AQIValue <= 5) {
      AQIElement.classList.add(`aqi-${AQIValue}`);
    }

    const icon = weatherData.weather?.[0]?.icon;

    if (icon) {
      document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
      document.getElementById('weather-icon').alt = weatherData.weather[0].description;
    }

    document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleString()}`;
    card.classList.remove('d-none');
    refreshBtn.disabled = false;
    autoCheckbox.disabled = false;
    intervalSelect.disabled = false;

    updateSaveButtonState();
  }

  async function getFiveDayForecastByCoords(lat, lon) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const data = await fetchWeatherJson(url);
      updateForecastUI(data);
    } catch (err) {
      console.error('Unable to get forecast:', err.message);
    }
  }

  async function getWeatherByCity(city) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
      return;
    }
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&units=metric&appid=${API_KEY}`;
      const weatherData = await fetchWeatherJson(weatherUrl);
      currentCoords = { lat: weatherData.coord.lat, lon: weatherData.coord.lon };
      const AQIUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${currentCoords.lat}&lon=${currentCoords.lon}&appid=${API_KEY}`;
      const AQIData = await fetchWeatherJson(AQIUrl);
      currentCity = weatherData.name;
      currentCountry = weatherData.sys?.country;
      updateUI(weatherData, AQIData);

      // Fetch 5-day forecast
      getFiveDayForecastByCoords(currentCoords.lat, currentCoords.lon);
    } catch (err) {
      // ADDED FOR INVALID-SEARCH:
      console.error('getWeatherByCity error:', err);

      const msg = err && err.message ? String(err.message).toLowerCase() : '';

      if (msg.includes('city not found') || msg.includes('404') || msg.includes('not found')) {
        // User-friendly message for unknown city (acceptance criteria)
        showAlert('City not found. Please check the spelling.', 'warning');
      } else if (
        msg.includes('network') ||
        msg.includes('failed fetching') ||
        msg.includes('failed to fetch')
      ) {
        // Network-related friendly message
        showAlert('Network error. Please check your connection and try again.', 'warning');
      } else {
        // Generic fallback message
        showAlert('Unable to get weather. Please try again later.', 'warning');
      }
    }
  }

  async function getWeatherByCoords(lat, lon) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
      return;
    }
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const weatherData = await fetchWeatherJson(weatherUrl);
      currentCoords = { lat, lon };
      const AQIUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${currentCoords.lat}&lon=${currentCoords.lon}&appid=${API_KEY}`;
      const AQIData = await fetchWeatherJson(AQIUrl);
      currentCity = weatherData.name;
      currentCountry = weatherData.sys?.country;
      updateUI(weatherData, AQIData);

      // Fetch 5-day forecast
      getFiveDayForecastByCoords(lat, lon);
    } catch (err) {
      showAlert(err.message || 'Unable to get weather by coords');
    }
  }

  // Save locations UI logic
  function updateSaveButtonState() {
    if (!currentCity || !currentCountry) return;

    const isSaved = isLocationSaved(currentCity, currentCountry);
    saveLocationBtn.textContent = isSaved ? 'Remove Favorite' : 'Save as Favorite';
    saveLocationBtn.classList.toggle('btn-outline-primary', !isSaved);
    saveLocationBtn.classList.toggle('btn-outline-danger', isSaved);
  }

  // ############# Event listeners #############
  function searchBtnHandler() {
    const city = cityInput.value.trim();
    if (!city) {
      showAlert('Please enter a city name', 'warning');
      return;
    }
    getWeatherByCity(city);
  }

  function locationBtnHandler() {
    if (!navigator.geolocation) {
      showAlert('Geolocation not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        showAlert('Unable to get your location: ' + (err.message || 'permission denied'));
      }
    );
  }

  function refreshBtnHandler() {
    if (currentCity) {
      getWeatherByCity(currentCity);
    } else if (currentCoords) {
      getWeatherByCoords(currentCoords.lat, currentCoords.lon);
    } else {
      showAlert('No location to refresh. Search a city or use your location.', 'warning');
    }
  }

  function cityInputKeydownHandler(e) {
    if (e.key === 'Enter') searchBtn.click();
  }

  function saveLocationBtnHandler() {
    if (!currentCity || !currentCoords.lat || !currentCoords.lon) {
      showAlert('Please search for a location first', 'warning');
      return;
    }

    const isSaved = isLocationSaved(currentCity, currentCountry);

    if (isSaved) {
      if (removeLocation(currentCity, currentCountry)) {
        showAlert('Location removed from favorites', 'info', 2000);
        updateSaveButtonState();
      } else {
        showAlert('Error removing location', 'danger');
      }
    } else {
      if (saveLocation(currentCoords.lat, currentCoords.lon, currentCity, currentCountry)) {
        showAlert('Location saved to favorites', 'success', 2000);
        updateSaveButtonState();
      } else {
        showAlert('Location already saved or error occurred', 'warning');
      }
    }
  }

  function autoRefreshSwitchHandler(event) {
    const minutes = parseInt(intervalSelect.value, 10) || 5;
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
    if (event.target.checked) {
      autoRefreshTimer = setInterval(() => {
        if (currentCity) {
          getWeatherByCity(currentCity);
        } else if (currentCoords) getWeatherByCoords(currentCoords.lat, currentCoords.lon);
      }, minutes * 60 * 1000);
      showAlert(`Auto-refresh enabled (${minutes} minute${minutes > 1 ? 's' : ''})`, 'info', 3000);
    } else {
      showAlert('Auto-refresh disabled', 'info', 2000);
    }
  }

  searchBtn.addEventListener('click', searchBtnHandler);
  locBtn.addEventListener('click', locationBtnHandler);
  cityInput.addEventListener('keydown', cityInputKeydownHandler);
  refreshBtn.addEventListener('click', refreshBtnHandler);
  saveLocationBtn.addEventListener('click', saveLocationBtnHandler);
  autoCheckbox.addEventListener('change', autoRefreshSwitchHandler);
  // ############# Event listeners #############
});
