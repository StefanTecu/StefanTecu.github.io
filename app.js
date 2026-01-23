// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Songs are stored in assets/music/ (file paths are NOT displayed on the page).
const songs = [
  { file: "assets/music/song1.mp3",  name: "Jawbreak'r",         artist: "Tec-17",         stage: "Released", version: "v1",   releaseDate: "10.07.2024" },
  { file: "assets/music/song2.mp3",  name: "Fumez Tigari",       artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/music/song3.mp3",  name: "Plastic/Consumator", artist: "Vintage Angels", stage: "Demo",     version: "v0.2", releaseDate: "TBD" },
  { file: "assets/music/song4.mp3",  name: "Sex In Minecraft",   artist: "Vintage Angels", stage: "Demo",     version: "v0.3", releaseDate: "TBD" },
  { file: "assets/music/song5.mp3",  name: "O zic (IA)",         artist: "Tecu",           stage: "Demo",     version: "v0.5", releaseDate: "TBD" },
  { file: "assets/music/song6.mp3",  name: "Jumatati De Masura", artist: "Tecu",           stage: "Demo",     version: "v0.4", releaseDate: "TBD" },
  { file: "assets/music/song7.mp3",  name: "Sick bong, dude",    artist: "Moartea",        stage: "Demo",     version: "v0.7", releaseDate: "TBD" },
  { file: "assets/music/song8.mp3",  name: "dezastru",           artist: "Tecu",           stage: "Finished", version: "v1",   releaseDate: "TBD" },
  { file: "assets/music/song9.mp3",  name: "Nu Te Vrem",         artist: "Tecu",           stage: "Demo",     version: "v0.6", releaseDate: "TBD" },
  { file: "assets/music/song10.mp3", name: "Universal Madness",  artist: "Tec-17",         stage: "Finished", version: "v1",   releaseDate: "TBD" },
];

const tbodyEl = document.getElementById("songTbody");
const tableEl = document.getElementById("songTable");
const tableWrapEl = document.getElementById("tableWrap");
const audioEl = document.getElementById("audio");
const nowPlayingEl = document.getElementById("nowPlaying");
const playHintEl = document.getElementById("playHint");

// Glide bar elements
const tableScrollerEl = document.getElementById("tableScroller");
const tableScrollerInnerEl = document.getElementById("tableScrollerInner");

let sortKey = "name";
let sortDir = "asc";
let current = null;

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
  renderSongTable();
  updateSortIcons();
}

function renderSongTable(){
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
    tdStage.textContent = song.stage;

    const tdVersion = document.createElement("td");
    tdVersion.textContent = song.version;

    const tdDate = document.createElement("td");
    tdDate.textContent = song.releaseDate;

    const tdPlay = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = (current && current.file === song.file && audioEl && !audioEl.paused) ? "Pause" : "Play";

    btn.addEventListener("click", async () => {
      if (!audioEl) return;

      if (current && current.file === song.file) {
        if (!audioEl.paused) {
          audioEl.pause();
        } else {
          try { await audioEl.play(); } catch {}
        }
        renderSongTable();
        return;
      }

      current = song;
      if (nowPlayingEl) nowPlayingEl.textContent = `${song.name} • ${song.artist} • ${song.stage} ${song.version} • ${song.releaseDate}`;
      if (playHintEl) playHintEl.classList.add("hidden");

      try {
        audioEl.pause();
        audioEl.src = song.file;
        audioEl.load();
        await audioEl.play();
      } catch {
        if (playHintEl) playHintEl.classList.remove("hidden");
      }

      renderSongTable();
    });

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

function syncScrollerSize(){
  if (!tableEl || !tableWrapEl || !tableScrollerInnerEl || !tableScrollerEl) return;

  const tableWidth = tableEl.scrollWidth;
  tableScrollerInnerEl.style.width = `${tableWidth}px`;

  const needs = tableWidth > tableWrapEl.clientWidth + 2;
  tableScrollerEl.style.display = needs ? "block" : "none";
}

function hookScrollSync(){
  if (!tableWrapEl || !tableScrollerEl) return;

  tableScrollerEl.addEventListener("scroll", () => {
    tableWrapEl.scrollLeft = tableScrollerEl.scrollLeft;
  });

  tableWrapEl.addEventListener("scroll", () => {
    tableScrollerEl.scrollLeft = tableWrapEl.scrollLeft;
  });

  window.addEventListener("resize", syncScrollerSize);
}

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
  hookScrollSync();
  renderSongTable();
}

if (audioEl) {
  audioEl.addEventListener("play", renderSongTable);
  audioEl.addEventListener("pause", renderSongTable);
}