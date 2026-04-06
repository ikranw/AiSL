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
    question: 'What is the difference between the 3D Avatar and ASL Sign Videos modes?',
    answer:
      'The two modes pull from completely separate databases, so they may not be able to sign the exact same words. The 3D Avatar uses motion-captured animation clips (1,915 signs) and gives us more direct control over how signing is displayed and built over time. The ASL Sign Videos mode pulls real video clips of human signers (2,000 clips), which can feel more natural to watch. Combined, the two systems cover 3,915 signs across their separate inventories — though there is some overlap between them.',
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
                  The Problem
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                  ASL is one of the most under-resourced languages in AI research. Most tools treat it as English with
                  hand gestures, or focus narrowly on fingerspelling, without ever explaining the structure behind the output.
                  <br /><br />
                  The grammar alone makes this hard. ASL follows topic-comment structure. Time
                  is established at the start of a sentence. Questions are marked by facial expression: raised eyebrows
                  for yes/no, furrowed brows for who/what/where. None of that survives a word-for-word translation.
                  <br /><br />
                  ASL fluency requires far more than token generation and clip playback.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  The Approach
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                  AiSL shows the structural shift from English to ASL gloss so learners can see how the grammar
                  actually changes. The current focus is on getting that layer right: gloss ordering, time markers,
                  and negation. Take this sentence as an example:
                </Typography>
                <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.disabled" sx={{ minWidth: 64, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>English</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"I am going to the store tomorrow."</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Typography variant="caption" color="primary.main" sx={{ minWidth: 64, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', pt: 0.5 }}>ASL Gloss</Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="flex-start">
                        {[
                          { token: 'TOMORROW', label: 'Time', bg: '#ede9fe', color: '#6d28d9' },
                          { token: 'I', label: 'Subject', bg: '#dbeafe', color: '#1d4ed8' },
                          { token: 'GO', label: 'Verb', bg: '#dcfce7', color: '#166534' },
                          { token: 'STORE', label: 'Object', bg: '#fef3c7', color: '#92400e' },
                        ].map(({ token, label, bg, color }) => (
                          <Stack key={token} alignItems="center" spacing={0.25}>
                            <Box sx={{ px: 1.25, py: 0.25, borderRadius: 1, bgcolor: bg, color, fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                              {token}
                            </Box>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', letterSpacing: '0.04em' }}>
                              {label}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                  Time comes first, the subject follows, and filler words drop entirely. That structural shift is what
                  AiSL is built to make visible.
                  <br /><br />
                  The longer-term goal is facial expressions. In ASL, a sentence without correct facial grammar is
                  like a sentence without punctuation: technically present, but incomplete. We chose Unity because it
                  gives us programmatic control over the avatar&apos;s face, and building toward that takes infrastructure
                  most tools have never tried to build.
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
                      3D Avatar
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
                      Avatar Signs <Typography component="span" variant="caption" color="text.disabled">— 1,915 signs</Typography>
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
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      ASL Sign Videos <Typography component="span" variant="caption" color="text.disabled">— 2,000 clips</Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign video clips sourced from the WLASL (Word-Level American Sign Language) dataset, a large-scale benchmark for word-level ASL recognition.
                    </Typography>
                    <Button
                      href="https://www.kaggle.com/datasets/risangbaskoro/wlasl-processed"
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      sx={{ px: 0, mt: 0.75 }}
                    >
                      View WLASL Dataset
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
