import { Box, Container, Typography } from '@mui/material';

export function Hero(): JSX.Element {
  return (
    <Box component="section" id="learn" sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Typography
          variant="h1"
          align="center"
          sx={{
            mb: 1.25,
            fontSize: { xs: '2rem', md: '2.5rem' },
            lineHeight: 1.08,
            whiteSpace: { xs: 'normal', md: 'nowrap' },
          }}
        >
          Translate English to{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>
            American Sign Language
          </Box>
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          sx={{
            maxWidth: 'none',
            mx: 'auto',
            whiteSpace: { xs: 'normal', md: 'nowrap' },
            fontSize: { xs: '1rem', md: '1.05rem' },
            mb: { xs: 1, md: 1.75 },
          }}
        >
          Get structured ASL gloss, fingerspelling guidance, and 3D avatar playback — all in one place.
        </Typography>
      </Container>
    </Box>
  );
}
