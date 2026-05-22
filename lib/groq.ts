import type { Category } from './database';
import type { AppLanguage } from '../store/useSettingsStore';

const LANGUAGE_INSTRUCTION: Record<AppLanguage, string> = {
  auto: 'Detect the language of the transcript automatically (English or Filipino/Tagalog) and respond in that same language.',
  english: 'Always respond in English regardless of the transcript language.',
  filipino: 'Always respond in Filipino (Tagalog) regardless of the transcript language.',
};

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

export async function transcribeAudio(fileUri: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'text');
    // No language lock — Whisper auto-detects English, Tagalog, and 99 other languages

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const text = await response.text();
    return text.trim();
  } catch (e) {
    console.warn('Transcription failed:', e);
    return '';
  }
}

export interface ProcessedCapture {
  title: string;
  category: Category;
  summary: string;
  tags: string[];
}

export async function processTranscript(transcript: string, language: AppLanguage = 'auto', nickname = ''): Promise<ProcessedCapture> {
  const langInstruction = LANGUAGE_INSTRUCTION[language];
  const nameInstruction = nickname.trim()
    ? `The user's name is "${nickname.trim()}". You may address them by name naturally in the summary when it fits.`
    : '';
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that processes voice transcripts and returns structured JSON only. ${langInstruction} ${nameInstruction} Never return markdown, backticks, or explanation. Only return a raw valid JSON object.`,
          },
          {
            role: 'user',
            content: `Process this voice transcript and return ONLY a valid JSON object with these exact fields: title as a short descriptive title under 10 words, category as exactly one of Task Idea Note Reference, summary as 1 to 2 sentences, tags as an array of 3 to 5 lowercase keyword strings. Transcript: ${transcript}`,
          },
        ],
      }),
    });

    const data = await response.json();
    let raw: string = data.choices[0].message.content;
    raw = raw.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(raw) as ProcessedCapture;
  } catch {
    return {
      title: 'Voice capture',
      category: 'Note',
      summary: transcript.slice(0, 100),
      tags: [],
    };
  }
}
