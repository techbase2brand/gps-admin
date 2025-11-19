/**
 * Coordinate format conversion utilities
 * Converts between Google Maps format {lat, lng} and Leaflet format [lat, lng]
 */

/**
 * Round number to 6 decimal places
 * @param {Number} num - Number to round
 * @returns {Number} Rounded number
 */
function roundTo6Decimals(num) {
  return Math.round(num * 1000000) / 1000000;
}

/**
 * Convert Google Maps format to Leaflet format
 * @param {Array} googleCoords - Array of {lat, lng} objects
 * @returns {Array} Array of [lat, lng] arrays
 */
export function googleToLeaflet(googleCoords) {
  if (!googleCoords || !Array.isArray(googleCoords)) return [];
  return googleCoords.map((coord) => [coord.lat, coord.lng]);
}

/**
 * Convert Leaflet format to Google Maps format
 * @param {Array} leafletCoords - Array of [lat, lng] arrays
 * @param {Boolean} round - Whether to round coordinates to 6 decimal places (default: false)
 * @returns {Array} Array of {lat, lng} objects
 */
export function leafletToGoogle(leafletCoords, round = false) {
  if (!leafletCoords || !Array.isArray(leafletCoords)) return [];
  return leafletCoords.map((coord) => ({
    lat: round ? roundTo6Decimals(coord[0]) : coord[0],
    lng: round ? roundTo6Decimals(coord[1]) : coord[1],
  }));
}

/**
 * Convert Leaflet polygon to GeoJSON format
 * @param {Array} leafletCoords - Array of [lat, lng] arrays
 * @param {Object} properties - Additional properties to include
 * @returns {Object} GeoJSON Feature object
 */
export function toGeoJSON(leafletCoords, properties = {}) {
  // GeoJSON uses [lng, lat] format (note: reversed!)
  // Round to 6 decimal places for export
  const coordinates = leafletCoords.map((coord) => [
    roundTo6Decimals(coord[1]), // lng
    roundTo6Decimals(coord[0]), // lat
  ]);
  
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates], // Polygon requires array of coordinate arrays
    },
    properties: properties,
  };
}

/**
 * Convert to simple JSON format (current format)
 * @param {Array} leafletCoords - Array of [lat, lng] arrays
 * @returns {Object} Simple coordinates object
 */
export function toSimpleJSON(leafletCoords) {
  // Round to 6 decimal places for export
  return {
    coordinates: leafletToGoogle(leafletCoords, true),
  };
}

