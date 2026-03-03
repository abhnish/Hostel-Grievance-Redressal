const https = require('https');

/**
 * Classifies complaint text using AI or rule-based fallback
 * @param {string} text - Complaint description to classify
 * @returns {Promise<Object>} Classification result with category, subcategory, urgency, sentiment
 */
async function classifyText(text) {
  try {
    // Try AI classification if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiResult = await callGeminiAPI(text);
        if (aiResult) {
          return aiResult;
        }
      } catch (error) {
        console.warn('AI classification failed, using fallback:', error.message);
      }
    }
  } catch (error) {
    console.warn('AI service initialization failed, using fallback:', error.message);
  }

  // Rule-based fallback classification
  return ruleBasedClassification(text);
}

/**
 * Calls Gemini API for text classification
 * @param {string} text 
 * @returns {Promise<Object|null>}
 */
async function callGeminiAPI(text) {
  return new Promise((resolve, reject) => {
    const prompt = `Classify this municipal complaint text and return ONLY JSON with these exact keys:
{
  "category": "Water Supply|Road|Electricity|General|Waste Management|Health",
  "subcategory": "brief subcategory or empty string",
  "urgency": "low|medium|high", 
  "sentiment": "angry|neutral|positive"
}

Complaint: "${text}"

Respond with ONLY the JSON object, no explanations.`;

    const data = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`API returned status ${res.statusCode}`);
          }
          
          const result = JSON.parse(responseData);
          const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (textContent) {
            const classification = JSON.parse(textContent.trim());
            resolve(classification);
          } else {
            reject(new Error('No valid response from AI'));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse AI response: ${parseError.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI API timeout'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Rule-based classification fallback
 * @param {string} text 
 * @returns {Object}
 */
function ruleBasedClassification(text) {
  const lowerText = text.toLowerCase();
  
  // Category classification
  let category = 'General';
  if (lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('pipe')) {
    category = 'Water Supply';
  } else if (lowerText.includes('pothole') || lowerText.includes('road') || lowerText.includes('street')) {
    category = 'Road';
  } else if (lowerText.includes('electric') || lowerText.includes('power') || lowerText.includes('outage')) {
    category = 'Electricity';
  } else if (lowerText.includes('garbage') || lowerText.includes('waste') || lowerText.includes('trash')) {
    category = 'Waste Management';
  } else if (lowerText.includes('hospital') || lowerText.includes('health') || lowerText.includes('medical')) {
    category = 'Health';
  }

  // Urgency classification
  let urgency = 'low';
  if (lowerText.includes('hospital') || lowerText.includes('emergency') || lowerText.includes('danger')) {
    urgency = 'high';
  } else if (lowerText.includes('urgent') || lowerText.includes('blocked') || lowerText.includes('critical')) {
    urgency = 'medium';
  }

  // Sentiment classification
  let sentiment = 'neutral';
  if (lowerText.includes('angry') || lowerText.includes('not working') || lowerText.includes('complaint') || lowerText.includes('frustrated')) {
    sentiment = 'angry';
  } else if (lowerText.includes('thank') || lowerText.includes('good') || lowerText.includes('appreciate')) {
    sentiment = 'positive';
  }

  return {
    category,
    subcategory: '',
    urgency,
    sentiment
  };
}

module.exports = {
  classifyText
};
