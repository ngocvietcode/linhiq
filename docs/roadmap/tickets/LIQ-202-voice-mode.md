---
id: LIQ-202
title: Voice Mode (STT + TTS)
phase: 2
priority: P1
estimate: 5d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, backend, ai, accessibility]
---

# LIQ-202 — Voice Mode

## Problem

2026 UI trend: voice + gestures là primary input methods, keyboard secondary. Khanmigo và Duolingo Max đã có conversational voice. Đặc biệt value cho:
- **English Literature / Language** — practice speaking
- **Vietnamese students** — giảm friction gõ tiếng Anh
- **Accessibility** — students with dyslexia / motor difficulties

## User story

> Là học sinh IGCSE English, em muốn bấm nút mic, nói câu tiếng Anh của em, và nghe Linh phát âm câu trả lời — để em học pronunciation luôn.

## Acceptance criteria

- [ ] Mic button trong chat input (next to camera button)
- [ ] Tap-to-talk (press, release to send) + push-to-talk-long (hold) options
- [ ] Visual: waveform animation while recording
- [ ] STT: Web Speech API primary, fallback server-side Whisper qua LiteLLM
- [ ] Detect language automatically (VI vs EN)
- [ ] AI response TTS: Gemini 2.5 Flash TTS hoặc ElevenLabs (Linh persona voice)
- [ ] "Voice conversation mode" toggle: continuous listening, no tap needed
- [ ] Auto-stop khi silence > 1.5s
- [ ] Transcript hiển thị inline trong chat bubble (can edit before send)
- [ ] User setting: voice on/off, voice speed, accent (VN/UK/US)
- [ ] Fallback graceful khi mic permission denied

## Technical approach

### Client-side STT (primary path)

```tsx
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = userPrefLang || "en-US";
recognition.continuous = false;
recognition.interimResults = true;
recognition.onresult = (e) => setTranscript(e.results[0][0].transcript);
```

### Server-side STT (fallback, quality)

- Use Gemini 2.5 Flash audio support or Whisper via LiteLLM
- Upload audio blob → `/speech/transcribe` → returns text

### TTS

Primary: browser `speechSynthesis`
Premium: ElevenLabs API (Vietnamese voice for Linh persona, one consistent voice)
```ts
async function speak(text: string, lang: string) {
  if (useElevenLabs) {
    const audioUrl = await api('/speech/tts', { body: { text, lang }});
    new Audio(audioUrl).play();
  } else {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    speechSynthesis.speak(utter);
  }
}
```

### Frontend integration

Refactor chat input in `apps/web/src/app/chat/[id]/page.tsx`:
- Add `MicButton` component with state machine: IDLE → LISTENING → PROCESSING → IDLE
- Voice mode toggle in chat settings (gear icon)

### Backend

New module `apps/api/src/modules/speech/`:
- `POST /speech/transcribe` — multipart audio → text
- `POST /speech/tts` — text → audio URL (cached by hash)

## API design

```ts
POST /speech/transcribe  (multipart: audio.webm, lang?)
  → { text, language, confidence }
POST /speech/tts         { text, lang, voice? }
  → { audioUrl, durationMs }
```

## UI notes

- Mic button states:
  - Idle: outline mic icon
  - Recording: filled icon + pulsing red dot
  - Processing: spinner
- Waveform bar (5-10 bars) animating with audio input level
- "Tap to stop" hint during recording
- Transcript editable before send (correct misheard words)

## Testing

- Unit: state machine transitions
- Manual: test on Chrome desktop, Safari iOS, Chrome Android, Firefox
- Quality: VI + EN + mixed sentences
- Privacy: audio NOT stored on server (only transient transcribe)

## Out of scope

- Real-time voice conversation ala ChatGPT Advanced Voice (Phase 3, complex)
- Pronunciation scoring (ELSA Speak territory — compete later)
- Background noise suppression — use browser default

## References

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Gemini audio input docs](https://ai.google.dev/gemini-api/docs/audio)
- [ElevenLabs voices](https://elevenlabs.io/)
