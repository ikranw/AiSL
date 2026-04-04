import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Stack, Typography } from '@mui/material';

const faqItems = [
  {
    question: 'Is AiSL trying to be a perfect ASL translator?',
    answer:
      'Not even close. AiSL is a learning prototype built for transparency, not perfection. It\'s here to help you study how English structure shifts into ASL-style gloss, not to replace a fluent signer.',
  },
  {
    question: 'Why does the output look different from normal English?',
    answer:
      'ASL gloss is not written English. It compresses, reorders, and marks meaning differently, so the output is meant to show ASL structure rather than preserve English grammar word for word.',
  },
  {
    question: 'How does the avatar know what to sign?',
    answer:
      'The system first generates ASL-style gloss tokens, then sends that sign sequence into Unity so the avatar can play the matching signs in order.',
  },
  {
    question: 'Why does the avatar not always know every word?',
    answer:
      'The sign database is currently limited and manually maintained. Each sign has to be individually recorded and uploaded, so if a word isn\'t in the database yet, the avatar will default to fingerspelling it letter by letter. Less common words, names, and new vocabulary may always appear fingerspelled for now.',
  },
  {
    question: 'Is AiSL a substitute for learning ASL from a Deaf instructor?',
    answer:
      'No, and it shouldn\'t be. ASL is a full language with nuance, regional variation, and cultural depth that no tool can fully capture. AiSL is a study aid. For real learning, go to Deaf instructors and engage with the Deaf community directly.',
  },
  {
    question: 'Why Unity — and why does the avatar look the way she does?',
    answer:
      'Unity gives us direct control over the avatar\'s skeleton, animations, and her face. Facial expressions are a core part of ASL grammar, not just emotion, so being able to eventually drive eyebrows, mouth shapes, and gaze programmatically matters a lot. She may not be the most polished avatar right now, but the goal is to build toward expressive, accurate signing. That requires a platform we can actually control at that level.',
  },
  {
    question: 'Why do some avatar changes need a WebGL rebuild?',
    answer:
      'Frontend UI changes show up right away, but Unity script or animation changes only appear after exporting a fresh WebGL build.',
  },
] as const;

export function AboutSection(): JSX.Element {
  return (
    <Box component="section" id="about" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4.5}>
          <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
              About & Credits
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Why AiSL exists
            </Typography>
            <Typography variant="body1" color="text.secondary">
              A small space to understand the project, the people, and tools behind it.
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  The Idea
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                  Most ASL tools hand you a result and move on. AiSL slows that down — it shows how English phrasing
                  shifts into ASL gloss, lets you watch it play back on a 3D avatar, and gives learners something to
                  actually study rather than just consume.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Credits
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Avatar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The avatar is from the Microsoft Rocketbox library.
                    </Typography>
                    <Button
                      href="https://github.com/microsoft/Microsoft-Rocketbox"
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      sx={{ px: 0, mt: 0.75 }}
                    >
                      View Rocketbox Source
                    </Button>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Signs Source
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign and motion reference adapted from Studio Galt&apos;s sign language motion capture archive.
                    </Typography>
                    <Button
                      href="https://github.com/StudioGalt/Sign-Language-Mocap-Archive"
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      sx={{ px: 0, mt: 0.75 }}
                    >
                      View Studio Galt Source
                    </Button>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  FAQ
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Stack spacing={2}>
                  {faqItems.map((item) => (
                    <Box key={item.question}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {item.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.answer}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Contact
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    For project questions, issues, or collaboration, use the repository link below.
                  </Typography>
                  <Button
                    variant="outlined"
                    href="https://github.com/ikranw/AiSL"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Open Project Repository
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
