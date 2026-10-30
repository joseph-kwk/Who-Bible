// Bible People Challenge — structured app.js

// =========================
// Default People Data
// =========================
// This array is populated from assets/data/people.json during initialization
const DEFAULT_PEOPLE_DATA = [];

// =========================
// State
// =========================
const state = {
  mode: 'idle', // 'solo' | 'timed' | 'challenge' | 'study'
  score: 0,
  streak: 0,
  qnum: 0,
  qtotal: 0,
  questions: [],
  current: null,
  players: [ { name: 'P1', score: 0 }, { name: 'P2', score: 0 } ],
  currentPlayerIndex: 0,
  timerSecondsRemaining: 0,
  timerId: null,
  people: [],
  results: [],
  paused: false,
  theme: 'night',
  currentPlayer: null  // Stores logged-in player info
};

// =========================
// Player Authentication & Stats
// =========================
function loadPlayer() {
  try {
    const playerData = localStorage.getItem('who-bible-player');
    if (playerData) {
      const parsed = JSON.parse(playerData);
      if (parsed && parsed.stats) {
        if (!Number.isFinite(parsed.stats.winRate)) parsed.stats.winRate = 0;
        if (!Number.isFinite(parsed.stats.averageScore)) parsed.stats.averageScore = 0;
      }
      state.currentPlayer = parsed;
      return state.currentPlayer;
    }
  } catch(_) {}
  return null;
}

function savePlayer(player) {
  try {
    localStorage.setItem('who-bible-player', JSON.stringify(player));
    state.currentPlayer = player;
  } catch(_) {}
}

function createGuestPlayer(name = 'Guest') {
  return {
    id: 'guest_' + Date.now(),
    name: name || 'Guest',
    isGuest: true,
    stats: initializeStats(),
    createdAt: new Date().toISOString()
  };
}

function createRegisteredPlayer(name, email) {
  return {
    id: 'player_' + Date.now(),
    name: name,
    email: email || '',
    isGuest: false,
    stats: initializeStats(),
    createdAt: new Date().toISOString()
  };
}

function initializeStats() {
  return {
    gamesPlayed: 0,
    totalScore: 0,
    highestScore: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    averageScore: 0,
    winRate: 0,
    soloGames: 0,
    timedGames: 0,
    challengeGames: 0,
    lastPlayedAt: null,
    favoriteMode: 'solo'
  };
}

function updatePlayerStats(score, streak, correct, total, mode) {
  if (!state.currentPlayer) return;
  if (!total && !state.timedOut) return;
  
  const stats = state.currentPlayer.stats;
  stats.gamesPlayed++;
  stats.totalScore += score;
  stats.highestScore = Math.max(stats.highestScore, score);
  stats.bestStreak = Math.max(stats.bestStreak, streak);
  stats.totalCorrect += correct;
  stats.totalQuestions += total;
  stats.averageScore = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
  stats.winRate = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
  stats.lastPlayedAt = new Date().toISOString();
  
  // Track mode preferences
  if (mode === 'solo') stats.soloGames++;
  else if (mode === 'timed') stats.timedGames++;
  else if (mode === 'challenge') stats.challengeGames++;
  
  // Determine favorite mode
  const modes = {
    solo: stats.soloGames,
    timed: stats.timedGames,
    challenge: stats.challengeGames
  };
  stats.favoriteMode = Object.keys(modes).reduce((a, b) => modes[a] > modes[b] ? a : b);
  
  savePlayer(state.currentPlayer);
}

function promptForPlayerName() {
  // Show custom modal instead of prompt
  const modal = document.getElementById('change-player-modal');
  const input = document.getElementById('new-player-name');
  const btnSave = document.getElementById('btn-change-player-save');
  const btnCancel = document.getElementById('btn-change-player-cancel');
  const btnClose = document.getElementById('btn-change-player-close');
  
  if (!modal || !input) return Promise.resolve(null);
  
  const currentName = state.currentPlayer ? state.currentPlayer.name : 'Guest';
  input.value = currentName;
  modal.style.display = 'flex';
  setTimeout(() => { input.focus(); input.select(); }, 100);
  // Animate Save button when input changes
  let lastValue = input.value;
  input.addEventListener('input', () => {
    if (input.value.trim() !== lastValue) {
      btnSave.style.boxShadow = '0 0 0 2px var(--primary-color)';
      setTimeout(() => { btnSave.style.boxShadow = ''; }, 400);
      lastValue = input.value.trim();
    }
  });
  
  return new Promise((resolve) => {
    const close = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(null); // Cancelled
    };
    
    const save = () => {
      const name = input.value.trim();
      modal.style.display = 'none';
      cleanup();
      if (name) {
        const newPlayer = createGuestPlayer(name);
        // Preserve stats if just renaming Guest
        if (state.currentPlayer && state.currentPlayer.name === 'Guest') {
          newPlayer.stats = state.currentPlayer.stats;
        }
        state.currentPlayer = newPlayer;
        savePlayer(newPlayer);
        
        // SYNC WITH COMMUNITY PROFILE: Update displayName in communityProfile too
        try {
          const profileData = localStorage.getItem('communityProfile');
          if (profileData) {
            const profile = JSON.parse(profileData);
            profile.displayName = name;
            localStorage.setItem('communityProfile', JSON.stringify(profile));
          }
          localStorage.setItem('who-bible-profile-name', name); // For reports
        } catch(_) {}
        
        showToast({ title: getText('welcome') || 'Welcome', msg: `${getText('welcomePlayer') || 'Welcome'}, ${newPlayer.name}!`, type: 'success', timeout: 2000 });
        resolve(newPlayer);
      } else {
        resolve(null);
      }
    };
    
    const handleKey = (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') close();
    };
    
    const cleanup = () => {
      btnSave.removeEventListener('click', save);
      btnCancel.removeEventListener('click', close);
      btnClose.removeEventListener('click', close);
      input.removeEventListener('keydown', handleKey);
    };
    
    btnSave.addEventListener('click', save);
    btnCancel.addEventListener('click', close);
    btnClose.addEventListener('click', close);
    input.addEventListener('keydown', handleKey);
  });
}

function getPlayerStats() {
  if (!state.currentPlayer) return null;
  return state.currentPlayer.stats;
}

function displayPlayerInfo() {
  if (!state.currentPlayer) return;
  const welcomeEl = document.getElementById('welcome-message');
  if (welcomeEl) {
    welcomeEl.innerHTML = '';
    welcomeEl.style.display = 'none';
  }
  updatePlayerDisplayName();
}

function computePlayerRank(stats) {
  if (!stats) return { rank: 'Scripture Seeker', level: 1, icon: '🕊️', xpPercent: 20 };
  const totalXP = (stats.highestScore || 0) * 2 + (stats.gamesPlayed || 0) * 25 + (stats.bestStreak || 0) * 15;
  
  if (totalXP >= 1000) return { rank: 'Master Theologian', level: 5, icon: '👑', xpPercent: 100, totalXP };
  if (totalXP >= 600) return { rank: 'Biblical Sage', level: 4, icon: '🛡️', xpPercent: Math.min(100, Math.round(((totalXP - 600) / 400) * 100)), totalXP };
  if (totalXP >= 300) return { rank: 'Faith Scholar', level: 3, icon: '📖', xpPercent: Math.min(100, Math.round(((totalXP - 300) / 300) * 100)), totalXP };
  if (totalXP >= 100) return { rank: 'Bible Explorer', level: 2, icon: '🌟', xpPercent: Math.min(100, Math.round(((totalXP - 100) / 200) * 100)), totalXP };
  return { rank: 'Scripture Seeker', level: 1, icon: '🕊️', xpPercent: Math.min(100, Math.round((totalXP / 100) * 100)), totalXP };
}

function updatePlayerDisplayName() {
  if (!state.currentPlayer) return;
  const playerNameEl = document.getElementById('current-player-name');
  const avatarIconEl = document.getElementById('player-avatar-icon');
  const rankDisplayEl = document.getElementById('player-rank-display');
  const xpFillEl = document.getElementById('player-xp-fill');

  const name = state.currentPlayer.name || 'Guest';
  const avatar = state.currentPlayer.avatar || '👑';
  const rankInfo = computePlayerRank(state.currentPlayer.stats);

  if (playerNameEl) playerNameEl.textContent = name;
  if (avatarIconEl) avatarIconEl.textContent = avatar;
  if (rankDisplayEl) rankDisplayEl.textContent = `${rankInfo.icon} ${rankInfo.rank}`;
  if (xpFillEl) xpFillEl.style.width = `${Math.max(15, rankInfo.xpPercent)}%`;
}

function triggerScorePop(points = 10) {
  const popEl = document.getElementById('score-pop');
  if (popEl) {
    popEl.textContent = `+${points}`;
    popEl.classList.remove('pop-active');
    void popEl.offsetWidth; // Trigger reflow
    popEl.classList.add('pop-active');
  }
}

function updateStreakHUD(streak) {
  const streakEl = document.getElementById('streak');
  const streakChip = document.getElementById('streak-chip');
  const flameIcon = document.getElementById('streak-flame');
  if (streakEl) streakEl.textContent = streak;
  if (streakChip && flameIcon) {
    if (streak >= 3) {
      streakChip.classList.add('flame-active');
      flameIcon.classList.add('flame-pulsing');
    } else {
      streakChip.classList.remove('flame-active');
      flameIcon.classList.remove('flame-pulsing');
    }
  }
}

// =========================
// Web Audio Sound FX Engine
// =========================
const SoundFX = {
  ctx: null,
  enabled: true,

  init() {
    try {
      const saved = localStorage.getItem('who-bible-sound-enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (_) {}
    this.updateToggleIcon();
  },

  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('who-bible-sound-enabled', String(this.enabled));
    } catch (_) {}
    this.updateToggleIcon();
    if (this.enabled) {
      this.playCorrect();
    }
    return this.enabled;
  },

  updateToggleIcon() {
    const iconEl = document.getElementById('sound-icon');
    const btn = document.getElementById('btn-sound-toggle');
    if (iconEl) iconEl.textContent = this.enabled ? '🔊' : '🔇';
    if (btn) {
      btn.setAttribute('title', this.enabled ? 'Sound FX: On (Click to Mute)' : 'Sound FX: Muted (Click to Unmute)');
      btn.setAttribute('aria-label', this.enabled ? 'Mute sound effects' : 'Unmute sound effects');
    }
  },

  playCorrect() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.28);
      });
    } catch (_) {}
  },

  playWrong() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  },

  playStreak() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    } catch (_) {}
  },

  playTick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (_) {}
  },

  playFanfare() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chords = [
        { freqs: [523.25, 659.25, 783.99], time: 0, dur: 0.22 },
        { freqs: [587.33, 698.46, 880.00], time: 0.24, dur: 0.22 },
        { freqs: [659.25, 783.99, 987.77], time: 0.48, dur: 0.25 },
        { freqs: [523.25, 659.25, 783.99, 1046.50], time: 0.74, dur: 0.7 }
      ];
      chords.forEach(c => {
        c.freqs.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + c.time);
          gain.gain.setValueAtTime(0.001, now + c.time);
          gain.gain.exponentialRampToValueAtTime(0.12, now + c.time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + c.time + c.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + c.time);
          osc.stop(now + c.time + c.dur + 0.05);
        });
      });
    } catch (_) {}
  },

  playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }
};
window.SoundFX = SoundFX;

// =========================
// Daily Scripture Challenge
// =========================
function getDailyFigure() {
  const list = (state.people && state.people.length > 0) ? state.people : DEFAULT_PEOPLE_DATA;
  if (!list || list.length === 0) return null;
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % list.length;
  return list[index];
}

function updateDailyChallengeCard() {
  const person = getDailyFigure();
  if (!person) return;
  const nameEl = document.getElementById('daily-figure-name');
  const descEl = document.getElementById('daily-figure-desc');
  const avatarEl = document.getElementById('daily-figure-avatar');
  const dateEl = document.getElementById('daily-date-str');
  
  const options = { month: 'short', day: 'numeric' };
  const dateStr = new Date().toLocaleDateString(undefined, options);
  if (dateEl) dateEl.textContent = `Daily Scripture • ${dateStr}`;
  if (nameEl) nameEl.textContent = person.name;
  if (avatarEl) avatarEl.textContent = getPersonIcon(person);
  if (descEl) {
    const rawEvent = (person.notable_events && person.notable_events.length > 0)
      ? person.notable_events[0]
      : (person.occupation || 'Notable figure in scripture');
    descEl.textContent = `${rawEvent}. Test your knowledge with today's 5-question speed trial!`;
  }
}

async function startDailyChallenge() {
  if (!state.people || state.people.length === 0) {
    await ensurePeopleLoaded();
  }
  if (!state.people || state.people.length === 0) {
    showToast({ title: 'Loading...', msg: 'Please wait a moment for data to load', type: 'info' });
    return;
  }
  SoundFX.playClick();
  showGame();
  gameTitle.textContent = 'Daily Scripture Challenge';
  state.mode = 'daily';
  afterRef.innerText = '';
  state.score = 0;
  state.streak = 0;
  state.qnum = 0;
  state.results = [];
  state.paused = false;

  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) welcomeMsg.style.display = 'none';
  const soloScoreChip = document.querySelector('.chip-score');
  const soloStreakChip = document.querySelector('#streak-chip');
  const progressChip = document.querySelector('.chip-progress');
  const progressTrack = document.querySelector('.progress-container-modern');
  if (soloScoreChip) soloScoreChip.style.display = 'flex';
  if (soloStreakChip) soloStreakChip.style.display = 'flex';
  if (progressChip) progressChip.style.display = 'flex';
  if (progressTrack) progressTrack.style.display = 'block';
  if (versusTurnBanner) versusTurnBanner.style.display = 'none';
  clearAutoAdvance();
  if (btnNext) {
    btnNext.style.display = 'none';
    btnNext.disabled = true;
  }

  const dailyPerson = getDailyFigure();
  const pool = [dailyPerson, ...state.people.filter(p => p.name !== dailyPerson.name)];
  state.questions = pickQuestionSet(5, 'medium', pool);
  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  quizEl.style.display = 'block';
  timerEl.style.display = 'none';
  if (btnPause) btnPause.style.display = 'none';
  challengeStatusEl.style.display = 'none';
  stopTimer();
  nextQuestion();
  resetViewportScroll();
  showToast({ title: 'Daily Challenge Started!', msg: `5 Questions • Featured: ${dailyPerson.name}`, type: 'success', timeout: 2200 });
}

// =========================
// Elements
// =========================
// Panels
const setupPanel = document.getElementById('setup-panel');
const gameArea = document.getElementById('game-area');
const studyPanel = document.getElementById('study-panel');

// Setup elements
const btnSolo = document.getElementById('btn-solo');
const btnTimed = document.getElementById('btn-timed');
const btnChallenge = document.getElementById('btn-challenge');
const btnRemoteChallenge = document.getElementById('btn-remote-challenge');
const btnClassroomMode = document.getElementById('btn-classroom-mode');
const btnStudy = document.getElementById('btn-study');
const btnScenarios = document.getElementById('btn-scenarios');
const difficultySel = document.getElementById('difficulty');
const numQuestionsInput = document.getElementById('num-questions');
const timeLimitInput = document.getElementById('time-limit');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const btnResetData = document.getElementById('btn-reset-data');
const fileInput = document.getElementById('file-input');

// Game elements
const btnBackToSetup = document.getElementById('btn-back-to-setup');
const gameTitle = document.getElementById('game-title');
const quizEl = document.getElementById('quiz');
const qText = document.getElementById('question-text');
const answersEl = document.getElementById('answers');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const qnumEl = document.getElementById('qnum');
const qtotalEl = document.getElementById('qtotal');
const afterRef = document.getElementById('after-ref');
const btnNext = document.getElementById('btn-next');
const btnQuit = document.getElementById('btn-quit');
const btnPause = document.getElementById('btn-pause');
const timerEl = document.getElementById('timer');
// timeRemainingEl is fetched dynamically to avoid stale references if DOM is updated
const challengeStatusEl = document.getElementById('challenge-status');
const currentPlayerEl = document.getElementById('current-player'); // Legacy - kept for compatibility
const currentPlayerTurnNameEl = document.getElementById('current-player-turn-name');
const p1NameEl = document.getElementById('versus-p1-name') || document.getElementById('p1-name');
const p2NameEl = document.getElementById('versus-p2-name') || document.getElementById('p2-name');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const versusP1Card = document.getElementById('versus-p1-card');
const versusP2Card = document.getElementById('versus-p2-card');
const versusTurnBanner = document.getElementById('versus-turn-banner');
const versusTurnBannerText = document.getElementById('versus-turn-banner-text');
const progressBarEl = document.getElementById('progress-bar');

// Study elements
const btnBackFromStudy = document.getElementById('btn-back-from-study');
const searchPerson = document.getElementById('search-person');
const sortSelect = document.getElementById('sort-select');
const filterMother = document.getElementById('filter-mother');
const filterOccupation = document.getElementById('filter-occupation');
const filterAge = document.getElementById('filter-age');
const peopleCountEl = document.getElementById('people-count');

// Language selector
const languageSelect = document.getElementById('language-select');
const btnShuffleList = document.getElementById('btn-shuffle-list');
const btnExpandAll = document.getElementById('btn-expand-all');
const btnCollapseAll = document.getElementById('btn-collapse-all');
const peopleList = document.getElementById('people-list');

// Modal elements
const modalEl = document.getElementById('summary-modal');
const summaryStatsEl = document.getElementById('summary-stats');
const summaryListEl = document.getElementById('summary-list');
const btnSummaryClose = document.getElementById('btn-summary-close');
const btnPlayAgain = document.getElementById('btn-play-again');
const playersModal = document.getElementById('players-modal');
const btnPlayersClose = document.getElementById('btn-players-close');
const btnPlayersCancel = document.getElementById('btn-players-cancel');
const btnPlayersStart = document.getElementById('btn-players-start');
const p1NameInput = document.getElementById('p1-name-input') || document.getElementById('p1-name');
const p2NameInput = document.getElementById('p2-name-input') || document.getElementById('p2-name');

// Remote Challenge Modal elements
const remoteModal = document.getElementById('remote-modal');
const btnRemoteClose = document.getElementById('btn-remote-close');
const btnRemoteCancel = document.getElementById('btn-remote-cancel');
const btnRemoteBack = document.getElementById('btn-remote-back');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnJoinRoom = document.getElementById('btn-join-room');
const btnCreateRoomConfirm = document.getElementById('btn-create-room-confirm');
const btnJoinRoomConfirm = document.getElementById('btn-join-room-confirm');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnShareLink = document.getElementById('btn-share-link');
const btnReadyHost = document.getElementById('btn-ready-host');
const btnReadyGuest = document.getElementById('btn-ready-guest');
const remoteHostNameInput = document.getElementById('remote-host-name');
const remoteJoinNameInput = document.getElementById('remote-join-name');
const remoteRoomCodeInput = document.getElementById('remote-room-code-input');

// Theme and toasts
const btnTheme = document.getElementById('btn-theme');
const toastContainer = document.getElementById('toast-container');
// Nav
const btnShare = document.getElementById('btn-share');
const navCommunity = document.getElementById('nav-community');
const footerCommunity = document.getElementById('footer-community');

// Community elements
// Community elements removed on main page (moved to community.html)

// =========================
// Translation functions (using centralized JSON translations)
// =========================
function translateEvent(event) {
  if (!event) return event;
  const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (window.currentLanguage || 'en'));
  if (lang === 'en') return event;
  try{
    const mapping = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].eventTranslations) || null;
    if(mapping && mapping[event]) return mapping[event];
  }catch(_){ }
  return event; // fallback to original text
}

function translateOccupation(text){
  if(!text) return text;
  const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (window.currentLanguage || 'en'));
  if (lang === 'en') return text;
  try{
    const mapping = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].occupationTranslations) || null;
    if(mapping && mapping[text]) return mapping[text];
  }catch(_){ }
  return text; // fallback to original text
}

function translateName(name){
  if(!name) return name;
  const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (window.currentLanguage || 'en'));
  if (lang === 'en') return name;
  try{
    const mapping = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].nameTranslations) || null;
    if(mapping && mapping[name]) return mapping[name];
  }catch(_){ }
  return name; // fallback to original name
}

function translateScenario(scenario){
  if(!scenario || !scenario.scenario_id) return scenario;
  const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (window.currentLanguage || 'en'));
  if (lang === 'en') return scenario;
  try{
    const mapping = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].scenarioTranslations) || null;
    if(mapping && mapping[scenario.scenario_id]){
      const translated = mapping[scenario.scenario_id];
      return {
        ...scenario,
        theme: translated.theme || scenario.theme,
        challenge: translated.challenge || scenario.challenge,
        options: translated.options || scenario.options,
        explanation: translated.explanation || scenario.explanation
      };
    }
  }catch(_){ }
  return scenario; // fallback to original
}

function translateAnswerForQuestionType(qType, value){
  if(qType==='occupation') return translateOccupation(value);
  if(qType==='whoDid' || qType==='whoAmI' || qType==='mother' || qType==='whoMother' || qType==='father' || qType==='name') return translateName(value);
  if(qType==='whichEvent' || qType==='event') return translateEvent(value);
  return value;
}

// =========================
// Init & Data Bootstrap
// =========================
let peopleLoadPromise = null;

async function ensurePeopleLoaded() {
  if (Array.isArray(state.people) && state.people.length > 0) {
    return state.people;
  }
  if (!peopleLoadPromise) {
    peopleLoadPromise = (async () => {
      try {
        const response = await fetch('assets/data/people.json');
        if (response.ok) {
          const externalData = await response.json();
          if (Array.isArray(externalData) && externalData.length > 0) {
            DEFAULT_PEOPLE_DATA.length = 0;
            DEFAULT_PEOPLE_DATA.push(...externalData);
            console.log('✓ Loaded', externalData.length, 'people from external JSON');
          }
        }
      } catch (error) {
        console.warn('Could not load external people data, using defaults:', error);
      } finally {
        const stored = loadPeopleDataFromLocalStorage();
        state.people = (Array.isArray(stored) && stored.length > 0) ? stored : DEFAULT_PEOPLE_DATA.slice();
        peopleLoadPromise = null;
      }
      return state.people;
    })();
  }
  return peopleLoadPromise;
}

function setSelectValueSafe(selectEl, rawValue, fallbackValue) {
  if (!selectEl) return;
  let val = String(rawValue ?? fallbackValue);
  // Migrate legacy setting values seamlessly
  if (selectEl.id === 'gender-filter') {
    if (val === 'men') val = 'male';
    else if (val === 'women') val = 'female';
  } else if (selectEl.id === 'time-limit') {
    if (val === '15') val = '30';
  }
  const hasOption = Array.from(selectEl.options || []).some(opt => opt.value === val);
  selectEl.value = hasOption ? val : String(fallbackValue);
}

async function init(){
  console.log('Initializing app...');
  window.state = state;
  window.showToast = showToast;
  window.showConfirmDialog = showConfirmDialog;
  SoundFX.init();
  initUniversalModalScrollLock();
  attachHandlers(); // Attach listeners immediately
  initFeedback(); // Initialize feedback system
  initSettingsPills(); // Initialize pill toggle settings UI
  setupModernShareEvents(); // Wire share modal copy & native share actions
  setupSimplifiedStudyControls(); // Wire Study Mode search, sort & filter tabs
  
  // Set default settings if not present
  const defaultSettings = {
    difficulty: 'medium',
    numQuestions: 10,
    timeLimit: 60,
    testamentFilter: 'all',
    genderFilter: 'all',
    theme: 'night',
    language: 'en'
  };
  let savedSettings = loadSettings();
  if(!savedSettings){
    savedSettings = { ...defaultSettings };
    localStorage.setItem('settings', JSON.stringify(savedSettings));
  }
  // Apply settings safely to UI and state (including Testament & Figures filters)
  setSelectValueSafe(difficultySel, savedSettings.difficulty, defaultSettings.difficulty);
  setSelectValueSafe(numQuestionsInput, savedSettings.numQuestions, defaultSettings.numQuestions);
  setSelectValueSafe(timeLimitInput, savedSettings.timeLimit, defaultSettings.timeLimit);
  setSelectValueSafe(document.getElementById('testament-filter'), savedSettings.testamentFilter, defaultSettings.testamentFilter);
  setSelectValueSafe(document.getElementById('gender-filter'), savedSettings.genderFilter, defaultSettings.genderFilter);
  saveSettingsFromUI();
  
  // Sync pills & preset buttons to reflect loaded settings
  syncPillsFromSelects();
  
  // Ensure theme is applied - force initial application
  const themeToApply = savedSettings.theme || defaultSettings.theme;
  applyTheme(themeToApply);
  // Set language
  const savedLang = localStorage.getItem('who-bible-language');
  if (savedLang && TRANSLATIONS[savedLang] !== undefined) {
    setLanguage(savedLang);
  } else if(savedSettings.language && TRANSLATIONS[savedSettings.language] !== undefined) {
    setLanguage(savedSettings.language);
  } else {
    setLanguage(defaultSettings.language);
  }

  // Load people data immediately before secondary modules so quiz modes are ready right away
  await ensurePeopleLoaded();
  updateDailyChallengeCard();
  renderPeopleList();
  
  // Initialize relationship graph
  if (window.RelationshipSystem) {
    RelationshipSystem.buildRelationshipGraph(state.people);
    console.log('✓ Relationship graph built for', state.people.length, 'people');
  }
  
  // Initialize Scenarios, Locations, and Concepts modules
  if (window.ScenarioModule) {
    await window.ScenarioModule.init();
    console.log('✓ Scenarios module loaded:', window.ScenarioModule.scenarios.length, 'scenarios');
  }
  
  if (window.LocationModule) {
    await window.LocationModule.init();
    console.log('✓ Locations module loaded:', window.LocationModule.locations.length, 'locations');
  }
  
  if (window.ConceptModule) {
    await window.ConceptModule.init();
    console.log('✓ Concepts module loaded:', window.ConceptModule.concepts.length, 'concepts');
  }
  
  // Initialize Firebase and show Remote Challenge / handle deep-link PINs
  const activateFirebaseFeatures = () => {
    if (!window.FirebaseConfig || !window.FirebaseConfig.isAvailable()) return false;
    if (btnRemoteChallenge) {
      btnRemoteChallenge.style.display = 'block';
    }
    if (!window._wbDeepLinkChecked) {
      window._wbDeepLinkChecked = true;
      const urlParams = new URLSearchParams(window.location.search);
      const pinFromUrl = urlParams.get('pin');
      const roomCodeFromUrl = window.RemoteChallenge?.getRoomCodeFromUrl();

      if (pinFromUrl) {
        setTimeout(() => promptClassroomJoin(pinFromUrl), 250);
      } else if (roomCodeFromUrl) {
        setTimeout(() => {
          if (window.RemoteChallengeUI) {
            window.RemoteChallengeUI.show();
            window.RemoteChallengeUI.showStep('join');
            const input = document.getElementById('remote-room-code-input');
            if (input) input.value = roomCodeFromUrl;
          }
        }, 250);
      }
    }
    return true;
  };

  if (!activateFirebaseFeatures()) {
    window.addEventListener('firebase:ready', () => {
      activateFirebaseFeatures();
    }, { once: true });
  }
  
  // Load or create player
  const player = loadPlayer();
  if (player) {
    state.currentPlayer = player;
    displayPlayerInfo();
  } else {
    // Create a guest player by default (no prompt)
    // User can change name later via "Change Player" button
    const guestPlayer = createGuestPlayer('Guest');
    state.currentPlayer = guestPlayer;
    savePlayer(guestPlayer);
    displayPlayerInfo();
  }
  
  // Initialize history state & support direct #game-modes-section / #modes deep-link
  const initialHash = (window.location.hash || '').toLowerCase();
  if (!history.state) {
    history.replaceState({ view: 'setup' }, '', window.location.pathname);
  }
  if (['#modes', '#game-modes', '#game-modes-section'].includes(initialHash)) {
    scrollToGameModes();
  }

  renderPeopleList();
  // attachHandlers(); // Moved to top of init to ensure UI is responsive immediately
  // Footer year
  const fy = document.getElementById('footer-year');
  if (fy) fy.textContent = String(new Date().getFullYear());
  
  // Check for first-time user
  checkFirstTimeUser();
  
  // Initialize guest prompts system
  if (window.GuestPrompts && typeof window.GuestPrompts.init === 'function') {
    window.GuestPrompts.init();
  }
  
  // Listen for account creation requests from guest prompts
  document.addEventListener('showAccountCreation', (event) => {
    if (event.detail && event.detail.source === 'guest-prompt') {
      // Show player change modal to convert guest to registered player
      if (btnChangePlayer) {
        btnChangePlayer.click();
      }
    }
  });
  
  // Welcome toast (only if not first time, to avoid clutter)
  if (localStorage.getItem('who-bible-visited')) {
    showToast({ title: getText('brandTitle'), msg: getText('welcomeMessage'), type: 'info', timeout: 4000 });
  }
}

function checkFirstTimeUser() {
  const visited = localStorage.getItem('who-bible-visited');
  if (!visited) {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Close handler
      const closeBtn = document.getElementById('btn-welcome-close');
      const okBtn = document.getElementById('btn-welcome-ok');
      const close = () => {
        modal.style.display = 'none';
        localStorage.setItem('who-bible-visited', 'true');
        // Show welcome toast after closing modal
        showToast({ title: getText('brandTitle'), msg: getText('welcomeMessage'), type: 'info', timeout: 4000 });
      };
      if(closeBtn) closeBtn.onclick = close;
      if(okBtn) okBtn.onclick = close;
      
      // Close when clicking outside the modal content
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          close();
        }
      });
    }
  }
}

// ── Settings Pill Toggle System & Mode Quick-Launch Modal ────────
const SETTINGS_PRESETS = {
  casual: { difficulty: 'easy', 'num-questions': '5', 'time-limit': '90', 'testament-filter': 'all', 'gender-filter': 'all' },
  standard: { difficulty: 'medium', 'num-questions': '10', 'time-limit': '60', 'testament-filter': 'all', 'gender-filter': 'all' },
  epic: { difficulty: 'hard', 'num-questions': '20', 'time-limit': '90', 'testament-filter': 'all', 'gender-filter': 'all' }
};

let pendingLaunchMode = null;

function initSettingsPills() {
  // Wire up each toggle-pill-row
  document.querySelectorAll('.toggle-pill-row').forEach(row => {
    const settingKey = row.getAttribute('data-setting');
    const selectEl = document.getElementById(settingKey);
    if (!selectEl) return;

    row.querySelectorAll('.toggle-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        row.querySelectorAll('.toggle-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectEl.value = pill.getAttribute('data-value');
        selectEl.dispatchEvent(new Event('change'));
        syncPillsFromSelects();
      });
    });
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = SETTINGS_PRESETS[btn.getAttribute('data-preset')];
      if (!preset) return;
      applySettingsValues(preset);
      syncPillsFromSelects();
    });
  });

  // Reset button
  const btnReset = document.getElementById('btn-reset-settings');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      applySettingsValues(SETTINGS_PRESETS.standard);
      syncPillsFromSelects();
      showToast({ title: '↺ Settings Reset', msg: 'All settings restored to defaults', type: 'success', timeout: 2000 });
    });
  }

  // Mode Quick-Launch Modal buttons
  document.getElementById('btn-mode-launch-close')?.addEventListener('click', closeModeLaunchModal);
  document.getElementById('btn-mode-launch-cancel')?.addEventListener('click', closeModeLaunchModal);
  document.getElementById('btn-mode-launch-start')?.addEventListener('click', () => {
    SoundFX.playClick();
    launchConfiguredMode();
  });

  // Sync pills from current select values (on load)
  syncPillsFromSelects();
}

function updateModeLaunchSummary(mode = pendingLaunchMode) {
  const summaryEl = document.getElementById('mode-launch-summary');
  if (!summaryEl || !mode) return;

  const qCount = document.getElementById('num-questions')?.value || '10';
  const diffRaw = document.getElementById('difficulty')?.value || 'medium';
  const diffLabel = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' }[diffRaw] || 'Medium';
  const clockSecs = document.getElementById('time-limit')?.value || '60';
  const testRaw = document.getElementById('testament-filter')?.value || 'all';
  const testLabel = { all: 'All Bible', ot: 'Old Testament', nt: 'New Testament' }[testRaw] || 'All Bible';
  const genRaw = document.getElementById('gender-filter')?.value || 'all';
  const genLabel = { all: '', male: ' • Men of Faith', female: ' • Women of Faith' }[genRaw] || '';

  if (mode === 'timed') {
    summaryEl.textContent = `⏱️ Ready: ${qCount} Questions • ${clockSecs}s Clock • ${diffLabel} • ${testLabel}${genLabel}`;
  } else if (mode === 'scenarios') {
    summaryEl.textContent = `🎭 Ready: ${qCount} Scenarios • ${diffLabel} Level`;
  } else {
    summaryEl.textContent = `📖 Ready: ${qCount} Questions • ${diffLabel} • ${testLabel}${genLabel}`;
  }
}

function openModeLaunchModal(mode) {
  const launchModal = document.getElementById('mode-launch-modal');
  if (!launchModal) {
    if (mode === 'solo') startSolo();
    else if (mode === 'timed') startTimed();
    else if (mode === 'scenarios') startScenarios();
    return;
  }

  pendingLaunchMode = mode;

  const titleEl = document.getElementById('mode-launch-title');
  const subtitleEl = document.getElementById('mode-launch-subtitle');
  const startBtn = document.getElementById('btn-mode-launch-start');
  const qLabel = document.getElementById('launch-qcount-label');
  const pCasual = document.getElementById('preset-btn-casual');
  const pStandard = document.getElementById('preset-btn-standard');
  const pEpic = document.getElementById('preset-btn-epic');

  if (mode === 'timed') {
    if (titleEl) titleEl.textContent = `⏱️ ${getText('timedMode') || 'Timed Mode'}`;
    if (subtitleEl) subtitleEl.textContent = 'Choose your countdown clock and difficulty — choices save automatically.';
    if (startBtn) startBtn.textContent = '⏱️ Start Timed Run →';
    if (qLabel) qLabel.textContent = '🔢 Questions';
    if (pCasual) pCasual.textContent = 'Casual (5Q, Easy, 90s)';
    if (pStandard) pStandard.textContent = 'Standard (10Q, Med, 60s)';
    if (pEpic) pEpic.textContent = 'Epic (20Q, Hard, 90s)';
  } else if (mode === 'scenarios') {
    if (titleEl) titleEl.textContent = `🎭 ${getText('scenariosMode') || 'Scenarios Mode'}`;
    if (subtitleEl) subtitleEl.textContent = 'Step into real-life biblical dilemmas and moral decisions.';
    if (startBtn) startBtn.textContent = '🎭 Start Scenarios →';
    if (qLabel) qLabel.textContent = '🔢 Scenarios';
  } else {
    if (titleEl) titleEl.textContent = `📖 ${getText('soloMode') || 'Classic Solo'}`;
    if (subtitleEl) subtitleEl.textContent = 'Play at your own pace with Scripture references after every question.';
    if (startBtn) startBtn.textContent = '📖 Start Solo Quiz →';
    if (qLabel) qLabel.textContent = '🔢 Questions';
    if (pCasual) pCasual.textContent = 'Casual (5Q, Easy)';
    if (pStandard) pStandard.textContent = 'Standard (10Q, Med)';
    if (pEpic) pEpic.textContent = 'Epic (20Q, Hard)';
  }

  // Show only setting blocks relevant to the selected mode
  launchModal.querySelectorAll('[data-launch-modes]').forEach(el => {
    const allowed = (el.getAttribute('data-launch-modes') || '').split(',').map(s => s.trim());
    el.style.display = allowed.includes(mode) ? '' : 'none';
  });

  syncPillsFromSelects();
  updateModeLaunchSummary(mode);

  launchModal.style.display = 'flex';
  syncModalScrollLock();
  setTimeout(() => startBtn?.focus({ preventScroll: true }), 40);
}

function closeModeLaunchModal() {
  const launchModal = document.getElementById('mode-launch-modal');
  if (launchModal) launchModal.style.display = 'none';
  pendingLaunchMode = null;
  syncModalScrollLock();
}

function launchConfiguredMode() {
  const mode = pendingLaunchMode;
  closeModeLaunchModal();
  if (mode === 'timed') {
    startTimed();
  } else if (mode === 'scenarios') {
    startScenarios();
  } else if (mode === 'solo') {
    startSolo();
  }
}

function applySettingsValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    const selectEl = document.getElementById(key);
    if (selectEl) {
      setSelectValueSafe(selectEl, value, value);
      selectEl.dispatchEvent(new Event('change'));
    }
  });
  syncPillsFromSelects();
}

function syncPillsFromSelects() {
  document.querySelectorAll('.toggle-pill-row').forEach(row => {
    const settingKey = row.getAttribute('data-setting');
    const selectEl = document.getElementById(settingKey);
    if (!selectEl) return;
    const currentVal = selectEl.value;
    row.querySelectorAll('.toggle-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-value') === currentVal);
    });
  });

  // Highlight matching Quick Preset button (ignoring time-limit when configuring Untimed Solo)
  document.querySelectorAll('.preset-btn').forEach(btn => {
    const presetKey = btn.getAttribute('data-preset');
    const preset = SETTINGS_PRESETS[presetKey];
    if (!preset) return;
    const matches = Object.entries(preset).every(([k, v]) => {
      if (pendingLaunchMode === 'solo' && k === 'time-limit') return true;
      const el = document.getElementById(k);
      return el && el.value === v;
    });
    btn.classList.toggle('active', matches);
  });

  if (pendingLaunchMode) {
    updateModeLaunchSummary(pendingLaunchMode);
  }
}

function attachHandlers(){

  // Hamburger Menu
  const btnMenu = document.getElementById('btn-menu');
  const navMenuContainer = document.getElementById('nav-menu-container');
  
  if (btnMenu && navMenuContainer) {
    btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenuContainer.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenuContainer.classList.contains('active') && 
          !navMenuContainer.contains(e.target) && 
          !btnMenu.contains(e.target)) {
        navMenuContainer.classList.remove('active');
      }
    });
  }

  // Home link handler (top-left brand logo scrolls to top of home page)
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSetup(false, { scrollToModes: false });
    });
  }
  
  // Player management & Profile modal
  const btnChangePlayer = document.getElementById('btn-change-player');
  const playerProfileCard = document.getElementById('player-profile-card');
  const profileModal = document.getElementById('profile-modal');
  const btnProfileClose = document.getElementById('btn-profile-close');
  const btnCancelProfile = document.getElementById('btn-cancel-profile');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  const profileNameInput = document.getElementById('profile-name-input');
  const avatarGrid = document.getElementById('avatar-grid');

  let selectedAvatar = (state.currentPlayer && state.currentPlayer.avatar) || '👑';

  const openProfileModal = () => {
    if (!profileModal) return;
    if (state.currentPlayer) {
      if (profileNameInput) profileNameInput.value = state.currentPlayer.name || 'Guest';
      selectedAvatar = state.currentPlayer.avatar || '👑';
    }
    // Highlight selected avatar
    if (avatarGrid) {
      avatarGrid.querySelectorAll('.avatar-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.avatar === selectedAvatar);
      });
    }
    // Update stats display in modal
    if (state.currentPlayer && state.currentPlayer.stats) {
      const stats = state.currentPlayer.stats;
      const rankInfo = computePlayerRank(stats);
      const gamesEl = document.getElementById('p-stat-games');
      const streakEl = document.getElementById('p-stat-streak');
      const accEl = document.getElementById('p-stat-accuracy');
      const rankEl = document.getElementById('p-stat-rank');
      if (gamesEl) gamesEl.textContent = stats.gamesPlayed || 0;
      if (streakEl) streakEl.textContent = stats.bestStreak || 0;
      if (accEl) accEl.textContent = `${stats.winRate || 0}%`;
      if (rankEl) rankEl.textContent = rankInfo.rank;
    }
    profileModal.style.display = 'flex';
    setModalScrollLock(true);
  };

  const closeProfileModal = () => {
    if (profileModal) profileModal.style.display = 'none';
    setModalScrollLock(false);
  };

  if (avatarGrid) {
    avatarGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.avatar-option');
      if (!btn) return;
      selectedAvatar = btn.dataset.avatar;
      avatarGrid.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const name = (profileNameInput ? profileNameInput.value.trim() : '') || 'Guest';
      if (!state.currentPlayer) {
        state.currentPlayer = createGuestPlayer(name);
      } else {
        state.currentPlayer.name = name;
      }
      state.currentPlayer.avatar = selectedAvatar;
      savePlayer(state.currentPlayer);
      try {
        localStorage.setItem('who-bible-profile-name', name);
        localStorage.setItem('who-bible-profile-avatar', selectedAvatar);
      } catch (_) {}
      updatePlayerDisplayName();
      closeProfileModal();
      showToast({ title: 'Profile Updated', msg: `Welcome, ${name}!`, type: 'success', timeout: 2000 });
    });
  }

  if (btnProfileClose) btnProfileClose.addEventListener('click', closeProfileModal);
  if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeProfileModal);
  if (btnChangePlayer) btnChangePlayer.addEventListener('click', openProfileModal);
  if (playerProfileCard) playerProfileCard.addEventListener('click', openProfileModal);
  
  // Sound toggle button
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      SoundFX.toggle();
    });
  }

  // Daily challenge button
  const btnStartDaily = document.getElementById('btn-start-daily');
  if (btnStartDaily) {
    btnStartDaily.addEventListener('click', startDailyChallenge);
  }
  
  // Mode buttons (Solo, Timed, and Scenarios open mode-tailored Quick-Launch sheet)
  if (btnSolo) btnSolo.addEventListener('click', () => { SoundFX.playClick(); openModeLaunchModal('solo'); });
  if (btnTimed) btnTimed.addEventListener('click', () => { SoundFX.playClick(); openModeLaunchModal('timed'); });
  if (btnChallenge) btnChallenge.addEventListener('click', () => { SoundFX.playClick(); startChallenge(); });
  if (btnStudy) btnStudy.addEventListener('click', () => { SoundFX.playClick(); startStudy(); });
  if (btnScenarios) btnScenarios.addEventListener('click', () => { SoundFX.playClick(); openModeLaunchModal('scenarios'); });
  
  // Navigation
  if (btnBackToSetup) btnBackToSetup.addEventListener('click', () => { SoundFX.playClick(); showSetup(); });
  if (btnBackFromStudy) btnBackFromStudy.addEventListener('click', () => { SoundFX.playClick(); showSetup(); });
  // Community moved to separate page
  
  // Game controls
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      clearAutoAdvance();
      SoundFX.playClick();
      if (state.mode === 'scenarios') {
        nextScenarioQuestion();
      } else {
        nextQuestion();
      }
    });
  }
  if (btnQuit) btnQuit.addEventListener('click', () => { SoundFX.playClick(); quitQuiz(); });
  if (btnPause) btnPause.addEventListener('click', () => { SoundFX.playClick(); togglePause(); });
  
  // Study controls
  if (searchPerson) searchPerson.addEventListener('input', e=>renderPeopleList(e.target.value));
  if (sortSelect) sortSelect.addEventListener('change', ()=>renderPeopleList(searchPerson ? searchPerson.value : ''));
  if (filterMother) filterMother.addEventListener('change', ()=>renderPeopleList(searchPerson ? searchPerson.value : ''));
  if (filterOccupation) filterOccupation.addEventListener('change', ()=>renderPeopleList(searchPerson ? searchPerson.value : ''));
  if (filterAge) filterAge.addEventListener('change', ()=>renderPeopleList(searchPerson ? searchPerson.value : ''));
  if (btnShuffleList) {
    btnShuffleList.addEventListener('click', () => {
      state.studySort = 'shuffle';
      state.shuffledPeople = state.people.slice();
      shuffle(state.shuffledPeople);
      const sortToggleBtn = document.getElementById('btn-sort-toggle');
      if (sortToggleBtn) sortToggleBtn.classList.remove('active');
      btnShuffleList.classList.add('active');
      renderPeopleList(searchPerson ? searchPerson.value : '');
      SoundFX.playClick();
    });
  }
  if (btnExpandAll) btnExpandAll.addEventListener('click', ()=>toggleAllDetails(true));
  if (btnCollapseAll) btnCollapseAll.addEventListener('click', ()=>toggleAllDetails(false));
  
  // Testament and gender filters (persist as part of Game Settings)
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  if (testamentFilter) {
    testamentFilter.addEventListener('change', () => {
      saveSettingsFromUI();
      renderPeopleList(searchPerson ? searchPerson.value : '');
    });
  }
  if (genderFilter) {
    genderFilter.addEventListener('change', () => {
      saveSettingsFromUI();
      renderPeopleList(searchPerson ? searchPerson.value : '');
    });
  }
  
  // Data management
  if (btnExport) btnExport.addEventListener('click', exportJson);
  if (btnImport) btnImport.addEventListener('click', ()=>fileInput?.click());
  if (btnResetData) btnResetData.addEventListener('click', resetData);
  if (fileInput) fileInput.addEventListener('change', handleImportFile);
  
  // Settings persistence
  if (difficultySel) difficultySel.addEventListener('change', saveSettingsFromUI);
  if (numQuestionsInput) numQuestionsInput.addEventListener('change', saveSettingsFromUI);
  if (timeLimitInput) timeLimitInput.addEventListener('change', saveSettingsFromUI);
  
  // Language selector
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    // Persist preferred language as part of settings as well
    const settings = loadSettings() || {};
    settings.language = lang;
    try{ localStorage.setItem('settings', JSON.stringify(settings)); }catch(_){/* ignore */}
    setLanguage(lang);
    // Re-render visible question if any
    if(state.current){
      // Rebuild prompt with translated pieces when possible
      const q = state.current;
      // We cannot perfectly rebuild dynamic tokens here without source data; keep prompt as-is,
      // but refresh choices labels and status/headers via updateAllText called by setLanguage.
      // Future: store raw tokens to fully re-localize prompt.
      // Refresh answers display text
      const nodes = Array.from(document.querySelectorAll('#answers .ans'));
      nodes.forEach(node=>{
        const orig = node.dataset.value;
        node.innerText = (typeof translateAnswerForQuestionType==='function') ? translateAnswerForQuestionType(q.type, orig) : orig;
      });
    }
  });
  }
  
  // Theme toggle: cycle between day and night
  if (btnTheme) {
    btnTheme.addEventListener('click', ()=>{
      console.log('Theme button clicked!'); // Debug
      console.log('Current state.theme:', state.theme); // Debug
      console.log('Body classes:', document.body.className); // Debug
      
      // Use state.theme as the source of truth
      const current = state.theme || 'night';
      const next = current === 'night' ? 'day' : 'night';
      
      console.log('Switching from', current, 'to', next); // Debug
      applyTheme(next);
      saveSettingsFromUI();
    });
  } else {
    console.log('btnTheme not found!'); // Debug
  }
  // ── Rich Share Helper ──────────────────────────────────────────
  function buildShareData(score = null, playerName = null) {
    const url = 'https://who-bible.web.app';
    const name = playerName || (state.currentPlayer && state.currentPlayer.name) || 'A player';
    if (score !== null) {
      const scoreMsg = score >= 80 ? '🏆 Crushing it!' : score >= 50 ? '📖 Solid knowledge!' : '✝️ Keep studying!';
      return {
        title: 'Who-Bible — Bible People Quiz',
        text: `${scoreMsg} ${name} just scored ${score} points on Who-Bible — the ultimate Bible people challenge! Can you beat it? 📜✨`,
        url
      };
    }
    return {
      title: 'Who-Bible — Bible People Quiz',
      text: `🔥 Test your Scripture knowledge on Who-Bible! 170+ biblical characters, real-time multiplayer, and daily challenges. How well do you know the Bible? 📜✨`,
      url
    };
  }

  async function doShare(shareData) {
    if (navigator.share) {
      try { await navigator.share(shareData); return true; } catch(_){}
    }
    try {
      await navigator.clipboard.writeText(`${shareData.text}\n\n👉 ${shareData.url}`);
      showToast({ title: '🔗 Link Copied!', msg: 'Share link copied to clipboard', type: 'success', timeout: 2500 });
      return true;
    } catch(_) {
      showToast({ title: '⚠️ Copy Failed', msg: 'Please copy the link manually', type: 'error', timeout: 2500 });
    }
    return false;
  }

  // Header Share button
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      openModernShareModal(buildShareData(state.score || null));
    });
  }

  // Footer Share button
  const btnShareFooter = document.getElementById('btn-share-footer');
  if (btnShareFooter) {
    btnShareFooter.addEventListener('click', () => {
      openModernShareModal(buildShareData(state.score || null));
    });
  }

  // Twitter/X share
  const btnShareTwitter = document.getElementById('btn-share-twitter');
  if (btnShareTwitter) {
    btnShareTwitter.addEventListener('click', () => {
      const sd = buildShareData(state.score || null);
      const text = encodeURIComponent(`${sd.text}\n\n${sd.url}`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
    });
  }

  // WhatsApp share
  const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
  if (btnShareWhatsapp) {
    btnShareWhatsapp.addEventListener('click', () => {
      const sd = buildShareData(state.score || null);
      const text = encodeURIComponent(`${sd.text}\n\n${sd.url}`);
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    });
  }

  // Facebook share
  const btnShareFacebook = document.getElementById('btn-share-facebook');
  if (btnShareFacebook) {
    btnShareFacebook.addEventListener('click', () => {
      const url = encodeURIComponent('https://who-bible.web.app');
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
    });
  }

  // Community placeholder behavior
  // Community opens in a new tab via anchor href

  
  // Remote Challenge handlers
  if (btnRemoteChallenge && window.RemoteChallengeUI) {
    btnRemoteChallenge.addEventListener('click', () => {
      window.RemoteChallengeUI.start();
    });
  }
  
  // Classroom Mode handler
  if (btnClassroomMode) {
    btnClassroomMode.addEventListener('click', () => {
      promptClassroomJoin();
    });
  }
  
  // Quick Host Classroom button (if present)
  const btnHostClassroom = document.getElementById('btn-host-classroom');
  if (btnHostClassroom) {
    btnHostClassroom.addEventListener('click', () => {
      window.open('host.html', '_blank');
    });
  }
  
  if (btnRemoteClose && window.RemoteChallengeUI) {
    btnRemoteClose.addEventListener('click', window.RemoteChallengeUI.hide);
  }
  if (btnRemoteBack && window.RemoteChallengeUI) {
    btnRemoteBack.addEventListener('click', () => window.RemoteChallengeUI.showStep('1'));
  }
  if (btnCreateRoom && window.RemoteChallengeUI) {
    btnCreateRoom.addEventListener('click', () => window.RemoteChallengeUI.showStep('create'));
  }
  if (btnJoinRoom && window.RemoteChallengeUI) {
    btnJoinRoom.addEventListener('click', () => window.RemoteChallengeUI.showStep('join'));
  }
  // Note: Confirm buttons are handled by inline onclick or specific logic in remote-challenge-ui.js if set up there, 
  // but let's ensure they are attached here if they exist in DOM
  const btnConfirmCreate = document.getElementById('btn-create-room-confirm');
  const btnConfirmJoin = document.getElementById('btn-join-room-confirm');
  
  if (btnConfirmCreate && window.RemoteChallengeUI) {
    btnConfirmCreate.addEventListener('click', window.RemoteChallengeUI.createRoom);
  }
  if (btnConfirmJoin && window.RemoteChallengeUI) {
    btnConfirmJoin.addEventListener('click', window.RemoteChallengeUI.joinRoom);
  }
  
  // Modal Close & Play Again Handlers
  if (btnSummaryClose) btnSummaryClose.addEventListener('click', hideSummaryModal);
  const btnSummaryHome = document.getElementById('btn-summary-home');
  if (btnSummaryHome) {
    btnSummaryHome.addEventListener('click', () => {
      SoundFX.playClick();
      hideSummaryModal();
      showSetup();
    });
  }
  const btnSummarySettings = document.getElementById('btn-summary-settings');
  if (btnSummarySettings) {
    btnSummarySettings.addEventListener('click', () => {
      SoundFX.playClick();
      const lastMode = state.mode;
      hideSummaryModal();
      showSetup();
      if (lastMode === 'solo' || lastMode === 'timed' || lastMode === 'scenarios') {
        openModeLaunchModal(lastMode);
      } else if (lastMode === 'challenge') {
        showPlayersModal();
      }
    });
  }
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => {
    SoundFX.playClick();
    const lastMode = state.mode;
    hideSummaryModal();
    if (lastMode === 'solo') {
      startSolo();
    } else if (lastMode === 'timed') {
      startTimed();
    } else if (lastMode === 'scenarios') {
      startScenarios();
    } else if (lastMode === 'daily') {
      startDailyChallenge();
    } else if (lastMode === 'challenge') {
      startChallengeRematch();
    } else if (lastMode === 'remote-challenge') {
      if (window.RemoteChallenge) window.RemoteChallenge.leaveRoom(true);
      showSetup();
      if (window.RemoteChallengeUI && window.RemoteChallengeUI.show) {
        window.RemoteChallengeUI.show();
      }
    } else {
      showSetup();
    }
  });
  
  if (btnPlayersClose) btnPlayersClose.addEventListener('click', hidePlayersModal);
  if (btnPlayersCancel) btnPlayersCancel.addEventListener('click', hidePlayersModal);
  if (btnPlayersStart) btnPlayersStart.addEventListener('click', startChallengeFromModal);
  
  // Challenge Mode - Save name buttons
  const btnSaveP1Name = document.getElementById('btn-save-p1-name');
  const btnSaveP2Name = document.getElementById('btn-save-p2-name');
  if (btnSaveP1Name) {
    btnSaveP1Name.addEventListener('click', () => {
      const name = (p1NameInput ? p1NameInput.value : '').trim();
      if (!name) {
        showToast({ title: 'Name Required', msg: 'Please enter Player 1 name', type: 'error' });
        if (p1NameInput) p1NameInput.focus();
        return;
      }
      localStorage.setItem('who-bible-p1-name', name);
      btnSaveP1Name.textContent = '✓ Saved';
      btnSaveP1Name.style.borderColor = 'var(--success, #10b981)';
      btnSaveP1Name.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.4)';
      setTimeout(() => { 
        btnSaveP1Name.textContent = 'Save';
        btnSaveP1Name.style.borderColor = '';
        btnSaveP1Name.style.boxShadow = ''; 
      }, 1500);
      showToast({ title: 'Player 1 Saved', msg: `Set to: ${name}`, type: 'success', timeout: 1500 });
      if (p2NameInput) p2NameInput.focus();
    });
  }
  if (btnSaveP2Name) {
    btnSaveP2Name.addEventListener('click', () => {
      const name = (p2NameInput ? p2NameInput.value : '').trim();
      if (!name) {
        showToast({ title: 'Name Required', msg: 'Please enter Player 2 name', type: 'error' });
        if (p2NameInput) p2NameInput.focus();
        return;
      }
      localStorage.setItem('who-bible-p2-name', name);
      btnSaveP2Name.textContent = '✓ Saved';
      btnSaveP2Name.style.borderColor = 'var(--success, #10b981)';
      btnSaveP2Name.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.4)';
      setTimeout(() => { 
        btnSaveP2Name.textContent = 'Save';
        btnSaveP2Name.style.borderColor = '';
        btnSaveP2Name.style.boxShadow = ''; 
      }, 1500);
      showToast({ title: 'Player 2 Saved', msg: `Set to: ${name}`, type: 'success', timeout: 1500 });
    });
  }
  
  // Allow Enter key to save names in Challenge Mode
  if (p1NameInput) {
    p1NameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (btnSaveP1Name) btnSaveP1Name.click();
      }
    });
  }
  if (p2NameInput) {
    p2NameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (btnSaveP2Name) btnSaveP2Name.click();
      }
    });
  }


  // Click outside to close modals
  window.addEventListener('click', (e) => {
    const launchModal = document.getElementById('mode-launch-modal');
    if (launchModal && e.target === launchModal) {
      closeModeLaunchModal();
    }
    if (e.target === modalEl) {
      if (Date.now() - (window._modalOpenedTime || 0) < 400) return;
      hideSummaryModal();
    }
    if (e.target === playersModal) hidePlayersModal();
    if (e.target === remoteModal) {
      if (window.RemoteChallengeUI && window.RemoteChallengeUI.hide) {
        window.RemoteChallengeUI.hide();
      } else {
        remoteModal.style.display = 'none';
      }
    }
  });

  // Global keyboard shortcuts for fluid playability & accessibility
  window.addEventListener('keydown', (e) => {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

    // Escape always closes any active dialog/modal
    if (e.key === 'Escape') {
      const launchModal = document.getElementById('mode-launch-modal');
      if (launchModal && launchModal.style.display === 'flex') {
        closeModeLaunchModal();
        return;
      }
      const confirmModal = document.getElementById('confirm-modal');
      if (confirmModal && confirmModal.style.display === 'flex') {
        document.getElementById('btn-confirm-modal-cancel')?.click();
        return;
      }
      const shareModal = document.getElementById('share-modal');
      if (shareModal && shareModal.style.display === 'flex') {
        closeModernShareModal();
        return;
      }
      const classroomModal = document.getElementById('classroom-join-modal');
      if (classroomModal && classroomModal.style.display === 'flex') {
        document.getElementById('btn-classroom-join-cancel')?.click();
        return;
      }
      const personModal = document.getElementById('person-modal');
      if (personModal && personModal.style.display === 'flex') {
        personModal.style.display = 'none';
        syncModalScrollLock();
        return;
      }
      const changePlayerModal = document.getElementById('change-player-modal');
      if (changePlayerModal && changePlayerModal.style.display === 'flex') {
        document.getElementById('btn-change-player-cancel')?.click();
        return;
      }
      const reportModal = document.getElementById('report-modal');
      if (reportModal && reportModal.classList.contains('show')) {
        reportModal.classList.remove('show');
        syncModalScrollLock();
      }
      const feedbackModal = document.getElementById('feedback-modal');
      if (feedbackModal && feedbackModal.classList.contains('show')) {
        feedbackModal.classList.remove('show');
        syncModalScrollLock();
      }
      const profileModal = document.getElementById('profile-modal');
      if (profileModal && profileModal.style.display === 'flex') {
        profileModal.style.display = 'none';
        syncModalScrollLock();
      }
      const welcomeModal = document.getElementById('welcome-modal');
      if (welcomeModal && welcomeModal.style.display === 'flex') {
        welcomeModal.style.display = 'none';
        syncModalScrollLock();
      }
      if (modalEl && modalEl.style.display === 'flex') hideSummaryModal();
      if (playersModal && playersModal.style.display === 'flex') hidePlayersModal();
      if (remoteModal && remoteModal.style.display === 'flex') {
        if (window.RemoteChallengeUI && window.RemoteChallengeUI.hide) {
          window.RemoteChallengeUI.hide();
        } else {
          remoteModal.style.display = 'none';
          syncModalScrollLock();
        }
      }
      return;
    }

    // Do not intercept keystrokes if typing inside text fields
    if (isTyping) return;

    // Quick-Launch Modal: pressing Enter starts the configured mode immediately
    const activeLaunchModal = document.getElementById('mode-launch-modal');
    if (activeLaunchModal && activeLaunchModal.style.display === 'flex' && e.key === 'Enter') {
      const activeId = document.activeElement?.id || '';
      if (!['btn-mode-launch-cancel', 'btn-mode-launch-close', 'btn-reset-settings'].includes(activeId)) {
        e.preventDefault();
        SoundFX.playClick();
        launchConfiguredMode();
        return;
      }
    }

    // Toggle SoundFX Mute with 'm'
    if (e.key === 'm' || e.key === 'M') {
      if (window.SoundFX && typeof window.SoundFX.toggle === 'function') {
        window.SoundFX.toggle();
      }
      return;
    }

    // Toggle Theme with 't'
    if (e.key === 't' || e.key === 'T') {
      if (btnTheme) btnTheme.click();
      return;
    }

    // In-game play controls when Game Area is active (and no modal is covering it)
    const gameArea = document.getElementById('game-area');
    const isGameActive = gameArea && gameArea.style.display !== 'none' && !document.body.classList.contains('modal-open');

    if (isGameActive) {
      // 1, 2, 3, 4 for answer selection
      if (['1', '2', '3', '4'].includes(e.key)) {
        const choiceIdx = parseInt(e.key, 10);
        const choiceEl = document.getElementById(`choice-${choiceIdx}`);
        if (choiceEl && !choiceEl.classList.contains('disabled')) {
          e.preventDefault();
          choiceEl.click();
        }
      }
      // Space or Enter to proceed to next question
      else if (e.key === 'Enter' || e.key === ' ') {
        if (btnNext && !btnNext.disabled && btnNext.offsetParent !== null) {
          e.preventDefault();
          btnNext.click();
        }
      }
      // 'p' or 'P' to pause/resume in timed mode
      else if (e.key === 'p' || e.key === 'P') {
        if (btnPause && btnPause.style.display !== 'none') {
          e.preventDefault();
          btnPause.click();
        }
      }
    }
  });

  if (btnCopyLink && window.RemoteChallengeUI) {
    btnCopyLink.addEventListener('click', window.RemoteChallengeUI.copyLink);
  }
  if (btnShareLink && window.RemoteChallengeUI) {
    btnShareLink.addEventListener('click', window.RemoteChallengeUI.shareLink);
  }
  if (btnReadyHost && window.RemoteChallengeUI) {
    btnReadyHost.addEventListener('click', window.RemoteChallengeUI.readyHost);
  }
  if (btnReadyGuest && window.RemoteChallengeUI) {
    btnReadyGuest.addEventListener('click', window.RemoteChallengeUI.readyGuest);
  }
  
  // Remote Challenge - Save name buttons
  const btnSaveHostName = document.getElementById('btn-save-host-name');
  const btnSaveJoinName = document.getElementById('btn-save-join-name');
  if (btnSaveHostName && window.RemoteChallengeUI) {
    btnSaveHostName.addEventListener('click', window.RemoteChallengeUI.saveHostName);
  }
  if (btnSaveJoinName && window.RemoteChallengeUI) {
    btnSaveJoinName.addEventListener('click', window.RemoteChallengeUI.saveJoinName);
  }
  
  // Allow Enter key to save names in Remote Challenge
  if (remoteHostNameInput && window.RemoteChallengeUI) {
    remoteHostNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.RemoteChallengeUI.saveHostName();
      }
    });
  }
  if (remoteJoinNameInput && window.RemoteChallengeUI) {
    remoteJoinNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.RemoteChallengeUI.saveJoinName();
      }
    });
  }
  
  // Keyboard navigation on answers
  answersEl.addEventListener('keydown', onAnswersKeyDown);

}

// =========================
// Panel Management & Navigation
// =========================

function updateHistory(view) {
  // Don't push if we're already on this view
  if (history.state && history.state.view === view) return;
  
  const url = view === 'setup' ? window.location.pathname : `#${view}`;
  history.pushState({ view: view }, '', url);
}

window.addEventListener('popstate', (event) => {
  const view = event.state ? event.state.view : 'setup';
  
  if (view === 'game') {
    // If we return to game but have no active game, go to setup
    if(state.mode === 'idle') {
      showSetup(true);
      // Replace the 'game' state we just popped into with 'setup'
      history.replaceState({ view: 'setup' }, '', window.location.pathname);
    } else {
      showGame(true);
    }
  } else if (view === 'study') {
    showStudy(true);
  } else {
    showSetup(true);
  }
});

function resetViewportScroll() {
  const htmlEl = document.documentElement;
  const prevBehavior = htmlEl.style.scrollBehavior;
  htmlEl.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  htmlEl.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  const gameContent = document.querySelector('.game-content');
  const studyContent = document.querySelector('.study-content');
  if (gameContent) gameContent.scrollTop = 0;
  if (studyContent) studyContent.scrollTop = 0;
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    htmlEl.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    htmlEl.style.scrollBehavior = prevBehavior || '';
  });
}

function scrollToGameModes(previousMode = '') {
  const isMobile = window.innerWidth <= 768;
  const soloModes = ['solo', 'timed', 'study', 'scenarios'];

  let targetEl = null;
  if (previousMode === 'daily') {
    targetEl = document.getElementById('daily-challenge-section') || document.querySelector('.daily-challenge-section');
  } else if (isMobile && soloModes.includes(previousMode)) {
    targetEl = document.getElementById('solo-modes-section') || document.querySelector('.single-modes-section');
  }
  if (!targetEl) {
    targetEl = document.getElementById('game-modes-section') || document.querySelector('.friends-hero-section') || document.querySelector('.single-modes-section');
  }
  if (!targetEl) {
    resetViewportScroll();
    return;
  }

  const applyJump = () => {
    const htmlEl = document.documentElement;
    const prevBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = 'auto';
    const rect = targetEl.getBoundingClientRect();
    const topOffset = Math.max(0, Math.round(rect.top + window.scrollY - 20));
    window.scrollTo(0, topOffset);
    htmlEl.scrollTop = topOffset;
    if (document.body) document.body.scrollTop = topOffset;
    htmlEl.style.scrollBehavior = prevBehavior || '';
  };

  applyJump();
  requestAnimationFrame(() => applyJump());
}

function clearAutoAdvance() {
  if (state.autoAdvanceTimer) {
    clearTimeout(state.autoAdvanceTimer);
    state.autoAdvanceTimer = null;
  }
  if (btnNext) {
    btnNext.classList.remove('auto-advancing');
    btnNext.style.removeProperty('--auto-ms');
  }
}

function scheduleAutoAdvance(isCorrect = true) {
  clearAutoAdvance();
  if (!state.mode || state.mode === 'idle' || state.mode === 'classroom') return;

  let delayMs = isCorrect ? 1200 : 1950;
  if (state.mode === 'timed') {
    delayMs = isCorrect ? 750 : 1200;
  } else if (state.mode === 'remote-challenge') {
    delayMs = isCorrect ? 950 : 1450;
  } else if (state.mode === 'challenge') {
    delayMs = isCorrect ? 1600 : 2100;
  } else if (state.mode === 'scenarios') {
    delayMs = isCorrect ? 2800 : 3600;
  }

  const isLast = state.qnum >= state.qtotal;
  const arrowSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-arrow"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';

  if (btnNext) {
    btnNext.disabled = false;
    btnNext.style.display = 'inline-flex';
    if (isLast) {
      btnNext.innerHTML = `<span>Final Results</span> ${arrowSvg}`;
    } else if (state.mode === 'challenge' && state.players && state.players.length >= 2) {
      const nextIdx = (state.currentPlayerIndex + 1) % 2;
      const nextPlayer = state.players[nextIdx];
      btnNext.innerHTML = `<span>Up Next: ${escapeHtml(nextPlayer.name)}</span> ${arrowSvg}`;
    } else {
      btnNext.innerHTML = `<span>Next</span> ${arrowSvg}`;
    }
    btnNext.style.setProperty('--auto-ms', `${delayMs}ms`);
    void btnNext.offsetWidth;
    btnNext.classList.add('auto-advancing');
  }

  const expectedMode = state.mode;
  const expectedQnum = state.qnum;

  const tryAdvance = () => {
    state.autoAdvanceTimer = null;
    if (state.mode !== expectedMode || state.qnum !== expectedQnum) return;

    // Defer cleanly if player paused Timed Mode or opened the Report Question modal
    const reportOpen = document.getElementById('report-modal')?.classList.contains('show');
    if (state.paused || reportOpen) {
      if (btnNext) btnNext.classList.remove('auto-advancing');
      state.autoAdvanceTimer = setTimeout(tryAdvance, 400);
      return;
    }

    clearAutoAdvance();
    if (state.mode === 'scenarios') {
      nextScenarioQuestion();
    } else {
      nextQuestion();
    }
  };

  state.autoAdvanceTimer = setTimeout(tryAdvance, delayMs);
}

function showSetup(fromHistory = false, options = {}){
  const previousMode = state.mode;
  const shouldScrollToModes = options.scrollToModes !== false;
  if(!fromHistory) updateHistory('setup');
  clearAutoAdvance();
  cleanupClassroomPlayerMode(true);
  if (state.mode === 'remote-challenge' && window.RemoteChallenge) {
    window.RemoteChallenge.leaveRoom(true);
    if (window.RemoteChallengeUI?.endMatch) window.RemoteChallengeUI.endMatch();
  }
  state.mode = 'idle';
  setupPanel.style.display = 'flex';
  gameArea.style.display = 'none';
  studyPanel.style.display = 'none';
  if(challengeStatusEl) challengeStatusEl.style.display = 'none';
  if(versusTurnBanner) versusTurnBanner.style.display = 'none';
  const soloScoreChip = document.querySelector('.chip-score');
  const soloStreakChip = document.querySelector('#streak-chip');
  const progressChip = document.querySelector('.chip-progress');
  const progressTrack = document.querySelector('.progress-container-modern');
  if (soloScoreChip) soloScoreChip.style.display = 'flex';
  if (soloStreakChip) soloStreakChip.style.display = 'flex';
  if (progressChip) progressChip.style.display = 'flex';
  if (progressTrack) progressTrack.style.display = 'block';
  if (btnNext) {
    btnNext.style.display = 'none';
    btnNext.disabled = true;
    btnNext.innerHTML = '<span>Next</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-arrow"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
  }
  if (btnQuit) btnQuit.textContent = getText('quit') || 'Quit';
  state.paused = false;
  stopTimer();
  if (timerEl) timerEl.classList.remove('warn', 'danger', 'paused');
  // Reset quiz display
  const quizEl = document.getElementById('quiz');
  const welcomeMsg = document.getElementById('welcome-message');
  if(quizEl) {
    quizEl.classList.remove('quiz-paused');
    quizEl.style.display = 'none';
  }
  if(welcomeMsg) welcomeMsg.style.display = 'block';
  // Reset question number display
  if(typeof qnumEl !== 'undefined' && typeof qtotalEl !== 'undefined') {
    qnumEl.innerText = '0';
    const selected = parseInt(numQuestionsInput.value)||10;
    qtotalEl.innerText = String(selected);
  }
  if (shouldScrollToModes) {
    scrollToGameModes(previousMode);
  } else {
    resetViewportScroll();
  }
}

function showGame(fromHistory = false){
  if(!fromHistory) updateHistory('game');
  setupPanel.style.display = 'none';
  gameArea.style.display = 'flex';
  studyPanel.style.display = 'none';
  resetViewportScroll();
}

function showStudy(fromHistory = false){
  if(!fromHistory) updateHistory('study');
  clearAutoAdvance();
  state.mode = 'study';
  setupPanel.style.display = 'none';
  gameArea.style.display = 'none';
  studyPanel.style.display = 'flex';
  renderPeopleList(searchPerson ? searchPerson.value : '');
  resetViewportScroll();
}

// Community removed from main SPA; use community.html

// Community helpers
// Community modal lives on community.html

function initialsFromName(name){
  const parts = (name||'').trim().split(/[\s-]+/).filter(Boolean);
  if(parts.length===0) return 'WB';
  const first = parts[0][0] || '';
  const second = parts.length>1 ? parts[1][0] : '';
  return (first+second).toUpperCase();
}
function generateAvatarText(name){
  const txt = initialsFromName(name);
  return txt || 'WB';
}
// Avatar helpers moved to community.js
// Profile helpers moved to community.js

function escapeHtml(s){
  return String(s).replace(/[&<>"]+/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

// setActiveCommunityTab moved to community.js

// =========================
// Modes
// =========================
async function startSolo(){
  if (!state.people || state.people.length === 0) await ensurePeopleLoaded();
  showGame();
  gameTitle.textContent = getText('soloMode');
  prepareQuiz('solo');
  showToast({ title: getText('soloStart'), msg: getText('soloStartMsg'), type: 'info' });
}

async function startTimed(){
  if (!state.people || state.people.length === 0) await ensurePeopleLoaded();
  showGame();
  gameTitle.textContent = getText('timedMode');
  prepareQuiz('timed');
  const secs = parseInt(timeLimitInput.value, 10) || 60;
  showToast({
    title: `⏱️ ${getText('timedStart') || 'Timed Mode'}`,
    msg: `${state.qtotal} Questions • ${secs}s Clock — Beat the timer!`,
    type: 'warn',
    timeout: 2400
  });
}

function startChallenge(){
  showPlayersModal();
}

async function startChallengeFromModal(){
  if (!state.people || state.people.length === 0) await ensurePeopleLoaded();
  const savedP1 = localStorage.getItem('who-bible-p1-name') || '';
  const savedP2 = localStorage.getItem('who-bible-p2-name') || '';
  const name1 = (p1NameInput && p1NameInput.value ? p1NameInput.value.trim() : '') || savedP1 || 'Player 1';
  const name2 = (p2NameInput && p2NameInput.value ? p2NameInput.value.trim() : '') || savedP2 || 'Player 2';
  
  localStorage.setItem('who-bible-p1-name', name1);
  localStorage.setItem('who-bible-p2-name', name2);

  // Read match settings from modal
  const qCountEl = document.querySelector('#challenge-qcount-pills .modal-pill.active');
  const diffEl = document.querySelector('#challenge-diff-pills .modal-pill.active');
  const timerPillEl = document.querySelector('#challenge-timer-pills .modal-pill.active');

  const chosenQCount = parseInt(qCountEl?.dataset.value, 10) || 10;
  // Guaranteed strictly even for 2 players so each has equal chances!
  const fairQCount = chosenQCount % 2 === 0 ? chosenQCount : chosenQCount + 1;
  const chosenDiff = diffEl?.dataset.value || 'medium';
  const chosenTimer = parseInt(timerPillEl?.dataset.value, 10) || 0;

  state.challengeSettings = {
    numQuestions: fairQCount,
    difficulty: chosenDiff,
    timeLimit: chosenTimer
  };
  localStorage.setItem('who-bible-challenge-settings', JSON.stringify(state.challengeSettings));
  
  hidePlayersModal();
  showGame();
  gameTitle.textContent = getText('challengeMode') || '⚔️ 2-Player Pass & Play';
  
  state.players = [ 
    { name: name1, score: 0 }, 
    { name: name2, score: 0 } 
  ];
  state.currentPlayerIndex = 0;
  
  stopTimer();
  
  prepareQuiz('challenge');
  updateVersusHUD();
  
  showToast({ 
    title: getText('challengeStart') || '⚔️ Match Started!', 
    msg: `${name1} vs ${name2}! (${fairQCount} Questions, ${fairQCount / 2} each - ${chosenDiff.toUpperCase()})`, 
    type: 'info',
    timeout: 3200
  });
}

async function startChallengeRematch(){
  if (!state.people || state.people.length === 0) await ensurePeopleLoaded();
  const savedP1 = localStorage.getItem('who-bible-p1-name') || 'Player 1';
  const savedP2 = localStorage.getItem('who-bible-p2-name') || 'Player 2';
  const name1 = (state.players && state.players[0] && state.players[0].name) ? state.players[0].name : savedP1;
  const name2 = (state.players && state.players[1] && state.players[1].name) ? state.players[1].name : savedP2;

  if (!state.challengeSettings) {
    try {
      const saved = JSON.parse(localStorage.getItem('who-bible-challenge-settings') || '{}');
      state.challengeSettings = {
        numQuestions: saved.numQuestions || 10,
        difficulty: saved.difficulty || 'medium',
        timeLimit: saved.timeLimit || 0
      };
    } catch (_) {
      state.challengeSettings = { numQuestions: 10, difficulty: 'medium', timeLimit: 0 };
    }
  }

  showGame();
  gameTitle.textContent = getText('challengeMode') || '⚔️ 2-Player Pass & Play';
  state.players = [
    { name: name1, score: 0 },
    { name: name2, score: 0 }
  ];
  state.currentPlayerIndex = 0;
  stopTimer();
  prepareQuiz('challenge');
  updateVersusHUD();
  showToast({
    title: '⚔️ Rematch Started!',
    msg: `${name1} vs ${name2} — fresh questions, scores reset to 0!`,
    type: 'info',
    timeout: 2800
  });
}

function updateVersusHUD(){
  if (!state.players || state.players.length < 2) return;
  const p1 = state.players[0];
  const p2 = state.players[1];
  const activeIdx = state.currentPlayerIndex || 0;
  const activePlayer = state.players[activeIdx] || p1;

  if (p1NameEl) p1NameEl.textContent = p1.name;
  if (p2NameEl) p2NameEl.textContent = p2.name;
  if (p1ScoreEl) p1ScoreEl.textContent = String(p1.score);
  if (p2ScoreEl) p2ScoreEl.textContent = String(p2.score);

  if (currentPlayerTurnNameEl) {
    currentPlayerTurnNameEl.textContent = activePlayer.name;
  }
  if (currentPlayerEl) {
    currentPlayerEl.textContent = String(activeIdx + 1);
  }

  // Active / waiting turn highlights on the versus cards
  if (versusP1Card) {
    versusP1Card.classList.toggle('active-turn', activeIdx === 0);
    versusP1Card.classList.toggle('waiting-turn', activeIdx !== 0);
  }
  if (versusP2Card) {
    versusP2Card.classList.toggle('active-turn', activeIdx === 1);
    versusP2Card.classList.toggle('waiting-turn', activeIdx !== 1);
  }

  // Prominent banner above the question
  if (versusTurnBanner && state.mode === 'challenge') {
    versusTurnBanner.style.display = 'flex';
    if (versusTurnBannerText) {
      const iconSvg = activeIdx === 0
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line><polyline points="9.5 17.5 21 6 21 3 18 3 6.5 14.5"></polyline><line x1="5" y1="13" x2="11" y2="19"></line></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      versusTurnBannerText.innerHTML = `${iconSvg}It is <strong>${escapeHtml(activePlayer.name)}</strong>'s turn to answer!`;
    }
  } else if (versusTurnBanner && state.mode === 'remote-challenge') {
    versusTurnBanner.style.display = 'flex';
    if (versusTurnBannerText) {
      versusTurnBannerText.innerHTML = `🌐 Live Match: <strong>${escapeHtml(p1.name)}</strong> vs <strong>${escapeHtml(p2.name)}</strong> — Race through all questions!`;
    }
  } else if (versusTurnBanner) {
    versusTurnBanner.style.display = 'none';
  }
}

function startStudy(){
  showStudy();
  stopTimer();
  showToast({ title: getText('studyStart'), msg: getText('studyStartMsg'), type: 'info' });
}

function startScenarios(){
  if (!window.ScenarioModule || !window.ScenarioModule.scenarios || window.ScenarioModule.scenarios.length === 0) {
    showToast({ title: 'Loading...', msg: 'Scenarios are loading, please try again.', type: 'warn', timeout: 2000 });
    return;
  }
  
  showGame();
  gameTitle.textContent = getText('scenariosMode') || 'Scenarios Mode';
  prepareScenarioQuiz();
  showToast({ title: getText('scenariosStart') || 'Scenarios', msg: getText('scenariosStartMsg') || 'Test your knowledge of biblical scenarios!', type: 'info' });
}

function prepareScenarioQuiz(){
  state.mode = 'scenarios';
  afterRef.innerText = '';
  state.score = 0; state.streak = 0; state.qnum = 0; state.results = []; state.paused = false;

  // Reset and shuffle scenarios
  window.ScenarioModule.reset();
  window.ScenarioModule.shuffleScenarios();

  const allScenarios = window.ScenarioModule.scenarios.slice();
  const count = parseInt(numQuestionsInput.value, 10) || Math.min(10, allScenarios.length);
  const diff = difficultySel ? difficultySel.value : 'medium';

  // Prioritize scenarios matching selected difficulty while filling up to target count
  const preferredLevels = {
    easy: ['Beginner', 'Intermediate'],
    medium: ['Intermediate', 'Beginner'],
    hard: ['Advanced', 'Intermediate'],
    expert: ['Expert', 'Advanced', 'Intermediate']
  }[diff] || ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const prioritized = allScenarios.filter(s => preferredLevels.includes(s.level));
  const remainder = allScenarios.filter(s => !preferredLevels.includes(s.level));
  shuffle(prioritized);
  shuffle(remainder);

  // Clone each selected scenario and generate a randomized option permutation so answers are evenly distributed across A, B, C!
  state.questions = [...prioritized, ...remainder].slice(0, count).map(s => {
    const optCount = Array.isArray(s.options) ? s.options.length : 3;
    const optionOrder = Array.from({ length: optCount }, (_, i) => i);
    shuffle(optionOrder);
    return { ...s, optionOrder };
  });

  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  clearAutoAdvance();
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.style.display = 'none';
  }

  // Show the quiz interface and restore solo HUD chips
  quizEl.style.display = 'block';
  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) welcomeMsg.style.display = 'none';
  const soloScoreChip = document.querySelector('.chip-score');
  const soloStreakChip = document.querySelector('#streak-chip');
  const progressChip = document.querySelector('.chip-progress');
  const progressTrack = document.querySelector('.progress-container-modern');
  if (soloScoreChip) soloScoreChip.style.display = 'flex';
  if (soloStreakChip) soloStreakChip.style.display = 'flex';
  if (progressChip) progressChip.style.display = 'flex';
  if (progressTrack) progressTrack.style.display = 'block';

  // Hide mode-specific elements
  timerEl.style.display = 'none';
  btnPause.style.display = 'none';
  challengeStatusEl.style.display = 'none';
  if (versusTurnBanner) versusTurnBanner.style.display = 'none';
  stopTimer();

  nextScenarioQuestion();
  resetViewportScroll();
}

function nextScenarioQuestion(){
  clearAutoAdvance();
  if(state.qnum >= state.qtotal){
    endQuiz();
    return;
  }

  state.qnum++;
  qnumEl.innerText = state.qnum;
  updateProgress();

  const scenario = state.questions[state.qnum - 1];
  if (scenario) scenario._answered = false;
  state.current = scenario;

  renderScenarioQuestion(scenario);
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.style.display = 'none';
  }
  afterRef.innerText = '';
  resetViewportScroll();
}

function stripScenarioPrefix(optText) {
  return String(optText || '').replace(/^[A-Da-d][\.\)]\s*/, '').trim();
}

function renderScenarioQuestion(scenario){
  if (!scenario) {
    qText.innerHTML = `<div class="scenario-card"><div class="scenario-body">${getText('errorScenarioMissing')}</div></div>`;
    return;
  }

  // Translate scenario content
  const translatedScenario = translateScenario(scenario);

  // Build the question prompt
  const prompt = `
  <div class="scenario-card">
    <div class="scenario-header">
      <span class="scenario-theme">${translatedScenario.theme || getText('unknownTheme')}</span>
      <span class="scenario-level">${translatedScenario.level || getText('levelNA')}</span>
    </div>
    <div class="scenario-body">
      <div class="scenario-challenge">${translatedScenario.challenge || getText('errorChallengeMissing')}</div>
      <div class="scenario-context">${getText('scenarioQuestion')}</div>
    </div>
  </div>`;

  qText.innerHTML = prompt;

  // Render answer options in randomized order (scenario.optionOrder)
  answersEl.innerHTML = '';
  const rawOptions = Array.isArray(translatedScenario.options) ? translatedScenario.options : [];
  const baseOptions = Array.isArray(scenario.options) ? scenario.options : rawOptions;
  const order = Array.isArray(scenario.optionOrder) && scenario.optionOrder.length === rawOptions.length
    ? scenario.optionOrder
    : rawOptions.map((_, i) => i);
  const displayLetters = ['A', 'B', 'C', 'D'];

  order.forEach((origIdx, displayIdx) => {
    const rawTranslated = rawOptions[origIdx] || '';
    const rawOriginal = baseOptions[origIdx] || rawTranslated;
    const origLetter = String(rawOriginal).trim().charAt(0).toUpperCase();
    const displayLetter = displayLetters[displayIdx] || String(displayIdx + 1);
    const cleanText = stripScenarioPrefix(rawTranslated);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `choice-${displayIdx + 1}`;
    btn.className = 'ans scenario-option';
    btn.dataset.value = origLetter;
    btn.dataset.displayLetter = displayLetter;
    btn.dataset.cleanText = cleanText;
    btn.innerHTML = `
      <span class="option-letter">${displayLetter}</span>
      <span class="option-text">${escapeHtml(cleanText)}</span>
    `;
    btn.addEventListener('click', () => answerScenarioQuestion(origLetter, displayLetter, cleanText));
    answersEl.appendChild(btn);
  });
}

function answerScenarioQuestion(selectedOrigLetter, selectedDisplayLetter = '', selectedCleanText = ''){
  const scenario = state.current;
  if (!scenario || scenario._answered) return;
  scenario._answered = true;
  const translatedScenario = translateScenario(scenario);
  const isCorrect = selectedOrigLetter === scenario.correct_answer;

  let correctDisplayLabel = scenario.correct_answer;
  let chosenDisplayLabel = selectedDisplayLetter || selectedOrigLetter;

  // Disable all answer buttons and highlight correct / incorrect
  Array.from(answersEl.querySelectorAll('.ans')).forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
    if (btn.dataset.value === scenario.correct_answer) {
      btn.classList.add('correct');
      correctDisplayLabel = `${btn.dataset.displayLetter}. ${btn.dataset.cleanText}`;
    }
    if (btn.dataset.value === selectedOrigLetter) {
      chosenDisplayLabel = `${btn.dataset.displayLetter}. ${btn.dataset.cleanText}`;
      if (!isCorrect) {
        btn.classList.add('incorrect');
        btn.classList.add('wrong');
      }
    }
  });

  // Update score and streak
  if (isCorrect) {
    state.score += 10;
    state.streak++;
    triggerScorePop(10);
    updateStreakHUD(state.streak);
    if (state.streak >= 3) {
      SoundFX.playStreak();
    } else {
      SoundFX.playCorrect();
    }
    scoreEl.innerText = state.score;
    streakEl.innerText = state.streak;
    showToast({ title: getText('correct') || 'Correct!', msg: '', type: 'success', timeout: 1200 });
  } else {
    state.streak = 0;
    updateStreakHUD(0);
    SoundFX.playWrong();
    scoreEl.innerText = state.score;
    streakEl.innerText = state.streak;
    showToast({ title: getText('wrongAnswer') || getText('wrong'), msg: '', type: 'error', timeout: 1400 });
  }

  state.results.push({
    prompt: translatedScenario.challenge,
    chosenDisplay: chosenDisplayLabel || selectedCleanText,
    correctDisplay: correctDisplayLabel,
    correct: isCorrect,
    ref: scenario.book_ref ? [scenario.book_ref] : [],
    explanation: translatedScenario.explanation
  });

  // Show explanation
  afterRef.innerHTML = `
    <div class="scenario-explanation">
      <strong>${isCorrect ? getText('scenarioCorrect') : getText('scenarioIncorrect')}</strong>
      <p>${translatedScenario.explanation || ''}</p>
      <p class="scenario-tags">${(scenario.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(' ')}</p>
    </div>
  `;

  scheduleAutoAdvance(isCorrect);
}

function setPauseButtonVisual(isPaused) {
  if (!btnPause) return;
  const label = isPaused ? (getText('resume') || 'Resume') : (getText('pause') || 'Pause');
  const iconSvg = isPaused
    ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>'
    : '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
  btnPause.innerHTML = `${iconSvg}<span>${escapeHtml(label)}</span>`;
}

function prepareQuiz(mode){
  clearAutoAdvance();
  stopTimer();
  state.mode = mode;
  state.timedOut = false;
  state.timeRemainingAtEnd = 0;
  afterRef.innerText='';
  state.score = 0; state.streak = 0; state.qnum = 0; state.results = []; state.paused = false;

  let count = parseInt(numQuestionsInput.value, 10) || 10;
  let difficulty = difficultySel ? (difficultySel.value || 'medium') : 'medium';
  if (mode === 'challenge' && state.challengeSettings) {
    count = state.challengeSettings.numQuestions || 10;
    difficulty = state.challengeSettings.difficulty || 'medium';
  }
  // Ensure challenge mode question count is strictly even
  if (mode === 'challenge') {
    count = count % 2 === 0 ? count : count + 1;
  }
  
  // Apply testament and gender filters to the people pool (normalizing legacy men/women -> male/female)
  let peoplePool = state.people.slice();
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  
  if (testamentFilter && testamentFilter.value && testamentFilter.value !== 'all') {
    peoplePool = peoplePool.filter(p => p.testament === testamentFilter.value);
  }
  
  if (genderFilter && genderFilter.value && genderFilter.value !== 'all') {
    const rawGender = genderFilter.value;
    const wantGender = rawGender === 'men' ? 'male' : rawGender === 'women' ? 'female' : rawGender;
    peoplePool = peoplePool.filter(p => p.gender === wantGender);
  }

  // Fallback to full pool if filters resulted in empty pool
  if (peoplePool.length === 0) {
    peoplePool = state.people.slice();
  }
  
  state.questions = pickQuestionSet(count, difficulty, peoplePool);
  if (!state.questions || state.questions.length === 0) {
    state.questions = pickQuestionSet(count, 'all', state.people);
  }
  state.qtotal = state.questions.length;
  state.lastQuizTotal = state.qtotal;

  if (state.qtotal === 0) {
    showToast({ title: 'Loading Data…', msg: 'Biblical figures are still loading. Please try again in a second.', type: 'warn', timeout: 2500 });
    showSetup();
    return;
  }

  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.style.display = 'none';
  }
  
  // Show the quiz interface and clear any pause state
  if (quizEl) {
    quizEl.classList.remove('quiz-paused');
    quizEl.style.display = 'block';
  }
  
  // Hide welcome message and show quiz content
  const welcomeMsg = document.getElementById('welcome-message');
  if(welcomeMsg) welcomeMsg.style.display = 'none';
  
  // Configure mode-specific elements
  if (timerEl) {
    timerEl.classList.remove('warn', 'danger', 'paused');
    timerEl.style.display = (mode === 'timed') ? 'inline-flex' : 'none';
  }
  if (btnPause) {
    setPauseButtonVisual(false);
    btnPause.style.display = (mode === 'timed') ? 'inline-flex' : 'none';
  }

  const isMulti = (mode === 'challenge' || mode === 'remote-challenge');
  if (challengeStatusEl) challengeStatusEl.style.display = isMulti ? 'flex' : 'none';
  const soloScoreChip = document.querySelector('.chip-score');
  const soloStreakChip = document.querySelector('#streak-chip');
  const progressChip = document.querySelector('.chip-progress');
  const progressTrack = document.querySelector('.progress-container-modern');
  if (soloScoreChip) soloScoreChip.style.display = isMulti ? 'none' : 'flex';
  if (soloStreakChip) soloStreakChip.style.display = isMulti ? 'none' : 'flex';
  if (progressChip) progressChip.style.display = 'flex';
  if (progressTrack) progressTrack.style.display = 'block';

  if (isMulti) {
    updateVersusHUD();
  } else if (versusTurnBanner) {
    versusTurnBanner.style.display = 'none';
  }
  
  nextQuestion();

  if (mode === 'timed') {
    const secs = parseInt(timeLimitInput?.value, 10) || 60;
    startTimer(secs);
  }
}

function quitQuiz(){
  showSetup();
}

// =========================
// Questions
// =========================
// Helper: returns false for placeholder/empty content that would make bad questions
function isValidContent(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  const invalid = [
    'to be researched', 'unknown', 'n/a', 'tbd', 'none', '', 'null', 'undefined',
    'to be added', 'not specified', 'varies', 'various', 'see notes'
  ];
  return !invalid.includes(s) && s.length > 2;
}

// Clean event into natural question predicate (active or passive)
function cleanEventPredicate(event) {
  if (!event) return 'lived faithfully in scripture';
  const e = String(event).trim();
  const words = e.split(/\s+/);
  const first = words[0].toLowerCase();
  const rest = words.slice(1).join(' ');

  const passiveVerbs = new Set([
    'swallowed', 'sold', 'turned', 'visited', 'betrayed', 'raised', 'called',
    'anointed', 'cast', 'fed', 'taken', 'converted', 'shipwrecked', 'beheaded',
    'exiled', 'dedicated', 'born', 'struck', 'stoned', 'chosen', 'saved',
    'blinded', 'imprisoned', 'released', 'buried', 'renamed', 'deceived'
  ]);

  if (passiveVerbs.has(first)) {
    return `was ${first} ${rest}`;
  }

  const titleNouns = new Set([
    'judge', 'first', 'second', 'ancestor', 'father', 'son', 'brother', 
    'mother', 'sister', 'cousin', 'prophet', 'priest', 'king', 'queen'
  ]);
  if (titleNouns.has(first)) {
    let article = 'a';
    if (first === 'ancestor') article = 'an';
    if (first === 'first' || first === 'second') article = 'the';
    return `was ${article} ${first} ${rest}`;
  }

  return `${first} ${rest}`;
}

function filterPeopleByDifficulty(people, difficulty) {
  const pList = people || state.people;
  if (!pList || pList.length === 0) return [];
  
  if (difficulty === 'easy') {
    const easyList = pList.filter(p => p.difficulty === 'easy');
    return easyList.length ? easyList : pList.slice();
  }
  
  if (difficulty === 'medium') {
    // 75% medium, 25% easy
    const medList = pList.filter(p => p.difficulty === 'medium');
    const easyList = pList.filter(p => p.difficulty === 'easy');
    const shuffledMed = medList.slice();
    const shuffledEasy = easyList.slice();
    shuffle(shuffledMed);
    shuffle(shuffledEasy);
    return [...shuffledMed, ...shuffledEasy.slice(0, Math.ceil(shuffledMed.length * 0.35))];
  }
  
  if (difficulty === 'hard') {
    // 75% hard, 25% medium
    const hardList = pList.filter(p => p.difficulty === 'hard');
    const medList = pList.filter(p => p.difficulty === 'medium');
    const shuffledHard = hardList.slice();
    const shuffledMed = medList.slice();
    shuffle(shuffledHard);
    shuffle(shuffledMed);
    const combined = [...shuffledHard, ...shuffledMed.slice(0, Math.ceil(hardList.length * 0.35))];
    return combined.length ? combined : pList.slice();
  }

  if (difficulty === 'expert') {
    // Strict hard-first pool, falling back to medium only if needed
    const hardList = pList.filter(p => p.difficulty === 'hard');
    const medList = pList.filter(p => p.difficulty === 'medium');
    const shuffledHard = hardList.slice();
    const shuffledMed = medList.slice();
    shuffle(shuffledHard);
    shuffle(shuffledMed);
    const combined = [...shuffledHard, ...shuffledMed];
    return combined.length ? combined : pList.slice();
  }
  
  return pList.slice();
}

function pickQuestionSet(count, difficulty, peoplePool = null) {
  // For 2-player challenge mode, ensure fair even count and balanced difficulty
  let targetCount = count;
  if (state.mode === 'challenge') {
    targetCount = targetCount % 2 === 0 ? targetCount : targetCount + 1;
  }

  const basePool = (Array.isArray(peoplePool) && peoplePool.length > 0) ? peoplePool : state.people;
  if (!basePool || basePool.length === 0) return [];

  let pool = filterPeopleByDifficulty(basePool, difficulty);
  if (!pool || pool.length === 0) pool = basePool.slice();

  // If narrow filter + difficulty yielded fewer candidates than targetCount, top up from remaining basePool figures
  if (pool.length < targetCount && basePool.length > pool.length) {
    const existingNames = new Set(pool.map(p => p.name));
    const extras = basePool.filter(p => !existingNames.has(p.name));
    shuffle(extras);
    pool = [...pool, ...extras];
  }

  // Distractor source ensures 4 distinct choices even when a narrow filter has < 4 figures
  const distractorPeople = basePool.length >= 8 ? basePool : state.people;
  
  const shuffledCandidates = pool.slice();
  shuffle(shuffledCandidates);

  const questions = [];
  const usedNames = new Set();
  const usedPrompts = new Set();
  
  const famousMothers = ['Sarah', 'Rebekah', 'Rachel', 'Leah', 'Hannah', 'Elizabeth', 'Mary (mother of Jesus)', 'Jochebed', 'Bathsheba', 'Eve', 'Hagar'];
  const famousFathers = ['Abraham', 'Isaac', 'Jacob', 'David', 'Saul (first king)', 'Jesse', 'Zechariah', 'Noah', 'Terah', 'Adam'];
  const biblicalRoles = [
    'Prophet of the Lord', 'King of Israel', 'Queen of Persia', 'Apostle of Jesus Christ',
    'Judge of Israel', 'High Priest', 'Fisherman and Disciple', 'Tentmaker and Missionary',
    'Tax Collector and Disciple', 'Cupbearer to the King', 'Scribe and Teacher of the Law'
  ];

  const getDistinctNameChoices = (correctName) => {
    const samePoolNames = pool.filter(p => p.name !== correctName).map(p => p.name);
    shuffle(samePoolNames);
    const chosen = new Set([correctName]);
    for (const n of samePoolNames) {
      if (chosen.size >= 4) break;
      chosen.add(n);
    }
    if (chosen.size < 4) {
      const fallbackNames = distractorPeople.filter(p => p.name !== correctName).map(p => p.name);
      shuffle(fallbackNames);
      for (const n of fallbackNames) {
        if (chosen.size >= 4) break;
        chosen.add(n);
      }
    }
    const arr = Array.from(chosen);
    shuffle(arr);
    return arr;
  };

  for (const person of shuffledCandidates) {
    if (questions.length >= targetCount) break;
    if (usedNames.has(person.name)) continue;

    const validEvs = (person.notable_events || []).filter(e => isValidContent(e));
    
    const candidateTypes = [];
    if (validEvs.length > 0) {
      candidateTypes.push('whoAmI', 'whoDid');
      candidateTypes.push('whichEvent');
    }
    if (person.mother && isValidContent(person.mother)) {
      candidateTypes.push('mother');
    }
    if (person.father && isValidContent(person.father)) {
      candidateTypes.push('father');
    }
    if (person.occupation && isValidContent(person.occupation) && person.occupation.length > 3) {
      candidateTypes.push('occupation');
    }

    if (candidateTypes.length === 0) continue;

    const qType = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];

    let prompt = '';
    let answer = '';
    let choices = [];

    if (qType === 'whoAmI') {
      const rawEvent = validEvs[Math.floor(Math.random() * validEvs.length)];
      const action = cleanEventPredicate(rawEvent);
      prompt = `Who am I? In scripture, I ${action}.`;
      answer = person.name;
      choices = getDistinctNameChoices(answer);
      
      questions.push({
        type: 'whoAmI',
        prompt,
        answer,
        choices,
        ref: person.verses || [],
        raw: { name: person.name, event: rawEvent }
      });
      usedNames.add(person.name);
      usedPrompts.add(prompt);

    } else if (qType === 'whoDid') {
      const rawEvent = validEvs[Math.floor(Math.random() * validEvs.length)];
      const action = cleanEventPredicate(rawEvent);
      prompt = `Who in scripture ${action}?`;
      answer = person.name;
      choices = getDistinctNameChoices(answer);

      questions.push({
        type: 'whoDid',
        prompt,
        answer,
        choices,
        ref: person.verses || [],
        raw: { name: person.name, event: rawEvent }
      });
      usedNames.add(person.name);
      usedPrompts.add(prompt);

    } else if (qType === 'whichEvent') {
      const correctEv = validEvs[Math.floor(Math.random() * validEvs.length)];
      prompt = `Which notable scriptural event is recorded for ${person.name}?`;
      answer = correctEv;

      const otherEvents = [];
      for (const other of distractorPeople) {
        if (other.name !== person.name && other.notable_events) {
          for (const oe of other.notable_events) {
            if (isValidContent(oe) && oe !== correctEv) otherEvents.push(oe);
          }
        }
      }
      shuffle(otherEvents);
      choices = [answer, ...otherEvents.slice(0, 3)];
      shuffle(choices);

      questions.push({
        type: 'whichEvent',
        prompt,
        answer,
        choices,
        ref: person.verses || [],
        raw: { name: person.name, event: correctEv }
      });
      usedNames.add(person.name);
      usedPrompts.add(prompt);

    } else if (qType === 'mother') {
      prompt = `Who is recorded in scripture as the mother of ${person.name}?`;
      answer = person.mother;
      const filteredMothers = famousMothers.filter(m => m !== answer);
      shuffle(filteredMothers);
      choices = [answer, ...filteredMothers.slice(0, 3)];
      shuffle(choices);

      questions.push({
        type: 'mother',
        prompt,
        answer,
        choices,
        ref: person.verses || [],
        raw: { name: person.name, mother: person.mother }
      });
      usedNames.add(person.name);
      usedPrompts.add(prompt);

    } else if (qType === 'father') {
      prompt = `Who is recorded in scripture as the father of ${person.name}?`;
      answer = person.father;
      const filteredFathers = famousFathers.filter(f => f !== answer);
      shuffle(filteredFathers);
      choices = [answer, ...filteredFathers.slice(0, 3)];
      shuffle(choices);

      questions.push({
        type: 'father',
        prompt,
        answer,
        choices,
        ref: person.verses || [],
        raw: { name: person.name, father: person.father }
      });
      usedNames.add(person.name);
      usedPrompts.add(prompt);

    } else if (qType === 'occupation') {
      prompt = `What was the biblical calling or role of ${person.name}?`;
      answer = person.occupation.split(',')[0].trim();
      const filteredRoles = biblicalRoles.filter(r => r.toLowerCase() !== answer.toLowerCase());
      shuffle(filteredRoles);
      choices = [answer, ...filteredRoles.slice(0, 3)];
      shuffle(choices);

      questions.push({
        type: 'occupation',
        prompt,
        answer,
        choices,
        ref: person.verses || [],
        raw: { name: person.name, occupation: person.occupation }
      });
      usedNames.add(person.name);
      usedPrompts.add(prompt);
    }
  }

  // Fallback pass 1: unused figures in pool
  let idx = 0;
  while (questions.length < targetCount && idx < pool.length) {
    const p = pool[idx++];
    if (usedNames.has(p.name)) continue;
    const evs = (p.notable_events || []).filter(e => isValidContent(e));
    if (evs.length === 0) continue;
    const rawEvent = evs[0];
    const action = cleanEventPredicate(rawEvent);
    const prompt = `Who in scripture ${action}?`;
    const answer = p.name;
    const choices = getDistinctNameChoices(answer);
    questions.push({
      type: 'whoDid',
      prompt,
      answer,
      choices,
      ref: p.verses || [],
      raw: { name: p.name, event: rawEvent }
    });
    usedNames.add(p.name);
    usedPrompts.add(prompt);
  }

  // Fallback pass 2: if narrow filter (e.g. NT Women = 9 figures) has fewer figures than requested 15/20/30 questions,
  // generate distinct additional event questions from those figures before topping up!
  if (questions.length < targetCount) {
    for (const p of shuffledCandidates) {
      if (questions.length >= targetCount) break;
      const evs = (p.notable_events || []).filter(e => isValidContent(e));
      for (const rawEvent of evs) {
        if (questions.length >= targetCount) break;
        const action = cleanEventPredicate(rawEvent);
        const prompt = `Who in scripture ${action}?`;
        if (usedPrompts.has(prompt)) continue;
        const choices = getDistinctNameChoices(p.name);
        questions.push({
          type: 'whoDid',
          prompt,
          answer: p.name,
          choices,
          ref: p.verses || [],
          raw: { name: p.name, event: rawEvent }
        });
        usedPrompts.add(prompt);
      }
    }
  }

  return questions.slice(0, targetCount);
}

function nextQuestion(){
  clearAutoAdvance();
  if(state.qnum >= state.qtotal){ endQuiz(); return; }
  state.current = state.questions[state.qnum];
  if (state.current) state.current._answered = false;
  state.qnum++;
  qnumEl.innerText = state.qnum;
  
  if (state.mode === 'challenge') {
    state.currentPlayerIndex = (state.qnum - 1) % 2;
    updateVersusHUD();
    scoreEl.innerText = state.players[state.currentPlayerIndex].score;
    const turnSecs = Number(state.challengeSettings?.timeLimit) || 0;
    if (turnSecs > 0) {
      startTurnTimer(turnSecs);
    } else {
      stopTimer();
      if (timerEl) timerEl.style.display = 'none';
    }
  } else {
    scoreEl.innerText = state.score;
  }
  streakEl.innerText = state.streak;
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.style.display = 'none';
  }
  renderQuestion(state.current);
  updateProgress();
  resetViewportScroll();
}

function renderQuestion(q){
  // If the question has raw tokens, regenerate localized prompt to respect current language
  if(q && q.raw){
    if(q.type==='whoAmI'){
      const ev = translateEvent(q.raw.event);
      const action = cleanEventPredicate(ev);
      qText.innerText = getText('questionWhoAmI', { event: action });
    } else if(q.type==='whoDid'){
      const ev = translateEvent(q.raw.event);
      const action = cleanEventPredicate(ev);
      qText.innerText = getText('questionWhoDid', { event: action });
    } else if(q.type==='whichEvent'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionWhichEvent', { name: translatedName });
    } else if(q.type==='occupation'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionOccupation', { name: translatedName });
    } else if(q.type==='mother' || q.type==='whoMother'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionWhoMother', { name: translatedName });
    } else if(q.type==='father'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionWhoFather', { name: translatedName });
    } else {
      qText.innerText = q.prompt;
    }
  } else if (q && q.prompt) {
    qText.innerText = q.prompt;
  }
  afterRef.innerText='';
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.style.display = 'none';
  }
  answersEl.innerHTML='';
  answersEl.setAttribute('aria-activedescendant','');
  answersEl.setAttribute('aria-label', getText('answersLabel'));
  
  // Trigger smooth question appearance animation
  qText.classList.remove('question-animating');
  answersEl.classList.remove('question-animating');
  void qText.offsetWidth; // force reflow
  qText.classList.add('question-animating');
  answersEl.classList.add('question-animating');

  // Use pre-generated choices if available (for remote challenge consistency)
  let choices;
  if (q.choices && Array.isArray(q.choices)) {
    choices = q.choices.map(c => ({ 
      original: c, 
      display: translateAnswerForQuestionType(q.type, c) 
    }));
  } else {
    choices = makeChoices(q);
  }
  
  choices.forEach((choiceObj, idx)=>{
    const div = document.createElement('div');
    div.className='ans';
    div.tabIndex=0;
    div.id = `choice-${idx+1}`;
    div.setAttribute('role','option');
    div.setAttribute('aria-selected','false');

    const keySpan = document.createElement('span');
    keySpan.className = 'choice-key';
    keySpan.setAttribute('aria-hidden', 'true');
    keySpan.textContent = `${idx + 1}`;

    const textSpan = document.createElement('span');
    textSpan.className = 'choice-text';
    textSpan.textContent = choiceObj.display;

    div.appendChild(keySpan);
    div.appendChild(textSpan);
    div.dataset.value = choiceObj.original;
    div.addEventListener('click',()=>handleAnswer(choiceObj.original,q,div));
    answersEl.appendChild(div);
  });
  // Focus first choice for keyboard accessibility without scrolling the viewport down
  const first = answersEl.querySelector('.ans');
  if(first) first.focus({ preventScroll: true });
}

function makeChoices(q){
  if (q && Array.isArray(q.choices) && q.choices.length === 4) {
    return q.choices.map(original => ({
      original,
      display: translateAnswerForQuestionType(q.type, original)
    }));
  }

  const set = new Set([q.answer]);
  const distractors = getDistractors(q);
  for(const d of distractors){
    if (d && normalize(d) !== normalize(q.answer)) {
      set.add(d);
    }
    if(set.size>=4) break;
  }
  
  // Biblical category fallback pools to avoid mismatching names with roles/mothers
  const fallbackPools = {
    occupation: [
      'Prophet of the Lord', 'King of Israel', 'Queen of Persia', 'Apostle of Jesus Christ',
      'Judge of Israel', 'High Priest', 'Fisherman and Disciple', 'Tentmaker and Missionary',
      'Tax Collector and Disciple', 'Cupbearer to the King', 'Scribe and Teacher of the Law'
    ],
    whoMother: [
      'Sarah', 'Rebekah', 'Rachel', 'Leah', 'Hannah', 
      'Elizabeth', 'Mary (mother of Jesus)', 'Jochebed', 'Bathsheba', 'Ruth', 'Eve'
    ],
    father: [
      'Abraham', 'Isaac', 'Jacob', 'David', 'Saul (first king)', 'Jesse', 'Zechariah', 'Noah', 'Terah', 'Adam'
    ],
    default: state.people.map(p => p.name)
  };

  const pool = fallbackPools[q.type] || fallbackPools.default;
  const shuffledPool = pool.slice();
  shuffle(shuffledPool);

  for (const item of shuffledPool) {
    if (set.size >= 4) break;
    if (item && normalize(item) !== normalize(q.answer)) {
      set.add(item);
    }
  }

  const arr = Array.from(set).map(original=>({ original, display: translateAnswerForQuestionType(q.type, original) }));
  shuffle(arr);
  return arr;
}

function getDistractors(q){
  const results = [];
  if(q.type==='occupation'){
    const pool = state.people.map(p=>p.occupation).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else if(q.type==='mother' || q.type==='whoMother'){
    const pool = state.people.map(p=>p.mother).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else if(q.type==='father'){
    const pool = state.people.map(p=>p.father).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else if(q.type==='whichEvent'){
    const pool = [];
    for (const p of state.people) {
      if (p.notable_events) {
        for (const e of p.notable_events) {
          if (isValidContent(e) && normalize(e) !== normalize(q.answer)) pool.push(e);
        }
      }
    }
    shuffle(pool); results.push(...pool);
  } else {
    const pool = state.people.map(p=>p.name).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  }
  return results;
}

function handleAnswer(choice,q, el){
  if (!q || q._answered || (el && el.classList.contains('disabled'))) return;
  q._answered = true;
  if (state.mode === 'challenge') stopTimer();
  // Disable further answers; mark correctness
  const correct = normalize(choice) === normalize(q.answer);
  const ansNodes = Array.from(answersEl.querySelectorAll('.ans'));
  ansNodes.forEach(node=>{
    node.classList.add('disabled');
  if(normalize(node.dataset.value) === normalize(q.answer)) node.classList.add('correct');
  });
  if(!correct) el.classList.add('incorrect');

  // Visual feedback simplified (no animations)

  if(correct){
    if(state.mode==='challenge'){
      state.players[state.currentPlayerIndex].score += 10;
      updateVersusHUD();
      const currentHero = state.players[state.currentPlayerIndex];
      SoundFX.playCorrect();
      afterRef.innerText = `${getText('correctAnswer')} — ${getText('references')}: ` + (q.ref||[]).join(', ');
      showToast({ title: 'Correct!', msg: `+10 pts for ${currentHero.name}!`, type: 'success', timeout: 1500 });
    } else {
      state.score += 10;
      state.streak += 1;
      triggerScorePop(10);
      updateStreakHUD(state.streak);
      if (state.streak >= 3) {
        SoundFX.playStreak();
      } else {
        SoundFX.playCorrect();
      }
      afterRef.innerText = `${getText('correctAnswer')} — ${getText('references')}: ` + (q.ref||[]).join(', ');
      // Remote challenge: sync score to Firebase
      if(state.mode==='remote-challenge' && window.RemoteChallenge){
        window.RemoteChallenge.submitAnswer(state.qnum - 1, true, 0, state.score, state.streak);
      }
      showToast({ title: getText('correctAnswer'), msg: getText('correctMsg'), type: 'success', timeout: 1500 });
    }
  }else{
    state.streak = 0;
    updateStreakHUD(0);
    SoundFX.playWrong();
    afterRef.innerText = `${getText('wrongAnswer')}. ${getText('correctLabel')}: ${translateAnswerForQuestionType(q.type, q.answer)}. ${getText('references')}: ${(q.ref||[]).join(', ')}`;
    if(state.mode==='challenge'){
      const currentHero = state.players[state.currentPlayerIndex];
      showToast({ title: getText('wrongAnswer'), msg: `No points for ${currentHero.name}.`, type: 'error', timeout: 1800 });
    } else {
      // Remote challenge: sync score to Firebase
      if(state.mode==='remote-challenge' && window.RemoteChallenge){
        window.RemoteChallenge.submitAnswer(state.qnum - 1, false, 0, state.score, 0);
      }
      showToast({ title: getText('wrongAnswer'), msg: getText('wrongMsg', { answer: translateAnswerForQuestionType(q.type, q.answer) }), type: 'error', timeout: 1800 });
    }
  }

  scoreEl.innerText = state.mode==='challenge' ? state.players[state.currentPlayerIndex].score : state.score;
  streakEl.innerText = state.streak;

  // Record result
  const activeIdx = (state.mode === 'challenge' || state.mode === 'remote-challenge') ? state.currentPlayerIndex : 0;
  const activeName = (state.players && state.players[activeIdx]) ? state.players[activeIdx].name : (state.currentPlayer?.name || 'Player');

  state.results.push({ 
    prompt: q.prompt, 
    playerIdx: activeIdx,
    playerName: activeName, 
    chosen: choice, 
    correctAnswer: q.answer, 
    chosenDisplay: translateAnswerForQuestionType(q.type, choice),
    correctDisplay: translateAnswerForQuestionType(q.type, q.answer),
    correct, 
    ref: q.ref||[] 
  });

  scheduleAutoAdvance(correct);
}

function updateChallengeScores(){
  p1ScoreEl.textContent = String(state.players[0].score);
  p2ScoreEl.textContent = String(state.players[1].score);
}

function endQuiz(){
  clearAutoAdvance();
  state.paused = false;
  if (state.qtotal > 0) state.lastQuizTotal = state.qtotal;
  state.timeRemainingAtEnd = Math.max(0, state.timerSecondsRemaining || 0);
  if (quizEl) quizEl.classList.remove('quiz-paused');

  let endText = `${getText('quizComplete')}! ${getText('yourScore')}: ${state.score}`;
  if (state.mode === 'timed') {
    endText = state.timedOut
      ? `⏰ ${getText('timeUp') || "Time's Up!"} ${getText('yourScore')}: ${state.score}`
      : `⚡ Beat the Clock! (${state.timeRemainingAtEnd}s left) • ${getText('yourScore')}: ${state.score}`;
  } else if(state.mode==='challenge' || state.mode==='remote-challenge'){
    const p1 = (state.players && state.players[0]) || { name: 'Player 1', score: 0 };
    const p2 = (state.players && state.players[1]) || { name: 'Player 2', score: 0 };
    const isTie = p1.score === p2.score;
    const winnerName = p1.score > p2.score ? p1.name : p2.name;
    endText = `⚔️ Match Complete! ${isTie ? 'Tie Game!' : 'Winner: ' + winnerName} (${p1.name}: ${p1.score} vs ${p2.name}: ${p2.score})`;
  }
  qText.innerText = endText;
  answersEl.innerHTML = '';
  afterRef.innerHTML = '';
  stopTimer();
  
  // In-page reopen button so players can always review summary
  const reopenBtn = document.createElement('button');
  reopenBtn.className = 'btn-reopen-summary';
  reopenBtn.innerHTML = '<span>🏆 View Match Summary & Review</span>';
  reopenBtn.onclick = () => showSummaryModal();
  afterRef.appendChild(reopenBtn);
  
  // Update player statistics
  const correctAnswers = state.results.filter(r => r.correct).length;
  const totalQuestions = state.results.length;
  updatePlayerStats(state.score, state.streak, correctAnswers, totalQuestions, state.mode);
  displayPlayerInfo();
  
  document.dispatchEvent(new CustomEvent('gameCompleted', {
    detail: {
      score: state.score,
      streak: state.streak,
      correct: correctAnswers,
      total: totalQuestions,
      mode: state.mode
    }
  }));
  
  if(state.mode==='remote-challenge' && window.RemoteChallenge){
    window.RemoteChallenge.completeChallenge();
  }
  
  state.current=null; state.questions=[]; state.qnum=0; state.qtotal=0;
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.style.display = 'none';
  }

  try {
    showSummaryModal();
  } catch (err) {
    console.error('Error opening summary modal:', err);
  }
  showToast({ title: getText('quizComplete'), msg: `${getText('yourScore')}: ${state.score}${state.mode==='challenge'?`. ${winnerText()}`:''}`, type: 'success', timeout: 5000 });

  // Auto-prompt feedback if not given yet
  // Feedback is now user-initiated only. No auto-prompt after first game.
// Gently animate feedback button after a delay if feedback not given
setTimeout(() => {
  if (!localStorage.getItem('who-bible-feedback-prompted')) {
    const btn = document.getElementById('btn-feedback');
    if (btn) btn.classList.add('feedback-attention');
  }
}, 180000); // 3 minutes
}

function winnerText(){
  const [p1,p2] = state.players;
  if(p1.score===p2.score) return getText('tieGame');
  return `${getText('winner')}: ${p1.score>p2.score?p1.name:p2.name}`;
}

// =========================
// Timer
// =========================
function startTimer(seconds){
  stopTimer();
  state.timerSecondsRemaining = seconds;
  const trEl = document.getElementById('time-remaining');
  if(trEl) trEl.textContent = String(state.timerSecondsRemaining);
  if (timerEl) {
    timerEl.classList.remove('warn', 'danger', 'paused');
    timerEl.style.display = 'inline-flex';
  }
  const warnThresholds = new Set([30, 10, 5]);
  state.timerId = setInterval(()=>{
    if(state.paused) return;
    state.timerSecondsRemaining -= 1;
    const t = Math.max(0, state.timerSecondsRemaining);
    const currentTrEl = document.getElementById('time-remaining');
    if(currentTrEl) currentTrEl.textContent = String(t);

    // Timer styling thresholds & warnings
    if (timerEl) {
      timerEl.classList.remove('warn','danger');
      if (t <= 5) timerEl.classList.add('danger');
      else if (t <= 15) timerEl.classList.add('warn');
    }

    if (warnThresholds.has(t) && t < seconds) {
      warnThresholds.delete(t);
      showToast({
        title: getText('timeWarning') || '⏱️ Time Warning',
        msg: getText('timeWarningMsg', { time: t }) || `Only ${t} seconds remaining!`,
        type: t <= 5 ? 'error' : 'warn',
        timeout: 1200
      });
    }

    if(t <= 10 && t > 0) {
      SoundFX.playTick();
    }
    if(state.timerSecondsRemaining <= 0){
      state.timedOut = true;
      clearAutoAdvance();
      stopTimer();
      SoundFX.playWrong();
      showToast({ title: getText('timeUp') || "⏰ Time's Up!", msg: getText('timeUpMsg') || 'Clock expired!', type: 'warn', timeout: 2200 });
      endQuiz();
    }
  },1000);
}

function startTurnTimer(seconds){
  stopTimer();
  state.timerSecondsRemaining = seconds;
  const trEl = document.getElementById('time-remaining');
  if (trEl) trEl.textContent = String(state.timerSecondsRemaining);
  timerEl.classList.remove('warn', 'danger');
  timerEl.style.display = 'inline-flex';
  state.timerId = setInterval(() => {
    state.timerSecondsRemaining -= 1;
    const currentTrEl = document.getElementById('time-remaining');
    if (currentTrEl) currentTrEl.textContent = String(Math.max(0, state.timerSecondsRemaining));
    timerEl.classList.remove('warn', 'danger');
    if (state.timerSecondsRemaining <= 5) timerEl.classList.add('danger');
    else if (state.timerSecondsRemaining <= 10) timerEl.classList.add('warn');
    if (state.timerSecondsRemaining <= 5 && state.timerSecondsRemaining > 0) {
      SoundFX.playTick();
    }
    if (state.timerSecondsRemaining <= 0) {
      stopTimer();
      const q = state.current;
      if (!q || q._answered) return;
      q._answered = true;
      Array.from(answersEl.querySelectorAll('.ans')).forEach(node => {
        node.classList.add('disabled');
        if (normalize(node.dataset.value) === normalize(q.answer)) node.classList.add('correct');
      });
      SoundFX.playWrong();
      const activeIdx = state.currentPlayerIndex || 0;
      const activePlayer = (state.players && state.players[activeIdx]) || { name: 'Player' };
      afterRef.innerText = `${getText('timeUp') || 'Time Up'}! ${getText('correctLabel')}: ${translateAnswerForQuestionType(q.type, q.answer)}. ${getText('references')}: ${(q.ref || []).join(', ')}`;
      showToast({ title: '⏱️ Turn Time Expired', msg: `No points for ${activePlayer.name}.`, type: 'warn', timeout: 2000 });
      state.results.push({
        prompt: q.prompt,
        playerIdx: activeIdx,
        playerName: activePlayer.name,
        chosen: 'Time Expired',
        correctAnswer: q.answer,
        chosenDisplay: '⏱️ Time Expired',
        correctDisplay: translateAnswerForQuestionType(q.type, q.answer),
        correct: false,
        ref: q.ref || []
      });
      scheduleAutoAdvance(false);
    }
  }, 1000);
}

function stopTimer(){
  if(state.timerId){
    clearInterval(state.timerId);
    state.timerId = null;
  }
  // Ensure timer display is hidden when stopped, unless in timed mode and paused
  if(state.mode !== 'timed' || state.timerSecondsRemaining <= 0) {
     // Optional: hide timer if desired, but keeping it visible with 0 is also fine
  }
}

function togglePause(){
  if(state.mode!=='timed') return;
  state.paused = !state.paused;
  setPauseButtonVisual(state.paused);
  if (quizEl) quizEl.classList.toggle('quiz-paused', state.paused);
  if (timerEl) timerEl.classList.toggle('paused', state.paused);
  
  // Disable/Enable answers based on pause state
  const ansNodes = Array.from(answersEl.querySelectorAll('.ans'));
  ansNodes.forEach(node => {
    if(state.paused) {
      node.classList.add('disabled');
      node.style.pointerEvents = 'none';
    } else {
      // Only re-enable if not already answered/disabled
      if(!node.classList.contains('correct') && !node.classList.contains('incorrect') && !(state.current && state.current._answered)) {
        node.classList.remove('disabled');
        node.style.pointerEvents = 'auto';
      }
    }
  });

  showToast({ title: state.paused ? getText('paused') : getText('resumed'), msg: state.paused ? getText('timerPaused') : getText('timerRunning'), type: 'info', timeout: 1200 });
}

// =========================
// Study/Lookup
// =========================
function getPersonIcon(p) {
  if (!p) return '📖';
  const occ = (p.occupation || '').toLowerCase();
  
  if (occ.includes('king') || occ.includes('queen') || occ.includes('pharaoh') || occ.includes('ruler')) return '👑';
  if (occ.includes('prophet') || occ.includes('seer') || occ.includes('prophetess')) return '📜'; // Holy scroll
  if (occ.includes('priest') || occ.includes('levite') || occ.includes('high priest')) return '🕯️'; // Sacred Light
  if (occ.includes('apostle') || occ.includes('disciple') || occ.includes('evangelist')) return '⛵'; // Gospel Herald / Galilean boat
  if (occ.includes('judge') || occ.includes('lawgiver')) return '⚖️'; // Scales of Justice
  if (occ.includes('warrior') || occ.includes('commander') || occ.includes('captain')) return '🛡️'; // Shield of Faith
  if (occ.includes('shepherd')) return '🐑';
  if (occ.includes('carpenter') || occ.includes('builder') || occ.includes('artisan')) return '📐';
  if (occ.includes('patriarch') || occ.includes('matriarch')) return '🏛️';
  return '📖'; // Scripture Scroll/Book
}

function renderPeopleList(filterText = '') {
  if (!peopleList) return;
  peopleList.innerHTML = '';

  const sortVal = state.studySort || (sortSelect ? sortSelect.value : 'name-asc');
  let arr = (sortVal === 'shuffle' && Array.isArray(state.shuffledPeople) && state.shuffledPeople.length === state.people.length)
    ? state.shuffledPeople.slice()
    : state.people.slice();

  const q = normalize(filterText !== '' ? filterText : (searchPerson ? searchPerson.value : ''));
  if (q) {
    arr = arr.filter(p => 
      normalize(p.name).includes(q) || 
      (p.aliases && p.aliases.some(a => normalize(a).includes(q))) ||
      normalize(p.occupation || '').includes(q) ||
      normalize(p.meaning || '').includes(q) ||
      (p.notable_events && p.notable_events.some(e => normalize(e).includes(q)))
    );
  }

  // Segmented Testament + Difficulty Filters (can combine cleanly!)
  const testamentVal = state.studyTestament || 'all';
  const diffVal = state.studyDifficulty || 'all';
  if (testamentVal !== 'all') {
    arr = arr.filter(p => p.testament === testamentVal);
  }
  if (diffVal !== 'all') {
    arr = arr.filter(p => p.difficulty === diffVal);
  }

  // Legacy fallback if checked
  if (filterOccupation?.checked) arr = arr.filter(p => !!p.occupation);
  if (filterAge?.checked) arr = arr.filter(p => !!p.age_notes);
  if (filterMother?.checked) arr = arr.filter(p => !!p.mother || !!p.father);
  
  // Sort unless in active Shuffle mode
  if (sortVal === 'name-desc') {
    arr.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortVal !== 'shuffle') {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (peopleCountEl) peopleCountEl.textContent = String(arr.length);
  const clearBtn = document.getElementById('btn-clear-study-search');
  if (clearBtn) clearBtn.style.display = q ? 'inline-flex' : 'none';

  // Show/hide Reset Filters chip when any filter/search/shuffle is active
  const resetBtn = document.getElementById('btn-study-reset-filters');
  const hasActiveFilter = !!(q || testamentVal !== 'all' || diffVal !== 'all' || sortVal === 'shuffle');
  if (resetBtn) resetBtn.style.display = hasActiveFilter ? 'inline-flex' : 'none';

  if (arr.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'study-empty-state';
    emptyEl.innerHTML = `
      <div style="font-size: 36px;">🔎</div>
      <h3>No matching biblical figures found</h3>
      <p style="margin-bottom: 16px;">Try a broader search term or reset your Testament / Level filters.</p>
      <button type="button" class="study-action-btn active" id="btn-empty-clear-study">↺ Reset All Filters</button>
    `;
    emptyEl.querySelector('#btn-empty-clear-study')?.addEventListener('click', () => {
      document.getElementById('btn-study-reset-filters')?.click();
    });
    peopleList.appendChild(emptyEl);
    return;
  }

  for (const p of arr) {
    const item = document.createElement('div');
    item.className = 'person-card';
    
    const icon = getPersonIcon(p);
    const diffBadge = p.difficulty ? `<span class="tag tag-${p.difficulty}">${p.difficulty.toUpperCase()}</span>` : '';
    
    item.innerHTML = `
      <div class="card-header">
        <div class="card-icon">${icon}</div>
        <div class="card-title">${p.name}</div>
      </div>
      <div class="card-body">
        <div class="card-info">${translateOccupation(p.occupation) || getText('unknownOccupation') || 'Biblical Figure'}</div>
        <div class="card-tags">
          ${p.testament === 'ot' ? '<span class="tag tag-ot">Old Testament</span>' : '<span class="tag tag-nt">New Testament</span>'}
          ${diffBadge}
        </div>
      </div>
    `;
    
    item.addEventListener('click', () => showPersonDetails(p));
    peopleList.appendChild(item);
  }
}

function showPersonDetails(p){
  const modal = document.getElementById('person-modal');
  const title = document.getElementById('person-modal-title');
  const body = document.getElementById('person-modal-body');
  if(!modal || !title || !body) return;
  
  title.innerHTML = `<span style="margin-right: 8px;">${getPersonIcon(p)}</span>${p.name}`;
  
  const aliasLabel = getText('aliases');
  const motherLabel = getText('filterMother');
  const occupationLabel = getText('filterOccupation');
  const ageLabel = getText('filterAge');
  const eventsLabel = getText('events');
  const versesLabel = getText('verses');
  const eventsJoined = (p.notable_events||[]).map(translateEvent).join(', ');
  
  let relationshipBadges = '';
  if (window.RelationshipSystem) {
    const suggestions = RelationshipSystem.getSuggestions(p.name, state.people, 3);
    if (suggestions.family && suggestions.family.length > 0) {
      const familyNames = suggestions.family.map(rel => `${rel.name} (${rel.relationship})`).join(', ');
      relationshipBadges += `<div class="detail-row"><strong>Family:</strong> ${familyNames}</div>`;
    }
  }

  body.innerHTML = `
    <div class="person-detail-view">
      <div class="detail-bio">${p.short_bio || ''}</div>
      <div class="detail-grid">
        ${relationshipBadges}
        ${p.aliases?.length?`<div class="detail-row"><strong>${aliasLabel}:</strong> ${p.aliases.join(', ')}</div>`:''}
        ${p.mother?`<div class="detail-row"><strong>${motherLabel}:</strong> ${p.mother}</div>`:''}
        ${p.father?`<div class="detail-row"><strong>Father:</strong> ${p.father}</div>`:''}
        ${p.spouse?`<div class="detail-row"><strong>Spouse:</strong> ${Array.isArray(p.spouse) ? p.spouse.join(', ') : p.spouse}</div>`:''}
        ${p.children?.length?`<div class="detail-row"><strong>Children:</strong> ${p.children.join(', ')}</div>`:''}
        ${p.occupation?`<div class="detail-row"><strong>${occupationLabel}:</strong> ${translateOccupation(p.occupation)}</div>`:''}
        ${p.age_notes?`<div class="detail-row"><strong>${ageLabel}:</strong> ${p.age_notes}</div>`:''}
        ${p.notable_events?.length?`<div class="detail-row"><strong>${eventsLabel}:</strong> ${eventsJoined}</div>`:''}
        <div class="detail-row ref"><strong>${versesLabel}:</strong> ${p.verses?.join(', ')||''}</div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // Ensure close handlers are attached (idempotent)
  const btnClose = document.getElementById('btn-person-close');
  const btnOk = document.getElementById('btn-person-ok');
  
  const closeFn = () => { modal.style.display = 'none'; };
  
  // Remove old listeners to avoid duplicates (simple way: clone node)
  // But better to just set onclick for simplicity in this context
  if(btnClose) btnClose.onclick = closeFn;
  if(btnOk) btnOk.onclick = closeFn;
  
  // Click outside
  modal.onclick = (e) => {
    if(e.target === modal) closeFn();
  };
}

function toggleAllDetails(expand){
  const items = peopleList.querySelectorAll('.person-details');
  items.forEach(el=>{ el.style.display = expand ? 'block' : 'none'; });
}

// =========================
// Import/Export & Persistence
// =========================
function exportJson(){
  const json = JSON.stringify(state.people,null,2);
  // Download as file
  const blob = new Blob([json],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='people_data.json'; a.click(); URL.revokeObjectURL(url);
  // Also try to copy to clipboard for convenience
  if(navigator && navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(json).then(()=>{
      showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1800 });
    }).catch(()=>{
      // Clipboard failed; still show download success
      showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1800 });
    });
  } else {
    showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1800 });
  }
}

async function handleImportFile(e){
  const f = e.target.files?.[0]; if(!f) return;
  const txt = await f.text();
  try{
    const parsed = JSON.parse(txt);
    if(!Array.isArray(parsed)){
      showToast({ title: getText('importError'), msg: getText('importErrorMsg'), type: 'error' });
    } else {
      // Validate each item and collect errors
      const errors = [];
      const valid = [];
      parsed.forEach((item, idx)=>{
        const res = validatePerson(item);
        if(res.valid) valid.push(item);
        else errors.push(`${getText('item')} ${idx+1}: ${res.reason}`);
      });
      if(errors.length){
        const msg = `${getText('importError')}: ${errors.slice(0,5).join('; ')}${errors.length>5?` (+${errors.length-5} ${getText('more')})`:''}`;
        showToast({ title: getText('importError'), msg, type: 'error', timeout: 5000 });
      }
      if(valid.length>0){
        state.people = valid;
        savePeopleDataToLocalStorage(valid);
        renderPeopleList();
        showToast({ title: getText('importSuccess'), msg: getText('importMsg'), type: 'success' });
      }
    }
  }catch(err){
    showToast({ title: getText('importError'), msg: (err?.message||String(err)), type: 'error' });
  } finally {
    e.target.value = '';
  }
}

// Simple runtime validation for imported person objects
function validatePerson(p){
  if(!p || typeof p !== 'object') return { valid:false, reason: 'Not an object' };
  if(!p.name || typeof p.name !== 'string' || !p.name.trim()) return { valid:false, reason: 'Missing or invalid "name"' };
  if(p.aliases && !Array.isArray(p.aliases)) return { valid:false, reason: '"aliases" must be an array if present' };
  if(p.mother && typeof p.mother !== 'string') return { valid:false, reason: '"mother" must be a string if present' };
  if(p.occupation && typeof p.occupation !== 'string') return { valid:false, reason: '"occupation" must be a string if present' };
  if(p.age_notes && typeof p.age_notes !== 'string') return { valid:false, reason: '"age_notes" must be a string if present' };
  if(p.notable_events && !Array.isArray(p.notable_events)) return { valid:false, reason: '"notable_events" must be an array if present' };
  if(p.verses && !Array.isArray(p.verses)) return { valid:false, reason: '"verses" must be an array if present' };
  // short_bio optional but should be string if present
  if(p.short_bio && typeof p.short_bio !== 'string') return { valid:false, reason: '"short_bio" must be a string if present' };
  return { valid:true };
}

async function resetData(){
  const confirmed = await showConfirmDialog({
    title: 'Reset Character Data?',
    message: getText('resetConfirm') || 'Reset to built-in dataset? This will remove any custom imported data.',
    confirmText: 'Reset Data',
    cancelText: 'Cancel'
  });
  if(confirmed){
    localStorage.removeItem('peopleData');
    state.people = DEFAULT_PEOPLE_DATA.slice();
    renderPeopleList();
    showToast({ title: getText('resetSuccess'), msg: getText('resetMsg'), type: 'success' });
  }
}

function savePeopleDataToLocalStorage(arr){
  try{ localStorage.setItem('peopleData', JSON.stringify(arr)); }catch(_){/* ignore */}
}

function loadPeopleDataFromLocalStorage(){
  try{
    const txt = localStorage.getItem('peopleData');
    if(!txt) return null;
    const parsed = JSON.parse(txt);
    return (Array.isArray(parsed) && parsed.length > 0) ? parsed : null;
  }catch(_){ return null; }
}

// =========================
// Utilities
// =========================
function normalize(s){ return (s||'').toString().trim().toLowerCase(); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} }

function onAnswersKeyDown(e){
  const items = Array.from(answersEl.querySelectorAll('.ans'));
  if(items.length===0) return;
  const idx = items.findIndex(x=>x===document.activeElement);
  if(e.key==='ArrowDown'){
    e.preventDefault();
    const next = items[(idx+1+items.length)%items.length]; next?.focus();
  }else if(e.key==='ArrowUp'){
    e.preventDefault();
    const prev = items[(idx-1+items.length)%items.length]; prev?.focus();
  }else if(e.key==='Enter'){
    e.preventDefault();
    document.activeElement?.click();
  }else if(/^[1-4]$/.test(e.key)){
    e.preventDefault();
    const num = parseInt(e.key,10);
    const target = items[num-1]; target?.click();
  }else if(e.key.toLowerCase()==='n'){
    if(!btnNext.disabled) btnNext.click();
  }else if(e.key.toLowerCase()==='q'){
    btnQuit.click();
  }
}

function updateProgress(){
  if(!progressBarEl) return;
  const answered = Math.max(0, state.qnum - 1);
  const pct = state.qtotal ? Math.round((answered / state.qtotal) * 100) : 0;
  progressBarEl.style.width = pct + '%';
}

function setModalScrollLock(locked) {
  if (locked) {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

function isModalElementVisible(el) {
  if (!el) return false;
  if (el.classList.contains('show') || el.classList.contains('active')) return true;
  const inlineDisplay = el.style ? el.style.display : '';
  if (inlineDisplay && inlineDisplay !== 'none') return true;
  if (!inlineDisplay) {
    const computed = window.getComputedStyle(el);
    return computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0';
  }
  return false;
}

function syncModalScrollLock() {
  const candidates = document.querySelectorAll('.modal-overlay, #feedback-modal, #report-modal, #auth-modal');
  let anyOpen = false;
  for (const el of candidates) {
    if (isModalElementVisible(el)) {
      anyOpen = true;
      break;
    }
  }
  setModalScrollLock(anyOpen);
}
window.syncModalScrollLock = syncModalScrollLock;

function initUniversalModalScrollLock() {
  const observeTarget = (el) => {
    if (!el || el._wbScrollObserved) return;
    el._wbScrollObserved = true;
    const obs = new MutationObserver(() => syncModalScrollLock());
    obs.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
  };

  document.querySelectorAll('.modal-overlay, #feedback-modal, #report-modal, #auth-modal').forEach(observeTarget);

  // Also catch dynamically injected modals (e.g. #auth-modal added by auth-ui.js)
  const bodyObs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.matches?.('.modal-overlay, #feedback-modal, #report-modal, #auth-modal')) {
            observeTarget(node);
            syncModalScrollLock();
          }
          node.querySelectorAll?.('.modal-overlay, #feedback-modal, #report-modal, #auth-modal').forEach(observeTarget);
        }
      });
    }
  });
  bodyObs.observe(document.body, { childList: true });
}

function showConfirmDialog({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const okBtn = document.getElementById('btn-confirm-modal-ok');
    const cancelBtn = document.getElementById('btn-confirm-modal-cancel');
    const closeBtn = document.getElementById('btn-confirm-modal-close');

    if (!modal || !okBtn || !cancelBtn) {
      resolve(true);
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    modal.style.display = 'flex';
    syncModalScrollLock();

    const finish = (val) => {
      modal.style.display = 'none';
      syncModalScrollLock();
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      if (closeBtn) closeBtn.onclick = null;
      modal.onclick = null;
      resolve(val);
    };

    okBtn.onclick = () => finish(true);
    cancelBtn.onclick = () => finish(false);
    if (closeBtn) closeBtn.onclick = () => finish(false);
    modal.onclick = (e) => { if (e.target === modal) finish(false); };
    setTimeout(() => okBtn.focus(), 50);
  });
}

// Theme
function applyTheme(theme){
  state.theme = 'night';
  document.body.classList.remove('day');
  document.body.classList.add('night');
  if (btnTheme) btnTheme.style.display = 'none';
}

function saveSettingsFromUI(){
  const existing = loadSettings() || {};
  const testamentEl = document.getElementById('testament-filter');
  const genderEl = document.getElementById('gender-filter');
  const settings = {
    ...existing,
    difficulty: difficultySel?.value || 'medium',
    numQuestions: parseInt(numQuestionsInput?.value, 10) || 10,
    timeLimit: parseInt(timeLimitInput?.value, 10) || 60,
    testamentFilter: testamentEl?.value || 'all',
    genderFilter: genderEl?.value || 'all',
    theme: state.theme || 'night'
  };
  try{ localStorage.setItem('settings', JSON.stringify(settings)); }catch(_){/* ignore */}
}

function loadSettings(){
  try{
    const txt = localStorage.getItem('settings');
    if(!txt) return null;
    return JSON.parse(txt);
  }catch(_){ return null; }
}

// Summary modal
function showSummaryModal(){
  if(!modalEl) return;
  document.body.style.overflow = 'hidden';
  window._modalOpenedTime = Date.now();
  const modalBody = modalEl.querySelector('.modal-body');
  if (modalBody) modalBody.scrollTop = 0;

  // Customize Play Again & Settings button dynamically per mode
  const btnSummarySettingsEl = document.getElementById('btn-summary-settings');
  if (btnSummarySettingsEl) {
    btnSummarySettingsEl.style.display = ['solo', 'timed', 'scenarios', 'challenge'].includes(state.mode)
      ? 'inline-flex'
      : 'none';
  }
  if (btnPlayAgain) {
    if (state.mode === 'challenge') {
      btnPlayAgain.textContent = '⚔️ Rematch';
    } else if (state.mode === 'remote-challenge') {
      btnPlayAgain.textContent = '🌍 New Online Match';
    } else if (state.mode === 'daily') {
      btnPlayAgain.textContent = '🔄 Replay Daily';
    } else {
      btnPlayAgain.textContent = '🔄 Play Again';
    }
  }
  
  const answeredCount = state.results.length;
  const total = (state.mode === 'timed' && state.lastQuizTotal > answeredCount)
    ? state.lastQuizTotal
    : answeredCount;
  const correct = state.results.filter(r=>r.correct).length;
  const accuracy = total ? Math.round((correct/total)*100) : 0;
  const isMulti = (state.mode === 'challenge' || state.mode === 'remote-challenge');
  
  if (accuracy >= 70) {
    SoundFX.playFanfare();
  } else {
    SoundFX.playCorrect();
  }
  
  // Update victory banner
  const headlineEl = document.getElementById('summary-headline');
  const subtextEl = document.getElementById('summary-subtext');
  const badgeIconEl = document.getElementById('summary-badge-icon');
  
  if (isMulti) {
    const p1 = (state.players && state.players[0]) || { name: 'Player 1', score: 0 };
    const p2 = (state.players && state.players[1]) || { name: 'Player 2', score: 0 };
    const isTie = p1.score === p2.score;
    const winnerName = p1.score > p2.score ? p1.name : p2.name;

    if (badgeIconEl) badgeIconEl.textContent = isTie ? '🤝' : '🏆';
    if (headlineEl) headlineEl.textContent = isTie ? 'Match Tied!' : `${winnerName} Victory!`;
    if (subtextEl) subtextEl.textContent = isTie ? 'An evenly matched battle of scripture knowledge!' : `Congratulations ${winnerName} on winning the match!`;
  } else if (state.mode === 'timed') {
    if (state.timedOut) {
      if (badgeIconEl) badgeIconEl.textContent = '⏰';
      if (headlineEl) headlineEl.textContent = "Time's Up!";
      if (subtextEl) subtextEl.textContent = `You answered ${answeredCount} of ${total} questions (${correct} correct) before the clock hit 0s.`;
    } else if (accuracy >= 80) {
      if (badgeIconEl) badgeIconEl.textContent = '⚡';
      if (headlineEl) headlineEl.textContent = 'Beat the Clock!';
      if (subtextEl) subtextEl.textContent = `Finished all ${total} questions with ${state.timeRemainingAtEnd || 0}s to spare!`;
    } else {
      if (badgeIconEl) badgeIconEl.textContent = '⏱️';
      if (headlineEl) headlineEl.textContent = 'Timed Run Complete!';
      if (subtextEl) subtextEl.textContent = `Completed all ${total} questions with ${state.timeRemainingAtEnd || 0}s remaining on the clock.`;
    }
  } else {
    if (accuracy >= 90) {
      if (badgeIconEl) badgeIconEl.textContent = '👑';
      if (headlineEl) headlineEl.textContent = 'Masterful Knowledge!';
      if (subtextEl) subtextEl.textContent = 'You answered almost every question flawlessly.';
    } else if (accuracy >= 70) {
      if (badgeIconEl) badgeIconEl.textContent = '🌟';
      if (headlineEl) headlineEl.textContent = 'Great Performance!';
      if (subtextEl) subtextEl.textContent = 'Strong grasp of scripture and biblical accounts.';
    } else {
      if (badgeIconEl) badgeIconEl.textContent = '📖';
      if (headlineEl) headlineEl.textContent = 'Challenge Completed!';
      if (subtextEl) subtextEl.textContent = 'Every round builds your scripture knowledge deeper.';
    }
  }

  // Versus / 2-Player banner & dual player statistics
  let versusBannerHtml = '';
  if (isMulti) {
    const p1 = (state.players && state.players[0]) || { name: 'Player 1', score: 0 };
    const p2 = (state.players && state.players[1]) || { name: 'Player 2', score: 0 };
    const isTie = p1.score === p2.score;
    const winnerBadge = isTie ? '🤝 Match Tied!' : `🏆 ${p1.score > p2.score ? p1.name : p2.name} Wins!`;

    const p1Results = state.results.filter(r => r.playerIdx === 0);
    const p2Results = state.results.filter(r => r.playerIdx === 1);
    const isRemote = state.mode === 'remote-challenge';
    const p1Total = isRemote ? total : p1Results.length;
    const p2Total = isRemote ? total : p2Results.length;
    const p1Correct = p1Results.length ? p1Results.filter(r => r.correct).length : (isRemote ? Math.round((p1.score || 0) / 10) : 0);
    const p2Correct = p2Results.length ? p2Results.filter(r => r.correct).length : (isRemote ? Math.round((p2.score || 0) / 10) : 0);
    const p1Acc = p1Total ? Math.round((p1Correct / p1Total) * 100) : 0;
    const p2Acc = p2Total ? Math.round((p2Correct / p2Total) * 100) : 0;

    versusBannerHtml = `
      <div class="summary-versus-card">
        <div class="versus-result-title">${winnerBadge}</div>
        <div class="versus-dual-stats">
          <div class="player-stat-col ${p1.score > p2.score ? 'is-winner' : ''}">
            <div class="p-col-name">⚔️ ${escapeHtml(p1.name)}</div>
            <div class="p-col-score">${p1.score} <small>pts</small></div>
            <div class="p-col-meta">${p1Correct}/${p1Total} Correct (${p1Acc}%)</div>
          </div>
          <div class="versus-divider-badge">VS</div>
          <div class="player-stat-col ${p2.score > p1.score ? 'is-winner' : ''}">
            <div class="p-col-name">🛡️ ${escapeHtml(p2.name)}</div>
            <div class="p-col-score">${p2.score} <small>pts</small></div>
            <div class="p-col-meta">${p2Correct}/${p2Total} Correct (${p2Acc}%)</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Render stats grid
  if (summaryStatsEl) {
    if (isMulti) {
      summaryStatsEl.innerHTML = versusBannerHtml;
    } else {
      const xpEarned = correct * 10 + (state.streak * 5);
      summaryStatsEl.innerHTML = `
        <div class="summary-stat-box">
          <span class="s-stat-num">${accuracy}%</span>
          <span class="s-stat-label">Accuracy</span>
        </div>
        <div class="summary-stat-box">
          <span class="s-stat-num">${correct}/${total}</span>
          <span class="s-stat-label">Correct</span>
        </div>
        <div class="summary-stat-box">
          <span class="s-stat-num">${state.score}</span>
          <span class="s-stat-label">Points</span>
        </div>
        <div class="summary-stat-box">
          <span class="s-stat-num">+${xpEarned}</span>
          <span class="s-stat-label">XP Earned</span>
        </div>
      `;
    }
  }

  // Render question breakdown list
  if (summaryListEl) {
    summaryListEl.innerHTML = '';
    state.results.forEach((r, idx) => {
      const div = document.createElement('div');
      div.className = 'summary-review-card ' + (r.correct ? 'is-correct' : 'is-wrong');
      const statusIcon = r.correct ? '✅' : '❌';
      const versesFormatted = (r.ref && r.ref.length > 0) 
        ? r.ref.map(v => `<span class="verse-badge">${v}</span>`).join(' ')
        : '<span class="verse-badge">Biblical Canon</span>';

      const playerTag = (isMulti && r.playerName)
        ? `<span class="review-player-tag ${r.playerIdx === 0 ? 'p1-tag' : 'p2-tag'}">${r.playerIdx === 0 ? '⚔️' : '🛡️'} ${escapeHtml(r.playerName)}</span>`
        : '';

      div.innerHTML = `
        <div class="review-card-header">
          <span class="review-q-num">Q${idx + 1}</span>
          ${playerTag}
          <span class="review-status-icon">${statusIcon}</span>
          <div class="review-prompt">${escapeHtml(r.prompt || '')}</div>
        </div>
        <div class="review-card-body">
          <div class="review-answer-row">
            <span class="review-ans-label">${isMulti ? escapeHtml(r.playerName) + "'s Answer:" : 'Your Choice:'}</span>
            <span class="review-ans-val ${r.correct ? 'ans-correct-val' : 'ans-wrong-val'}">${escapeHtml(r.chosenDisplay || r.chosen || '')}</span>
          </div>
          ${!r.correct ? `
            <div class="review-answer-row">
              <span class="review-ans-label">Correct:</span>
              <span class="review-ans-val ans-correct-val">${escapeHtml(r.correctDisplay || r.correctAnswer || '')}</span>
            </div>
          ` : ''}
          <div class="review-verse-row">
            <span class="review-verse-label">Scripture Reference:</span>
            <div class="review-verse-list">${versesFormatted}</div>
          </div>
          ${r.explanation ? `<div class="review-explanation">${escapeHtml(r.explanation)}</div>` : ''}
        </div>
      `;
      summaryListEl.appendChild(div);
    });
  }

  // Share results button
  const btnShareSummary = document.getElementById('btn-share-summary');
  if (btnShareSummary) {
    btnShareSummary.onclick = () => {
      const isMultiMatch = (state.mode === 'challenge' || state.mode === 'remote-challenge');
      const p1 = (state.players && state.players[0]) || { name: 'Player 1', score: 0 };
      const p2 = (state.players && state.players[1]) || { name: 'Player 2', score: 0 };
      const shareTitle = isMultiMatch ? `Who-Bible Match: ${p1.name} (${p1.score}pts) vs ${p2.name} (${p2.score}pts)` : 'Who-Bible Trivia Results';
      const shareText = isMultiMatch
        ? `⚔️ Who-Bible Match: ${p1.name} (${p1.score}pts) vs ${p2.name} (${p2.score}pts)! Think you can top our biblical knowledge? Play now at ${window.location.origin}`
        : `🏆 Who-Bible Score: I achieved ${accuracy}% accuracy with ${state.score} points! Test your Scripture knowledge at ${window.location.origin}`;
      
      openModernShareModal({ title: shareTitle, text: shareText, url: window.location.origin });
    };
  }

  modalEl.style.display = 'flex';
}

function hideSummaryModal(){
  if(modalEl) modalEl.style.display = 'none';
  syncModalScrollLock();
}

// Players modal

function initModalPillToggles() {
  const groups = ['challenge-qcount-pills', 'challenge-diff-pills', 'challenge-timer-pills'];
  groups.forEach(id => {
    const group = document.getElementById(id);
    if (!group) return;
    // Remove old listeners by cloning
    const newGroup = group.cloneNode(true);
    group.parentNode.replaceChild(newGroup, group);

    newGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.modal-pill');
      if (!btn) return;
      newGroup.querySelectorAll('.modal-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function showPlayersModal(){
  initModalPillToggles();

  // Restore saved challenge settings if available
  const savedSettings = JSON.parse(localStorage.getItem('who-bible-challenge-settings') || '{}');
  if (savedSettings.numQuestions) {
    const qBtn = document.querySelector(`#challenge-qcount-pills .modal-pill[data-value="${savedSettings.numQuestions}"]`);
    if (qBtn) {
      document.querySelectorAll('#challenge-qcount-pills .modal-pill').forEach(b => b.classList.remove('active'));
      qBtn.classList.add('active');
    }
  }
  if (savedSettings.difficulty) {
    const dBtn = document.querySelector(`#challenge-diff-pills .modal-pill[data-value="${savedSettings.difficulty}"]`);
    if (dBtn) {
      document.querySelectorAll('#challenge-diff-pills .modal-pill').forEach(b => b.classList.remove('active'));
      dBtn.classList.add('active');
    }
  }
  if (savedSettings.timeLimit !== undefined) {
    const tBtn = document.querySelector(`#challenge-timer-pills .modal-pill[data-value="${savedSettings.timeLimit}"]`);
    if (tBtn) {
      document.querySelectorAll('#challenge-timer-pills .modal-pill').forEach(b => b.classList.remove('active'));
      tBtn.classList.add('active');
    }
  }

  const savedP1 = localStorage.getItem('who-bible-p1-name') || '';
  const savedP2 = localStorage.getItem('who-bible-p2-name') || '';
  if (p1NameInput) p1NameInput.value = savedP1 || 'Player 1';
  if (p2NameInput) p2NameInput.value = savedP2 || 'Player 2';
  if (playersModal) playersModal.style.display = 'flex';
  setTimeout(() => { if (p1NameInput) p1NameInput.select(); }, 60);
}

function hidePlayersModal(){
  playersModal.style.display = 'none';
}

// =========================
// Toasts
// =========================
function showToast({ title, msg, type='info', timeout=3000 }){
  if(!toastContainer) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div>
      <div class="title">${title||''}</div>
      <div class="msg">${msg||''}</div>
    </div>
    <div class="close" aria-label="Close">✕</div>
  `;
  const closer = el.querySelector('.close');
  closer.addEventListener('click',()=>{ el.remove(); });
  // Append without affecting layout (container is fixed and centered)
  toastContainer.appendChild(el);
  if(timeout>0){ setTimeout(()=>{ el.remove(); }, timeout); }
}

function scheduleTimeWarnings(){
  if(state.mode!=='timed') return;
  // Lightweight warnings when passing thresholds
  const warnAt = new Set([30, 10, 5]);
  const check = ()=>{
    const t = state.timerSecondsRemaining;
    if(warnAt.has(t)){
      showToast({ title: getText('timeWarning'), msg: getText('timeWarningMsg', { time: t }), type: t<=5?'error':'warn', timeout: 1200 });
      warnAt.delete(t);
    }
    if(state.timerId) requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

// =========================
// Feedback System
// =========================
function initFeedback() {
  console.log('[Feedback] Initializing feedback system...');
  const modal = document.getElementById('feedback-modal');
  const btnClose = document.getElementById('btn-feedback-close');
  const btnCancel = document.getElementById('btn-feedback-cancel');
  const btnSubmit = document.getElementById('btn-feedback-submit');
  const ratingBtns = document.querySelectorAll('.rating-btn');
  
  console.log('[Feedback] Elements found:', {
    modal: !!modal,
    btnClose: !!btnClose,
    btnCancel: !!btnCancel,
    btnSubmit: !!btnSubmit,
    ratingBtns: ratingBtns.length
  });
  
  if (!modal) {
    console.error('[Feedback] Modal not found! Cannot initialize feedback system.');
    return;
  }

  let selectedRating = 0;
  let scrollPosition = 0; // Store scroll position

  // Open Modal
  const openFeedback = () => {
    console.log('[Feedback] Opening feedback modal...');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Reset form
    selectedRating = 0;
    ratingBtns.forEach(b => b.classList.remove('selected'));
    const msgEl = document.getElementById('feedback-message');
    if (msgEl) msgEl.value = '';
    const expEl = document.getElementById('feedback-experience');
    if (expEl) expEl.value = '';
    
    // Reset new selects
    const selects = ['rating-solo', 'rating-timed', 'rating-challenge', 'rating-study', 'rating-accuracy', 'rating-scenarios', 'rating-online', 'rating-classroom'];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.selectedIndex = 0;
    });
  };

  // Attach to button if it exists now
  const btnOpen = document.getElementById('btn-feedback');
  console.log('[Feedback] Button element found:', btnOpen);
  
  if(btnOpen && !btnOpen._feedbackInitialized) {
    btnOpen.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFeedback();
    });
    btnOpen._feedbackInitialized = true;
  }

  // Close Modal
  const close = () => {
    modal.classList.remove('show');
    syncModalScrollLock();
  };
  if(btnClose) btnClose.addEventListener('click', close);
  if(btnCancel) btnCancel.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Rating Selection
  ratingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating, 10);
      ratingBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Submit
  if(btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      const message = document.getElementById('feedback-message')?.value.trim() || '';
      const experience = document.getElementById('feedback-experience')?.value.trim() || '';
      
      const ratingSolo = document.getElementById('rating-solo')?.value;
      const ratingTimed = document.getElementById('rating-timed')?.value;
      const ratingChallenge = document.getElementById('rating-challenge')?.value;
      const ratingStudy = document.getElementById('rating-study')?.value;
      const ratingAccuracy = document.getElementById('rating-accuracy')?.value;
      const ratingScenarios = document.getElementById('rating-scenarios')?.value;
      const ratingOnline = document.getElementById('rating-online')?.value;
      const ratingClassroom = document.getElementById('rating-classroom')?.value;

      if (!message && !experience && selectedRating === 0 && !ratingSolo && !ratingTimed && !ratingChallenge && !ratingStudy && !ratingAccuracy && !ratingScenarios && !ratingOnline && !ratingClassroom) {
        showToast({ title: getText('feedback'), msg: getText('feedbackPrompt'), type: 'warn' });
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = getText('sendingFeedback') || 'Submitting...';

      const feedbackData = {
        rating: selectedRating,
        experience: experience || null,
        ratingSolo: ratingSolo || null,
        ratingTimed: ratingTimed || null,
        ratingChallenge: ratingChallenge || null,
        ratingStudy: ratingStudy || null,
        ratingAccuracy: ratingAccuracy || null,
        ratingScenarios: ratingScenarios || null,
        ratingOnline: ratingOnline || null,
        ratingClassroom: ratingClassroom || null,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      try {
        if (typeof database !== 'undefined' && database) {
          await database.ref('feedback').push(feedbackData);
          showToast({ title: getText('thankYou'), msg: getText('feedbackReceived'), type: 'success' });
          localStorage.setItem('who-bible-feedback-prompted', 'true');
        } else if (typeof firebase !== 'undefined' && firebase.database) {
          await firebase.database().ref('feedback').push(feedbackData);
          showToast({ title: getText('thankYou'), msg: getText('feedbackReceived'), type: 'success' });
          localStorage.setItem('who-bible-feedback-prompted', 'true');
        } else {
          // Fallback to localStorage
          const savedFeedback = JSON.parse(localStorage.getItem('who-bible-feedback') || '[]');
          savedFeedback.push(feedbackData);
          localStorage.setItem('who-bible-feedback', JSON.stringify(savedFeedback));
          showToast({ title: getText('thankYou') || 'Thank You!', msg: getText('feedbackReceived') || 'Your feedback has been saved.', type: 'success' });
        }
        close();
      } catch (error) {
        console.error('Feedback error:', error);
        showToast({ title: getText('feedbackError'), msg: getText('feedbackErrorMsg'), type: 'error' });
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = getText('sendFeedback') || 'Send Feedback';
      }
    });
  }
  
  // Always expose open function, even if button wasn't found initially
  window.openFeedbackModal = openFeedback;
  console.log('[Feedback] window.openFeedbackModal has been set');
}

// Expose displayPlayerInfo globally so translations.js can call it
window.displayPlayerInfo = displayPlayerInfo;

// Expose showPlayerChangeModal for guest prompts
window.showPlayerChangeModal = function() {
  if (btnChangePlayer) {
    btnChangePlayer.click();
  }
};

// =========================================
// Classroom / Kahoot Player Mode
// =========================================
let activeClassroomSession = null;

function withClassroomTimeout(promise, ms = 8000, msg = 'Connection timed out. Please check your internet connection.') {
  let tid;
  const timeout = new Promise((_, reject) => {
    tid = setTimeout(() => reject(new Error(msg)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(tid));
}

function cleanupClassroomPlayerMode(notifyLeave = false) {
  if (!activeClassroomSession) return;
  const session = activeClassroomSession;
  activeClassroomSession = null;

  if (session.timerInterval) {
    clearInterval(session.timerInterval);
    session.timerInterval = null;
  }

  if (session.roomRef) {
    try {
      session.roomRef.off('value', session.onRoomValue);
    } catch (_) {
      try { session.roomRef.off(); } catch (__) {}
    }
    if (notifyLeave && session.status === 'lobby' && session.playerId) {
      session.roomRef.child(`players/${session.playerId}`).remove().catch(() => {});
    }
  }
}

function computeClassroomStanding(playersMap, playerId) {
  const entries = Object.entries(playersMap || {}).map(([id, p]) => ({
    id,
    score: Number(p?.score) || 0,
    correct: Number(p?.correct) || 0
  }));
  entries.sort((a, b) => (b.score - a.score) || (b.correct - a.correct));
  const idx = entries.findIndex(e => e.id === playerId);
  return {
    rank: idx >= 0 ? idx + 1 : entries.length || 1,
    total: entries.length || 1
  };
}

function promptClassroomJoin(initialPin = '') {
  if (window.RateLimiter && !window.RateLimiter.check('joinClassroom', 10)) {
    showToast({ title: 'Slow Down', msg: 'Too many join attempts. Please wait a moment.', type: 'error' });
    return;
  }

  const modal = document.getElementById('classroom-join-modal');
  const pinInput = document.getElementById('classroom-pin-input');
  const nameInput = document.getElementById('classroom-player-name');
  const btnSave = document.getElementById('btn-classroom-join-save');
  const btnCancel = document.getElementById('btn-classroom-join-cancel');
  const btnClose = document.getElementById('btn-classroom-join-close');

  if (!modal || !pinInput || !nameInput || !btnSave) {
    showToast({ title: 'Unavailable', msg: 'Classroom join dialog could not be opened.', type: 'error' });
    return;
  }

  const currentName = (state.currentPlayer && state.currentPlayer.name && !state.currentPlayer.name.startsWith('Guest'))
    ? state.currentPlayer.name
    : (state.currentPlayer?.name || '');
  nameInput.value = currentName === 'Guest' ? '' : currentName;
  pinInput.value = initialPin ? String(initialPin).trim().toUpperCase() : '';

  const defaultBtnHtml = '<span>Join Game</span>';
  btnSave.disabled = false;
  btnSave.innerHTML = defaultBtnHtml;

  modal.style.display = 'flex';
  syncModalScrollLock();

  setTimeout(() => {
    if (initialPin) {
      nameInput.focus();
    } else {
      pinInput.focus();
    }
  }, 80);

  let isSubmitting = false;

  const closeModal = () => {
    modal.style.display = 'none';
    syncModalScrollLock();
    cleanupListeners();
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const rawCode = pinInput.value.trim().toUpperCase();
    const rawName = nameInput.value.trim() || (state.currentPlayer?.name || 'Player');

    if (!rawCode) {
      showToast({ title: 'PIN Required', msg: 'Enter the Game PIN shown on the host screen.', type: 'error' });
      pinInput.focus();
      return;
    }

    if (window.SecurityModule) {
      const codeCheck = window.SecurityModule.validateRoomCode(rawCode);
      if (!codeCheck.valid) {
        showToast({ title: 'Invalid PIN', msg: codeCheck.error || 'Please check the Game PIN.', type: 'error' });
        pinInput.focus();
        return;
      }
      const nameCheck = window.SecurityModule.validatePlayerName(rawName);
      if (!nameCheck.valid) {
        showToast({ title: 'Invalid Name', msg: nameCheck.error || 'Please enter a valid nickname.', type: 'error' });
        nameInput.focus();
        return;
      }
    }

    if (!window.FirebaseConfig || !window.FirebaseConfig.isAvailable()) {
      showToast({ title: 'Connection Ready Check', msg: 'Live multiplayer service is still connecting. Try again in a moment.', type: 'error' });
      return;
    }

    isSubmitting = true;
    btnSave.disabled = true;
    btnSave.textContent = 'Joining…';

    try {
      const database = window.FirebaseConfig.getDatabase();
      const sanitizedCode = rawCode.replace(/[^A-Z0-9-]/g, '');
      const sanitizedName = window.SecurityModule ? window.SecurityModule.sanitizeHTML(rawName).slice(0, 22) : rawName.slice(0, 22);
      const roomRef = database.ref('classrooms/' + sanitizedCode);

      const snapshot = await withClassroomTimeout(roomRef.once('value'), 8000);
      if (!snapshot.exists()) {
        showToast({ title: 'Room Not Found', msg: `No active classroom found for PIN "${sanitizedCode}".`, type: 'error' });
        isSubmitting = false;
        btnSave.disabled = false;
        btnSave.innerHTML = defaultBtnHtml;
        pinInput.focus();
        return;
      }

      const room = snapshot.val() || {};
      if (room.status === 'finished' || room.status === 'cancelled') {
        showToast({ title: 'Session Ended', msg: 'This classroom game has already finished.', type: 'error' });
        isSubmitting = false;
        btnSave.disabled = false;
        btnSave.innerHTML = defaultBtnHtml;
        return;
      }

      const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const playerPayload = {
        name: sanitizedName,
        score: 0,
        correct: 0,
        streak: 0,
        joinedAt: Date.now()
      };

      await withClassroomTimeout(roomRef.child('players/' + playerId).set(playerPayload), 8000);
      roomRef.child('lastActivity').set(Date.now()).catch(() => {});

      closeModal();
      showToast({
        title: '🎉 You\'re In!',
        msg: `Joined ${sanitizedCode} as ${sanitizedName}.`,
        type: 'success',
        timeout: 3200
      });

      const hydratedRoom = {
        ...room,
        players: { ...(room.players || {}), [playerId]: playerPayload }
      };
      startClassroomPlayerMode(sanitizedCode, playerId, roomRef, sanitizedName, hydratedRoom);
    } catch (error) {
      isSubmitting = false;
      btnSave.disabled = false;
      btnSave.innerHTML = defaultBtnHtml;
      showToast({ title: 'Could Not Join', msg: error.message || 'Check your connection and try again.', type: 'error' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target === pinInput && pinInput.value.trim() && !nameInput.value.trim()) {
        nameInput.focus();
      } else {
        handleSave();
      }
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === modal) closeModal();
  };

  btnSave.addEventListener('click', handleSave);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);
  modal.addEventListener('click', handleBackdrop);
  pinInput.addEventListener('keydown', handleKeyDown);
  nameInput.addEventListener('keydown', handleKeyDown);

  function cleanupListeners() {
    btnSave.removeEventListener('click', handleSave);
    if (btnCancel) btnCancel.removeEventListener('click', closeModal);
    if (btnClose) btnClose.removeEventListener('click', closeModal);
    modal.removeEventListener('click', handleBackdrop);
    pinInput.removeEventListener('keydown', handleKeyDown);
    nameInput.removeEventListener('keydown', handleKeyDown);
  }
}

function startClassroomPlayerMode(roomCode, playerId, roomRef, playerName, initialRoom = null) {
  cleanupClassroomPlayerMode(false);

  state.mode = 'classroom';
  state.score = 0;
  state.streak = 0;
  state.current = null;
  state.questions = [];

  showGame();

  if (gameTitle) gameTitle.textContent = `🏫 Classroom: ${roomCode}`;
  if (quizEl) quizEl.style.display = 'block';
  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) welcomeMsg.style.display = 'none';

  if (timerEl) timerEl.style.display = 'none';
  if (btnPause) btnPause.style.display = 'none';
  if (challengeStatusEl) challengeStatusEl.style.display = 'none';
  if (versusTurnBanner) versusTurnBanner.style.display = 'none';
  if (btnNext) btnNext.style.display = 'none';
  if (btnQuit) btnQuit.textContent = 'Leave Room';
  if (afterRef) afterRef.innerHTML = '';

  const soloScoreChip = document.querySelector('.chip-score');
  const soloStreakChip = document.querySelector('#streak-chip');
  const progressChip = document.querySelector('.chip-progress');
  const progressTrack = document.querySelector('.progress-container-modern');
  if (soloScoreChip) soloScoreChip.style.display = 'flex';
  if (soloStreakChip) soloStreakChip.style.display = 'flex';
  if (progressChip) progressChip.style.display = 'flex';
  if (progressTrack) progressTrack.style.display = 'none';

  const totalPlanned = (initialRoom?.questions?.length) || (initialRoom?.settings?.questionCount) || 10;
  if (scoreEl) scoreEl.innerText = '0';
  if (streakEl) streakEl.innerText = '0';
  if (qnumEl) qnumEl.innerText = '0';
  if (qtotalEl) qtotalEl.innerText = String(totalPlanned);

  const session = {
    roomCode,
    playerId,
    playerName,
    roomRef,
    timerInterval: null,
    status: initialRoom?.status || 'lobby',
    renderedStatus: null,
    renderedQuestionIdx: -1,
    hasAnsweredRound: -1,
    selectedChoiceMeta: null,
    hasSeenSelf: true,
    onRoomValue: null
  };
  activeClassroomSession = session;

  const stopLocalRoundTimer = () => {
    if (session.timerInterval) {
      clearInterval(session.timerInterval);
      session.timerInterval = null;
    }
  };

  // Render initial lobby view immediately for zero-latency feedback
  renderClassroomLobbyCard(roomCode, playerName, Object.keys(initialRoom?.players || {}).length || 1);
  session.renderedStatus = 'lobby';

  session.onRoomValue = (snapshot) => {
    if (activeClassroomSession !== session) return;

    if (!snapshot.exists()) {
      showToast({ title: 'Session Ended', msg: 'The host closed this classroom room.', type: 'info', timeout: 4000 });
      showSetup();
      return;
    }

    const room = snapshot.val() || {};
    const status = room.status || 'lobby';
    session.status = status;

    if (status === 'cancelled') {
      showToast({ title: 'Session Ended', msg: 'The host ended this classroom session.', type: 'info', timeout: 4000 });
      showSetup();
      return;
    }

    const playersMap = room.players || {};
    const me = playersMap[playerId];

    // Detect if host removed player from waiting lobby
    if (status === 'lobby' && session.hasSeenSelf && !me) {
      showToast({ title: 'Removed from Lobby', msg: 'You were removed from the classroom lobby by the host.', type: 'warn', timeout: 4000 });
      showSetup();
      return;
    }

    if (me) {
      session.hasSeenSelf = true;
      state.score = Number(me.score) || 0;
      state.streak = Number(me.streak) || 0;
      if (scoreEl) scoreEl.innerText = String(state.score);
      if (streakEl) streakEl.innerText = String(state.streak);
    }

    const questions = Array.isArray(room.questions) ? room.questions : [];
    const totalQ = questions.length || Number(room.settings?.questionCount) || 10;
    const qIdx = typeof room.currentQuestion === 'number' ? room.currentQuestion : -1;
    if (qtotalEl) qtotalEl.innerText = String(totalQ);
    if (qnumEl) qnumEl.innerText = String(qIdx >= 0 ? qIdx + 1 : 0);

    if (status === 'lobby') {
      stopLocalRoundTimer();
      session.renderedQuestionIdx = -1;
      session.hasAnsweredRound = -1;
      session.selectedChoiceMeta = null;
      const pCount = Object.keys(playersMap).length || 1;
      if (session.renderedStatus !== 'lobby') {
        renderClassroomLobbyCard(roomCode, playerName, pCount);
        session.renderedStatus = 'lobby';
      } else {
        const countEl = document.getElementById('classroom-lobby-count');
        if (countEl) countEl.textContent = `${pCount} player${pCount === 1 ? '' : 's'} connected`;
      }
      return;
    }

    if (status === 'starting') {
      stopLocalRoundTimer();
      session.renderedQuestionIdx = -1;
      session.hasAnsweredRound = -1;
      session.selectedChoiceMeta = null;
      if (session.renderedStatus !== 'starting') {
        session.renderedStatus = 'starting';
        renderClassroomGetReadyCard(roomCode);
      }
      return;
    }

    if (status === 'question') {
      const question = (qIdx >= 0 && questions[qIdx]) ? questions[qIdx] : null;
      if (!question) return;

      const existingResp = room.responses && room.responses[playerId];
      const alreadyAnswered = (session.hasAnsweredRound === qIdx) || !!(existingResp && existingResp.answer !== undefined);

      // Update mid-round Scripture Clue dynamically if revealed by host
      if (room.clueRevealed && Array.isArray(question.verses) && question.verses.length > 0) {
        const clueSlot = document.getElementById('classroom-clue-slot');
        if (clueSlot && !clueSlot.hasChildNodes()) {
          clueSlot.innerHTML = `<div class="classroom-clue-chip">📜 Scripture Clue: <strong>${escapeHtml(question.verses[0])}</strong></div>`;
        }
      }

      if (alreadyAnswered) {
        if (session.renderedStatus !== `locked_${qIdx}`) {
          stopLocalRoundTimer();
          session.renderedStatus = `locked_${qIdx}`;
          const meta = session.selectedChoiceMeta || {};
          renderClassroomLockedInCard(question, meta.option, meta.icon, meta.color, room.clueRevealed);
        }
        return;
      }

      if (session.renderedStatus !== `question_${qIdx}` || session.renderedQuestionIdx !== qIdx) {
        session.renderedStatus = `question_${qIdx}`;
        session.renderedQuestionIdx = qIdx;
        session.selectedChoiceMeta = null;
        renderClassroomLiveQuestion(session, room, question, qIdx, stopLocalRoundTimer);
      }
      return;
    }

    if (status === 'results') {
      stopLocalRoundTimer();
      const roundKey = `results_${qIdx}`;
      if (session.renderedStatus !== roundKey) {
        session.renderedStatus = roundKey;
        const question = (qIdx >= 0 && questions[qIdx]) ? questions[qIdx] : null;
        const rankInfo = computeClassroomStanding(playersMap, playerId);
        renderClassroomRoundResultsCard(me, question, rankInfo);
      }
      return;
    }

    if (status === 'leaderboard') {
      stopLocalRoundTimer();
      const lbKey = `leaderboard_${qIdx}`;
      if (session.renderedStatus !== lbKey) {
        session.renderedStatus = lbKey;
        const rankInfo = computeClassroomStanding(playersMap, playerId);
        renderClassroomLeaderboardCard(me, rankInfo, qIdx + 1, totalQ);
      }
      return;
    }

    if (status === 'finished') {
      stopLocalRoundTimer();
      if (session.renderedStatus !== 'finished') {
        session.renderedStatus = 'finished';
        const rankInfo = computeClassroomStanding(playersMap, playerId);
        SoundFX.playFanfare();
        renderClassroomFinalCard(me, rankInfo, totalQ);
      }
    }
  };

  roomRef.on('value', session.onRoomValue);
}

function renderClassroomLobbyCard(roomCode, playerName, playerCount) {
  if (qText) qText.textContent = 'Waiting for the Host to start the game…';
  if (!answersEl) return;
  answersEl.innerHTML = `
    <div class="classroom-player-card">
      <span class="classroom-status-emoji">🙌</span>
      <h3>You're in, ${escapeHtml(playerName)}!</h3>
      <p>See your nickname on the projector or host screen.</p>
      <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:16px;">
        <span class="verse-badge" style="font-size:14px; padding:6px 14px;">PIN: <strong>${escapeHtml(roomCode)}</strong></span>
        <span id="classroom-lobby-count" class="verse-badge" style="font-size:14px; padding:6px 14px;">${playerCount} player${playerCount === 1 ? '' : 's'} connected</span>
      </div>
    </div>
  `;
}

function renderClassroomGetReadyCard(roomCode) {
  if (qText) qText.textContent = 'Eyes up! The quiz is starting…';
  if (!answersEl) return;
  answersEl.innerHTML = `
    <div class="classroom-player-card">
      <span class="classroom-status-emoji">⚡</span>
      <h3>Get Ready!</h3>
      <p>Question 1 is about to appear — faster answers earn higher points & Faith Streaks!</p>
      <div style="margin-top:14px;">
        <span class="verse-badge">Room ${escapeHtml(roomCode)}</span>
      </div>
    </div>
  `;
}

function renderClassroomLiveQuestion(session, room, question, qIdx, stopLocalRoundTimer) {
  stopLocalRoundTimer();
  state.current = question;
  state.qnum = qIdx + 1;

  if (qText) qText.textContent = question.prompt || 'Select the correct answer:';
  if (!answersEl) return;
  answersEl.innerHTML = '';

  const timePerQ = Math.max(5, Number(room.settings?.timePerQuestion) || 20);
  const startStamp = Number(room.questionStartTime) || Date.now();

  // Synced progress timer bar + clue slot
  const topWrap = document.createElement('div');
  topWrap.style.width = '100%';
  const timerStrip = document.createElement('div');
  timerStrip.className = 'classroom-timer-strip';
  const timerFill = document.createElement('div');
  timerFill.className = 'classroom-timer-strip-fill';
  timerStrip.appendChild(timerFill);
  topWrap.appendChild(timerStrip);

  const clueSlot = document.createElement('div');
  clueSlot.id = 'classroom-clue-slot';
  if (room.clueRevealed && Array.isArray(question.verses) && question.verses.length > 0) {
    clueSlot.innerHTML = `<div class="classroom-clue-chip">📜 Scripture Clue: <strong>${escapeHtml(question.verses[0])}</strong></div>`;
  }
  topWrap.appendChild(clueSlot);
  answersEl.appendChild(topWrap);

  const icons = ['▲', '◆', '●', '■'];
  const colors = ['#e21b3c', '#1368ce', '#d97706', '#15803d'];

  const gridContainer = document.createElement('div');
  gridContainer.className = 'classroom-options-grid';

  (question.options || []).forEach((option, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `choice-${i + 1}`;
    btn.className = 'classroom-answer-btn';
    btn.style.background = colors[i % colors.length];
    btn.innerHTML = `
      <span class="classroom-shape">${icons[i % icons.length]}</span>
      <span class="classroom-opt-label">${escapeHtml(option)}</span>
    `;

    btn.addEventListener('click', () => {
      if (session.hasAnsweredRound === qIdx) return;
      session.hasAnsweredRound = qIdx;
      stopLocalRoundTimer();

      if (navigator.vibrate) navigator.vibrate(40);
      SoundFX.playClick();

      const now = Date.now();
      const elapsed = Math.max(0, Math.min(timePerQ, (now - startStamp) / 1000));
      session.selectedChoiceMeta = {
        option,
        icon: icons[i % icons.length],
        color: colors[i % colors.length]
      };
      session.renderedStatus = `locked_${qIdx}`;

      session.roomRef.child(`responses/${session.playerId}`).set({
        answer: i,
        timeTaken: Number(elapsed.toFixed(2)),
        timestamp: now
      }).catch((err) => {
        showToast({ title: 'Sync Warning', msg: 'Could not submit response: ' + err.message, type: 'error' });
      });

      const clueNow = Boolean(document.querySelector('#classroom-clue-slot .classroom-clue-chip'));
      renderClassroomLockedInCard(question, option, icons[i % icons.length], colors[i % colors.length], clueNow);
    });

    gridContainer.appendChild(btn);
  });

  answersEl.appendChild(gridContainer);

  // Synced countdown bar with local fallback lock when time expires
  const updateBar = () => {
    const elapsed = Math.max(0, (Date.now() - startStamp) / 1000);
    const remaining = Math.max(0, timePerQ - elapsed);
    const pct = Math.max(0, Math.min(100, (remaining / timePerQ) * 100));
    timerFill.style.width = `${pct}%`;
    if (remaining <= 5) {
      timerFill.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
    }
    if (remaining <= 0 && session.hasAnsweredRound !== qIdx) {
      stopLocalRoundTimer();
      // Disable tiles locally if timer expired while waiting for host reveal
      gridContainer.querySelectorAll('.classroom-answer-btn').forEach(b => {
        b.disabled = true;
      });
      if (qText) qText.textContent = '⏱️ Time\'s up! Waiting for host to reveal the answer…';
    }
  };
  updateBar();
  session.timerInterval = setInterval(updateBar, 200);
}

function renderClassroomLockedInCard(question, selectedOption, icon, color, clueShown) {
  if (qText && question?.prompt) qText.textContent = question.prompt;
  if (!answersEl) return;
  const clueHtml = (clueShown && Array.isArray(question?.verses) && question.verses.length > 0)
    ? `<div id="classroom-clue-slot"><div class="classroom-clue-chip">📜 Scripture Clue: <strong>${escapeHtml(question.verses[0])}</strong></div></div>`
    : `<div id="classroom-clue-slot"></div>`;

  answersEl.innerHTML = `
    ${clueHtml}
    <div class="classroom-player-card" style="border-color: ${color || 'var(--accent)'};">
      <span class="classroom-status-emoji">${icon || '✓'}</span>
      <h3>Answer Locked In!</h3>
      ${selectedOption ? `<p style="color: var(--text); font-size: 17px; margin-bottom: 8px;">Your pick: <strong>${escapeHtml(selectedOption)}</strong></p>` : ''}
      <p>Hang tight while everyone finishes answering…</p>
    </div>
  `;
}

function renderClassroomRoundResultsCard(me, question, rankInfo) {
  const isCorrect = Boolean(me?.lastRoundCorrect);
  const roundPts = Number(me?.lastRoundPoints) || 0;
  const totalPts = Number(me?.score) || 0;
  const streak = Number(me?.streak) || 0;
  const correctAns = me?.lastCorrectAnswer || question?.correctAnswer || '';
  const verses = Array.isArray(question?.verses) && question.verses.length ? question.verses.join(', ') : '';

  if (isCorrect) {
    if (streak >= 3) SoundFX.playStreak();
    else SoundFX.playCorrect();
  } else {
    SoundFX.playWrong();
  }

  if (qText) {
    qText.textContent = isCorrect ? '🎯 Correct Answer!' : '📖 Keep Going!';
  }
  if (!answersEl) return;

  answersEl.innerHTML = `
    <div class="classroom-player-card ${isCorrect ? 'is-correct' : 'is-wrong'}">
      <span class="classroom-status-emoji">${isCorrect ? '🌟' : '💡'}</span>
      <h3>${isCorrect ? `+${roundPts} Points!` : 'No Points This Round'}</h3>
      ${correctAns ? `<p style="color: var(--text); font-size: 16px; margin-bottom: 6px;">Correct Answer: <strong>${escapeHtml(correctAns)}</strong></p>` : ''}
      ${verses ? `<p style="font-size: 13px; margin-bottom: 12px;">📜 Reference: <strong>${escapeHtml(verses)}</strong></p>` : ''}
      <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:12px;">
        <span class="verse-badge" style="font-size:14px; padding:6px 14px;">Total: <strong>${totalPts} pts</strong></span>
        <span class="verse-badge" style="font-size:14px; padding:6px 14px;">Rank: <strong>#${rankInfo.rank} of ${rankInfo.total}</strong></span>
        ${streak >= 2 ? `<span class="verse-badge" style="font-size:14px; padding:6px 14px;">🔥 ${streak} Faith Streak</span>` : ''}
      </div>
    </div>
  `;
}

function renderClassroomLeaderboardCard(me, rankInfo, completedQ, totalQ) {
  if (qText) qText.textContent = `Standings after Question ${completedQ} of ${totalQ}`;
  if (!answersEl) return;
  const totalPts = Number(me?.score) || 0;
  const streak = Number(me?.streak) || 0;
  answersEl.innerHTML = `
    <div class="classroom-player-card">
      <span class="classroom-status-emoji">🏆</span>
      <h3>You're in #${rankInfo.rank} Place!</h3>
      <div class="classroom-points-pill">${totalPts} pts</div>
      <p>${streak >= 2 ? `🔥 ${streak}-answer Faith Streak active! ` : ''}Get ready for the next question from the host…</p>
    </div>
  `;
}

function renderClassroomFinalCard(me, rankInfo, totalQ) {
  if (qText) qText.textContent = '🏁 Classroom Quiz Complete!';
  if (!answersEl) return;
  const totalPts = Number(me?.score) || 0;
  const correctCount = Number(me?.correct) || 0;
  const medal = rankInfo.rank === 1 ? '🥇' : rankInfo.rank === 2 ? '🥈' : rankInfo.rank === 3 ? '🥉' : '🎉';

  answersEl.innerHTML = `
    <div class="classroom-player-card is-correct">
      <span class="classroom-status-emoji">${medal}</span>
      <h3>Finished #${rankInfo.rank} of ${rankInfo.total}!</h3>
      <div class="classroom-points-pill">${totalPts} pts</div>
      <p style="color: var(--text); font-size: 16px; margin-bottom: 18px;">You answered <strong>${correctCount} of ${totalQ}</strong> correctly.</p>
      <button type="button" id="btn-classroom-finish-home" class="primary" style="padding: 12px 26px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer;">
        Back to Game Modes
      </button>
    </div>
  `;

  const doneBtn = document.getElementById('btn-classroom-finish-home');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => showSetup());
  }
}

// Re-localize dynamic pieces when language changes
window.onWhoBibleLanguageChange = function(lang){
  try{
    displayPlayerInfo();
    if(document.getElementById('study-panel') && state.people.length>0){
      renderPeopleList(searchPerson ? searchPerson.value : '');
    }
    if(state.current && state.mode === 'scenarios' && btnNext && btnNext.disabled){
      renderScenarioQuestion(state.current);
    } else if(state.current && state.mode !== 'classroom' && state.mode !== 'scenarios'){
      renderQuestion(state.current);
      const nodes = Array.from(document.querySelectorAll('#answers .ans'));
      nodes.forEach(node=>{
        const orig = node.dataset.value;
        const q = state.current;
        const txtSpan = node.querySelector('.choice-text') || node;
        txtSpan.innerText = (typeof translateAnswerForQuestionType==='function') ? translateAnswerForQuestionType(q.type, orig) : orig;
      });
    }
  }catch(_){ /* non-fatal */ }
};

// Initialize authentication if available
if (typeof window !== 'undefined') {
  document.addEventListener('auth:login', (e) => {
    console.log('User logged in:', e.detail);
    if (state.currentPlayer && state.currentPlayer.isGuest) {
      console.log('Migrating guest stats to authenticated account');
    }
  });
  
  document.addEventListener('auth:logout', () => {
    console.log('User logged out, reverting to guest');
    state.currentPlayer = createGuestPlayer();
    savePlayer(state.currentPlayer);
    displayPlayerInfo();
  });
}

// Expose clean app interface for Remote Challenge & external modules
window.WB = {
  state,
  buildSharedQuestions: (count, diff) => pickQuestionSet(count, diff),
  startRemoteMatch: (questions, players, myIdx, settings = {}) => {
    if (window.RemoteChallengeUI && window.RemoteChallengeUI.hide) {
      window.RemoteChallengeUI.hide();
    }
    cleanupClassroomPlayerMode(false);
    showGame();
    if (gameTitle) gameTitle.textContent = '🌐 Remote Challenge';
    state.mode = 'remote-challenge';
    state.players = (players && players.length >= 2) ? players.map(p => ({ ...p })) : [
      { name: 'Host', score: 0 },
      { name: 'Guest', score: 0 }
    ];
    state.currentPlayerIndex = myIdx || 0;
    state.questions = (questions || []).slice();
    state.qtotal = state.questions.length;
    state.qnum = 0;
    state.score = 0;
    state.streak = 0;
    state.results = [];

    // Ensure quiz interface is visible and properly configured when coming from Setup
    if (quizEl) quizEl.style.display = 'block';
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) welcomeMsg.style.display = 'none';
    if (timerEl) timerEl.style.display = 'none';
    if (btnPause) btnPause.style.display = 'none';

    const soloScoreChip = document.querySelector('.chip-score');
    const soloStreakChip = document.querySelector('#streak-chip');
    const progressChip = document.querySelector('.chip-progress');
    const progressTrack = document.querySelector('.progress-container-modern');
    if (soloScoreChip) soloScoreChip.style.display = 'none';
    if (soloStreakChip) soloStreakChip.style.display = 'none';
    if (progressChip) progressChip.style.display = 'flex';
    if (progressTrack) progressTrack.style.display = 'block';

    if (challengeStatusEl) challengeStatusEl.style.display = 'flex';
    if (qnumEl) qnumEl.innerText = '0';
    if (qtotalEl) qtotalEl.innerText = String(state.qtotal);
    if (scoreEl) scoreEl.innerText = '0';
    if (streakEl) streakEl.innerText = '0';
    if (afterRef) afterRef.innerHTML = '';
    clearAutoAdvance();
    if (btnNext) {
      btnNext.style.display = 'none';
      btnNext.disabled = true;
    }

    updateVersusHUD();
    stopTimer();
    nextQuestion();
  },
  updateRemoteScores: (players) => {
    if (players && players.length >= 2 && state.players && state.players.length >= 2) {
      state.players[0].score = players[0].score || 0;
      state.players[1].score = players[1].score || 0;
      if (p1ScoreEl) p1ScoreEl.textContent = String(players[0].score || 0);
      if (p2ScoreEl) p2ScoreEl.textContent = String(players[1].score || 0);
      // Refresh summary modal live if local player finished first and is viewing summary
      if (modalEl && modalEl.style.display === 'flex' && state.mode === 'remote-challenge') {
        showSummaryModal();
      }
    }
  },
  onRemoteMatchComplete: () => {
    if (state.mode === 'remote-challenge') {
      if (state.qtotal > 0) {
        endQuiz();
      } else if (modalEl && modalEl.style.display === 'flex') {
        showSummaryModal();
      }
    }
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  init();
}


// =========================================
// Modern Share & Invite Dialog
// =========================================
function openModernShareModal(customData = null) {
  const sd = customData || buildShareData(state.score || null);
  const modal = document.getElementById('share-modal');
  if (!modal) {
    doShare(sd);
    return;
  }
  const quoteEl = document.getElementById('share-card-quote');
  const urlEl = document.getElementById('share-modal-url');
  if (quoteEl && sd.text) quoteEl.textContent = `"${sd.text}"`;
  if (urlEl) urlEl.textContent = sd.url || window.location.href;
  modal.style.display = 'flex';
  window._activeShareData = sd;
  syncModalScrollLock();
}

function closeModernShareModal() {
  const modal = document.getElementById('share-modal');
  if (modal) modal.style.display = 'none';
  syncModalScrollLock();
}

function setupModernShareEvents() {
  const modal = document.getElementById('share-modal');
  const closeBtn = document.getElementById('btn-share-modal-close');
  const nativeBtn = document.getElementById('btn-native-share-trigger');
  const copyBtn = document.getElementById('btn-copy-invite-link');
  const copyPill = document.getElementById('btn-copy-url-pill');

  if (closeBtn) closeBtn.addEventListener('click', closeModernShareModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModernShareModal();
    });
  }

  const handleCopy = async () => {
    const sd = window._activeShareData || buildShareData(state.score || null);
    const textToCopy = `${sd.text}\n\n👉 ${sd.url || window.location.href}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      const label = document.getElementById('copy-invite-label');
      const desc = document.getElementById('copy-invite-desc');
      if (label) label.textContent = '✓ Link Copied!';
      if (desc) desc.textContent = 'Ready to paste anywhere';
      showToast({ title: '🔗 Link Copied!', msg: 'Invite link copied to clipboard', type: 'success', timeout: 2400 });
      setTimeout(() => {
        if (label) label.textContent = 'Copy Invite Link';
        if (desc) desc.textContent = 'Instant link to clipboard';
      }, 3000);
    } catch (_) {
      showToast({ title: 'Copy Failed', msg: 'Please copy manually', type: 'error' });
    }
  };

  if (copyBtn) copyBtn.addEventListener('click', handleCopy);
  if (copyPill) copyPill.addEventListener('click', handleCopy);

  if (nativeBtn) {
    nativeBtn.addEventListener('click', async () => {
      const sd = window._activeShareData || buildShareData(state.score || null);
      if (navigator.share) {
        try {
          await navigator.share(sd);
          closeModernShareModal();
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      handleCopy();
    });
  }
}

// =========================================
// Simplified Study Mode Controls & Filters
// =========================================
function setupSimplifiedStudyControls() {
  if (document.body.dataset.studyControlsBound === '1') return;
  document.body.dataset.studyControlsBound = '1';

  const clearBtn = document.getElementById('btn-clear-study-search');
  if (clearBtn && searchPerson) {
    clearBtn.addEventListener('click', () => {
      searchPerson.value = '';
      clearBtn.style.display = 'none';
      renderPeopleList('');
      searchPerson.focus();
    });
  }

  const sortToggleBtn = document.getElementById('btn-sort-toggle');
  const sortToggleLabel = document.getElementById('sort-toggle-label');
  if (sortToggleBtn) {
    sortToggleBtn.addEventListener('click', () => {
      state.studySort = state.studySort === 'name-desc' ? 'name-asc' : 'name-desc';
      if (sortToggleLabel) {
        sortToggleLabel.textContent = state.studySort === 'name-desc' ? 'Z–A' : 'A–Z';
      }
      sortToggleBtn.classList.add('active');
      if (btnShuffleList) btnShuffleList.classList.remove('active');
      if (sortSelect) sortSelect.value = state.studySort;
      renderPeopleList(searchPerson ? searchPerson.value : '');
    });
  }

  // Segmented Testament Tabs (All / Old Testament / New Testament)
  const testamentGroup = document.getElementById('study-testament-tabs');
  if (testamentGroup) {
    testamentGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.study-seg-btn');
      if (!btn) return;
      testamentGroup.querySelectorAll('.study-seg-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      state.studyTestament = btn.dataset.testament || 'all';
      renderPeopleList(searchPerson ? searchPerson.value : '');
    });
  }

  // Difficulty Chips (All Levels / Easy / Medium / Hard)
  const diffGroup = document.getElementById('study-difficulty-tabs');
  if (diffGroup) {
    diffGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.study-lvl-chip');
      if (!btn) return;
      diffGroup.querySelectorAll('.study-lvl-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.studyDifficulty = btn.dataset.diff || 'all';
      renderPeopleList(searchPerson ? searchPerson.value : '');
    });
  }

  // Reset Filters Button
  const resetFiltersBtn = document.getElementById('btn-study-reset-filters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      state.studyTestament = 'all';
      state.studyDifficulty = 'all';
      state.studyCategory = 'all';
      state.studySort = 'name-asc';
      if (searchPerson) searchPerson.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      if (sortToggleLabel) sortToggleLabel.textContent = 'A–Z';
      if (sortToggleBtn) sortToggleBtn.classList.add('active');
      if (btnShuffleList) btnShuffleList.classList.remove('active');
      if (testamentGroup) {
        testamentGroup.querySelectorAll('.study-seg-btn').forEach(b => {
          const isAll = b.dataset.testament === 'all';
          b.classList.toggle('active', isAll);
          b.setAttribute('aria-selected', isAll ? 'true' : 'false');
        });
      }
      if (diffGroup) {
        diffGroup.querySelectorAll('.study-lvl-chip').forEach(b => {
          b.classList.toggle('active', b.dataset.diff === 'all');
        });
      }
      renderPeopleList('');
    });
  }

  // Setup modal pill toggles in 2-Player Pass & Play modal
  ['challenge-qcount-pills', 'challenge-diff-pills', 'challenge-timer-pills'].forEach(id => {
    const group = document.getElementById(id);
    if (!group) return;
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.modal-pill');
      if (!btn) return;
      group.querySelectorAll('.modal-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

