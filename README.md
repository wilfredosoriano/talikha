# Talikha

**Your voice. Your thoughts. Organized.**

Talikha is an iOS voice note app that turns what you say into structured, searchable notes. Record a thought, and the app transcribes it, gives it a title, picks a category, writes a summary, and tags it. No typing required.

---

## What it does

You hit record, say what's on your mind, and stop. Talikha sends the audio to Groq's Whisper model for transcription, then passes the transcript to LLaMA 3.3 70B to pull out a title, category, summary, and tags. Takes a few seconds. Notes are saved locally in SQLite, so everything works offline after the initial processing.

There are four capture types: Task, Idea, Note, and Reference. The AI figures out which one fits. Tasks show up with checkboxes you can tick off. Ideas collect separately. It's a simple system that keeps your captures from turning into one big undifferentiated pile.

The Digest screen is a morning view of pending tasks, yesterday's captures grouped by type, and a quick count of how many ideas and notes you've built up. Useful if you want a sense of where things stand before your day starts.

---

## Features

- Record voice notes with a single tap, waveform shown while recording
- Auto transcription via Groq Whisper (whisper-large-v3-turbo)
- AI-generated title, category, summary, and tags (LLaMA 3.3 70B)
- Supports English, Filipino/Tagalog, or auto-detect
- Full-text search and filter by category
- Morning Digest with stats and pending tasks
- Personalized greetings with nickname and avatar emoji
- Free plan: 10 notes/month. Pro: unlimited. Lifetime: one-time purchase.
- Everything stored locally, no cloud sync

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React Native + Expo |
| Navigation | Expo Router |
| State | Zustand + AsyncStorage |
| Database | Expo SQLite |
| Audio | expo-audio / expo-av |
| AI | Groq API (Whisper + LLaMA 3.3 70B) |
| Monetization | RevenueCat (iOS IAP) |

---

## Getting started

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/wilfredosoriano/talikha.git
cd talikha
npm install
```

2. Copy `.env.example` to `.env` and fill in your Groq API key:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com).

3. Start the dev server:

```bash
npx expo start
```

---

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Free | ₱0 | 10 captures/month |
| Pro | ₱149/month | Unlimited captures + Morning Digest |
| Lifetime | ₱999 one-time | Everything in Pro, no recurring charge |

Payments go through Apple In-App Purchases via RevenueCat.

---

## License

MIT
