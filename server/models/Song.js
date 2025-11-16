const fs = require('fs');
const path = require('path');
const { parseFile } = require('music-metadata');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for songs
let songs = [];
let isInitialized = false;

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to get cover image path
const getCoverPath = (songId, musicDir) => {
  const coverPath = path.join(musicDir, '..', 'covers', `cover${songId}.jpg`);
  if (fs.existsSync(coverPath)) {
    return `/public/covers/cover${songId}.jpg`;
  }
  // Return default gradient-based cover
  return null;
};

// Extract metadata from MP3 file
const extractMetadata = async (filePath) => {
  try {
    const metadata = await parseFile(filePath);
    const duration = metadata.format.duration || 0;
    const title = metadata.common.title || path.basename(filePath, '.mp3');
    const artist = metadata.common.artist || metadata.common.albumArtist || 'Unknown Artist';
    
    return {
      title,
      artist,
      duration: formatDuration(duration),
      durationSeconds: duration
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error.message);
    const fileName = path.basename(filePath, '.mp3');
    return {
      title: fileName,
      artist: 'Unknown Artist',
      duration: '0:00',
      durationSeconds: 0
    };
  }
};

// Scan music directory and load all songs
const scanMusicDirectory = async () => {
  const musicDir = path.join(__dirname, '..', 'public', 'music');
  const coversDir = path.join(__dirname, '..', 'public', 'covers');
  
  // Ensure directories exist
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
  }
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  const files = fs.readdirSync(musicDir).filter(file => 
    file.toLowerCase().endsWith('.mp3')
  );

  const loadedSongs = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(musicDir, file);
    const songId = (i + 1).toString();
    
    try {
      const metadata = await extractMetadata(filePath);
      const coverUrl = getCoverPath(songId, musicDir);
      
      const song = {
        id: songId,
        title: metadata.title,
        artist: metadata.artist,
        duration: metadata.duration,
        durationSeconds: metadata.durationSeconds,
        fileUrl: `/public/music/${file}`,
        coverUrl: coverUrl || `/public/covers/cover${songId}.jpg`,
        addedAt: fs.statSync(filePath).mtime,
    listenCount: 0
      };

      loadedSongs.push(song);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  // Sort by filename/number to maintain order
  loadedSongs.sort((a, b) => {
    const aNum = parseInt(a.id) || 0;
    const bNum = parseInt(b.id) || 0;
    return aNum - bNum;
  });

  return loadedSongs;
};

// Initialize songs from directory
const initializeSongs = async () => {
  if (isInitialized) return;
  
  try {
    songs = await scanMusicDirectory();
    isInitialized = true;
    console.log(`Loaded ${songs.length} songs from music directory`);
  } catch (error) {
    console.error('Error initializing songs:', error);
    songs = [];
  }
};

// Auto-sync: Check for new files periodically
let syncInterval = null;

const startAutoSync = (intervalMs = 60000) => {
  if (syncInterval) return;
  
  syncInterval = setInterval(async () => {
    try {
      const currentSongs = await scanMusicDirectory();
      const currentIds = new Set(songs.map(s => s.id));
      const newSongs = currentSongs.filter(s => !currentIds.has(s.id));
      
      if (newSongs.length > 0) {
        songs.push(...newSongs);
        console.log(`Auto-sync: Added ${newSongs.length} new song(s)`);
      }
    } catch (error) {
      console.error('Error in auto-sync:', error);
    }
  }, intervalMs);
  
  console.log('Auto-sync started');
};

const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Auto-sync stopped');
  }
};

// Function to get all songs
const getAllSongs = async () => {
  await initializeSongs();
  return songs;
};

// Function to get song by ID
const getSongById = async (id) => {
  await initializeSongs();
  return songs.find(song => song.id === id || song.id === id.toString());
};

// Function to add a new song
const addSong = (song) => {
  songs.push(song);
};

// Function to update listen count
const incrementListenCount = async (id) => {
  await initializeSongs();
  const song = songs.find(song => song.id === id || song.id === id.toString());
  if (song) {
    song.listenCount = (song.listenCount || 0) + 1;
    return song;
  }
  return null;
};

// Manual sync function
const syncSongs = async () => {
  isInitialized = false;
  await initializeSongs();
  return songs;
};

module.exports = {
  getAllSongs,
  getSongById,
  addSong,
  incrementListenCount,
  initializeSongs,
  syncSongs,
  startAutoSync,
  stopAutoSync
};
