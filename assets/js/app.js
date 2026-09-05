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
      state.currentPlayer = JSON.parse(playerData);
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
  
  const stats = state.currentPlayer.stats;
  stats.gamesPlayed++;
  stats.totalScore += score;
  stats.highestScore = Math.max(stats.highestScore, score);
  stats.bestStreak = Math.max(stats.bestStreak, streak);
  stats.totalCorrect += correct;
  stats.totalQuestions += total;
  stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
  stats.winRate = Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
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

function startDailyChallenge() {
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

  const dailyPerson = getDailyFigure();
  const pool = [dailyPerson, ...state.people.filter(p => p.name !== dailyPerson.name)];
  state.questions = pickQuestionSet(5, 'medium', pool);
  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  btnNext.disabled = true;
  quizEl.style.display = 'block';
  timerEl.style.display = 'none';
  if (btnPause) btnPause.style.display = 'none';
  challengeStatusEl.style.display = 'none';
  stopTimer();
  nextQuestion();
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
const p1NameEl = document.getElementById('p1-name');
const p2NameEl = document.getElementById('p2-name');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
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
const p1NameInput = document.getElementById('p1-name');
const p2NameInput = document.getElementById('p2-name');

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
  if(qType==='age') return translateEvent(value);
  if(qType==='name' || qType==='mother') return translateName(value);
  return value;
}

// =========================
// Init
// =========================
async function init(){
  console.log('Initializing app...');
  SoundFX.init();
  attachHandlers(); // Attach listeners immediately
  initFeedback(); // Initialize feedback system
  
  // Set default settings if not present
  const defaultSettings = {
    difficulty: 'medium',
    numQuestions: 10,
    timeLimit: 60,
    theme: 'night',
    language: 'en'
  };
  let savedSettings = loadSettings();
  if(!savedSettings){
    savedSettings = { ...defaultSettings };
    localStorage.setItem('settings', JSON.stringify(savedSettings));
  }
  // Apply settings to UI and state
  difficultySel.value = savedSettings.difficulty ?? defaultSettings.difficulty;
  numQuestionsInput.value = String(savedSettings.numQuestions ?? defaultSettings.numQuestions);
  timeLimitInput.value = String(savedSettings.timeLimit ?? defaultSettings.timeLimit);
  
  // Ensure theme is applied - force initial application
  const themeToApply = savedSettings.theme || defaultSettings.theme;
  console.log('Initial theme to apply:', themeToApply); // Debug
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
  // Load people data from external JSON file
  try {
    const response = await fetch('assets/data/people.json');
    if (response.ok) {
      const externalData = await response.json();
      DEFAULT_PEOPLE_DATA.length = 0; // Clear hardcoded data
      DEFAULT_PEOPLE_DATA.push(...externalData); // Replace with external data
      console.log('✓ Loaded', externalData.length, 'people from external JSON');
    }
  } catch (error) {
    console.warn('Could not load external people data, using defaults:', error);
  }
  
  state.people = loadPeopleDataFromLocalStorage() || DEFAULT_PEOPLE_DATA.slice();
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
  
  // Initialize Firebase and show Remote Challenge if available
  if (window.FirebaseConfig) {
    const firebaseReady = window.FirebaseConfig.initialize();
    if (firebaseReady && btnRemoteChallenge) {
      btnRemoteChallenge.style.display = 'block';
      console.log('✓ Remote Challenge enabled (Firebase configured)');
      
      const urlParams = new URLSearchParams(window.location.search);
      const pinFromUrl = urlParams.get('pin');
      const roomCodeFromUrl = window.RemoteChallenge?.getRoomCodeFromUrl();
      
      if (pinFromUrl) {
        // Auto-open Classroom join modal
        setTimeout(() => {
          promptClassroomJoin(pinFromUrl);
        }, 300);
      } else if (roomCodeFromUrl) {
        // Auto-open Remote Challenge join flow
        setTimeout(() => {
          if (window.RemoteChallengeUI) {
            window.RemoteChallengeUI.show();
            window.RemoteChallengeUI.showStep('join');
            const input = document.getElementById('remote-room-code-input');
            if (input) input.value = roomCodeFromUrl;
          }
        }, 300);
      }
    } else {
      console.log('ℹ Remote Challenge disabled (Firebase not configured)');
    }
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
  
  // Initialize history state
  if (!history.state) {
    history.replaceState({ view: 'setup' }, '', window.location.pathname);
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

  // Home link handler
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e)=>{ e.preventDefault(); showSetup(); });
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
  
  // Mode buttons
  if (btnSolo) btnSolo.addEventListener('click', () => { SoundFX.playClick(); startSolo(); });
  if (btnTimed) btnTimed.addEventListener('click', () => { SoundFX.playClick(); startTimed(); });
  if (btnChallenge) btnChallenge.addEventListener('click', () => { SoundFX.playClick(); startChallenge(); });
  if (btnStudy) btnStudy.addEventListener('click', () => { SoundFX.playClick(); startStudy(); });
  if (btnScenarios) btnScenarios.addEventListener('click', () => { SoundFX.playClick(); startScenarios(); });
  
  // Navigation
  if (btnBackToSetup) btnBackToSetup.addEventListener('click', () => { SoundFX.playClick(); showSetup(); });
  if (btnBackFromStudy) btnBackFromStudy.addEventListener('click', () => { SoundFX.playClick(); showSetup(); });
  // Community moved to separate page
  
  // Game controls
  if (btnNext) {
    btnNext.addEventListener('click', () => {
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
  if (btnShuffleList) btnShuffleList.addEventListener('click', ()=>{ shuffle(state.people); renderPeopleList(searchPerson ? searchPerson.value : ''); SoundFX.playClick(); });
  if (btnExpandAll) btnExpandAll.addEventListener('click', ()=>toggleAllDetails(true));
  if (btnCollapseAll) btnCollapseAll.addEventListener('click', ()=>toggleAllDetails(false));
  
  // Testament and gender filters
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  if (testamentFilter) {
    testamentFilter.addEventListener('change', ()=>renderPeopleList(searchPerson ? searchPerson.value : ''));
  }
  if (genderFilter) {
    genderFilter.addEventListener('change', ()=>renderPeopleList(searchPerson ? searchPerson.value : ''));
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
  // Share
  if (btnShare) {
    btnShare.addEventListener('click', async ()=>{
      const shareData = {
        title: 'Who-Bible',
        text: getText('brandDesc'),
        url: location.href
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch(_){}
      } else {
        try {
          await navigator.clipboard.writeText(`${shareData.title} — ${shareData.url}`);
          showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1500 });
        } catch(_) {
          showToast({ title: getText('importError'), msg: 'Clipboard unavailable', type: 'error', timeout: 1500 });
        }
      }
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
  
  // Modal Close Handlers
  if (btnSummaryClose) btnSummaryClose.addEventListener('click', hideSummaryModal);
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => {
    hideSummaryModal();
    // Restart based on last mode
    if (state.mode === 'solo') startSolo();
    else if (state.mode === 'timed') startTimed();
    else if (state.mode === 'challenge') startChallenge();
    else showSetup();
  });
  
  if (btnPlayersClose) btnPlayersClose.addEventListener('click', hidePlayersModal);
  if (btnPlayersCancel) btnPlayersCancel.addEventListener('click', hidePlayersModal);
  if (btnPlayersStart) btnPlayersStart.addEventListener('click', startChallengeFromModal);
  
  // Challenge Mode - Save name buttons
  const btnSaveP1Name = document.getElementById('btn-save-p1-name');
  const btnSaveP2Name = document.getElementById('btn-save-p2-name');
  if (btnSaveP1Name) {
    btnSaveP1Name.addEventListener('click', () => {
      const name = p1NameInput.value.trim();
      if (!name) {
        showToast({ title: 'Name Required', msg: 'Please enter Player 1 name', type: 'error' });
        p1NameInput.focus();
        return;
      }
      showToast({ title: 'Saved!', msg: `Player 1: ${name}`, type: 'success', timeout: 1500 });
      // Flash effect
      btnSaveP1Name.style.boxShadow = '0 0 0 2px var(--primary-color)';
      setTimeout(() => { btnSaveP1Name.style.boxShadow = ''; }, 400);
    });
  }
  if (btnSaveP2Name) {
    btnSaveP2Name.addEventListener('click', () => {
      const name = p2NameInput.value.trim();
      if (!name) {
        showToast({ title: 'Name Required', msg: 'Please enter Player 2 name', type: 'error' });
        p2NameInput.focus();
        return;
      }
      showToast({ title: 'Saved!', msg: `Player 2: ${name}`, type: 'success', timeout: 1500 });
      // Flash effect
      btnSaveP2Name.style.boxShadow = '0 0 0 2px var(--primary-color)';
      setTimeout(() => { btnSaveP2Name.style.boxShadow = ''; }, 400);
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
    if (e.target === modalEl) hideSummaryModal();
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
      const reportModal = document.getElementById('report-modal');
      if (reportModal && reportModal.classList.contains('show')) {
        reportModal.classList.remove('show');
        document.body.style.overflow = '';
      }
      const feedbackModal = document.getElementById('feedback-modal');
      if (feedbackModal && feedbackModal.classList.contains('show')) {
        feedbackModal.classList.remove('show');
        document.body.style.overflow = '';
      }
      const profileModal = document.getElementById('profile-modal');
      if (profileModal && profileModal.style.display === 'flex') profileModal.style.display = 'none';
      const welcomeModal = document.getElementById('welcome-modal');
      if (welcomeModal && welcomeModal.style.display === 'flex') welcomeModal.style.display = 'none';
      if (modalEl && modalEl.style.display === 'flex') hideSummaryModal();
      if (playersModal && playersModal.style.display === 'flex') hidePlayersModal();
      if (remoteModal && remoteModal.style.display === 'flex') {
        if (window.RemoteChallengeUI && window.RemoteChallengeUI.hide) {
          window.RemoteChallengeUI.hide();
        } else {
          remoteModal.style.display = 'none';
        }
      }
      return;
    }

    // Do not intercept keystrokes if typing inside text fields
    if (isTyping) return;

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

    // In-game play controls when Game Area is active
    const gameArea = document.getElementById('game-area');
    const isGameActive = gameArea && gameArea.style.display !== 'none';

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

function showSetup(fromHistory = false){
  if(!fromHistory) updateHistory('setup');
  setupPanel.style.display = 'flex';
  gameArea.style.display = 'none';
  studyPanel.style.display = 'none';
  stopTimer();
  // Reset quiz display
  const quizEl = document.getElementById('quiz');
  const welcomeMsg = document.getElementById('welcome-message');
  if(quizEl) quizEl.style.display = 'none';
  if(welcomeMsg) welcomeMsg.style.display = 'block';
  // Reset question number display
  if(typeof qnumEl !== 'undefined' && typeof qtotalEl !== 'undefined') {
    qnumEl.innerText = '0';
    // set total to selected number of questions for clarity
    const selected = parseInt(numQuestionsInput.value)||10;
    qtotalEl.innerText = String(selected);
  }
}

function showGame(fromHistory = false){
  if(!fromHistory) updateHistory('game');
  setupPanel.style.display = 'none';
  gameArea.style.display = 'flex';
  studyPanel.style.display = 'none';
}

function showStudy(fromHistory = false){
  if(!fromHistory) updateHistory('study');
  setupPanel.style.display = 'none';
  gameArea.style.display = 'none';
  studyPanel.style.display = 'flex';
  renderPeopleList();
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
function startSolo(){
  showGame();
  gameTitle.textContent = getText('soloMode');
  prepareQuiz('solo');
  showToast({ title: getText('soloStart'), msg: getText('soloStartMsg'), type: 'info' });
}

function startTimed(){
  showGame();
  gameTitle.textContent = getText('timedMode');
  prepareQuiz('timed');
  const secs = parseInt(timeLimitInput.value)||60;
  // Ensure timer starts immediately
  startTimer(secs);
  showToast({ title: getText('timedStart'), msg: getText('timedStartMsg'), type: 'warn' });
}

function startChallenge(){
  showPlayersModal();
}

function startChallengeFromModal(){
  const name1 = (p1NameInput.value||'Player 1').trim() || 'Player 1';
  const name2 = (p2NameInput.value||'Player 2').trim() || 'Player 2';
  hidePlayersModal();
  showGame();
  gameTitle.textContent = getText('challengeMode');
  
  // Challenge mode uses temporary players for this session only
  // Does not affect the main player profile/stats
  state.players = [ 
    { name: name1, score: 0 }, 
    { name: name2, score: 0 } 
  ];
  state.currentPlayerIndex = 0;
  
  // Update UI with actual player names
  if (currentPlayerEl) currentPlayerEl.textContent = '1';
  if (currentPlayerTurnNameEl) currentPlayerTurnNameEl.textContent = name1;
  if (p1NameEl) p1NameEl.textContent = name1;
  if (p2NameEl) p2NameEl.textContent = name2;
  if (p1ScoreEl) p1ScoreEl.textContent = '0';
  if (p2ScoreEl) p2ScoreEl.textContent = '0';
  
  // Ensure timer is stopped for challenge mode
  stopTimer();
  
  prepareQuiz('challenge');
  showToast({ 
    title: getText('challengeStart'), 
    msg: `${name1} vs ${name2}! ${getText('challengeStartMsg')}`, 
    type: 'info' 
  });
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
  afterRef.innerText='';
  state.score = 0; state.streak = 0; state.qnum = 0; state.results = []; state.paused = false;
  
  // Reset and shuffle scenarios
  window.ScenarioModule.reset();
  window.ScenarioModule.shuffleScenarios();
  
  const count = parseInt(numQuestionsInput.value) || Math.min(10, window.ScenarioModule.scenarios.length);
  state.questions = window.ScenarioModule.scenarios.slice(0, count);
  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  btnNext.disabled = true;
  
  // Show the quiz interface
  quizEl.style.display = 'block';
  
  // Hide mode-specific elements
  timerEl.style.display = 'none';
  btnPause.style.display = 'none';
  challengeStatusEl.style.display = 'none';
  stopTimer();
  
  nextScenarioQuestion();
}

function nextScenarioQuestion(){
  if(state.qnum >= state.qtotal){
    endQuiz();
    return;
  }
  
  state.qnum++;
  qnumEl.innerText = state.qnum;
  updateProgress();
  
  const scenario = state.questions[state.qnum - 1];
  state.current = scenario;
  
  renderScenarioQuestion(scenario);
  btnNext.disabled = true;
  afterRef.innerText = '';
}

function renderScenarioQuestion(scenario){
  if (!scenario) {
    qText.innerHTML = `<div class="scenario-card"><div class="scenario-body">${getText('errorScenarioMissing')}</div></div>`;
    return;
  }

  // Translate scenario content
  const translatedScenario = translateScenario(scenario);

  // Build the question prompt
  let prompt = `
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
  
  // Render answer options
  answersEl.innerHTML = '';
  if (translatedScenario.options && Array.isArray(translatedScenario.options)) {
    translatedScenario.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'ans scenario-option';
    const letter = option.charAt(0);
    const text = option.substring(3);
    btn.dataset.value = letter;
    btn.innerHTML = `
      <span class="option-letter">${letter}</span>
      <span class="option-text">${text}</span>
    `;
    btn.addEventListener('click', ()=> answerScenarioQuestion(letter));
    answersEl.appendChild(btn);
  });
  }
}

function answerScenarioQuestion(selected){
  const scenario = state.current;
  const translatedScenario = translateScenario(scenario);
  const isCorrect = selected === scenario.correct_answer;
  
  // Disable all answer buttons
  Array.from(answersEl.querySelectorAll('.ans')).forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.value === scenario.correct_answer) {
      btn.classList.add('correct');
    }
    if (btn.dataset.value === selected && !isCorrect) {
      btn.classList.add('wrong');
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
    showToast({ title: getText('correct') || 'Correct!', msg: '', type: 'success', timeout: 1000 });
  } else {
    state.streak = 0;
    updateStreakHUD(0);
    SoundFX.playWrong();
    scoreEl.innerText = state.score;
    streakEl.innerText = state.streak;
    showToast({ title: getText('wrongAnswer') || getText('wrong'), msg: '', type: 'error', timeout: 1000 });
  }
  
  // Record result
  // Find the full text for the selected and correct options (use translated versions)
  const selectedOptionText = translatedScenario.options.find(o => o.startsWith(selected))?.substring(3) || selected;
  const correctOptionText = translatedScenario.options.find(o => o.startsWith(scenario.correct_answer))?.substring(3) || scenario.correct_answer;

  state.results.push({
    prompt: translatedScenario.challenge,
    chosenDisplay: `${selected}. ${selectedOptionText}`,
    correctDisplay: `${scenario.correct_answer}. ${correctOptionText}`,
    correct: isCorrect,
    ref: [scenario.book_ref],
    explanation: translatedScenario.explanation
  });
  
  // Show explanation
  afterRef.innerHTML = `
    <div class="scenario-explanation">
      <strong>${isCorrect ? getText('scenarioCorrect') : getText('scenarioIncorrect')}</strong>
      <p>${translatedScenario.explanation}</p>
      <p class="scenario-tags">${scenario.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</p>
    </div>
  `;
  
  btnNext.disabled = false;
}

function prepareQuiz(mode){
  state.mode = mode;
  afterRef.innerText='';
  state.score = 0; state.streak = 0; state.qnum = 0; state.results = []; state.paused = false;
  const count = parseInt(numQuestionsInput.value) || 10;
  const difficulty = difficultySel.value;
  
  // Apply testament and gender filters to the people pool
  let peoplePool = state.people.slice();
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  
  if (testamentFilter && testamentFilter.value !== 'all') {
    peoplePool = peoplePool.filter(p => p.testament === testamentFilter.value);
  }
  
  if (genderFilter && genderFilter.value !== 'all') {
    peoplePool = peoplePool.filter(p => p.gender === genderFilter.value);
  }
  
  state.questions = pickQuestionSet(count, difficulty, peoplePool);
  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  btnNext.disabled = true;
  
  // Show the quiz interface
  quizEl.style.display = 'block';
  
  // Hide welcome message and show quiz content
  const welcomeMsg = document.getElementById('welcome-message');
  if(welcomeMsg) welcomeMsg.style.display = 'none';
  
  // Configure mode-specific elements
  timerEl.style.display = (mode==='timed') ? 'inline-flex' : 'none';
  btnPause.style.display = (mode==='timed') ? 'inline-block' : 'none';
  challengeStatusEl.style.display = (mode==='challenge') ? 'inline-flex' : 'none';
  
  if(mode==='timed'){
    const secs = parseInt(timeLimitInput.value) || 60;
    // Timer is started in startTimed, but if we restart or come from elsewhere:
    if(!state.timerId) startTimer(secs);
    scheduleTimeWarnings();
  } else {
    stopTimer();
  }
  nextQuestion();
}

function quitQuiz(){
  showSetup();
}

// =========================
// Questions
// =========================
function pickQuestionSet(count, difficulty, peoplePool = null){
  const types = ['whoDid','whoMother','occupation','age','event'];
  let pool = filterPeopleByDifficulty(peoplePool || state.people, difficulty);
  
  if (difficulty === 'hard') {
    // For hard mode, pool is sorted by difficulty. Take top candidates then shuffle.
    const topCandidates = pool.slice(0, Math.max(count * 2, 20));
    shuffle(topCandidates);
    pool = topCandidates;
  } else {
    shuffle(pool);
  }

  const selected = pool.slice(0, Math.min(count, pool.length));
  const questions = [];
  for(const person of selected){
    const t = types[Math.floor(Math.random()*types.length)];
    if(t==='whoDid'){
      const rawEvent = person.notable_events?.[0] || getText('fallbackEvent');
      // Store raw token to allow re-localization on language change
      const event = translateEvent(rawEvent);
      questions.push({type:'whoDid',prompt:getText('questionWhoDid', {event}),answer:person.name,ref:person.verses, raw:{ event: rawEvent }});
    }else if(t==='whoMother'){
      if(person.mother) questions.push({type:'whoMother',prompt:getText('questionWhoMother', {name: person.name}),answer:person.mother,ref:person.verses, raw:{ name: person.name }});
    }else if(t==='occupation'){
      if(person.occupation) questions.push({type:'occupation',prompt:getText('questionOccupation', {name: person.name}),answer:person.occupation,ref:person.verses, raw:{ occupation: person.occupation, name: person.name }});
    }else if(t==='age'){
      if(person.age_notes) questions.push({type:'age',prompt:getText('questionAge', {name: person.name}),answer:person.age_notes,ref:person.verses, raw:{ name: person.name, age: person.age_notes }});
    }else if(t==='event'){
      if(person.notable_events && person.notable_events.length>0) {
        const rawEvent = person.notable_events[0];
        const event = translateEvent(rawEvent);
        questions.push({type:'event',prompt:getText('questionEvent', {event}),answer:person.name,ref:person.verses, raw:{ event: rawEvent }});
      }
    }
  }
  // ensure we have at least count questions; fill with simple ones
  let i = 0;
  while(questions.length < count && i < state.people.length){
    const p = state.people[i++];
    const rawEvent = p.notable_events?.[0] || getText('fallbackEvent');
    const event = translateEvent(rawEvent);
    questions.push({type:'whoDid',prompt:getText('questionWhoDid', {event}),answer:p.name,ref:p.verses});
  }
  return questions.slice(0, count);
}

function filterPeopleByDifficulty(people, difficulty){
  if(difficulty==='easy'){
    const common = new Set(['Noah','Moses','David','Solomon','Abraham','Isaac','Jacob','Ruth','Esther','Peter','Paul','Mary (mother of Jesus)','John the Baptist','Joseph (son of Jacob)','Lazarus']);
    return people.filter(p => p.difficulty === 'easy' || common.has(p.name));
  }
  if(difficulty==='hard'){
    // Prefer entries with less-complete bios (harder), but include all
    const scored = people.map(p=>({
      p,
      score: (p.occupation?0:1) + (p.mother?0:1) + (p.age_notes?0:1) + ((p.notable_events?.length||0) < 1 ? 1 : 0)
    }));
    scored.sort((a,b)=>b.score-a.score);
    return scored.map(s=>s.p);
  }
  return people.slice();
}

function nextQuestion(){
  if(state.qnum >= state.qtotal){ endQuiz(); return; }
  state.current = state.questions[state.qnum];
  state.qnum++;
  qnumEl.innerText = state.qnum;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  renderQuestion(state.current);
  updateProgress();
}

function renderQuestion(q){
  // If the question has raw tokens, regenerate localized prompt to respect current language
  if(q && q.raw){
    if(q.type==='whoDid' || q.type==='event'){
      const ev = translateEvent(q.raw.event);
      qText.innerText = getText(q.type==='whoDid' ? 'questionWhoDid' : 'questionEvent', { event: ev });
    } else if(q.type==='occupation'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionOccupation', { name: translatedName });
    } else if(q.type==='whoMother'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionWhoMother', { name: translatedName });
    } else if(q.type==='age'){
      const translatedName = translateName(q.raw.name);
      qText.innerText = getText('questionAge', { name: translatedName });
    } else {
      qText.innerText = q.prompt;
    }
  } else {
    qText.innerText = q.prompt;
  }
  afterRef.innerText='';
  btnNext.disabled = true;
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
  // Focus first choice for accessibility
  const first = answersEl.querySelector('.ans');
  if(first) first.focus();
}

function makeChoices(q){
  const set = new Set([q.answer]);
  const distractors = getDistractors(q);
  for(const d of distractors){
    if (d && normalize(d) !== normalize(q.answer)) {
      set.add(d);
    }
    if(set.size>=4) break;
  }
  
  // Biblical category fallback pools to avoid mismatching names with roles/ages/mothers
  const fallbackPools = {
    occupation: [
      'Prophet', 'Priest', 'King', 'Judge of Israel', 'Shepherd', 
      'Fisherman', 'Scribe', 'Carpenter', 'Tentmaker', 
      'Tax Collector', 'Warrior / Military Commander', 'Cupbearer', 'Apostle'
    ],
    age: [
      'Lived 120 years', 'Lived 175 years', 'Lived 969 years', 'Lived 930 years', 
      'Died around age 33', 'Lived 110 years', 'Lived 147 years', 'Lived 180 years',
      'Lived to an advanced age and died in peace'
    ],
    whoMother: [
      'Sarah', 'Rebekah', 'Rachel', 'Leah', 'Hannah', 
      'Elizabeth', 'Mary', 'Jochebed', 'Bathsheba', 'Ruth', 'Eve'
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

  // Safety net if still under 4
  if (set.size < 4 && q.type !== 'whoDid' && q.type !== 'event') {
    const defaultPool = fallbackPools.default.slice();
    shuffle(defaultPool);
    for (const name of defaultPool) {
      if (set.size >= 4) break;
      if (name && normalize(name) !== normalize(q.answer)) {
        set.add(name);
      }
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
  } else if(q.type==='age'){
    const pool = state.people.map(p=>p.age_notes).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else if(q.type==='whoMother'){
    const pool = state.people.map(p=>p.mother).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else {
    const pool = state.people.map(p=>p.name).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  }
  return results;
}

function handleAnswer(choice,q, el){
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
    if(state.mode==='challenge'){
      state.players[state.currentPlayerIndex].score += 10;
      updateChallengeScores();
    }
    // Remote challenge: sync score to Firebase
    if(state.mode==='remote-challenge' && window.RemoteChallenge){
      window.RemoteChallenge.submitAnswer(state.qnum - 1, true, 0);
    }
    showToast({ title: getText('correctAnswer'), msg: getText('correctMsg'), type: 'success', timeout: 1500 });
  }else{
    state.streak = 0;
    updateStreakHUD(0);
    SoundFX.playWrong();
  afterRef.innerText = `${getText('wrongAnswer')}. ${getText('correctLabel')}: ${translateAnswerForQuestionType(q.type, q.answer)}. ${getText('references')}: ${(q.ref||[]).join(', ')}`;
  // Remote challenge: sync score to Firebase
    if(state.mode==='remote-challenge' && window.RemoteChallenge){
      window.RemoteChallenge.submitAnswer(state.qnum - 1, false, 0);
    }
  showToast({ title: getText('wrongAnswer'), msg: getText('wrongMsg', { answer: translateAnswerForQuestionType(q.type, q.answer) }), type: 'error', timeout: 1800 });
  }

  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  btnNext.disabled = false;

  // Record result
  state.results.push({ 
    prompt: q.prompt, 
    chosen: choice, 
    correctAnswer: q.answer, 
    chosenDisplay: translateAnswerForQuestionType(q.type, choice),
    correctDisplay: translateAnswerForQuestionType(q.type, q.answer),
    correct, 
    ref: q.ref||[] 
  });

  // For challenge mode, alternate player each question
  if(state.mode==='challenge'){
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
    const nextPlayer = state.players[state.currentPlayerIndex];
    
    // Update both legacy number and actual name
    if (currentPlayerEl) currentPlayerEl.textContent = String(state.currentPlayerIndex + 1);
    if (currentPlayerTurnNameEl) currentPlayerTurnNameEl.textContent = nextPlayer.name;
    
    showToast({ title: getText('challengeTurn', { player: nextPlayer.name }), msg: getText('challengeTurnMsg', { player: nextPlayer.name }), type: 'info', timeout: 1200 });
  }
const [p1, p2] = state.players;
  if (p1ScoreEl) p1ScoreEl.textContent = String(p1.score);
  if (p2ScoreEl) p2ScoreEl.textContent = String(p2.score);
  
  // Update current player turn display
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayerTurnNameEl) {
    currentPlayerTurnNameEl.textContent = currentPlayer.name;
  }
  if (currentPlayerEl) {
    currentPlayerEl.textContent = String(state.currentPlayerIndex + 1); // Legacy compatibility
  }
}

function updateChallengeScores(){
  p1ScoreEl.textContent = String(state.players[0].score);
  p2ScoreEl.textContent = String(state.players[1].score);
}

function endQuiz(){
  let endText = `${getText('quizComplete')}! ${getText('yourScore')}: ${state.score}`;
  if(state.mode==='challenge'){
    const [p1,p2] = state.players;
    const isTie = p1.score === p2.score;
    const winnerName = p1.score > p2.score ? p1.name : p2.name;
    endText += ` — ${isTie ? getText('tieGame') : getText('winner') + ': ' + winnerName}`;
  }
  qText.innerText = endText;
  answersEl.innerHTML='';
  afterRef.innerText='';
  stopTimer();
  
  // Update player statistics
  const correctAnswers = state.results.filter(r => r.correct).length;
  const totalQuestions = state.results.length;
  updatePlayerStats(state.score, state.streak, correctAnswers, totalQuestions, state.mode);
  displayPlayerInfo();
  
  // Dispatch game completed event for guest prompts
  document.dispatchEvent(new CustomEvent('gameCompleted', {
    detail: {
      score: state.score,
      streak: state.streak,
      correct: correctAnswers,
      total: totalQuestions,
      mode: state.mode
    }
  }));
  
  // Complete remote challenge if in remote mode
  if(state.mode==='remote-challenge' && window.RemoteChallenge){
    window.RemoteChallenge.completeChallenge();
  }
  
  state.current=null; state.questions=[]; state.qnum=0; state.qtotal=0;
  btnNext.disabled = true;

  // Show summary modal
  showSummaryModal();
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
  timerEl.style.display = 'inline-flex';
  state.timerId = setInterval(()=>{
    if(state.paused) return;
    state.timerSecondsRemaining -= 1;
    const currentTrEl = document.getElementById('time-remaining');
    if(currentTrEl) currentTrEl.textContent = String(Math.max(0, state.timerSecondsRemaining));
    // Timer styling thresholds
    timerEl.classList.remove('warn','danger');
    if(state.timerSecondsRemaining <= 5) timerEl.classList.add('danger');
    else if(state.timerSecondsRemaining <= 15) timerEl.classList.add('warn');
    if(state.timerSecondsRemaining <= 10 && state.timerSecondsRemaining > 0) {
      SoundFX.playTick();
    }
    if(state.timerSecondsRemaining <= 0){
      stopTimer();
      SoundFX.playWrong();
      showToast({ title: getText('timeUp'), msg: getText('timeUpMsg'), type: 'warn', timeout: 2000 });
      endQuiz();
    }
  },1000);
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
  btnPause.textContent = state.paused ? getText('resume') : getText('pause');
  
  // Disable/Enable answers based on pause state
  const ansNodes = Array.from(answersEl.querySelectorAll('.ans'));
  ansNodes.forEach(node => {
    if(state.paused) {
      node.classList.add('disabled');
      node.style.pointerEvents = 'none';
      node.style.opacity = '0.5';
    } else {
      // Only re-enable if not already answered/disabled
      if(!node.classList.contains('correct') && !node.classList.contains('incorrect')) {
        node.classList.remove('disabled');
        node.style.pointerEvents = 'auto';
        node.style.opacity = '1';
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
  
  let arr = state.people.slice();
  const q = normalize(filterText);
  if (q) {
    arr = arr.filter(p => 
      normalize(p.name).includes(q) || 
      (p.aliases && p.aliases.some(a => normalize(a).includes(q))) ||
      normalize(p.occupation || '').includes(q)
    );
  }
  
  if (filterOccupation?.checked) arr = arr.filter(p => !!p.occupation);
  if (filterAge?.checked) arr = arr.filter(p => !!p.age_notes);
  if (filterMother?.checked) arr = arr.filter(p => !!p.mother || !!p.father);
  
  if (sortSelect) {
    if (sortSelect.value === 'name-asc') arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sortSelect.value === 'name-desc') arr.sort((a, b) => b.name.localeCompare(a.name));
  }
  if (peopleCountEl) peopleCountEl.textContent = String(arr.length);
  for (const p of arr) {
    const item = document.createElement('div');
    item.className = 'person-card';
    
    const icon = getPersonIcon(p);
    
    item.innerHTML = `
      <div class="card-header">
        <div class="card-icon">${icon}</div>
        <div class="card-title">${p.name}</div>
      </div>
      <div class="card-body">
        <div class="card-info">${translateOccupation(p.occupation) || getText('unknownOccupation') || 'Unknown'}</div>
        <div class="card-tags">
          ${p.testament === 'ot' ? '<span class="tag tag-ot">Old Testament</span>' : '<span class="tag tag-nt">New Testament</span>'}
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

function resetData(){
  if(confirm(getText('resetConfirm'))){
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
    return Array.isArray(parsed) ? parsed : null;
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

// Theme
function applyTheme(theme){
  state.theme = theme;
  document.body.classList.remove('day', 'night');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  
  if(theme === 'day') {
    document.body.classList.add('day');
    if(btnTheme) btnTheme.setAttribute('title', 'Theme: Ancient Bronze Dusk (Press T)');
    if(btnThemeToggle) btnThemeToggle.textContent = '🏺';
  } else {
    theme = 'night';
    document.body.classList.add('night');
    if(btnTheme) btnTheme.setAttribute('title', 'Theme: Celestial Midnight (Press T)');
    if(btnThemeToggle) btnThemeToggle.textContent = '🌙';
  }
}

function saveSettingsFromUI(){
  const settings = {
    difficulty: difficultySel.value,
    numQuestions: parseInt(numQuestionsInput.value)||10,
    timeLimit: parseInt(timeLimitInput.value)||60,
    theme: state.theme
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
  
  const total = state.results.length;
  const correct = state.results.filter(r=>r.correct).length;
  const accuracy = total ? Math.round((correct/total)*100) : 0;
  const xpEarned = correct * 10 + (state.streak * 5);
  
  if (accuracy >= 70) {
    SoundFX.playFanfare();
  } else {
    SoundFX.playCorrect();
  }
  
  // Update victory banner
  const headlineEl = document.getElementById('summary-headline');
  const subtextEl = document.getElementById('summary-subtext');
  const badgeIconEl = document.getElementById('summary-badge-icon');
  
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

  // Versus / 2-Player banner if applicable
  let versusBannerHtml = '';
  if (state.mode === 'challenge' || state.mode === 'remote-challenge') {
    const [p1, p2] = state.players;
    const isTie = p1.score === p2.score;
    const winnerName = p1.score > p2.score ? p1.name : p2.name;
    const winnerText = isTie ? '🤝 Tie Match!' : `🏆 Winner: ${winnerName}!`;
    versusBannerHtml = `
      <div class="summary-versus-card">
        <div class="versus-result-title">${winnerText}</div>
        <div class="versus-score-row">
          <span>${p1.name}: <strong>${p1.score}</strong></span>
          <span class="vs-dot">•</span>
          <span>${p2.name}: <strong>${p2.score}</strong></span>
        </div>
      </div>
    `;
  }
  
  // Render stats grid
  if (summaryStatsEl) {
    summaryStatsEl.innerHTML = `
      ${versusBannerHtml}
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

      div.innerHTML = `
        <div class="review-card-header">
          <span class="review-q-num">Q${idx + 1}</span>
          <span class="review-status-icon">${statusIcon}</span>
          <div class="review-prompt">${r.prompt}</div>
        </div>
        <div class="review-card-body">
          <div class="review-answer-row">
            <span class="review-ans-label">Your Choice:</span>
            <span class="review-ans-val ${r.correct ? 'ans-correct-val' : 'ans-wrong-val'}">${r.chosenDisplay || r.chosen}</span>
          </div>
          ${!r.correct ? `
            <div class="review-answer-row">
              <span class="review-ans-label">Correct:</span>
              <span class="review-ans-val ans-correct-val">${r.correctDisplay || r.correctAnswer}</span>
            </div>
          ` : ''}
          <div class="review-verse-row">
            <span class="review-verse-label">Scripture Reference:</span>
            <div class="review-verse-list">${versesFormatted}</div>
          </div>
          ${r.explanation ? `<div class="review-explanation">${r.explanation}</div>` : ''}
        </div>
      `;
      summaryListEl.appendChild(div);
    });
  }

  // Share results button
  const btnShareSummary = document.getElementById('btn-share-summary');
  if (btnShareSummary) {
    btnShareSummary.onclick = async () => {
      const shareText = `🏆 Who-Bible Trivia Match: I scored ${state.score} pts with ${accuracy}% accuracy! Play along: ${window.location.origin}`;
      if (navigator.share) {
        try { await navigator.share({ title: 'Who-Bible Score', text: shareText }); } catch (_) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showToast({ title: 'Copied to Clipboard!', msg: 'Share your score with friends', type: 'success', timeout: 2000 });
      }
    };
  }

  modalEl.style.display = 'flex';
}

function hideSummaryModal(){
  if(modalEl) modalEl.style.display = 'none';
  document.body.style.overflow = '';
}

// Players modal
function showPlayersModal(){
  p1NameInput.value = 'P1';
  p2NameInput.value = 'P2';
  playersModal.style.display = 'flex';
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
    document.body.style.overflow = '';
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

// Classroom Mode - Join Prompt
function promptClassroomJoin(initialPin = '') {
  // Rate limiting
  if (window.RateLimiter && !window.RateLimiter.check('joinClassroom', 10)) {
    showToast({ title: 'Error', msg: 'Too many join attempts. Please wait.', type: 'error' });
    return;
  }
  
  // Show the classroom join modal
  const modal = document.getElementById('classroom-join-modal');
  const pinInput = document.getElementById('classroom-pin-input');
  const nameInput = document.getElementById('classroom-player-name');
  const btnSave = document.getElementById('btn-classroom-join-save');
  const btnCancel = document.getElementById('btn-classroom-join-cancel');
  const btnClose = document.getElementById('btn-classroom-join-close');
  
  if (!modal || !pinInput || !nameInput) {
    // Fallback to old prompt method
    promptClassroomJoinLegacy();
    return;
  }
  
  // Pre-fill with player name if available
  const currentName = state.currentPlayer ? state.currentPlayer.name : 'Player';
  nameInput.value = currentName;
  pinInput.value = initialPin ? initialPin.toUpperCase() : '';
  
  modal.style.display = 'flex';
  setTimeout(() => { 
    if (initialPin) {
      nameInput.focus();
    } else {
      pinInput.focus();
    }
  }, 100);
  
  // Handle Save button click
  const handleSave = () => {
    const code = pinInput.value.trim();
    const name = nameInput.value.trim() || 'Player';
    
    if (!code) {
      showToast({ title: 'PIN Required', msg: 'Please enter a Game PIN', type: 'error' });
      pinInput.focus();
      return;
    }
    
    if (!window.FirebaseConfig || !window.FirebaseConfig.isAvailable()) {
      showToast({ title: 'Error', msg: 'Firebase not configured', type: 'error' });
      modal.style.display = 'none';
      return;
    }
    
    const database = window.FirebaseConfig.getDatabase();
    const sanitizedCode = code.toUpperCase();
    const sanitizedName = window.SecurityModule ? window.SecurityModule.sanitizeHTML(name) : name;
    const roomRef = database.ref('classrooms/' + sanitizedCode);
    
    // Check if room exists
    roomRef.once('value').then(snapshot => {
      if (!snapshot.exists()) {
        showToast({ title: 'Room Not Found', msg: 'Please check the Game PIN from the host.', type: 'error' });
        return;
      }
      
      const room = snapshot.val();
      
      if (room.status === 'finished') {
        showToast({ title: 'Game Ended', msg: 'This quiz session has already finished.', type: 'error' });
        return;
      }
      
      // Add player to room
      const playerId = 'player_' + Date.now();
      roomRef.child('players/' + playerId).set({
        name: sanitizedName,
        score: 0,
        correct: 0,
        joinedAt: Date.now()
      });
      
      // Update last activity
      roomRef.child('lastActivity').set(Date.now());
      
      modal.style.display = 'none';
      showToast({ title: 'Joined!', msg: `Welcome, ${sanitizedName}! Watch the host screen for questions.`, type: 'success', timeout: 4000 });
      
      // Listen for game state
      startClassroomPlayerMode(sanitizedCode, playerId, roomRef, sanitizedName);
    }).catch(error => {
      showToast({ title: 'Error', msg: 'Failed to join: ' + error.message, type: 'error' });
    });
  };
  
  // Handle Cancel button
  const handleCancel = () => {
    modal.style.display = 'none';
    cleanup();
  };
  
  // Handle Enter key in inputs
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If on pin input and it's filled, move to name
      if (e.target === pinInput && pinInput.value.trim()) {
        nameInput.focus();
      } else {
        // Otherwise, submit
        handleSave();
      }
    }
  };
  
  // Setup event listeners
  btnSave.addEventListener('click', handleSave);
  btnCancel.addEventListener('click', handleCancel);
  btnClose.addEventListener('click', handleCancel);
  pinInput.addEventListener('keypress', handleKeyPress);
  nameInput.addEventListener('keypress', handleKeyPress);
  
  // Cleanup function
  const cleanup = () => {
    btnSave.removeEventListener('click', handleSave);
    btnCancel.removeEventListener('click', handleCancel);
    btnClose.removeEventListener('click', handleCancel);
    pinInput.removeEventListener('keypress', handleKeyPress);
    nameInput.removeEventListener('keypress', handleKeyPress);
  };
}

// Legacy fallback for classroom join using prompts
function promptClassroomJoinLegacy() {
  const code = prompt('Enter Game PIN (e.g., FAITH-123):');
  if (!code) return;
  
  // Validate room code
  if (window.SecurityModule) {
    const codeValidation = window.SecurityModule.validateRoomCode(code);
    if (!codeValidation.valid) {
      showToast({ title: 'Error', msg: codeValidation.error, type: 'error' });
      return;
    }
  }
  
  const name = prompt('Enter your name:') || 'Player';
  
  // Validate player name
  if (window.SecurityModule) {
    const nameValidation = window.SecurityModule.validatePlayerName(name);
    if (!nameValidation.valid) {
      showToast({ title: 'Error', msg: nameValidation.error, type: 'error' });
      return;
    }
  }
  
  if (!window.FirebaseConfig || !window.FirebaseConfig.isAvailable()) {
    showToast({ title: 'Error', msg: 'Firebase not configured', type: 'error' });
    return;
  }
  
  const database = window.FirebaseConfig.getDatabase();
  const sanitizedCode = code.trim().toUpperCase();
  const sanitizedName = window.SecurityModule ? window.SecurityModule.sanitizeHTML(name.trim()) : name.trim();
  const roomRef = database.ref('classrooms/' + sanitizedCode);
  
  // Check if room exists
  roomRef.once('value').then(snapshot => {
    if (!snapshot.exists()) {
      showToast({ title: 'Error', msg: 'Room not found. Check the PIN.', type: 'error' });
      return;
    }
    
    const room = snapshot.val();
    
    if (room.status !== 'lobby' && room.status !== 'active' && room.status !== 'question') {
      showToast({ title: 'Error', msg: 'Game has ended or not started.', type: 'error' });
      return;
    }
    
    // Add player to room
    const playerId = 'player_' + Date.now();
    roomRef.child('players/' + playerId).set({
      name: sanitizedName,
      score: 0,
      correct: 0,
      joinedAt: Date.now()
    });
    
    // Update last activity
    roomRef.child('lastActivity').set(Date.now());
    
    showToast({ title: 'Success!', msg: `Joined as ${sanitizedName}. Follow instructions on screen!`, type: 'success', timeout: 8000 });
    
    // Listen for game state
    startClassroomPlayerMode(sanitizedCode, playerId, roomRef, sanitizedName);
  }).catch(error => {
    showToast({ title: 'Error', msg: 'Failed to join: ' + error.message, type: 'error' });
  });
}

// Classroom Player Mode
function startClassroomPlayerMode(roomCode, playerId, roomRef, playerName) {
  // Hide setup, show game area with modified UI
  setupPanel.style.display = 'none';
  gameArea.style.display = 'block';
  
  document.getElementById('game-title').textContent = `🏫 Classroom: ${roomCode}`;
  
  // Track my player state
  let myScore = 0;
  let myCorrect = 0;
  let hasAnsweredCurrent = false;
  
  // Listen for score updates
  roomRef.child(`players/${playerId}`).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      myScore = data.score || 0;
      myCorrect = data.correct || 0;
      // Assume global variable scoreEl exists, or define it here
      const scoreEl = document.getElementById('game-score');
      if (scoreEl) scoreEl.innerText = myScore;
    }
  });
  
  // Initial waiting state
  showClassroomLobbyWaiting(roomCode, playerName);
  
  // Listen for current question
  roomRef.child('currentQuestion').on('value', (snapshot) => {
    const questionIndex = snapshot.val();
    hasAnsweredCurrent = false;
    if (questionIndex !== null && questionIndex >= 0) {
      loadClassroomQuestion(roomRef, questionIndex, playerId);
    }
  });
  
  // Listen for status changes
  roomRef.child('status').on('value', (snapshot) => {
    const status = snapshot.val();
    if (status === 'results') {
      showClassroomRoundResults(roomRef, playerId);
    } else if (status === 'leaderboard') {
      showClassroomLeaderboardWaiting(myScore);
    } else if (status === 'finished') {
      showClassroomFinalResults(myScore, myCorrect);
    }
  });
}

function showClassroomLobbyWaiting(roomCode, playerName) {
  const qTextEl = document.getElementById('qtext');
  qTextEl.textContent = `You're in! Waiting for host to start the quiz...`;
  
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = `
    <div style="text-align: center; padding: 48px 24px; background: rgba(255,255,255,0.06); border: 2px dashed var(--accent); border-radius: 20px;">
      <div style="font-size: 56px; margin-bottom: 16px;">🎮</div>
      <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">Ready, ${playerName}!</h2>
      <p style="color: var(--muted); font-size: 16px;">Room Code: <strong style="color: var(--accent);">${roomCode}</strong></p>
      <p style="color: var(--muted); font-size: 14px; margin-top: 16px;">Watch the main screen for the quiz questions!</p>
    </div>
  `;
}

// Load classroom question for player
function loadClassroomQuestion(roomRef, questionIndex, playerId) {
  roomRef.child('questions').once('value').then(snapshot => {
    const questions = snapshot.val();
    if (!questions || !questions[questionIndex]) return;
    
    const question = questions[questionIndex];
    
    // Check if already answered
    roomRef.child(`responses/${playerId}`).once('value').then(respSnapshot => {
      const response = respSnapshot.val();
      if (response && response.answer !== undefined) {
        // Already answered - show waiting
        showClassroomWaiting();
        return;
      }
      
      // Show question
      displayClassroomQuestion(question, questionIndex, roomRef, playerId);
    });
  });
}

// Display classroom question for player
function displayClassroomQuestion(question, questionIndex, roomRef, playerId) {
  state.current = question;
  state.qnum = questionIndex + 1;
  
  const qTextEl = document.getElementById('qtext');
  qTextEl.textContent = question.prompt;
  
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = '';
  
  const icons = ['▲', '◆', '●', '■'];
  const colors = ['#e21b3c', '#1368ce', '#ffa602', '#26890c'];
  
  const gridContainer = document.createElement('div');
  gridContainer.className = 'classroom-options-grid';
  gridContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; width: 100%;';
  
  question.options.forEach((option, i) => {
    const btn = document.createElement('button');
    btn.className = 'classroom-answer-btn';
    btn.style.cssText = `
      background: ${colors[i]};
      color: #ffffff;
      border: none;
      border-radius: 16px;
      padding: 24px 16px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
      cursor: pointer;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
      transition: transform 0.15s ease, filter 0.15s ease;
    `;
    
    btn.innerHTML = `
      <span style="font-size: 32px; font-weight: 900; line-height: 1;">${icons[i]}</span>
      <span style="text-align: left; line-height: 1.3;">${option}</span>
    `;
    
    btn.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(50);
      btn.style.transform = 'scale(0.96)';
      btn.style.filter = 'brightness(1.2)';
      
      const answerTime = Date.now();
      const questionStartTime = state.questionStartTime || answerTime;
      const timeTaken = (answerTime - questionStartTime) / 1000;
      
      // Submit answer
      roomRef.child(`responses/${playerId}`).set({
        answer: i,
        timeTaken: timeTaken,
        timestamp: answerTime
      });
      
      // Show waiting
      showClassroomWaiting(option, icons[i], colors[i]);
    });
    
    gridContainer.appendChild(btn);
  });
  
  answersEl.appendChild(gridContainer);
  
  // Record question start time
  roomRef.child('questionStartTime').once('value').then(snapshot => {
    state.questionStartTime = snapshot.val();
  });
}

// Show waiting screen for classroom player
function showClassroomWaiting(selectedOption, icon, color) {
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = `
    <div style="text-align: center; padding: 48px 20px; background: rgba(255, 255, 255, 0.08); border-radius: 20px; border: 2px solid ${color || 'var(--accent)'};">
      <div style="font-size: 48px; margin-bottom: 12px;">${icon || '✓'}</div>
      <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Answer Locked In!</h2>
      ${selectedOption ? `<p style="font-size: 18px; color: var(--text); margin-bottom: 12px;">Selected: <strong>${selectedOption}</strong></p>` : ''}
      <p style="font-size: 15px; color: var(--muted);">Waiting for time to expire / other players...</p>
    </div>
  `;
}

// Show round results on player device
function showClassroomRoundResults(roomRef, playerId) {
  const answersEl = document.getElementById('answers');
  roomRef.child(`players/${playerId}`).once('value').then(snapshot => {
    const p = snapshot.val() || {};
    answersEl.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.08); border-radius: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">📊</div>
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Round Results on Screen</h2>
        <div style="font-size: 32px; font-weight: 900; color: var(--accent); margin: 12px 0;">${p.score || 0} pts</div>
        <p style="color: var(--muted); font-size: 15px;">Check the main screen to see the correct answer breakdown!</p>
      </div>
    `;
  });
}

// Show leaderboard waiting
function showClassroomLeaderboardWaiting(score) {
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.08); border-radius: 20px;">
      <div style="font-size: 48px; margin-bottom: 8px;">🏆</div>
      <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Leaderboard Displayed</h2>
      <div style="font-size: 32px; font-weight: 900; color: var(--accent); margin: 12px 0;">${score || 0} pts</div>
      <p style="color: var(--muted); font-size: 15px;">Next question starting soon...</p>
    </div>
  `;
}

// Show final results
function showClassroomFinalResults(score, correct) {
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = `
    <div style="text-align: center; padding: 48px 20px; background: rgba(255, 255, 255, 0.1); border-radius: 20px; border: 2px solid var(--accent);">
      <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
      <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">Quiz Completed!</h2>
      <div style="font-size: 36px; font-weight: 900; color: var(--accent); margin: 12px 0;">${score || 0} Total Points</div>
      <p style="color: var(--text); font-size: 18px; margin-bottom: 20px;">Correct answers: <strong>${correct || 0}</strong></p>
      <button onclick="window.location.reload()" class="primary" style="padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer;">Play Again</button>
    </div>
  `;
}

// Re-localize dynamic pieces when language changes
window.onWhoBibleLanguageChange = function(lang){
  try{
    // Re-display player info with new language
    displayPlayerInfo();
    // Re-render study list (people) to reflect translated events/occupations
    if(document.getElementById('study-panel') && state.people.length>0){
      renderPeopleList(searchPerson.value || '');
    }
    // Rebuild current question prompt and answer labels if a quiz is active
    if(state.current){
      renderQuestion(state.current);
      // Update answers display text for current choices
      const nodes = Array.from(document.querySelectorAll('#answers .ans'));
      nodes.forEach(node=>{
        const orig = node.dataset.value;
        const q = state.current;
        node.innerText = (typeof translateAnswerForQuestionType==='function') ? translateAnswerForQuestionType(q.type, orig) : orig;
      });
    }
  }catch(_){ /* non-fatal */ }
};

// Initialize authentication if available
if (typeof window !== 'undefined') {
  // Listen for auth state changes (corrected event names with colon)
  document.addEventListener('auth:login', (e) => {
    console.log('User logged in:', e.detail);
    // Migrate guest data to authenticated user if needed
    if (state.currentPlayer && state.currentPlayer.isGuest) {
      // TODO: Migrate stats to cloud
      console.log('Migrating guest stats to authenticated account');
    }
  });
  
  document.addEventListener('auth:logout', () => {
    console.log('User logged out, reverting to guest');
    // Revert to guest user
    state.currentPlayer = createGuestPlayer();
    savePlayer(state.currentPlayer);
    displayPlayerInfo();
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  init();
}
