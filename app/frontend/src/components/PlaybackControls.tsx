import {
  Box,
  Chip,
  IconButton,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import LoopIcon from '@mui/icons-material/Loop';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  speed: number;
  progress: number;
  totalTokens: number;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSpeedChange: (value: number) => void;
  onProgressChange: (value: number) => void;
}

const speedOptions = [0.5, 1, 2];

export function PlaybackControls({
  isPlaying,
  isLooping,
  speed,
  progress,
  totalTokens,
  onTogglePlay,
  onToggleLoop,
  onSpeedChange,
  onProgressChange,
}: PlaybackControlsProps): JSX.Element {
  const currentToken = totalTokens > 0 ? Math.round((progress / 100) * (totalTokens - 1)) + 1 : 0;

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton aria-label="play" size="small" onClick={onTogglePlay}>
          {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>
        <IconButton aria-label="loop" size="small" onClick={onToggleLoop}>
          <LoopIcon fontSize="small" color={isLooping ? 'primary' : 'inherit'} />
        </IconButton>
        <Box sx={{ flexGrow: 1, px: 1 }}>
          <Slider
            value={progress}
            onChange={(_, value) => onProgressChange(value as number)}
            size="small"
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {totalTokens > 0 ? `${currentToken} / ${totalTokens}` : '— / —'}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        {speedOptions.map((option) => (
          <Chip
            key={option}
            label={`${option}x`}
            color={option === speed ? 'primary' : 'default'}
            variant={option === speed ? 'filled' : 'outlined'}
            onClick={() => onSpeedChange(option)}
            size="small"
          />
        ))}
      </Stack>
    </Stack>
  );
}
