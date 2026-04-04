import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { TranslateResponse } from '../types/translate';

type TranslatorCardProps = {
  input: string;
  maxLength: number;
  isLoading: boolean;
  errorMessage: string | null;
  response: TranslateResponse | null;
  onInputChange: (value: string) => void;
  onTranslate: () => void;
};

export function TranslatorCard({
  input,
  maxLength,
  isLoading,
  errorMessage,
  response,
  onInputChange,
  onTranslate,
}: TranslatorCardProps): JSX.Element {
  const glossText = response?.gloss_tokens?.join(' ') ?? '';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h5">Translate English to ASL Gloss</Typography>

          <TextField
            label="English input"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            multiline
            minRows={5}
            inputProps={{ maxLength }}
            fullWidth
          />

          <Button
            variant="contained"
            onClick={onTranslate}
            disabled={isLoading || !input.trim()}
            fullWidth
          >
            {isLoading ? 'Translating...' : 'Translate'}
          </Button>

          {errorMessage && <Typography color="error">{errorMessage}</Typography>}

          <TextField
            label="ASL gloss output"
            value={glossText}
            multiline
            minRows={4}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          {response && (
            <Box>
              <Typography variant="body2">
                Sentence type: {response.sentence_type}
              </Typography>
              <Typography variant="body2">
                Confidence note: {response.confidence_note}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
