import phishingPrompt from "./phishingPrompt.js";

const LLM_KEY = process.env.OPENAI_API_KEY;

export async function handleClassificationRequest(text) {
  try {
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: phishingPrompt },
        { role: "user", content: text }
      ],
      max_tokens: 50,
      temperature: 0
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLM_KEY}`
      },
      body: JSON.stringify(body)
    });

    const j = await resp.json();
    const raw = j.choices?.[0]?.message?.content || "";
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
    console.log("[GG] Received response from prompt as - ", json)
    return json;
  } catch (e) {
    return { error: String(e) };
  }
}
