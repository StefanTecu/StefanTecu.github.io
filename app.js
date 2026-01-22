// app.js

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- MUSIC PAGE ----
const songs = [
  { title: "Song 1", file: "assets/songs/song1.mp3" },
  { title: "Song 2", file: "assets/songs/song2.mp3" },
  // Add more:
  // { title: "My Track", file: "assets/songs/my-track.mp3" },
];

const songListEl = document.getElementById("songList");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");

function playSong(song) {
  if (!audioEl || !nowPlayingEl) return;
  audioEl.src = song.file;
  nowPlayingEl.textContent = song.title;
  audioEl.play().catch(() => {
    // Autoplay can be blocked until user interacts; button click should allow it.
  });
}

if (songListEl) {
  songListEl.innerHTML = "";

  songs.forEach((song) => {
    const row = document.createElement("div");
    row.className = "song";

    const left = document.createElement("div");
    left.innerHTML = `<b>${song.title}</b><div class="muted" style="font-size:12px">${song.file}</div>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Play";
    btn.addEventListener("click", () => playSong(song));

    row.appendChild(left);
    row.appendChild(btn);
    songListEl.appendChild(row);
  });
}

// ---- GAMES PAGE ----
const howBtn = document.getElementById("howToRunBtn");
const howBox = document.getElementById("howToRun");

if (howBtn && howBox) {
  howBtn.addEventListener("click", () => {
    howBox.classList.toggle("hidden");
  });
}
