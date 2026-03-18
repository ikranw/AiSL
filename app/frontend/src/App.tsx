import { Box, Container, Grid } from '@mui/material';
import { useCallback, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { Hero } from './components/Hero';
import { TranslatorCard } from './components/TranslatorCard';
import { AvatarCard } from './components/AvatarCard';
import { PlaybackControls } from './components/PlaybackControls';
import { ResourcesSection } from './components/ResourcesSection';
import { Footer } from './components/Footer';
import { translateEnglishToASL } from './services/llmService';
import { sendSignSequenceToUnity } from './services/unityBridge';
import { TranslateResponse } from './types/translate';

const MAX_INPUT_LENGTH = 500;

export default function App(): JSX.Element {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<TranslateResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [seekToIndex, setSeekToIndex] = useState<number | null>(null);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setErrorMessage(null);
    setResponse(null);
  }, []);

  const handleTranslate = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    if (input.length > MAX_INPUT_LENGTH) {
      setErrorMessage(`Please keep the input under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await translateEnglishToASL(trimmedInput);
      setResponse(result);
      setIsPlaying(true);
      setProgress(0);
      setSeekToIndex(null);
      sendSignSequenceToUnity(result.aslGloss, { speed, loop: isLooping });
    } catch (error) {
      setErrorMessage('We could not translate that text right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, speed, isLooping]);

  // Called by AvatarCard as each sign plays — keeps the slider in sync
  const handleAvatarProgress = useCallback((index: number, total: number) => {
    setProgress(total > 1 ? Math.round((index / (total - 1)) * 100) : 0);
  }, []);

  // Called by AvatarCard when the sequence finishes (and not looping)
  const handlePlaybackEnd = useCallback(() => {
    setIsPlaying(false);
    setProgress(100);
  }, []);

  // Called when the user drags the slider — seeks AvatarCard to that sign
  const handleProgressChange = useCallback((value: number) => {
    setProgress(value);
    const total = response?.aslGloss.length ?? 0;
    if (total > 0) {
      setSeekToIndex(Math.round((value / 100) * (total - 1)));
    }
  }, [response]);

  const statusText = isLoading ? 'Translating...' : isPlaying ? 'Playing...' : 'Ready to translate';

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
                errorMessage={errorMessage}
                response={response}
                onInputChange={handleInputChange}
                onTranslate={handleTranslate}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <AvatarCard
                statusText={statusText}
                isBusy={isLoading}
                sequence={response?.aslGloss ?? []}
                speed={speed}
                isPlaying={isPlaying}
                isLooping={isLooping}
                seekToIndex={seekToIndex}
                onProgress={handleAvatarProgress}
                onPlaybackEnd={handlePlaybackEnd}
              >
                <PlaybackControls
                  isPlaying={isPlaying}
                  isLooping={isLooping}
                  speed={speed}
                  progress={progress}
                  totalTokens={response?.aslGloss.length ?? 0}
                  onTogglePlay={() => setIsPlaying((value) => !value)}
                  onToggleLoop={() => setIsLooping((value) => !value)}
                  onSpeedChange={(value) => setSpeed(value)}
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
