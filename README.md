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

```powershell
# If you have Python 3 installed
python -m http.server 5500; # serve at http://localhost:5500

# Or use any static server you prefer. Stop the server with Ctrl+C.
```

4. Open `http://localhost:5500` in your browser and use the app.

Notes

- This is a static app. Keep your API key private; for production, proxy requests via a backend.
- The UI files are `index.html`, `styles.css`, and `js/app.js`.

If you want, I can add a small backend proxy to hide the API key.