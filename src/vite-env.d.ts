/// <reference types="vite/client" />

declare module "*.css";

interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}
