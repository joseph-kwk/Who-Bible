/**
 * Host Control Logic for Kahoot-style Classroom Mode
 * Manages game flow, player sync, scoring, and leaderboard
 */

// Import people data
let PEOPLE_DATA = [];

// Host State
const hostState = {
  roomCode: null,
  roomRef: null,
  settings: {
    hostName: 'Host',
    difficulty: 'medium',
    numQuestions: 10,
    timePerQuestion: 20
  },
  questions: [],
  currentQuestionIndex: -1,
  players: {},
  responses: {},
  timerInterval: null,
  timeRemaining: 0
};

// Screen Management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.remove(), 4000);
}

// Initialize
async function init() {
  console.log('[Host] Initializing...');
  
  // Check Firebase
  if (!window.FirebaseConfig || !window.FirebaseConfig.isAvailable()) {
    showToast('Firebase not configured. Classroom mode requires Firebase.', 'error');
    return;
  }
  
  // Load people data
  await loadPeopleData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check for room code in URL (rejoining)
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  if (roomCode) {
    // Try to rejoin as host
    console.log('[Host] Found room code in URL:', roomCode);
  }
}

// Load Bible people data
async function loadPeopleData() {
  try {
    const response = await fetch('assets/data/people.json');
    PEOPLE_DATA = await response.json();
    console.log(`[Host] Loaded ${PEOPLE_DATA.length} people`);
  } catch (error) {
    console.error('[Host] Error loading people data:', error);
    showToast('Error loading quiz data', 'error');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Setup screen
  document.getElementById('btn-create-session').addEventListener('click', createSession);
  
  // Lobby screen
  document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);
  document.getElementById('btn-cancel-session').addEventListener('click', cancelSession);
  
  // Results screen
  document.getElementById('btn-show-leaderboard').addEventListener('click', showLeaderboardScreen);
  
  // Leaderboard screen
  document.getElementById('btn-next-question').addEventListener('click', nextQuestion);
  document.getElementById('btn-end-quiz').addEventListener('click', endQuiz);
  
  // Final screen
  document.getElementById('btn-new-session').addEventListener('click', () => {
    window.location.reload();
  });
  document.getElementById('btn-exit').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// Create Session
async function createSession() {
  const hostName = document.getElementById('host-name').value.trim() || 'Host';
  const difficulty = document.getElementById('quiz-difficulty').value;
  const numQuestions = parseInt(document.getElementById('quiz-questions').value);
  const timePerQuestion = parseInt(document.getElementById('quiz-timer').value);
  
  if (numQuestions < 5 || numQuestions > 30) {
    showToast('Number of questions must be between 5 and 30', 'error');
    return;
  }
  
  if (timePerQuestion < 10 || timePerQuestion > 60) {
    showToast('Time per question must be between 10 and 60 seconds', 'error');
    return;
  }
  
  hostState.settings = { hostName, difficulty, numQuestions, timePerQuestion };
  
  // Generate room code
  hostState.roomCode = generateRoomCode();
  
  // Create Firebase room
  const database = window.FirebaseConfig.getDatabase();
  hostState.roomRef = database.ref('classrooms/' + hostState.roomCode);
  
  const roomData = {
    code: hostState.roomCode,
    host: hostName,
    status: 'lobby',
    createdAt: Date.now(),
    settings: {
      difficulty,
      numQuestions,
      timePerQuestion
    },
    players: {},
    currentQuestion: -1,
    questions: null
  };
  
  await hostState.roomRef.set(roomData);
  
  // Setup listeners
  setupRoomListeners();
  
  // Show lobby
  showLobby();
}

// Generate room code
function generateRoomCode() {
  const adjectives = ['FAITH', 'GRACE', 'HOPE', 'LIGHT', 'PEACE', 'TRUTH', 'LOVE', 'HOLY'];
  const numbers = Math.floor(Math.random() * 900) + 100;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adj}-${numbers}`;
}

// Show Lobby
function showLobby() {
  const joinUrl = window.location.origin + window.location.pathname.replace('host.html', '');
  document.getElementById('join-url').textContent = joinUrl;
  document.getElementById('room-code').textContent = hostState.roomCode;
  document.getElementById('question-count').textContent = hostState.settings.numQuestions;
  document.getElementById('time-per-question').textContent = hostState.settings.timePerQuestion + 's';
  
  showScreen('lobby-screen');
}

// Setup Room Listeners
function setupRoomListeners() {
  // Listen for players joining
  hostState.roomRef.child('players').on('value', (snapshot) => {
    hostState.players = snapshot.val() || {};
    updatePlayersDisplay();
  });
}

// Update Players Display
function updatePlayersDisplay() {
  const playerCount = Object.keys(hostState.players).length;
  document.getElementById('player-count').textContent = playerCount;
  
  const grid = document.getElementById('players-grid');
  grid.innerHTML = '';
  
  Object.entries(hostState.players).forEach(([id, player]) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
      <div class="player-name">${player.name}</div>
    `;
    grid.appendChild(card);
  });
  
  // Enable start button if at least 1 player
  document.getElementById('btn-start-quiz').disabled = playerCount < 1;
}

// Start Quiz
async function startQuiz() {
  showToast('Generating questions...', 'info');
  
  // Generate questions
  hostState.questions = generateQuestions(
    hostState.settings.difficulty,
    hostState.settings.numQuestions
  );
  
  // Save questions to Firebase
  await hostState.roomRef.child('questions').set(hostState.questions);
  await hostState.roomRef.child('status').set('playing');
  
  // Start first question
  hostState.currentQuestionIndex = 0;
  showQuestion(0);
}

// Generate Questions
function generateQuestions(difficulty, count) {
  const questions = [];
  const usedPeople = new Set();
  
  // Filter by difficulty
  let pool = PEOPLE_DATA;
  if (difficulty === 'easy') {
    pool = PEOPLE_DATA.filter(p => p.notableEvents && p.notableEvents.length > 0);
  } else if (difficulty === 'hard') {
    pool = PEOPLE_DATA; // All characters
  }
  
  const questionTypes = ['deed', 'age', 'mother', 'occupation', 'event'];
  
  for (let i = 0; i < count && pool.length > usedPeople.size; i++) {
    // Pick random person
    let person;
    do {
      person = pool[Math.floor(Math.random() * pool.length)];
    } while (usedPeople.has(person.name) && usedPeople.size < pool.length);
    
    usedPeople.add(person.name);
    
    // Pick random question type
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    // Generate question
    const question = generateQuestionForPerson(person, type, pool);
    if (question) {
      questions.push({
        ...question,
        index: i,
        correctAnswer: question.correct,
        points: 1000 // Base points
      });
    }
  }
  
  return questions;
}

// Generate question for a person
function generateQuestionForPerson(person, type, pool) {
  let prompt, correct, options, verse;
  
  switch (type) {
    case 'deed':
      if (!person.notableDeeds || person.notableDeeds.length === 0) return null;
      const deed = person.notableDeeds[0];
      prompt = `Who ${deed.toLowerCase()}?`;
      correct = person.name;
      verse = person.verses?.[0] || '';
      break;
      
    case 'age':
      if (!person.age) return null;
      prompt = `How old was ${person.name} when they died?`;
      correct = person.age.toString();
      verse = person.verses?.[0] || '';
      break;
      
    case 'mother':
      if (!person.mother) return null;
      prompt = `Who was the mother of ${person.name}?`;
      correct = person.mother;
      verse = person.verses?.[0] || '';
      break;
      
    case 'occupation':
      if (!person.occupation) return null;
      prompt = `What was ${person.name}'s occupation?`;
      correct = person.occupation;
      verse = person.verses?.[0] || '';
      break;
      
    case 'event':
      if (!person.notableEvents || person.notableEvents.length === 0) return null;
      const event = person.notableEvents[0];
      prompt = `Who ${event.toLowerCase()}?`;
      correct = person.name;
      verse = person.verses?.[0] || '';
      break;
      
    default:
      return null;
  }
  
  // Generate wrong options
  options = [correct];
  while (options.length < 4) {
    const randomPerson = pool[Math.floor(Math.random() * pool.length)];
    const wrongAnswer = type === 'age' ? randomPerson.age?.toString() :
                       type === 'mother' ? randomPerson.mother :
                       type === 'occupation' ? randomPerson.occupation :
                       randomPerson.name;
    
    if (wrongAnswer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  options.sort(() => Math.random() - 0.5);
  
  return {
    type,
    prompt,
    correct,
    options,
    verse
  };
}

// Show Question
async function showQuestion(index) {
  const question = hostState.questions[index];
  
  // Update Firebase
  await hostState.roomRef.child('currentQuestion').set(index);
  await hostState.roomRef.child('questionStartTime').set(Date.now());
  await hostState.roomRef.child('status').set('question');
  
  // Reset responses
  hostState.responses = {};
  await hostState.roomRef.child('responses').remove();
  
  // Update UI
  document.getElementById('current-question-num').textContent = index + 1;
  document.getElementById('total-questions').textContent = hostState.questions.length;
  document.getElementById('question-type').textContent = getQuestionTypeLabel(question.type);
  document.getElementById('question-text').textContent = question.prompt;
  document.getElementById('question-meta').innerHTML = question.verse ? 
    `<span class="verse-ref">${question.verse}</span>` : '';
  
  // Update answers display
  const answersDiv = document.getElementById('answers-display');
  answersDiv.innerHTML = '';
  const colors = ['red', 'blue', 'yellow', 'green'];
  const icons = ['▲', '◆', '●', '■'];
  
  question.options.forEach((option, i) => {
    const card = document.createElement('div');
    card.className = `answer-card ${colors[i]}`;
    card.innerHTML = `
      <div class="answer-icon">${icons[i]}</div>
      <div class="answer-text">${option}</div>
      <div class="answer-count">0</div>
    `;
    answersDiv.appendChild(card);
  });
  
  document.getElementById('responses-count').textContent = '0';
  document.getElementById('total-players').textContent = Object.keys(hostState.players).length;
  
  // Listen for responses
  hostState.roomRef.child('responses').on('value', (snapshot) => {
    hostState.responses = snapshot.val() || {};
    updateResponseCounts();
  });
  
  showScreen('question-screen');
  
  // Start timer
  startTimer(hostState.settings.timePerQuestion);
}

// Get question type label
function getQuestionTypeLabel(type) {
  const labels = {
    deed: 'Notable Deed',
    age: 'Age Question',
    mother: 'Family Relations',
    occupation: 'Occupation',
    event: 'Biblical Event'
  };
  return labels[type] || 'Multiple Choice';
}

// Start Timer
function startTimer(seconds) {
  hostState.timeRemaining = seconds;
  updateTimerDisplay();
  
  const circle = document.getElementById('timer-circle');
  const circumference = 2 * Math.PI * 45;
  
  if (hostState.timerInterval) {
    clearInterval(hostState.timerInterval);
  }
  
  hostState.timerInterval = setInterval(() => {
    hostState.timeRemaining--;
    
    if (hostState.timeRemaining <= 0) {
      clearInterval(hostState.timerInterval);
      endQuestion();
      return;
    }
    
    updateTimerDisplay();
    
    // Update circle
    const progress = hostState.timeRemaining / seconds;
    circle.style.strokeDashoffset = circumference * (1 - progress);
  }, 1000);
}

// Update Timer Display
function updateTimerDisplay() {
  document.getElementById('timer-text').textContent = hostState.timeRemaining;
}

// Update Response Counts
function updateResponseCounts() {
  const answerCards = document.querySelectorAll('.answer-card');
  const question = hostState.questions[hostState.currentQuestionIndex];
  
  const counts = {};
  Object.values(hostState.responses).forEach(response => {
    if (response.answer !== undefined) {
      counts[response.answer] = (counts[response.answer] || 0) + 1;
    }
  });
  
  answerCards.forEach((card, i) => {
    const count = counts[i] || 0;
    card.querySelector('.answer-count').textContent = count;
    if (count > 0) {
      card.classList.add('answered');
    }
  });
  
  const totalResponses = Object.values(hostState.responses).filter(r => r.answer !== undefined).length;
  document.getElementById('responses-count').textContent = totalResponses;
  
  // Auto-end if all players answered
  if (totalResponses === Object.keys(hostState.players).length && totalResponses > 0) {
    setTimeout(() => endQuestion(), 2000);
  }
}

// End Question
async function endQuestion() {
  clearInterval(hostState.timerInterval);
  
  await hostState.roomRef.child('status').set('results');
  
  // Calculate scores
  const question = hostState.questions[hostState.currentQuestionIndex];
  const correctIndex = question.options.indexOf(question.correct);
  
  // Update player scores
  for (const [playerId, response] of Object.entries(hostState.responses)) {
    if (response.answer === correctIndex) {
      // Calculate speed bonus
      const timeTaken = response.timeTaken || hostState.settings.timePerQuestion;
      const timeLeft = Math.max(0, hostState.settings.timePerQuestion - timeTaken);
      const speedBonus = Math.floor((timeLeft / hostState.settings.timePerQuestion) * 500);
      const points = 1000 + speedBonus;
      
      // Update player score in Firebase
      const currentScore = hostState.players[playerId]?.score || 0;
      await hostState.roomRef.child(`players/${playerId}/score`).set(currentScore + points);
      await hostState.roomRef.child(`players/${playerId}/correct`).set((hostState.players[playerId]?.correct || 0) + 1);
    }
  }
  
  // Show results
  showResults();
}

// Show Results
function showResults() {
  const question = hostState.questions[hostState.currentQuestionIndex];
  const correctIndex = question.options.indexOf(question.correct);
  
  document.getElementById('correct-answer-text').textContent = question.correct;
  
  // Show answer breakdown
  const breakdown = document.getElementById('answer-breakdown');
  breakdown.innerHTML = '';
  
  const colors = ['red', 'blue', 'yellow', 'green'];
  const icons = ['▲', '◆', '●', '■'];
  
  const totalResponses = Object.values(hostState.responses).filter(r => r.answer !== undefined).length;
  
  question.options.forEach((option, i) => {
    const count = Object.values(hostState.responses).filter(r => r.answer === i).length;
    const percent = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
    
    const item = document.createElement('div');
    item.className = `breakdown-item ${i === correctIndex ? 'correct' : 'wrong'}`;
    item.style.borderLeft = `6px solid var(--answer-${colors[i]})`;
    item.innerHTML = `
      <div class="breakdown-icon">${icons[i]}</div>
      <div class="breakdown-text">${option}</div>
      <div class="breakdown-percent">${percent}%</div>
    `;
    breakdown.appendChild(item);
  });
  
  showScreen('results-screen');
  
  // Remove response listener
  hostState.roomRef.child('responses').off();
}

// Show Leaderboard Screen
async function showLeaderboardScreen() {
  await hostState.roomRef.child('status').set('leaderboard');
  
  // Sort players by score
  const sortedPlayers = Object.entries(hostState.players)
    .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));
  
  document.getElementById('leaderboard-question-num').textContent = hostState.currentQuestionIndex + 1;
  
  // Show podium (top 3)
  const podium = document.getElementById('podium');
  podium.innerHTML = '';
  
  const places = ['first', 'second', 'third'];
  sortedPlayers.slice(0, 3).forEach(([id, player], i) => {
    const place = document.createElement('div');
    place.className = `podium-place ${places[i]}`;
    place.innerHTML = `
      <div class="podium-avatar">${player.name.charAt(0).toUpperCase()}</div>
      <div class="podium-rank">${['🥇', '🥈', '🥉'][i]}</div>
      <div class="podium-name">${player.name}</div>
      <div class="podium-score">${player.score || 0}</div>
      <div class="podium-base"></div>
    `;
    podium.appendChild(place);
  });
  
  // Show rest of players
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '';
  
  sortedPlayers.slice(3).forEach(([id, player], i) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <div class="leaderboard-rank">${i + 4}</div>
      <div class="leaderboard-avatar">${player.name.charAt(0).toUpperCase()}</div>
      <div class="leaderboard-name">${player.name}</div>
      <div class="leaderboard-score">${player.score || 0}</div>
    `;
    list.appendChild(item);
  });
  
  showScreen('leaderboard-screen');
}

// Next Question
async function nextQuestion() {
  hostState.currentQuestionIndex++;
  
  if (hostState.currentQuestionIndex >= hostState.questions.length) {
    // Quiz complete
    showFinalResults();
  } else {
    showQuestion(hostState.currentQuestionIndex);
  }
}

// End Quiz Early
async function endQuiz() {
  if (confirm('Are you sure you want to end the quiz early?')) {
    showFinalResults();
  }
}

// Show Final Results
async function showFinalResults() {
  await hostState.roomRef.child('status').set('finished');
  
  // Sort players by score
  const sortedPlayers = Object.entries(hostState.players)
    .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));
  
  // Show final podium (same as leaderboard)
  const podium = document.getElementById('final-podium');
  podium.innerHTML = '';
  
  const places = ['first', 'second', 'third'];
  sortedPlayers.slice(0, 3).forEach(([id, player], i) => {
    const place = document.createElement('div');
    place.className = `podium-place ${places[i]}`;
    place.innerHTML = `
      <div class="podium-avatar">${player.name.charAt(0).toUpperCase()}</div>
      <div class="podium-rank">${['🥇', '🥈', '🥉'][i]}</div>
      <div class="podium-name">${player.name}</div>
      <div class="podium-score">${player.score || 0}</div>
      <div class="podium-base"></div>
    `;
    podium.appendChild(place);
  });
  
  // Show all players
  const list = document.getElementById('final-list');
  list.innerHTML = '';
  
  sortedPlayers.slice(3).forEach(([id, player], i) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <div class="leaderboard-rank">${i + 4}</div>
      <div class="leaderboard-avatar">${player.name.charAt(0).toUpperCase()}</div>
      <div class="leaderboard-name">${player.name}</div>
      <div class="leaderboard-score">${player.score || 0}</div>
    `;
    list.appendChild(item);
  });
  
  // Calculate stats
  const totalPlayers = sortedPlayers.length;
  const totalCorrect = sortedPlayers.reduce((sum, [, p]) => sum + (p.correct || 0), 0);
  const totalQuestions = totalPlayers * (hostState.currentQuestionIndex + 1);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  
  document.getElementById('final-players').textContent = totalPlayers;
  document.getElementById('final-questions').textContent = hostState.currentQuestionIndex + 1;
  document.getElementById('final-accuracy').textContent = avgAccuracy + '%';
  
  showScreen('final-screen');
}

// Cancel Session
async function cancelSession() {
  if (confirm('Are you sure you want to cancel this session?')) {
    if (hostState.roomRef) {
      await hostState.roomRef.remove();
    }
    window.location.reload();
  }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
