import type { Category } from './database';
import type { AppLanguage } from '../store/useSettingsStore';

const LANGUAGE_INSTRUCTION: Record<AppLanguage, string> = {
  english: 'Always respond in English regardless of the transcript language.',
  filipino: 'Always respond in Filipino (Tagalog) regardless of the transcript language.',
};

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

const WHISPER_LANGUAGE: Record<AppLanguage, string> = {
  english: 'en',
  filipino: 'tl',
};

export async function transcribeAudio(fileUri: string, language: AppLanguage = 'english'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'text');
    formData.append('language', WHISPER_LANGUAGE[language]);

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

export async function processTranscript(transcript: string, language: AppLanguage = 'english', nickname = ''): Promise<ProcessedCapture> {
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
