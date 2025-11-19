# weather-app-hackathon-team-3

Simple static Weather Application (HTML / CSS / JavaScript / Bootstrap)

Features:
- Search weather by city
- Use browser geolocation to get local weather
- Manual refresh and optional auto-refresh with interval

Setup

1. Get an API key from OpenWeatherMap: https://openweathermap.org/api
2. Open `js/app.js` and set `API_KEY` to your key (replace `YOUR_API_KEY_HERE`).
3. Run a local static server to avoid CORS issues. From the project root (PowerShell):



# Or use any static server you prefer. Stop the server with Ctrl+C.
```

Notes

- This is a static app. Keep your API key private; for production, proxy requests via a backend.
- The UI files are `index.html`, `styles.css`, and `js/app.js`.

If you want, I can add a small backend proxy to hide the API key.