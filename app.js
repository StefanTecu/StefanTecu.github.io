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

// -------------------- ELEMENTS (Music) --------------------
const tbodyEl = document.getElementById("songTbody");
const tableEl = document.getElementById("songTable");
const tableWrapEl = document.getElementById("tableWrap");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");
const playHintEl = document.getElementById("playHint");
const playerBoxEl = document.getElementById("playerBox");
const swipeHintEl = document.getElementById("swipeHint");

const searchEl = document.getElementById("songSearch");
const shuffleEl = document.getElementById("shuffleToggle");
const chipEls = document.querySelectorAll(".chip");

const timeNowEl = document.getElementById("timeNow");
const timeTotalEl = document.getElementById("timeTotal");

// Glide bar
const tableScrollerEl = document.getElementById("tableScroller");
const tableScrollerInnerEl = document.getElementById("tableScrollerInner");

// Drawer
const drawerEl = document.getElementById("songDrawer");
const drawerOverlayEl = document.getElementById("drawerOverlay");
const drawerCloseBtn = document.getElementById("drawerCloseBtn");
const drawerTitleEl = document.getElementById("drawerTitle");
const drawerBodyEl = document.getElementById("drawerBody");
const drawerPlayBtn = document.getElementById("drawerPlayBtn");

// -------------------- ELEMENTS (Games) --------------------
const copyBtn = document.getElementById("copyDownloadBtn");
const copyStatus = document.getElementById("copyStatus");

// -------------------- State --------------------
let sortKey = localStorage.getItem("music_sortKey") || "name";
let sortDir = localStorage.getItem("music_sortDir") || "asc";

let stageFilter = localStorage.getItem("music_stageFilter") || "All";
let query = localStorage.getItem("music_query") || "";

let shuffle = localStorage.getItem("music_shuffle") === "1";

let currentFile = null;
let isPlaying = false;

let selectedIndex = 0; // for keyboard navigation

// -------------------- Helpers --------------------
function normalizeStr(v){ return String(v ?? "").trim().toLowerCase(); }

function dateValue(s){
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

function compareSongs(a, b, key){
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

  return normalizeStr(a[key]).localeCompare(normalizeStr(b[key]));
}

function persist(){
  localStorage.setItem("music_sortKey", sortKey);
  localStorage.setItem("music_sortDir", sortDir);
  localStorage.setItem("music_stageFilter", stageFilter);
  localStorage.setItem("music_query", query);
  localStorage.setItem("music_shuffle", shuffle ? "1" : "0");
}

function isMobileWidth(){
  return window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
}

function haptic(ms){
  if (navigator.vibrate) navigator.vibrate(ms);
}

function formatTime(sec){
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2,"0")}`;
}

// -------------------- Filtering + sorting --------------------
function filteredSongs(){
  const q = normalizeStr(query);

  return songs.filter((s) => {
    const stageOk = stageFilter === "All" || s.stage === stageFilter;
    if (!stageOk) return false;

    if (!q) return true;
    const blob = `${s.name} ${s.artist} ${s.stage} ${s.version} ${s.releaseDate}`.toLowerCase();
    return blob.includes(q);
  });
}

function sortedSongs(list){
  const copy = [...list];
  copy.sort((a, b) => {
    const base = compareSongs(a, b, sortKey);
    return sortDir === "asc" ? base : -base;
  });
  return copy;
}

function displayedSongs(){
  const list = sortedSongs(filteredSongs());
  if (!shuffle) return list;

  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  if (currentFile) {
    const idx = copy.findIndex(s => s.file === currentFile);
    if (idx > 0) {
      const [cur] = copy.splice(idx, 1);
      copy.unshift(cur);
    }
  }

  return copy;
}

// -------------------- Sort UI --------------------
function updateSortIcons(){
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

function setSort(key){
  if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
  else { sortKey = key; sortDir = "asc"; }
  persist();
  selectedIndex = 0;
  renderSongTable();
  updateSortIcons();
}

// -------------------- Playback --------------------
async function playSong(song){
  if (!audioEl || !nowPlayingEl) return;

  if (playHintEl) playHintEl.classList.add("hidden");

  const same = currentFile === song.file;

  // Toggle if same
  if (same) {
    if (!audioEl.paused) {
      audioEl.pause();
      isPlaying = false;
      haptic(10);
      renderSongTable();
      updateDrawerButton();
      return;
    } else {
      try {
        await audioEl.play();
        isPlaying = true;
        haptic(10);
        renderSongTable();
        updateDrawerButton();
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
    haptic(12);
    renderSongTable();
    updateDrawerButton();
    scrollToPlayerIfMobile();
  } catch {
    isPlaying = false;
    renderSongTable();
    updateDrawerButton();
    if (playHintEl) playHintEl.classList.remove("hidden");
  }
}

function scrollToPlayerIfMobile(){
  if (!playerBoxEl) return;
  if (!isMobileWidth()) return;
  playerBoxEl.scrollIntoView({ behavior: "smooth", block: "end" });
}

// Autoplay next
function playNext(){
  const list = displayedSongs();
  if (!list.length) return;

  const idx = currentFile ? list.findIndex(s => s.file === currentFile) : -1;
  const next = idx >= 0 ? list[idx + 1] : list[0];
  if (next) playSong(next);
}

// Keep UI accurate if user uses the audio controls
if (audioEl) {
  audioEl.addEventListener("play", () => {
    isPlaying = true;
    renderSongTable();
    updateDrawerButton();
  });
  audioEl.addEventListener("pause", () => {
    isPlaying = false;
    renderSongTable();
    updateDrawerButton();
  });
  audioEl.addEventListener("ended", () => {
    isPlaying = false;
    renderSongTable();
    updateDrawerButton();
    playNext();
  });

  audioEl.addEventListener("timeupdate", () => {
    if (timeNowEl) timeNowEl.textContent = formatTime(audioEl.currentTime);
  });
  audioEl.addEventListener("loadedmetadata", () => {
    if (timeTotalEl) timeTotalEl.textContent = formatTime(audioEl.duration);
  });
}

// -------------------- Table render --------------------
function renderSongTable(){
  if (!tbodyEl) return;

  const list = displayedSongs();
  tbodyEl.innerHTML = "";

  if (selectedIndex < 0) selectedIndex = 0;
  if (selectedIndex > list.length - 1) selectedIndex = Math.max(0, list.length - 1);

  // Empty state (no results)
  if (!list.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "muted";
    td.textContent = "No results.";
    tr.appendChild(td);
    tbodyEl.appendChild(tr);
    syncScrollerSize();
    return;
  }

  list.forEach((song, i) => {
    const tr = document.createElement("tr");
    tr.dataset.file = song.file;

    const isCurrent = currentFile === song.file;
    if (isCurrent) tr.classList.add("playing");
    if (i === selectedIndex) tr.classList.add("selected");

    const tdName = document.createElement("td");
    tdName.textContent = song.name;
    tdName.tabIndex = 0;
    tdName.setAttribute("role", "button");
    tdName.setAttribute("aria-label", `Open details for ${song.name}`);
    tdName.addEventListener("click", () => openDrawer(song));
    tdName.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawer(song);
      }
    });

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

    btn.textContent = isCurrent && isPlaying ? "Pause" : "Play";
    btn.classList.toggle("pause", isCurrent && isPlaying);

    btn.setAttribute("aria-label", `${btn.textContent} ${song.name}`);
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

  syncScrollerSize();
}

// -------------------- Glide bar sync --------------------
let syncingFromTop = false;
let syncingFromTable = false;

function syncScrollerSize(){
  if (!tableEl || !tableWrapEl || !tableScrollerInnerEl || !tableScrollerEl) return;

  const tableWidth = tableEl.scrollWidth;
  tableScrollerInnerEl.style.width = `${tableWidth}px`;

  const needs = tableWidth > tableWrapEl.clientWidth + 2;
  tableScrollerEl.classList.toggle("hidden", !needs);
}

function hookScrollSync(){
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

// Swipe hint hide after first scroll
function initSwipeHint(){
  if (!swipeHintEl || !tableWrapEl) return;

  const hiddenAlready = localStorage.getItem("music_swipeHintHidden") === "1";
  if (hiddenAlready) {
    swipeHintEl.classList.add("hidden");
    return;
  }

  const hideOnce = () => {
    swipeHintEl.classList.add("hidden");
    localStorage.setItem("music_swipeHintHidden", "1");
    tableWrapEl.removeEventListener("scroll", hideOnce);
  };

  tableWrapEl.addEventListener("scroll", hideOnce, { passive: true });
}

// -------------------- Controls: search + chips + shuffle --------------------
function applyStageUI(){
  chipEls.forEach((chip) => {
    const st = chip.getAttribute("data-stage");
    const active = st === stageFilter;
    chip.classList.toggle("isActive", active);
    chip.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function initControls(){
  if (searchEl) {
    searchEl.value = query;
    searchEl.addEventListener("input", () => {
      query = searchEl.value;
      persist();
      selectedIndex = 0;
      renderSongTable();
    });
  }

  chipEls.forEach((chip) => {
    chip.addEventListener("click", () => {
      stageFilter = chip.getAttribute("data-stage") || "All";
      persist();
      applyStageUI();
      selectedIndex = 0;
      renderSongTable();
    });
  });
  applyStageUI();

  if (shuffleEl) {
    shuffleEl.checked = shuffle;
    shuffleEl.addEventListener("change", () => {
      shuffle = shuffleEl.checked;
      persist();
      selectedIndex = 0;
      renderSongTable();
    });
  }
}

// -------------------- Keyboard shortcuts --------------------
function initKeyboard(){
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && searchEl) {
      e.preventDefault();
      searchEl.focus();
      return;
    }

    const active = document.activeElement;
    const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
    if (typing) return;

    const list = displayedSongs();
    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, list.length - 1);
      renderSongTable();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderSongTable();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      playSong(list[selectedIndex]);
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      const cur = currentFile ? list.find(s => s.file === currentFile) : null;
      if (cur) playSong(cur);
      else playSong(list[selectedIndex]);
    }
  });
}

// -------------------- Drawer (song details) --------------------
let drawerSong = null;

function openDrawer(song){
  drawerSong = song;
  if (!drawerEl || !drawerOverlayEl) return;

  drawerTitleEl.textContent = song.name;

  drawerBodyEl.innerHTML = `
    <p><b>Artist/s:</b> ${song.artist}</p>
    <p><b>Stage:</b> ${song.stage}</p>
    <p><b>Version:</b> ${song.version}</p>
    <p><b>Release Date:</b> ${song.releaseDate}</p>
    <p class="muted tiny">Future: lyrics, notes, cover art.</p>
  `;

  updateDrawerButton();

  drawerEl.classList.remove("hidden");
  drawerOverlayEl.classList.remove("hidden");
  drawerEl.setAttribute("aria-hidden", "false");
  drawerOverlayEl.setAttribute("aria-hidden", "false");
}

function closeDrawer(){
  if (!drawerEl || !drawerOverlayEl) return;
  drawerEl.classList.add("hidden");
  drawerOverlayEl.classList.add("hidden");
  drawerEl.setAttribute("aria-hidden", "true");
  drawerOverlayEl.setAttribute("aria-hidden", "true");
}

function updateDrawerButton(){
  if (!drawerPlayBtn) return;
  if (!drawerSong){
    drawerPlayBtn.textContent = "Play";
    drawerPlayBtn.classList.remove("pause");
    return;
  }

  const active = currentFile === drawerSong.file && isPlaying;
  drawerPlayBtn.textContent = active ? "Pause" : "Play";
  drawerPlayBtn.classList.toggle("pause", active);
}

function initDrawer(){
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (drawerOverlayEl) drawerOverlayEl.addEventListener("click", closeDrawer);

  if (drawerPlayBtn) {
    drawerPlayBtn.addEventListener("click", () => {
      if (drawerSong) playSong(drawerSong);
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
}

// -------------------- Init (music page) --------------------
if (tableEl) {
  const headers = tableEl.querySelectorAll("th.sortable");
  headers.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (!key) return;
      setSort(key);
    });
  });

  updateSortIcons();
  initControls();
  initSwipeHint();
  hookScrollSync();
  initKeyboard();
  initDrawer();

  renderSongTable();
}

// -------------------- Games: Copy download link --------------------
(function initCopyDownload(){
  if (!copyBtn) return;
  const url = copyBtn.getAttribute("data-copy") || "";

  const show = (txt) => {
    if (!copyStatus) return;
    copyStatus.textContent = txt;
    copyStatus.classList.remove("hidden");
    setTimeout(() => copyStatus.classList.add("hidden"), 1400);
  };

  copyBtn.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        show("Copied!");
        haptic(10);
      } else {
        window.prompt("Copy this link:", url);
      }
    } catch {
      window.prompt("Copy this link:", url);
    }
  });
})();

// -------------------- Games: How-to-run toggle --------------------
const howBtn = document.getElementById("howToRunBtn");
const howBox = document.getElementById("howToRun");
if (howBtn && howBox) {
  howBtn.addEventListener("click", () => howBox.classList.toggle("hidden"));
}
