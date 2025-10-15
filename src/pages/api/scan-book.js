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
    const prompt = detailedSummary ? 
      // DETAILED SUMMARY (may contain spoilers)
      `You are analyzing a book cover image. Please identify the book and provide DETAILED information.

IMPORTANT: This is a DETAILED summary request, so you can include more plot details (but still avoid the ending).

Please provide a JSON response with this EXACT structure:
{
  "title": "Book title",
  "author": "Author name",
  "summary": "4-5 sentence detailed description including major plot points, character arcs, and themes (avoid only the ending)",
  "detailedPlot": "Additional 2-3 sentences about the story progression and key conflicts",
  "themes": ["Theme1", "Theme2", "Theme3"],
  "genre": ["Genre1", "Genre2"],
  "estimatedRating": "X.X/5 (estimated from reader reviews)",
  "similarBooks": ["Book 1", "Book 2", "Book 3"],
  "contentWarnings": ["Warning1", "Warning2"] or [],
  "confidence": "high/medium/low",
  "isSpoilerFree": false
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
  "confidence": "low",
  "isSpoilerFree": true
}`
      :
      // SPOILER-FREE SUMMARY (default) - NEW ENGAGING VERSION!
      `You are a librarian helping someone discover their next great read! Analyze this book cover and provide what is story narrated in the book.

TONE GUIDELINES:
- Use vivid, evocative language but make it still easily understandable
- Create intrigue without spoiling
- Sound natural, not robotic

SPOILER-FREE RULES:
- Only mention the basic premise (first 20-25% of the book)
- NO plot twists, revelations, or endings
- Focus on atmosphere, themes, and what makes it special
- Tease the journey, not the destination

Provide a JSON response with this EXACT structure:
{
  "title": "Book title",
  "author": "Author name",
  "summary": "2-3 enthusiastic sentences that capture the essence and hook the reader. Make it sound exciting! Use words like 'gripping', 'unforgettable', 'mesmerizing' when appropriate.",
  "genre": ["Genre1", "Genre2"],
  "estimatedRating": "X.X/5 (based on reader consensus)",
  "similarBooks": ["Book 1", "Book 2", "Book 3"],
  "contentWarnings": ["Warning1", "Warning2"] or [],
  "confidence": "high/medium/low",
  "isSpoilerFree": true,
  "vibe": "A short phrase capturing the book's vibe (e.g., 'Dark and atmospheric', 'Heartwarming adventure', 'Mind-bending thriller')"
}

EXAMPLE GOOD SUMMARY:
"A spellbinding tale that blurs the line between reality and dreams. When Nora finds herself in a mysterious library between life and death, each book offers a glimpse into a life she could have lived—but which one is truly hers? Haig crafts an unforgettable exploration of regret, possibility, and the courage to embrace who we really are."

EXAMPLE BAD SUMMARY (too dry):
"This book is about a woman who visits a library. She looks at different books. She learns about choices."

If you cannot identify the book clearly, respond with:
{
  "title": "UNKNOWN",
  "author": "UNKNOWN",
  "summary": "Hmm, I'm having trouble making out the details on this cover. Could you try taking a clearer photo? Make sure the title and author are visible!",
  "genre": [],
  "estimatedRating": "N/A",
  "similarBooks": [],
  "contentWarnings": [],
  "confidence": "low",
  "isSpoilerFree": true,
  "vibe": ""
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