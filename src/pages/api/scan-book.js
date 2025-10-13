// src/pages/api/scan-book.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow larger images
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log incoming request (helpful for debugging)
  console.log('📸 Received book scan request');

  try {
    const { image, detailedSummary = false } = req.body;

    // Validate image data
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('🤖 Initializing Gemini...');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // The prompt - this is where the magic happens!
    const prompt = `You are analyzing a book cover image. Please identify the book and provide information.

IMPORTANT RULES:
- Keep summaries SPOILER-FREE (only mention the basic premise, no plot twists or endings)
- Be concise but engaging
- If you're not confident about the book, say so

Please provide a JSON response with this EXACT structure:
{
  "title": "Book title",
  "author": "Author name",
  "summary": "2-3 sentence spoiler-free description that captures mood and premise",
  "genre": ["Genre1", "Genre2"],
  "estimatedRating": "X.X/5 (estimated from reader reviews)",
  "similarBooks": ["Book 1", "Book 2", "Book 3"],
  "contentWarnings": ["Warning1", "Warning2"] or [],
  "confidence": "high/medium/low"
}

If you cannot identify the book clearly, respond with:
{
  "title": "UNKNOWN",
  "author": "UNKNOWN",
  "summary": "I couldn't identify this book clearly. Please try a clearer photo of the cover.",
  "genre": [],
  "estimatedRating": "N/A",
  "similarBooks": [],
  "contentWarnings": [],
  "confidence": "low"
}`;

    console.log('📤 Sending to Gemini API...');

    // Call Gemini with image
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('📥 Received response from Gemini');
    console.log('Raw response:', text);

    // Extract JSON from response (Gemini sometimes adds markdown formatting)
    let bookData;
    
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        bookData = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed book data:', bookData.title);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Could not parse response as valid JSON');
      }
    } else {
      console.error('❌ No JSON found in response');
      throw new Error('Gemini did not return valid JSON');
    }

    // Validate required fields
    if (!bookData.title || !bookData.author) {
      throw new Error('Missing required fields in response');
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: bookData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error scanning book:', error);
    
    // Return detailed error for debugging
    return res.status(500).json({ 
      success: false,
      error: 'Failed to scan book',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}