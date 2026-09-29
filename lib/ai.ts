import OpenAI from "openai";
import type { StudentProfile } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

export async function getPersonalizedQuestions(profile: StudentProfile): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [
      "What kind of career path are you most interested in right now?",
      "What skills do you want to develop in the next year?",
      "Do you prefer working in a team or independently?",
      "What matters most to you in a future job: impact, growth, or stability?",
    ];
  }
  const prompt = `You are a career guidance assistant. Based on this student profile, generate exactly 4 short, clear follow-up questions to better understand their career direction and needs. Return ONLY a JSON array of 4 question strings, no other text.
Profile: name=${profile.name}, age=${profile.age}, field of study=${profile.fieldOfStudy}, interests=${profile.interests.join(", ")}, goals=${profile.goals ?? "not specified"}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  const content = completion.choices[0]?.message?.content?.trim() ?? "[]";
  try {
    const parsed = JSON.parse(content) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.slice(0, 5).filter((q): q is string => typeof q === "string");
  } catch {
    return [
      "What kind of career path are you most interested in right now?",
      "What skills do you want to develop in the next year?",
      "Do you prefer working in a team or independently?",
      "What matters most to you in a future job?",
    ];
  }
}
