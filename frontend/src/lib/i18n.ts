export type Lang = "en" | "ur";

type Dict = {
  nav: { home: string; features: string; analyze: string; trust: string };
  hero: { eyebrow: string; title: string; subtitle: string; cta: string };
  how: { title: string; subtitle: string; s1t: string; s1d: string; s2t: string; s2d: string; s3t: string; s3d: string };
  type: { title: string; subtitle: string; vendor: string; employment: string; partnership: string; property: string; freelance: string; other: string };
  upload: {
    title: string; subtitle: string; drop: string; or: string; browse: string;
    role: string; roles: { owner: string; freelancer: string; lawyer: string };
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
      roles: { owner: "Business Owner", freelancer: "Freelancer / Contractor", lawyer: "Lawyer / Advisor" },
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
      eyebrow: "اے آئی معاہدہ جائزہ · پاکستان کے لیے",
      title: "دستخط سے پہلے جانیں کہ آپ کیا سائن کر رہے ہیں۔",
      subtitle:
        "تین اے آئی مشیر چند سیکنڈ میں آپ کے معاہدے کا جائزہ لیتے ہیں۔ آسان اردو میں خطرات اور غیر منصفانہ شقوں کی نشاندہی۔",
      cta: "میرا معاہدہ دیکھیں",
    },
    how: {
      title: "آربیٹرکس کیسے کام کرتا ہے",
      subtitle: "اپلوڈ سے فیصلے تک ایک منٹ سے بھی کم میں۔",
      s1t: "اپنا معاہدہ اپلوڈ کریں", s1d: "پی ڈی ایف یا متن — انگریزی و اردو دونوں قابلِ قبول ہیں۔",
      s2t: "تین مشیر تجزیہ کرتے ہیں", s2d: "ایک کاروباری، ایک وکیل اور ایک ریگولیٹر — ہر شق پر بحث کرتے ہیں۔",
      s3t: "خطرے کا فیصلہ حاصل کریں", s3d: "آسان زبان میں خلاصہ اور واضح اگلے اقدامات۔",
    },
    type: {
      title: "آپ کس قسم کے معاہدے کا جائزہ لے رہے ہیں؟",
      subtitle: "یہ ہمارے مشیروں کو درست قوانین اور صنعتی پسِ منظر لگانے میں مدد دیتا ہے۔",
      vendor: "وینڈر / سپلائر معاہدہ",
      employment: "ملازمت کا معاہدہ",
      partnership: "پارٹنرشپ معاہدہ",
      property: "جائیداد / کرایہ داری معاہدہ",
      freelance: "فری لانس / سروس معاہدہ",
      other: "دیگر",
    },
    upload: {
      title: "اپنا معاہدہ اپلوڈ کریں",
      subtitle: "پی ڈی ایف یا متن · زیادہ سے زیادہ 20 ایم بی · فائل محفوظ رہتی ہے۔",
      drop: "اپنا معاہدہ یہاں چھوڑیں",
      or: "یا",
      browse: "فائل منتخب کریں",
      role: "میں ہوں…",
      roles: { owner: "کاروبار کا مالک", freelancer: "فری لانسر / ٹھیکیدار", lawyer: "وکیل / مشیر" },
      industryLabel: "اپنا کاروبار مختصر بیان کریں (اختیاری)",
      industryPh: "مثلاً: ٹیکسٹائل برآمدی کمپنی، لاہور",
      analyze: "معاہدے کا تجزیہ کریں",
      back: "واپس",
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
      high: "زیادہ خطرہ",
      mod: "درمیانہ خطرہ",
      low: "کم خطرہ",
      highMsg: "قانونی مشورے کے بغیر دستخط نہ کریں۔",
      modMsg: "نشان زدہ شقوں کا جائزہ لیں۔",
      lowMsg: "معمولی احتیاط کے ساتھ آگے بڑھیں۔",
    },
    disclaimer:
      "آربیٹرکس صرف خطرات کی نشاندہی کرتا ہے — یہ قانونی مشورے کا متبادل نہیں۔ اہم معاہدوں سے پہلے مستند وکیل سے ضرور رجوع کریں۔",
  },
} as const;
