// src/pages/test-api.jsx
import { useState } from 'react';

export default function TestAPI() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];

        // Call our API
        const response = await fetch('/api/scan-book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.error || 'Unknown error');
        }

        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🧪 Backend API Test</h1>
      <p>Upload a book cover to test if the Gemini API is working correctly.</p>

      <div style={{ marginTop: '30px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '2px solid #333',
            borderRadius: '8px',
          }}
        />
      </div>

      {loading && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <p>⏳ Analyzing book cover...</p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#e8f5e9', borderRadius: '8px' }}>
          <h3>✅ Success!</h3>
          
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ marginBottom: '5px' }}>{result.title}</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>by {result.author}</p>
            
            <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>{result.summary}</p>
            
            <div style={{ marginBottom: '10px' }}>
              <strong>Genre:</strong> {result.genre.join(', ')}
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <strong>Rating:</strong> {result.estimatedRating}
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <strong>Similar Books:</strong>
              <ul>
                {result.similarBooks.map((book, i) => (
                  <li key={i}>{book}</li>
                ))}
              </ul>
            </div>
            
            {result.contentWarnings.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Content Warnings:</strong> {result.contentWarnings.join(', ')}
              </div>
            )}
            
            <div style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px' }}>
              <strong>Confidence:</strong> {result.confidence}
            </div>
          </div>

          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Raw JSON</summary>
            <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
