# Music Player Setup Instructions

## Running the Application

1. **Start the Backend Server:**
   ```bash
   npm start
   ```
   The backend will run on port 5000.

2. **Start the Frontend Client:**
   ```bash
   npx vite --config vite.config.ts
   ```
   The frontend will run on port 5173.

3. **Access the Applications:**
   - Main website: Open `index.html` in your browser
   - React music player: http://localhost:5173/playlist
   - Standalone music player: Open `music.html` in your browser

## API Endpoints

The backend provides the following endpoints:

- `GET http://localhost:5000/api/music` - Get all songs
- `GET http://localhost:5000/api/music/:id` - Get a specific song
- `GET http://localhost:5000/api/music/stream/:id` - Stream audio file
- `GET http://localhost:5000/api/music/cover/:id` - Get cover image
- `PATCH http://localhost:5000/api/music/listen/:id` - Increment listen count

## File Structure

```
/server
  app.js              # Main server file
  /routes
    music.js          # Music routes
  /controllers
    musicController.js # Music controller functions
  /models
    Song.js           # Song model and storage
  /public
    /music            # MP3 files
    /covers           # Cover images
  /temp               # Temporary upload directory
```

## Adding Your Own Music

1. Place your MP3 files in `server/public/music/`
2. Place your cover images in `server/public/covers/`
3. Update the song data in `server/models/Song.js` to include your songs

## Troubleshooting

If you encounter any issues:

1. Make sure no other processes are using ports 5000 or 5173
2. Restart both the backend and frontend servers
3. Check that all dependencies are installed with `npm install`