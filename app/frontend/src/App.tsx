import { Box, Container, FormControl, Grid, MenuItem, Select } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { Hero } from './components/Hero';
import { TranslatorCard } from './components/TranslatorCard';
import { AvatarCard } from './components/AvatarCard';
import { VideoAvatarCard } from './components/VideoAvatarCard';
import { PlaybackControls } from './components/PlaybackControls';
import { ResourcesSection } from './components/ResourcesSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { translateEnglishToASL } from './services/llmService';
import { UNITY_RANDOM_SENTENCES, VIDEO_RANDOM_SENTENCES } from './utils/randomSentences';
import {
  pauseUnityPlayback,
  resetUnityToIdle,
  resumeUnityPlayback,
  sendSignSequenceToUnity,
  setUnityPlaybackStateListener,
  setUnityPlaybackLoop,
  setUnityPlaybackSpeed,
} from './services/unityBridge';
import { TranslateResponse } from './types/translate';

const MAX_INPUT_LENGTH = 500;
const BASE_SIGN_DURATION_SECONDS = 1.2;
const FINGERSPELL_LETTER_SECONDS = 0.45;
const LOADING_STEPS = ['Analyzing text...', 'Building gloss...', 'Preparing signs...'];

type AvatarRendererMode = 'unity' | 'video';

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
  const [avatarMode, setAvatarMode] = useState<AvatarRendererMode>('unity');
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
  const [playbackCurrentSeconds, setPlaybackCurrentSeconds] = useState(0);
  const [playbackTotalSeconds, setPlaybackTotalSeconds] = useState(0);
  const [playbackCurrentToken, setPlaybackCurrentToken] = useState('');
  const [playbackCurrentTokenIndex, setPlaybackCurrentTokenIndex] = useState(-1);
  const [playbackTotalTokens, setPlaybackTotalTokens] = useState(0);
  const [playbackTokenInfoMessage, setPlaybackTokenInfoMessage] = useState<string | null>(null);
  const [videoSeekToIndex, setVideoSeekToIndex] = useState<number | null>(null);
  const [videoPlaybackVersion, setVideoPlaybackVersion] = useState(0);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const inputHistoryRef = useRef<string[]>([]);
  const randomSentenceHistoryRef = useRef<Record<AvatarRendererMode, string[]>>({
    unity: [],
    video: [],
  });
  const unityPlaybackStartIndexRef = useRef(0);
  const unityPlaybackSourceTotalRef = useRef(0);
  const isUndoingInputRef = useRef(false);
  const translateRequestIdRef = useRef(0);

  const estimatedDurationSeconds = estimateSequenceDuration(currentSequence, speed);
  const totalDurationSeconds = playbackTotalSeconds > 0 ? playbackTotalSeconds : estimatedDurationSeconds;
  const displayProgress = playbackTotalSeconds > 0
    ? Math.min((playbackCurrentSeconds / playbackTotalSeconds) * 100, 100)
    : progress;

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
    setPlaybackCurrentSeconds(0);
    setPlaybackTotalSeconds(0);
    setPlaybackCurrentToken('');
    setPlaybackCurrentTokenIndex(-1);
    setPlaybackTotalTokens(0);
    setPlaybackTokenInfoMessage(null);
    translateRequestIdRef.current += 1;
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
    setPlaybackCurrentSeconds(0);
    setPlaybackTotalSeconds(0);
    setPlaybackCurrentToken('');
    setPlaybackCurrentTokenIndex(-1);
    setPlaybackTotalTokens(0);
    setPlaybackTokenInfoMessage(null);
    translateRequestIdRef.current += 1;
  }, []);

  const handleRandomSentence = useCallback(() => {
    const sentencePool = avatarMode === 'video' ? VIDEO_RANDOM_SENTENCES : UNITY_RANDOM_SENTENCES;
    const recentHistory = randomSentenceHistoryRef.current[avatarMode];
    const availableSentences = sentencePool.filter((sentence) => !recentHistory.includes(sentence));
    const candidates = availableSentences.length > 0 ? availableSentences : [...sentencePool];
    const nextSentence = candidates[Math.floor(Math.random() * candidates.length)];

    randomSentenceHistoryRef.current[avatarMode] = [...recentHistory, nextSentence].slice(-6);
    resetUnityToIdle();
    setIsPlaying(false);
    setProgress(0);
    setPlaybackCurrentSeconds(0);
    setPlaybackTotalSeconds(0);
    setPlaybackCurrentToken('');
    setPlaybackCurrentTokenIndex(-1);
    setPlaybackTotalTokens(0);
    setPlaybackTokenInfoMessage(null);
    setVideoSeekToIndex(null);
    setVideoPlaybackVersion(0);
    handleInputChange(nextSentence);
  }, [avatarMode, handleInputChange]);

  useEffect(() => {
    if (avatarMode === 'video' || !isPlaying || totalDurationSeconds <= 0 || playbackTotalSeconds > 0) {
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
  }, [avatarMode, isLooping, isPlaying, playbackTotalSeconds, totalDurationSeconds]);

  useEffect(() => {
    setUnityPlaybackStateListener((state) => {
      setPlaybackCurrentSeconds(state.currentSeconds);
      setPlaybackTotalSeconds(state.totalSeconds);
      setIsPlaying(state.isPlaying);

      if (state.isFingerspelling) {
        setPlaybackCurrentToken(state.displayToken || state.currentToken);
        setPlaybackCurrentTokenIndex(state.displayIndex);
        setPlaybackTotalTokens(state.displayTotal);
        setPlaybackTokenInfoMessage(
          state.currentToken
            ? `We do not have a direct sign for "${state.currentToken}", so this word is being fingerspelled.`
            : null,
        );
        return;
      }

      const sourceTotal = unityPlaybackSourceTotalRef.current || state.totalTokens;
      const sourceIndex = state.currentTokenIndex >= 0
        ? state.currentTokenIndex + unityPlaybackStartIndexRef.current
        : state.currentTokenIndex;

      setPlaybackCurrentToken(state.displayToken || state.currentToken);
      setPlaybackCurrentTokenIndex(sourceIndex);
      setPlaybackTotalTokens(sourceTotal);
      setPlaybackTokenInfoMessage(null);
    });

    return () => setUnityPlaybackStateListener(undefined);
  }, []);

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
    (
      sequence: string[],
      nextProgress = 0,
      sourceSequence?: string[],
      options?: { renderer?: AvatarRendererMode; startIndex?: number },
    ) => {
      if (!sequence.length) {
        return;
      }

      const renderer = options?.renderer ?? avatarMode;
      const nextFullSequence = [...(sourceSequence ?? sequence)];
      const nextCurrentSequence = renderer === 'video' ? nextFullSequence : [...sequence];
      const startIndex = options?.startIndex ?? 0;

      setFullSequence(nextFullSequence);
      setCurrentSequence(nextCurrentSequence);
      setProgress(nextProgress);
      setPlaybackCurrentSeconds(0);
      setPlaybackTotalSeconds(0);
      setPlaybackCurrentToken(nextFullSequence[startIndex] ?? '');
      setPlaybackCurrentTokenIndex(nextFullSequence.length ? startIndex : -1);
      setPlaybackTotalTokens(nextFullSequence.length);
      setPlaybackTokenInfoMessage(null);
      setIsPlaying(true);
      setVideoSeekToIndex(startIndex);

      if (renderer === 'video') {
        setVideoPlaybackVersion((value) => value + 1);
        return;
      }

      unityPlaybackStartIndexRef.current = startIndex;
      unityPlaybackSourceTotalRef.current = nextFullSequence.length;

      sendSignSequenceToUnity(nextCurrentSequence, {
        speed,
        loop: isLooping,
      });
    },
    [avatarMode, isLooping, speed],
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

    const requestId = translateRequestIdRef.current + 1;
    translateRequestIdRef.current = requestId;

    resetUnityToIdle();
    setIsPlaying(false);
    setProgress(0);
    setPlaybackCurrentSeconds(0);
    setPlaybackTotalSeconds(0);
    setPlaybackCurrentToken('');
    setPlaybackCurrentTokenIndex(-1);
    setPlaybackTotalTokens(0);
    setPlaybackTokenInfoMessage(null);
    setVideoSeekToIndex(null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await translateEnglishToASL(trimmedInput);

      if (translateRequestIdRef.current != requestId) {
        return;
      }

      setResponse(result);

      if (result.sign_sequence?.length) {
        const normalizedSequence = result.sign_sequence
          .map((item) => normalizeUnityToken(item.token))
          .flat()
          .filter(Boolean);

        startPlayback(normalizedSequence, 0, normalizedSequence);
      }
    } catch (error) {
      if (translateRequestIdRef.current != requestId) {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not translate that text right now. Please try again.',
      );
    } finally {
      if (translateRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [input, startPlayback]);

  const handleTogglePlay = useCallback(() => {
    if (!fullSequence.length) {
      return;
    }

    if (avatarMode === 'video') {
      if (!isPlaying) {
        if (displayProgress >= 100) {
          startPlayback(fullSequence, 0, fullSequence, { renderer: 'video', startIndex: 0 });
          return;
        }

        setIsPlaying(true);
        return;
      }

      setIsPlaying(false);
      return;
    }

    if (!isPlaying) {
      if (displayProgress >= 100) {
        startPlayback(fullSequence, 0, fullSequence);
        return;
      }

      resumeUnityPlayback();
      setIsPlaying(true);
      return;
    }

    pauseUnityPlayback();
    setIsPlaying(false);
  }, [avatarMode, displayProgress, fullSequence, isPlaying, startPlayback]);

  const handleToggleLoop = useCallback(() => {
    setIsLooping((value) => {
      const nextValue = !value;
      if (avatarMode === 'unity') {
        setUnityPlaybackLoop(nextValue);
      }
      return nextValue;
    });
  }, [avatarMode]);

  const handleSpeedChange = useCallback((value: number) => {
    setSpeed(value);
    if (avatarMode === 'unity') {
      setUnityPlaybackSpeed(value);
    }
  }, [avatarMode]);

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

      if (avatarMode === 'video') {
        startPlayback(fullSequence, nextValue, fullSequence, {
          renderer: 'video',
          startIndex: targetIndex,
        });
        return;
      }

      const remainingSequence = fullSequence.slice(targetIndex);
      if (remainingSequence.length) {
        startPlayback(remainingSequence, nextValue, fullSequence, {
          renderer: 'unity',
          startIndex: targetIndex,
        });
      }
    },
    [avatarMode, fullSequence, startPlayback],
  );

  const handleRestart = useCallback(() => {
    if (!fullSequence.length) {
      return;
    }

    startPlayback(fullSequence, 0, fullSequence, { renderer: avatarMode, startIndex: 0 });
  }, [avatarMode, fullSequence, startPlayback]);

  const handleAvatarModeChange = useCallback((nextMode: AvatarRendererMode) => {
    if (nextMode === avatarMode) {
      return;
    }

    if (avatarMode === 'unity') {
      pauseUnityPlayback();
      resetUnityToIdle();
    }

    setAvatarMode(nextMode);
    setIsPlaying(false);
    setProgress(0);
    setPlaybackCurrentSeconds(0);
    setPlaybackTotalSeconds(0);
    setPlaybackCurrentToken('');
    setPlaybackCurrentTokenIndex(-1);
    setPlaybackTotalTokens(fullSequence.length);
    setVideoSeekToIndex(null);

    if (!fullSequence.length) {
      return;
    }

    startPlayback(fullSequence, 0, fullSequence, { renderer: nextMode, startIndex: 0 });
  }, [avatarMode, fullSequence, startPlayback]);

  const handleVideoProgress = useCallback((index: number, total: number) => {
    setPlaybackCurrentToken(fullSequence[index] ?? '');
    setPlaybackCurrentTokenIndex(index);
    setPlaybackTotalTokens(total);
    setProgress(total > 1 ? (index / (total - 1)) * 100 : 0);
  }, [fullSequence]);

  const handleVideoPlaybackEnd = useCallback(() => {
    setPlaybackCurrentSeconds(0);
    setPlaybackTotalSeconds(0);
    setPlaybackCurrentToken('');
    setPlaybackCurrentTokenIndex(fullSequence.length ? fullSequence.length - 1 : -1);
    setPlaybackTotalTokens(fullSequence.length);
    setProgress(100);
    setIsPlaying(false);
  }, [fullSequence]);

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

      <Box
        component="section"
        id="practice"
        sx={{
          mt: { xs: -2, md: -4 },
          pb: { xs: 8, md: 12 },
        }}
      >
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
                avatarMode={avatarMode}
                onInputChange={handleInputChange}
                onUndoInput={handleUndoInput}
                onRandomSentence={handleRandomSentence}
                onTranslate={handleTranslate}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              {avatarMode === 'unity' ? (
                <AvatarCard
                  statusText={statusText}
                  activeToken={playbackCurrentToken}
                  activeTokenIndex={playbackCurrentTokenIndex}
                  totalTokens={playbackTotalTokens}
                  activeTokenInfoMessage={playbackTokenInfoMessage}
                  isBusy={isLoading}
                  headerControl={(
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={avatarMode}
                        onChange={(event) => handleAvatarModeChange(event.target.value as AvatarRendererMode)}
                        variant="standard"
                        disableUnderline
                        sx={{
                          minWidth: 180,
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          '.MuiSelect-select': {
                            py: 0,
                            pr: 3,
                          },
                        }}
                      >
                        <MenuItem value="unity">3D Avatar</MenuItem>
                        <MenuItem value="video">Sign Videos</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                >
                  <PlaybackControls
                    isPlaying={isPlaying}
                    isLooping={isLooping}
                    speed={speed}
                    progress={displayProgress}
                    totalDurationSeconds={totalDurationSeconds}
                    canInteract={fullSequence.length > 0}
                    onRestart={handleRestart}
                    onTogglePlay={handleTogglePlay}
                    onToggleLoop={handleToggleLoop}
                    onSpeedChange={handleSpeedChange}
                    onProgressChange={handleProgressChange}
                  />
                </AvatarCard>
              ) : (
                <VideoAvatarCard
                  statusText={statusText}
                  isBusy={isLoading}
                  sequence={currentSequence}
                  speed={speed}
                  isPlaying={isPlaying}
                  isLooping={isLooping}
                  seekToIndex={videoSeekToIndex}
                  playbackVersion={videoPlaybackVersion}
                  onProgress={handleVideoProgress}
                  onPlaybackEnd={handleVideoPlaybackEnd}
                  headerControl={(
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={avatarMode}
                        onChange={(event) => handleAvatarModeChange(event.target.value as AvatarRendererMode)}
                        variant="standard"
                        disableUnderline
                        sx={{
                          minWidth: 180,
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          '.MuiSelect-select': {
                            py: 0,
                            pr: 3,
                          },
                        }}
                      >
                        <MenuItem value="unity">3D Avatar</MenuItem>
                        <MenuItem value="video">Sign Videos</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                >
                  <PlaybackControls
                    isPlaying={isPlaying}
                    isLooping={isLooping}
                    speed={speed}
                    progress={displayProgress}
                    totalDurationSeconds={totalDurationSeconds}
                    canInteract={fullSequence.length > 0}
                    onRestart={handleRestart}
                    onTogglePlay={handleTogglePlay}
                    onToggleLoop={handleToggleLoop}
                    onSpeedChange={handleSpeedChange}
                    onProgressChange={handleProgressChange}
                  />
                </VideoAvatarCard>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      <ResourcesSection />
      <AboutSection />
      <Footer />
    </Box>
  );
}
