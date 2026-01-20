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
    const stats = state.currentPlayer.stats;
    const isGuest = state.currentPlayer.isGuest;
    const guestBadgeHtml = isGuest ? `<span class="player-badge guest" title="${getText('guest.badgeTooltip')}">👤 ${getText('guest.badge')}</span>` : `<span class="player-badge member" title="Registered member">✓ Member</span>`;
    const deviceOnlyHtml = isGuest ? `<span class="device-only-badge" title="${getText('guest.deviceOnlyTooltip')}">📱 ${getText('guest.deviceOnly')}</span>` : '';
    
    if (typeof getText === 'function') {
      welcomeEl.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>${getText('welcomePlayer', { name: state.currentPlayer.name })} ${guestBadgeHtml}</h3>
          <div style="display: flex; gap: 20px; justify-content: center; margin-top: 16px; flex-wrap: wrap;">
            <div><strong>${getText('gamesPlayed')}:</strong> ${stats.gamesPlayed}</div>
            <div><strong>${getText('highScore')}:</strong> ${stats.highestScore} ${deviceOnlyHtml}</div>
            <div><strong>${getText('bestStreak')}:</strong> ${stats.bestStreak}</div>
            <div><strong>${getText('winRate')}:</strong> ${stats.winRate}%</div>
          </div>
        </div>
      `;
    } else {
      // Fallback if getText not available yet
      welcomeEl.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>Welcome, ${state.currentPlayer.name}! ${guestBadgeHtml}</h3>
          <div style="display: flex; gap: 20px; justify-content: center; margin-top: 16px; flex-wrap: wrap;">
            <div><strong>Games:</strong> ${stats.gamesPlayed}</div>
            <div><strong>High Score:</strong> ${stats.highestScore} ${deviceOnlyHtml}</div>
            <div><strong>Best Streak:</strong> ${stats.bestStreak}</div>
            <div><strong>Win Rate:</strong> ${stats.winRate}%</div>
          </div>
        </div>
      `;
    }
  }
  updatePlayerDisplayName();
}

function updatePlayerDisplayName() {
  const playerNameEl = document.getElementById('current-player-name');
  if (playerNameEl && state.currentPlayer) {
    playerNameEl.textContent = state.currentPlayer.name;
  }
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
const currentPlayerEl = document.getElementById('current-player');
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
      
      // Check if there's a room code in URL
      const roomCodeFromUrl = window.RemoteChallenge?.getRoomCodeFromUrl();
      if (roomCodeFromUrl) {
        // Auto-open join flow
        setTimeout(() => {
          showRemoteModal();
          showRemoteStep('join');
          remoteRoomCodeInput.value = roomCodeFromUrl;
        }, 500);
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
  
  // Player management
  const btnChangePlayer = document.getElementById('btn-change-player');
  if (btnChangePlayer) {
    btnChangePlayer.addEventListener('click', async ()=>{
      const newPlayer = await promptForPlayerName();
      if (newPlayer) {
        displayPlayerInfo();
        updatePlayerDisplayName();
      }
    });
  }
  
  // Mode buttons
  btnSolo.addEventListener('click', startSolo);
  btnTimed.addEventListener('click', startTimed);
  btnChallenge.addEventListener('click', startChallenge);
  btnStudy.addEventListener('click', startStudy);
  if (btnScenarios) {
    btnScenarios.addEventListener('click', startScenarios);
  }
  
  // Navigation
  btnBackToSetup.addEventListener('click', showSetup);
  btnBackFromStudy.addEventListener('click', showSetup);
  // Community moved to separate page
  
  // Game controls
  btnNext.addEventListener('click', () => {
    if (state.mode === 'scenarios') {
      nextScenarioQuestion();
    } else {
      nextQuestion();
    }
  });
  btnQuit.addEventListener('click', quitQuiz);
  btnPause.addEventListener('click', togglePause);
  
  // Study controls
  searchPerson.addEventListener('input', e=>renderPeopleList(e.target.value));
  sortSelect.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  filterMother.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  filterOccupation.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  filterAge.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  btnShuffleList.addEventListener('click', ()=>{ shuffle(state.people); renderPeopleList(searchPerson.value); });
  btnExpandAll.addEventListener('click', ()=>toggleAllDetails(true));
  btnCollapseAll.addEventListener('click', ()=>toggleAllDetails(false));
  
  // Testament and gender filters
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  if (testamentFilter) {
    testamentFilter.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  }
  if (genderFilter) {
    genderFilter.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  }
  
  // Data management
  if (btnExport) btnExport.addEventListener('click', exportJson);
  if (btnImport) btnImport.addEventListener('click', ()=>fileInput.click());
  if (btnResetData) btnResetData.addEventListener('click', resetData);
  if (fileInput) fileInput.addEventListener('change', handleImportFile);
  
  // Settings persistence
  difficultySel.addEventListener('change', saveSettingsFromUI);
  numQuestionsInput.addEventListener('change', saveSettingsFromUI);
  timeLimitInput.addEventListener('change', saveSettingsFromUI);
  
  // Language selector
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
      // Check if user is guest and dispatch event
      if (state.currentPlayer && state.currentPlayer.isGuest) {
        document.dispatchEvent(new CustomEvent('socialFeatureAttempt', {
          detail: { feature: 'Remote Challenge' }
        }));
        return;
      }
      window.RemoteChallengeUI.start();
    });
  }
  
  // Classroom Mode handler
  if (btnClassroomMode) {
    btnClassroomMode.addEventListener('click', () => {
      // Check if user wants to host or join
      const choice = confirm('Click OK to HOST (display on projector)\nClick Cancel to JOIN as a player');
      if (choice) {
        // Open host view in new tab/window
        window.open('host.html', '_blank');
      } else {
        // Show join modal
        promptClassroomJoin();
      }
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

  // Keyboard accessibility for modals (Escape key)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalEl && modalEl.style.display === 'flex') hideSummaryModal();
      if (playersModal && playersModal.style.display === 'flex') hidePlayersModal();
      if (remoteModal && remoteModal.style.display === 'flex') {
        if (window.RemoteChallengeUI && window.RemoteChallengeUI.hide) {
          window.RemoteChallengeUI.hide();
        } else {
          remoteModal.style.display = 'none';
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
  currentPlayerEl.textContent = '1';
  p1ScoreEl.textContent = '0';
  p2ScoreEl.textContent = '0';
  
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
    scoreEl.innerText = state.score;
    streakEl.innerText = state.streak;
    showToast({ title: getText('correct') || 'Correct!', msg: '', type: 'success', timeout: 1000 });
  } else {
    state.streak = 0;
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
    div.innerText = choiceObj.display;
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
    set.add(d);
    if(set.size>=4) break;
  }
  // Fallback to names if not enough
  const names = state.people.map(p=>p.name);
  while(set.size<4){
    const pick = names[Math.floor(Math.random()*names.length)];
    set.add(pick);
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
  afterRef.innerText = `${getText('wrongAnswer')}. ${getText('correctLabel')}: ${translateAnswerForQuestionType(q.type, q.answer)}. ${getText('references')}: ${(q.ref||[]).join(', ')}`;
  // Remote challenge: sync score to Firebase
    if(state.mode==='remote-challenge' && window.RemoteChallenge){
      window.RemoteChallenge.submitAnswer(state.qnum - 1, false, 0);
    }
  showToast({ title: getText('wrongAnswer'), msg: getText('wrongMsg', { answer: translateAnswerForQuestionType(q.type, q.answer) }), type: 'error', timeout: 1800 });
  }

  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;

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
    currentPlayerEl.textContent = String(state.currentPlayerIndex + 1);
    const nextName = state.players[state.currentPlayerIndex].name;
    showToast({ title: getText('challengeTurn', { player: nextName }), msg: getText('challengeTurnMsg', { player: nextName }), type: 'info', timeout: 1200 });
  }

  btnNext.disabled = false;
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
    if(state.timerSecondsRemaining <= 0){
      stopTimer();
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
function renderPeopleList(filter){
  peopleList.innerHTML='';
  let arr = state.people.filter(p=>!filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  
  // Apply existing filters
  if(filterMother?.checked) arr = arr.filter(p=>!!p.mother);
  if(filterOccupation?.checked) arr = arr.filter(p=>!!p.occupation);
  if(filterAge?.checked) arr = arr.filter(p=>!!p.age_notes);
  
  // Apply testament filter (from setup panel if available)
  const testamentFilter = document.getElementById('testament-filter');
  if (testamentFilter && testamentFilter.value !== 'all') {
    arr = arr.filter(p => p.testament === testamentFilter.value);
  }
  
  // Apply gender filter (from setup panel if available)
  const genderFilter = document.getElementById('gender-filter');
  if (genderFilter && genderFilter.value !== 'all') {
    arr = arr.filter(p => p.gender === genderFilter.value);
  }
  if(sortSelect){
    if(sortSelect.value==='name-asc') arr.sort((a,b)=>a.name.localeCompare(b.name));
    if(sortSelect.value==='name-desc') arr.sort((a,b)=>b.name.localeCompare(a.name));
  }
  if(peopleCountEl) peopleCountEl.textContent = String(arr.length);
  for(const p of arr){
    const item = document.createElement('div');
    item.className = 'person-card';
    
    // Determine icon based on occupation/role
    let icon = '👤';
    const occ = (p.occupation || '').toLowerCase();
    if(occ.includes('king') || occ.includes('queen') || occ.includes('pharaoh')) icon = '👑';
    else if(occ.includes('prophet') || occ.includes('seer')) icon = '🔮';
    else if(occ.includes('priest')) icon = '⛪';
    else if(occ.includes('apostle') || occ.includes('disciple') || occ.includes('evangelist')) icon = '✝️';
    else if(occ.includes('judge')) icon = '⚖️';
    else if(occ.includes('warrior') || occ.includes('commander')) icon = '⚔️';
    
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
  
  title.textContent = p.name;
  
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

// Theme
function applyTheme(theme){
  console.log('applyTheme called with:', theme); // Debug
  state.theme = theme;
  // Remove all theme classes first
  document.body.classList.remove('day', 'night');
  
  // Apply the new theme
  if(theme === 'day') {
    document.body.classList.add('day');
    console.log('Applied day theme'); // Debug
  } else {
    // Default to night theme - no class needed (root variables are night by default)
    theme = 'night'; // Normalize to night if invalid theme
    console.log('Applied night theme'); // Debug
  }
  
  // Update theme toggle button tooltip
  if (typeof getText === 'function') {
    const themeKey = theme === 'day' ? 'themeDay' : 'themeNight';
    const keyText = getText(themeKey) || (theme === 'day' ? 'Day' : 'Night');
    if(btnTheme) btnTheme.setAttribute('title', `Toggle theme — ${keyText}`);
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
  // Prevent background scrolling
  document.body.style.overflow = 'hidden';
  
  const total = state.results.length;
  const correct = state.results.filter(r=>r.correct).length;
  const accuracy = total ? Math.round((correct/total)*100) : 0;
  
  let headerHtml = getText('summaryStats', { score: correct, total: total, percentage: accuracy, streak: state.streak });
  
  // Add winner info for challenge modes
  if (state.mode === 'challenge' || state.mode === 'remote-challenge') {
    const [p1, p2] = state.players;
    const winnerName = p1.score > p2.score ? p1.name : (p2.score > p1.score ? p2.name : 'Tie');
    const winnerText = p1.score === p2.score ? (getText('tieGame') || 'Tie Game') : `${getText('winner') || 'Winner'}: ${winnerName}`;
    
    headerHtml = `
      <div style="margin-bottom: 16px; font-size: 1.2em; color: var(--accent); text-align: center;">
        <strong>${winnerText}</strong><br>
        <small>${p1.name}: ${p1.score} vs ${p2.name}: ${p2.score}</small>
      </div>
      ${headerHtml}
    `;
  }
  
  summaryStatsEl.innerHTML = headerHtml;
  summaryListEl.innerHTML = '';
  state.results.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'summary-item ' + (r.correct?'correct':'incorrect');
    div.innerHTML = `
      <div><strong>${getText('questionLabelShort')}:</strong> ${r.prompt}</div>
      <div><strong>${getText('yourAnswer')}:</strong> ${r.chosenDisplay}</div>
      <div><strong>${getText('correctLabel')}:</strong> ${r.correctDisplay}</div>
      <div class="ref"><strong>${getText('references')}:</strong> ${(r.ref||[]).join(', ')}</div>
      ${r.explanation ? `<div class="summary-explanation" style="margin-top:8px; font-style:italic; color:var(--text-2);">${r.explanation}</div>` : ''}
    `;
    summaryListEl.appendChild(div);
  });
  modalEl.style.display = 'flex';
}

function hideSummaryModal(){
  if(modalEl) modalEl.style.display = 'none';
  // Restore background scrolling
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

  // Open Modal
  const openFeedback = () => {
    console.log('[Feedback] Opening feedback modal...');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.classList.add('modal-open'); // Prevent body scroll
    // Reset form
    selectedRating = 0;
    ratingBtns.forEach(b => b.classList.remove('selected'));
    const msgEl = document.getElementById('feedback-message');
    if (msgEl) msgEl.value = '';
    
    // Reset new selects
    const selects = ['rating-modes', 'rating-accuracy', 'rating-scenarios'];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.selectedIndex = 0;
    });
  };

  // Attach to button if it exists now
  const btnOpen = document.getElementById('btn-feedback');
  console.log('[Feedback] Button element found:', btnOpen);
  
  if(btnOpen && !btnOpen._feedbackInitialized) {
    // Remove any existing listeners first
    const newBtn = btnOpen.cloneNode(true);
    btnOpen.parentNode.replaceChild(newBtn, btnOpen);
    
    // Add both touch and click handlers for maximum compatibility
    newBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Feedback] TOUCHEND - opening modal');
      openFeedback();
    }, { passive: false });
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Feedback] CLICK - opening modal');
      openFeedback();
    });
    
    // Also try direct onclick as absolute fallback
    newBtn.onclick = function() {
      openFeedback();
    };
    
    // Mark as initialized
    newBtn._feedbackInitialized = true;
    console.log('[Feedback] Event handlers attached successfully');
  } else if (!btnOpen) {
    console.error('[Feedback] Button not found in DOM!');
  } else {
    console.log('[Feedback] Button already initialized');
  }

  // Close Modal
  const close = () => {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open'); // Restore body scroll
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300); // Wait for animation
  };
  if(btnClose) btnClose.addEventListener('click', close);
  if(btnCancel) btnCancel.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Rating Selection
  ratingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating);
      ratingBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Submit
  if(btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      const message = document.getElementById('feedback-message').value.trim();
      const experience = document.getElementById('feedback-experience')?.value.trim();
      
      const ratingModes = document.getElementById('rating-modes')?.value;
      const ratingAccuracy = document.getElementById('rating-accuracy')?.value;
      const ratingScenarios = document.getElementById('rating-scenarios')?.value;
      const ratingOnline = document.getElementById('rating-online')?.value;

      if (!message && !experience && selectedRating === 0 && !ratingModes && !ratingAccuracy && !ratingScenarios && !ratingOnline) {
        showToast({ title: getText('feedback'), msg: getText('feedbackPrompt'), type: 'warn' });
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = getText('sendingFeedback');

      const feedbackData = {
        rating: selectedRating,
        experience: experience || null,
        ratingModes: ratingModes || null,
        ratingAccuracy: ratingAccuracy || null,
        ratingScenarios: ratingScenarios || null,
        ratingOnline: ratingOnline || null,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      try {
        if (typeof database !== 'undefined' && database) {
          await database.ref('feedback').push(feedbackData);
          showToast({ title: getText('thankYou'), msg: getText('feedbackReceived'), type: 'success' });
          // Mark as given so we don't prompt again automatically
          localStorage.setItem('who-bible-feedback-prompted', 'true');
        } else {
          // Fallback if Firebase not loaded
          console.log('Feedback (simulated):', feedbackData);
          showToast({ title: getText('thankYou'), msg: getText('feedbackSimulated'), type: 'success' });
        }
        close();
      } catch (error) {
        console.error('Feedback error:', error);
        showToast({ title: getText('feedbackError'), msg: getText('feedbackErrorMsg'), type: 'error' });
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = getText('sendFeedback');
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
function promptClassroomJoin() {
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
  pinInput.value = '';
  
  modal.style.display = 'flex';
  setTimeout(() => { pinInput.focus(); }, 100);
  
  // Handle Save button click
  const handleSave = () => {
    const code = pinInput.value.trim();
    const name = nameInput.value.trim() || 'Player';
    
    if (!code) {
      showToast({ title: 'Error', msg: 'Please enter a Game PIN', type: 'error' });
      pinInput.focus();
      return;
    }
    
    // Validate room code
    if (window.SecurityModule) {
      const codeValidation = window.SecurityModule.validateRoomCode(code);
      if (!codeValidation.valid) {
        showToast({ title: 'Error', msg: codeValidation.error, type: 'error' });
        return;
      }
    }
    
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
      
      modal.style.display = 'none';
      showToast({ title: 'Success!', msg: `Joined as ${sanitizedName}. Follow instructions on screen!`, type: 'success', timeout: 8000 });
      
      // Listen for game state
      startClassroomPlayerMode(sanitizedCode, playerId, roomRef);
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
    startClassroomPlayerMode(sanitizedCode, playerId, roomRef);
  }).catch(error => {
    showToast({ title: 'Error', msg: 'Failed to join: ' + error.message, type: 'error' });
  });
}

// Classroom Player Mode
function startClassroomPlayerMode(roomCode, playerId, roomRef) {
  // Hide setup, show game area with modified UI
  setupPanel.style.display = 'none';
  gameArea.style.display = 'block';
  
  document.getElementById('game-title').textContent = `Room: ${roomCode}`;
  
  // Listen for current question
  roomRef.child('currentQuestion').on('value', (snapshot) => {
    const questionIndex = snapshot.val();
    if (questionIndex !== null && questionIndex >= 0) {
      loadClassroomQuestion(roomRef, questionIndex, playerId);
    }
  });
  
  // Listen for status
  roomRef.child('status').on('value', (snapshot) => {
    const status = snapshot.val();
    if (status === 'finished') {
      showToast({ title: 'Quiz Complete!', msg: 'Thanks for playing!', type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  });
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
  
  question.options.forEach((option, i) => {
    const btn = document.createElement('button');
    btn.className = 'ans classroom-answer';
    btn.style.borderLeft = `6px solid ${colors[i]}`;
    btn.innerHTML = `
      <span style="font-size: 32px; margin-right: 12px;">${icons[i]}</span>
      <span style="font-size: 20px; font-weight: 700;">${option}</span>
    `;
    
    btn.addEventListener('click', () => {
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
      showClassroomWaiting();
    });
    
    answersEl.appendChild(btn);
  });
  
  // Record question start time
  roomRef.child('questionStartTime').once('value').then(snapshot => {
    state.questionStartTime = snapshot.val();
  });
}

// Show waiting screen for classroom player
function showClassroomWaiting() {
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; background: rgba(76, 175, 80, 0.1); border-radius: 16px;">
      <div style="font-size: 64px; margin-bottom: 20px;">✓</div>
      <h2 style="font-size: 32px; margin-bottom: 12px;">Answer Submitted!</h2>
      <p style="font-size: 20px; color: var(--text-muted);">Waiting for other players...</p>
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  init();
}
