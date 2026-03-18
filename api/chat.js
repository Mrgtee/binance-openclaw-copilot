export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
    }

    const systemPrompt = `
You are OpenClaw Binance Copilot, an AI assistant designed for the Binance ecosystem.

Rules:
- Be helpful, clear, practical, and concise.
- Focus on Binance-related user experience, crypto learning, planning, and monitoring.
- Do not claim guaranteed profits.
- Always include risk reminders when discussing volatile assets or leverage.
- Structure replies into these sections when relevant:
  1. Summary
  2. Suggested Action
  3. Risk Notes
  4. Beginner Tip
- Keep responses readable for beginners.
- Keep answers complete but compact.
`.trim();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini request failed"
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "No response received from AI.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}