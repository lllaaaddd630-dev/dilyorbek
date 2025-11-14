import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music } from "lucide-react";
import { SongCard } from "@/components/SongCard";
import { MusicPlayer } from "@/components/MusicPlayer";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Song } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Playlist() {
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("musicPlayerVolume");
    return saved ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch playlist data
  const { data: playlist, isLoading } = useQuery<{ songs: Song[] }>({
    queryKey: ["/api/playlist"],
  });

  const songs = playlist?.songs || [];
  const currentSong = currentSongIndex !== null ? songs[currentSongIndex] : null;

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, []);

  // Update audio source when song changes
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.src;
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error("Audio file not found or failed to load:", currentSong.src);
          console.info("To enable playback, add your MP3 files to public/music/ and update server/data/songs.json");
          setIsPlaying(false);
        });
      }
    }
  }, [currentSong]);

  // Update audio volume when volume or mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem("musicPlayerVolume", newVolume.toString());
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handlePlayPause = (index?: number) => {
    if (index !== undefined) {
      // Clicked on a song card
      if (currentSongIndex === index) {
        // Same song, toggle play/pause
        if (isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
        } else {
          audioRef.current?.play().catch((err) => {
            console.error("Audio file not found or failed to load");
            console.info("To enable playback, add your MP3 files to public/music/ and update server/data/songs.json");
            setIsPlaying(false);
          });
          setIsPlaying(true);
        }
      } else {
        // Different song, load and play
        setCurrentSongIndex(index);
        setIsPlaying(true);
        setProgress(0);
        setCurrentTime(0);
      }
    } else {
      // Main player play/pause
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (currentSongIndex === null && songs.length > 0) {
          // No song selected, play first song
          setCurrentSongIndex(0);
          setIsPlaying(true);
        } else {
          audioRef.current?.play().catch((err) => {
            console.error("Audio file not found or failed to load");
            console.info("To enable playback, add your MP3 files to public/music/ and update server/data/songs.json");
            setIsPlaying(false);
          });
          setIsPlaying(true);
        }
      }
    }
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    
    const nextIndex = currentSongIndex !== null 
      ? (currentSongIndex + 1) % songs.length
      : 0;
    
    setCurrentSongIndex(nextIndex);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (songs.length === 0) return;
    
    const prevIndex = currentSongIndex !== null
      ? currentSongIndex === 0
        ? songs.length - 1
        : currentSongIndex - 1
      : songs.length - 1;
    
    setCurrentSongIndex(prevIndex);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentSong) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (clickX / width) * 100;
    
    const newTime = (percentage / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(percentage);
  };

  const handleSongProgressClick = (songIndex: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentSongIndex === songIndex) {
      handleProgressClick(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="space-y-4 mb-32">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <h1
                className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-chart-2 bg-clip-text text-transparent"
                data-testid="text-page-title"
              >
                Music Playlist
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
          <p className="text-base md:text-lg text-muted-foreground" data-testid="text-page-subtitle">
            Your Personal Music Collection
          </p>
        </header>

        {/* Song List */}
        <div className="space-y-4 mb-8" data-testid="container-song-list">
          {songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Songs Available
              </h3>
              <p className="text-muted-foreground">
                Add some songs to your playlist to get started
              </p>
            </div>
          ) : (
            songs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                isPlaying={isPlaying && currentSongIndex === index}
                isCurrentSong={currentSongIndex === index}
                progress={currentSongIndex === index ? progress : 0}
                onPlayPause={() => handlePlayPause(index)}
                onProgressClick={handleSongProgressClick(index)}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom Music Player */}
      <div className="fixed bottom-0 left-0 right-0 px-4 md:px-8 pb-4 md:pb-8 pointer-events-none">
        <div className="container mx-auto max-w-6xl pointer-events-auto">
          <MusicPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            progress={progress}
            currentTime={currentTime}
            volume={volume}
            isMuted={isMuted}
            onPlayPause={() => handlePlayPause()}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onProgressClick={handleProgressClick}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
          />
        </div>
      </div>
    </div>
  );
}
