// src/lib/bookHistory.js

const STORAGE_KEY = 'booklens_history';
const MAX_HISTORY = 50; // Keep last 50 scans

/**
 * Save a scanned book to history
 */
export const saveToHistory = (bookData) => {
  try {
    const history = getHistory();
    
    // Add timestamp and generate ID
    const bookEntry = {
      ...bookData,
      id: Date.now(),
      scannedAt: new Date().toISOString(),
    };
    
    // Check if book already exists (by title)
    const existingIndex = history.findIndex(
      (book) => book.title.toLowerCase() === bookData.title.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Update existing entry (move to top)
      history.splice(existingIndex, 1);
    }
    
    // Add to beginning of array
    history.unshift(bookEntry);
    
    // Keep only last MAX_HISTORY items
    const trimmedHistory = history.slice(0, MAX_HISTORY);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    
    return trimmedHistory;
  } catch (error) {
    console.error('Error saving to history:', error);
    return [];
  }
};

/**
 * Get all scan history
 */
export const getHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
};

/**
 * Clear all history
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};

/**
 * Delete a specific book from history
 */
export const deleteFromHistory = (bookId) => {
  try {
    const history = getHistory();
    const filtered = history.filter((book) => book.id !== bookId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Error deleting from history:', error);
    return [];
  }
};

/**
 * Analyze user's reading preferences from history
 */
export const analyzePreferences = () => {
  const history = getHistory();
  
  if (history.length === 0) {
    return null;
  }
  
  // Count genres
  const genreCounts = {};
  history.forEach((book) => {
    book.genre?.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  
  // Sort genres by frequency
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);
  
  // Get favorite authors (scanned multiple times)
  const authorCounts = {};
  history.forEach((book) => {
    const author = book.author;
    authorCounts[author] = (authorCounts[author] || 0) + 1;
  });
  
  const favoriteAuthors = Object.entries(authorCounts)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([author]) => author);
  
  return {
    topGenres,
    favoriteAuthors,
    totalScanned: history.length,
    recentBooks: history.slice(0, 5),
  };
};

/**
 * Get personalized prompt for recommendations
 */
export const getRecommendationPrompt = () => {
  const preferences = analyzePreferences();
  
  if (!preferences) {
    return '';
  }
  
  const { topGenres, favoriteAuthors, recentBooks } = preferences;
  
  let prompt = '\n\nBased on the user\'s reading history:\n';
  
  if (topGenres.length > 0) {
    prompt += `- Favorite genres: ${topGenres.join(', ')}\n`;
  }
  
  if (favoriteAuthors.length > 0) {
    prompt += `- Favorite authors: ${favoriteAuthors.join(', ')}\n`;
  }
  
  if (recentBooks.length > 0) {
    prompt += `- Recently scanned: ${recentBooks.map(b => b.title).join(', ')}\n`;
  }
  
  prompt += '\nPlease provide personalized book recommendations that match these preferences.';
  
  return prompt;
};
