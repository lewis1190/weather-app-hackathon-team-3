// Helper functions are any functions that assist in various tasks throughout the app. They are designed to be reusable and modular.

// Function to get formatted sunrise and sunset times
export function convertSunTimeToDisplayTime(timestamp, timezone) {
  if (timestamp) {
    return new Date((timestamp + timezone) * 1000).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
}
