export const mockForecastData = {
  list: [
    {
      dt: Math.floor(new Date().setHours(12, 0, 0, 0) / 1000) + 86400,
      weather: [{ icon: '02d', description: 'partly cloudy' }],
      main: { temp_max: 22, temp_min: 18, humidity: 65 },
      wind: { speed: 4.5 },
      pop: 0.1,
    },
    {
      dt: Math.floor(new Date().setHours(12, 0, 0, 0) / 1000) + 172800,
      weather: [{ icon: '03d', description: 'cloudy' }],
      main: { temp_max: 20, temp_min: 16, humidity: 72 },
      wind: { speed: 5.2 },
      pop: 0.25,
    },
    {
      dt: Math.floor(new Date().setHours(12, 0, 0, 0) / 1000) + 259200,
      weather: [{ icon: '09d', description: 'light rain' }],
      main: { temp_max: 18, temp_min: 14, humidity: 85 },
      wind: { speed: 6.1 },
      pop: 0.65,
    },
    {
      dt: Math.floor(new Date().setHours(12, 0, 0, 0) / 1000) + 345600,
      weather: [{ icon: '10d', description: 'rain' }],
      main: { temp_max: 17, temp_min: 13, humidity: 90 },
      wind: { speed: 7.3 },
      pop: 0.8,
    },
    {
      dt: Math.floor(new Date().setHours(12, 0, 0, 0) / 1000) + 432000,
      weather: [{ icon: '01d', description: 'sunny' }],
      main: { temp_max: 24, temp_min: 19, humidity: 58 },
      wind: { speed: 3.8 },
      pop: 0.05,
    },
  ],
};
