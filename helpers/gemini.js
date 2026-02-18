const axios = require("axios");

const geminiKey = process.env.GEMINI_API_KEY;
const geminiURL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function getGeminiRecommendation(pokemonName, types) {
  try {
    const prompt = `
    You are a competitive Pokémon coach.
    Suggest a recommended competitive moveset, role, and nature for ${pokemonName},
    which has type(s): ${types.join(", ")}.
    Provide result as JSON with keys: role, suggestedMoves, nature.
    `;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await axios.post(geminiURL, body, {
      headers: {
        "x-goog-api-key": geminiKey,
        "Content-Type": "application/json",
      },
    });

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    let parsed = {
      role: "Balanced",
      suggestedMoves: ["Protect", "Substitute"],
      nature: "Neutral",
    };

    if (text) {
      try {
        const cleanText = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleanText);
      } catch (err) {
        console.warn("Gemini output not JSON, fallback used");
      }
    }

    return parsed;
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return {
      role: "Balanced",
      suggestedMoves: ["Protect", "Substitute"],
      nature: "Neutral",
    };
  }
}

module.exports = { getGeminiRecommendation };
