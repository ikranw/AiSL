import { Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';

const resources = [
  {
    title: 'ASL Grammar Guide',
    description: 'Learn sentence structure, facial grammar, and classifiers.',
    buttonLabel: 'Download PDF',
    color: '#f97316',
  },
  {
    title: 'Vocabulary Flashcards',
    description: 'Practice daily signs with interactive memory cards.',
    buttonLabel: 'Access Cards',
    color: '#2563eb',
  },
  {
    title: 'Video Tutorials',
    description: 'Watch guided lessons from native ASL instructors.',
    buttonLabel: 'Watch Now',
    color: '#7c3aed',
  },
];

export function ResourcesSection(): JSX.Element {
  return (
    <Box component="section" id="resources" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography variant="h2" sx={{ mb: 4 }}>
          Learning Resources
        </Typography>
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item xs={12} md={4} key={resource.title}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                  <Typography variant="h3">{resource.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {resource.description}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: resource.color, alignSelf: 'flex-start' }}
                  >
                    {resource.buttonLabel}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
