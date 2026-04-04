import { Box, Container, Typography } from '@mui/material';

export function Hero(): JSX.Element {
  return (
    <Box component="section" id="learn" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Typography variant="h1" align="center" sx={{ mb: 2 }}>
          Translate English to{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>
            American Sign Language
          </Box>
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ maxWidth: 640, mx: 'auto' }}>
          See how everyday English shifts into ASL gloss through guided structure,
          visual playback, and a learning flow built for the gap most tools skip.
        </Typography>
      </Container>
    </Box>
  );
}
