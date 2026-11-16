// Read aloud with the phone's built-in voice (works offline on iPhone).
let speaking = false;

export function canSpeak() {
  return 'speechSynthesis' in window;
}

export function speak(text, onEnd) {
  if (!canSpeak()) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.onend = () => {
    speaking = false;
    if (onEnd) onEnd();
  };
  u.onerror = () => {
    speaking = false;
    if (onEnd) onEnd();
  };
  speaking = true;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  speaking = false;
}

export function isSpeaking() {
  return speaking;
}
