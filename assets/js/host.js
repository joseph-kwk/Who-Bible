// ==========================================================================
// Who-Bible — Live Classroom Host Controller (Kahoot + Scripture Twist)
// Resilient real-time sync, timeouts, session recovery, zero native alerts
// ==========================================================================

const FB_OP_TIMEOUT = 10000;
const RING_CIRCUMFERENCE = 2 * Math.PI * 44; // r=44 => ~276.46

// Built-in fallback figures in case people.json fails to fetch
const FALLBACK_PEOPLE = [
  { name: 'David', testament: 'ot', difficulty: 'easy', gender: 'male', mother: 'Nitzevet', father: 'Jesse', occupation: 'Shepherd and King of Israel', notable_events: ['defeated Goliath with a sling and stone', 'wrote many Psalms of praise'], verses: ['1 Samuel 17:45-50', '2 Samuel 5:3'], short_bio: 'Shepherd boy of Bethlehem anointed by Samuel who became Israel’s greatest king.' },
  { name: 'Moses', testament: 'ot', difficulty: 'easy', gender: 'male', mother: 'Jochebed', father: 'Amram', occupation: 'Prophet and Lawgiver', notable_events: ['led the Israelites out of slavery in Egypt', 'received the Ten Commandments on Mount Sinai'], verses: ['Exodus 3:10', 'Exodus 14:21'], short_bio: 'Chosen by God at the burning bush to deliver Israel and receive the Law at Sinai.' },
  { name: 'Esther', testament: 'ot', difficulty: 'easy', gender: 'female', occupation: 'Queen of Persia', notable_events: ['risked her life before the king to save the Jewish people'], verses: ['Esther 4:14', 'Esther 7:3'], short_bio: 'Jewish orphan who became Queen of Persia and courageously rescued her people.' },
  { name: 'Noah', testament: 'ot', difficulty: 'easy', gender: 'male', father: 'Lamech', occupation: 'Righteous Builder of the Ark', notable_events: ['built an ark to preserve life through the great flood'], verses: ['Genesis 6:14', 'Genesis 9:13'], short_bio: 'Walked faithfully with God and built the ark before the flood.' },
  { name: 'Abraham', testament: 'ot', difficulty: 'easy', gender: 'male', father: 'Terah', occupation: 'Patriarch of Nations', notable_events: ['left Ur by faith at God’s call', 'received God’s covenant promise of descendants like the stars'], verses: ['Genesis 12:1-3', 'Genesis 15:5-6'], short_bio: 'Father of faith called by God into Canaan and promised a multitude of descendants.' },
  { name: 'Ruth', testament: 'ot', difficulty: 'easy', gender: 'female', occupation: 'Faithful Gleaner and Ancestor of David', notable_events: ['remained loyal to Naomi and gleaned in the fields of Boaz'], verses: ['Ruth 1:16', 'Ruth 4:13-17'], short_bio: 'Moabite woman of steadfast devotion who became great-grandmother of King David.' },
  { name: 'Daniel', testament: 'ot', difficulty: 'easy', gender: 'male', occupation: 'Prophet and Royal Advisor in Babylon', notable_events: ['was delivered unharmed from the lions’ den', 'interpreted King Nebuchadnezzar’s dreams'], verses: ['Daniel 6:22', 'Daniel 2:28'], short_bio: 'Faithful exile in Babylon whom God protected in the lions’ den.' },
  { name: 'Elijah', testament: 'ot', difficulty: 'medium', gender: 'male', occupation: 'Prophet of the Lord', notable_events: ['called down fire from heaven on Mount Carmel', 'was taken up to heaven in a whirlwind'], verses: ['1 Kings 18:38', '2 Kings 2:11'], short_bio: 'Bold prophet who confronted idolatry on Mount Carmel.' },
  { name: 'Hannah', testament: 'ot', difficulty: 'medium', gender: 'female', occupation: 'Devoted Mother of Samuel', notable_events: ['prayed fervently at Shiloh for a son and dedicated Samuel to the Lord'], verses: ['1 Samuel 1:10-11', '1 Samuel 2:1'], short_bio: 'Woman of deep prayer whose son Samuel anointed Israel’s first kings.' },
  { name: 'Deborah', testament: 'ot', difficulty: 'medium', gender: 'female', occupation: 'Prophetess and Judge of Israel', notable_events: ['led Israel to victory alongside Barak near Mount Tabor'], verses: ['Judges 4:4-9', 'Judges 5:1'], short_bio: 'Wise prophetess and judge who rendered judgment beneath the Palm of Deborah.' },
  { name: 'Peter', testament: 'nt', difficulty: 'easy', gender: 'male', father: 'Jonah', occupation: 'Fisherman and Apostle', notable_events: ['walked on water toward Jesus on the Sea of Galilee', 'preached boldly at Pentecost where three thousand believed'], verses: ['Matthew 14:29', 'Acts 2:41'], short_bio: 'Galilean fisherman called by Jesus who became a leading voice of the early church.' },
  { name: 'Paul', testament: 'nt', difficulty: 'easy', gender: 'male', occupation: 'Tentmaker and Apostle to the Gentiles', notable_events: ['was converted on the road to Damascus', 'wrote epistles to churches across the Mediterranean'], verses: ['Acts 9:3-6', 'Romans 1:16'], short_bio: 'Former Pharisee transformed on the Damascus road into tireless missionary.' },
  { name: 'Mary (mother of Jesus)', testament: 'nt', difficulty: 'easy', gender: 'female', occupation: 'Mother of Jesus', notable_events: ['received the angel Gabriel’s announcement in Nazareth', 'gave birth to Jesus in Bethlehem'], verses: ['Luke 1:26-38', 'Luke 2:7'], short_bio: 'Humble maiden of Nazareth chosen to bear the Messiah.' },
  { name: 'John the Baptist', testament: 'nt', difficulty: 'easy', gender: 'male', mother: 'Elizabeth', father: 'Zechariah', occupation: 'Forerunner Prophet', notable_events: ['baptized Jesus in the Jordan River', 'proclaimed repentance in the wilderness'], verses: ['Matthew 3:1-3', 'Matthew 3:13-17'], short_bio: 'Prophet who prepared the way for Jesus and baptized Him in the Jordan.' }
];

const HostState = {
  roomCode: null,
  hostName: 'Host',
  difficulty: 'medium',
  testament: 'all',
  numQuestions: 10,
  timePerQuestion: 20,
  twistEnabled: true,
  currentQuestionIndex: -1,
  questions: [],
  players: {},
  responses: {},
  status: 'setup', // setup | lobby | question | results | leaderboard | finished
  timerInterval: null,
  autoAdvanceTimeout: null,
  countdownInterval: null,
  timeRemaining: 0,
  questionStartTime: 0,
  clueRevealed: false,
  isEndingQuestion: false,
  totalCorrectAllRounds: 0,
  totalResponsesAllRounds: 0,
  soundEnabled: true
};

let PEOPLE_DATA = [];
let roomRef = null;

// Lightweight WebAudio synthesizer for classroom energy
const HostAudio = {
  ctx: null,
  ensure() {
    if (!HostState.soundEnabled) return null;
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },
  tone(freq, dur = 0.14, type = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    } catch (_) {}
  },
  joinPop() { this.tone(587.33, 0.1, 'triangle', 0.08); this.tone(880, 0.14, 'triangle', 0.08, 0.08); },
  tick(urgent = false) { this.tone(urgent ? 880 : 520, 0.06, 'sine', urgent ? 0.07 : 0.035); },
  clue() { this.tone(659.25, 0.12, 'triangle', 0.08); this.tone(987.77, 0.22, 'triangle', 0.09, 0.1); },
  reveal() { this.tone(523.25, 0.12, 'triangle', 0.09); this.tone(659.25, 0.12, 'triangle', 0.09, 0.1); this.tone(783.99, 0.28, 'triangle', 0.1, 0.2); },
  fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => this.tone(f, 0.24, 'triangle', 0.1, idx * 0.12));
  }
};

function withTimeout(promise, ms = FB_OP_TIMEOUT, msg = 'Server request timed out. Check your internet connection.') {
  let tid;
  const timeout = new Promise((_, rej) => { tid = setTimeout(() => rej(new Error(msg)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(tid));
}

function waitForFirebase(timeoutMs = 6000) {
  if (window.FirebaseConfig && window.FirebaseConfig.isAvailable()) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('firebase:ready', onReady);
      clearInterval(poll);
      clearTimeout(timer);
      resolve(ok);
    };
    const onReady = () => done(!!(window.FirebaseConfig && window.FirebaseConfig.isAvailable()));
    window.addEventListener('firebase:ready', onReady);
    const poll = setInterval(() => {
      if (window.FirebaseConfig && window.FirebaseConfig.isAvailable()) done(true);
    }, 120);
    const timer = setTimeout(() => done(!!(window.FirebaseConfig && window.FirebaseConfig.isAvailable())), timeoutMs);
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function updateConnectionBadge(state, label) {
  const badge = document.getElementById('host-conn-badge');
  const txt = document.getElementById('host-conn-text');
  if (!badge || !txt) return;
  badge.className = `conn-badge ${state}`;
  txt.textContent = label;
}

// Toast Notification (No browser alert!)
function showToast(message, type = 'info', duration = 3600) {
  const container = document.getElementById('host-toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `host-toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, duration);
}

// Custom Confirmation Dialog (No browser confirm()!)
function showHostConfirm({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return new Promise((resolve) => {
    const modal = document.getElementById('host-confirm-modal');
    const titleEl = document.getElementById('host-confirm-title');
    const msgEl = document.getElementById('host-confirm-msg');
    const okBtn = document.getElementById('btn-host-confirm-ok');
    const cancelBtn = document.getElementById('btn-host-confirm-cancel');

    if (!modal || !okBtn || !cancelBtn) {
      resolve(true);
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    modal.style.display = 'flex';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    const cleanup = (result) => {
      modal.style.display = 'none';
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      modal.onclick = null;
      window.removeEventListener('keydown', onKey);
      resolve(result);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') cleanup(false);
    };

    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
    window.addEventListener('keydown', onKey);
    okBtn.focus();
  });
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Prefill saved host name
  const savedHost = localStorage.getItem('who-bible-host-name') || localStorage.getItem('who-bible-profile-name') || 'Host';
  const hostInput = document.getElementById('host-name');
  if (hostInput && savedHost) hostInput.value = savedHost;

  // Attach all UI handlers FIRST so UI is always responsive
  setupEventListeners();

  // Load people dataset in parallel with Firebase check
  const [, fbReady] = await Promise.all([
    loadPeopleData(),
    waitForFirebase(6000)
  ]);

  if (!fbReady) {
    updateConnectionBadge('offline', 'Offline / Connecting');
    showToast('Still connecting to live game server. Check your internet before creating a room.', 'warning', 5000);
  } else {
    updateConnectionBadge('online', 'Live Server Ready');
    // Monitor Firebase live connection state
    try {
      const db = window.FirebaseConfig.getDatabase();
      db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
          updateConnectionBadge('online', 'Live Connected');
        } else {
          updateConnectionBadge('connecting', 'Reconnecting…');
        }
      });
    } catch (_) {}
  }

  // Check if host refreshed an active room (?room=CODE)
  const params = new URLSearchParams(window.location.search);
  const urlRoom = params.get('room');
  if (urlRoom && fbReady) {
    await tryReconnectSession(urlRoom.trim().toUpperCase());
  }
}

async function loadPeopleData() {
  try {
    const res = await fetch('assets/data/people.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length >= 10) {
        PEOPLE_DATA = data;
        return;
      }
    }
  } catch (err) {
    console.warn('[Host] Using built-in fallback people dataset:', err);
  }
  PEOPLE_DATA = FALLBACK_PEOPLE.slice();
}

function setupEventListeners() {
  // Pill groups
  ['host-diff-pills', 'host-testament-pills', 'host-qcount-pills', 'host-timer-pills'].forEach((groupId) => {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.addEventListener('click', (e) => {
      const pill = e.target.closest('.host-pill');
      if (!pill) return;
      group.querySelectorAll('.host-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById('btn-sound-host');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      HostState.soundEnabled = !HostState.soundEnabled;
      soundBtn.textContent = HostState.soundEnabled ? '🔊' : '🔇';
      showToast(HostState.soundEnabled ? 'Sound effects enabled' : 'Sound effects muted', 'info', 1800);
    });
  }

  // Buttons
  document.getElementById('btn-create-session')?.addEventListener('click', createSession);
  document.getElementById('btn-copy-pin')?.addEventListener('click', copyRoomPin);
  document.getElementById('btn-topbar-copy-pin')?.addEventListener('click', copyRoomPin);
  document.getElementById('btn-copy-join-link')?.addEventListener('click', copyJoinLink);
  document.getElementById('btn-start-quiz')?.addEventListener('click', () => startQuiz(false));
  document.getElementById('btn-start-solo-preview')?.addEventListener('click', () => startQuiz(true));
  document.getElementById('btn-cancel-session')?.addEventListener('click', cancelSession);
  document.getElementById('btn-reveal-clue')?.addEventListener('click', () => revealScriptureClue(true));
  document.getElementById('btn-skip-timer')?.addEventListener('click', () => endQuestion());
  document.getElementById('btn-end-quiz')?.addEventListener('click', endQuizEarly);
  document.getElementById('btn-end-from-lb')?.addEventListener('click', endQuizEarly);
  document.getElementById('btn-show-leaderboard')?.addEventListener('click', handleAfterResultsAction);
  document.getElementById('btn-next-question')?.addEventListener('click', nextQuestion);
  document.getElementById('btn-replay-same-room')?.addEventListener('click', replaySameClassroom);
  document.getElementById('btn-new-session')?.addEventListener('click', resetForNewSession);
}

function getSelectedPill(groupId, fallback) {
  const active = document.querySelector(`#${groupId} .host-pill.active`);
  return active ? active.dataset.value : fallback;
}

// ==========================================
// SESSION CREATION & RECONNECT
// ==========================================
function generateRoomPin() {
  const words = ['FAITH', 'GRACE', 'LIGHT', 'CROWN', 'TRUTH', 'PEACE', 'GLORY', 'PSALM'];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(100 + Math.random() * 900);
  return `${word}-${digits}`;
}

function getJoinBaseUrl() {
  const path = window.location.pathname.replace(/\/host(\.html)?$/i, '/');
  return `${window.location.origin}${path.endsWith('/') ? path : path + '/'}`;
}

async function createSession() {
  const createBtn = document.getElementById('btn-create-session');
  if (createBtn) {
    createBtn.disabled = true;
    createBtn.innerHTML = '<span>⏳ Creating Live Room…</span>';
  }

  try {
    const fbOk = await waitForFirebase(5000);
    if (!fbOk || !window.FirebaseConfig?.isAvailable()) {
      throw new Error('Live server unavailable. Please check your internet connection and try again.');
    }

    if (window.RateLimiter && !window.RateLimiter.check('roomCreation', 6)) {
      throw new Error('Too many room creation attempts. Please wait a moment and try again.');
    }

    const rawHostName = (document.getElementById('host-name')?.value || 'Host').trim() || 'Host';
    const nameCheck = window.SecurityModule ? window.SecurityModule.validatePlayerName(rawHostName) : { valid: true, value: rawHostName };
    const cleanHost = (nameCheck.valid ? nameCheck.value : rawHostName).replace(/[<>]/g, '').slice(0, 24) || 'Host';

    localStorage.setItem('who-bible-host-name', cleanHost);

    HostState.hostName = cleanHost;
    HostState.difficulty = getSelectedPill('host-diff-pills', 'medium');
    HostState.testament = getSelectedPill('host-testament-pills', 'all');
    HostState.numQuestions = parseInt(getSelectedPill('host-qcount-pills', '10'), 10) || 10;
    HostState.timePerQuestion = parseInt(getSelectedPill('host-timer-pills', '20'), 10) || 20;
    HostState.twistEnabled = !!document.getElementById('host-twist-toggle')?.checked;

    const questions = generateQuestions(HostState.numQuestions, HostState.difficulty, HostState.testament);
    if (!questions.length) {
      throw new Error('Could not generate questions for the selected filters.');
    }
    HostState.questions = questions;

    const db = window.FirebaseConfig.getDatabase();

    // Ensure unique PIN
    let pin = generateRoomPin();
    let candidateRef = db.ref('classrooms/' + pin);
    for (let i = 0; i < 4; i++) {
      const snap = await withTimeout(candidateRef.once('value'), FB_OP_TIMEOUT);
      if (!snap.exists() || snap.val()?.status === 'finished' || snap.val()?.status === 'cancelled') break;
      pin = generateRoomPin();
      candidateRef = db.ref('classrooms/' + pin);
    }

    cleanupRoomListeners();
    HostState.roomCode = pin;
    HostState.currentQuestionIndex = -1;
    HostState.players = {};
    HostState.responses = {};
    HostState.totalCorrectAllRounds = 0;
    HostState.totalResponsesAllRounds = 0;
    HostState.status = 'lobby';
    roomRef = candidateRef;

    const sessionPayload = {
      host: cleanHost,
      status: 'lobby',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      settings: {
        difficulty: HostState.difficulty,
        testament: HostState.testament,
        numQuestions: questions.length,
        timePerQuestion: HostState.timePerQuestion,
        twistEnabled: HostState.twistEnabled
      },
      currentQuestion: -1,
      clueRevealed: false,
      questions,
      players: {},
      responses: {}
    };

    await withTimeout(roomRef.set(sessionPayload), FB_OP_TIMEOUT);

    // Save room in URL & sessionStorage so accidental page refresh recovers seamlessly
    sessionStorage.setItem('wb_host_room', pin);
    history.replaceState(null, '', `?room=${encodeURIComponent(pin)}`);

    renderLobbyMetadata();
    attachLobbyListeners();
    showScreen('lobby-screen');
    showToast(`Room ${pin} is live! Share the PIN with your players.`, 'success');
  } catch (err) {
    console.error('[Host] Create session error:', err);
    showToast(err.message || 'Failed to create session.', 'error', 4500);
  } finally {
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.innerHTML = '<span>🚀 Create Live Room</span>';
    }
  }
}

async function tryReconnectSession(pin) {
  try {
    const db = window.FirebaseConfig.getDatabase();
    const candidateRef = db.ref('classrooms/' + pin);
    const snap = await withTimeout(candidateRef.once('value'), 6000);
    if (!snap.exists()) {
      history.replaceState(null, '', window.location.pathname);
      return;
    }
    const data = snap.val();
    if (!data || data.status === 'finished' || data.status === 'cancelled') {
      history.replaceState(null, '', window.location.pathname);
      return;
    }

    roomRef = candidateRef;
    HostState.roomCode = pin;
    HostState.hostName = data.host || 'Host';
    HostState.difficulty = data.settings?.difficulty || 'medium';
    HostState.testament = data.settings?.testament || 'all';
    HostState.numQuestions = data.settings?.numQuestions || (data.questions || []).length || 10;
    HostState.timePerQuestion = data.settings?.timePerQuestion || 20;
    HostState.twistEnabled = data.settings?.twistEnabled !== false;
    HostState.questions = Array.isArray(data.questions) ? data.questions : Object.values(data.questions || {});
    HostState.players = data.players || {};
    HostState.currentQuestionIndex = typeof data.currentQuestion === 'number' ? data.currentQuestion : -1;
    HostState.status = data.status || 'lobby';

    renderLobbyMetadata();
    attachLobbyListeners();

    if (HostState.status === 'lobby' || HostState.currentQuestionIndex < 0) {
      showScreen('lobby-screen');
      showToast(`Reconnected to Room ${pin}!`, 'success');
    } else if (HostState.status === 'question') {
      // Resume active question cleanly
      HostState.currentQuestionIndex -= 1;
      await nextQuestion();
      showToast(`Reconnected to live Room ${pin}!`, 'success');
    } else if (HostState.status === 'results') {
      HostState.responses = data.responses || {};
      renderResultsBreakdown();
      showScreen('results-screen');
      showToast(`Reconnected to Room ${pin}!`, 'success');
    } else if (HostState.status === 'leaderboard') {
      renderLeaderboardRows();
      showScreen('leaderboard-screen');
      showToast(`Reconnected to Room ${pin}!`, 'success');
    }
  } catch (err) {
    console.warn('[Host] Reconnect skipped:', err);
  }
}

function renderLobbyMetadata() {
  const pin = HostState.roomCode;
  const baseUrl = getJoinBaseUrl();
  const displayDomain = window.location.host + window.location.pathname.replace(/\/host(\.html)?$/i, '');
  const directJoinUrl = `${baseUrl}?pin=${encodeURIComponent(pin)}`;

  const roomPinEl = document.getElementById('room-pin');
  if (roomPinEl) roomPinEl.textContent = pin;

  const topbarPinWrap = document.getElementById('topbar-live-pin');
  const topbarPinCode = document.getElementById('topbar-pin-code');
  const topbarDomain = document.getElementById('topbar-join-domain');
  if (topbarPinWrap) topbarPinWrap.style.display = 'inline-flex';
  if (topbarPinCode) topbarPinCode.textContent = pin;
  if (topbarDomain) topbarDomain.textContent = displayDomain;

  const joinUrlEl = document.getElementById('join-url');
  if (joinUrlEl) joinUrlEl.textContent = displayDomain;

  const lobbyHostEl = document.getElementById('lobby-host-name');
  if (lobbyHostEl) lobbyHostEl.textContent = HostState.hostName;

  const summaryChip = document.getElementById('lobby-settings-summary');
  if (summaryChip) {
    const scopeLabel = HostState.testament === 'ot' ? 'Old Testament' : HostState.testament === 'nt' ? 'New Testament' : 'Full Bible';
    summaryChip.textContent = `${HostState.difficulty.toUpperCase()} • ${ scopeLabel } • ${HostState.questions.length} Qs • ${HostState.timePerQuestion}s`;
  }

  // Render QR Code with clean fallback if offline
  const qrBox = document.getElementById('qr-code');
  const qrWrap = document.getElementById('qr-card-wrap');
  if (qrBox && qrWrap) {
    qrWrap.style.display = 'flex';
    const img = document.createElement('img');
    img.alt = `Scan to join room ${pin}`;
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(directJoinUrl)}`;
    img.onerror = () => { qrWrap.style.display = 'none'; };
    qrBox.innerHTML = '';
    qrBox.appendChild(img);
  }
}

function attachLobbyListeners() {
  if (!roomRef) return;
  roomRef.child('players').off();
  let previousCount = Object.keys(HostState.players || {}).length;

  roomRef.child('players').on('value', (snap) => {
    const players = snap.val() || {};
    const newCount = Object.keys(players).length;
    if (newCount > previousCount && HostState.status === 'lobby') {
      HostAudio.joinPop();
    }
    previousCount = newCount;
    HostState.players = players;
    updateLobbyRosterUI();

    const totalPlayersEl = document.getElementById('total-players');
    if (totalPlayersEl) totalPlayersEl.textContent = String(newCount);
  });
}

function updateLobbyRosterUI() {
  const entries = Object.entries(HostState.players || {}).filter(([, p]) => p);
  const count = entries.length;

  const countEl = document.getElementById('player-count');
  const labelEl = document.getElementById('player-count-label');
  if (countEl) countEl.textContent = String(count);
  if (labelEl) labelEl.textContent = count === 1 ? 'Player Joined' : 'Players Joined';

  const startBtn = document.getElementById('btn-start-quiz');
  const startTxt = document.getElementById('btn-start-quiz-text');
  const previewBtn = document.getElementById('btn-start-solo-preview');
  if (startBtn && startTxt) {
    startBtn.disabled = count === 0;
    startTxt.textContent = count > 0
      ? `🚀 Start Quiz (${count} Player${count === 1 ? '' : 's'} Ready)`
      : 'Waiting for at least 1 player…';
  }
  if (previewBtn) {
    previewBtn.style.display = count === 0 ? 'inline-flex' : 'none';
  }

  const listEl = document.getElementById('players-list');
  if (!listEl) return;

  if (count === 0) {
    listEl.innerHTML = `
      <div class="empty-lobby-state">
        <div class="empty-lobby-radar">📡</div>
        <h3>Waiting for players to join…</h3>
        <p>Players will appear here live as soon as they enter PIN <strong>${escapeHtml(HostState.roomCode)}</strong>!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  entries.forEach(([pid, player]) => {
    const name = String(player.name || 'Player');
    const initials = name.trim().slice(0, 2).toUpperCase() || 'WB';
    const chip = document.createElement('div');
    chip.className = 'lobby-player-chip';
    chip.innerHTML = `
      <span class="chip-avatar">${escapeHtml(initials)}</span>
      <span class="chip-name">${escapeHtml(name)}</span>
      <button type="button" class="chip-kick-btn" title="Remove player" aria-label="Remove ${escapeHtml(name)}">✕</button>
    `;
    chip.querySelector('.chip-kick-btn').addEventListener('click', () => {
      if (roomRef) roomRef.child(`players/${pid}`).remove();
    });
    listEl.appendChild(chip);
  });
}

// ==========================================
// QUESTION GENERATION (Grammatical + Clue Metadata)
// ==========================================
function isValidField(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  const bad = ['to be researched', 'unknown', 'n/a', 'tbd', 'none', '', 'null', 'undefined', 'not specified', 'varies'];
  return !bad.includes(s) && s.length > 2;
}

function cleanPredicate(event) {
  if (!event) return 'walked faithfully in Scripture';
  const e = String(event).trim();
  const words = e.split(/\s+/);
  const first = words[0].toLowerCase();
  const rest = words.slice(1).join(' ');
  const passive = new Set([
    'swallowed', 'sold', 'turned', 'visited', 'betrayed', 'raised', 'called',
    'anointed', 'cast', 'fed', 'taken', 'converted', 'shipwrecked', 'beheaded',
    'exiled', 'dedicated', 'born', 'struck', 'stoned', 'chosen', 'saved',
    'blinded', 'imprisoned', 'released', 'buried', 'renamed', 'deceived', 'delivered'
  ]);
  if (passive.has(first)) return `was ${first} ${rest}`;
  const nouns = new Set(['judge', 'first', 'second', 'ancestor', 'father', 'son', 'brother', 'mother', 'sister', 'prophet', 'priest', 'king', 'queen']);
  if (nouns.has(first)) {
    const art = first === 'ancestor' ? 'an' : (first === 'first' || first === 'second') ? 'the' : 'a';
    return `was ${art} ${first} ${rest}`;
  }
  return `${first} ${rest}`;
}

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(count, difficulty, testament) {
  let pool = PEOPLE_DATA.slice();

  if (testament === 'ot' || testament === 'nt') {
    const tPool = pool.filter((p) => p.testament === testament);
    if (tPool.length >= 6) pool = tPool;
  }

  let filtered = pool;
  if (difficulty === 'easy') {
    filtered = pool.filter((p) => p.difficulty === 'easy');
  } else if (difficulty === 'medium') {
    filtered = pool.filter((p) => p.difficulty === 'easy' || p.difficulty === 'medium');
  } else if (difficulty === 'hard') {
    filtered = pool.filter((p) => p.difficulty === 'medium' || p.difficulty === 'hard');
  }
  if (filtered.length < Math.min(count, 8)) filtered = pool;

  const candidates = shuffleArr(filtered);
  const allNames = pool.map((p) => p.name).filter(Boolean);
  const rolesFallback = [
    'Prophet of the Lord', 'King of Israel', 'Queen of Persia', 'Apostle of Jesus Christ',
    'Judge of Israel', 'High Priest', 'Fisherman and Disciple', 'Tentmaker and Missionary'
  ];
  const mothersFallback = ['Sarah', 'Rebekah', 'Rachel', 'Leah', 'Hannah', 'Elizabeth', 'Jochebed', 'Ruth'];
  const fathersFallback = ['Abraham', 'Isaac', 'Jacob', 'Jesse', 'David', 'Zechariah', 'Amram', 'Noah'];

  const built = [];
  const usedPeople = new Set();

  for (const person of candidates) {
    if (built.length >= count) break;
    if (!person || !person.name || usedPeople.has(person.name)) continue;

    const events = (person.notable_events || []).filter(isValidField);
    const types = [];
    if (events.length) {
      types.push('whoAmI', 'whoDid', 'whichEvent');
    }
    if (isValidField(person.occupation)) types.push('occupation');
    if (isValidField(person.mother)) types.push('mother');
    if (isValidField(person.father)) types.push('father');
    if (!types.length) continue;

    const qType = types[Math.floor(Math.random() * types.length)];
    let prompt = '';
    let answer = '';
    let distractors = [];

    if (qType === 'whoAmI') {
      const ev = events[Math.floor(Math.random() * events.length)];
      prompt = `I ${cleanPredicate(ev)}. Who am I?`;
      answer = person.name;
      distractors = shuffleArr(allNames.filter((n) => n !== answer));
    } else if (qType === 'whoDid') {
      const ev = events[Math.floor(Math.random() * events.length)];
      prompt = `Who in Scripture ${cleanPredicate(ev)}?`;
      answer = person.name;
      distractors = shuffleArr(allNames.filter((n) => n !== answer));
    } else if (qType === 'whichEvent') {
      const ev = events[Math.floor(Math.random() * events.length)];
      prompt = `Which notable scriptural account is recorded for ${person.name}?`;
      answer = ev;
      const otherEvs = [];
      for (const other of pool) {
        if (other.name !== person.name && Array.isArray(other.notable_events)) {
          other.notable_events.forEach((oe) => {
            if (isValidField(oe) && oe !== answer) otherEvs.push(oe);
          });
        }
      }
      distractors = shuffleArr(otherEvs);
    } else if (qType === 'occupation') {
      prompt = `What was the biblical calling or role of ${person.name}?`;
      answer = person.occupation.split(',')[0].trim();
      const rolePool = pool.map((p) => (p.occupation || '').split(',')[0].trim()).filter((r) => isValidField(r) && r.toLowerCase() !== answer.toLowerCase());
      distractors = shuffleArr([...new Set([...rolePool, ...rolesFallback])].filter((r) => r.toLowerCase() !== answer.toLowerCase()));
    } else if (qType === 'mother') {
      prompt = `Who is recorded in Scripture as the mother of ${person.name}?`;
      answer = person.mother.trim();
      const mPool = pool.map((p) => p.mother).filter((m) => isValidField(m) && m !== answer);
      distractors = shuffleArr([...new Set([...mPool, ...mothersFallback])].filter((m) => m !== answer));
    } else if (qType === 'father') {
      prompt = `Who is recorded in Scripture as the father of ${person.name}?`;
      answer = person.father.trim();
      const fPool = pool.map((p) => p.father).filter((f) => isValidField(f) && f !== answer);
      distractors = shuffleArr([...new Set([...fPool, ...fathersFallback])].filter((f) => f !== answer));
    }

    const uniqueOptions = [answer];
    for (const d of distractors) {
      if (uniqueOptions.length >= 4) break;
      if (d && !uniqueOptions.some((x) => x.toLowerCase() === d.toLowerCase())) {
        uniqueOptions.push(d);
      }
    }
    if (uniqueOptions.length < 4) continue;

    const options = shuffleArr(uniqueOptions);
    const correctIndex = options.indexOf(answer);

    built.push({
      type: qType,
      prompt,
      options,
      correctIndex,
      correctAnswer: answer,
      person: person.name,
      verses: Array.isArray(person.verses) ? person.verses.slice(0, 3) : [],
      bio: person.short_bio || ''
    });
    usedPeople.add(person.name);
  }

  return built.slice(0, count);
}

function getQuestionTypeLabel(type) {
  const map = {
    whoAmI: '🔍 Who Am I?',
    whoDid: '⚡ Biblical Deed',
    whichEvent: '📜 Scripture Account',
    occupation: '👑 Calling & Role',
    mother: '🌿 Family Lineage',
    father: '🌿 Family Lineage'
  };
  return map[type] || '📖 Scripture Trivia';
}

// ==========================================
// QUIZ FLOW: START -> QUESTION -> RESULTS -> STANDINGS -> PODIUM
// ==========================================
async function startQuiz(allowZeroPlayers = false) {
  const playerCount = Object.keys(HostState.players || {}).length;
  if (!allowZeroPlayers && playerCount === 0) {
    showToast('Wait for at least 1 player to join, or click "Start Projector Preview".', 'warning');
    return;
  }

  HostState.currentQuestionIndex = -1;
  HostAudio.ensure();

  // Show exciting 3-2-1 Get Ready overlay before Question 1
  if (roomRef) {
    await roomRef.update({
      status: 'starting',
      lastActivity: Date.now()
    }).catch(() => {});
  }

  await runGetReadyCountdown(1);
  await nextQuestion();
}

function runGetReadyCountdown(qNumber) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-number');
    const lblEl = document.getElementById('countdown-label');
    if (!overlay || !numEl) {
      resolve();
      return;
    }

    clearInterval(HostState.countdownInterval);
    let secs = 3;
    if (lblEl) lblEl.textContent = `Get Ready! Question ${qNumber} starting in…`;
    numEl.textContent = String(secs);
    overlay.style.display = 'flex';
    HostAudio.tick(false);

    HostState.countdownInterval = setInterval(() => {
      secs -= 1;
      if (secs > 0) {
        numEl.textContent = String(secs);
        HostAudio.tick(false);
      } else {
        clearInterval(HostState.countdownInterval);
        HostState.countdownInterval = null;
        overlay.style.display = 'none';
        resolve();
      }
    }, 850);
  });
}

async function nextQuestion() {
  clearQuestionTimers();
  HostState.isEndingQuestion = false;
  HostState.clueRevealed = false;
  HostState.currentQuestionIndex += 1;

  if (HostState.currentQuestionIndex >= HostState.questions.length) {
    await finishSession();
    return;
  }

  const qIdx = HostState.currentQuestionIndex;
  const question = HostState.questions[qIdx];
  const now = Date.now();
  HostState.questionStartTime = now;
  HostState.responses = {};
  HostState.status = 'question';

  // Sync Firebase atomically so all player phones load the question immediately
  if (roomRef) {
    await roomRef.update({
      status: 'question',
      currentQuestion: qIdx,
      questionStartTime: now,
      clueRevealed: false,
      responses: null,
      lastActivity: now
    });
  }

  renderLiveQuestionUI(question, qIdx);
  showScreen('question-screen');
  listenForRoundResponses();
  startQuestionCountdown();
}

function renderLiveQuestionUI(question, qIdx) {
  const totalQ = HostState.questions.length;
  const pct = Math.round(((qIdx + 1) / totalQ) * 100);
  const prog = document.getElementById('question-progress-fill');
  if (prog) prog.style.width = `${pct}%`;

  document.getElementById('current-q').textContent = String(qIdx + 1);
  document.getElementById('total-q').textContent = String(totalQ);
  document.getElementById('question-type').textContent = getQuestionTypeLabel(question.type);
  document.getElementById('question-text').textContent = question.prompt;

  question.options.forEach((opt, i) => {
    const el = document.getElementById(`option-${i}`);
    if (el) el.textContent = opt;
  });

  // Reset Scripture Clue banner
  const clueBanner = document.getElementById('scripture-clue-banner');
  const clueBtn = document.getElementById('btn-reveal-clue');
  const hasClue = Array.isArray(question.verses) && question.verses.length > 0;
  if (clueBanner) clueBanner.style.display = 'none';
  if (clueBtn) {
    clueBtn.style.display = hasClue ? 'inline-flex' : 'none';
    clueBtn.disabled = false;
    clueBtn.textContent = '📜 Show Scripture Clue';
  }

  const pCount = Object.keys(HostState.players || {}).length;
  document.getElementById('answered-count').textContent = '0';
  document.getElementById('total-players').textContent = String(pCount);
}

function revealScriptureClue(manual = false) {
  if (HostState.clueRevealed) return;
  const question = HostState.questions[HostState.currentQuestionIndex];
  if (!question || !question.verses || !question.verses.length) {
    if (manual) showToast('No verse clue available for this question.', 'info', 2000);
    return;
  }

  HostState.clueRevealed = true;
  const clueText = question.verses[0];
  const banner = document.getElementById('scripture-clue-banner');
  const txtEl = document.getElementById('scripture-clue-text');
  const btn = document.getElementById('btn-reveal-clue');

  if (txtEl) txtEl.textContent = clueText;
  if (banner) banner.style.display = 'inline-flex';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '✓ Clue Shown';
  }

  HostAudio.clue();
  if (roomRef) {
    roomRef.child('clueRevealed').set(true).catch(() => {});
  }
}

function startQuestionCountdown() {
  const totalSecs = HostState.timePerQuestion;
  HostState.timeRemaining = totalSecs;
  const halfPoint = Math.max(4, Math.floor(totalSecs / 2));

  updateTimerRingUI(totalSecs, totalSecs);

  HostState.timerInterval = setInterval(() => {
    HostState.timeRemaining -= 1;
    const rem = Math.max(0, HostState.timeRemaining);
    updateTimerRingUI(rem, totalSecs);

    // Who-Bible Twist: Auto-reveal Scripture Clue halfway through the timer!
    if (HostState.twistEnabled && !HostState.clueRevealed && rem === halfPoint) {
      revealScriptureClue(false);
    }

    if (rem > 0 && rem <= 5) {
      HostAudio.tick(true);
    }

    if (HostState.timeRemaining <= 0) {
      endQuestion();
    }
  }, 1000);
}

function updateTimerRingUI(rem, total) {
  const valEl = document.getElementById('timer-value');
  const ringBar = document.getElementById('timer-ring-bar');
  if (valEl) valEl.textContent = String(rem);
  if (ringBar) {
    const ratio = total > 0 ? rem / total : 0;
    const offset = RING_CIRCUMFERENCE * (1 - ratio);
    ringBar.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    ringBar.style.strokeDashoffset = `${offset}`;
    ringBar.classList.toggle('urgent', rem <= 5);
  }
}

function listenForRoundResponses() {
  if (!roomRef) return;
  roomRef.child('responses').off();
  roomRef.child('responses').on('value', (snap) => {
    HostState.responses = snap.val() || {};
    const answeredCount = Object.keys(HostState.responses).length;
    const totalPlayers = Object.keys(HostState.players || {}).length;

    const ansEl = document.getElementById('answered-count');
    const totEl = document.getElementById('total-players');
    if (ansEl) ansEl.textContent = String(answeredCount);
    if (totEl) totEl.textContent = String(totalPlayers);

    // Auto-end smoothly once every connected player has locked in!
    if (totalPlayers > 0 && answeredCount >= totalPlayers && !HostState.isEndingQuestion && !HostState.autoAdvanceTimeout) {
      HostState.autoAdvanceTimeout = setTimeout(() => {
        endQuestion();
      }, 1100);
    }
  });
}

function clearQuestionTimers() {
  if (HostState.timerInterval) {
    clearInterval(HostState.timerInterval);
    HostState.timerInterval = null;
  }
  if (HostState.autoAdvanceTimeout) {
    clearTimeout(HostState.autoAdvanceTimeout);
    HostState.autoAdvanceTimeout = null;
  }
}

async function endQuestion() {
  if (HostState.isEndingQuestion || HostState.status !== 'question') return;
  HostState.isEndingQuestion = true;
  clearQuestionTimers();

  if (roomRef) roomRef.child('responses').off();

  // Fetch authoritative snapshot of responses before scoring
  if (roomRef) {
    try {
      const snap = await withTimeout(roomRef.child('responses').once('value'), 4000);
      HostState.responses = snap.val() || HostState.responses || {};
    } catch (_) {}
  }

  const question = HostState.questions[HostState.currentQuestionIndex];
  const playerIds = Object.keys(HostState.players || {});
  const updates = {};

  playerIds.forEach((pid) => {
    const p = HostState.players[pid] || { name: 'Player', score: 0, correct: 0, streak: 0 };
    const resp = HostState.responses[pid];
    const answeredCorrectly = !!(resp && Number(resp.answer) === Number(question.correctIndex));

    if (resp) {
      HostState.totalResponsesAllRounds += 1;
      if (answeredCorrectly) HostState.totalCorrectAllRounds += 1;
    }

    let roundPoints = 0;
    let newStreak = 0;

    if (answeredCorrectly) {
      const rawTime = Math.max(0, Number(resp.timeTaken) || 0);
      const speedRatio = Math.max(0, Math.min(1, 1 - rawTime / (HostState.timePerQuestion || 20)));
      const speedScore = Math.round(500 + 500 * speedRatio); // 500..1000 pts
      newStreak = (p.streak || 0) + 1;
      const streakBonus = (HostState.twistEnabled && newStreak >= 2) ? Math.min(300, (newStreak - 1) * 100) : 0;
      roundPoints = speedScore + streakBonus;
    }

    const updatedPlayer = {
      ...p,
      score: (p.score || 0) + roundPoints,
      correct: (p.correct || 0) + (answeredCorrectly ? 1 : 0),
      streak: newStreak,
      lastRoundPoints: roundPoints,
      lastRoundCorrect: answeredCorrectly,
      lastAnswerIndex: resp && resp.answer !== undefined ? Number(resp.answer) : -1,
      lastCorrectAnswer: question.correctAnswer
    };

    HostState.players[pid] = updatedPlayer;
    updates[`players/${pid}`] = updatedPlayer;
  });

  HostState.status = 'results';
  updates['status'] = 'results';
  updates['lastActivity'] = Date.now();

  if (roomRef) {
    await roomRef.update(updates).catch((err) => console.warn('[Host] Score update warning:', err));
  }

  HostAudio.reveal();
  renderResultsBreakdown();
  showScreen('results-screen');
}

function renderResultsBreakdown() {
  const question = HostState.questions[HostState.currentQuestionIndex];
  if (!question) return;

  document.getElementById('correct-answer-text').textContent = question.correctAnswer;

  const versePill = document.getElementById('results-verse-pill');
  const bioInsight = document.getElementById('results-bio-insight');
  if (versePill) {
    if (question.verses && question.verses.length) {
      versePill.style.display = 'inline-flex';
      versePill.textContent = `📖 ${question.verses.join(' • ')}`;
    } else {
      versePill.style.display = 'none';
    }
  }
  if (bioInsight) {
    bioInsight.textContent = question.bio || '';
    bioInsight.style.display = question.bio ? 'block' : 'none';
  }

  // Fastest correct responder callout
  const fastestEl = document.getElementById('fastest-responder-pill');
  if (fastestEl) {
    let fastestName = null;
    let fastestTime = Infinity;
    Object.entries(HostState.responses || {}).forEach(([pid, resp]) => {
      if (resp && Number(resp.answer) === Number(question.correctIndex)) {
        const t = Number(resp.timeTaken);
        if (!isNaN(t) && t >= 0 && t < fastestTime) {
          fastestTime = t;
          fastestName = HostState.players[pid]?.name || 'Player';
        }
      }
    });
    if (fastestName) {
      fastestEl.style.display = 'inline-flex';
      fastestEl.textContent = `⚡ Fastest Correct: ${fastestName} (${fastestTime.toFixed(1)}s)`;
    } else {
      fastestEl.style.display = 'none';
    }
  }

  // Distribution bars
  const counts = [0, 0, 0, 0];
  Object.values(HostState.responses || {}).forEach((r) => {
    const idx = Number(r?.answer);
    if (idx >= 0 && idx < 4) counts[idx] += 1;
  });
  const maxCount = Math.max(1, ...counts);

  for (let i = 0; i < 4; i++) {
    const isCorrect = i === Number(question.correctIndex);
    const col = document.getElementById(`dist-col-${i}`);
    const countEl = document.getElementById(`count-${i}`);
    const barEl = document.getElementById(`bar-${i}`);
    const optEl = document.getElementById(`dist-opt-${i}`);
    const checkEl = document.getElementById(`check-${i}`);

    if (col) col.classList.toggle('is-correct', isCorrect);
    if (countEl) countEl.textContent = String(counts[i]);
    if (optEl) optEl.textContent = question.options[i] || '';
    if (checkEl) checkEl.textContent = isCorrect ? '✓' : '';
    if (barEl) {
      const heightPct = counts[i] === 0 ? 6 : Math.max(14, Math.round((counts[i] / maxCount) * 100));
      barEl.style.height = `${heightPct}%`;
    }
  }

  // Update CTA button text depending on whether this was the final question
  const isFinalQuestion = HostState.currentQuestionIndex >= HostState.questions.length - 1;
  const afterTxt = document.getElementById('btn-after-results-text');
  if (afterTxt) {
    afterTxt.textContent = isFinalQuestion ? '🏆 Reveal Final Podium →' : '🏆 Show Standings →';
  }
}

async function handleAfterResultsAction() {
  const isFinalQuestion = HostState.currentQuestionIndex >= HostState.questions.length - 1;
  if (isFinalQuestion) {
    await finishSession();
  } else {
    await showLeaderboard();
  }
}

async function showLeaderboard() {
  HostState.status = 'leaderboard';
  if (roomRef) {
    await roomRef.update({ status: 'leaderboard', lastActivity: Date.now() }).catch(() => {});
  }
  renderLeaderboardRows();
  showScreen('leaderboard-screen');
}

function getSortedPlayers() {
  return Object.entries(HostState.players || {})
    .filter(([, p]) => p)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

function renderLeaderboardRows() {
  const roundLbl = document.getElementById('leaderboard-round-label');
  if (roundLbl) {
    roundLbl.textContent = `After Question ${HostState.currentQuestionIndex + 1} of ${HostState.questions.length}`;
  }

  const listEl = document.getElementById('leaderboard-list');
  if (!listEl) return;

  const sorted = getSortedPlayers().slice(0, 8);
  if (sorted.length === 0) {
    listEl.innerHTML = `<div class="empty-lobby-state"><p>Projector Solo Preview — No connected player devices yet.</p></div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  listEl.innerHTML = sorted.map((p, idx) => {
    const rankDisplay = idx < 3 ? medals[idx] : `#${idx + 1}`;
    const streakBadge = (p.streak || 0) >= 2 ? `<span class="lb-streak">🔥 ${p.streak}x</span>` : '';
    const deltaBadge = (p.lastRoundPoints || 0) > 0 ? `<span class="lb-delta">+${p.lastRoundPoints}</span>` : '';
    return `
      <div class="lb-row ${idx === 0 ? 'rank-1' : ''}" style="animation-delay:${idx * 0.05}s">
        <div class="lb-left">
          <span class="lb-rank">${rankDisplay}</span>
          <span class="lb-name">${escapeHtml(p.name)}</span>
          ${streakBadge}
        </div>
        <div class="lb-right">
          ${deltaBadge}
          <span class="lb-score">${p.score || 0} pts</span>
        </div>
      </div>
    `;
  }).join('');
}

async function endQuizEarly() {
  const confirmed = await showHostConfirm({
    title: 'End Live Session Early?',
    message: 'This will wrap up the quiz and reveal the final podium for everyone.',
    confirmText: 'End & Show Podium',
    cancelText: 'Keep Playing'
  });
  if (!confirmed) return;
  clearQuestionTimers();
  await finishSession();
}

async function finishSession() {
  clearQuestionTimers();
  HostState.status = 'finished';
  if (roomRef) {
    roomRef.child('responses').off();
    await roomRef.update({ status: 'finished', lastActivity: Date.now() }).catch(() => {});
  }

  sessionStorage.removeItem('wb_host_room');
  history.replaceState(null, '', window.location.pathname);

  HostAudio.fanfare();
  renderFinalPodium();
  showScreen('final-screen');
}

function renderFinalPodium() {
  const sorted = getSortedPlayers();
  const stage = document.getElementById('podium-stage');
  const runnersEl = document.getElementById('final-runners-up');

  if (stage) {
    if (sorted.length === 0) {
      stage.innerHTML = `
        <div class="empty-lobby-state">
          <div class="empty-lobby-radar">🏆</div>
          <h3>Session Complete!</h3>
          <p>All questions completed in projector mode.</p>
        </div>
      `;
    } else {
      // Visual podium order: 2nd (left), 1st (center), 3rd (right) — gracefully handles 1, 2, or 3+ players!
      const spots = [];
      if (sorted[1]) spots.push({ rank: 2, medal: '🥈', data: sorted[1] });
      if (sorted[0]) spots.push({ rank: 1, medal: '🥇', data: sorted[0] });
      if (sorted[2]) spots.push({ rank: 3, medal: '🥉', data: sorted[2] });

      stage.innerHTML = spots.map((s) => `
        <div class="podium-spot spot-${s.rank}">
          <div class="podium-medal">${s.medal}</div>
          <div class="podium-player-name">${escapeHtml(s.data.name)}</div>
          <div class="podium-player-score">${s.data.score || 0} pts</div>
          <div class="podium-pillar">${s.rank}</div>
        </div>
      `).join('');
    }
  }

  if (runnersEl) {
    const rest = sorted.slice(3, 10);
    runnersEl.innerHTML = rest.map((p, idx) =>
      `<span class="runner-chip">#${idx + 4} ${escapeHtml(p.name)} — ${p.score || 0} pts</span>`
    ).join('');
  }

  const completedQs = Math.min(HostState.questions.length, Math.max(1, HostState.currentQuestionIndex + 1));
  const accuracy = HostState.totalResponsesAllRounds > 0
    ? Math.round((HostState.totalCorrectAllRounds / HostState.totalResponsesAllRounds) * 100)
    : 0;

  document.getElementById('final-players').textContent = String(sorted.length);
  document.getElementById('final-questions').textContent = String(completedQs);
  document.getElementById('final-accuracy').textContent = `${accuracy}%`;
}

// ==========================================
// COPY HELPERS & SESSION CLEANUP
// ==========================================
async function copyRoomPin() {
  if (!HostState.roomCode) return;
  try {
    await navigator.clipboard.writeText(HostState.roomCode);
    const hint = document.getElementById('pin-copy-hint');
    if (hint) {
      hint.textContent = '✓ PIN Copied!';
      setTimeout(() => { hint.textContent = '📋 Copy PIN'; }, 2200);
    }
    showToast(`Copied Game PIN: ${HostState.roomCode}`, 'success', 2200);
  } catch (_) {
    showToast(`Game PIN: ${HostState.roomCode}`, 'info', 3000);
  }
}

async function copyJoinLink() {
  if (!HostState.roomCode) return;
  const link = `${getJoinBaseUrl()}?pin=${encodeURIComponent(HostState.roomCode)}`;
  try {
    await navigator.clipboard.writeText(link);
    showToast('Direct player join link copied to clipboard!', 'success', 2500);
  } catch (_) {
    showToast(link, 'info', 4000);
  }
}

async function cancelSession() {
  const confirmed = await showHostConfirm({
    title: 'Cancel Waiting Room?',
    message: 'Connected players will be notified that this session was closed.',
    confirmText: 'Close Room',
    cancelText: 'Stay in Lobby'
  });
  if (!confirmed) return;

  if (roomRef) {
    await roomRef.update({ status: 'cancelled' }).catch(() => {});
    setTimeout(() => {
      if (roomRef) roomRef.remove().catch(() => {});
    }, 1500);
  }
  resetForNewSession();
}

function cleanupRoomListeners() {
  clearQuestionTimers();
  if (roomRef) {
    roomRef.off();
    roomRef.child('players').off();
    roomRef.child('responses').off();
    roomRef = null;
  }
}

async function replaySameClassroom() {
  if (!roomRef || !HostState.roomCode) {
    resetForNewSession();
    return;
  }

  clearQuestionTimers();
  const qCount = HostState.questionCount || HostState.questions.length || 10;
  const freshQuestions = generateQuestions(qCount, HostState.difficulty || 'medium', HostState.testament || 'all');

  const resetPlayers = {};
  Object.entries(HostState.players || {}).forEach(([pid, p]) => {
    if (!p) return;
    resetPlayers[pid] = {
      name: p.name || 'Player',
      score: 0,
      correct: 0,
      streak: 0,
      joinedAt: p.joinedAt || Date.now()
    };
  });

  HostState.questions = freshQuestions;
  HostState.players = resetPlayers;
  HostState.responses = {};
  HostState.currentQuestionIndex = -1;
  HostState.totalResponsesAllRounds = 0;
  HostState.totalCorrectAllRounds = 0;
  HostState.isEndingQuestion = false;
  HostState.clueRevealed = false;
  HostState.status = 'lobby';

  try {
    await withTimeout(roomRef.update({
      status: 'lobby',
      currentQuestion: -1,
      questionStartTime: null,
      clueRevealed: false,
      questions: freshQuestions,
      players: resetPlayers,
      responses: null,
      lastActivity: Date.now()
    }), 8000);

    populateLobbyUI(HostState.roomCode);
    updateLobbyRosterUI();
    attachLobbyListeners();
    showScreen('lobby-screen');
    showToast(`Room ${HostState.roomCode} reset with ${freshQuestions.length} fresh questions!`, 'success', 3000);
  } catch (err) {
    showToast('Could not reset room: ' + (err.message || 'Check connection'), 'error', 4000);
  }
}

function resetForNewSession() {
  cleanupRoomListeners();
  sessionStorage.removeItem('wb_host_room');
  history.replaceState(null, '', window.location.pathname);

  const topbarPinWrap = document.getElementById('topbar-live-pin');
  if (topbarPinWrap) topbarPinWrap.style.display = 'none';

  HostState.roomCode = null;
  HostState.players = {};
  HostState.responses = {};
  HostState.questions = [];
  HostState.currentQuestionIndex = -1;
  HostState.status = 'setup';

  showScreen('setup-screen');
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
