import { Box, Container, Stack, Typography } from '@mui/material';
import SignLanguageIcon from '@mui/icons-material/SignLanguage';

export function Footer(): JSX.Element {
  return (
    <Box component="footer" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <SignLanguageIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              AiSL
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} AiSL. All rights reserved.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
