import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Box, Button, Slider, Stack, Typography } from "@mui/material";

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

  const togglePlayPause = () => {
    if (!waveRef.current) return;
    waveRef.current.playPause();
    setIsPlaying(waveRef.current.isPlaying());
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

      <Stack direction="row" spacing={2} alignItems="center" mt={1}>
        <Button variant="contained" size="small" onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button variant="outlined" size="small" onClick={stopPlayback}>
          Stop
        </Button>
        <Typography fontSize="0.85rem" color="text.secondary">
          {formatTime(progress)} / {formatTime(duration)}
        </Typography>
      </Stack>
    </Box>
  );
};

export default AudioWaveform;
