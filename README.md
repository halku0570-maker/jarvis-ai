# JARVIS

A voice-first personal AI assistant built with React, Vite, TypeScript, and Vercel AI SDK.

## What works in v0.1

- Clean JARVIS command console
- Browser microphone input when SpeechRecognition is supported
- Wake phrase detection: **Jarvis** → **Yes, sir.**
- Text command fallback
- Spoken responses through browser speech synthesis
- Real server-side AI endpoint using Vercel AI SDK
- No API key is exposed in browser code

## Run locally

```bash
npm install
npm run dev
```

For the AI brain, create an environment variable named `AI_GATEWAY_API_KEY`. Do not put secrets in client-side code.

On Vercel, add `AI_GATEWAY_API_KEY` under Project Settings → Environment Variables, then redeploy.

## Architecture

```text
Browser voice/text
       ↓
JARVIS React UI
       ↓
/api/chat
       ↓
Vercel AI SDK → AI Gateway → model
       ↓
JARVIS response → text + speech
```

The wake-word interaction is intentionally local to the browser. Full always-on wake-word detection and desktop control are planned for later phases; browser speech recognition support varies by browser.
