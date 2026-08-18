"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechRecognitionConstructor,
  joinSpokenText,
  speechRecognitionErrorMessage,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";

export interface UseSpeechRecognitionOptions {
  onTranscript: (transcript: string) => void;
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  start: (baseText?: string) => void;
  stop: () => void;
  reset: () => void;
  toggle: (baseText?: string) => void;
}

export function useSpeechRecognition({
  onTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const baseTextRef = useRef("");
  const finalSpokenRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const stopRecognition = useCallback((abort: boolean) => {
    shouldListenRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      if (abort) {
        recognition.abort();
      } else {
        recognition.stop();
      }
    } catch {
      // Recognition may already be stopped.
    }
  }, []);

  const emitTranscript = useCallback((spoken: string) => {
    onTranscriptRef.current(joinSpokenText(baseTextRef.current, spoken));
  }, []);

  useEffect(() => {
    const Constructor = getSpeechRecognitionConstructor();
    setIsSupported(Constructor !== null);
    if (!Constructor) return;

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = event => {
      if (!shouldListenRef.current) return;
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        const piece = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalSpokenRef.current += piece;
        } else {
          interim += piece;
        }
      }
      emitTranscript(`${finalSpokenRef.current}${interim}`);
    };

    recognition.onerror = event => {
      if (!shouldListenRef.current) return;
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      shouldListenRef.current = false;
      setIsListening(false);
      const message = speechRecognitionErrorMessage(event.error);
      if (message) setError(message);
    };

    recognition.onend = () => {
      if (!shouldListenRef.current) {
        setIsListening(false);
        return;
      }
      try {
        recognition.start();
      } catch {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Already stopped.
      }
      recognitionRef.current = null;
    };
  }, [emitTranscript]);

  const start = useCallback(
    (baseText = "") => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        setError("Voice input is not supported in this browser.");
        return;
      }

      baseTextRef.current = baseText;
      finalSpokenRef.current = "";
      shouldListenRef.current = true;
      setError(null);
      setIsListening(true);
      try {
        recognition.start();
      } catch {
        try {
          recognition.stop();
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          setIsListening(false);
          setError("Voice input failed. Try again.");
        }
      }
    },
    []
  );

  const stop = useCallback(() => {
    stopRecognition(false);
    setIsListening(false);
  }, [stopRecognition]);

  const reset = useCallback(() => {
    stopRecognition(true);
    baseTextRef.current = "";
    finalSpokenRef.current = "";
    setIsListening(false);
    setError(null);
  }, [stopRecognition]);

  const toggle = useCallback(
    (baseText = "") => {
      if (shouldListenRef.current) {
        stop();
        return;
      }
      start(baseText);
    },
    [start, stop]
  );

  return {
    isSupported,
    isListening,
    error,
    start,
    stop,
    reset,
    toggle,
  };
}
