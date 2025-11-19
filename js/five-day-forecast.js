/**
 * Updates the UI with the 5-day weather forecast data.
 * As we're not using a template framework, I have to declare and build the HTML in the JS code,
 * then append the content to it's container element withing the DOM.
 */
export function updateForecastUI(forecastData) {
  const forecastContainer = document.getElementById('forecast-container');
  const forecastCards = document.getElementById('forecast-cards');

  if (!forecastData || !forecastData.list || forecastData.list.length === 0) {
    forecastContainer.classList.add('d-none');
    return;
  }

  // Get one forecast per day (take every 8th item since API returns 3-hour intervals)
  // The free tier of OpenWeatherMap 5-day forecast API provides data in 3-hour intervals.
  // Daily forecast data requires a paid or student subscription...
  const dailyForecasts = [];
  const seenDates = [];

  for (let item of forecastData.list) {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toDateString();
    const hour = date.getHours();

    if (!seenDates.includes(dateStr) && dailyForecasts.length < 5 && hour === 12) {
      seenDates.push(dateStr);
      dailyForecasts.push(item);
    }
  }

  // Clear existing forecast cards
  forecastCards.innerHTML = '';

  // Create cards for each day
  dailyForecasts.forEach((weather) => {
    const date = new Date(weather.dt * 1000);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const icon = weather.weather?.[0]?.icon;
    const description = weather.weather?.[0]?.description || 'N/A';
    const tempMax = Math.round(weather.main.temp_max);
    const tempMin = Math.round(weather.main.temp_min);
    const humidity = weather.main.humidity;
    const windSpeed = weather.wind?.speed ?? 'N/A';
    const pop = Math.round((weather.pop || 0) * 100); // Probability of precipitation

    const card = document.createElement('div');
    card.className = 'col';
    card.innerHTML = `
        <div class="card forecast-card shadow-sm h-100 w-100">
          <div class="card-body">
            <div class="fw-bold mb-2">${dateStr}</div>
            <div class="text-muted small mb-2">${dayOfWeek} @ 12pm</div>
            ${
              icon
                ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="forecast-icon">`
                : '<div class="forecast-icon">No Icon</div>'
            }
            <div class="text-capitalize small mb-3">${description}</div>
            <div class="mb-3">
              <div class="fs-5 fw-bold text-primary">${tempMax}°C</div>
              <div class="small text-muted"><span>${tempMin}°C</span> Low</div>
            </div>
            <hr class="my-2">
            <div class="small">
              <div class="mb-1">Humidity: ${humidity}%</div>
              <div class="mb-1">Wind: ${windSpeed.toFixed(1)} m/s</div>
              <div>Precipitation: ${pop}%</div>
            </div>
          </div>
        </div>
      `;
    forecastCards.appendChild(card);
  });

  forecastContainer.classList.remove('d-none');
}
