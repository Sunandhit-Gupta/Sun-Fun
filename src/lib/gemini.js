const { GoogleGenAI } = require("@google/genai")

// Load all keys
const GEMINI_KEYS = process.env.GEMINI_API_KEYS.split(",")

let currentKeyIndex = 0

function getAIClient() {
  return new GoogleGenAI({
    apiKey: GEMINI_KEYS[currentKeyIndex],
  })
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length
  console.warn("🔄 Switched Gemini API key →", currentKeyIndex)
}

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

  let attempts = 0

  while (attempts < GEMINI_KEYS.length) {
    try {
      const ai = getAIClient()

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      })

      const rawText = response.text.trim()
      return JSON.parse(rawText)
    } catch (err) {
      const msg = err.message || ""

      console.error("❌ Gemini error:", msg)

      // 🔥 Quota / rate limit / key issues
      if (
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("429") ||
        msg.includes("403")
      ) {
        rotateKey()
        attempts++
        continue
      }

      // ❌ Non-recoverable error
      throw err
    }
  }

  throw new Error("All Gemini API keys exhausted")
}

module.exports = { generateQuizQuestions }
