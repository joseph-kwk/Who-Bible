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
  
  // Check security module loaded
  if (!window.SecurityModule || !window.RateLimiter) {
    showToast('Security module not loaded. Please refresh the page.', 'error');
    console.error('[Host] Security module missing!');
    return;
  }
  
  // Load people data
  await loadPeopleData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Run data cleanup (remove games older than 24 hours)
  const database = window.FirebaseConfig.getDatabase();
  if (window.DataCleanup) {
    console.log('[Host] Running data cleanup...');
    window.DataCleanup.cleanupOldGames(database, 24)
      .then(count => {
        if (count > 0) {
          console.log(`[Host] Cleaned up ${count} old games`);
        }
      })
      .catch(err => console.error('[Host] Cleanup error:', err));
  }
  
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
  
  const btnCopyPin = document.getElementById('btn-copy-pin');
  if (btnCopyPin) {
    btnCopyPin.addEventListener('click', copyGamePin);
  }
  
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
  // Rate limiting: Max 5 room creations per minute
  if (window.RateLimiter && !window.RateLimiter.check('createRoom', 5)) {
    showToast('Too many attempts. Please wait a minute and try again.', 'error');
    return;
  }
  
  const hostName = document.getElementById('host-name').value.trim() || 'Host';
  const difficulty = document.getElementById('quiz-difficulty').value;
  const numQuestions = parseInt(document.getElementById('quiz-questions').value) || 10;
  const timePerQuestion = parseInt(document.getElementById('quiz-timer').value) || 20;
  
  // Validate host name
  let validName = hostName;
  if (window.SecurityModule) {
    const nameValidation = window.SecurityModule.validateHostName(hostName);
    if (!nameValidation.valid) {
      showToast(nameValidation.error, 'error');
      return;
    }
    validName = nameValidation.value;
  }
  
  // Sanitize settings
  const sanitizedSettings = {
    numQuestions: Math.max(5, Math.min(30, numQuestions)),
    timePerQuestion: Math.max(10, Math.min(60, timePerQuestion)),
    difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium'
  };
  
  hostState.settings = {
    hostName: validName,
    difficulty: sanitizedSettings.difficulty,
    numQuestions: sanitizedSettings.numQuestions,
    timePerQuestion: sanitizedSettings.timePerQuestion
  };
  
  // Generate room code
  hostState.roomCode = generateRoomCode();
  
  // Create Firebase room
  const database = window.FirebaseConfig.getDatabase();
  hostState.roomRef = database.ref('classrooms/' + hostState.roomCode);
  
  const roomData = {
    code: hostState.roomCode,
    host: window.SecurityModule ? window.SecurityModule.sanitizeHTML(validName) : validName,
    status: 'lobby',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    settings: sanitizedSettings,
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

// Copy Game PIN & Link
async function copyGamePin() {
  const baseJoinUrl = window.location.origin + window.location.pathname.replace('host.html', '');
  const fullJoinUrl = `${baseJoinUrl}index.html?pin=${hostState.roomCode}`;
  const text = `Join our Who-Bible quiz! PIN: ${hostState.roomCode} - ${fullJoinUrl}`;
  try {
    await navigator.clipboard.writeText(fullJoinUrl);
    showToast(`Copied join link to clipboard! PIN: ${hostState.roomCode}`, 'success');
  } catch (e) {
    showToast(`Game PIN: ${hostState.roomCode}`, 'info');
  }
}

// Show Lobby
function showLobby() {
  const baseJoinUrl = window.location.origin + window.location.pathname.replace('host.html', '');
  const fullJoinUrl = `${baseJoinUrl}index.html?pin=${hostState.roomCode}`;
  
  document.getElementById('join-url').textContent = window.location.host || 'who-bible.com';
  document.getElementById('room-code').textContent = hostState.roomCode;
  document.getElementById('question-count').textContent = hostState.settings.numQuestions;
  document.getElementById('time-per-question').textContent = hostState.settings.timePerQuestion + 's';
  
  // Setup QR Code
  const qrImg = document.getElementById('lobby-qr-img');
  const qrFallback = document.getElementById('lobby-qr-fallback');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(fullJoinUrl)}&bgcolor=1a1b26&color=ffffff&margin=8`;
    qrImg.onload = () => {
      qrImg.style.display = 'block';
      if (qrFallback) qrFallback.style.display = 'none';
    };
    qrImg.onerror = () => {
      qrImg.style.display = 'none';
      if (qrFallback) qrFallback.style.display = 'flex';
    };
  }
  
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
    
    // Create avatar (safe - using first char only)
    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    const playerName = String(player.name || 'P');
    avatar.textContent = playerName.charAt(0).toUpperCase();
    
    // Create name display (XSS-safe)
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-name';
    nameDiv.textContent = playerName;
    
    card.appendChild(avatar);
    card.appendChild(nameDiv);
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

// Filter people by difficulty
function filterPeopleForHost(people, difficulty) {
  if (difficulty === 'easy') {
    const common = new Set(['Noah', 'Moses', 'David', 'Solomon', 'Abraham', 'Isaac', 'Jacob', 'Ruth', 'Esther', 'Peter', 'Paul', 'Mary (mother of Jesus)', 'John the Baptist', 'Joseph (son of Jacob)', 'Lazarus', 'Adam', 'Eve', 'Joshua', 'Gideon', 'Samson', 'Daniel', 'Elijah']);
    return people.filter(p => p.difficulty === 'easy' || common.has(p.name));
  }
  if (difficulty === 'hard') {
    return people.filter(p => p.difficulty === 'hard' || (!p.occupation && !p.mother));
  }
  return people.slice();
}

// Generate Questions
function generateQuestions(difficulty, count) {
  const questions = [];
  const usedPeople = new Set();
  
  let pool = filterPeopleForHost(PEOPLE_DATA, difficulty);
  if (pool.length === 0) pool = PEOPLE_DATA.slice();
  
  // Shuffle pool
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  
  const questionTypes = ['whoDid', 'mother', 'occupation', 'age', 'event'];
  
  for (const person of shuffledPool) {
    if (questions.length >= count) break;
    if (usedPeople.has(person.name)) continue;
    
    // Pick a valid question type for this person
    const validTypes = [];
    if (person.notable_events && person.notable_events.length > 0) validTypes.push('whoDid', 'event');
    if (person.mother) validTypes.push('mother');
    if (person.occupation) validTypes.push('occupation');
    if (person.age_notes) validTypes.push('age');
    
    if (validTypes.length === 0) validTypes.push('whoDid');
    
    const type = validTypes[Math.floor(Math.random() * validTypes.length)];
    const question = generateQuestionForPerson(person, type, PEOPLE_DATA);
    
    if (question && question.options && question.options.length === 4) {
      usedPeople.add(person.name);
      questions.push({
        ...question,
        index: questions.length,
        correctAnswer: question.correct,
        points: 1000 // Base points
      });
    }
  }
  
  // If we still need more questions, fill with whoDid questions
  let i = 0;
  while (questions.length < count && i < PEOPLE_DATA.length) {
    const p = PEOPLE_DATA[i++];
    if (!usedPeople.has(p.name)) {
      const q = generateQuestionForPerson(p, 'whoDid', PEOPLE_DATA);
      if (q) {
        usedPeople.add(p.name);
        questions.push({
          ...q,
          index: questions.length,
          correctAnswer: q.correct,
          points: 1000
        });
      }
    }
  }
  
  return questions.slice(0, count);
}

// Generate question for a person
function generateQuestionForPerson(person, type, pool) {
  let prompt = '';
  let correct = '';
  let verse = (person.verses && person.verses.length > 0) ? person.verses.join(', ') : '';
  
  const rawEvent = (person.notable_events && person.notable_events.length > 0) 
    ? person.notable_events[0] 
    : 'is a notable figure in scripture';
    
  switch (type) {
    case 'whoDid':
    case 'event':
      prompt = `Who ${rawEvent}?`;
      correct = person.name;
      break;
      
    case 'mother':
      if (!person.mother) {
        prompt = `Who ${rawEvent}?`;
        correct = person.name;
        type = 'whoDid';
      } else {
        prompt = `Who is the mother of ${person.name}?`;
        correct = person.mother;
      }
      break;
      
    case 'occupation':
      if (!person.occupation) {
        prompt = `Who ${rawEvent}?`;
        correct = person.name;
        type = 'whoDid';
      } else {
        prompt = `What was ${person.name}'s role or occupation?`;
        correct = person.occupation;
      }
      break;
      
    case 'age':
      if (!person.age_notes) {
        prompt = `Who ${rawEvent}?`;
        correct = person.name;
        type = 'whoDid';
      } else {
        prompt = `What do scriptures record about ${person.name}'s life or age?`;
        correct = person.age_notes;
      }
      break;
      
    default:
      prompt = `Who ${rawEvent}?`;
      correct = person.name;
      type = 'whoDid';
  }
  
  // Generate distractors
  const options = [correct];
  const candidates = pool.filter(p => p.name !== person.name);
  const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);
  
  for (const cand of shuffledCandidates) {
    if (options.length >= 4) break;
    
    let candidateAnswer = '';
    if (type === 'whoDid' || type === 'event') {
      candidateAnswer = cand.name;
    } else if (type === 'mother') {
      candidateAnswer = cand.mother || cand.name;
    } else if (type === 'occupation') {
      candidateAnswer = cand.occupation || cand.name;
    } else if (type === 'age') {
      candidateAnswer = cand.age_notes || `Lived during biblical times`;
    }
    
    if (candidateAnswer && !options.includes(candidateAnswer)) {
      options.push(candidateAnswer);
    }
  }
  
  // Ensure we have 4 options
  let fallbackIndex = 1;
  while (options.length < 4) {
    const fallback = `Option ${fallbackIndex++}`;
    if (!options.includes(fallback)) options.push(fallback);
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
  
  // Update verse reference (XSS-safe)
  const metaDiv = document.getElementById('question-meta');
  metaDiv.innerHTML = ''; // Clear first
  if (question.verse) {
    const verseSpan = document.createElement('span');
    verseSpan.className = 'verse-ref';
    verseSpan.textContent = question.verse;
    metaDiv.appendChild(verseSpan);
  }
  
  // Update answers display
  const answersDiv = document.getElementById('answers-display');
  answersDiv.innerHTML = '';
  const colors = ['red', 'blue', 'yellow', 'green'];
  const icons = ['▲', '◆', '●', '■'];
  
  question.options.forEach((option, i) => {
    const card = document.createElement('div');
    card.className = `answer-card ${colors[i]}`;
    
    // Create icon (safe - from array)
    const iconDiv = document.createElement('div');
    iconDiv.className = 'answer-icon';
    iconDiv.textContent = icons[i];
    
    // Create answer text (XSS-safe)
    const textDiv = document.createElement('div');
    textDiv.className = 'answer-text';
    textDiv.textContent = option;
    
    // Create count (initialized to 0)
    const countDiv = document.createElement('div');
    countDiv.className = 'answer-count';
    countDiv.textContent = '0';
    
    card.appendChild(iconDiv);
    card.appendChild(textDiv);
    card.appendChild(countDiv);
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
