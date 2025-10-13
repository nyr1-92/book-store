// src/pages/api/get-recommendations.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📚 Generating personalized recommendations...');

  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: 'No preferences provided' });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Build prompt based on user's reading history
    const { topGenres, favoriteAuthors, recentBooks } = preferences;

    const prompt = `You are a book recommendation expert. Based on a user's reading history, provide personalized book recommendations.

USER'S READING PREFERENCES:
${topGenres && topGenres.length > 0 ? `- Favorite Genres: ${topGenres.join(', ')}` : ''}
${favoriteAuthors && favoriteAuthors.length > 0 ? `- Favorite Authors: ${favoriteAuthors.join(', ')}` : ''}
${recentBooks && recentBooks.length > 0 ? `- Recently Read: ${recentBooks.map(b => `"${b.title}" by ${b.author}`).join(', ')}` : ''}

Please recommend 5 books that would match this user's taste. For each book, explain WHY it matches their preferences.

Respond in JSON format:
{
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "reason": "Why this matches their taste (2-3 sentences)",
      "matchScore": "high/medium",
      "genre": ["Genre1", "Genre2"]
    }
  ],
  "insight": "A brief insight about the user's reading taste (1-2 sentences)"
}`;

    console.log('📤 Sending to Gemini...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📥 Received recommendations');

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]);
      return res.status(200).json({
        success: true,
        data: recommendations
      });
    } else {
      throw new Error('Could not parse recommendations');
    }

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
}
