/**
 * High-performance regex checks for detecting potential contact leaks, 
 * off-platform payments, and links in English and Arabic.
 */

// Convert Hindi/Arabic numbers to normal english digits for standard regex parsing
function normalizeArabicDigits(text) {
  const arabicDigitsMap = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  return text.replace(/[٠-٩]/g, (d) => arabicDigitsMap[d] || d);
}

// 1. Phone number patterns (handles dashes, dots, spaces, country codes, and Arabic digits)
const PHONE_PATTERN = /(?:\+?2?0\s*1\s*[0125]\s*(?:\d\s*){8})|(?:\d\s*){10,11}/;

// Textual representation of numbers (e.g. "zero one zero", "صفر واحد صفر")
const TEXTUAL_NUMBERS_EN = /(?:zero|one|two|three|four|five|six|seven|eight|nine|ten)/i;
const TEXTUAL_NUMBERS_AR = /(?:صفر|واحد|اثنين|اتنين|ثلاثة|تلاتة|اربعة|خمسة|ستة|سبعة|ثمانية|تمانية|تسعة|عشرة)/;

// 2. Off-platform payment keywords (Bilingual)
const PAYMENT_KEYWORDS = [
  // Arabic
  "كاش", "فودافون", "فدافون", "انستا", "انستاباي", "انستا باي", "تحويل بنكي", 
  "حساب بنكي", "دفع خارج", "نتقابل بره", "نتقابل برة", "دفع مباشر", "حساب بره", 
  "فلوس كاش", "بره المنصه", "بره المنصة", "خارج المنصه", "خارج المنصة", "كاش بره",
  
  // English
  "cash", "vodafone", "instapay", "bank transfer", "bank account", "pay outside", 
  "off platform", "off-platform", "direct pay", "pay cash", "by cash", "meet outside"
];

// 3. Contact leakage keywords (Bilingual)
const CONTACT_KEYWORDS = [
  // Arabic
  "رقمي", "تليفوني", "تلفوني", "واتس", "واتساب", "فيس", "فيسبوك", "رقم الهاتف", 
  "رقم الموبايل", "كلمني على", "كلمني علي", "تواصل على", "تواصل علي", "ايميلي", 
  "رقم الهاتف", "ابعت رقمك", "ابعتي رقمك", "تليجرام",
  
  // English
  "whatsapp", "whats", "phone number", "phone", "mobile", "contact me", "call me", 
  "facebook", "email", "my number", "gmail", "send number", "insta", "telegram",
  "dm me", "message me on", "reach me at"
];

// 4. Links and email patterns
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_PATTERN = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;


function isSuspicious(text) {
  if (!text || typeof text !== "string") return false;

  const normalizedText = normalizeArabicDigits(text.trim().toLowerCase());

  // 1. Scan for emails or URLs
  if (EMAIL_PATTERN.test(normalizedText) || URL_PATTERN.test(normalizedText)) {
    return true;
  }

  // 2. Scan for phone numbers
  if (PHONE_PATTERN.test(normalizedText.replace(/[-\s.()]/g, ""))) {
    return true;
  }

  // 3. Scan for spelling numbers (minimum 3 digits spelled out to avoid false positives on words like "one")
  const textEnMatches = normalizedText.match(new RegExp(TEXTUAL_NUMBERS_EN.source, "gi"));
  if (textEnMatches && textEnMatches.length >= 3) {
    return true;
  }
  const textArMatches = normalizedText.match(new RegExp(TEXTUAL_NUMBERS_AR.source, "g"));
  if (textArMatches && textArMatches.length >= 3) {
    return true;
  }

  // 4. Scan for off-platform payment keywords
  for (const keyword of PAYMENT_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return true;
    }
  }

  // 5. Scan for contact leakage keywords
  for (const keyword of CONTACT_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  isSuspicious,
};
