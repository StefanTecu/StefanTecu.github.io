// app.js

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// -------------------- MUSIC DATA --------------------
const songs = [
  { file: "assets/songs/song1.mp3",  name: "Jawbreak'r",         artist: "Tec-17",         stage: "Released", version: "v1",   releaseDate: "10.07.2024" },
  { file: "assets/songs/song2.mp3",  name: "Fumez Tigari",       artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/songs/song3.mp3",  name: "Plastic/Consumator", artist: "Vintage Angels", stage: "Demo",     version: "v0.2", releaseDate: "TBD" },
  { file: "assets/songs/song4.mp3",  name: "Sex In Minecraft",   artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/songs/song5.mp3",  name: "O zic (IA)",         artist: "Tecu",           stage: "Demo",     version: "v0.5", releaseDate: "TBD" },
  { file: "assets/songs/song6.mp3",  name: "Jumatati De Masura", artist: "Tecu",           stage: "Demo",     version: "v0.4", releaseDate: "TBD" },
  { file: "assets/songs/song7.mp3",  name: "Sick bong, dude",    artist: "Moartea",        stage: "Demo",     version: "v0.7", releaseDate: "TBD" },
  { file: "assets/songs/song8.mp3",  name: "dezastru",           artist: "Tecu",           stage: "Finished", version: "v1",   releaseDate: "TBD" },
  { file: "assets/songs/song9.mp3",  name: "Nu Te Vrem",         artist: "Tecu",           stage: "Demo",     version: "v0.6", releaseDate: "TBD" },
  { file: "assets/songs/song10.mp3", name: "Universal Madness",  artist: "Tec-17",         stage: "Finished", version: "v1",   releaseDate: "TBD" },
];

// -------------------- MUSIC PAGE ELEMENTS --------------------
const tbodyEl = document.getElementById("songTbody");
const tableEl = document.getElementById("songTable");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");
const playHintEl = document.getElementById("playHint");
const playerBoxEl = document.getElementById("playerBox");
const swipeHintEl = document.getElementById("swipeHint");

// Top glide bar
const tableWrapEl = document.getElementById("tableWrap");
const tableScrollerEl = document.getElementById("tableScroller");
const tableScrollerInnerEl = document.getElementById("tableScrollerInner");

// Sorting state (load from localStorage)
let sortKey = localStorage.getItem("music_sortKey") || "name";
let sortDir = localStorage.getItem("music_sortDir") || "asc"; // "asc" | "desc"

// Playing state
let currentFile = null; // string
let isPlaying = false;

// -------------------- HELPERS --------------------
function normalizeStr(v) {
  return String(v ?? "").trim().toLowerCase();
}

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
  if (key === "releaseDate") return dateValue(a.releaseDate) - dateValue(b.releaseDate);

  if (key === "version") {
    const av = normalizeStr(a.version).replace(/^v/, "");
    const bv = normalizeStr(b.version).replace(/^v/, "");
    const an = parseFloat(av);
    const bn = parseFloat(bv);
    const bothNums = !Number.isNaN(an) && !Number.isNaN(bn);
    if (bothNums) return an - bn;
    return av.localeCompare(bv);
  }

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

function persistSort() {
  localStorage.setItem("music_sortKey", sortKey);
  localStorage.setItem("music_sortDir", sortDir);
}

function setSort(key) {
  if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
  else { sortKey = key; sortDir = "asc"; }

  persistSort();
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

    if (key === sortKey) icon.textContent = sortDir === "asc" ? "▲" : "▼";
    else icon.textContent = "";
  });
}

function isMobileWidth() {
  return window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
}

function scrollToPlayerIfMobile() {
  if (!playerBoxEl) return;
  if (!isMobileWidth()) return;
  playerBoxEl.scrollIntoView({ behavior: "smooth", block: "end" });
}

// -------------------- PLAY / PAUSE TOGGLE --------------------
async function playOrToggle(song) {
  if (!audioEl || !nowPlayingEl) return;

  if (playHintEl) playHintEl.classList.add("hidden");

  // If clicking the same currently playing song -> toggle pause/play
  if (currentFile === song.file) {
    if (!audioEl.paused) {
      audioEl.pause();
      isPlaying = false;
      renderSongTable();
      return;
    } else {
      try {
        await audioEl.play();
        isPlaying = true;
        renderSongTable();
        scrollToPlayerIfMobile();
        return;
      } catch {
        if (playHintEl) playHintEl.classList.remove("hidden");
        return;
      }
    }
  }

  // New song
  currentFile = song.file;
  isPlaying = true;

  nowPlayingEl.textContent = `${song.name} • ${song.artist} • ${song.stage} ${song.version} • ${song.releaseDate}`;

  try {
    audioEl.pause();
    audioEl.src = song.file;
    audioEl.load();
    await new Promise((r) => requestAnimationFrame(r));
    await audioEl.play();
    isPlaying = true;
    renderSongTable();
    scrollToPlayerIfMobile();
  } catch {
    isPlaying = false;
    renderSongTable();
    if (playHintEl) playHintEl.classList.remove("hidden");
  }
}

// Keep UI accurate if user uses the audio controls
if (audioEl) {
  audioEl.addEventListener("play", () => { isPlaying = true; renderSongTable(); });
  audioEl.addEventListener("pause", () => { isPlaying = false; renderSongTable(); });
  audioEl.addEventListener("ended", () => { isPlaying = false; renderSongTable(); });
}

// -------------------- TABLE RENDER + PLAYING HIGHLIGHT --------------------
function renderSongTable() {
  if (!tbodyEl) return;

  const list = sortedSongs();
  tbodyEl.innerHTML = "";

  list.forEach((song) => {
    const tr = document.createElement("tr");
    tr.dataset.file = song.file;

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

    const rowIsCurrent = currentFile === song.file;
    if (rowIsCurrent) tr.classList.add("playing");
    btn.textContent = rowIsCurrent && isPlaying ? "Pause" : "Play";

    btn.addEventListener("click", () => playOrToggle(song));
    tdPlay.appendChild(btn);

    tr.appendChild(tdName);
    tr.appendChild(tdArtist);
    tr.appendChild(tdStage);
    tr.appendChild(tdVersion);
    tr.appendChild(tdDate);
    tr.appendChild(tdPlay);

    tbodyEl.appendChild(tr);
  });

  syncScrollerSize();
}

// -------------------- TOP GLIDE BAR (SCROLL SYNC) --------------------
let syncingFromTop = false;
let syncingFromTable = false;

function syncScrollerSize() {
  if (!tableEl || !tableWrapEl || !tableScrollerInnerEl || !tableScrollerEl) return;

  const tableWidth = tableEl.scrollWidth;
  tableScrollerInnerEl.style.width = `${tableWidth}px`;

  const needs = tableWidth > tableWrapEl.clientWidth + 2;
  tableScrollerEl.classList.toggle("hidden", !needs);
}

function hookScrollSync() {
  if (!tableWrapEl || !tableScrollerEl) return;

  tableScrollerEl.addEventListener("scroll", () => {
    if (syncingFromTable) return;
    syncingFromTop = true;
    tableWrapEl.scrollLeft = tableScrollerEl.scrollLeft;
    syncingFromTop = false;
  });

  tableWrapEl.addEventListener("scroll", () => {
    if (syncingFromTop) return;
    syncingFromTable = true;
    tableScrollerEl.scrollLeft = tableWrapEl.scrollLeft;
    syncingFromTable = false;
  });

  window.addEventListener("resize", syncScrollerSize);
}

// -------------------- SWIPE HINT (HIDE AFTER FIRST SCROLL) --------------------
function initSwipeHint() {
  if (!swipeHintEl || !tableWrapEl) return;

  const hiddenAlready = localStorage.getItem("music_swipeHintHidden") === "1";
  if (hiddenAlready) {
    swipeHintEl.classList.add("hidden");
    return;
  }

  const hide = () => {
    swipeHintEl.classList.add("hidden");
    localStorage.setItem("music_swipeHintHidden", "1");
    tableWrapEl.removeEventListener("scroll", hideOnce);
  };

  const hideOnce = () => hide();
  tableWrapEl.addEventListener("scroll", hideOnce, { passive: true });
}

// -------------------- INIT (MUSIC PAGE) --------------------
if (tableEl) {
  const sortableHeaders = tableEl.querySelectorAll("th.sortable");
  sortableHeaders.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (key) setSort(key);
    });
  });

  renderSongTable();
  updateSortIcons();
  hookScrollSync();
  initSwipeHint();
}

// -------------------- GAMES PAGE: COPY DOWNLOAD LINK BUTTON --------------------
(function initCopyDownload() {
  const btn = document.getElementById("copyDownloadBtn");
  const status = document.getElementById("copyStatus");
  if (!btn) return;

  const url = btn.getAttribute("data-copy") || "";
  const showStatus = (text) => {
    if (!status) return;
    status.textContent = text;
    status.classList.remove("hidden");
    setTimeout(() => status.classList.add("hidden"), 1400);
  };

  btn.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showStatus("Copied!");
      } else {
        // Fallback
        window.prompt("Copy this link:", url);
      }
    } catch {
      window.prompt("Copy this link:", url);
    }
  });
})();

// -------------------- GAMES PAGE (how-to-run toggle) --------------------
const howBtn = document.getElementById("howToRunBtn");
const howBox = document.getElementById("howToRun");

if (howBtn && howBox) {
  howBtn.addEventListener("click", () => {
    howBox.classList.toggle("hidden");
  });
}
