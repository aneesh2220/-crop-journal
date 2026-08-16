import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

app.post("/api/analyze", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Add it to your .env file." });
  }

  const { crop, dayCount, language, base64 } = req.body || {};
  if (!crop || base64 === undefined || dayCount === undefined) {
    return res.status(400).json({ error: "Request must include crop, dayCount, and base64 image data." });
  }

  const system = `You are an agricultural extension officer helping small farmers in India monitor crop health from a single field photo. Be practical and specific, never vague. Respond entirely in ${language || "English"}. Return ONLY a valid JSON object with exactly these keys:
{"growth_stage": string, "health_status": "healthy"|"stressed"|"diseased"|"unclear", "issue_detected": string or null, "confidence": "high"|"medium"|"low", "recommendation": string (2-3 short, actionable sentences), "urgent": boolean}
If the photo does not clearly show the named crop or field, set health_status to "unclear" and use the recommendation field to say what kind of photo would help instead.`;

  const userText = `Crop: ${crop}. Days since sowing: ${dayCount}. Look closely at leaf colour, spotting, wilting, pest damage, and overall canopy density, then analyze this photo.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [
          {
            parts: [
              { text: userText },
              { inline_data: { mime_type: "image/jpeg", data: base64 } },
            ],
          },
        ],
        generationConfig: { response_mime_type: "application/json" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      const hint = response.status === 404
        ? ` Model "${MODEL}" isn't available for this API key. Check https://ai.google.dev/gemini-api/docs/models and set GEMINI_MODEL in .env.`
        : "";
      return res.status(502).json({ error: `Gemini API request failed (${response.status}).${hint}` });
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); } catch { parsed = null; }

    if (!parsed) {
      return res.json({
        growth_stage: "Not identified", health_status: "unclear", issue_detected: null,
        confidence: "low", recommendation: raw || "Could not read a clear answer. Try a closer, well-lit photo.",
        urgent: false,
      });
    }

    return res.json({
      growth_stage: parsed.growth_stage || "Not identified",
      health_status: ["healthy", "stressed", "diseased", "unclear"].includes(parsed.health_status) ? parsed.health_status : "unclear",
      issue_detected: parsed.issue_detected || null,
      confidence: parsed.confidence || "medium",
      recommendation: parsed.recommendation || "No specific recommendation returned.",
      urgent: !!parsed.urgent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected server error while analyzing the photo." });
  }
});

// No build step: this just serves the plain HTML file directly.
app.use(express.static(path.join(__dirname, "public")));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Crop Journal running on http://localhost:${PORT}`);
});
