// Configuration
const API_KEY = '0bcd555b9f589fa92e927350a8fed8e4'; // Replace with your OpenWeather API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const IP_GEOLOCATION_API = 'https://ipapi.co/json/';

// State
let currentTempUnit = 'celsius';
let currentWeatherData = null;
let currentForecastData = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchError = document.getElementById('searchError');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const locationAlert = document.getElementById('locationAlert');
const severeWeatherAlert = document.getElementById('severeWeatherAlert');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

celsiusBtn.addEventListener('change', () => {
    currentTempUnit = 'celsius';
    document.getElementById('tempUnitDisplay').textContent = '°C';
    document.getElementById('feelsLikeUnit').textContent = '°C';
    updateWeatherDisplay();
});

fahrenheitBtn.addEventListener('change', () => {
    currentTempUnit = 'fahrenheit';
    document.getElementById('tempUnitDisplay').textContent = '°F';
    document.getElementById('feelsLikeUnit').textContent = '°F';
    updateWeatherDisplay();
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    detectUserLocation();
    localStorage.setItem('tempUnit', currentTempUnit);
});

/**
 * Detect user location using IP geolocation
 */
async function detectUserLocation() {
    try {
        const response = await fetch(IP_GEOLOCATION_API, {
            mode: 'cors',
            headers: {
                // 'Access-Control-Allow-Origin': '*'
            }
        });
        const data = await response.json();

        if (data.latitude && data.longitude) {
            showLocationAlert(`Location detected: ${data.city}, ${data.country_name}`);
            fetchWeatherByCoordinates(data.latitude, data.longitude);
        }
    } catch (error) {
        console.log('IP geolocation failed, using default location');
        fetchWeatherByCity('New York');
    }
}

/**
 * Show location detection alert
 */
function showLocationAlert(message) {
    const alertText = document.getElementById('locationAlertText');
    alertText.textContent = message;
    locationAlert.classList.remove('d-none');
}

/**
 * Handle search functionality
 */
async function handleSearch() {
    const city = searchInput.value.trim();

    if (!city) {
        showSearchError('Please enter a city name');
        return;
    }

    searchError.classList.add('d-none');
    await fetchWeatherByCity(city);
}

/**
 * Fetch weather data by city name
 */
async function fetchWeatherByCity(city) {
    try {
        // Get coordinates from city name
        const geoResponse = await fetch(`${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);

        if (!geoResponse.ok) throw new Error('City not found');

        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            showSearchError(`City "${city}" not found. Please try another search.`);
            return;
        }

        const { lat, lon, name, country } = geoData[0];
        await fetchWeatherByCoordinates(lat, lon, `${name}, ${country}`);
        searchInput.value = '';
    } catch (error) {
        showSearchError(error.message || 'Failed to fetch weather data');
    }
}

/**
 * Fetch weather data by coordinates
 */
async function fetchWeatherByCoordinates(lat, lon, locationName = null) {
    try {
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);

        if (!response.ok) throw new Error('Failed to fetch weather');

        currentWeatherData = await response.json();

        // If location name not provided, use from API response
        if (!locationName) {
            locationName = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`;
        }

        // Fetch forecast data
        const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);

        if (forecastResponse.ok) {
            currentForecastData = await forecastResponse.json();
        }

        // Check for severe weather
        checkSevereWeather(currentWeatherData);

        // Update display
        updateWeatherDisplay();
    } catch (error) {
        showSearchError('Failed to fetch weather data. Please try again.');
        console.error(error);
    }
}

/**
 * Check for severe weather conditions
 */
function checkSevereWeather(data) {
    const severeConditions = ['thunderstorm', 'tornado', 'hurricane', 'extreme'];
    const condition = data.weather[0].main.toLowerCase();

    if (severeConditions.some((cond) => condition.includes(cond))) {
        showSevereWeatherAlert(`⚠️ Severe weather alert: ${data.weather[0].description}. Stay safe!`);
    } else {
        severeWeatherAlert.classList.add('d-none');
    }
}

/**
 * Show severe weather alert
 */
function showSevereWeatherAlert(message) {
    document.getElementById('severeWeatherText').textContent = message;
    severeWeatherAlert.classList.remove('d-none');
}

/**
 * Show search error
 */
function showSearchError(message) {
    searchError.textContent = message;
    searchError.classList.remove('d-none');
}

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
}

/**
 * Get weather icon based on condition
 */
function getWeatherIcon(condition) {
    const iconMap = {
        clear: 'fas fa-sun',
        clouds: 'fas fa-cloud',
        rain: 'fas fa-cloud-rain',
        drizzle: 'fas fa-cloud-rain',
        thunderstorm: 'fas fa-bolt',
        snow: 'fas fa-snowflake',
        mist: 'fas fa-smog',
        smoke: 'fas fa-smog',
        haze: 'fas fa-smog',
        dust: 'fas fa-wind',
        fog: 'fas fa-smog',
        sand: 'fas fa-wind',
        ash: 'fas fa-smog',
        squall: 'fas fa-wind',
        tornado: 'fas fa-tornado'
    };

    const key = condition.toLowerCase();
    return iconMap[key] || 'fas fa-cloud';
}

/**
 * Format time from Unix timestamp
 */
function formatTime(timestamp, timezone = 0) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date from timestamp
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get AQI level and color
 */
function getAQIInfo(aqi) {
    const levels = {
        1: { name: 'Good', class: 'aqi-good', advice: 'Air quality is satisfactory. Enjoy outdoor activities!' },
        2: { name: 'Moderate', class: 'aqi-moderate', advice: 'Air quality is moderate. Sensitive groups may want to limit outdoor activities.' },
        3: { name: 'Unhealthy for Sensitive Groups', class: 'aqi-unhealthy', advice: 'Sensitive groups should consider limiting prolonged outdoor activities.' },
        4: { name: 'Unhealthy', class: 'aqi-very-unhealthy', advice: 'General public advised to limit outdoor activities. Wear masks if necessary.' },
        5: { name: 'Hazardous', class: 'aqi-hazardous', advice: 'Avoid outdoor activities. Stay indoors and keep windows closed.' }
    };

    return levels[aqi] || levels[1];
}

/**
 * Get UV Index level and color
 */
function getUVInfo(uv) {
    let level, uvClass, advice;

    if (uv < 3) {
        level = 'Low';
        uvClass = 'uv-low';
        advice = 'Low UV index. No sun protection required.';
    } else if (uv < 6) {
        level = 'Moderate';
        uvClass = 'uv-moderate';
        advice = 'Moderate UV index. Wear sunscreen (SPF 30+) and sunglasses.';
    } else if (uv < 8) {
        level = 'High';
        uvClass = 'uv-high';
        advice = 'High UV index. Limit sun exposure. Use SPF 50+ sunscreen.';
    } else if (uv < 11) {
        level = 'Very High';
        uvClass = 'uv-very-high';
        advice = 'Very high UV index. Minimize sun exposure. Wear protective clothing.';
    } else {
        level = 'Extreme';
        uvClass = 'uv-extreme';
        advice = 'Extreme UV index. Avoid sun exposure. Stay indoors if possible.';
    }

    return { level, uvClass, advice };
}

/**
 * Update weather display
 */
function updateWeatherDisplay() {
    if (!currentWeatherData) return;

    const data = currentWeatherData;
    const tempC = data.main.temp;
    const feelsLikeC = data.main.feels_like;
    const temp = currentTempUnit === 'celsius' ? tempC : Math.round(celsiusToFahrenheit(tempC));
    const feelsLike = currentTempUnit === 'celsius' ? feelsLikeC : Math.round(celsiusToFahrenheit(feelsLikeC));

    // Update location
    document.getElementById('locationName').textContent = `${data.name}, ${data.sys.country}`;

    // Update current weather
    document.getElementById('currentTemp').textContent = Math.round(temp);
    document.getElementById('feelsLike').textContent = Math.round(feelsLike);
    document.getElementById('weatherCondition').textContent = data.weather[0].main;

    // Update weather icon
    const iconClass = getWeatherIcon(data.weather[0].main);
    document.getElementById('currentWeatherIcon').className = `${iconClass} fa-3x`;

    // Update weather details
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed)} km/h`;

    const sunrise = formatTime(data.sys.sunrise, data.timezone);
    const sunset = formatTime(data.sys.sunset, data.timezone);
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;

    // Update forecast
    if (currentForecastData) {
        updateForecast();
    }

    // Try to fetch AQI and UV data (requires additional API call)
    fetchAQIData(data.coord.lat, data.coord.lon);
}

/**
 * Fetch and display AQI data
 */
async function fetchAQIData(lat, lon) {
    try {
        const response = await fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);

        if (response.ok) {
            const data = await response.json();
            const aqi = data.list[0].main.aqi;

            const aqiInfo = getAQIInfo(aqi);
            const aqiValue = document.getElementById('aqiValue');
            const aqiLevel = document.getElementById('aqiLevel');
            const healthAdvice = document.getElementById('healthAdvice');

            aqiValue.textContent = aqi;
            aqiValue.className = `aqi-value ${aqiInfo.class}`;
            aqiLevel.textContent = aqiInfo.name;
            healthAdvice.innerHTML = `<strong>Health Recommendation:</strong> ${aqiInfo.advice}`;
        }
    } catch (error) {
        console.log('Could not fetch AQI data');
    }
}

/**
 * Update 5-day forecast
 */
function updateForecast() {
    const container = document.getElementById('forecastContainer');
    container.innerHTML = '';

    // Get unique days from forecast (one forecast per day at noon)
    const dailyForecasts = {};

    currentForecastData.list.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString();

        // Only keep one forecast per day (prefer noon)
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = item;
        } else {
            const existingHour = new Date(dailyForecasts[day].dt * 1000).getHours();
            const newHour = date.getHours();
            // Replace if new time is closer to noon (12)
            if (Math.abs(newHour - 12) < Math.abs(existingHour - 12)) {
                dailyForecasts[day] = item;
            }
        }
    });

    // Take first 5 days
    Object.values(dailyForecasts)
        .slice(0, 5)
        .forEach((item) => {
            const tempC = item.main.temp;
            const temp = currentTempUnit === 'celsius' ? tempC : Math.round(celsiusToFahrenheit(tempC));
            const iconClass = getWeatherIcon(item.weather[0].main);

            const forecastCard = document.createElement('div');
            forecastCard.className = 'col-12 col-sm-6 col-lg-2_4';
            forecastCard.innerHTML = `
            <div class="forecast-card">
                <div class="forecast-date">${formatDate(item.dt)}</div>
                <div class="forecast-icon">
                    <i class="${iconClass} fa-2x"></i>
                </div>
                <div class="forecast-temp">${Math.round(temp)}°</div>
                <div class="forecast-condition">${item.weather[0].main}</div>
            </div>
        `;

            container.appendChild(forecastCard);
        });
}

// Add CSS for 5-day forecast responsive grid
const style = document.createElement('style');
style.textContent = `
    @media (max-width: 1200px) {
        .col-lg-2_4 {
            flex: 0 0 33.333%;
            max-width: 33.333%;
        }
    }
    @media (max-width: 768px) {
        .col-lg-2_4 {
            flex: 0 0 50%;
            max-width: 50%;
        }
    }
    @media (max-width: 480px) {
        .col-lg-2_4 {
            flex: 0 0 100%;
            max-width: 100%;
        }
    }
`;
document.head.appendChild(style);
