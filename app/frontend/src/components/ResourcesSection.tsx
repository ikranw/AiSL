import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const resources = [
  {
    title: 'ASL Grammar Guide',
    description: 'Learn sentence structure, facial grammar, and classifiers.',
    buttonLabel: 'Open Guide',
    color: '#f97316',
    action: 'grammar-guide',
  },
  {
    title: 'Deaf Culture Facts',
    description: 'Quick facts about Deaf culture, language, and community etiquette.',
    buttonLabel: 'View Facts',
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
    term: 'Big “D” vs. Little “d”',
    detail: 'Lowercase “deaf” refers to audiological disability. Capital “Deaf” signals a linguistic and cultural identity — for those born Deaf, it\'s who they are, not just how they hear. The Deaf community also includes hearing people like CODAs and interpreters.',
    source: 'https://www.wesleyan.edu/about/news/2023/06/fast-facts-about-deaf-culture.html',
  },
  {
    term: 'Watch the face, not the hands',
    detail: 'When talking with someone who signs, keep eye contact — not your eyes on their hands. If an interpreter is present, address the Deaf person directly, not the interpreter. Facial expressions are also grammar in ASL: raised eyebrows mark yes/no questions, furrowed brows mark questions like who, what, and where. It\'s not about how you feel, it\'s punctuation.',
    source: 'https://www.wesleyan.edu/about/news/2023/06/fast-facts-about-deaf-culture.html',
  },
  {
    term: '”Hearing-impaired” is not preferred',
    detail: 'Terms like “hearing-impaired” and “hearing loss” can feel pejorative to many Deaf people. As one perspective puts it: “I was born Deaf. I was never hearing, therefore I did not lose anything.”',
    source: 'https://www.wesleyan.edu/about/news/2023/06/fast-facts-about-deaf-culture.html',
  },
  {
    term: 'ASL is its own language',
    detail: 'ASL is not English translated into signs. It has its own grammar, vocabulary, and structure — using signs, fingerspelling, facial expressions, and body movement to convey full meaning independently.',
    source: 'https://www.wesleyan.edu/about/news/2023/06/fast-facts-about-deaf-culture.html',
  },
  {
    term: 'First Deaf school in America',
    detail: 'Hartford, Connecticut was home to the first free public deaf school in America. Thomas Hopkins Gallaudet partnered with French educator Laurent Clerc to establish what became the American School for the Deaf in 1817.',
    source: 'https://www.wesleyan.edu/about/news/2023/06/fast-facts-about-deaf-culture.html',
  },
  {
    term: 'Where ASL came from',
    detail: 'ASL evolved from a mix of local village sign languages, Native American Hand Talk, and French Sign Language — making it a genuinely distinct language with deep historical roots.',
    source: 'https://www.wesleyan.edu/about/news/2023/06/fast-facts-about-deaf-culture.html',
  },
  {
    term: 'The Deaf President Now movement',
    detail: 'In 1988, Gallaudet University students staged a historic protest demanding Deaf leadership. They won — I. King Jordan became the university\'s first Deaf president, and the movement became a landmark moment for Deaf civil rights.',
    source: 'https://gallaudet.edu/museum/history/the-deaf-president-now-dpn-protest/',
  },
  {
    term: 'Over 300 sign languages exist',
    detail: 'There are more than 300 distinct sign languages worldwide, and they vary even within the same country. ASL is not a universal sign language — a Deaf person in Japan or Brazil uses a completely different one.',
    source: 'https://www.nad.org/resources/american-sign-language/community-and-culture-frequently-asked-questions/',
  },
];

export function ResourcesSection(): JSX.Element {
  const theme = useTheme();
  const _fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
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
          fullScreen={false}
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Mini ASL Grammar Guide
            <IconButton onClick={() => setIsGuideOpen(false)} size="small"><CloseRoundedIcon /></IconButton>
          </DialogTitle>
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
          fullScreen={false}
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            ASL Video Tutorials
            <IconButton onClick={() => setIsVideoOpen(false)} size="small"><CloseRoundedIcon /></IconButton>
          </DialogTitle>
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
          fullScreen={false}
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Deaf Culture Fast Facts
            <IconButton onClick={() => setIsFlashcardsOpen(false)} size="small"><CloseRoundedIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                A few things worth knowing before you dive in. Flip each card to read the full fact.
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
                      <Typography variant="body2" color="text.secondary">
                        {currentFlashcard.detail}
                      </Typography>
                      <Button
                        component="a"
                        href={currentFlashcard.source}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        sx={{ px: 0, mt: 0.5, fontSize: '0.7rem' }}
                      >
                        View source
                      </Button>
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
