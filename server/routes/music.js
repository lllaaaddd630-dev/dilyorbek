const express = require('express');
const multer = require('multer');
const {
  getAllSongs,
  getSongById,
  streamSong,
  getCoverImage,
  uploadSong,
  getRandomSong,
  searchSongs,
  getLatestSongs,
  getTopSongs,
  incrementListenCount,
  syncSongs,
  getApiDocs
} = require('../controllers/musicController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes - ORDER MATTERS! Specific routes before parameterized ones
router.get('/docs', getApiDocs);
router.get('/sync', syncSongs);
router.get('/random', getRandomSong);
router.get('/search', searchSongs);
router.get('/latest', getLatestSongs);
router.get('/top', getTopSongs);
router.get('/stream/:id', streamSong);
router.get('/cover/:id', getCoverImage);
router.patch('/listen/:id', incrementListenCount);
router.get('/:id', getSongById);
router.post('/upload', upload.fields([{ name: 'audio' }, { name: 'cover' }]), uploadSong);
router.get('/', getAllSongs);

module.exports = router;