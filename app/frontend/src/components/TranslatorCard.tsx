import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { TranslateResponse } from '../types/translate';

interface TranslatorCardProps {
  input: string;
  maxLength: number;
  isLoading: boolean;
  errorMessage: string | null;
  response: TranslateResponse | null;
  onInputChange: (value: string) => void;
  onTranslate: () => void;
}

export function TranslatorCard({
  input,
  maxLength,
  isLoading,
  errorMessage,
  response,
  onInputChange,
  onTranslate,
}: TranslatorCardProps): JSX.Element {
  const isTooLong = input.length > maxLength;
  const helperText = isTooLong
    ? `Input is limited to ${maxLength} characters.`
    : `${input.length}/${maxLength} characters`;

  return (
    <Paper sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            Enter Text to Translate
          </Typography>
          <Typography variant="body2" color="text.secondary">
            English Text
          </Typography>
        </Box>
        <TextField
          multiline
          minRows={4}
          placeholder="Type your message here..."
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          error={isTooLong}
          helperText={helperText}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onTranslate}
          disabled={isLoading || input.trim().length === 0 || isTooLong}
          startIcon={<GTranslateIcon />}
          endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isLoading ? 'Translating...' : 'Translate to ASL'}
        </Button>

        {errorMessage && (
          <Alert severity="error" variant="outlined">
            {errorMessage}
          </Alert>
        )}

        <Alert
          icon={<InfoOutlinedIcon />}
          severity="info"
          sx={{ bgcolor: '#f3f6ff' }}
        >
          Grammar Note: ASL grammar differs from English. The AI output focuses on
          natural ASL word order.
        </Alert>

        {response && (
          <Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              ASL Gloss
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {response.aslGloss.map((sign, index) => (
                <Chip key={`${sign}-${index}`} label={sign} color="primary" variant="outlined" />
              ))}
            </Stack>

            {response.notes.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Notes
                </Typography>
                {response.notes.map((note, index) => (
                  <Typography key={index} variant="body2" color="text.secondary">
                    • {note}
                  </Typography>
                ))}
              </Box>
            )}

            {response.unknownTokens.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Uncertain tokens
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {response.unknownTokens.map((token, index) => (
                    <Chip key={`unknown-${index}`} label={token} size="small" color="warning" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
