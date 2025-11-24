// Save Location Module
// Manages saving and retrieving favorite locations from localStorage

const STORAGE_KEY = 'weatherAppFavorites';

/**
 * Get all saved favorite locations from localStorage
 * @returns {Array} Array of location objects with { lat, lon }
 */
function getSavedLocations() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (err) {
		console.error('Error retrieving saved locations:', err);
		return [];
	}
}

/**
 * Save a new location to favorites
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @param {string} city - City name
 * @param {string} country - Country code
 * @returns {boolean} True if location was saved, false if it already exists
 */
function saveLocation(lat, lon, city, country) {
	try {
		const favorites = getSavedLocations();

		// Check if location already exists
		const exists = favorites.some((location) => location.city === city && location.country === country);
		if (exists) {
			return false;
		}

		// Add new location
		favorites.push({ lat, lon, city, country });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
		return true;
	} catch (err) {
		console.error('Error saving location:', err);
		return false;
	}
}

/**
 * Remove a location from favorites
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @returns {boolean} True if location was removed, false if not found
 */
function removeLocation(city, country) {
	try {
		let favorites = getSavedLocations();
		const initialLength = favorites.length;

		// Filter out the location to be removed
		favorites = favorites.filter((location) => !(location.city === city && location.country === country));

		if (favorites.length === initialLength) {
			return false; // Location not found
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
		return true;
	} catch (err) {
		console.error('Error removing location:', err);
		return false;
	}
}

/**
 * Check if a location is already saved
 * @param {string} city - City name
 * @param {string} country - Country code
 * @returns {boolean} True if location is saved, false otherwise
 */
function isLocationSaved(city, country) {
	const favorites = getSavedLocations();
	return favorites.some((location) => location.city === city && location.country === country);
}

/**
 * Clear all saved locations
 * @returns {boolean} True if cleared successfully
 */
function clearAllLocations() {
	try {
		localStorage.removeItem(STORAGE_KEY);
		return true;
	} catch (err) {
		console.error('Error clearing locations:', err);
		return false;
	}
}

// Expose functions on window for classic-script compatibility
if (typeof window !== 'undefined') {
	window.saveLocations = window.saveLocations || {};
	window.saveLocations.getSavedLocations = getSavedLocations;
	window.saveLocations.saveLocation = saveLocation;
	window.saveLocations.removeLocation = removeLocation;
	window.saveLocations.isLocationSaved = isLocationSaved;
	window.saveLocations.clearAllLocations = clearAllLocations;
	// also expose top-level helpers for convenience
	window.getSavedLocations = getSavedLocations;
	window.saveLocation = saveLocation;
	window.removeLocation = removeLocation;
	window.isLocationSaved = isLocationSaved;
	window.clearAllLocations = clearAllLocations;
}
