import type { Capture } from './database';
import type { AppLanguage } from '../store/useSettingsStore';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

const LANGUAGE_INSTRUCTION: Record<AppLanguage, string> = {
  english: 'Always respond in English.',
  filipino: 'Sumagot lagi sa Filipino (Tagalog).',
};

export async function generateDailyInsight(
  yesterdayCaptures: Capture[],
  language: AppLanguage,
  nickname: string
): Promise<string> {
  if (yesterdayCaptures.length === 0) return '';

  const name = nickname.trim() || 'there';
  const langInstruction = LANGUAGE_INSTRUCTION[language];
  const pendingCount = yesterdayCaptures.filter((c) => c.category === 'Task' && !c.completed).length;

  const captureList = yesterdayCaptures
    .map((c) => `[${c.category}] ${c.title}: ${c.summary}`)
    .join('\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: `You are a warm, concise AI assistant writing a personalized morning briefing. ${langInstruction} Write 2-3 sentences only. No bullet points or headers. Be direct and motivating.`,
          },
          {
            role: 'user',
            content: `Write a morning briefing for ${name} based on these notes from yesterday:\n${captureList}\n\nMention: pending tasks (${pendingCount} open), any interesting patterns or themes across the notes, and a brief encouraging note for today.`,
          },
        ],
      }),
    });

    const data = await response.json();
    return (data.choices?.[0]?.message?.content ?? '').trim();
  } catch {
    return '';
  }
}
