import { Music, Play, Pause, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Song } from "@shared/schema";

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  isCurrentSong: boolean;
  progress: number;
  isLiked?: boolean;
  onPlayPause: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLikeToggle?: () => void;
}

export function SongCard({
  song,
  isPlaying,
  isCurrentSong,
  progress,
  isLiked = false,
  onPlayPause,
  onProgressClick,
  onLikeToggle,
}: SongCardProps) {
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

  const gradient = song.coverGradient || gradients[song.id % gradients.length];

  return (
    <Card
      className={`p-6 hover-elevate active-elevate-2 transition-all duration-300 ${
        isCurrentSong 
          ? "border-primary shadow-lg shadow-primary/20 bg-primary/5" 
          : "hover:border-primary/50"
      }`}
      data-testid={`card-song-${song.id}`}
    >
      <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
        {/* Album Cover */}
        <div
          className={`w-[60px] h-[60px] rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-300 ${
            isCurrentSong && isPlaying ? "animate-pulse scale-105" : "hover:scale-105"
          }`}
          data-testid={`img-cover-${song.id}`}
        >
          <Music className="w-6 h-6 text-white" />
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-semibold truncate transition-colors ${
              isCurrentSong ? "text-primary" : "text-foreground"
            }`}
            data-testid={`text-title-${song.id}`}
          >
            {song.title}
          </h3>
          <p
            className="text-sm text-muted-foreground truncate"
            data-testid={`text-artist-${song.id}`}
          >
            {song.artist}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Like Button */}
          {onLikeToggle && (
            <Button
              size="icon"
              variant="ghost"
              className={`rounded-full flex-shrink-0 transition-all ${
                isLiked 
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" 
                  : "hover:bg-primary/10"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onLikeToggle();
              }}
              data-testid={`button-like-${song.id}`}
            >
              <Heart 
                className={`w-4 h-4 transition-all ${isLiked ? "fill-current" : ""}`} 
              />
            </Button>
          )}

          {/* Play Button */}
          <Button
            size="icon"
            variant={isPlaying && isCurrentSong ? "default" : "default"}
            className={`rounded-full flex-shrink-0 transition-all ${
              isPlaying && isCurrentSong 
                ? "bg-primary hover:bg-primary/90 scale-110 shadow-lg shadow-primary/50" 
                : "hover:scale-110"
            }`}
            onClick={onPlayPause}
            data-testid={`button-play-${song.id}`}
          >
            {isPlaying && isCurrentSong ? (
              <Pause className="w-4 h-4" data-testid={`icon-pause-${song.id}`} />
            ) : (
              <Play className="w-4 h-4 ml-0.5" data-testid={`icon-play-${song.id}`} />
            )}
          </Button>

          {/* Progress Bar Container */}
          <div className="flex-1 min-w-[120px] md:min-w-[200px]">
            <div
              className={`h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer transition-all ${
                isCurrentSong ? "hover:bg-muted/80" : ""
              }`}
              onClick={onProgressClick}
              data-testid={`progress-bar-${song.id}`}
            >
              <div
                className={`h-full transition-all duration-100 rounded-full ${
                  isCurrentSong 
                    ? "bg-gradient-to-r from-primary to-primary/80 shadow-sm" 
                    : "bg-muted"
                }`}
                style={{ width: `${isCurrentSong ? progress : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span data-testid={`text-current-time-${song.id}`}>
                {isCurrentSong ? formatTime((song.duration * progress) / 100) : "0:00"}
              </span>
              <span data-testid={`text-duration-${song.id}`}>
                {formatTime(song.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}