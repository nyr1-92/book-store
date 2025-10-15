// src/pages/api/check-prices.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('💰 Checking book prices...');

  try {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Find current prices for this book: "${title}" by ${author}

Search for prices at these retailers:
- Amazon
- Target
- ThriftBooks
- Barnes & Noble
- Walmart

Provide approximate current prices. If you don't know exact prices, provide typical price ranges based on the book type.

Respond in JSON format:
{
  "prices": [
    {
      "retailer": "Amazon",
      "price": "$X.XX",
      "format": "Paperback/Hardcover/Kindle",
      "availability": "In Stock/Out of Stock/Pre-order"
    }
  ],
  "note": "Brief note about price variations or deals"
}

Be helpful even if you don't have exact real-time prices. Provide typical price ranges.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📥 Received price data');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const priceData = JSON.parse(jsonMatch[0]);
      return res.status(200).json({
        success: true,
        data: priceData
      });
    } else {
      throw new Error('Could not parse price data');
    }

  } catch (error) {
    console.error('❌ Error checking prices:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check prices',
      details: error.message
    });
  }
}