// app.js

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==================== MUSIC DATA ====================
const songs = [
  { file: "assets/songs/song1.mp3",  name: "Jawbreak'r",         artist: "Tec-17",         stage: "Released", version: "v1",   releaseDate: "10.07.2024" },
  { file: "assets/songs/song2.mp3",  name: "Fumez Tigari",       artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/songs/song3.mp3",  name: "Plastic/Consumator", artist: "Vintage Angels", stage: "Demo",     version: "v0.2", releaseDate: "TBD" },
  { file: "assets/songs/song4.mp3",  name: "All In Minecraft",   artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/songs/song5.mp3",  name: "O zic (IA)",         artist: "Tecu",           stage: "Demo",     version: "v0.5", releaseDate: "TBD" },
  { file: "assets/songs/song6.mp3",  name: "Jumatati De Masura", artist: "Tecu",           stage: "Demo",     version: "v0.4", releaseDate: "TBD" },
  { file: "assets/songs/song7.mp3",  name: "Sick, dude",    artist: "Moartea",        stage: "Demo",     version: "v0.7", releaseDate: "TBD" },
  { file: "assets/songs/song8.mp3",  name: "dezastru",           artist: "Tecu",           stage: "Finished", version: "v1",   releaseDate: "TBD" },
  { file: "assets/songs/song9.mp3",  name: "Nu Te Vrem",         artist: "Tecu",           stage: "Demo",     version: "v0.6", releaseDate: "TBD" },
  { file: "assets/songs/song10.mp3", name: "Universal Madness",  artist: "Tec-17",         stage: "Finished", version: "v1",   releaseDate: "TBD" },
];

// ==================== ELEMENTS ====================
const tbodyEl = document.getElementById("songTbody");
const tableEl = document.getElementById("songTable");
const tableWrapEl = document.getElementById("tableWrap");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");
const playHintEl = document.getElementById("playHint");

const tableScrollerEl = document.getElementById("tableScroller");
const tableScrollerInnerEl = document.getElementById("tableScrollerInner");

// ==================== STATE ====================
let sortKey = "name";
let sortDir = "asc";
let currentSong = null;

// ==================== HELPERS ====================
function normalizeStr(v){
  return String(v ?? "").trim().toLowerCase();
}

function dateValue(s){
  const v = normalizeStr(s);
  if (!v || v === "tbd") return Number.POSITIVE_INFINITY;
  const [dd, mm, yyyy] = v.split(".").map(Number);
  if (!dd || !mm || !yyyy) return Number.POSITIVE_INFINITY;
  return new Date(yyyy, mm - 1, dd).getTime();
}

function compareSongs(a, b, key){
  if (key === "releaseDate") return dateValue(a.releaseDate) - dateValue(b.releaseDate);
  if (key === "version") {
    const av = parseFloat(a.version.replace("v","")) || 0;
    const bv = parseFloat(b.version.replace("v","")) || 0;
    return av - bv;
  }
  return normalizeStr(a[key]).localeCompare(normalizeStr(b[key]));
}

// ==================== SORTING ====================
function sortedSongs(){
  const copy = [...songs];
  copy.sort((a, b) => {
    const base = compareSongs(a, b, sortKey);
    return sortDir === "asc" ? base : -base;
  });
  return copy;
}

function updateSortIcons(){
  if (!tableEl) return;
  tableEl.querySelectorAll("th.sortable").forEach(th => {
    const icon = th.querySelector(".sortIcon");
    const key = th.dataset.key;
    if (!icon) return;
    icon.textContent = key === sortKey ? (sortDir === "asc" ? "▲" : "▼") : "";
  });
}

function setSort(key){
  if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
  else { sortKey = key; sortDir = "asc"; }
  renderSongTable();
  updateSortIcons();
}

// ==================== PLAYBACK ====================
async function playSong(song){
  if (!audioEl) return;

  const same = currentSong && currentSong.file === song.file;

  if (same){
    if (!audioEl.paused){
      audioEl.pause();
    } else {
      try { await audioEl.play(); } catch {}
    }
    renderSongTable();
    return;
  }

  currentSong = song;
  nowPlayingEl.textContent =
    `${song.name} • ${song.artist} • ${song.stage} ${song.version} • ${song.releaseDate}`;

  playHintEl.classList.add("hidden");

  try{
    audioEl.pause();
    audioEl.src = song.file;   // ✅ CORRECT PATH
    audioEl.load();
    await audioEl.play();
  }catch{
    playHintEl.textContent = "Playback blocked or file missing.";
    playHintEl.classList.remove("hidden");
  }

  renderSongTable();
}

// ==================== TABLE RENDER ====================
function renderSongTable(){
  if (!tbodyEl) return;

  tbodyEl.innerHTML = "";
  sortedSongs().forEach(song => {
    const tr = document.createElement("tr");

    // Play button FIRST
const tdPlay = document.createElement("td");
const btn = document.createElement("button");
const playing = currentSong && currentSong.file === song.file && !audioEl.paused;
btn.textContent = playing ? "Pause" : "Play";
btn.addEventListener("click", () => playSong(song));
tdPlay.appendChild(btn);
tr.appendChild(tdPlay);

// Then song data
["name","artist","stage","version","releaseDate"].forEach(k => {
  const td = document.createElement("td");
  td.textContent = song[k];
  tr.appendChild(td);
});

    tr.appendChild(tdPlay);
    tbodyEl.appendChild(tr);
  });

  syncScrollerSize();
}

// ==================== SCROLLER ====================
function syncScrollerSize(){
  if (!tableEl || !tableWrapEl) return;
  tableScrollerInnerEl.style.width = `${tableEl.scrollWidth}px`;
  tableScrollerEl.style.display =
    tableEl.scrollWidth > tableWrapEl.clientWidth ? "block" : "none";
}

function hookScrollSync(){
  tableScrollerEl.addEventListener("scroll", () => {
    tableWrapEl.scrollLeft = tableScrollerEl.scrollLeft;
  });
  tableWrapEl.addEventListener("scroll", () => {
    tableScrollerEl.scrollLeft = tableWrapEl.scrollLeft;
  });
  window.addEventListener("resize", syncScrollerSize);
}

// ==================== INIT ====================
if (tableEl){
  tableEl.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => setSort(th.dataset.key));
  });
  updateSortIcons();
  hookScrollSync();
  renderSongTable();
}

if (audioEl){
  audioEl.addEventListener("play", renderSongTable);
  audioEl.addEventListener("pause", renderSongTable);
}