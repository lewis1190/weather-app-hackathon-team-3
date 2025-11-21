import { getSavedLocations } from '../js/save-location.js';
import { removeLocation } from '../js/save-location.js';

// TrueWeather JavaScript
// Replace with your OpenWeatherMap API key

// Lewis API Key - Replace with your own - 0bcd555b9f589fa92e927350a8fed8e4
document.addEventListener('DOMContentLoaded', async () => {
  // UI Button Declarations
  const API_KEY = '0bcd555b9f589fa92e927350a8fed8e4';

  const favoriteLocations = getSavedLocations();
  const favoriteLocationsData = [];

  for (const location of favoriteLocations) {
    const combinedData = await getWeatherByCoords(location.lat, location.lon);
    favoriteLocationsData.push(combinedData);
  }
  renderCards(favoriteLocationsData);

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

  function renderCards(favoriteLocationsData) {
    const favoriteLocationsCards = document.getElementById('favorite-locations-cards');
    const aqiComment = ['Very Good', 'Good', 'Moderate', 'Bad', 'Very Bad'];

    favoriteLocationsCards.innerHTML = '';

    favoriteLocationsData.forEach((combinedData) => {
      const card = document.createElement('div');
      card.id = 'generated-card';
      card.className = 'col-8 col-sm-12';
      const aqiValue = combinedData.aqiData.list[0].main.aqi;
      const weatherIcon = combinedData.weatherData.weather?.[0]?.icon;
      const iconHtml = weatherIcon
        ? `<img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="icon" width="96" height="96">`
        : '<div width="96" height="96">No Icon</div>';

      card.innerHTML = `
        <div class="card shadow-sm mt-3">
          <div class="card-body d-flex flex-column flex-sm-row gap-4 align-items-center justify-content-center text-center">
            ${iconHtml}
            <div>
              <h3 class="card-title mb-0">${combinedData.weatherData.name}, ${
        combinedData.weatherData.sys?.country || ''
      }</h3>
              <div class="text-muted">${combinedData.weatherData.weather?.[0]?.description || ''}</div>
              <h1 class="display-4 mb-0">${Math.round(combinedData.weatherData.main.temp)}°C</h1>
              <div class="small text-muted">Last updated: ${new Date().toLocaleString()}</div>
            </div>
            <div class="ms-md-auto py-2 pe-2">
              <div>Feels like: <span id="weather-feels-like">${Math.round(
                combinedData.weatherData.main.feels_like
              )}</span>°C</div>
              <div>Humidity: <span>${combinedData.weatherData.main.humidity}</span>%</div>
              <div>Wind: <span>${combinedData.weatherData.wind?.speed ?? ''}</span> m/s</div>
              <div>Air Quality Index: <span class="aqi-${aqiValue}">${aqiValue} (${
        aqiComment[aqiValue - 1]
      })</span></div>
            <br />
              <button class="btn btn-outline-danger mt-2 w-100 remove-btn" data-city="${
                combinedData.weatherData.name
              }" data-country="${combinedData.weatherData.sys?.country}">Remove</button>
              <button class="btn btn-outline-primary mt-2 w-100 more-info-btn" data-lat="${
                combinedData.weatherData.coord.lat
              }" data-lon="${combinedData.weatherData.coord.lon}">More Info</button>
            </div>
          </div>
        </div>
      `;

      favoriteLocationsCards.appendChild(card);
    });

    // Event listeners for dynamically created buttons
    // Need to pass btn explicitly due to scope.
    document.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => removeFavoriteHandler(e, btn));
    });

    document.querySelectorAll('.more-info-btn').forEach((btn) => {
      btn.addEventListener('click', () => moreInfoHandler(btn));
    });
  }

  async function getWeatherByCoords(lat, lon) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
      return;
    }
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const weatherData = await fetchWeatherJson(weatherUrl);
      const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      const aqiData = await fetchWeatherJson(aqiUrl);
      return { weatherData, aqiData };
    } catch (err) {
      showAlert(err.message || 'Unable to get weather by coords');
    }
  }

  // ############# Event listeners #############
  function removeFavoriteHandler(event, btn) {
    const city = btn.dataset.city;
    const country = btn.dataset.country;

    if (confirm(`Are you sure you want to remove ${city}, ${country} from your favorites?`)) {
      if (removeLocation(city, country)) {
        // TODO: Risky, needs testing on mobile and touch devices!
        event.target.closest('#generated-card').remove();
        showAlert('Location removed from favorites', 'success', 2000);
      } else {
        showAlert('Error removing location', 'danger');
      }
    }
  }

  function moreInfoHandler(btn) {
    const lat = btn.dataset.lat;
    const lon = btn.dataset.lon;
    window.location.href = `../index.html?lat=${lat}&lon=${lon}`;
  }
  // ############# Event listeners #############
});
