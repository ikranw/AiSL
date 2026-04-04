import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Stack, Typography } from '@mui/material';

const faqItems = [
  {
    question: 'Is AiSL trying to be a perfect ASL translator?',
    answer:
      'No. AiSL is meant to be a transparent learning prototype that helps users study how English structure shifts into ASL-style gloss.',
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
      'The current avatar only has a limited direct sign library. Some outputs are clearer than others, and some words still depend on fallback behavior or future pose support.',
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
              A small space to understand the project, the people and tools behind it, and where the work came from.
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  The idea
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                  AiSL was made to help learners with a part of ASL study that many tools still gloss over: how English
                  grammar and ASL structure differ. Instead of only giving a result, it lets users see how English-like
                  phrasing shifts into ASL gloss, watch it play back, and study that change more directly while they
                  practice.
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
                      Pose and motion reference adapted from Studio Galt&apos;s sign language motion capture archive.
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
