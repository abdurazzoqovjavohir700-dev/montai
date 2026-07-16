/**
 * Content moderation utilities for text and image inputs.
 * Mirrors the approach of ChatGPT/Claude: keyword pre-filter + model-level safety.
 */

export type ModerationCategory =
  | 'safe'
  | 'suggestive'
  | 'mature'
  | 'explicit'
  | 'violence'
  | 'self_harm'
  | 'child_safety'
  | 'blocked_text';

export interface ModerationResult {
  blocked: boolean;
  category: ModerationCategory;
  confidence: 'high' | 'medium' | 'low';
  message?: string;
  neutralAlternative?: string;
}

export interface ModerationEvent {
  type: 'text' | 'image';
  category: ModerationCategory;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  userId?: string;
}

/* ─── Text moderation patterns ────────────────────────────────────────── */

// High confidence — very explicit requests
const HIGH_CONF_PATTERNS = [
  /\b(porn|pornograph|pornographic|xxx|hentai|nude\s*photo|naked\s*photo|sex\s*tape)\b/i,
  /\b(erotic\s*(story|novel|fiction|roleplay|fantasy)|sexual\s*roleplay|sexting)\b/i,
  /\b(jerk\s*off|masturbat|orgasm|cum\s*shot|creampie|gangbang|threesome)\b/i,
  /\b(fetish\s*(describe|analyze|explain)|BDSM\s*(describe|analyze))\b/i,
  /\b(describe\s*(her|his|their)\s*(breast|boob|ass|butt|genitals|penis|vagina|cock|dick))\b/i,
  /\b(sexuali[sz]e|sexual\s*description|erotic\s*description|arousing\s*description)\b/i,
  /\b(write\s*(sex|porn|erotica|erotic)|generate\s*(porn|erotica|sexual\s*content))\b/i,
  /\b(NSFW\s*(content|image|photo|description)|explicit\s*content)\b/i,
];

// Medium confidence — contextual
const MED_CONF_PATTERNS = [
  /\b(describe\s*(sexy|seductive|hot)\s*(body|figure|curves))\b/i,
  /\b(sexual\s*fantasy|turn\s*me\s*on|make\s*it\s*sexy)\b/i,
  /\b(strip\s*club|OnlyFans|adult\s*(site|content|material))\b/i,
  /\b(body\s*(lust|worship)\s*(describe|write|analyze))\b/i,
];

/* ─── Friendly refusal messages ───────────────────────────────────────── */

const REFUSAL_MESSAGES: Record<string, string> = {
  blocked_text:
    "Bu so'rov jinsiy yoki yashirin kontentni talab qiladi, shuning uchun bunday tarzda yordam bera olmayman. " +
    "Videomontaj, ranglar, tarkib yoki texnik savollar bo'yicha yordam berishdan mamnunman.",

  mature_image:
    "Ushbu rasm kattalar uchun mo'ljallangan yoki jinsiy jihatdan ta'sirli kontent o'z ichiga olganidek ko'rinadi. " +
    "Rasmni neytral tarzda tasvirlab beraman — kiyim-kechak, muhit, yoritish va kompozitsiyaga e'tibor qaratib. " +
    "Yoki rasmning texnik yoki badiiy jihatlari haqida gaplashishimiz mumkin.",

  violence_image:
    "Bu rasm grafik zo'ravonlik yoki o'z-o'ziga zarar yetkazishni ko'rsatishi mumkin. " +
    "Bunday kontentni tahlil qila olmayman. Boshqa savol bo'lsa yordamlashaman.",

  child_safety:
    "Bu so'rovni qayta ishlashim mumkin emas. Iltimos, kontentga mos keladigan materiallardan foydalaning.",
};

/* ─── Moderate text ───────────────────────────────────────────────────── */

export function moderateText(text: string): ModerationResult {
  if (!text.trim()) return { blocked: false, category: 'safe', confidence: 'high' };

  for (const pattern of HIGH_CONF_PATTERNS) {
    if (pattern.test(text)) {
      logModerationEvent({ type: 'text', category: 'blocked_text', confidence: 'high', timestamp: new Date().toISOString() });
      return {
        blocked: true,
        category: 'blocked_text',
        confidence: 'high',
        message: REFUSAL_MESSAGES.blocked_text,
      };
    }
  }

  for (const pattern of MED_CONF_PATTERNS) {
    if (pattern.test(text)) {
      logModerationEvent({ type: 'text', category: 'blocked_text', confidence: 'medium', timestamp: new Date().toISOString() });
      return {
        blocked: true,
        category: 'blocked_text',
        confidence: 'medium',
        message: REFUSAL_MESSAGES.blocked_text,
      };
    }
  }

  return { blocked: false, category: 'safe', confidence: 'high' };
}

/* ─── Image safety system prompt injection ────────────────────────────── */

/**
 * Returns additional system prompt instructions for image analysis.
 * These tell the model how to handle different types of visual content.
 */
export function getImageSafetyPrompt(): string {
  return `
=== IMAGE ANALYSIS SAFETY RULES ===

When analyzing any uploaded image, you MUST follow these rules:

RULE I-1: CONTENT ASSESSMENT
Before analyzing an image, mentally assess its content:
- SAFE: Educational, technical, artistic, product, screenshot, anime, manga, nature, architecture, food, etc.
- SUGGESTIVE: Mildly revealing clothing, swimwear, artistic nudity in classical art
- MATURE/EXPLICIT: Nudity, sexual content, graphic imagery

RULE I-2: SAFE IMAGES → Full analysis
Describe composition, colors, lighting, technical details, objects, text (OCR), UI elements, environment, style, etc.

RULE I-3: SUGGESTIVE IMAGES → Neutral description ONLY
If an image appears mildly suggestive:
- Describe ONLY: clothing type/color, setting/environment, lighting quality, camera angle, composition, artistic style
- Do NOT: describe body parts in detail, make sexual comments, use sexualizing language
- Focus on: technical/artistic elements

RULE I-4: EXPLICIT/MATURE IMAGES → Decline and redirect
If an image clearly contains adult/explicit content, respond with:
"Bu rasm kattalar uchun mo'ljallangan kontent o'z ichiga olishi mumkin. Rasmni jinsiy yoki hayajonli tarzda tavsiflay olmayman. Ammo uning texnik jihatlari — yoritish, kompozitsiya, kiyim yoki muhit haqida neytral tarzda gaplashishim mumkin."

RULE I-5: VIOLENCE/SELF-HARM → Decline
If an image shows graphic violence or self-harm:
"Bu rasmni tahlil qila olmayman. Boshqa savol bo'lsa yordamlashaman."

RULE I-6: CHILD SAFETY → Immediate refusal
Any content sexualizing or endangering minors:
Refuse immediately. Do not describe. Do not engage.

RULE I-7: ARTISTIC/CLASSICAL NUDITY EXCEPTION
Classical artworks (sculptures, paintings like Michelangelo, Rodin, etc.) may be analyzed in their historical and artistic context, without sexualization.

=== END IMAGE SAFETY RULES ===
`;
}

/* ─── Logging ─────────────────────────────────────────────────────────── */

export function logModerationEvent(event: ModerationEvent): void {
  // Server-side: proper logging
  const logLine = `[MODERATION] ${event.timestamp} type=${event.type} category=${event.category} confidence=${event.confidence}${event.userId ? ` userId=${event.userId}` : ''}`;
  console.warn(logLine);
}

/* ─── Refusal message getters ─────────────────────────────────────────── */

export function getMatureImageMessage(): string {
  return REFUSAL_MESSAGES.mature_image;
}

export function getViolenceImageMessage(): string {
  return REFUSAL_MESSAGES.violence_image;
}
