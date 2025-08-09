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
  people: []
};

// =========================
// Elements
// =========================
const btnSolo = document.getElementById('btn-solo');
const btnTimed = document.getElementById('btn-timed');
const btnChallenge = document.getElementById('btn-challenge');
const btnStudy = document.getElementById('btn-study');
const quizEl = document.getElementById('quiz');
const welcomeEl = document.getElementById('welcome');
const qText = document.getElementById('question-text');
const answersEl = document.getElementById('answers');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const qnumEl = document.getElementById('qnum');
const qtotalEl = document.getElementById('qtotal');
const afterRef = document.getElementById('after-ref');
const btnNext = document.getElementById('btn-next');
const btnQuit = document.getElementById('btn-quit');
const peopleList = document.getElementById('people-list');
const searchPerson = document.getElementById('search-person');
const difficultySel = document.getElementById('difficulty');
const numQuestionsInput = document.getElementById('num-questions');
const timeLimitInput = document.getElementById('time-limit');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const btnResetData = document.getElementById('btn-reset-data');
const fileInput = document.getElementById('file-input');
const timerEl = document.getElementById('timer');
const timeRemainingEl = document.getElementById('time-remaining');
const challengeStatusEl = document.getElementById('challenge-status');
const currentPlayerEl = document.getElementById('current-player');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');

// =========================
// Init
// =========================
init();

function init(){
  state.people = loadPeopleDataFromLocalStorage() || DEFAULT_PEOPLE_DATA.slice();
  renderPeopleList();
  attachHandlers();
}

function attachHandlers(){
  btnSolo.addEventListener('click', startSolo);
  btnTimed.addEventListener('click', startTimed);
  btnChallenge.addEventListener('click', startChallenge);
  btnStudy.addEventListener('click', ()=>{ setMode('study'); renderPeopleList(); });
  btnNext.addEventListener('click', nextQuestion);
  btnQuit.addEventListener('click', quitQuiz);
  btnExport.addEventListener('click', exportJson);
  btnImport.addEventListener('click', ()=>fileInput.click());
  btnResetData.addEventListener('click', resetData);
  fileInput.addEventListener('change', handleImportFile);
  searchPerson.addEventListener('input', e=>renderPeopleList(e.target.value));

  // Keyboard navigation on answers
  answersEl.addEventListener('keydown', onAnswersKeyDown);
}

function setMode(mode){
  state.mode = mode;
  if(mode==='study'){
    quizEl.style.display='none';
    welcomeEl.style.display='block';
    stopTimer();
  }else{
    welcomeEl.style.display='none';
    quizEl.style.display='block';
  }
}

// =========================
// Modes
// =========================
function startSolo(){
  prepareQuiz('solo');
}

function startTimed(){
  prepareQuiz('timed');
}

function startChallenge(){
  // Optionally prompt for player names
  const name1 = prompt('Player 1 name?', 'P1') || 'P1';
  const name2 = prompt('Player 2 name?', 'P2') || 'P2';
  state.players = [ { name: name1, score: 0 }, { name: name2, score: 0 } ];
  state.currentPlayerIndex = 0;
  currentPlayerEl.textContent = '1';
  p1ScoreEl.textContent = '0';
  p2ScoreEl.textContent = '0';
  prepareQuiz('challenge');
}

function prepareQuiz(mode){
  setMode(mode);
  afterRef.innerText='';
  state.score = 0; state.streak = 0; state.qnum = 0;
  const count = parseInt(numQuestionsInput.value) || 10;
  const difficulty = difficultySel.value;
  state.questions = pickQuestionSet(count, difficulty);
  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  btnNext.disabled = true;
  timerEl.style.display = (mode==='timed') ? 'inline-flex' : 'none';
  challengeStatusEl.style.display = (mode==='challenge') ? 'inline-flex' : 'none';
  if(mode==='timed'){
    const secs = parseInt(timeLimitInput.value) || 60;
    startTimer(secs);
  } else {
    stopTimer();
  }
  nextQuestion();
}

function quitQuiz(){
  setMode('study');
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
      questions.push({type:'whoDid',prompt:`Who is known for: ${person.notable_events?.[0] || 'a notable event'}?`,answer:person.name,ref:person.verses});
    }else if(t==='whoMother'){
      if(person.mother) questions.push({type:'whoMother',prompt:`Who was the mother of ${person.name}?`,answer:person.mother,ref:person.verses});
    }else if(t==='occupation'){
      if(person.occupation) questions.push({type:'occupation',prompt:`What was ${person.name}'s occupation or role?`,answer:person.occupation,ref:person.verses});
    }else if(t==='age'){
      if(person.age_notes) questions.push({type:'age',prompt:`Which age-note is correct for ${person.name}?`,answer:person.age_notes,ref:person.verses});
    }else if(t==='event'){
      if(person.notable_events && person.notable_events.length>0) questions.push({type:'event',prompt:`Which person is linked to: ${person.notable_events[0]}?`,answer:person.name,ref:person.verses});
    }
  }
  // ensure we have at least count questions; fill with simple ones
  let i = 0;
  while(questions.length < count && i < state.people.length){
    const p = state.people[i++];
    questions.push({type:'whoDid',prompt:`Who is known for: ${p.notable_events?.[0] || 'a notable event'}?`,answer:p.name,ref:p.verses});
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
}

function renderQuestion(q){
  qText.innerText = q.prompt;
  afterRef.innerText='';
  btnNext.disabled = true;
  answersEl.innerHTML='';
  answersEl.setAttribute('aria-activedescendant','');
  const choices = makeChoices(q);
  choices.forEach((choice, idx)=>{
    const div = document.createElement('div');
    div.className='ans';
    div.tabIndex=0;
    div.id = `choice-${idx+1}`;
    div.setAttribute('role','option');
    div.setAttribute('aria-selected','false');
    div.innerText = choice;
    div.addEventListener('click',()=>handleAnswer(choice,q,div));
    answersEl.appendChild(div);
  });
  // Focus first choice for accessibility
  const first = answersEl.querySelector('.ans');
  if(first) first.focus();
}

function makeChoices(q){
  // Build choices: correct + 3 distractors
  const names = state.people.map(p=>p.name);
  const choices = new Set();
  choices.add(q.answer);
  while(choices.size < 4){
    const pick = names[Math.floor(Math.random()*names.length)];
    choices.add(pick);
  }
  const arr = Array.from(choices);
  shuffle(arr);
  return arr;
}

function handleAnswer(choice,q, el){
  // Disable further answers; mark correctness
  const correct = normalize(choice) === normalize(q.answer);
  const ansNodes = Array.from(answersEl.querySelectorAll('.ans'));
  ansNodes.forEach(node=>{
    node.classList.add('disabled');
    if(normalize(node.innerText) === normalize(q.answer)) node.classList.add('correct');
  });
  if(!correct) el.classList.add('incorrect');

  if(correct){
    state.score += 10;
    state.streak += 1;
    afterRef.innerText = 'Correct — ref: ' + (q.ref||[]).join(', ');
    if(state.mode==='challenge'){
      state.players[state.currentPlayerIndex].score += 10;
      updateChallengeScores();
    }
  }else{
    state.streak = 0;
    afterRef.innerText = `Incorrect. Correct: ${q.answer}. Ref: ${(q.ref||[]).join(', ')}`;
  }

  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;

  // For challenge mode, alternate player each question
  if(state.mode==='challenge'){
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
    currentPlayerEl.textContent = String(state.currentPlayerIndex + 1);
  }

  btnNext.disabled = false;
}

function updateChallengeScores(){
  p1ScoreEl.textContent = String(state.players[0].score);
  p2ScoreEl.textContent = String(state.players[1].score);
}

function endQuiz(){
  let endText = `Quiz complete! Score: ${state.score}`;
  if(state.mode==='challenge'){
    const [p1,p2] = state.players;
    const winner = p1.score === p2.score ? 'Tie' : (p1.score > p2.score ? p1.name : p2.name);
    endText += ` — ${winner === 'Tie' ? 'Tie game' : 'Winner: '+winner}`;
  }
  qText.innerText = endText;
  answersEl.innerHTML='';
  afterRef.innerText='';
  stopTimer();
  state.current=null; state.questions=[]; state.qnum=0; state.qtotal=0;
  btnNext.disabled = true;
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
    state.timerSecondsRemaining -= 1;
    timeRemainingEl.textContent = String(Math.max(0, state.timerSecondsRemaining));
    if(state.timerSecondsRemaining <= 0){
      stopTimer();
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

// =========================
// Study/Lookup
// =========================
function renderPeopleList(filter){
  peopleList.innerHTML='';
  const arr = state.people.filter(p=>!filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  for(const p of arr){
    const item = document.createElement('div');
    item.className = 'person-item';
    const header = document.createElement('div');
    header.className = 'person-header';
    header.innerHTML = `<strong>${p.name}</strong> <span class="muted">${(p.short_bio||'').slice(0,80)}</span>`;
    const details = document.createElement('div');
    details.className = 'person-details';
    details.style.display = 'none';
    details.innerHTML = `
      ${p.aliases?.length?`<div><strong>Aliases:</strong> ${p.aliases.join(', ')}</div>`:''}
      ${p.mother?`<div><strong>Mother:</strong> ${p.mother}</div>`:''}
      ${p.occupation?`<div><strong>Occupation:</strong> ${p.occupation}</div>`:''}
      ${p.age_notes?`<div><strong>Age notes:</strong> ${p.age_notes}</div>`:''}
      ${p.notable_events?.length?`<div><strong>Events:</strong> ${p.notable_events.join(', ')}</div>`:''}
      <div class="ref"><strong>Verses:</strong> ${p.verses?.join(', ')||''}</div>
    `;
    header.addEventListener('click',()=>{
      details.style.display = details.style.display==='none' ? 'block' : 'none';
    });
    item.appendChild(header);
    item.appendChild(details);
    peopleList.appendChild(item);
  }
}

// =========================
// Import/Export & Persistence
// =========================
function exportJson(){
  const blob = new Blob([JSON.stringify(state.people,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='people_data.json'; a.click(); URL.revokeObjectURL(url);
}

async function handleImportFile(e){
  const f = e.target.files?.[0]; if(!f) return;
  const txt = await f.text();
  try{
    const parsed = JSON.parse(txt);
    if(Array.isArray(parsed)){
      state.people = parsed;
      savePeopleDataToLocalStorage(parsed);
      renderPeopleList();
      alert('Imported ' + state.people.length + ' people.');
    } else {
      alert('JSON must be an array of people');
    }
  }catch(err){
    alert('Invalid JSON: ' + (err?.message||String(err)));
  } finally {
    e.target.value = '';
  }
}

function resetData(){
  if(confirm('Reset to built-in dataset? This will remove your saved data.')){
    localStorage.removeItem('peopleData');
    state.people = DEFAULT_PEOPLE_DATA.slice();
    renderPeopleList();
    alert('Data reset.');
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

