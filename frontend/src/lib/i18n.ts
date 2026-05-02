export type Lang = "en" | "ur";

type Dict = {
  nav: { home: string; features: string; analyze: string; trust: string };
  hero: { eyebrow: string; title: string; subtitle: string; cta: string };
  how: { title: string; subtitle: string; s1t: string; s1d: string; s2t: string; s2d: string; s3t: string; s3d: string };
  type: { title: string; subtitle: string; vendor: string; employment: string; partnership: string; property: string; freelance: string; other: string };
  upload: {
    title: string; subtitle: string; drop: string; or: string; browse: string;
    role: string; roles: { owner: string; freelancer: string };
    industryLabel: string; industryPh: string; analyze: string; back: string;
  };
  verdict: { heading: string; forType: string; gauge: string; summary: string; english: string; urdu: string; debate: string; modeTech: string; modePlain: string; newReview: string };
  risk: { high: string; mod: string; low: string; highMsg: string; modMsg: string; lowMsg: string };
  disclaimer: string;
};

export const t: Record<Lang, Dict> = {
  en: {
    nav: { home: "Home", features: "How it works", analyze: "Analyze Contract", trust: "Trust" },
    hero: {
      eyebrow: "AI Contract Risk Review · Built for Pakistan",
      title: "Know what you're signing — before you sign.",
      subtitle:
        "Three AI advisors review your contract in seconds. Get a plain-English (and Urdu) verdict on hidden risks, unfair clauses, and legal red flags.",
      cta: "Review my contract",
    },
    how: {
      title: "How Arbitrix works",
      subtitle: "From upload to verdict in under 60 seconds.",
      s1t: "Upload your contract", s1d: "Drop a PDF or paste the text. We support English and Urdu documents.",
      s2t: "Three AI advisors analyze it", s2d: "A Businessman, a Lawyer, and a Regulator debate every clause — at the same time.",
      s3t: "Get your risk verdict", s3d: "Plain English and Urdu summary with clear next steps. No jargon.",
    },
    type: {
      title: "What kind of contract are you reviewing?",
      subtitle: "This helps our advisors apply the right laws and industry context.",
      vendor: "Vendor / Supplier Agreement",
      employment: "Employment Contract",
      partnership: "Partnership Agreement",
      property: "Property / Lease Contract",
      freelance: "Freelance / Service Contract",
      other: "Other",
    },
    upload: {
      title: "Upload your contract",
      subtitle: "PDF or text · Up to 20 MB · Your file stays private.",
      drop: "Drop your contract here",
      or: "or",
      browse: "Browse files",
      role: "I am a…",
      roles: { owner: "Business Owner", freelancer: "Freelancer / Contractor" },
      industryLabel: "Briefly describe your business (optional)",
      industryPh: "e.g. Textile export company, Lahore",
      analyze: "Analyze contract",
      back: "Back",
    },
    verdict: {
      heading: "Your contract verdict",
      forType: "for",
      gauge: "Overall risk score",
      summary: "One-line summary",
      english: "English summary", urdu: "Urdu summary",
      debate: "Three-advisor debate",
      modeTech: "Technical mode", modePlain: "Plain language",
      newReview: "Review another contract",
    },
    risk: {
      high: "High Risk",
      mod: "Moderate Risk",
      low: "Low Risk",
      highMsg: "Do not sign without legal review.",
      modMsg: "Review flagged clauses before signing.",
      lowMsg: "Safe to proceed with minor caution.",
    },
    disclaimer:
      "Arbitrix flags risk for your awareness — it is not a substitute for legal counsel. Always consult a qualified lawyer before signing high-value contracts.",
  },
  ur: {
    nav: { home: "ہوم", features: "طریقہ کار", analyze: "معاہدہ جانچیں", trust: "اعتماد" },
    hero: {
      eyebrow: "اے آئی معاہدہ جائزہ · خاص طور پر پاکستان کے لیے",
      title: "دستخط سے پہلے جانیں کہ آپ کیا سائن کر رہے ہیں۔",
      subtitle:
        "تین جدید اے آئی مشیر پلک جھپکتے میں آپ کے معاہدے کا گہرائی سے جائزہ لیتے ہیں۔ عام فہم زبان میں پوشیدہ خطرات اور پیچیدہ شقوں کی فوری نشاندہی۔",
      cta: "میرا معاہدہ دیکھیں",
    },
    how: {
      title: "آربیٹرکس کیسے کام کرتا ہے؟",
      subtitle: "فائل اپلوڈ کرنے سے حتمی فیصلے تک — صرف چند سیکنڈ میں۔",
      s1t: "معاہدہ اپلوڈ کریں", s1d: "پی ڈی ایف فائل یا متن — انگریزی اور اردو دونوں دستاویزات قابلِ قبول ہیں۔",
      s2t: "تین ماہرین کا تجزیہ", s2d: "کاروباری ماہر، وکیل اور ریگولیٹر — ہر شق کو باریکی سے جانچتے ہیں۔",
      s3t: "خطرے کا حتمی فیصلہ", s3d: "سادہ زبان میں خلاصہ اور بہتری کے لیے واضح تجاویز۔",
    },
    type: {
      title: "آپ کس قسم کے معاہدے کی جانچ کر رہے ہیں؟",
      subtitle: "یہ معلومات ہمارے مشیروں کو متعلقہ قوانین اور کاروباری سیاق و سباق لاگو کرنے میں مدد دیتی ہیں۔",
      vendor: "سپلائر / وینڈر معاہدہ",
      employment: "ملازمت کا معاہدہ",
      partnership: "شراکت داری کا معاہدہ",
      property: "جائیداد یا کرایہ داری کا معاہدہ",
      freelance: "فری لانس یا سروس معاہدہ",
      other: "دیگر اقسام",
    },
    upload: {
      title: "دستاویز اپلوڈ کریں",
      subtitle: "پی ڈی ایف یا ٹیکسٹ فائل · حد 20 ایم بی · آپ کا ڈیٹا مکمل محفوظ رہتا ہے۔",
      drop: "فائل یہاں ڈراپ کریں",
      or: "یا",
      browse: "فائل منتخب کریں",
      role: "آپ کی حیثیت…",
      roles: { owner: "کاروبار کا مالک", freelancer: "فری لانسر / کنٹریکٹر" },
      industryLabel: "اپنے کاروبار کی مختصر وضاحت کریں (اختیاری)",
      industryPh: "مثلاً: ٹیکسٹائل ایکسپورٹ کمپنی، لاہور",
      analyze: "تجزیہ شروع کریں",
      back: "واپس جائیں",
    },
    verdict: {
      heading: "آپ کے معاہدے کا فیصلہ",
      forType: "برائے",
      gauge: "مجموعی خطرہ سکور",
      summary: "ایک سطری خلاصہ",
      english: "انگریزی خلاصہ", urdu: "اردو خلاصہ",
      debate: "تین مشیروں کی بحث",
      modeTech: "تکنیکی موڈ", modePlain: "آسان زبان",
      newReview: "ایک اور معاہدہ دیکھیں",
    },
    risk: {
      high: "انتہائی خطرناک",
      mod: "درمیانہ خطرہ",
      low: "معمولی خطرہ",
      highMsg: "قانونی مشورے اور اصلاحات کے بغیر ہرگز دستخط نہ کریں۔",
      modMsg: "نشان زدہ شقوں میں تبدیلی کے بعد دستخط کرنے پر غور کریں۔",
      lowMsg: "معاہدہ محفوظ معلوم ہوتا ہے، احتیاط کے ساتھ آگے بڑھا جا سکتا ہے۔",
    },
    disclaimer:
      "آربیٹرکس صرف خطرات کی نشاندہی کرتا ہے — یہ قانونی مشورے کا متبادل نہیں۔ اہم معاہدوں سے پہلے مستند وکیل سے ضرور رجوع کریں۔",
  },
} as const;
