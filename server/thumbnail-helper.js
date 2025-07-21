// 🖼️ THUMBNAIL GENERATOR - Based on your base code pattern
function getThumbnail(identifier) {
  return `https://archive.org/services/img/${identifier}`;
}

// 📘 Enhanced thumbnail with fallback options
function getEnhancedThumbnail(identifier, options = {}) {
  const { size = 'default', format = 'jpg' } = options;
  
  const baseUrl = 'https://archive.org/services/img';
  
  // Size options: default, small, medium, large
  const sizeParam = size !== 'default' ? `&scale=${size}` : '';
  
  return `${baseUrl}/${identifier}${sizeParam}`;
}

module.exports = {
  getThumbnail,
  getEnhancedThumbnail
};