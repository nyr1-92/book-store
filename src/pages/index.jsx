import { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Star, BookOpen, ArrowLeft, ExternalLink, Heart, History, TrendingUp, AlertTriangle, ChevronRight, X, DollarSign } from 'lucide-react';
import { saveToHistory, getHistory, clearHistory, deleteFromHistory, analyzePreferences, saveToFavorites, getSavedBooks, removeFromFavorites, isBookSaved, clearSavedBooks } from '@/lib/bookHistory';

export default function Home() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState(null);
  const [error, setError] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState('scanned'); // 'scanned' or 'saved'
  const [history, setHistory] = useState([]);
  const [savedBooks, setSavedBooks] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showDetailedSummary, setShowDetailedSummary] = useState(false);
  const [detailedData, setDetailedData] = useState(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [prices, setPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const fileInputRef = useRef(null);

  // Load history and saved books on mount
  useEffect(() => {
    setHistory(getHistory());
    setSavedBooks(getSavedBooks());
  }, []);

  // Convert image to base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setImageFile(file);
    setBookData(null);
    setDetailedData(null);
    setShowDetailedSummary(false);
    setError(null);
    setLoading(true);

    try {
      const base64Image = await imageToBase64(file);

      console.log('📤 Sending request to backend...');

      const response = await fetch('/api/scan-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, detailedSummary: false })
      });

      const data = await response.json();
      
      console.log('📥 Response received:', data);

      if (data.success) {
        setBookData(data.data);
        // Save to history
        const updatedHistory = saveToHistory(data.data);
        setHistory(updatedHistory);
        setError(null);
      } else {
        setError(data.error || 'Failed to scan book');
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Failed to scan book. Please try again.');
      setLoading(false);
    }
  };

  // Get detailed summary
  const getDetailedSummary = async () => {
    if (!imageFile) return;

    setLoadingDetailed(true);
    try {
      const base64Image = await imageToBase64(imageFile);

      const response = await fetch('/api/scan-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, detailedSummary: true })
      });

      const data = await response.json();
      
      if (data.success) {
        setDetailedData(data.data);
        setShowDetailedSummary(true);
      }
      setLoadingDetailed(false);
    } catch (err) {
      console.error('❌ Error getting detailed summary:', err);
      setLoadingDetailed(false);
    }
  };

  // Get personalized recommendations
  const getRecommendations = async () => {
    const preferences = analyzePreferences();
    
    if (!preferences) {
      alert('Scan at least one book first to get personalized recommendations!');
      return;
    }

    setShowRecommendations(true);
    setLoadingRecommendations(true);

    try {
      const response = await fetch('/api/get-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data);
      }
      setLoadingRecommendations(false);
    } catch (err) {
      console.error('❌ Error getting recommendations:', err);
      setLoadingRecommendations(false);
    }
  };

  // Get book prices
  const getPrices = async () => {
    if (!bookData) return;

    setShowPrices(true);
    setLoadingPrices(true);

    try {
      const response = await fetch('/api/check-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: bookData.title, 
          author: bookData.author 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPrices(data.data);
      }
      setLoadingPrices(false);
    } catch (err) {
      console.error('❌ Error getting prices:', err);
      setLoadingPrices(false);
    }
  };

  // Toggle save book
  const toggleSaveBook = () => {
    if (!bookData) return;

    const isSaved = isBookSaved(bookData.title);
    
    if (isSaved) {
      const updated = removeFromFavorites(bookData.title);
      setSavedBooks(updated);
    } else {
      const updated = saveToFavorites(bookData);
      setSavedBooks(updated);
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setImage(null);
    setImageFile(null);
    setBookData(null);
    setDetailedData(null);
    setShowDetailedSummary(false);
    setError(null);
    setLoading(false);
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle history item click
  const handleHistoryClick = (book) => {
    setShowLibrary(false);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all scan history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  // Clear all saved books
  const handleClearSaved = () => {
    if (confirm('Are you sure you want to clear all saved books?')) {
      clearSavedBooks();
      setSavedBooks([]);
    }
  };

  // Delete single history item
  const handleDeleteHistoryItem = (bookId) => {
    const updated = deleteFromHistory(bookId);
    setHistory(updated);
  };

  // Delete single saved book
  const handleDeleteSavedBook = (bookTitle) => {
    const updated = removeFromFavorites(bookTitle);
    setSavedBooks(updated);
  };

  const preferences = analyzePreferences();

  return (
    <div className="min-h-screen p-4 md:p-8 transition-colors duration-300 bg-white dark:bg-[#212121]">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="rounded-full px-4 py-2 shadow-sm hover:scale-105 transition-smooth flex items-center gap-2 bg-gray-100 dark:bg-[#2f2f2f] hover:bg-gray-200 dark:hover:bg-[#3a3a3a]"
            >
              <BookOpen className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Library ({history.length + savedBooks.length})</span>
            </button>

            <div className="inline-flex items-center gap-2 rounded-full px-6 py-3 shadow-sm bg-gray-100 dark:bg-[#2f2f2f]">
              <BookOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">BookLens</span>
            </div>

            <button
              onClick={getRecommendations}
              className="rounded-full px-4 py-2 shadow-sm hover:scale-105 transition-smooth flex items-center gap-2 bg-gray-100 dark:bg-[#2f2f2f] hover:bg-gray-200 dark:hover:bg-[#3a3a3a]"
            >
              <TrendingUp className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">For You</span>
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            Discover Your Next Read
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Snap a book cover, get instant insights—no spoilers!
          </p>

          {/* User Stats */}
          {preferences && (
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-300">
                📚 {preferences.totalScanned} scanned
              </span>
              {preferences.topGenres[0] && (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-300">
                  ❤️ {preferences.topGenres[0]}
                </span>
              )}
            </div>
          )}
        </header>

        {/* Library Sidebar */}
        {showLibrary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in-up" onClick={() => setShowLibrary(false)}>
            <div 
              className="absolute right-0 top-0 bottom-0 w-full max-w-md shadow-2xl overflow-y-auto bg-white dark:bg-[#2f2f2f]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Library</h2>
                  <button onClick={() => setShowLibrary(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3a3a]">
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setLibraryTab('scanned')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-smooth ${
                      libraryTab === 'scanned'
                        ? 'bg-gray-800 dark:bg-gray-700 text-white'
                        : 'bg-gray-100 dark:bg-[#212121] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                    }`}
                  >
                    Scanned ({history.length})
                  </button>
                  <button
                    onClick={() => setLibraryTab('saved')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-smooth ${
                      libraryTab === 'saved'
                        ? 'bg-gray-800 dark:bg-gray-700 text-white'
                        : 'bg-gray-100 dark:bg-[#212121] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                    }`}
                  >
                    Saved ({savedBooks.length})
                  </button>
                </div>

                {/* Scanned Tab */}
                {libraryTab === 'scanned' && (
                  <>
                    {history.length === 0 ? (
                      <p className="text-center py-12 text-gray-600 dark:text-gray-400">No books scanned yet!</p>
                    ) : (
                      <>
                        <button
                          onClick={handleClearHistory}
                          className="text-sm text-red-600 hover:text-red-700 mb-4"
                        >
                          Clear All History
                        </button>
                        <div className="space-y-3">
                          {history.map((book) => (
                            <div
                              key={book.id}
                              className="p-4 rounded-lg transition-smooth cursor-pointer flex items-start gap-3 bg-gray-50 dark:bg-[#212121] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"
                              onClick={() => handleHistoryClick(book)}
                            >
                              <BookOpen className="w-5 h-5 mt-1 flex-shrink-0 text-gray-700 dark:text-gray-300" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">{book.title}</h3>
                                <p className="text-sm truncate text-gray-600 dark:text-gray-400">{book.author}</p>
                                <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                                  {new Date(book.scannedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHistoryItem(book.id);
                                }}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Saved Tab */}
                {libraryTab === 'saved' && (
                  <>
                    {savedBooks.length === 0 ? (
                      <p className="text-center py-12 text-gray-600 dark:text-gray-400">No saved books yet!</p>
                    ) : (
                      <>
                        <button
                          onClick={handleClearSaved}
                          className="text-sm text-red-600 hover:text-red-700 mb-4"
                        >
                          Clear All Saved
                        </button>
                        <div className="space-y-3">
                          {savedBooks.map((book, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-lg transition-smooth cursor-pointer flex items-start gap-3 bg-gray-50 dark:bg-[#212121] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"
                            >
                              <Heart className="w-5 h-5 mt-1 flex-shrink-0 text-red-500 fill-red-500" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">{book.title}</h3>
                                <p className="text-sm truncate text-gray-600 dark:text-gray-400">{book.author}</p>
                                <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                                  Saved {new Date(book.savedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSavedBook(book.title);
                                }}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prices Modal */}
        {showPrices && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setShowPrices(false)}>
            <div 
              className="rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl bg-white dark:bg-[#2f2f2f]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Find Prices</h2>
                <button onClick={() => setShowPrices(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3a3a]">
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {loadingPrices ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <DollarSign className="w-12 h-12 animate-pulse text-gray-700 dark:text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400">Checking prices...</p>
                </div>
              ) : prices ? (
                <>
                  {prices.note && (
                    <p className="mb-6 p-4 rounded-lg border text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#212121] border-gray-200 dark:border-gray-700">
                      💡 {prices.note}
                    </p>
                  )}
                  <div className="space-y-3">
                    {prices.prices.map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl border transition-smooth bg-gray-50 dark:bg-[#212121] border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.retailer}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.format}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{item.availability}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center py-12 text-gray-600 dark:text-gray-400">Failed to load prices. Try again!</p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Modal */}
        {showRecommendations && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setShowRecommendations(false)}>
            <div 
              className="rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl bg-white dark:bg-[#2f2f2f]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Recommended For You</h2>
                <button onClick={() => setShowRecommendations(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3a3a]">
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {loadingRecommendations ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Sparkles className="w-12 h-12 animate-pulse text-gray-700 dark:text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400">Analyzing your taste...</p>
                </div>
              ) : recommendations ? (
                <>
                  {recommendations.insight && (
                    <p className="mb-6 p-4 rounded-lg border text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#212121] border-gray-200 dark:border-gray-700">
                      💡 <strong>Your Reading Profile:</strong> {recommendations.insight}
                    </p>
                  )}
                  <div className="space-y-4">
                    {recommendations.recommendations.map((rec, i) => (
                      <div key={i} className="p-6 rounded-2xl border transition-smooth hover:shadow-lg bg-gray-50 dark:bg-[#212121] border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{rec.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">by {rec.author}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            rec.matchScore === 'high' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                          }`}>
                            {rec.matchScore === 'high' ? '🎯 Perfect Match' : '✨ Good Match'}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {rec.genre?.map((g, j) => (
                            <span key={j} className="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300">
                              {g}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center py-12 text-gray-600 dark:text-gray-400">Failed to load recommendations. Try again!</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {!image ? (
            /* Upload Screen */
            <div
              onClick={triggerFileInput}
              className="relative overflow-hidden rounded-3xl p-16 text-center cursor-pointer transition-smooth hover:scale-[1.02] hover:shadow-xl shadow-lg group bg-gray-50 dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-smooth group-hover:scale-110 bg-gray-200 dark:bg-[#3a3a3a]">
                  <Camera className="w-12 h-12 text-gray-700 dark:text-gray-300" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    Scan a Book Cover
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tap to upload a photo or take one now
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300">
                    ✨ AI-Powered
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300">
                    🚫 No Spoilers
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300">
                    ⚡ Instant Results
                  </span>
                </div>
              </div>
            </div>

          ) : (
            /* Results Screen */
            <div className="space-y-6">
              
              {/* Book Cover Preview */}
              <div className="relative rounded-3xl overflow-hidden shadow-hard">
                <img 
                  src={image} 
                  alt="Book cover" 
                  className="w-full h-80 object-cover"
                />
                
                {loading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Sparkles className="w-16 h-16 text-white animate-pulse" />
                        <div className="absolute inset-0 shimmer"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold text-lg mb-1">
                          Analyzing book cover...
                        </p>
                        <p className="text-white/80 text-sm">
                          This takes just a moment
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 bg-red-500/90 backdrop-blur-md flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <p className="text-xl font-semibold mb-2">😕 Oops!</p>
                      <p className="mb-4">{error}</p>
                      <button
                        onClick={resetScanner}
                        className="px-6 py-2 bg-white text-red-600 rounded-full font-medium hover:bg-red-50 transition-smooth"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Information Card */}
              {bookData && !error && (
                <div className="rounded-3xl p-6 md:p-8 shadow-lg space-y-6 animate-fade-in-up bg-gray-50 dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-700">
                  
                  <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {bookData.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                      by {bookData.author}
                    </p>
                    {bookData.vibe && (
                      <p className="text-sm mt-2 italic text-gray-600 dark:text-gray-400">
                        ✨ {bookData.vibe}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-md bg-amber-500 dark:bg-amber-600">
                      <Star className="w-4 h-4 fill-white" />
                      {bookData.estimatedRating}
                    </span>
                    {bookData.genre.map((g, i) => (
                      <span 
                        key={i} 
                        className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {bookData.confidence && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        bookData.confidence === 'high' ? 'bg-green-500' :
                        bookData.confidence === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      {bookData.confidence} confidence
                    </div>
                  )}

                  {/* Spoiler-Free Summary */}
                  <div className="pt-2">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <span className="text-2xl">📖</span>
                      Spoiler-Free Summary
                    </h3>
                    <p className="leading-relaxed text-lg text-gray-700 dark:text-gray-300">
                      {bookData.summary}
                    </p>
                  </div>

                  {/* Detailed Summary Button */}
                  {!showDetailedSummary && (
                    <button
                      onClick={getDetailedSummary}
                      disabled={loadingDetailed}
                      className="w-full py-3 px-6 rounded-2xl glass border-2 border-orange-300 text-gray-800 font-semibold hover:bg-orange-50 transition-smooth flex items-center justify-center gap-2"
                    >
                      {loadingDetailed ? (
                        <>
                          <Sparkles className="w-5 h-5 animate-pulse" />
                          Loading Detailed Summary...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                          Get Detailed Summary (May Contain Spoilers)
                        </>
                      )}
                    </button>
                  )}

                  {/* Detailed Summary */}
                  {showDetailedSummary && detailedData && (
                    <div className="pt-4 border-t-2 -mx-6 -mb-6 px-6 pb-6 rounded-b-3xl border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
                      <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-600 dark:text-orange-500" />
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                          <strong>Warning:</strong> The following contains more detailed plot information that may spoil your reading experience.
                        </p>
                      </div>

                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <span className="text-2xl">📕</span>
                        Detailed Summary
                      </h3>
                      <p className="leading-relaxed mb-4 text-gray-700 dark:text-gray-300">
                        {detailedData.summary}
                      </p>

                      {detailedData.detailedPlot && (
                        <>
                          <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Story Progression:</h4>
                          <p className="leading-relaxed mb-4 text-gray-700 dark:text-gray-300">
                            {detailedData.detailedPlot}
                          </p>
                        </>
                      )}

                      {detailedData.themes && detailedData.themes.length > 0 && (
                        <>
                          <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Major Themes:</h4>
                          <div className="flex gap-2 flex-wrap">
                            {detailedData.themes.map((theme, i) => (
                              <span key={i} className="px-3 py-1 rounded-full text-sm bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-300">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => setShowDetailedSummary(false)}
                        className="mt-4 text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                      >
                        Hide Detailed Summary
                      </button>
                    </div>
                  )}

                  {/* Similar Books */}
                  {bookData.similarBooks && bookData.similarBooks.length > 0 && (
                    <div className="pt-2">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <span className="text-2xl">💡</span>
                        If you like this, try:
                      </h3>
                      <div className="space-y-2">
                        {bookData.similarBooks.map((book, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-smooth bg-gray-100 dark:bg-[#212121] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-gray-300"
                          >
                            <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span>{book}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Warnings */}
                  {bookData.contentWarnings && bookData.contentWarnings.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span>⚠️</span>
                        Content Notes
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {bookData.contentWarnings.map((warning, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1.5 rounded-full text-xs border bg-gray-200 dark:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                          >
                            {warning}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={getPrices}
                      className="py-4 px-6 rounded-2xl font-semibold shadow-md transition-smooth hover:scale-[1.02] flex items-center justify-center gap-2 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white"
                    >
                      <DollarSign className="w-5 h-5" />
                      Find Prices
                    </button>
                    <button 
                      onClick={toggleSaveBook}
                      className="py-4 px-6 rounded-2xl font-semibold shadow-md transition-smooth hover:scale-[1.02] flex items-center justify-center gap-2 bg-gray-200 dark:bg-[#3a3a3a] hover:bg-gray-300 dark:hover:bg-[#4a4a4a] text-gray-800 dark:text-gray-200"
                    >
                      <Heart className={`w-5 h-5 ${isBookSaved(bookData?.title) ? 'fill-red-500 text-red-500' : ''}`} />
                      {isBookSaved(bookData?.title) ? 'Saved' : 'Save Book'}
                    </button>
                  </div>
                </div>
              )}

              {/* Scan Another Button */}
              <button
                onClick={resetScanner}
                className="w-full py-4 rounded-2xl font-semibold shadow-md transition-smooth hover:scale-[1.02] flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#2f2f2f] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-800 dark:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Scan Another Book
              </button>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}