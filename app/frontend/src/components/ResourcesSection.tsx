import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const resources = [
  {
    title: 'ASL Grammar Guide',
    description: 'Learn sentence structure, facial grammar, and classifiers.',
    buttonLabel: 'Open Guide',
    color: '#f97316',
    action: 'grammar-guide',
  },
  {
    title: 'Vocabulary Flashcards',
    description: 'Practice daily signs with interactive memory cards.',
    buttonLabel: 'Access Cards',
    color: '#2563eb',
    action: 'flashcards',
  },
  {
    title: 'Video Tutorials',
    description: 'Watch guided lessons from native ASL instructors.',
    buttonLabel: 'Watch Now',
    color: '#7c3aed',
    action: 'videos',
  },
];

const grammarGuideSections = [
  {
    title: 'Sentence Structure',
    summary:
      'ASL does not always follow spoken English word order. This section helps learners see how ideas are often organized more visually and directly.',
    href: 'https://www.handspeak.com/learn/190/',
  },
  {
    title: 'Facial Grammar',
    summary:
      'Facial expressions are part of the meaning in ASL. They help show things like questions, emphasis, and tone instead of being just extra emotion.',
    href: 'https://lifeprint.com/asl101/topics/parameters-asl.htm',
  },
  {
    title: 'Classifiers',
    summary:
      'Classifiers are handshapes used to represent people, objects, movement, and shape. They make descriptions more visual and more precise.',
    href: 'https://www.handspeak.com/learn/20/',
  },
];

const videoTutorialSections = [
  {
    title: 'Beginner ASL Lessons',
    summary:
      'A strong place to start with guided beginner lessons taught by Dr. Bill Vicars through Lifeprint and ASL University.',
    href: 'https://www.lifeprint.com/videos-studio-explain.htm',
  },
  {
    title: 'Facial Expressions in ASL',
    summary:
      'A focused lesson on how facial expressions affect meaning in ASL and why they are part of the language itself.',
    href: 'https://www.signlanguage101.com/free-lessons/asl-level-1/facial-expressions',
  },
  {
    title: 'Using Classifiers',
    summary:
      'A practical video lesson showing how descriptive classifiers are used to describe objects more clearly in ASL.',
    href: 'https://www.youtube.com/watch?v=Ajiog8S9P3Y',
  },
];

export function ResourcesSection(): JSX.Element {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const handleResourceClick = (action: string) => {
    if (action === 'grammar-guide') {
      setIsGuideOpen(true);
      return;
    }

    if (action === 'videos') {
      setIsVideoOpen(true);
    }
  };

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
                    onClick={() => handleResourceClick(resource.action)}
                  >
                    {resource.buttonLabel}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Dialog
          open={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Mini ASL Grammar Guide</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                This quick guide points learners to three core ASL grammar topics using
                beginner-friendly outside resources.
              </Typography>

              {grammarGuideSections.map((section) => (
                <Paper
                  key={section.title}
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 3, boxShadow: 'none' }}
                >
                  <Stack spacing={1.25} alignItems="flex-start">
                    <Typography variant="h3">{section.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.summary}
                    </Typography>
                    <Button
                      variant="outlined"
                      component="a"
                      href={section.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Resource
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>ASL Video Tutorials</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                These tutorials give learners a simple path through beginner lessons,
                facial grammar, and classifier use.
              </Typography>

              {videoTutorialSections.map((section) => (
                <Paper
                  key={section.title}
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 3, boxShadow: 'none' }}
                >
                  <Stack spacing={1.25} alignItems="flex-start">
                    <Typography variant="h3">{section.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.summary}
                    </Typography>
                    <Button
                      variant="outlined"
                      component="a"
                      href={section.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch Resource
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}
