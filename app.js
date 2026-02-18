/* ── Tour Data ──────────────────────────────────────────── */
const STOPS = [
  {
    id: 1,
    title: "Murphy Hall",
    description: "UCLA's main administration building. Home of the Admissions office and campus information kiosks.",
    lat: 34.07201,
    lng: -118.44155,
    audio: "audio/01.mp3"
  },
  {
    id: 2,
    title: "Royce Hall",
    description: "One of UCLA's four original buildings, built in 1929. A Romanesque landmark and world-class performing arts venue.",
    lat: 34.07317,
    lng: -118.44244,
    audio: "audio/02.mp3"
  },
  {
    id: 3,
    title: "Janss Steps",
    description: "87 steps connecting upper and lower campus. A beloved campus gathering spot with a sweeping view of Royce Hall.",
    lat: 34.07236,
    lng: -118.44197,
    audio: "audio/03.mp3"
  },
  {
    id: 4,
    title: "Sculpture Gardens",
    description: "Franklin D. Murphy Sculpture Garden. One of the finest outdoor sculpture collections in the western United States.",
    lat: 34.07465,
    lng: -118.44043,
    audio: "audio/04.mp3"
  },
  {
    id: 5,
    title: "Inverted Fountain",
    description: "Water flows down into the earth rather than up. It represents the university drawing knowledge from the world.",
    lat: 34.07087,
    lng: -118.44290,
    audio: "audio/05.mp3"
  },
  {
    id: 6,
    title: "Kerckhoff Hall",
    description: "The original student union building, home to the student government and the Kerckhoff Coffee House.",
    lat: 34.07152,
    lng: -118.44215,
    audio: "audio/06.mp3"
  },
  {
    id: 7,
    title: "Bruin Plaza",
    description: "The heart of student life on campus. Home of the iconic Bruin Bear statue, a symbol of UCLA pride.",
    lat: 34.07112,
    lng: -118.44370,
    audio: "audio/07.mp3"
  },
  {
    id: 8,
    title: "Pauley Pavilion",
    description: "UCLA's premier indoor arena, home to Bruin basketball and volleyball. Seats over 13,000 fans.",
    lat: 34.07019,
    lng: -118.44563,
    audio: "audio/08.mp3"
  }
];

/* ── State ──────────────────────────────────────────────── */
let currentStop = 0;
let map = null;
let markers = [];
let userMarker = null;
let watchId = null;
let isDragging = false;

/* ── DOM refs ───────────────────────────────────────────── */
const audio       = document.getElementById('tour-audio');
const playBtn     = document.getElementById('play-btn');
const playIcon    = document.getElementById('play-icon');
const pauseIcon   = document.getElementById('pause-icon');
const prevBtn     = document.getElementById('prev-btn');
const nextBtn     = document.getElementById('next-btn');
const stopTitle   = document.getElementById('stop-title');
const stopDesc    = document.getElementById('stop-description');
const stopNum     = document.getElementById('current-stop-num');
const progressFill  = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const progressTrack = document.getElementById('progress-track');
const timeCurrent = document.getElementById('time-current');
const timeTotal   = document.getElementById('time-total');
const stopDots    = document.getElementById('stop-dots');
const locateBtn   = document.getElementById('locate-btn');
const stopInfo    = document.querySelector('.stop-info');

/* ── Google Maps Init ───────────────────────────────────── */
function initMap() {
  const uclaCenter = { lat: 34.0722, lng: -118.4431 };

  map = new google.maps.Map(document.getElementById('map'), {
    center: uclaCenter,
    zoom: 16,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    styles: mapStyles()
  });

  // Create markers for each stop
  STOPS.forEach((stop, i) => {
    const markerEl = document.createElement('div');
    markerEl.className = 'map-marker' + (i === 0 ? ' active' : '');
    markerEl.textContent = stop.id;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
      this.getPanes().overlayMouseTarget.appendChild(markerEl);
    };
    overlay.draw = function() {
      const proj = this.getProjection();
      const pos = proj.fromLatLngToDivPixel(new google.maps.LatLng(stop.lat, stop.lng));
      const size = i === currentStop ? 23 : 18;
      markerEl.style.left = (pos.x - size) + 'px';
      markerEl.style.top  = (pos.y - size) + 'px';
      markerEl.style.position = 'absolute';
    };
    overlay.onRemove = function() {
      if (markerEl.parentNode) markerEl.parentNode.removeChild(markerEl);
    };

    markerEl.addEventListener('click', () => goToStop(i));

    overlay.setMap(map);
    markers.push({ overlay, el: markerEl });
  });

  buildDots();
  goToStop(-1, false);

  // Call watchPosition directly — this triggers the browser permission prompt on load
  startGeolocation();
}

/* ── Navigation ─────────────────────────────────────────── */
// currentStop = -1 means the intro "0/8" screen
function goToStop(index, animate = true) {
  if (index < -1 || index >= STOPS.length) return;

  audio.pause();
  setPlayState(false);

  currentStop = index;

  if (index === -1) {
    // Intro screen — no audio, no active pin
    markers.forEach(m => {
      m.el.className = 'map-marker';
      m.overlay.draw();
    });
    stopTitle.textContent = 'Welcome to UCLA';
    stopDesc.textContent  = 'Tap the arrow to begin your self-guided tour of 8 campus landmarks.';
    stopNum.textContent   = '0';
    progressFill.style.width = '0%';
    progressThumb.style.left  = '0%';
    timeCurrent.textContent  = '0:00';
    timeTotal.textContent    = '0:00';
    // Hide play button and seek bar on intro
    document.getElementById('bottom-bar').classList.add('intro-mode');
    prevBtn.disabled = true;
    nextBtn.disabled = false;
    updateDots();
    return;
  }

  // Normal stop
  document.getElementById('bottom-bar').classList.remove('intro-mode');

  // Update marker styles
  markers.forEach((m, i) => {
    m.el.className = 'map-marker';
    if (i < index)  m.el.className += ' visited';
    if (i === index) m.el.className += ' active';
    m.overlay.draw();
  });

  const stop = STOPS[index];

  if (animate) {
    stopInfo.classList.remove('animating');
    void stopInfo.offsetWidth;
    stopInfo.classList.add('animating');
  }

  stopTitle.textContent = stop.title;
  stopDesc.textContent  = stop.description;
  stopNum.textContent   = stop.id;

  // Load audio — by the time we reach stop 0 the user has tapped next (user gesture done)
  audio.src = stop.audio;
  audio.load();
  progressFill.style.width = '0%';
  progressThumb.style.left  = '0%';
  timeCurrent.textContent  = '0:00';
  timeTotal.textContent    = '0:00';

  map.panTo({ lat: stop.lat, lng: stop.lng });
  updateDots();

  prevBtn.disabled = false;
  nextBtn.disabled = (index === STOPS.length - 1);
}

/* ── Prev / Next ────────────────────────────────────────── */
prevBtn.addEventListener('click', () => goToStop(currentStop - 1));
nextBtn.addEventListener('click', () => goToStop(currentStop + 1));

/* ── Audio Controls ─────────────────────────────────────── */
playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch(() => {});
    setPlayState(true);
  } else {
    audio.pause();
    setPlayState(false);
  }
});

function setPlayState(playing) {
  playIcon.style.display  = playing ? 'none'  : 'block';
  pauseIcon.style.display = playing ? 'block' : 'none';
}

audio.addEventListener('timeupdate', () => {
  if (isDragging || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  progressThumb.style.left  = pct + '%';
  timeCurrent.textContent  = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  setPlayState(false);
  progressFill.style.width = '100%';
  progressThumb.style.left  = '100%';

  // Auto-advance to next stop after 1.5s
  if (currentStop < STOPS.length - 1) {
    setTimeout(() => goToStop(currentStop + 1), 1500);
  }
});

/* ── Seek Bar ───────────────────────────────────────────── */
function seek(e) {
  const rect = progressTrack.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const pct = Math.max(0, Math.min(1, x / rect.width));
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
    progressFill.style.width = (pct * 100) + '%';
    progressThumb.style.left  = (pct * 100) + '%';
    timeCurrent.textContent  = formatTime(audio.currentTime);
  }
}

progressTrack.addEventListener('mousedown', e => { isDragging = true; seek(e); });
progressTrack.addEventListener('touchstart', e => { isDragging = true; seek(e); }, { passive: true });
document.addEventListener('mousemove', e => { if (isDragging) seek(e); });
document.addEventListener('touchmove', e => { if (isDragging) seek(e); }, { passive: true });
document.addEventListener('mouseup', () => { isDragging = false; });
document.addEventListener('touchend', () => { isDragging = false; });

/* ── Prev / Next ────────────────────────────────────────── */
prevBtn.addEventListener('click', () => goToStop(currentStop - 1));
nextBtn.addEventListener('click', () => goToStop(currentStop + 1));

/* ── Stop Dots ──────────────────────────────────────────── */
function buildDots() {
  stopDots.innerHTML = '';
  STOPS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Go to stop ${i + 1}`);
    dot.addEventListener('click', () => goToStop(i));
    stopDots.appendChild(dot);
  });
}

function updateDots() {
  const dots = stopDots.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.className = 'dot';
    if (currentStop === -1) return; // all unvisited on intro
    if (i < currentStop)   dot.classList.add('visited');
    if (i === currentStop) dot.classList.add('active');
  });
}

/* ── Geolocation ────────────────────────────────────────── */
let userDotEl = null;
let userOverlay = null;

function startGeolocation() {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(pos => {
    const latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

    if (!userOverlay) {
      userDotEl = document.createElement('div');
      userDotEl.style.cssText = `
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #E53935;
        border: 3px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(229,57,53,0.6);
        position: absolute;
        pointer-events: none;
      `;

      userOverlay = new google.maps.OverlayView();
      userOverlay._latlng = latlng;

      userOverlay.onAdd = function() {
        // floatPane renders above all other map overlays including stop markers
        this.getPanes().floatPane.appendChild(userDotEl);
      };
      userOverlay.draw = function() {
        const proj = this.getProjection();
        if (!proj) return;
        const pt = proj.fromLatLngToDivPixel(this._latlng);
        if (!pt) return;
        userDotEl.style.left = (pt.x - 9) + 'px';
        userDotEl.style.top  = (pt.y - 9) + 'px';
      };
      userOverlay.onRemove = function() {
        if (userDotEl && userDotEl.parentNode) userDotEl.parentNode.removeChild(userDotEl);
      };
      userOverlay.setMap(map);
    } else {
      userOverlay._latlng = latlng;
      userOverlay.draw();
    }
  }, err => {
    console.log('Watch position error:', err.message);
  }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
}

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    map.setZoom(17);
  });
});

/* ── Satellite Toggle ───────────────────────────────────── */
let isSatellite = false;
const satelliteBtn = document.getElementById('satellite-btn');
satelliteBtn.addEventListener('click', () => {
  isSatellite = !isSatellite;
  map.setMapTypeId(isSatellite ? 'hybrid' : 'roadmap');
  satelliteBtn.classList.toggle('active', isSatellite);
});

/* ── Utilities ──────────────────────────────────────────── */
function formatTime(secs) {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ── Map Styles (clean but full detail) ─────────────────── */
function mapStyles() {
  return [
    { featureType: 'poi.business', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
  ];
}
