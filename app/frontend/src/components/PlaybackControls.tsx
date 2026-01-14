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
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LoopIcon from '@mui/icons-material/Loop';
import { formatTime } from '../utils/time';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  speed: number;
  progress: number;
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
  onTogglePlay,
  onToggleLoop,
  onSpeedChange,
  onProgressChange,
}: PlaybackControlsProps): JSX.Element {
  const totalDurationSeconds = 60;
  const currentTimeSeconds = (progress / 100) * totalDurationSeconds;

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton aria-label="volume" size="small">
          <VolumeUpIcon fontSize="small" />
        </IconButton>
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
        <Typography variant="caption" color="text.secondary">
          {formatTime(currentTimeSeconds)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatTime(totalDurationSeconds)}
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
