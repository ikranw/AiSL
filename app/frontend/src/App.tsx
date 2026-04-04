import { Box, Container, Grid } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { Hero } from './components/Hero';
import { TranslatorCard } from './components/TranslatorCard';
import { AvatarCard } from './components/AvatarCard';
import { PlaybackControls } from './components/PlaybackControls';
import { ResourcesSection } from './components/ResourcesSection';
import { Footer } from './components/Footer';
import { translateEnglishToASL } from './services/llmService';
import {
  pauseUnityPlayback,
  resumeUnityPlayback,
  sendSignSequenceToUnity,
  setUnityPlaybackLoop,
  setUnityPlaybackSpeed,
} from './services/unityBridge';
import { TranslateResponse } from './types/translate';

const MAX_INPUT_LENGTH = 500;
const BASE_SIGN_DURATION_SECONDS = 1.2;
const FINGERSPELL_LETTER_SECONDS = 0.45;
const LOADING_STEPS = ['Analyzing text...', 'Building gloss...', 'Preparing signs...'];

function normalizeUnityToken(token: string): string[] {
  let t = token.trim().toUpperCase();
  if (!t) {
    return [];
  }

  const nestedFingerspellMatch = t.match(/^FINGERSPELL\(FINGERSPELL\((.+)\)\)$/);
  if (nestedFingerspellMatch) {
    t = nestedFingerspellMatch[1].toUpperCase().trim();
  }

  const fingerspellMatch = t.match(/^FINGERSPELL\((.+)\)$/);
  if (fingerspellMatch) {
    t = fingerspellMatch[1].toUpperCase().trim();
  }

  if (t.startsWith('X-')) {
    t = t.slice(2).trim();
  } else if (t.startsWith('DESC-')) {
    t = t.slice(5).trim();
  }

  if (t === 'MY NAME' || t === 'MY NAME IS') {
    return ['MY NAME IS'];
  }

  if (!t) {
    return [];
  }

  // Keep Unity signing aligned with backend rule:
  // first-person and possessive first-person use MY sign.
  if (t === 'I' || t === 'MY' || t === 'POSS') {
    return ['MY'];
  }

  return [t];
}

function estimateSequenceDuration(sequence: string[], speed: number): number {
  if (!sequence.length) {
    return 0;
  }

  const estimatedSeconds = sequence.reduce((total, token) => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return total;
    }

    // Unknown words may be fingerspelled character-by-character, so longer words
    // should reserve more playback time than a single known sign.
    const tokenDuration = cleanToken.includes(' ')
      ? BASE_SIGN_DURATION_SECONDS
      : Math.max(BASE_SIGN_DURATION_SECONDS, cleanToken.length * FINGERSPELL_LETTER_SECONDS);

    return total + tokenDuration;
  }, 0);

  return estimatedSeconds / Math.max(speed, 0.1);
}

export default function App(): JSX.Element {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<TranslateResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [fullSequence, setFullSequence] = useState<string[]>([]);
  const [currentSequence, setCurrentSequence] = useState<string[]>([]);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const inputHistoryRef = useRef<string[]>([]);
  const isUndoingInputRef = useRef(false);

  const totalDurationSeconds = estimateSequenceDuration(currentSequence, speed);

  const handleInputChange = useCallback((value: string) => {
    if (!isUndoingInputRef.current && value !== input) {
      inputHistoryRef.current.push(input);
    }

    isUndoingInputRef.current = false;
    setInput(value);
    setErrorMessage(null);
    setResponse(null);
    setFullSequence([]);
    setCurrentSequence([]);
    setIsPlaying(false);
    setProgress(0);
  }, [input]);

  const handleUndoInput = useCallback(() => {
    const previousValue = inputHistoryRef.current.pop();
    if (previousValue === undefined) {
      return;
    }

    isUndoingInputRef.current = true;
    setInput(previousValue);
    setErrorMessage(null);
    setResponse(null);
    setFullSequence([]);
    setCurrentSequence([]);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!isPlaying || totalDurationSeconds <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const nextValue = current + (0.1 / totalDurationSeconds) * 100;

        if (nextValue >= 100) {
          if (isLooping) {
            return 0;
          }

          window.clearInterval(interval);
          setIsPlaying(false);
          return 100;
        }

        return nextValue;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isLooping, isPlaying, totalDurationSeconds]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setLoadingStepIndex((current) => (current + 1) % LOADING_STEPS.length);
    }, 1200);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const startPlayback = useCallback(
    (sequence: string[], nextProgress = 0, sourceSequence?: string[]) => {
      if (!sequence.length) {
        return;
      }

      setFullSequence(sourceSequence ?? sequence);
      setCurrentSequence(sequence);
      setProgress(nextProgress);
      setIsPlaying(true);
      sendSignSequenceToUnity(sequence, {
        speed,
        loop: isLooping,
      });
    },
    [isLooping, speed],
  );

  const handleTranslate = useCallback(async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      setErrorMessage(`Please keep the input under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await translateEnglishToASL(trimmedInput);
      setResponse(result);

      if (result.sign_sequence?.length) {
        const normalizedSequence = result.sign_sequence
          .map((item) => normalizeUnityToken(item.token))
          .flat()
          .filter(Boolean);

        startPlayback(normalizedSequence, 0, normalizedSequence);
      }
    } catch (error) {
      setErrorMessage('We could not translate that text right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, startPlayback]);

  const handleTogglePlay = useCallback(() => {
    if (!fullSequence.length) {
      return;
    }

    if (!isPlaying) {
      if (progress >= 100) {
        startPlayback(fullSequence, 0, fullSequence);
        return;
      }

      resumeUnityPlayback();
      setIsPlaying(true);
      return;
    }

    pauseUnityPlayback();
    setIsPlaying(false);
  }, [fullSequence, isPlaying, progress, startPlayback]);

  const handleToggleLoop = useCallback(() => {
    setIsLooping((value) => {
      const nextValue = !value;
      setUnityPlaybackLoop(nextValue);
      return nextValue;
    });
  }, []);

  const handleSpeedChange = useCallback((value: number) => {
    setSpeed(value);
    setUnityPlaybackSpeed(value);
  }, []);

  const handleProgressChange = useCallback(
    (value: number) => {
      if (!fullSequence.length) {
        return;
      }

      const nextValue = Math.min(Math.max(value, 0), 100);
      const targetIndex = Math.min(
        fullSequence.length - 1,
        Math.floor((nextValue / 100) * fullSequence.length),
      );
      const remainingSequence = fullSequence.slice(targetIndex);

      if (!remainingSequence.length) {
        return;
      }

      startPlayback(remainingSequence, nextValue, fullSequence);
    },
    [fullSequence, startPlayback],
  );

  const handleRestart = useCallback(() => {
    if (!fullSequence.length) {
      return;
    }

    startPlayback(fullSequence, 0, fullSequence);
  }, [fullSequence, startPlayback]);

  const statusText = isLoading
    ? LOADING_STEPS[loadingStepIndex]
    : currentSequence.length
      ? isPlaying
        ? 'Playing signs'
        : 'Playback paused'
      : 'Ready to translate';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <HeaderNav />
      <Hero />

      <Box component="section" id="practice" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <TranslatorCard
                input={input}
                maxLength={MAX_INPUT_LENGTH}
                isLoading={isLoading}
                loadingLabel={LOADING_STEPS[loadingStepIndex]}
                errorMessage={errorMessage}
                response={response}
                onInputChange={handleInputChange}
                onUndoInput={handleUndoInput}
                onTranslate={handleTranslate}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <AvatarCard statusText={statusText} isBusy={isLoading}>
                <PlaybackControls
                  isPlaying={isPlaying}
                  isLooping={isLooping}
                  speed={speed}
                  progress={progress}
                  totalDurationSeconds={totalDurationSeconds}
                  canInteract={fullSequence.length > 0}
                  onRestart={handleRestart}
                  onTogglePlay={handleTogglePlay}
                  onToggleLoop={handleToggleLoop}
                  onSpeedChange={handleSpeedChange}
                  onProgressChange={handleProgressChange}
                />
              </AvatarCard>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <ResourcesSection />
      <Footer />
    </Box>
  );
}
