// ... existing code ...
export async function rewriteTextWithGemini(inputText, apiKey) {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;
  const body = {
    contents: [
      {
        parts: [
          { text: `Rewrite the following complaint for clarity and professionalism:\n${inputText}` }
        ]
      }
    ]
  };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error("Gemini API error");
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "";
  }
}
// ... existing code ...