// app.js

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// -------------------- MUSIC DATA --------------------
// NOTE: file paths are used internally only; the table does NOT display them.
const songs = [
  { file: "assets/songs/song1.mp3", name: "Jawbreak'r",          artist: "Tec-17",         stage: "Released", version: "v1",   releaseDate: "10.07.2024" },
  { file: "assets/songs/song2.mp3", name: "Fumez Tigari",        artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/songs/song3.mp3", name: "Plastic/Consumator",  artist: "Vintage Angels", stage: "Demo",     version: "v0.2", releaseDate: "TBD" },
  { file: "assets/songs/song4.mp3", name: "Sex In Minecraft",    artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/songs/song5.mp3", name: "O zic (IA)",          artist: "Tecu",           stage: "Demo",     version: "v0.5", releaseDate: "TBD" },
  { file: "assets/songs/song6.mp3", name: "Jumatati De Masura",  artist: "Tecu",           stage: "Demo",     version: "v0.4", releaseDate: "TBD" },
  { file: "assets/songs/song7.mp3", name: "Sick bong, dude",     artist: "Moartea",        stage: "Demo",     version: "v0.7", releaseDate: "TBD" },
  { file: "assets/songs/song8.mp3", name: "dezastru",            artist: "Tecu",           stage: "Finished", version: "v1",   releaseDate: "TBD" },
  { file: "assets/songs/song9.mp3", name: "Nu Te Vrem",          artist: "Tecu",           stage: "Demo",     version: "v0.6", releaseDate: "TBD" },
  { file: "assets/songs/song10.mp3", name: "Universal Madness",  artist: "Tec-17",         stage: "Finished", version: "v1",   releaseDate: "TBD" },
];

// -------------------- MUSIC PAGE LOGIC --------------------
const tbodyEl = document.getElementById("songTbody");
const tableEl = document.getElementById("songTable");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");

// Sorting state
let sortKey = "name";
let sortDir = "asc"; // "asc" | "desc"

// Helpers
function normalizeStr(v) {
  return String(v ?? "").trim().toLowerCase();
}

// Parse DD.MM.YYYY -> number timestamp, TBD -> Infinity (so TBD goes last in ascending)
function dateValue(s) {
  const v = normalizeStr(s);
  if (!v || v === "tbd") return Number.POSITIVE_INFINITY;

  const parts = v.split(".");
  if (parts.length !== 3) return Number.POSITIVE_INFINITY;

  const dd = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);
  if (!dd || !mm || !yyyy) return Number.POSITIVE_INFINITY;

  return new Date(yyyy, mm - 1, dd).getTime();
}

function compareSongs(a, b, key) {
  // Special handling for dates
  if (key === "releaseDate") {
    return dateValue(a.releaseDate) - dateValue(b.releaseDate);
  }

  // Version: try numeric compare by stripping leading "v"
  if (key === "version") {
    const av = normalizeStr(a.version).replace(/^v/, "");
    const bv = normalizeStr(b.version).replace(/^v/, "");
    const an = parseFloat(av);
    const bn = parseFloat(bv);
    const bothNums = !Number.isNaN(an) && !Number.isNaN(bn);
    if (bothNums) return an - bn;
    return av.localeCompare(bv);
  }

  // Default string compare
  const as = normalizeStr(a[key]);
  const bs = normalizeStr(b[key]);
  return as.localeCompare(bs);
}

function sortedSongs() {
  const copy = [...songs];
  copy.sort((a, b) => {
    const base = compareSongs(a, b, sortKey);
    return sortDir === "asc" ? base : -base;
  });
  return copy;
}

function setSort(key) {
  if (sortKey === key) {
    sortDir = sortDir === "asc" ? "desc" : "asc";
  } else {
    sortKey = key;
    sortDir = "asc";
  }
  renderSongTable();
  updateSortIcons();
}

function updateSortIcons() {
  if (!tableEl) return;
  const ths = tableEl.querySelectorAll("th.sortable");
  ths.forEach((th) => {
    const icon = th.querySelector(".sortIcon");
    const key = th.getAttribute("data-key");
    if (!icon) return;

    if (key === sortKey) {
      icon.textContent = sortDir === "asc" ? "▲" : "▼";
    } else {
      icon.textContent = "";
    }
  });
}

function playSong(song) {
  if (!audioEl || !nowPlayingEl) return;

  audioEl.src = song.file;
  nowPlayingEl.textContent = `${song.name} • ${song.artist} • ${song.stage} ${song.version} • ${song.releaseDate}`;
  audioEl.play().catch(() => {
    // If autoplay is blocked, user can click play in the audio controls.
  });
}

function renderSongTable() {
  if (!tbodyEl) return;

  const list = sortedSongs();
  tbodyEl.innerHTML = "";

  list.forEach((song) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = song.name;

    const tdArtist = document.createElement("td");
    tdArtist.textContent = song.artist;

    const tdStage = document.createElement("td");
    tdStage.innerHTML = `<span class="badge">${song.stage}</span>`;

    const tdVersion = document.createElement("td");
    tdVersion.textContent = song.version;

    const tdDate = document.createElement("td");
    tdDate.textContent = song.releaseDate;

    const tdPlay = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "playBtn";
    btn.textContent = "Play";
    btn.addEventListener("click", () => playSong(song));
    tdPlay.appendChild(btn);

    tr.appendChild(tdName);
    tr.appendChild(tdArtist);
    tr.appendChild(tdStage);
    tr.appendChild(tdVersion);
    tr.appendChild(tdDate);
    tr.appendChild(tdPlay);

    tbodyEl.appendChild(tr);
  });
}

// Hook header clicks (sorting)
if (tableEl) {
  const sortableHeaders = tableEl.querySelectorAll("th.sortable");
  sortableHeaders.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (key) setSort(key);
    });
  });

  // Initial render
  renderSongTable();
  updateSortIcons();
}

// -------------------- GAMES PAGE (unchanged behavior) --------------------
const howBtn = document.getElementById("howToRunBtn");
const howBox = document.getElementById("howToRun");

if (howBtn && howBox) {
  howBtn.addEventListener("click", () => {
    howBox.classList.toggle("hidden");
  });
}
