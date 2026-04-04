import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import LoopIcon from '@mui/icons-material/Loop';
import { formatTime } from '../utils/time';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  speed: number;
  progress: number;
  totalDurationSeconds: number;
  canInteract: boolean;
  onRestart: () => void;
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
  totalDurationSeconds,
  canInteract,
  onRestart,
  onTogglePlay,
  onToggleLoop,
  onSpeedChange,
  onProgressChange,
}: PlaybackControlsProps): JSX.Element {
  const [sliderValue, setSliderValue] = useState(progress);

  useEffect(() => {
    setSliderValue(progress);
  }, [progress]);

  const currentTimeSeconds = (sliderValue / 100) * totalDurationSeconds;

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={canInteract ? 'Replay' : 'Translate first'}>
          <span>
            <IconButton aria-label="restart" size="small" onClick={onRestart} disabled={!canInteract}>
              <ReplayIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={canInteract ? (isPlaying ? 'Pause' : 'Play') : 'Translate first'}>
          <span>
            <IconButton aria-label="play" size="small" onClick={onTogglePlay} disabled={!canInteract}>
              {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={canInteract ? 'Loop' : 'Translate first'}>
          <span>
            <IconButton aria-label="loop" size="small" onClick={onToggleLoop} disabled={!canInteract}>
              <LoopIcon fontSize="small" color={isLooping ? 'primary' : 'inherit'} />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ flexGrow: 1, px: 1 }}>
          <Slider
            value={sliderValue}
            onChange={(_, value) => setSliderValue(value as number)}
            onChangeCommitted={(_, value) => onProgressChange(value as number)}
            size="small"
            disabled={!canInteract}
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
          <Tooltip key={option} title={canInteract ? `${option}x speed` : 'Translate first'}>
            <span>
              <Chip
                label={`${option}x`}
                color={option === speed ? 'primary' : 'default'}
                variant={option === speed ? 'filled' : 'outlined'}
                onClick={() => onSpeedChange(option)}
                size="small"
                disabled={!canInteract}
              />
            </span>
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  );
}
