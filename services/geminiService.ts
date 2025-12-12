import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    // Safely access process.env
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;
    if (!apiKey) {
        console.warn("API Key not found");
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

export const generateCertificateWording = async (
  eventName: string,
  recipientRole: string,
  language: 'EN' | 'ID'
): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return language === 'ID' 
      ? "Sertifikat ini diberikan sebagai bentuk apresiasi atas kinerja yang luar biasa." 
      : "Certificate of Appreciation awarded for outstanding performance.";
  }

  const langPrompt = language === 'ID' 
    ? "Write in Indonesian language (Bahasa Indonesia)." 
    : "Write in English.";

  const prompt = `
    ${langPrompt}
    Write a short, professional, and celebratory sentence to be placed on a certificate.
    The event is "${eventName}" and the recipient's role was "${recipientRole}".
    Do not include the recipient's name in the text, just the appreciation message.
    Max 20 words.
    Output only the text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return language === 'ID'
        ? `Sebagai pengakuan atas dedikasi dan kontribusi Anda pada ${eventName}.`
        : `In recognition of your dedication and contribution to ${eventName}.`;
  }
};