/* ── Tour Stops ─────────────────────────────────────────── */
const STOPS = [
  {
    id: 1,
    title: "Murphy Hall",
    description: "UCLA's main administration building. Home of the Admissions office and campus information kiosks.",
    lat: 34.07201, lng: -118.44155,
    audio: "audio/01.mp3"
  },
  {
    id: 2,
    title: "Royce Hall",
    description: "One of UCLA's four original buildings, built in 1929. A Romanesque landmark and world-class performing arts venue.",
    lat: 34.07317, lng: -118.44244,
    audio: "audio/02.mp3"
  },
  {
    id: 3,
    title: "Janss Steps",
    description: "87 steps connecting upper and lower campus. A beloved gathering spot with a sweeping view of Royce Hall.",
    lat: 34.07236, lng: -118.44197,
    audio: "audio/03.mp3"
  },
  {
    id: 4,
    title: "Sculpture Gardens",
    description: "Franklin D. Murphy Sculpture Garden — one of the finest outdoor sculpture collections in the western United States.",
    lat: 34.07465, lng: -118.44043,
    audio: "audio/04.mp3"
  },
  {
    id: 5,
    title: "Inverted Fountain",
    description: "Water flows down into the earth rather than up, representing the university drawing knowledge from the world.",
    lat: 34.07087, lng: -118.44290,
    audio: "audio/05.mp3"
  },
  {
    id: 6,
    title: "Kerckhoff Hall",
    description: "The original student union building, home to student government and the Kerckhoff Coffee House.",
    lat: 34.07152, lng: -118.44215,
    audio: "audio/06.mp3"
  },
  {
    id: 7,
    title: "Bruin Plaza",
    description: "The heart of student life on campus. Home of the iconic Bruin Bear statue, a symbol of UCLA pride.",
    lat: 34.07112, lng: -118.44370,
    audio: "audio/07.mp3"
  },
  {
    id: 8,
    title: "Pauley Pavilion",
    description: "UCLA's premier indoor arena, home to Bruin basketball and volleyball. Seats over 13,000 fans.",
    lat: 34.07019, lng: -118.44563,
    audio: "audio/08.mp3"
  }
];

/* ── State ──────────────────────────────────────────────── */
// currentStop: -1 = intro screen, 0-7 = tour stops (index into STOPS array)
let currentStop = -1;
let map         = null;
let markers     = [];
let userOverlay = null;
let userDotEl   = null;
let watchId     = null;
let isDragging  = false;
let isSatellite = false;

/* ── DOM refs ───────────────────────────────────────────── */
const audio         = document.getElementById('tour-audio');
const playBtn       = document.getElementById('play-btn');
const playIcon      = document.getElementById('play-icon');
const pauseIcon     = document.getElementById('pause-icon');
const prevBtn       = document.getElementById('prev-btn');
const nextBtn       = document.getElementById('next-btn');
const stopTitle     = document.getElementById('stop-title');
const stopDesc      = document.getElementById('stop-description');
const stopNum       = document.getElementById('current-stop-num');
const progressFill  = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const progressTrack = document.getElementById('progress-track');
const timeCurrent   = document.getElementById('time-current');
const timeTotal     = document.getElementById('time-total');
const stopDots      = document.getElementById('stop-dots');
const locateBtn     = document.getElementById('locate-btn');
const satelliteBtn  = document.getElementById('satellite-btn');
const audioRow      = document.getElementById('audio-row');
const stopInfo      = document.querySelector('.stop-info');

/* ── Google Maps Init ───────────────────────────────────── */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 34.0722, lng: -118.4431 },
    zoom: 16,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    styles: [
      { featureType: 'poi.business', elementType: 'labels', stylers: [{ visibility: 'off' }] }
    ]
  });

  // Build a marker overlay for each stop
  STOPS.forEach((stop, i) => {
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.textContent = stop.id;

    const ov = new google.maps.OverlayView();
    ov.onAdd = function () {
      this.getPanes().overlayMouseTarget.appendChild(el);
    };
    ov.draw = function () {
      const proj = this.getProjection();
      if (!proj) return;
      const pt   = proj.fromLatLngToDivPixel(new google.maps.LatLng(stop.lat, stop.lng));
      const half = el.classList.contains('active') ? 23 : 18;
      el.style.position = 'absolute';
      el.style.left     = (pt.x - half) + 'px';
      el.style.top      = (pt.y - half) + 'px';
    };
    ov.onRemove = function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    };

    el.addEventListener('click', () => {
      if (currentStop === -1) return; // don't navigate from intro by tapping map
      goToStop(i);
    });

    ov.setMap(map);
    markers.push({ ov, el });
  });

  buildDots();
  renderIntro();
  startGeolocation();
}

/* ── Render intro (stop 0/8) ────────────────────────────── */
function renderIntro() {
  currentStop = -1;

  // All markers unvisited/inactive
  markers.forEach(m => {
    m.el.className = 'map-marker';
    m.ov.draw();
  });

  stopNum.textContent   = '0';
  stopTitle.textContent = 'Welcome to UCLA';
  stopDesc.textContent  = 'Tap the arrow to start your self-guided tour of 8 campus landmarks.';

  // Hide audio row and play button
  audioRow.classList.add('hidden');
  playBtn.classList.add('hidden');

  // Button states
  prevBtn.disabled = true;
  nextBtn.disabled = false;

  // Reset progress
  progressFill.style.width  = '0%';
  progressThumb.style.left  = '0%';
  timeCurrent.textContent   = '0:00';
  timeTotal.textContent     = '0:00';

  updateDots();
}

/* ── Go to a real tour stop (0-indexed) ─────────────────── */
function goToStop(index, animate = true) {
  if (index < 0 || index > STOPS.length - 1) return;

  // Stop any playing audio
  audio.pause();
  setPlayState(false);

  currentStop = index;
  const stop  = STOPS[index];

  // Show audio row and play button
  audioRow.classList.remove('hidden');
  playBtn.classList.remove('hidden');

  // Marker styles
  markers.forEach((m, i) => {
    m.el.className = 'map-marker';
    if (i < index)  m.el.className += ' visited';
    if (i === index) m.el.className += ' active';
    m.ov.draw();
  });

  // Animate title
  if (animate) {
    stopInfo.classList.remove('animating');
    void stopInfo.offsetWidth;
    stopInfo.classList.add('animating');
  }

  stopNum.textContent   = stop.id;
  stopTitle.textContent = stop.title;
  stopDesc.textContent  = stop.description;

  // Load audio — safe because the user had to tap a button to get here
  audio.src = stop.audio;
  audio.load();
  progressFill.style.width  = '0%';
  progressThumb.style.left  = '0%';
  timeCurrent.textContent   = '0:00';
  timeTotal.textContent     = '0:00';

  map.panTo({ lat: stop.lat, lng: stop.lng });
  updateDots();

  prevBtn.disabled = false;
  nextBtn.disabled = (index === STOPS.length - 1);
}

/* ── Prev / Next ────────────────────────────────────────── */
prevBtn.addEventListener('click', () => {
  if (currentStop === 0) {
    renderIntro();
  } else {
    goToStop(currentStop - 1);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentStop === -1) {
    goToStop(0);
  } else if (currentStop < STOPS.length - 1) {
    goToStop(currentStop + 1);
  }
});

/* ── Play / Pause ───────────────────────────────────────── */
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

/* ── Audio events ───────────────────────────────────────── */
audio.addEventListener('timeupdate', () => {
  if (isDragging || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width  = pct + '%';
  progressThumb.style.left  = pct + '%';
  timeCurrent.textContent   = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  setPlayState(false);
  progressFill.style.width  = '100%';
  progressThumb.style.left  = '100%';
  // Auto-advance after 1.5 s if not on last stop
  if (currentStop < STOPS.length - 1) {
    setTimeout(() => goToStop(currentStop + 1), 1500);
  }
});

/* ── Seek bar ───────────────────────────────────────────── */
function seek(e) {
  const rect = progressTrack.getBoundingClientRect();
  const x    = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const pct  = Math.max(0, Math.min(1, x / rect.width));
  if (audio.duration) {
    audio.currentTime           = pct * audio.duration;
    progressFill.style.width    = (pct * 100) + '%';
    progressThumb.style.left    = (pct * 100) + '%';
    timeCurrent.textContent     = formatTime(audio.currentTime);
  }
}

progressTrack.addEventListener('mousedown',  e => { isDragging = true; seek(e); });
progressTrack.addEventListener('touchstart', e => { isDragging = true; seek(e); }, { passive: true });
document.addEventListener('mousemove',  e => { if (isDragging) seek(e); });
document.addEventListener('touchmove',  e => { if (isDragging) seek(e); }, { passive: true });
document.addEventListener('mouseup',   () => { isDragging = false; });
document.addEventListener('touchend',  () => { isDragging = false; });

/* ── Stop dots ──────────────────────────────────────────── */
function buildDots() {
  stopDots.innerHTML = '';
  STOPS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Go to stop ${i + 1}`);
    dot.addEventListener('click', () => {
      if (currentStop === -1) goToStop(i);
      else goToStop(i);
    });
    stopDots.appendChild(dot);
  });
}

function updateDots() {
  const dots = stopDots.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.className = 'dot';
    if (currentStop === -1) return;
    if (i < currentStop)   dot.classList.add('visited');
    if (i === currentStop) dot.classList.add('active');
  });
}

/* ── Geolocation (red dot) ──────────────────────────────── */
function startGeolocation() {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(pos => {
    const latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

    if (!userOverlay) {
      userDotEl = document.createElement('div');
      userDotEl.style.cssText = [
        'width:18px', 'height:18px', 'border-radius:50%',
        'background:#E53935', 'border:3px solid #fff',
        'box-shadow:0 2px 8px rgba(229,57,53,0.6)',
        'position:absolute', 'pointer-events:none'
      ].join(';');

      userOverlay          = new google.maps.OverlayView();
      userOverlay._latlng  = latlng;

      userOverlay.onAdd = function () {
        this.getPanes().floatPane.appendChild(userDotEl);
      };
      userOverlay.draw = function () {
        const proj = this.getProjection();
        if (!proj) return;
        const pt = proj.fromLatLngToDivPixel(this._latlng);
        if (!pt) return;
        userDotEl.style.left = (pt.x - 9) + 'px';
        userDotEl.style.top  = (pt.y - 9) + 'px';
      };
      userOverlay.onRemove = function () {
        if (userDotEl && userDotEl.parentNode) userDotEl.parentNode.removeChild(userDotEl);
      };
      userOverlay.setMap(map);
    } else {
      userOverlay._latlng = latlng;
      userOverlay.draw();
    }
  }, err => {
    console.log('Geolocation error:', err.message);
  }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
}

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    map.setZoom(17);
  });
});

/* ── Satellite toggle ───────────────────────────────────── */
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
