import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  PenLine,
  X,
  Check,
  Play,
  Pause,
  Copy,
  RotateCcw,
  AlertCircle,
  FileText,
  List,
} from 'lucide-react';
import { Dialog } from './Dialog';
import { structureVoiceJournal } from '../lib/api';
import type { VoiceStructuredEntry } from '../types';

interface VoiceJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEntry: (structured: VoiceStructuredEntry) => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
type FormatStyle = 'narrative' | 'bullets' | 'verbatim';

const NUM_BARS = 24;

export const VoiceJournalModal: React.FC<VoiceJournalModalProps> = ({
  isOpen,
  onClose,
  onApplyEntry,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [formatStyle, setFormatStyle] = useState<FormatStyle>('narrative');
  const [structuring, setStructuring] = useState(false);
  const [structuredResult, setStructuredResult] = useState<VoiceStructuredEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const [visualizerLevels, setVisualizerLevels] = useState<number[]>(
    () => new Array(NUM_BARS).fill(4)
  );

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const restartTimerRef = useRef<any>(null);

  useEffect(() => {
    isRecordingRef.current = recordingState === 'recording';
  }, [recordingState]);

  const releaseMediaResources = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignored
      }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignored
      }
      mediaRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      recognitionRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      releaseMediaResources();
      setRecordingState('idle');
      setRecordingSeconds(0);
      setTranscript('');
      accumulatedTranscriptRef.current = '';
      setStructuredResult(null);
      setErrorMsg(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setIsPlayingAudio(false);
      setVisualizerLevels(new Array(NUM_BARS).fill(4));
    }
  }, [isOpen, releaseMediaResources]);

  const runAudioVisualizer = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevels = () => {
      if (!isRecordingRef.current) {
        setVisualizerLevels(new Array(NUM_BARS).fill(4));
        return;
      }
      analyser.getByteFrequencyData(dataArray);

      const step = Math.floor(bufferLength / NUM_BARS) || 1;
      const newLevels: number[] = [];
      for (let i = 0; i < NUM_BARS; i++) {
        const value = dataArray[i * step] || 0;
        const height = Math.max(4, Math.min(36, Math.round((value / 255) * 36)));
        newLevels.push(height);
      }
      setVisualizerLevels(newLevels);
      animFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animFrameRef.current = requestAnimationFrame(updateLevels);
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setStructuredResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
      }

      audioChunksRef.current = [];
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm') && MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          const newUrl = URL.createObjectURL(blob);
          setAudioUrl(newUrl);
        }
      };
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
    } catch (err: any) {
      console.warn('Microphone stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser.');
        return;
      }
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let sessionInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + text.trim();
            } else {
              sessionInterim += text;
            }
          }
          const full = (accumulatedTranscriptRef.current + ' ' + sessionInterim).replace(/\s+/g, ' ').trim();
          setTranscript(full);
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access denied. You can write your thoughts directly in the note below.');
          } else if (event.error !== 'no-speech') {
            console.warn('Speech recognition notice:', event.error);
          }
        };

        recognition.onend = () => {
          if (isRecordingRef.current) {
            restartTimerRef.current = setTimeout(() => {
              if (isRecordingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {
                  // Ignore state collisions
                }
              }
            }, 120);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (speechErr) {
        console.warn('Speech recognition start failed:', speechErr);
      }
    }

    setRecordingState('recording');
    isRecordingRef.current = true;
    runAudioVisualizer();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    if (recordingState !== 'recording') return;
    setRecordingState('paused');
    isRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch {
        // Ignored
      }
    }
    setVisualizerLevels(new Array(NUM_BARS).fill(4));
  };

  const resumeRecording = () => {
    if (recordingState !== 'paused') return;
    setRecordingState('recording');
    isRecordingRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Ignored
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch {
        // Ignored
      }
    }

    runAudioVisualizer();

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setRecordingState('stopped');
    isRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignored
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setVisualizerLevels(new Array(NUM_BARS).fill(4));
  };

  const handleReset = () => {
    releaseMediaResources();
    setRecordingState('idle');
    setRecordingSeconds(0);
    setTranscript('');
    accumulatedTranscriptRef.current = '';
    setStructuredResult(null);
    setErrorMsg(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlayingAudio(false);
    setVisualizerLevels(new Array(NUM_BARS).fill(4));
  };

  const toggleAudioPlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStructure = async () => {
    const textToProcess = transcript.trim();
    if (!textToProcess) {
      setErrorMsg('Please record or type your spoken thoughts first.');
      return;
    }

    if (recordingState === 'recording' || recordingState === 'paused') {
      stopRecording();
    }

    setStructuring(true);
    setErrorMsg(null);

    try {
      const result = await structureVoiceJournal(textToProcess, formatStyle);
      setStructuredResult(result);
    } catch (err: any) {
      console.error('Voice structure error:', err);
      setErrorMsg(err.message || 'Could not structure voice entry. Please try again.');
    } finally {
      setStructuring(false);
    }
  };

  const handleApply = () => {
    if (structuredResult) {
      onApplyEntry(structuredResult);
      onClose();
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Voice Journal" className="max-w-2xl">
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onTimeUpdate={(e) => setAudioCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
          onEnded={() => setIsPlayingAudio(false)}
        />
      )}

      <div className="flex shrink-0 items-center justify-between border-b border-white/[.06] bg-[#141311] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[.06] text-stone-300">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif-editor text-base font-medium text-stone-100">
              Voice Journal
            </h2>
            <p className="text-[11px] text-stone-400">
              Record spoken thoughts to reflect and transform into an entry
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-stone-200 transition"
          aria-label="Close voice journal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scroll-area max-h-[75vh] overflow-y-auto bg-[#141311] p-5 space-y-4">
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[.06] bg-white/[.02] p-5 text-center space-y-4">
          <div className="flex items-center gap-2 text-xs">
            {recordingState === 'recording' && (
              <span className="flex items-center gap-1.5 text-stone-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Recording</span>
              </span>
            )}
            {recordingState === 'paused' && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Paused</span>
              </span>
            )}
            {recordingState === 'stopped' && (
              <span className="flex items-center gap-1.5 text-stone-400">
                <span>Recorded</span>
              </span>
            )}
            {recordingState === 'idle' && (
              <span className="text-stone-400">Ready to record</span>
            )}

            <span className="text-stone-600">/</span>
            <span className="font-mono text-stone-300">{formatTimer(recordingSeconds)}</span>
          </div>

          <div
            className="flex h-10 w-full max-w-sm items-center justify-center gap-1 px-4"
            aria-label="Audio waveform visualizer"
          >
            {visualizerLevels.map((height, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-full bg-stone-300 transition-all duration-75"
                style={{
                  height: `${height}px`,
                  opacity: recordingState === 'recording' ? 0.9 : 0.25,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {recordingState === 'idle' && (
              <button
                type="button"
                onClick={startRecording}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-950 hover:bg-white transition shadow-sm"
                title="Start recording"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}

            {recordingState === 'recording' && (
              <>
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/[.04] px-3 text-xs text-stone-300 hover:bg-white/[.08] transition"
                  title="Pause recording"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-500 transition shadow-sm"
                  title="Stop recording"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="flex h-9 items-center gap-1.5 rounded-md bg-stone-100 px-3 text-xs font-medium text-stone-950 hover:bg-white transition"
                  title="Resume recording"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/[.04] px-3 text-xs text-stone-300 hover:bg-white/[.08] transition"
                  title="Finish recording"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Done</span>
                </button>
              </>
            )}

            {recordingState === 'stopped' && (
              <button
                type="button"
                onClick={handleReset}
                className="flex h-8 items-center gap-1 rounded-md border border-white/10 bg-white/[.02] px-2.5 text-xs text-stone-400 hover:text-stone-200 transition"
                title="Reset recording"
              >
                <RotateCcw className="h-3 w-3" />
                <span>New recording</span>
              </button>
            )}
          </div>

          {audioUrl && recordingState === 'stopped' && (
            <div className="flex w-full max-w-sm items-center justify-between rounded-lg border border-white/[.06] bg-black/40 px-3 py-2 text-xs">
              <button
                type="button"
                onClick={toggleAudioPlayback}
                className="flex h-7 w-7 items-center justify-center rounded bg-white/[.08] text-stone-200 hover:bg-white/[.15] transition"
                title={isPlayingAudio ? 'Pause playback' : 'Play audio recording'}
              >
                {isPlayingAudio ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>

              <div className="flex-1 mx-3">
                <div className="h-1 w-full rounded-full bg-white/[.08] overflow-hidden">
                  <div
                    className="h-full bg-stone-300 transition-all duration-150"
                    style={{
                      width: audioDuration > 0 ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>

              <span className="font-mono text-[11px] text-stone-400">
                {formatTimer(Math.floor(audioCurrentTime))} / {formatTimer(Math.floor(audioDuration || recordingSeconds))}
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium">
            <span>Spoken transcript</span>
            <div className="flex items-center gap-2">
              {transcript && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 transition"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      accumulatedTranscriptRef.current = '';
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-300 transition"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              accumulatedTranscriptRef.current = e.target.value;
            }}
            placeholder="Your spoken words appear here in real time. You can also type or edit directly..."
            className="w-full min-h-[110px] resize-none rounded-lg border border-white/[.08] bg-black/40 p-3 font-serif-editor text-sm leading-relaxed text-stone-200 placeholder:text-stone-600 focus:border-stone-500 focus:outline-none"
          />

          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>
              {transcript.trim() ? `${transcript.trim().split(/\s+/).length} words` : '0 words'}
            </span>
            <span>Edit anytime before formatting</span>
          </div>
        </div>

        {transcript.trim() && (
          <div className="space-y-2 pt-1 border-t border-white/[.04]">
            <span className="text-[11px] text-stone-400 font-medium block">
              Format style
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormatStyle('narrative')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${
                  formatStyle === 'narrative'
                    ? 'border-white/20 bg-white/[.06] text-white'
                    : 'border-white/[.06] bg-white/[.01] text-stone-400 hover:border-white/10 hover:text-stone-300'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-stone-400" />
                <div>
                  <div className="text-xs font-medium">Narrative entry</div>
                  <div className="text-[10px] text-stone-500">Flowing reflective prose</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormatStyle('bullets')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${
                  formatStyle === 'bullets'
                    ? 'border-white/20 bg-white/[.06] text-white'
                    : 'border-white/[.06] bg-white/[.01] text-stone-400 hover:border-white/10 hover:text-stone-300'
                }`}
              >
                <List className="h-4 w-4 shrink-0 text-stone-400" />
                <div>
                  <div className="text-xs font-medium">Key highlights</div>
                  <div className="text-[10px] text-stone-500">Bulleted insights & actions</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormatStyle('verbatim')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${
                  formatStyle === 'verbatim'
                    ? 'border-white/20 bg-white/[.06] text-white'
                    : 'border-white/[.06] bg-white/[.01] text-stone-400 hover:border-white/10 hover:text-stone-300'
                }`}
              >
                <PenLine className="h-4 w-4 shrink-0 text-stone-400" />
                <div>
                  <div className="text-xs font-medium">Cleaned transcript</div>
                  <div className="text-[10px] text-stone-500">Word-for-word, filler removed</div>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStructure}
                disabled={structuring}
                className="flex items-center justify-center gap-1.5 w-full rounded-md bg-stone-100 py-2 text-xs font-medium text-stone-900 transition hover:bg-white disabled:opacity-50"
              >
                {structuring ? (
                  <>
                    <div className="h-3 w-3 rounded-full border border-stone-900 border-t-transparent animate-spin" />
                    <span>Structuring reflection...</span>
                  </>
                ) : (
                  <>
                    <PenLine className="h-3.5 w-3.5 text-stone-700" />
                    <span>Format into entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {structuredResult && (
          <div className="space-y-3 rounded-lg border border-white/[.08] bg-white/[.02] p-4">
            <div className="flex items-center justify-between border-b border-white/[.06] pb-2">
              <span className="text-xs font-medium text-stone-300">
                Formatted preview
              </span>
              <span className="capitalize rounded bg-white/[.06] px-2 py-0.5 text-[11px] text-stone-400">
                {structuredResult.mood}
              </span>
            </div>

            <h3 className="font-serif-editor text-lg text-stone-100 font-medium">
              {structuredResult.title}
            </h3>

            <div className="whitespace-pre-wrap font-serif-editor text-xs sm:text-sm leading-relaxed text-stone-300">
              {structuredResult.content}
            </div>

            {structuredResult.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {structuredResult.tags.map((t) => (
                  <span key={t} className="rounded bg-white/[.06] px-2 py-0.5 text-[11px] text-stone-300">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-white/[.06] bg-[#11100f] px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
        >
          Close
        </button>

        {structuredResult && (
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-md bg-stone-100 px-4 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-white"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Apply to journal</span>
          </button>
        )}
      </div>
    </Dialog>
  );
};
