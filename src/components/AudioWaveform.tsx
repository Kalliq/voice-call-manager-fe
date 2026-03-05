import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Box, IconButton, Slider, Stack, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Pause, Stop } from "@mui/icons-material";

import cfg from "../config";

interface AudioWaveformProps {
  url: string;
  height?: number;
  color?: string;
  progressColor?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const AudioWaveform = ({
  url,
  height = 64,
  color = "#ccc",
  progressColor = "#4caf50",
}: AudioWaveformProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const wave = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor,
      height,
      barWidth: 2,
      barGap: 2,
      normalize: true,
    });

    waveRef.current = wave;

    wave.load(`${cfg.backendUrl}${url}`);

    wave.on("ready", () => {
      setDuration(wave.getDuration());
    });

    wave.on("audioprocess", () => {
      setProgress(wave.getCurrentTime());
    });

    wave.on("interaction-complete" as any, () => {
      setProgress(wave.getCurrentTime());
    });

    wave.on("finish", () => {
      setIsPlaying(false);
      setProgress(duration);
    });

    return () => {
      wave.destroy();
    };
  }, [url]);

  const play = () => {
    if (!waveRef.current) return;
    waveRef.current.play();
    setIsPlaying(true);
  };

  const pause = () => {
    if (!waveRef.current) return;
    waveRef.current.pause();
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    if (!waveRef.current) return;
    waveRef.current.stop();
    setIsPlaying(false);
    setProgress(0);
  };

  const onSeek = (_: Event, newValue: number | number[]) => {
    if (!waveRef.current || typeof newValue !== "number") return;
    waveRef.current.seekTo(newValue / duration);
    setProgress(newValue);
  };

  return (
    <Box>
      <Box ref={containerRef} sx={{ width: "100%", mb: 1 }} />

      <Slider
        size="small"
        min={0}
        max={duration}
        step={0.1}
        value={progress}
        onChange={onSeek}
        aria-label="Playback position"
      />

      <Stack direction="row" spacing={0.5} alignItems="center" mt={1}>
        <Tooltip title="Play">
          <span>
            <IconButton size="small" onClick={play} disabled={isPlaying} color="primary">
              <PlayArrow />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Pause">
          <span>
            <IconButton size="small" onClick={pause} disabled={!isPlaying} color="primary">
              <Pause />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Stop">
          <IconButton size="small" onClick={stopPlayback} color="primary">
            <Stop />
          </IconButton>
        </Tooltip>
        <Typography fontSize="0.85rem" color="text.secondary" sx={{ ml: 1 }}>
          {formatTime(progress)} / {formatTime(duration)}
        </Typography>
      </Stack>
    </Box>
  );
};

export default AudioWaveform;
