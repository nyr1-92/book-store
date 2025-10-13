// src/pages/index.jsx
import { useState, useRef } from 'react';
import { Camera, Sparkles, Star, BookOpen, ArrowLeft, ExternalLink, Heart } from 'lucide-react';
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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

    // Show preview
    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setImageFile(file);
    setBookData(null);
    setError(null);
    setLoading(true);

    try {
      // Convert to base64
      const base64Image = await imageToBase64(file);

      console.log('📤 Sending request to backend...');

      // Call our API endpoint
      const response = await fetch('/api/scan-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();
      
      console.log('📥 Response received:', data);

      if (data.success) {
        setBookData(data.data);
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

  // Reset scanner
  const resetScanner = () => {
    setImage(null);
    setImageFile(null);
    setBookData(null);
    setError(null);
    setLoading(false);
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 glass-strong rounded-full px-6 py-3 shadow-lg mb-4">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">BookLens</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Discover Your Next Read
          </h1>
          <p className="text-gray-600 text-lg">
            Snap a book cover, get instant insights—no spoilers!
          </p>
        </header>

        {/* Main Content */}
        <main className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Hidden file input */}
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
                {/* Camera Icon */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 flex items-center justify-center shadow-hard transition-smooth group-hover:scale-110">
                  <Camera className="w-12 h-12 text-white" />
                </div>

                {/* Text */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Scan a Book Cover
                  </h2>
                  <p className="text-gray-600">
                    Tap to upload a photo or take one now
                  </p>
                </div>

                {/* Features */}
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

              {/* Decorative blobs */}
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
                
                {/* Loading Overlay */}
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

                {/* Error Overlay */}
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
                  
                  {/* Title & Author */}
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      {bookData.title}
                    </h2>
                    <p className="text-xl text-gray-600">
                      by {bookData.author}
                    </p>
                  </div>

                  {/* Rating & Genre Pills */}
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

                  {/* Confidence Badge */}
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

                  {/* Summary */}
                  <div className="pt-2">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-2xl">📖</span>
                      Spoiler-Free Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {bookData.summary}
                    </p>
                  </div>

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
                            className="flex items-center gap-2 text-gray-700 bg-white/40 rounded-lg px-4 py-2 backdrop-blur-sm"
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
