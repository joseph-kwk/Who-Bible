// Bible People Challenge — structured app.js

// =========================
// Default dataset
// =========================
const DEFAULT_PEOPLE_DATA = [
  {name: 'Noah', aliases: [], mother: null, occupation: 'Righteous man, built the ark', age_notes: null, notable_events: ['Built the ark','Survived the flood'], verses: ['Genesis 6-9'], short_bio: 'Noah built the ark to survive the flood.'},
  {name: 'Moses', aliases: [], mother: 'Jochebed', occupation: 'Leader, prophet', age_notes: 'Died at 120; 80 when confronting Pharaoh', notable_events: ['Led Exodus','Saw burning bush'], verses: ['Exodus 3','Deuteronomy 34:7','Exodus 7:7'], short_bio: 'Moses led the Israelites out of Egypt.'},
  {name: 'Solomon', aliases: [], mother: 'Bathsheba', occupation: 'King', age_notes: null, notable_events: ['Built the temple','Known for wisdom'], verses: ['1 Kings 3','2 Samuel 12:24'], short_bio: 'Son of David and Bathsheba; famed for wisdom.'},
  {name: 'Joseph (son of Jacob)', aliases: ['Joseph of Egypt'], mother: 'Rachel', occupation: 'Official in Egypt', age_notes: 'Sold by brothers at 17', notable_events: ['Sold into Egypt','Interpreted dreams'], verses: ['Genesis 37:2','Genesis 41'], short_bio: 'Joseph was sold into Egypt and rose to power.'},
  {name: 'David', aliases: [], mother: null, occupation: 'Shepherd, King', age_notes: null, notable_events: ['Killed Goliath','Became king'], verses: ['1 Samuel 17','2 Samuel'], short_bio: 'Shepherd who became king of Israel; famous for defeating Goliath.'},
  {name: 'Esther', aliases: [], mother: null, occupation: 'Queen', age_notes: null, notable_events: ['Became queen and saved her people'], verses: ['Esther'], short_bio: 'Jewish queen of Persia who saved her people.'},
  {name: 'Mary (mother of Jesus)', aliases: [], mother: null, occupation: null, age_notes: null, notable_events: ['Mother of Jesus'], verses: ['Luke 1'], short_bio: 'Mother of Jesus.'},
  {name: 'John the Baptist', aliases: [], mother: 'Elizabeth', occupation: 'Prophet', age_notes: null, notable_events: ['Baptized Jesus'], verses: ['Luke 1','Matthew 3'], short_bio: 'Prophet who baptized Jesus.'},
  {name: 'Paul', aliases: ['Saul'], mother: null, occupation: 'Apostle', age_notes: null, notable_events: ['Converted on road to Damascus'], verses: ['Acts 9'], short_bio: 'Originally named Saul; became Apostle Paul after conversion.'},
  {name: 'Peter', aliases: ['Simon Peter','Simon'], mother: null, occupation: 'Disciple, Apostle', age_notes: null, notable_events: ['Denial of Jesus','Leader of early church'], verses: ['John 1:42','Matthew 16:18'], short_bio: 'One of Jesus\'s closest disciples; called Peter.'},
  {name: 'Lazarus', aliases: [], mother: null, occupation: null, age_notes: null, notable_events: ['Raised from the dead by Jesus'], verses: ['John 11'], short_bio: 'Brother of Mary and Martha; raised from the dead.'},
  {name: 'Abraham', aliases: ['Abram'], mother: null, occupation: null, age_notes: 'Died at 175', notable_events: ['Father of Isaac','Covenant with God'], verses: ['Genesis 17','Genesis 25:7'], short_bio: 'Father of the Israelite nation.'},
  {name: 'Isaac', aliases: [], mother: 'Sarah', occupation: null, age_notes: 'Died at 180', notable_events: ['Son of Abraham and Sarah'], verses: ['Genesis 35:28'], short_bio: 'Son of Abraham and Sarah; father of Jacob.'},
  {name: 'Jacob', aliases: ['Israel'], mother: 'Rebekah', occupation: null, age_notes: 'Died at 147', notable_events: ['Renamed Israel','Father of the 12 tribes'], verses: ['Genesis 35:28','Genesis 47:28'], short_bio: 'Father of the 12 tribes of Israel.'},
  {name: 'Samuel', aliases: [], mother: 'Hannah', occupation: 'Prophet, Judge', age_notes: null, notable_events: ['Anointed Saul and David'], verses: ['1 Samuel'], short_bio: 'Prophet and judge who anointed Israel\'s first kings.'},
  {name: 'Elijah', aliases: [], mother: null, occupation: 'Prophet', age_notes: null, notable_events: ['Taken up by chariot of fire'], verses: ['2 Kings 2'], short_bio: 'Great prophet who was taken to heaven in a chariot.'},
  {name: 'Jonah', aliases: [], mother: null, occupation: 'Prophet', age_notes: null, notable_events: ['Swallowed by fish'], verses: ['Jonah'], short_bio: 'Prophet who fled God and was swallowed by a great fish.'},
  {name: 'Ruth', aliases: [], mother: null, occupation: null, age_notes: null, notable_events: ['Ancestor of David','Married Boaz'], verses: ['Ruth'], short_bio: 'Moabite woman who became ancestor to King David.'},
  {name: 'Mary Magdalene', aliases: [], mother: null, occupation: null, age_notes: null, notable_events: ['Witnessed resurrection'], verses: ['Matthew 28'], short_bio: 'Witness of Jesus\'s resurrection.'},
  {name: 'Saul (first king)', aliases: [], mother: null, occupation: 'King', age_notes: null, notable_events: ['First king of Israel'], verses: ['1 Samuel 9-10'], short_bio: 'Israel\'s first king anointed by Samuel.'}
];

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
  theme: 'dark'
};

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
const btnStudy = document.getElementById('btn-study');
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
const timeRemainingEl = document.getElementById('time-remaining');
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

function translateAnswerForQuestionType(qType, value){
  if(qType==='occupation') return translateOccupation(value);
  if(qType==='age') return translateEvent(value);
  return value; // names and mothers remain as-is
}

// =========================
// Init
// =========================
init();

function init(){
  // Set default settings if not present
  const defaultSettings = {
    difficulty: 'medium',
    numQuestions: 10,
    timeLimit: 60,
    theme: 'dark',
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
  applyTheme(savedSettings.theme || defaultSettings.theme);
  // Set language
  const savedLang = localStorage.getItem('who-bible-language');
  if (savedLang && TRANSLATIONS[savedLang] !== undefined) {
    setLanguage(savedLang);
  } else if(savedSettings.language && TRANSLATIONS[savedSettings.language] !== undefined) {
    setLanguage(savedSettings.language);
  } else {
    setLanguage(defaultSettings.language);
  }
  state.people = loadPeopleDataFromLocalStorage() || DEFAULT_PEOPLE_DATA.slice();
  renderPeopleList();
  attachHandlers();
  // Footer year
  const fy = document.getElementById('footer-year');
  if (fy) fy.textContent = String(new Date().getFullYear());
  // Welcome toast
  showToast({ title: getText('brandTitle'), msg: getText('welcomeMessage'), type: 'info', timeout: 4000 });
}

function attachHandlers(){
  // Home link handler
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e)=>{ e.preventDefault(); showSetup(); });
  }
  
  // Mode buttons
  btnSolo.addEventListener('click', startSolo);
  btnTimed.addEventListener('click', startTimed);
  btnChallenge.addEventListener('click', startChallenge);
  btnStudy.addEventListener('click', startStudy);
  
  // Navigation
  btnBackToSetup.addEventListener('click', showSetup);
  btnBackFromStudy.addEventListener('click', showSetup);
  // Community moved to separate page
  
  // Game controls
  btnNext.addEventListener('click', nextQuestion);
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
  
  // Data management
  btnExport.addEventListener('click', exportJson);
  btnImport.addEventListener('click', ()=>fileInput.click());
  btnResetData.addEventListener('click', resetData);
  fileInput.addEventListener('change', handleImportFile);
  
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
  
  // Theme toggle: cycle through themes for richer choices
  btnTheme.addEventListener('click', ()=>{
    const THEMES = ['dark','light','sepia','high-contrast'];
    const idx = THEMES.indexOf(state.theme||'dark');
    const next = THEMES[(idx+1) % THEMES.length];
    applyTheme(next);
    saveSettingsFromUI();
  });
  // Theme selector (dropdown)
  const themeSelect = document.getElementById('theme-select');
  if(themeSelect){
    themeSelect.value = state.theme || 'dark';
    themeSelect.addEventListener('change', (e)=>{
      const chosen = e.target.value || 'dark';
      applyTheme(chosen);
      saveSettingsFromUI();
    });
    // reflect theme when user chooses with button
    const updateThemeSelect = (t)=>{ if(themeSelect) themeSelect.value = t||'dark'; };
    window.updateThemeSelect = updateThemeSelect;
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
  
  // Modal handlers
  btnSummaryClose.addEventListener('click', hideSummaryModal);
  btnPlayAgain.addEventListener('click', ()=>{ hideSummaryModal(); showSetup(); });
  btnPlayersClose.addEventListener('click', hidePlayersModal);
  btnPlayersCancel.addEventListener('click', hidePlayersModal);
  btnPlayersStart.addEventListener('click', startChallengeFromModal);
  
  // Keyboard navigation on answers
  answersEl.addEventListener('keydown', onAnswersKeyDown);

}

// =========================
// Panel Management
// =========================
function showSetup(){
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

function showGame(){
  setupPanel.style.display = 'none';
  gameArea.style.display = 'flex';
  studyPanel.style.display = 'none';
}

function showStudy(){
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
  showToast({ title: getText('timedStart'), msg: getText('timedStartMsg'), type: 'warn' });
}

function startChallenge(){
  showPlayersModal();
}

function startChallengeFromModal(){
  const name1 = (p1NameInput.value||'P1').trim() || 'P1';
  const name2 = (p2NameInput.value||'P2').trim() || 'P2';
  hidePlayersModal();
  showGame();
  gameTitle.textContent = getText('challengeMode');
  state.players = [ { name: name1, score: 0 }, { name: name2, score: 0 } ];
  state.currentPlayerIndex = 0;
  currentPlayerEl.textContent = '1';
  p1ScoreEl.textContent = '0';
  p2ScoreEl.textContent = '0';
  prepareQuiz('challenge');
  showToast({ title: getText('challengeStart'), msg: getText('challengeStartMsg'), type: 'info' });
}

function startStudy(){
  showStudy();
  showToast({ title: getText('studyStart'), msg: getText('studyStartMsg'), type: 'info' });
}

function prepareQuiz(mode){
  state.mode = mode;
  afterRef.innerText='';
  state.score = 0; state.streak = 0; state.qnum = 0; state.results = []; state.paused = false;
  const count = parseInt(numQuestionsInput.value) || 10;
  const difficulty = difficultySel.value;
  state.questions = pickQuestionSet(count, difficulty);
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
    startTimer(secs);
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
function pickQuestionSet(count, difficulty){
  const types = ['whoDid','whoMother','occupation','age','event'];
  const pool = filterPeopleByDifficulty(state.people, difficulty);
  shuffle(pool);
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
    return people.filter(p=>common.has(p.name));
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
      qText.innerText = getText('questionOccupation', { name: q.raw.name });
    } else if(q.type==='whoMother'){
      qText.innerText = getText('questionWhoMother', { name: q.raw.name });
    } else if(q.type==='age'){
      qText.innerText = getText('questionAge', { name: q.raw.name });
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
  const choices = makeChoices(q);
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
    showToast({ title: getText('correctAnswer'), msg: getText('correctMsg'), type: 'success', timeout: 1500 });
  }else{
    state.streak = 0;
  afterRef.innerText = `${getText('wrongAnswer')}. ${getText('correctLabel')}: ${translateAnswerForQuestionType(q.type, q.answer)}. ${getText('references')}: ${(q.ref||[]).join(', ')}`;
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
  state.current=null; state.questions=[]; state.qnum=0; state.qtotal=0;
  btnNext.disabled = true;

  // Show summary modal
  showSummaryModal();
  showToast({ title: getText('quizComplete'), msg: `${getText('yourScore')}: ${state.score}${state.mode==='challenge'?`. ${winnerText()}`:''}`, type: 'success', timeout: 5000 });
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
  timeRemainingEl.textContent = String(state.timerSecondsRemaining);
  timerEl.style.display = 'inline-flex';
  state.timerId = setInterval(()=>{
    if(state.paused) return;
    state.timerSecondsRemaining -= 1;
    timeRemainingEl.textContent = String(Math.max(0, state.timerSecondsRemaining));
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
}

function togglePause(){
  if(state.mode!=='timed') return;
  state.paused = !state.paused;
  btnPause.textContent = state.paused ? getText('resume') : getText('pause');
  showToast({ title: state.paused ? getText('paused') : getText('resumed'), msg: state.paused ? getText('timerPaused') : getText('timerRunning'), type: 'info', timeout: 1200 });
}

// =========================
// Study/Lookup
// =========================
function renderPeopleList(filter){
  peopleList.innerHTML='';
  let arr = state.people.filter(p=>!filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  if(filterMother?.checked) arr = arr.filter(p=>!!p.mother);
  if(filterOccupation?.checked) arr = arr.filter(p=>!!p.occupation);
  if(filterAge?.checked) arr = arr.filter(p=>!!p.age_notes);
  if(sortSelect){
    if(sortSelect.value==='name-asc') arr.sort((a,b)=>a.name.localeCompare(b.name));
    if(sortSelect.value==='name-desc') arr.sort((a,b)=>b.name.localeCompare(a.name));
  }
  if(peopleCountEl) peopleCountEl.textContent = String(arr.length);
  for(const p of arr){
    const item = document.createElement('div');
    item.className = 'person-item';
    const header = document.createElement('div');
    header.className = 'person-header';
    header.innerHTML = `<strong>${p.name}</strong> <span class="muted">${(p.short_bio||'').slice(0,80)}</span>`;
    const details = document.createElement('div');
    details.className = 'person-details';
    details.style.display = 'none';
    const aliasLabel = getText('aliases');
    const motherLabel = getText('filterMother');
    const occupationLabel = getText('filterOccupation');
    const ageLabel = getText('filterAge');
    const eventsLabel = getText('events');
    const versesLabel = getText('verses');
    const eventsJoined = (p.notable_events||[]).map(translateEvent).join(', ');
    details.innerHTML = `
      ${p.aliases?.length?`<div><strong>${aliasLabel}:</strong> ${p.aliases.join(', ')}</div>`:''}
      ${p.mother?`<div><strong>${motherLabel}:</strong> ${p.mother}</div>`:''}
      ${p.occupation?`<div><strong>${occupationLabel}:</strong> ${p.occupation}</div>`:''}
      ${p.age_notes?`<div><strong>${ageLabel}:</strong> ${p.age_notes}</div>`:''}
      ${p.notable_events?.length?`<div><strong>${eventsLabel}:</strong> ${eventsJoined}</div>`:''}
      <div class="ref"><strong>${versesLabel}:</strong> ${p.verses?.join(', ')||''}</div>
    `;
    header.addEventListener('click',()=>{
      details.style.display = details.style.display==='none' ? 'block' : 'none';
    });
    item.appendChild(header);
    item.appendChild(details);
    peopleList.appendChild(item);
  }
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
        else errors.push(`Item ${idx+1}: ${res.reason}`);
      });
      if(errors.length){
        const msg = `${getText('importError')}: ${errors.slice(0,5).join('; ')}${errors.length>5?` (+${errors.length-5} more)`:''}`;
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
  state.theme = theme;
  document.body.classList.remove('light','sepia','high-contrast');
  if(theme && theme!=='dark') document.body.classList.add(theme);
  // for a11y: set --accent-color to a high-contrast accent for contrast theme
  if(theme==='high-contrast'){
    document.documentElement.style.setProperty('--accent-color','#ffd166');
    document.documentElement.style.setProperty('--success-color','#00ff99');
  } else {
    // reset accent to default defined in CSS
    document.documentElement.style.removeProperty('--accent-color');
    document.documentElement.style.removeProperty('--success-color');
  }
  // Show active theme label for screen readers and tooltip
  const themeKey = theme==='dark' ? 'themeDark' : (theme==='light' ? 'themeLight' : (theme==='sepia' ? 'themeSepia' : (theme==='high-contrast' ? 'themeHighContrast' : 'themeDark')));
  const keyText = getText(themeKey) || theme;
  if(btnTheme) btnTheme.setAttribute('title', `${getText('toggleTheme')} — ${keyText}`);
  if(window.updateThemeSelect) window.updateThemeSelect(theme);
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
  const total = state.results.length;
  const correct = state.results.filter(r=>r.correct).length;
  const accuracy = total ? Math.round((correct/total)*100) : 0;
  summaryStatsEl.innerHTML = getText('summaryStats', { score: correct, total: total, percentage: accuracy, streak: state.streak });
  summaryListEl.innerHTML = '';
  state.results.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'summary-item ' + (r.correct?'correct':'incorrect');
    div.innerHTML = `
      <div><strong>${getText('questionLabelShort')}:</strong> ${r.prompt}</div>
  <div><strong>${getText('yourAnswer')}:</strong> ${r.chosenDisplay}</div>
  <div><strong>${getText('correctLabel')}:</strong> ${r.correctDisplay}</div>
      <div class="ref"><strong>${getText('references')}:</strong> ${(r.ref||[]).join(', ')}</div>
    `;
    summaryListEl.appendChild(div);
  });
  modalEl.style.display = 'flex';
}

function hideSummaryModal(){
  if(modalEl) modalEl.style.display = 'none';
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

// Re-localize dynamic pieces when language changes
window.onWhoBibleLanguageChange = function(lang){
  try{
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

