// src/pages/index.jsx
import { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Star, BookOpen, ArrowLeft, ExternalLink, Heart, History, TrendingUp, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { saveToHistory, getHistory, clearHistory, deleteFromHistory, analyzePreferences } from '@/lib/bookHistory';

export default function Home() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState(null);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showDetailedSummary, setShowDetailedSummary] = useState(false);
  const [detailedData, setDetailedData] = useState(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const fileInputRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
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
    setShowHistory(false);
    // Could expand this to show full details
  };

  // Clear all history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all scan history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  // Delete single history item
  const handleDeleteHistoryItem = (bookId) => {
    const updated = deleteFromHistory(bookId);
    setHistory(updated);
  };

  const preferences = analyzePreferences();

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 p-4 md:p-8">      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="glass-strong rounded-full px-4 py-2 shadow-lg hover:scale-105 transition-smooth flex items-center gap-2"
            >
              <History className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-800">History ({history.length})</span>
            </button>

            <div className="inline-flex items-center gap-2 glass-strong rounded-full px-6 py-3 shadow-lg">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">BookLens</span>
            </div>

            <button
              onClick={getRecommendations}
              className="glass-strong rounded-full px-4 py-2 shadow-lg hover:scale-105 transition-smooth flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-800">For You</span>
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 dark:text-white">
            Discover Your Next Read
          </h1>
          <p className="text-gray-600 text-lg dark:text-white">
            Snap a book cover, get instant insights—no spoilers!
          </p>

          {/* User Stats */}
          {preferences && (
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/50 text-sm text-gray-700">
                📚 {preferences.totalScanned} scanned
              </span>
              {preferences.topGenres[0] && (
                <span className="px-3 py-1 rounded-full bg-purple-100/80 text-sm text-purple-800">
                  ❤️ {preferences.topGenres[0]}
                </span>
              )}
            </div>
          )}
        </header>

        {/* History Sidebar */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in-up" onClick={() => setShowHistory(false)}>
            <div 
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Scan History</h2>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {history.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No books scanned yet!</p>
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
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth cursor-pointer flex items-start gap-3"
                          onClick={() => handleHistoryClick(book)}
                        >
                          <BookOpen className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate">{book.title}</h3>
                            <p className="text-sm text-gray-600 truncate">{book.author}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(book.scannedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistoryItem(book.id);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Modal */}
        {showRecommendations && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setShowRecommendations(false)}>
            <div 
              className="glass-strong rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Recommended For You</h2>
                <button onClick={() => setShowRecommendations(false)} className="p-2 hover:bg-white/50 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingRecommendations ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
                  <p className="text-gray-600">Analyzing your taste...</p>
                </div>
              ) : recommendations ? (
                <>
                  {recommendations.insight && (
                    <p className="text-gray-700 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      💡 <strong>Your Reading Profile:</strong> {recommendations.insight}
                    </p>
                  )}
                  <div className="space-y-4">
                    {recommendations.recommendations.map((rec, i) => (
                      <div key={i} className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 hover:shadow-lg transition-smooth">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800">{rec.title}</h3>
                            <p className="text-gray-600">by {rec.author}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            rec.matchScore === 'high' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.matchScore === 'high' ? '🎯 Perfect Match' : '✨ Good Match'}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {rec.genre?.map((g, j) => (
                            <span key={j} className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                              {g}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-600 text-center py-12">Failed to load recommendations. Try again!</p>
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
              className="relative overflow-hidden rounded-3xl glass p-16 text-center cursor-pointer transition-smooth hover:scale-[1.02] hover:shadow-xl shadow-soft group"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 flex items-center justify-center shadow-hard transition-smooth group-hover:scale-110">
                  <Camera className="w-12 h-12 text-white" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 dark:text-gray-300">
                    Scan a Book Cover
                  </h2>
                  <p className="text-gray-600">
                    Tap to upload a photo or take one now
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <span className="px-3 py-1 rounded-full bg-white/50 text-sm text-gray-700">
                    ✨ AI-Powered
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/50 text-sm text-gray-700">
                    🚫 No Spoilers
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/50 text-sm text-gray-700">
                    ⚡ Instant Results
                  </span>
                </div>
              </div>

              <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-purple-300/30 blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-pink-300/30 blur-2xl"></div>
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
                <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-hard space-y-6 animate-fade-in-up">
                  
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      {bookData.title}
                    </h2>
                    <p className="text-xl text-gray-600">
                      by {bookData.author}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-semibold shadow-lg">
                      <Star className="w-4 h-4 fill-white" />
                      {bookData.estimatedRating}
                    </span>
                    {bookData.genre.map((g, i) => (
                      <span 
                        key={i} 
                        className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-purple-800 text-sm font-medium border border-purple-200"
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
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-2xl">📖</span>
                      Spoiler-Free Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
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
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          Get Detailed Summary (May Contain Spoilers)
                        </>
                      )}
                    </button>
                  )}

                  {/* Detailed Summary */}
                  {showDetailedSummary && detailedData && (
                    <div className="pt-4 border-t-2 border-orange-200 bg-orange-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-3xl">
                      <div className="flex items-start gap-2 mb-4 p-3 bg-orange-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-800">
                          <strong>Warning:</strong> The following contains more detailed plot information that may spoil your reading experience.
                        </p>
                      </div>

                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📕</span>
                        Detailed Summary
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {detailedData.summary}
                      </p>

                      {detailedData.detailedPlot && (
                        <>
                          <h4 className="font-semibold text-gray-800 mb-2">Story Progression:</h4>
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {detailedData.detailedPlot}
                          </p>
                        </>
                      )}

                      {detailedData.themes && detailedData.themes.length > 0 && (
                        <>
                          <h4 className="font-semibold text-gray-800 mb-2">Major Themes:</h4>
                          <div className="flex gap-2 flex-wrap">
                            {detailedData.themes.map((theme, i) => (
                              <span key={i} className="px-3 py-1 rounded-full bg-orange-200 text-orange-800 text-sm">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => setShowDetailedSummary(false)}
                        className="mt-4 text-sm text-orange-700 hover:text-orange-800 font-medium"
                      >
                        Hide Detailed Summary
                      </button>
                    </div>
                  )}

                  {/* Similar Books */}
                  {bookData.similarBooks && bookData.similarBooks.length > 0 && (
                    <div className="pt-2">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💡</span>
                        If you like this, try:
                      </h3>
                      <div className="space-y-2">
                        {bookData.similarBooks.map((book, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-2 text-gray-700 bg-white/40 rounded-lg px-4 py-2 backdrop-blur-sm hover:bg-white/60 transition-smooth"
                          >
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <span>{book}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Warnings */}
                  {bookData.contentWarnings && bookData.contentWarnings.length > 0 && (
                    <div className="pt-4 border-t border-gray-200/50">
                      <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                        <span>⚠️</span>
                        Content Notes
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {bookData.contentWarnings.map((warning, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1.5 rounded-full bg-gray-200/80 backdrop-blur-sm text-gray-700 text-xs border border-gray-300"
                          >
                            {warning}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button className="py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-semibold shadow-hard hover:shadow-xl transition-smooth hover:scale-[1.02] flex items-center justify-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Find Prices
                    </button>
                    <button className="py-4 px-6 rounded-2xl glass-strong text-gray-800 font-semibold shadow-hard hover:shadow-xl transition-smooth hover:scale-[1.02] flex items-center justify-center gap-2">
                      <Heart className="w-5 h-5" />
                      Save Book
                    </button>
                  </div>
                </div>
              )}

              {/* Scan Another Button */}
              <button
                onClick={resetScanner}
                className="w-full py-4 rounded-2xl glass text-gray-800 font-semibold shadow-soft hover:shadow-lg transition-smooth hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Scan Another Book
              </button>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p>Powered by AI • No spoilers, just insights ✨</p>
        </footer>

      </div>
    </div>
  );
}