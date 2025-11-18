# Weather App - Responsive Bootstrap Project

A modern, fully responsive weather application built with HTML5, CSS3, Bootstrap 5, and Vanilla JavaScript. Get real-time weather data, forecasts, air quality, and UV index information.

## Features

✅ **Current Weather Display** - View temperature, condition, humidity, and wind speed
✅ **Location Detection** - Automatic IP-based geolocation on page load
✅ **City Search** - Search weather for any city worldwide
✅ **5-Day Forecast** - Plan ahead with upcoming weather predictions
✅ **Temperature Toggle** - Switch between Celsius and Fahrenheit
✅ **Air Quality Index (AQI)** - Monitor air pollution levels with health recommendations
✅ **UV Index** - Check UV protection requirements
✅ **Sunrise/Sunset Times** - Know golden hours and night fall times
✅ **Feels Like Temperature** - Understand apparent temperature
✅ **Severe Weather Alerts** - Get notified of dangerous conditions
✅ **Responsive Design** - Works perfectly on desktop, tablet, and mobile

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients, flexbox, and grid
- **Bootstrap 5** - Responsive framework
- **JavaScript (Vanilla)** - No dependencies required
- **Font Awesome 6** - Weather and utility icons
- **OpenWeatherMap API** - Real-time weather data

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd weather-app-hackathon-team-3
```

### 2. Get an API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key from your dashboard
4. Copy your API key

### 3. Configure API Key

Open `script.js` and replace the placeholder:

```javascript
const API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual API key
```

### 4. Open the Application

#### Option A: Using a Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (with http-server)
npx http-server
```

Then open your browser to `http://localhost:8000`

#### Option B: Direct File Open
Simply open `index.html` in your web browser (some features may be limited without a server)

## File Structure

```
weather-app-hackathon-team-3/
├── index.html       # Main HTML file
├── styles.css       # CSS styling and responsive design
├── script.js        # JavaScript functionality
├── README.md        # Project documentation
└── stories.md       # User stories and requirements
```

## User Stories Implemented

1. **View Current Weather** - Display temp, condition, humidity, wind speed
2. **Search Cities** - Find weather for any location
3. **5-Day Forecast** - See upcoming weather
4. **Responsive Design** - Works on all devices
5. **Weather Alerts** - Get notified of severe conditions
6. **Temperature Toggle** - Switch between C and F
7. **UV Index** - Check sun protection needs
8. **Sunrise/Sunset** - Plan activities with daylight hours
9. **Air Quality Index** - Monitor air pollution
10. **IP Geolocation** - Auto-detect user location

## Usage

### Search for Weather
1. Type a city name in the search bar
2. Press Enter or click the Search button
3. Weather updates automatically

### Toggle Temperature Unit
Click the °C or °F button in the header to switch units

### View Additional Information
- Scroll down to see the 5-day forecast
- Check Air Quality and UV Index cards
- View sunrise/sunset times in the weather details

## API Endpoints Used

- **Current Weather**: `/weather`
- **Forecast**: `/forecast`
- **Geolocation**: `/geo/1.0/direct`
- **Air Pollution**: `/air_pollution`
- **IP Geolocation**: `https://ipapi.co/json/`

## Customization

### Colors
Modify the CSS variables in `styles.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --light-bg: #f8f9fa;
    --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### API Configuration
Edit `script.js` to customize:
- API endpoints
- Temperature units
- Default location
- Forecast days (currently 5)

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## Performance

- Minimal external dependencies
- Optimized API calls
- LocalStorage for user preferences
- Lazy loading of forecast data

## Troubleshooting

### Weather data not loading
- Verify your API key is correct in `script.js`
- Check OpenWeatherMap API status
- Ensure you're running on a local server (not file://)

### Location not detecting
- Check browser location permissions
- Verify internet connection
- Some VPNs may affect IP geolocation

### Styling issues
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check Bootstrap CDN is loading

## Future Enhancements

- [ ] Weather maps with radar
- [ ] Historical weather data
- [ ] Multiple location favorites
- [ ] Dark mode toggle
- [ ] Weather notifications/alerts
- [ ] Pollen count information
- [ ] Wind direction visualization
- [ ] Precipitation probability

## License

This project is open source and available for educational purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review OpenWeatherMap documentation
3. Check browser console for error messages

---

**Made with ❤️ by Weather App Team 3**
