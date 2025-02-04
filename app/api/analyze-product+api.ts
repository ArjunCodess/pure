import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PROMPT_TEMPLATE = `Analyze the following product ingredients text and provide a detailed analysis in a strict JSON format. 

IMPORTANT GUIDELINES:
1. Make your best educated guess for product information - DO NOT use "Unspecified" or similar terms
2. Add "(not confirmed)" after the product name if you're making an educated guess
3. Be specific and detailed in your analysis
4. Return ONLY raw JSON without any markdown formatting or code blocks
5. Do not include \`\`\`json or \`\`\` tags

The response should be in this exact JSON format:
{
  "productInfo": {
    "type": "string (be specific, e.g., 'Facial Cleanser' instead of just 'Skincare')",
    "name": "string (your best guess + '(not confirmed)' if uncertain)",
    "brand": "string (your best guess + '(not confirmed)' if uncertain)"
  },
  "harmfulIngredients": [
    {
      "name": "string",
      "concern": "string (be specific about potential health impacts)",
      "riskLevel": "high|medium|low"
    }
  ],
  "ingredients": [
    {
      "name": "string",
      "purpose": "string (specific function in the product)",
      "description": "string (detailed explanation)",
      "safetyInfo": "string (include research-based safety information)"
    }
  ],
  "allergens": ["string (list all potential allergens, even if uncommon)"],
  "dietary": {
    "isVegan": boolean,
    "isVegetarian": boolean,
    "restrictions": ["string (list all dietary restrictions this might violate)"]
  },
  "environmentalImpact": {
    "rating": "high|medium|low",
    "details": "string (specific environmental concerns and impacts)"
  }
}

Example product name format:
- "Gentle Foaming Cleanser (not confirmed)" - when making an educated guess
- "Cetaphil Daily Facial Cleanser" - when name is clearly visible

Here's the text to analyze:`;

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Remove any leading/trailing whitespace
  text = text.trim();
  
  // If the text starts with a newline, remove it
  text = text.replace(/^\n+/, '');
  
  // If there are multiple newlines, reduce to single newlines
  text = text.replace(/\n+/g, '\n');
  
  return text;
}

export async function POST(request: Request) {
  try {
    const { extractedText } = await request.json();

    if (!extractedText) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Combine prompt template with extracted text
    const prompt = `${PROMPT_TEMPLATE}\n\n${extractedText}`;

    // Generate analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response as JSON
    try {
      const cleanedText = cleanJsonResponse(text);
      console.log('Cleaned response:', cleanedText);
      
      const analysisData = JSON.parse(cleanedText);
      return Response.json({
        success: true,
        analysis: analysisData,
      });
    } catch (error) {
      console.error('Failed to parse Gemini response as JSON:', error);
      console.error('Raw response:', text);
      return Response.json({
        error: 'Failed to parse product analysis',
        rawResponse: text,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Product analysis error:', error);
    return Response.json(
      { error: error.message || 'Failed to analyze product' },
      { status: 500 }
    );
  }
} 