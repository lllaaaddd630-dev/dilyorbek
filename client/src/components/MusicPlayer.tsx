import { Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { Song } from "@shared/schema";

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
}

export function MusicPlayer({
  currentSong,
  isPlaying,
  progress,
  currentTime,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  onPlayPause,
  onNext,
  onPrevious,
  onProgressClick,
  onVolumeChange,
  onMuteToggle,
  onShuffleToggle,
  onRepeatToggle,
}: MusicPlayerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-yellow-500 to-orange-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-green-500",
  ];

  const gradient = currentSong
    ? currentSong.coverGradient || gradients[currentSong.id % gradients.length]
    : gradients[0];

  return (
    <Card className="sticky bottom-4 md:bottom-8 p-6 md:p-8 backdrop-blur-xl bg-card/95 border-2 shadow-xl">
      {/* Current Song Info */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-20 h-20 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
          data-testid="img-player-cover"
        >
          <Music className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className="text-xl md:text-2xl font-bold text-foreground truncate"
            data-testid="text-player-title"
          >
            {currentSong ? currentSong.title : "Select a song"}
          </h2>
          <p
            className="text-sm md:text-base text-muted-foreground truncate"
            data-testid="text-player-artist"
          >
            {currentSong ? currentSong.artist : "No song playing"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
        <Button
          size="icon"
          variant={isShuffle ? "default" : "ghost"}
          className={`rounded-full transition-all ${
            isShuffle 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "hover:bg-primary/10"
          }`}
          onClick={onShuffleToggle}
          disabled={!currentSong}
          data-testid="button-shuffle"
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className="rounded-full hover:bg-primary/10 transition-colors"
          onClick={onPrevious}
          disabled={!currentSong}
          data-testid="button-previous"
        >
          <SkipBack className="w-6 h-6" />
        </Button>

        <Button
          size="lg"
          variant="default"
          className="rounded-full min-h-16 min-w-16 hover:scale-105 transition-transform shadow-lg active:scale-95"
          onClick={onPlayPause}
          disabled={!currentSong}
          data-testid="button-main-play-pause"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7" data-testid="icon-pause" />
          ) : (
            <Play className="w-7 h-7 ml-1" data-testid="icon-play" />
          )}
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className="rounded-full hover:bg-primary/10 transition-colors"
          onClick={onNext}
          disabled={!currentSong}
          data-testid="button-next"
        >
          <SkipForward className="w-6 h-6" />
        </Button>

        <Button
          size="icon"
          variant={repeatMode !== "off" ? "default" : "ghost"}
          className={`rounded-full transition-all ${
            repeatMode !== "off"
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "hover:bg-primary/10"
          }`}
          onClick={onRepeatToggle}
          disabled={!currentSong}
          data-testid="button-repeat"
          title={repeatMode === "one" ? "Repeat One" : repeatMode === "all" ? "Repeat All" : "Repeat Off"}
        >
          {repeatMode === "one" ? (
            <Repeat1 className="w-5 h-5" />
          ) : (
            <Repeat className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          className="h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onProgressClick}
          data-testid="progress-bar-main"
        >
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
            data-testid="progress-bar-main-fill"
          />
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground gap-4 flex-wrap md:flex-nowrap">
          <span data-testid="text-player-current-time" className="flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          
          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 max-w-[200px] min-w-[120px]">
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0 hover:bg-primary/10 transition-colors"
              onClick={onMuteToggle}
              data-testid="button-mute-toggle"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" data-testid="icon-volume-muted" />
              ) : (
                <Volume2 className="w-4 h-4" data-testid="icon-volume-on" />
              )}
            </Button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(values) => onVolumeChange(values[0] / 100)}
              className="flex-1"
              data-testid="slider-volume"
            />
          </div>
          
          <span data-testid="text-player-duration" className="flex-shrink-0">
            {currentSong ? formatTime(currentSong.duration) : "0:00"}
          </span>
        </div>
      </div>
    </Card>
  );
}