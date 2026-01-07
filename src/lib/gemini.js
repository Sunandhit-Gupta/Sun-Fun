const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

console.log("Using Gemini API key:", Boolean(process.env.GEMINI_API_KEY))

async function generateQuizQuestions(topic, count) {
  const prompt = `
Generate ${count} multiple-choice quiz questions on the topic "${topic}".

Rules:
- Each question must have exactly 4 options
- Only ONE correct answer
- Difficulty: medium
- Avoid repetition
- Output STRICT JSON ONLY (no markdown, no explanation)

JSON format:
[
  {
    "question": "Question text",
    "options": ["Ai", "Bc", "Ci", "Dl"],
    "correctAnswer": "Ai"
  }
]
`

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  })

  // Gemini returns text — we must parse safely
  const rawText = response.text.trim()

  try {
    return JSON.parse(rawText)
  } catch (err) {
    console.error("❌ Gemini JSON parse failed:", rawText)
    throw new Error("Invalid Gemini response format")
  }
}

module.exports = { generateQuizQuestions }
