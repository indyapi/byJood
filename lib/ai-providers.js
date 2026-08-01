export const DEFAULT_MODELS = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  claude: "claude-3-5-haiku",
  custom: "gpt-4o-mini",
};

const OPENAI_DEFAULT_BASE = "https://api.openai.com/v1";

function providerBase(provider, baseUrl) {
  if (provider === "custom" && baseUrl) return baseUrl.replace(/\/+$/, "");
  if (provider === "custom" || provider === "openai") return OPENAI_DEFAULT_BASE;
  return null;
}

// System prompt: improve captions for easy-to-read, highly engaging Thai social posts.
export const AI_SYSTEM_PROMPT =
  "คุณคือผู้ช่วยเขียนโพสต์โซเชียลมีเดียภาษาไทยที่เชี่ยวชาญด้านการเขียนคอนเทนต์ที่อ่านง่าย " +
  "น่าดึงดูด และกระตุ้นการมีส่วนร่วมกับผู้ติดตาม " +
  "ตอบกลับด้วยข้อความโพสต์ฉบับสมบูรณ์เท่านั้น (เนื้อหาเดียว ใช้อีโมจิอย่างเหมาะสม " +
  "จัดย่อหน้าให้อ่านง่าย) โดยไม่ใส่คำอธิบายเพิ่มเติมหรือเครื่องหมายคำพูดครอบ\n\n" +
  "STRICT FORMATTING RULES:\n" +
  "- DO NOT use any Markdown syntax at all.\n" +
  "- DO NOT use bold or italic syntax (no **text** or *text*).\n" +
  "- DO NOT use headers (no #, ##, ###).\n" +
  "- DO NOT use horizontal rules or dividers (no ---, ***, ___).\n" +
  "- Use ONLY Plain Text.\n" +
  "- For bullet lists, use a simple dash - or standard numbers 1., 2., 3.\n" +
  "- Emoji can still be used naturally if appropriate.\n" +
  "- Output the final post text only, nothing else.";

export const AI_ACTION_INSTRUCTIONS = {
  improve:
    "ปรับปรุงข้อความให้อ่านง่ายและน่าดึงดูดยิ่งขึ้น เพิ่มอีโมจิอย่างเหมาะสม จัดย่อหน้าให้สวยงาม แต่คงความหมายและประเด็นเดิมไว้ครบถ้วน",
  hashtags:
    "สร้างแฮชแท็กภาษาไทยและภาษาอังกฤษที่เกี่ยวข้องกับโพสต์ พร้อมต่อท้ายเนื้อหา (ไม่เกิน 10 แท็ก)",
  shorten:
    "ย่อข้อความให้สั้น กระชับ ตรงประเด็น คงสาระสำคัญไว้ทั้งหมด และใช้โทนที่น่าดึงดูด",
  engaging:
    "เขียนข้อความใหม่ด้วยโทนที่น่าดึงดูดและเร้าใจ กระตุ้นให้ผู้ติดตามมีส่วนร่วม (เช่น ใช้คำถามปลายเปิด) แต่คงข้อมูลสำคัญเดิม",
};

export function buildAiUserPrompt(actionType, currentContent, extraPrompt) {
  const instruction = AI_ACTION_INSTRUCTIONS[actionType] || AI_ACTION_INSTRUCTIONS.improve;
  let out = `${instruction}\n\n`;
  if (currentContent && currentContent.trim()) {
    out += `โพสต์ปัจจุบัน:\n${currentContent.trim()}\n\n`;
  }
  if (extraPrompt && extraPrompt.trim()) {
    out += `ข้อกำหนดเพิ่มเติม:\n${extraPrompt.trim()}\n\n`;
  }
  out += "ส่งออก:";
  return out;
}

// Fallback safety net: strip any stray Markdown so the frontend receives plain text only.
export function sanitizeMarkdown(text) {
  if (!text) return text;
  return text
    // Fenced code blocks -> keep inner content
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1")
    // Inline code
    .replace(/`([^`]+?)`/g, "$1")
    // Markdown links -> keep visible text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Underscore bold/italic
    .replace(/__([^_]+?)__/g, "$1")
    .replace(/_([^_]+?)_/g, "$1")
    // Bold / italic
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/\*([^*]+?)\*/g, "$1")
    // Headers (# at line start)
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
    // Horizontal rules / dividers (---, ***, ___ on their own line)
    .replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm, "")
    // Any remaining stray asterisks/backticks
    .replace(/\*/g, "")
    .replace(/`/g, "")
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Calls the selected provider and returns { text }. Throws with a human-readable message on failure.
export async function callProvider({ provider, apiKey, baseUrl, model, system, user, maxTokens = 1200 }) {
  if (!apiKey) throw new Error("API key is not configured");
  if (!model) throw new Error("Model name is not configured");

  switch (provider) {
    case "gemini": {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      if (!text) throw new Error("Empty response from Gemini");
      return { text: sanitizeMarkdown(text) };
    }

    case "openai":
    case "custom": {
      const base = providerBase(provider, baseUrl);
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.8,
          max_tokens: maxTokens,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: user },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const text = data?.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Empty response from OpenAI-compatible provider");
      return { text: sanitizeMarkdown(text) };
    }

    case "claude": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.8,
          system: system || undefined,
          messages: [{ role: "user", content: user }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      const text = (data?.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text || "")
        .join("");
      if (!text) throw new Error("Empty response from Claude");
      return { text: sanitizeMarkdown(text) };
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
