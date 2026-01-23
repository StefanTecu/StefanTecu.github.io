// app.js

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==================== CONFIG ====================
// Try these folders in order. This solves your assets/music vs assets/songs mismatch.
const MUSIC_DIR_CANDIDATES = [
  "assets/music/",
  "assets/songs/",
];

// ==================== MUSIC DATA ====================
const songMeta = [
  { n: 1,  name: "Jawbreak'r",         artist: "Tec-17",         stage: "Released", version: "v1",   releaseDate: "10.07.2024" },
  { n: 2,  name: "Fumez Tigari",       artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { n: 3,  name: "Plastic/Consumator", artist: "Vintage Angels", stage: "Demo",     version: "v0.2", releaseDate: "TBD" },
  { n: 4,  name: "Sex In Minecraft",   artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { n: 5,  name: "O zic (IA)",         artist: "Tecu",           stage: "Demo",     version: "v0.5", releaseDate: "TBD" },
  { n: 6,  name: "Jumatati De Masura", artist: "Tecu",           stage: "Demo",     version: "v0.4", releaseDate: "TBD" },
  { n: 7,  name: "Sick bong, dude",    artist: "Moartea",        stage: "Demo",     version: "v0.7", releaseDate: "TBD" },
  { n: 8,  name: "dezastru",           artist: "Tecu",           stage: "Finished", version: "v1",   releaseDate: "TBD" },
  { n: 9,  name: "Nu Te Vrem",         artist: "Tecu",           stage: "Demo",     version: "v0.6", releaseDate: "TBD" },
  { n: 10, name: "Universal Madness",  artist: "Tec-17",         stage: "Finished", version: "v1",   releaseDate: "TBD" },
];

// We store file as just "songX.mp3" and resolve full path at play time.
const songs = songMeta.map(s => ({
  fileName: `song${s.n}.mp3`,
  ...s
}));

// ==================== ELEMENTS (Music) ====================
const tbodyEl = document.getElementById("songTbody");
const tableEl = document.getElementById("songTable");
const tableWrapEl = document.getElementById("tableWrap");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");
const playHintEl = document.getElementById("playHint");

// Glide bar elements
const tableScrollerEl = document.getElementById("tableScroller");
const tableScrollerInnerEl = document.getElementById("tableScrollerInner");

// ==================== STATE ====================
let sortKey = "name";
let sortDir = "asc";
let current = null;

// Cache which dir works once we detect it
let workingMusicDir = null;

// ==================== HELPERS ====================