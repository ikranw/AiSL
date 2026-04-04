import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { TranslateResponse } from '../types/translate';

type TranslatorCardProps = {
  input: string;
  maxLength: number;
  isLoading: boolean;
  loadingLabel?: string;
  errorMessage: string | null;
  response: TranslateResponse | null;
  onInputChange: (value: string) => void;
  onTranslate: () => void;
};

type GlossTagType =
  | 'subject'
  | 'verb'
  | 'object'
  | 'time'
  | 'question'
  | 'negation'
  | 'structure';

const SUBJECT_TOKENS = new Set([
  'I',
  'ME',
  'MY',
  'YOU',
  'WE',
  'US',
  'HE',
  'SHE',
  'THEY',
  'IT',
  'MY NAME IS',
]);

const TIME_TOKENS = new Set([
  'TOMORROW',
  'YESTERDAY',
  'TODAY',
  'NOW',
  'LATER',
  'BEFORE',
  'AFTER',
]);

const QUESTION_TOKENS = new Set(['WHY', 'WHAT', 'WHERE', 'WHO', 'HOW', 'WHEN']);

const NEGATION_TOKENS = new Set(['NOT', 'NO', 'NONE', 'NEVER']);

const STRUCTURE_TOKENS = new Set(['IF', 'THEN', 'YES']);

const COMMON_VERBS = new Set([
  'WANT',
  'SEE',
  'GO',
  'HELP',
  'LEARN',
  'NEED',
  'LIKE',
  'KNOW',
  'HAVE',
  'TAKE',
  'GIVE',
  'WORK',
  'PLAY',
  'READ',
  'WRITE',
  'THINK',
  'SAY',
  'TELL',
  'COME',
  'LOOK',
]);

const tagStyles: Record<GlossTagType, { label: string; bg: string; color: string }> = {
  subject: { label: 'Subject', bg: '#dbeafe', color: '#1d4ed8' },
  verb: { label: 'Verb', bg: '#dcfce7', color: '#166534' },
  object: { label: 'Object', bg: '#fef3c7', color: '#92400e' },
  time: { label: 'Time', bg: '#ede9fe', color: '#6d28d9' },
  question: { label: 'Question', bg: '#fce7f3', color: '#be185d' },
  negation: { label: 'Negation', bg: '#fee2e2', color: '#b91c1c' },
  structure: { label: 'Structure', bg: '#e0f2fe', color: '#0369a1' },
};

function classifyGlossTokens(tokens: string[]): GlossTagType[] {
  let seenVerb = false;

  return tokens.map((token, index) => {
    const normalized = token.trim().toUpperCase();

    if (TIME_TOKENS.has(normalized)) {
      return 'time';
    }

    if (QUESTION_TOKENS.has(normalized)) {
      return 'question';
    }

    if (NEGATION_TOKENS.has(normalized)) {
      return 'negation';
    }

    if (STRUCTURE_TOKENS.has(normalized)) {
      return 'structure';
    }

    if (!seenVerb && (COMMON_VERBS.has(normalized) || (index === 1 && SUBJECT_TOKENS.has(tokens[0]?.toUpperCase())))) {
      seenVerb = true;
      return 'verb';
    }

    if (!seenVerb && SUBJECT_TOKENS.has(normalized)) {
      return 'subject';
    }

    if (!seenVerb && index === 0) {
      return 'subject';
    }

    return seenVerb ? 'object' : 'verb';
  });
}

export function TranslatorCard({
  input,
  maxLength,
  isLoading,
  loadingLabel,
  errorMessage,
  response,
  onInputChange,
  onTranslate,
}: TranslatorCardProps): JSX.Element {
  const glossTokens = response?.gloss_tokens ?? [];
  const glossTags = classifyGlossTokens(glossTokens);
  const visibleTagTypes = Array.from(new Set(glossTags));

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
            {isLoading ? loadingLabel ?? 'Translating...' : 'Translate'}
          </Button>

          {errorMessage && <Typography color="error">{errorMessage}</Typography>}

          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
              ASL gloss output
            </Typography>
            <Box
              sx={{
                minHeight: 180,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                bgcolor: 'background.paper',
              }}
            >
              {glossTokens.length ? (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {glossTokens.map((token, index) => {
                      const tagType = glossTags[index];
                      const style = tagStyles[tagType];

                      return (
                        <Chip
                          key={`${token}-${index}`}
                          label={token}
                          sx={{
                            bgcolor: style.bg,
                            color: style.color,
                            fontWeight: 700,
                          }}
                        />
                      );
                    })}
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {visibleTagTypes.map((key) => {
                      const style = tagStyles[key];
                      return (
                      <Chip
                        key={key}
                        label={style.label}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: style.color,
                          color: style.color,
                          bgcolor: style.bg,
                        }}
                      />
                      );
                    })}
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Your translated gloss will appear here.
                </Typography>
              )}
            </Box>
          </Box>

          {response && (
            <Box>
              <Typography variant="body2">
                Sentence type: {response.sentence_type}
              </Typography>
              <Typography variant="body2">
                Confidence note: {response.confidence_note}
              </Typography>
              {response.diagnostics && (
                <Typography variant="body2" color="text.secondary">
                  Response time: {(response.diagnostics.total_ms / 1000).toFixed(1)}s
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
