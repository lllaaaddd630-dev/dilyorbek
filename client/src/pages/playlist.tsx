import { useState, useRef, useEffect, useCallback } from "react";
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
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [likedSongs, setLikedSongs] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("likedSongs");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shuffleOrderRef = useRef<number[]>([]);

  // Fetch playlist data
  const { data: playlist, isLoading } = useQuery<{ songs: Song[] }>({
    queryKey: ["api/music"],
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

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
    };
  }, []);

  const getNextIndex = useCallback(() => {
    if (songs.length === 0) return null;
    
    if (isShuffle) {
      // Shuffle mode
      if (shuffleOrderRef.current.length === 0 || 
          currentSongIndex === null ||
          !shuffleOrderRef.current.includes(currentSongIndex)) {
        // Generate new shuffle order
        shuffleOrderRef.current = Array.from({ length: songs.length }, (_, i) => i)
          .sort(() => Math.random() - 0.5);
      }
      
      const currentPosition = shuffleOrderRef.current.indexOf(currentSongIndex ?? -1);
      const nextPosition = (currentPosition + 1) % shuffleOrderRef.current.length;
      return shuffleOrderRef.current[nextPosition];
    } else {
      // Normal mode
      return currentSongIndex !== null 
        ? (currentSongIndex + 1) % songs.length
        : 0;
    }
  }, [songs.length, isShuffle, currentSongIndex]);

  const handleNext = useCallback(() => {
    if (repeatMode === "off" && !isShuffle && currentSongIndex !== null && currentSongIndex === songs.length - 1) {
      // Last song and repeat is off
      setIsPlaying(false);
      return;
    }
    
    const nextIndex = getNextIndex();
    if (nextIndex !== null) {
      setCurrentSongIndex(nextIndex);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [repeatMode, isShuffle, currentSongIndex, songs.length, getNextIndex]);

  // Handle song ended with repeat mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === "one") {
        // Repeat one song
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
      } else {
        handleNext();
      }
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [repeatMode, handleNext]);

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

  // Save liked songs to localStorage
  useEffect(() => {
    localStorage.setItem("likedSongs", JSON.stringify(Array.from(likedSongs)));
  }, [likedSongs]);

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

  const getPreviousIndex = () => {
    if (songs.length === 0) return null;
    
    if (isShuffle && shuffleOrderRef.current.length > 0) {
      // Shuffle mode
      const currentPosition = shuffleOrderRef.current.indexOf(currentSongIndex ?? -1);
      const prevPosition = currentPosition === 0 
        ? shuffleOrderRef.current.length - 1 
        : currentPosition - 1;
      return shuffleOrderRef.current[prevPosition];
    } else {
      // Normal mode
      return currentSongIndex !== null
        ? currentSongIndex === 0
          ? songs.length - 1
          : currentSongIndex - 1
        : songs.length - 1;
    }
  };

  const handlePrevious = () => {
    const prevIndex = getPreviousIndex();
    if (prevIndex !== null) {
      setCurrentSongIndex(prevIndex);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const handleShuffleToggle = () => {
    setIsShuffle(!isShuffle);
    // Reset shuffle order when toggling
    shuffleOrderRef.current = [];
  };

  const handleRepeatToggle = () => {
    if (repeatMode === "off") {
      setRepeatMode("all");
    } else if (repeatMode === "all") {
      setRepeatMode("one");
    } else {
      setRepeatMode("off");
    }
  };

  const handleLikeToggle = (songId: number) => {
    setLikedSongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
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
    <div className="min-h-screen bg-background pb-40 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none -z-10 animate-pulse" />
      
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl relative z-10">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-lg animate-pulse">
                <Music className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h1
                className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-chart-2 bg-clip-text text-transparent drop-shadow-sm"
                data-testid="text-page-title"
              >
                My Premium Music Playlist
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
          <p className="text-base md:text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150" data-testid="text-page-subtitle">
            Your Personal Music Collection
          </p>
        </header>

        {/* Song List */}
        <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300" data-testid="container-song-list">
          {songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
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
                isLiked={likedSongs.has(song.id)}
                onPlayPause={() => handlePlayPause(index)}
                onProgressClick={handleSongProgressClick(index)}
                onLikeToggle={() => handleLikeToggle(song.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom Music Player */}
      <div className="fixed bottom-0 left-0 right-0 px-4 md:px-8 pb-4 md:pb-8 pointer-events-none z-50">
        <div className="container mx-auto max-w-6xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          <MusicPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            progress={progress}
            currentTime={currentTime}
            volume={volume}
            isMuted={isMuted}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            onPlayPause={() => handlePlayPause()}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onProgressClick={handleProgressClick}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onShuffleToggle={handleShuffleToggle}
            onRepeatToggle={handleRepeatToggle}
          />
        </div>
      </div>
    </div>
  );
}