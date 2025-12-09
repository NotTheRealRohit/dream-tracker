// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenRouter } = require("@openrouter/sdk");

const app = express();

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 AI calls per 15 mins
});

app.use("/api/", limiter);

// Allow all origins for now (you can tighten later)
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

// Serve static frontend from /public
// Put index.html, css, js inside ./public
app.use(express.static("public"));

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Helper to call LLM and get JSON plan
async function getPlanFromLLM(payload) {
  const { finance, items } = payload;

  const messages = [
    {
      role: "system",
      content:
        "You are a frugal but friendly Indian personal-finance coach. " +
        "Return ONLY valid JSON, no markdown, no ``` fences, no explanations outside JSON.",
    },
    {
      role: "user",
      content: `
Here is the current situation as JSON:

${JSON.stringify({ finance, items }, null, 2)}

Create a month-by-month purchase plan.

Output JSON only with this structure:

{
  "summary": "string",
  "assumptions": ["string"],
  "months": [
    {
      "monthOffset": 1,
      "label": "Month 1",
      "budget": {
        "monthlySavings": number,
        "usedForPurchases": number,
        "leftover": number
      },
      "purchases": [
        {
          "itemId": "id from input",
          "itemName": "name",
          "price": number,
          "notes": "reasoning"
        }
      ],
      "tips": ["string"]
    }
  ]
}
      `,
    },
  ];

  const completion = await openrouter.chat.send({
    model: "amazon/nova-2-lite-v1:free",
    messages,
    stream: false,
  });

  let content = completion.choices?.[0]?.message?.content ?? "{}";
  content = content.trim();

  // --- Clean up markdown fences if the model still sends them ---
  // Example the model returns:
  // ```json
  // { ... }
  // ```
  if (content.startsWith("```")) {
    // remove leading/trailing ```...``` block
    // strip the first ``` line
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.slice(firstBrace, lastBrace + 1);
    }
  }

  // Also remove any stray ```json or ``` that might remain
  content = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Optional: log once to see what the model is sending
  // console.log("RAW MODEL JSON:", content);

  return JSON.parse(content);
}


// ---------- API ROUTE ----------
app.post("/api/plan", async (req, res) => {
  try {
    const { finance, items } = req.body || {};
    if (!finance || !items) {
      return res.status(400).json({ error: "Missing finance or items" });
    }

    const plan = await getPlanFromLLM({ finance, items });
    res.json(plan);
  } catch (err) {
    console.error("LLM error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate plan", details: err.message });
  }
});

// ---------- START SERVER ----------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
