import { getSavedLocations } from '../js/save-location.js';

// MyForecast JavaScript
// Replace with your OpenWeatherMap API key

// Lewis API Key - Replace with your own - 0bcd555b9f589fa92e927350a8fed8e4
document.addEventListener('DOMContentLoaded', async () => {
  // UI Button Declarations
  const saveLocationBtn = document.getElementById('save-location-btn');

  const API_KEY = '0bcd555b9f589fa92e927350a8fed8e4';

  const favoriteLocations = getSavedLocations();
  const favoriteLocationsData = [];

  for (const location of favoriteLocations) {
    const data = await getWeatherByCoords(location.lat, location.lon);
    favoriteLocationsData.push(data);
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
    const mainContainer = document.querySelector('main');

    const favoriteLocationsContainer = document.getElementById('favorite-locations-container');
    const favoriteLocationsCards = document.getElementById('favorite-locations-cards');

    favoriteLocationsCards.innerHTML = '';

    favoriteLocationsData.forEach((data) => {
      const card = document.createElement('div');
      card.className = 'col';
      const weatherIcon = data.weather?.[0]?.icon;
      const iconHtml = weatherIcon
        ? `<img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="icon" width="96" height="96">`
        : '<div width="96" height="96">No Icon</div>';

      card.innerHTML = `
        <div class="card shadow-sm mt-3">
          <div class="card-body d-flex flex-column flex-sm-row gap-4 align-items-center justify-content-center text-center">
            ${iconHtml}
            <div>
              <h3 class="card-title mb-0">${data.name}, ${data.sys?.country || ''}</h3>
              <div class="text-muted">${data.weather?.[0]?.description || ''}</div>
              <h1 class="display-4 mb-0">${Math.round(data.main.temp)}°C</h1>
              <div class="small text-muted">Last updated: ${new Date().toLocaleString()}</div>
            </div>
            <div class="ms-md-auto">
              <div>Humidity: <span>${data.main.humidity}</span>%</div>
              <div>Wind: <span>${data.wind?.speed ?? ''}</span> m/s</div>
              <button class="btn btn-outline-danger mt-2 w-100 remove-btn" data-city="${
                data.name
              }" data-country="${data.sys?.country}">Remove</button>
              <button class="btn btn-outline-primary mt-2 w-100 more-info-btn">More Info</button>
            </div>
          </div>
        </div>
      `;

      favoriteLocationsCards.appendChild(card);
    });

    // Add event listeners to dynamically created buttons
    document.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // TODO: Implement remove location functionality
        e.target.closest('.card').remove();
      });
    });

    document.querySelectorAll('.more-info-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        // TODO: Implement more info functionality
      });
    });
  }

  async function getWeatherByCoords(lat, lon) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      showAlert('Please set your OpenWeatherMap API key in js/app.js', 'warning', 8000);
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const data = await fetchWeatherJson(url);
      return data;
      // Fetch 5-day forecast
    } catch (err) {
      showAlert(err.message || 'Unable to get weather by coords');
    }
  }

  // ############# Event listeners #############
  // function refreshBtnHandler() {
  //   if (currentCity) {
  //     getWeatherByCity(currentCity);
  //   } else if (currentCoords) {
  //     getWeatherByCoords(currentCoords.lat, currentCoords.lon);
  //   } else {
  //     showAlert('No location to refresh. Search a city or use your location.', 'warning');
  //   }
  // }

  // refreshBtn.addEventListener('click', refreshBtnHandler);
  // ############# Event listeners #############
});
