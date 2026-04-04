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
  Tooltip,
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

const flashcards = [
  {
    term: 'Hello',
    detail: 'A common greeting used to start a conversation in ASL.',
    tip: 'Use this when meeting someone or getting their attention politely.',
  },
  {
    term: 'Thank You',
    detail: 'An everyday sign used to show gratitude.',
    tip: 'A good core sign for beginner practice because it is used often.',
  },
  {
    term: 'Please',
    detail: 'A polite sign used when asking for something.',
    tip: 'Practice pairing this with simple requests to build short phrases.',
  },
  {
    term: 'Sorry',
    detail: 'Used to apologize or show regret.',
    tip: 'Helpful for basic social conversation and respectful communication.',
  },
  {
    term: 'Help',
    detail: 'A useful sign for asking for support or offering assistance.',
    tip: 'Try practicing both “help me” and “help you” in context.',
  },
  {
    term: 'Friend',
    detail: 'A common relationship word often learned early in ASL.',
    tip: 'Good for beginner introductions and simple personal descriptions.',
  },
];

export function ResourcesSection(): JSX.Element {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [activeFlashcard, setActiveFlashcard] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  const handleResourceClick = (action: string) => {
    if (action === 'grammar-guide') {
      setIsGuideOpen(true);
      return;
    }

    if (action === 'flashcards') {
      setActiveFlashcard(0);
      setIsFlashcardFlipped(false);
      setIsFlashcardsOpen(true);
      return;
    }

    if (action === 'videos') {
      setIsVideoOpen(true);
    }
  };

  const currentFlashcard = flashcards[activeFlashcard];

  const showPreviousFlashcard = () => {
    setIsFlashcardFlipped(false);
    setActiveFlashcard((current) => (current === 0 ? flashcards.length - 1 : current - 1));
  };

  const showNextFlashcard = () => {
    setIsFlashcardFlipped(false);
    setActiveFlashcard((current) => (current === flashcards.length - 1 ? 0 : current + 1));
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
                  <Tooltip title={resource.buttonLabel}>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: resource.color, alignSelf: 'flex-start' }}
                      onClick={() => handleResourceClick(resource.action)}
                    >
                      {resource.buttonLabel}
                    </Button>
                  </Tooltip>
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
                    <Tooltip title="Open link">
                      <Button
                        variant="outlined"
                        component="a"
                        href={section.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Resource
                      </Button>
                    </Tooltip>
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
                    <Tooltip title="Watch lesson">
                      <Button
                        variant="outlined"
                        component="a"
                        href={section.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch Resource
                      </Button>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isFlashcardsOpen}
          onClose={() => setIsFlashcardsOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>ASL Vocabulary Flashcards</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Practice a small starter set of everyday ASL vocabulary inside the app.
                Flip each card to read a simple explanation and study tip.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  minHeight: 240,
                  borderRadius: 3,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isFlashcardFlipped ? '#f8fafc' : '#eff6ff',
                }}
                onClick={() => setIsFlashcardFlipped((value) => !value)}
              >
                <Stack spacing={1.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Card {activeFlashcard + 1} of {flashcards.length}
                  </Typography>
                  {!isFlashcardFlipped ? (
                    <>
                      <Typography variant="h3">{currentFlashcard.term}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tap to flip
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h3">Meaning</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentFlashcard.detail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Study tip: {currentFlashcard.tip}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1.5} justifyContent="space-between">
                <Tooltip title="Previous card">
                  <Button variant="outlined" onClick={showPreviousFlashcard}>
                    Previous
                  </Button>
                </Tooltip>
                <Tooltip title={isFlashcardFlipped ? 'Show front' : 'Flip card'}>
                  <Button variant="outlined" onClick={() => setIsFlashcardFlipped((value) => !value)}>
                    {isFlashcardFlipped ? 'Show Front' : 'Flip Card'}
                  </Button>
                </Tooltip>
                <Tooltip title="Next card">
                  <Button variant="contained" onClick={showNextFlashcard}>
                    Next
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}
