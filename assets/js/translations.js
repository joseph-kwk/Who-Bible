// Default English fallback so UI works even if JSON fetch fails (e.g., file://)
const DEFAULT_EN = {
  brandTitle: "Who-Bible",
  brandDesc: "Bible people quiz: deeds, ages, mothers, roles, and events — with refs.",
  gameSettings: "Game Settings",
  difficulty: "Difficulty",
  difficultyEasy: "Beginner",
  difficultyMedium: "Intermediate",
  difficultyHard: "Expert",
  numQuestions: "Number of Questions",
  timeLimit: "Time Limit (seconds)",
  gameModes: "Game Modes",
  soloMode: "Solo Mode",
  soloDesc: "Practice at your own pace",
  timedMode: "Timed Mode",
  timedDesc: "Race against the clock",
  challengeMode: "Challenge Mode",
  challengeDesc: "Two players compete",
  studyMode: "Study Mode",
  studyDesc: "Browse and learn",
  dataManagement: "Data Management",
  exportJSON: "Export JSON",
  importJSON: "Import JSON",
  resetData: "Reset Data",
  backToSetup: "← Back to Setup",
  score: "Score",
  streak: "Streak",
  question: "Question",
  time: "Time",
  player: "Player",
  next: "Next",
  pause: "Pause",
  quit: "Quit",
  welcomeMessage: "Click a mode button to start your quiz!",
  backFromStudy: "← Back to Setup",
  studyTitle: "Study Mode",
  searchPlaceholder: "Search people (e.g. Moses)",
  shuffleList: "Shuffle",
  sortBy: "Sort by:",
  sortNameAsc: "Name (A–Z)",
  sortNameDesc: "Name (Z–A)",
  filters: "Filters:",
  filterMother: "Mother",
  filterOccupation: "Occupation",
  filterAge: "Age notes",
  people: "People",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  challengeTitle: "Challenge Mode Setup",
  player1Name: "Player 1 Name",
  player2Name: "Player 2 Name",
  startChallenge: "Start Challenge",
  cancel: "Cancel",
  soloStart: "Solo Mode",
  soloStartMsg: "Answer at your own pace. Good luck!",
  timedStart: "Timed Mode",
  timedStartMsg: "Race against the clock! Time is ticking...",
  challengeStart: "Challenge Mode",
  challengeStartMsg: "Two players will compete! Good luck to both!",
  studyStart: "Study Mode",
  studyStartMsg: "Browse and learn about Bible people at your own pace.",
  correctAnswer: "Correct!",
  correctMsg: "Great job! +1 point",
  wrongAnswer: "Incorrect!",
  wrongMsg: "The correct answer was: {answer}",
  timeWarning: "Time Warning",
  timeWarningMsg: "Only {time} seconds remaining!",
  timeUp: "Time's Up!",
  timeUpMsg: "Quiz completed!",
  challengeTurn: "Player {player}'s Turn",
  challengeTurnMsg: "It's {player}'s turn to answer!",
  exportSuccess: "Export Successful",
  exportMsg: "Data exported to clipboard",
  importSuccess: "Import Successful",
  importMsg: "Data imported successfully",
  resetSuccess: "Reset Successful",
  resetMsg: "All data has been reset",
  importError: "Import Error",
  importErrorMsg: "Invalid JSON format. Please check your data.",
  summaryTitle: "Quiz Summary",
  summaryStats: "Final Score: {score}/{total} ({percentage}%) | Streak: {streak}",
  summaryCorrect: "Correct Answers",
  summaryIncorrect: "Incorrect Answers",
  toggleTheme: "Toggle theme",
  close: "Close",
  playAgain: "Play Again",
  resume: "Resume",
  paused: "Paused",
  resumed: "Resumed",
  timerPaused: "Timer paused.",
  timerRunning: "Timer running.",
  references: "References",
  yourAnswer: "Your answer",
  correctLabel: "Correct",
  questionLabelShort: "Q",
  aliases: "Aliases",
  events: "Events",
  verses: "Verses",
  answersLabel: "Answer choices",
  language: "Language",
  english: "English",
  french: "Français",
  spanish: "Español",
  questionWhoDid: "Who is known for: {event}?",
  questionWhoMother: "Who was the mother of {name}?",
  questionOccupation: "What was {name}'s occupation or role?",
  questionAge: "Which age-note is correct for {name}?",
  questionEvent: "Which person is linked to: {event}?",
  fallbackEvent: "a notable event",
  resetConfirm: "Reset to built-in dataset? This will remove your saved data.",
  quizComplete: "Quiz complete",
  yourScore: "Your score",
  winner: "Winner",
  tieGame: "Tie game",
  community: "Community",
  share: "Share",
  communityIntro: "Explore rooms, join live quizzes, and manage your profile.",
  communityTabExplore: "Explore",
  communityTabLive: "Live",
  communityTabProfile: "Profile",
  communityTabGuidelines: "Guidelines",
  featuredRooms: "Featured Rooms",
  liveRooms: "Live Rooms",
  liveRoomsDesc: "Join a live room to play and chat in real time. Coming soon.",
  profileTitle: "Your Profile",
  profileDesc: "Create an avatar and set your display name. Coming soon.",
  guidelines: "Guidelines",
  guideline1: "Be respectful and kind.",
  guideline2: "Stay on topic and avoid spoilers without warning.",
  guideline3: "Report inappropriate content.",
  profileNameLabel: "Display name",
  profileNamePlaceholder: "Your name",
  generateAvatar: "Generate Avatar",
  saveProfile: "Save Profile",
  profileSaved: "Profile saved",
  details: "Details",
  hostRoomTitle: "Host a Room",
  roomNamePlaceholder: "Room name",
  createRoom: "Create Room",
  myRoomsTitle: "My Rooms",
  noRoomsYet: "No rooms yet",
  hostLabel: "Host",
  roomCreatedBy: "Room created by {host}."
};

// Externalized translations loaded at runtime (seed English with fallback)
const TRANSLATIONS = { en: { ...DEFAULT_EN }, fr: {}, es: {} };

// Load language bundles
async function loadLanguageBundle(lang) {
  try {
    const res = await fetch(`assets/i18n/${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
  const json = await res.json();
  // Merge over any existing fallback (esp. English)
  TRANSLATIONS[lang] = { ...(TRANSLATIONS[lang]||{}), ...json };
  } catch (e) {
    // If fetch fails, keep existing in-memory or empty; UI will fall back to keys
    console.warn('i18n load failed for', lang, e);
  }
}

// Language management functions
let currentLanguage = 'en';

function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem('who-bible-language', lang);
  // Immediate refresh using whatever we have (falls back to English)
  updateAllText();
  // Notify any page-level handler that cares about raw-token re-localization
  try{ if (window && typeof window.onWhoBibleLanguageChange === 'function') window.onWhoBibleLanguageChange(lang); }catch(_){ }
  const sel = document.getElementById('language-select');
  if (sel) sel.value = lang;
  // Lazy-load the bundle and refresh again when it arrives
  // (covers community.html which doesn't have app.js handlers)
  loadLanguageBundle(lang).then(() => {
    // Only re-render if the user hasn't switched again meanwhile
    if (localStorage.getItem('who-bible-language') === lang) {
      updateAllText();
    }
  });
  }
}

function getText(key, params = {}) {
  let text = TRANSLATIONS[currentLanguage][key] || TRANSLATIONS['en'][key] || key;
  
  // Replace parameters in the text
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

function updateAllText() {
  // Set document language attribute
  if (document && document.documentElement) {
    document.documentElement.lang = currentLanguage;
  }
  // Update brand
  const brandTitle = document.querySelector('.brand-title');
  const brandDesc = document.querySelector('.brand-desc');
  if (brandTitle) brandTitle.textContent = getText('brandTitle');
  if (brandDesc) brandDesc.textContent = getText('brandDesc');
  // Header title/desc in header section
  const headerTitle = document.querySelector('header .title-section h1');
  const headerDesc = document.querySelector('header .title-section .muted');
  if (headerTitle) headerTitle.textContent = getText('brandTitle');
  if (headerDesc) headerDesc.textContent = getText('brandDesc');
  
  // Update setup panel
  const setupSections = document.querySelectorAll('.setup-section h3');
  setupSections.forEach(section => {
    const text = section.textContent.toLowerCase();
    if (text.includes('game settings') || text.includes('paramètres') || text.includes('configuración')) {
      section.textContent = getText('gameSettings');
    } else if (text.includes('game modes') || text.includes('modes de jeu') || text.includes('modos de juego')) {
      section.textContent = getText('gameModes');
    } else if (text.includes('data management') || text.includes('gestion des données') || text.includes('gestión de datos')) {
      section.textContent = getText('dataManagement');
    }
  });
  
  // Update labels
  const labels = document.querySelectorAll('label');
  labels.forEach(label => {
    const text = label.textContent.toLowerCase();
    if (text.includes('difficulty') || text.includes('difficulté') || text.includes('dificultad')) {
      label.textContent = getText('difficulty');
    } else if (text.includes('number of questions') || text.includes('nombre de questions') || text.includes('número de preguntas')) {
      label.textContent = getText('numQuestions');
    } else if (text.includes('time limit') || text.includes('limite de temps') || text.includes('límite de tiempo')) {
      label.textContent = getText('timeLimit');
    } else if (text.includes('sort by') || text.includes('trier par') || text.includes('ordenar por')) {
      label.textContent = getText('sortBy');
    } else if (text.includes('filters') || text.includes('filtres') || text.includes('filtros')) {
      label.textContent = getText('filters');
    } else if (text.includes('language') || text.includes('langue') || text.includes('idioma')) {
      label.textContent = getText('language');
    }
  });
  
  // Update mode buttons
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    const title = btn.querySelector('.mode-title');
    const desc = btn.querySelector('.mode-desc');
    if (title && desc) {
      const icon = btn.querySelector('.mode-icon').textContent;
      if (icon === '📚') {
        title.textContent = getText('soloMode');
        desc.textContent = getText('soloDesc');
      } else if (icon === '⏱️') {
        title.textContent = getText('timedMode');
        desc.textContent = getText('timedDesc');
      } else if (icon === '⚔️') {
        title.textContent = getText('challengeMode');
        desc.textContent = getText('challengeDesc');
      } else if (icon === '🔍') {
        title.textContent = getText('studyMode');
        desc.textContent = getText('studyDesc');
      }
    }
  });
  
  // Update buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    const text = btn.textContent.toLowerCase();
    if (text.includes('export json') || text.includes('exporter json') || text.includes('exportar json')) {
      btn.textContent = getText('exportJSON');
    } else if (text.includes('import json') || text.includes('importer json') || text.includes('importar json')) {
      btn.textContent = getText('importJSON');
    } else if (text.includes('reset data') || text.includes('réinitialiser') || text.includes('restablecer')) {
      btn.textContent = getText('resetData');
    } else if (text.includes('shuffle') || text.includes('mélanger') || text.includes('mezclar')) {
      btn.textContent = getText('shuffleList');
    } else if (text.includes('expand all') || text.includes('tout développer') || text.includes('expandir todo')) {
      btn.textContent = getText('expandAll');
    } else if (text.includes('collapse all') || text.includes('tout réduire') || text.includes('contraer todo')) {
      btn.textContent = getText('collapseAll');
    } else if (text.includes('next') || text.includes('suivant') || text.includes('siguiente')) {
      btn.textContent = getText('next');
    } else if (text.includes('pause') || text.includes('pause') || text.includes('pausa')) {
      btn.textContent = getText('pause');
    } else if (text.includes('quit') || text.includes('quitter') || text.includes('salir')) {
      btn.textContent = getText('quit');
    } else if (text.includes('close') || text.includes('fermer') || text.includes('cerrar')) {
      btn.textContent = getText('close');
    } else if (text.includes('cancel') || text.includes('annuler') || text.includes('cancelar')) {
      btn.textContent = getText('cancel');
    }
  });
  
  // Update placeholders
  const searchInput = document.getElementById('search-person');
  if (searchInput) {
    searchInput.placeholder = getText('searchPlaceholder');
  }
  // Update ARIA labels
  const answersList = document.getElementById('answers');
  if (answersList) answersList.setAttribute('aria-label', getText('answersLabel'));
  
  // Update welcome message
  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) {
    const p = welcomeMsg.querySelector('p');
    if (p) p.textContent = getText('welcomeMessage');
  }
  
  // Update titles
  const gameTitle = document.getElementById('game-title');
  const studyTitle = document.querySelector('.study-title');
  if (gameTitle && gameTitle.textContent.includes('Game Mode')) {
    gameTitle.textContent = getText('gameModes');
  }
  if (gameTitle) {
    const t = gameTitle.textContent.toLowerCase();
    if (t.includes('solo') || t.includes('solo')) gameTitle.textContent = getText('soloMode');
    else if (t.includes('timed') || t.includes('chronom')) gameTitle.textContent = getText('timedMode');
    else if (t.includes('challenge') || t.includes('défi') || t.includes('desafío')) gameTitle.textContent = getText('challengeMode');
  }
  if (studyTitle) {
    studyTitle.textContent = getText('studyTitle');
  }
  
  // Update back buttons
  const backButtons = document.querySelectorAll('.back-btn');
  backButtons.forEach(btn => {
    if (btn.textContent.includes('Back to Setup')) {
      btn.textContent = getText('backToSetup');
    } else if (btn.textContent.includes('Back from Study')) {
      btn.textContent = getText('backFromStudy');
    }
  });
  
  // Update status text (explicit elements)
  const scoreLabelEl = document.querySelector('.status .small:nth-child(1)');
  if (scoreLabelEl) scoreLabelEl.innerHTML = `${getText('score')}: <span id="score">${document.getElementById('score')?.textContent||'0'}</span>`;
  const streakLabelEl = document.querySelector('.status .small:nth-child(2)');
  if (streakLabelEl) streakLabelEl.innerHTML = `${getText('streak')}: <span id="streak">${document.getElementById('streak')?.textContent||'0'}</span>`;
  const qLabelEl = document.querySelector('.status .small:nth-child(3)');
  if (qLabelEl) {
    const qnum = document.getElementById('qnum')?.textContent || '0';
    const qtotal = document.getElementById('qtotal')?.textContent || document.getElementById('num-questions')?.value || '0';
    qLabelEl.innerHTML = `${getText('question')}: <span id="qnum">${qnum}</span>/<span id="qtotal">${qtotal}</span>`;
  }
  const timerLabelEl = document.getElementById('timer');
  if (timerLabelEl) {
    const t = document.getElementById('time-remaining')?.textContent || '0';
    timerLabelEl.innerHTML = `${getText('time')}: <span id="time-remaining">${t}</span>s`;
  }
  const challengePlayerLabel = document.querySelector('#challenge-status .small:nth-child(1)');
  if (challengePlayerLabel) {
    const cp = document.getElementById('current-player')?.textContent || '1';
    challengePlayerLabel.innerHTML = `${getText('player')}: <span id="current-player">${cp}</span>`;
  }
  
  // Update people count
  const peopleCount = document.getElementById('people-count');
  if (peopleCount) {
    const parent = peopleCount.parentElement;
    if (parent) {
      parent.innerHTML = parent.innerHTML.replace('People:', getText('people') + ':');
    }
  }
  
  // Update filter chips
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    const text = chip.textContent.toLowerCase();
    if (text.includes('mother') || text.includes('mère') || text.includes('madre')) {
      chip.innerHTML = chip.innerHTML.replace(/Mother|Mère|Madre/, getText('filterMother'));
    } else if (text.includes('occupation') || text.includes('occupation') || text.includes('ocupación')) {
      chip.innerHTML = chip.innerHTML.replace(/Occupation|Occupation|Ocupación/, getText('filterOccupation'));
    } else if (text.includes('age notes') || text.includes('notes d\'âge') || text.includes('notas de edad')) {
      chip.innerHTML = chip.innerHTML.replace(/Age notes|Notes d'âge|Notas de edad/, getText('filterAge'));
    }
  });
  
  // Update select options
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    if (select.id === 'difficulty') {
      const options = select.querySelectorAll('option');
      options[0].textContent = getText('difficultyEasy');
      options[1].textContent = getText('difficultyMedium');
      options[2].textContent = getText('difficultyHard');
    } else if (select.id === 'sort-select') {
      const options = select.querySelectorAll('option');
      options[0].textContent = getText('sortNameAsc');
      options[1].textContent = getText('sortNameDesc');
    }
  });
  
  // Update modal elements
  const summaryModalTitle = document.getElementById('summary-modal-title');
  if (summaryModalTitle) summaryModalTitle.textContent = getText('summaryTitle');
  
  const challengeModalTitle = document.getElementById('challenge-modal-title');
  if (challengeModalTitle) challengeModalTitle.textContent = getText('challengeTitle');
  
  const p1NameLabel = document.getElementById('p1-name-label');
  if (p1NameLabel) p1NameLabel.textContent = getText('player1Name');
  
  const p2NameLabel = document.getElementById('p2-name-label');
  if (p2NameLabel) p2NameLabel.textContent = getText('player2Name');

  const btnPlayersCancel = document.getElementById('btn-players-cancel');
  if (btnPlayersCancel) btnPlayersCancel.textContent = getText('cancel');
  const btnPlayersStart = document.getElementById('btn-players-start');
  if (btnPlayersStart) btnPlayersStart.textContent = getText('startChallenge');
  const btnSummaryClose = document.getElementById('btn-summary-close');
  if (btnSummaryClose) btnSummaryClose.setAttribute('aria-label', getText('close'));
  const btnPlayAgain = document.getElementById('btn-play-again');
  if (btnPlayAgain) btnPlayAgain.textContent = getText('playAgain');
  
  // Update theme toggle title
  const themeToggle = document.getElementById('btn-theme');
  if (themeToggle && themeToggle.getAttribute('data-title-key')) {
    themeToggle.title = getText('toggleTheme');
  }
  const shuffleBtn = document.getElementById('btn-shuffle-list');
  if (shuffleBtn) shuffleBtn.title = getText('shuffleList');

  // Nav items (use English fallback keys if missing)
  const navCommunity = document.getElementById('nav-community');
  if (navCommunity) {
  navCommunity.textContent = getText('community') || 'Community';
  }
  const footerCommunity = document.getElementById('footer-community');
  if (footerCommunity) {
  footerCommunity.textContent = getText('community') || 'Community';
  }
  const btnShare = document.getElementById('btn-share');
  if (btnShare) {
    btnShare.title = getText('share') || 'Share';
    btnShare.setAttribute('aria-label', getText('share') || 'Share');
  }

  // Update language selector option text
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    const opts = languageSelect.querySelectorAll('option');
    opts.forEach(opt => {
      if (opt.value === 'en') opt.textContent = getText('english');
      if (opt.value === 'fr') opt.textContent = getText('french');
      if (opt.value === 'es') opt.textContent = getText('spanish');
    });
  }

  // Modal close aria-labels
  const playersClose = document.getElementById('btn-players-close');
  if (playersClose) playersClose.setAttribute('aria-label', getText('close'));

  // Community panel
  const communityTitle = document.getElementById('community-title');
  if (communityTitle) communityTitle.textContent = getText('community');
  const btnBackFromCommunity = document.getElementById('btn-back-from-community');
  if (btnBackFromCommunity) btnBackFromCommunity.textContent = getText('backToSetup');
  const communityIntro = document.getElementById('community-intro');
  if (communityIntro) communityIntro.textContent = getText('communityIntro');
  const tabExplore = document.getElementById('tab-explore');
  if (tabExplore) tabExplore.textContent = getText('communityTabExplore');
  const tabLive = document.getElementById('tab-live');
  if (tabLive) tabLive.textContent = getText('communityTabLive');
  const tabProfile = document.getElementById('tab-profile');
  if (tabProfile) tabProfile.textContent = getText('communityTabProfile');
  const tabGuidelines = document.getElementById('tab-guidelines');
  if (tabGuidelines) tabGuidelines.textContent = getText('communityTabGuidelines');
  const featuredRoomsTitle = document.getElementById('featured-rooms-title');
  if (featuredRoomsTitle) featuredRoomsTitle.textContent = getText('featuredRooms');
  const liveRoomsTitle = document.getElementById('live-rooms-title');
  if (liveRoomsTitle) liveRoomsTitle.textContent = getText('liveRooms');
  const liveRoomsDesc = document.getElementById('live-rooms-desc');
  if (liveRoomsDesc) liveRoomsDesc.textContent = getText('liveRoomsDesc');
  const hostRoomTitle = document.getElementById('host-room-title');
  if (hostRoomTitle) hostRoomTitle.textContent = getText('hostRoomTitle') || 'Host a Room';
  const roomNameInput = document.getElementById('room-name');
  if (roomNameInput) roomNameInput.placeholder = getText('roomNamePlaceholder') || 'Room name';
  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) btnCreateRoom.textContent = getText('createRoom') || 'Create Room';
  const myRoomsTitle = document.getElementById('my-rooms-title');
  if (myRoomsTitle) myRoomsTitle.textContent = getText('myRoomsTitle') || 'My Rooms';
  // Card action buttons get updated dynamically on render; text is set via getText in app.js
  const profileTitle = document.getElementById('profile-title');
  if (profileTitle) profileTitle.textContent = getText('profileTitle');
  const profileNameLabel = document.getElementById('profile-name-label');
  if (profileNameLabel) profileNameLabel.textContent = getText('profileNameLabel');
  const displayNameInput = document.getElementById('display-name');
  if (displayNameInput) displayNameInput.placeholder = getText('profileNamePlaceholder');
  const btnGenAvatar = document.getElementById('btn-generate-avatar');
  if (btnGenAvatar) btnGenAvatar.textContent = getText('generateAvatar');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  if (btnSaveProfile) btnSaveProfile.textContent = getText('saveProfile');
  const guidelinesTitle = document.getElementById('guidelines-title');
  if (guidelinesTitle) guidelinesTitle.textContent = getText('guidelines');
  const guidelinesList = document.getElementById('guidelines-list');
  if (guidelinesList) {
    // Simple localized items if available
    const items = [getText('guideline1'), getText('guideline2'), getText('guideline3')];
    guidelinesList.innerHTML = items.map(t=>`<li>${t}</li>`).join('');
  }

    // Community panel is now on community.html; localization for that page will run there too
  
  } // <-- Close updateAllText function

// Attach a generic language selector handler (helps pages without app.js wiring)
(() => {
  function wireLanguageSelector(){
    const sel = document.getElementById('language-select');
    if (!sel || sel.dataset.wbLangWired === '1') return;
    // Set current value from storage
    const saved = localStorage.getItem('who-bible-language') || 'en';
    try { sel.value = saved; } catch(_) {}
    sel.addEventListener('change', (e)=>{
      const lang = e.target.value;
      setLanguage(lang);
    });
    sel.dataset.wbLangWired = '1';
  }
  // Run on DOM ready and also attempt once immediately (defer script usually runs after DOM anyway)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireLanguageSelector, { once: true });
  } else {
    wireLanguageSelector();
  }
  // Opportunistically prefetch other bundles so switches feel instant
  ['fr','es'].forEach((lng)=>{ if (lng !== 'en') loadLanguageBundle(lng); });
})();

