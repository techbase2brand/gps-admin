// Utility function to capitalize first letter of text
export const capitalizeFirstLetter = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Utility function to capitalize each word in text (for cases like "honda civic")
export const capitalizeWords = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .split(' ')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
};
