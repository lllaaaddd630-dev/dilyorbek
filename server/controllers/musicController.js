const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getAllSongs, getSongById, addSong, incrementListenCount, syncSongs } = require('../models/Song');

// Get all songs
const getAllSongsController = async (req, res) => {
  try {
    const songs = await getAllSongs();
    // Return in the format expected by the frontend
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get song by ID
const getSongByIdController = async (req, res) => {
  try {
    const song = await getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stream song with proper Range header support
const streamSong = async (req, res) => {
  try {
    const song = await getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Extract filename from fileUrl
    const fileName = path.basename(song.fileUrl);
    const filePath = path.join(__dirname, '..', 'public', 'music', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set headers for caching
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      // Validate range
      if (start >= fileSize || end >= fileSize) {
        res.status(416).json({ message: 'Range Not Satisfiable' });
        return;
      }
      
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000'
      });
      
      file.pipe(res);
    } else {
      // Full file stream
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get cover image
const getCoverImage = async (req, res) => {
  try {
    const song = await getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const coverFileName = path.basename(song.coverUrl);
    const coverPath = path.join(__dirname, '..', 'public', 'covers', coverFileName);
    
    if (!fs.existsSync(coverPath)) {
      // Return a default placeholder or 404
      return res.status(404).json({ message: 'Cover not found' });
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(coverPath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload song (optional)
const uploadSong = (req, res) => {
  try {
    if (!req.files || !req.files.audio || !req.files.cover) {
      return res.status(400).json({ message: 'Audio file and cover image are required' });
    }

    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover[0];

    // Generate ID
    const id = uuidv4();

    // Save files
    const audioFileName = `${id}.mp3`;
    const coverFileName = `${id}.jpg`;
    
    const audioPath = path.join(__dirname, '..', 'public', 'music', audioFileName);
    const coverPath = path.join(__dirname, '..', 'public', 'covers', coverFileName);
    
    fs.renameSync(audioFile.path, audioPath);
    fs.renameSync(coverFile.path, coverPath);

    // Create song record
    const song = {
      id,
      title: req.body.title || 'Unknown Title',
      artist: req.body.artist || 'Unknown Artist',
      duration: '0:00', // Placeholder
      fileUrl: `/public/music/${audioFileName}`,
      coverUrl: `/public/covers/${coverFileName}`,
      addedAt: new Date(),
      listenCount: 0
    };

    addSong(song);
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get random song
const getRandomSong = async (req, res) => {
  try {
    const songs = await getAllSongs();
    if (songs.length === 0) {
      return res.status(404).json({ message: 'No songs available' });
    }
    const randomIndex = Math.floor(Math.random() * songs.length);
    res.json(songs[randomIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search songs
const searchSongs = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }
    
    const songs = await getAllSongs();
    const filteredSongs = songs.filter(song => 
      song.title.toLowerCase().includes(query.toLowerCase()) || 
      song.artist.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(filteredSongs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get latest songs
const getLatestSongs = async (req, res) => {
  try {
    const songs = await getAllSongs();
    const sortedSongs = [...songs].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    res.json(sortedSongs.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top songs by listen count
const getTopSongs = async (req, res) => {
  try {
    const songs = await getAllSongs();
    const sortedSongs = [...songs].sort((a, b) => (b.listenCount || 0) - (a.listenCount || 0));
    res.json(sortedSongs.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Increment listen count
const incrementListenCountController = async (req, res) => {
  try {
    const song = await incrementListenCount(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync songs manually
const syncSongsController = async (req, res) => {
  try {
    const songs = await syncSongs();
    res.json({ 
      message: 'Songs synced successfully',
      count: songs.length,
      songs 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate API documentation
const getApiDocs = (req, res) => {
  const docs = {
    info: {
      title: "Dilyorbek Music API",
      version: "1.0.0",
      description: "Spotify-style backend with full media support"
    },
    endpoints: {
      "GET /api/music": "Get all songs with metadata",
      "GET /api/music/:id": "Get single song info",
      "GET /api/music/stream/:id": "Stream audio file with range support",
      "GET /api/music/cover/:id": "Get cover image",
      "POST /api/music/upload": "Upload new song (mp3 + cover)",
      "GET /api/music/random": "Get random track",
      "GET /api/music/search?q=": "Search by title or artist",
      "GET /api/music/latest": "Get latest added songs",
      "GET /api/music/top": "Get top songs by listen count",
      "GET /api/music/sync": "Manually sync songs from music directory",
      "PATCH /api/music/listen/:id": "Increment listen count"
    },
    schemas: {
      Song: {
        id: "string",
        title: "string",
        artist: "string",
        duration: "string",
        fileUrl: "string",
        coverUrl: "string",
        addedAt: "date",
        listenCount: "number"
      }
    },
    examples: {
      song: {
        id: "001",
        title: "Night Changes",
        artist: "One Direction",
        cover: "/covers/night.jpg",
        src: "/stream/night-changes",
        duration: "03:46"
      }
    }
  };
  
  res.json(docs);
};

module.exports = {
  getAllSongs: getAllSongsController,
  getSongById: getSongByIdController,
  streamSong,
  getCoverImage,
  uploadSong,
  getRandomSong,
  searchSongs,
  getLatestSongs,
  getTopSongs,
  incrementListenCount: incrementListenCountController,
  syncSongs: syncSongsController,
  getApiDocs
};