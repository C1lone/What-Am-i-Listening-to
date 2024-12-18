const CLIENT_ID = '65314a2af1364abebdfc58c4094b76eb';
const REDIRECT_URI = 'https://c1lone.github.io/What-Am-i-Listening-to/'; // Updated URL
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = [
  'user-read-recently-played',
  'user-read-playback-position',
  'user-read-currently-playing',
  'user-read-playback-state'
];

let currentSongId = null;
let songDuration = 0;
let recentSkips = JSON.parse(localStorage.getItem('recentSkips')) || []; // Load recent skips from localStorage
const maxSkippedSongs = 5;

// Check if the user has an access token saved
let accessToken = localStorage.getItem('accessToken') || ''; // Retrieve the access token from localStorage

// If there's an access token, fetch data
if (accessToken) {
  fetchCurrentlyPlaying(accessToken);
  setInterval(() => fetchCurrentlyPlaying(accessToken), 1000);
} else {
  // If there's no access token, check the URL for a new token
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    accessToken = params.get('access_token');
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken); // Store token for later use
      fetchCurrentlyPlaying(accessToken);
      setInterval(() => fetchCurrentlyPlaying(accessToken), 1000);
      window.location.hash = ''; // Clean URL by removing access token
    }
  } else {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${SCOPES.join('%20')}`;
    window.location = authUrl;
  }
}

async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.item) {
      const newSongId = data.item.id;
      const progressMs = data.progress_ms;

      if (newSongId !== currentSongId && currentSongId !== null) {
        addSkippedSong(data.item);
      }

      currentSongId = newSongId;

      updateCurrentSong(data.item, progressMs);
    }
  } catch (error) {
    console.error(error);
  }
}

function updateCurrentSong(song, progressMs) {
  const songName = song.name;
  const artist = song.artists[0].name;
  const albumName = song.album.name;
  const albumCover = song.album.images[0].url;

  document.getElementById('current-song').textContent = songName;
  document.getElementById('current-artist').textContent = `Artist: ${artist}`;
  document.getElementById('current-album').textContent = `Album: ${albumName}`;
  document.getElementById('album-image').src = albumCover;

  syncProgressBar(progressMs, song.duration_ms);
}

function addSkippedSong(song) {
  const songData = {
    name: song.name,
    artist: song.artists[0].name,
    albumCover: song.album.images[0].url
