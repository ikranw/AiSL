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

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setErrorMessage(null);
    setResponse(null);
  }, []);

  const handleTranslate = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return;
    }

    if (input.length > MAX_INPUT_LENGTH) {
      setErrorMessage(`Please keep the input under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await translateEnglishToASL(trimmedInput);
      setResponse(result);
      sendSignSequenceToUnity(result.sign_sequence, { speed, loop: isLooping });
    } catch (error) {
      setErrorMessage('We could not translate that text right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, speed, isLooping]);

  const statusText = isLoading ? 'Translating...' : 'Ready to translate';

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
              <AvatarCard statusText={statusText} isBusy={isLoading}>
                <PlaybackControls
                  isPlaying={isPlaying}
                  isLooping={isLooping}
                  speed={speed}
                  progress={progress}
                  onTogglePlay={() => setIsPlaying((value) => !value)}
                  onToggleLoop={() => setIsLooping((value) => !value)}
                  onSpeedChange={(value) => setSpeed(value)}
                  onProgressChange={(value) => setProgress(value)}
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
