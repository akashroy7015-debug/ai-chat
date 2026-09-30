"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "hinglish";

const D = {
  home: ["Home", "होम", "Home"],
  discover: ["Discover", "खोजें", "Discover"],
  chats: ["Chats", "चैट्स", "Chats"],
  collection: ["Collection", "कलेक्शन", "Collection"],
  create: ["Create Character", "कैरेक्टर बनाएं", "Character banao"],
  myAi: ["My AI", "मेरे AI", "Mere AI"],
  premium: ["Premium", "प्रीमियम", "Premium"],
  tagline: ["18+ only. Every character is a fictional adult and not based on a real person.", "सिर्फ 18+ के लिए। हर कैरेक्टर एक काल्पनिक वयस्क है, किसी असली इंसान पर आधारित नहीं।", "Sirf 18+ ke liye. Har character ek fictional adult hai, kisi real insaan pe based nahi."],
  explore: ["Explore featured characters", "फ़ीचर्ड कैरेक्टर देखें", "Featured characters dekho"],
  girls: ["Girls", "लड़कियाँ", "Girls"],
  milf: ["MILF", "MILF", "MILF"],
  anime: ["Anime", "एनीमे", "Anime"],
  guys: ["Guys", "लड़के", "Guys"],
  signup: ["Create free account", "फ्री अकाउंट बनाएं", "Free account banao"],
  login: ["Log in", "लॉग इन", "Log in"],
  signupBtn: ["Sign up", "साइन अप", "Sign up"],
  email: ["Email", "ईमेल", "Email"],
  password: ["Password (8+ characters)", "पासवर्ड (8+ अक्षर)", "Password (8+ characters)"],
  confirm18: ["I am 18 or older and accept the Terms and Privacy Policy. I understand ID verification is required to chat.", "मेरी उम्र 18 या उससे ज़्यादा है और मैं नियम व प्राइवेसी पॉलिसी स्वीकार करता/करती हूँ। चैट के लिए ID वेरिफिकेशन ज़रूरी है।", "Meri age 18+ hai aur main Terms aur Privacy Policy accept karta/karti hoon. Chat ke liye ID verification zaroori hai."],
  verify: ["Verify with ID (18+)", "ID से वेरिफाई करें (18+)", "ID se verify karo (18+)"],
  tokens: ["Tokens", "टोकन", "Tokens"],
  logout: ["Log out", "लॉग आउट", "Log out"],
  buyTokens: ["Buy tokens:", "टोकन खरीदें:", "Tokens kharido:"],
  message: ["Message", "मैसेज करें", "Message karo"],
  send: ["Send", "भेजें", "Bhejo"],
  sayHi: ["Say hi to", "हाय बोलें", "Hi bolo"],
  allChars: ["← All characters", "← सभी कैरेक्टर", "← Saare characters"],
  chatLang: ["Chat language", "चैट की भाषा", "Chat ki language"],
  goPremium: ["Go Premium", "प्रीमियम लें", "Premium lo"],
  getPremium: ["Get Premium", "प्रीमियम लें", "Premium lo"],
  chatWith: ["Chat with", "चैट करें", "Chat karo"],
  noChats: ["No chats yet.", "अभी कोई चैट नहीं।", "Abhi koi chat nahi."],
  pickChar: ["Pick a character", "कैरेक्टर चुनें", "Character chuno"],
} satisfies Record<string, [string, string, string]>;

export type Key = keyof typeof D;
const IDX: Record<Lang, number> = { en: 0, hi: 1, hinglish: 2 };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en", setLang: () => {}, t: (k) => D[k][0],
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved && saved in IDX) setLangState(saved);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
    // UI only: characters always auto-detect the language the user writes in.
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => D[k][IDX[lang]] }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)}
      style={{ background: "#26262f", color: "#eee", border: "1px solid #2a2a35", borderRadius: 8, padding: "6px 8px" }}>
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="hinglish">Hinglish</option>
    </select>
  );
}
