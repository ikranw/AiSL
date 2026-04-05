import { AppBar, Box, Container, Stack, Typography } from '@mui/material';
import SignLanguageIcon from '@mui/icons-material/SignLanguage';

const navItems = [
  { label: 'Practice', href: '#' },
  { label: 'Resources', href: '#resources' },
  { label: 'About', href: '#about' },
];

export function HeaderNav(): JSX.Element {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 2,
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#e6efff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SignLanguageIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                AiSL
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                AI-Powered Sign Language Learning
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={3} alignItems="center">
            <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {navItems.map((item) => (
                <Typography
                  key={item.label}
                  component="a"
                  href={item.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {item.label}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </AppBar>
  );
}
