/**
 * Recursively flattens nested objects or arrays into a single unique array of strings.
 * Useful for MUI Autocomplete components where options might be grouped in constants.
 * * @param {Object|Array} options - The nested data structure to flatten.
 * @returns {Array} A flat array of unique values.
 */
export const flattenOptions = (options) => {
  if (!options) return [];
  
  // Use a Set to ensure all flattened values are unique
  const flattened = new Set();

  const recurse = (item) => {
    if (Array.isArray(item)) {
      item.forEach(recurse);
    } else if (item !== null && typeof item === 'object') {
      Object.values(item).forEach(recurse);
    } else if (item !== undefined && item !== null) {
      // Convert to string and trim whitespace
      const value = String(item).trim();
      // Only add if the value is not an empty string
      if (value !== "") {
        flattened.add(value);
      }
    }
  };

  recurse(options);
  
  // Sort alphabetically and numerically for a better user experience
  // (e.g., "Size 2" will come before "Size 10")
  return Array.from(flattened).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
};