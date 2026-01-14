import { Box, Paper, Stack, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useRef, type ReactNode } from 'react';

interface AvatarCardProps {
  statusText: string;
  isBusy?: boolean;
  children?: ReactNode;
}

export function AvatarCard({ statusText, isBusy = false, children }: AvatarCardProps): JSX.Element {
  const unityMountRef = useRef<HTMLDivElement | null>(null);
  const statusColor = isBusy ? '#f59e0b' : '#16a34a';

  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
      <Stack spacing={3} height="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">3D ASL Avatar</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: statusColor,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {statusText}
            </Typography>
          </Stack>
        </Stack>

        <Box
          id="unity-webgl-mount"
          ref={unityMountRef}
          sx={{
            flexGrow: 1,
            borderRadius: 3,
            bgcolor: '#eef2f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3,
          }}
        >
          {/* Unity WebGL build will mount a canvas into this container later. */}
          <Box>
            <PersonOutlineIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              3D Avatar will appear here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unity WebGL placeholder. The avatar loads after integration.
            </Typography>
          </Box>
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}
