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

        sendSignSequenceToUnity(normalizedSequence, {
          speed,
          loop: isLooping,
        });
      }
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
