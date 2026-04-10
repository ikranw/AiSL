import { useState } from 'react';
import { Box, Container, Link, Stack, Typography } from '@mui/material';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import SignLanguageIcon from '@mui/icons-material/SignLanguage';
import { BugReportDialog } from './BugReportDialog';

export function Footer(): JSX.Element {
  const [bugDialogOpen, setBugDialogOpen] = useState(false);

  return (
    <>
      <Box component="footer" sx={{ py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Stack spacing={0.75}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SignLanguageIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  AiSL
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Avatar: Rocketbox. Sign animations: Studio Galt. Sign videos: WLASL.
              </Typography>
            </Stack>
            <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Link
                component="button"
                onClick={() => setBugDialogOpen(true)}
                underline="hover"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', border: 'none', background: 'none', p: 0 }}
              >
                <BugReportOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">Report a Bug</Typography>
              </Link>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} AiSL. All rights reserved.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Built for interactive ASL learning and signing practice.
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <BugReportDialog open={bugDialogOpen} onClose={() => setBugDialogOpen(false)} />
    </>
  );
}
