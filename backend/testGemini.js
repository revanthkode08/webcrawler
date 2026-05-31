require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
    
    for (const m of modelsToTest) {
      console.log(`Testing model: ${m}`);
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Say hello");
        console.log(`Success for ${m}:`, result.response.text().substring(0, 50));
        break; // If one works, we stop!
      } catch (err) {
        console.error(`Error for ${m}:`, err.status, err.statusText, err.message);
      }
    }
  } catch (e) {
    console.error('Fatal error:', e);
  }
}
test();
