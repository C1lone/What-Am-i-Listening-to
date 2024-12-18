const CLIENT_ID = '65314a2af1364abebdfc58c4094b76eb';
const REDIRECT_URI = 'https://c1lone.github.io/What-Am-i-Listening-to/'; // Replace with your GitHub Pages URL
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = [
  'user-read-recently-played',
  'user-read-playback-position',
  'user-read-currently-playing',
  'user-read-playback-state'
];

let currentSongId = null;
let songDuration = 0;
let recentSkips = [];
const maxSkippedSongs = 5;

const hash = window.location.hash;
let accessToken = '';

if (hash) {
  const params = new URLSearchParams(hash.substring(1));
  accessToken = params.get('access_token');
  window.history.replaceState({}, document.title, REDIRECT_URI);

  fetchCurrentlyPlaying(accessToken);
  setInterval(() => fetchCurrentlyPlaying(accessToken), 1000);
} else {
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${SCOPES.join('%20')}`;
  window.location = authUrl;
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
  };

  recentSkips.unshift(songData);
  if (recentSkips.length > maxSkippedSongs) {
    recentSkips.pop();
  }

  renderSkippedSongs();
}

function renderSkippedSongs() {
  const recentSkippedList = document.getElementById('recent-skipped-list');
  recentSkippedList.innerHTML = '';

  recentSkips.forEach(song => {
    const skipItem = document.createElement('div');
    skipItem.classList.add('skip-item');

    skipItem.innerHTML = `
      <img src="${song.albumCover}" alt="Album Cover">
      <p>${song.name} - ${song.artist}</p>
    `;

    recentSkippedList.appendChild(skipItem);
  });
}

function syncProgressBar(currentMs, durationMs) {
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressTime = document.getElementById('progress-time');

  const progressPercentage = (currentMs / durationMs) * 100;
  progressBarFill.style.width = `${progressPercentage}%`;

  const elapsedMinutes = Math.floor(currentMs / 60000);
  const elapsedSeconds = Math.floor((currentMs % 60000) / 1000);
  const formattedElapsedTime = `${elapsedMinutes}:${elapsedSeconds < 10 ? '0' : ''}${elapsedSeconds}`;

  const totalMinutes = Math.floor(durationMs / 60000);
  const totalSeconds = Math.floor((durationMs % 60000) / 1000);
  const formattedTotalTime = `${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;

  progressTime.textContent = `${formattedElapsedTime} | ${formattedTotalTime}`;
}
