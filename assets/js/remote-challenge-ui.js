// Remote Challenge UI Integration for Who-Bible
// This file handles the UI interactions for remote multiplayer challenges

// Show/hide remote modal steps
function showRemoteStep(step) {
  // Hide all steps
  document.getElementById('remote-step-1').style.display = 'none';
  document.getElementById('remote-step-create').style.display = 'none';
  document.getElementById('remote-step-share').style.display = 'none';
  document.getElementById('remote-step-join').style.display = 'none';
  document.getElementById('remote-step-joined').style.display = 'none';
  
  // Show requested step
  const steps = {
    '1': 'remote-step-1',
    'create': 'remote-step-create',
    'share': 'remote-step-share',
    'join': 'remote-step-join',
    'joined': 'remote-step-joined'
  };
  
  const stepEl = document.getElementById(steps[step]);
  if (stepEl) {
    stepEl.style.display = 'block';
  }
  
  // Show/hide back button
  const btnBack = document.getElementById('btn-remote-back');
  if (btnBack) {
    btnBack.style.display = (step === 'create' || step === 'join') ? 'inline-block' : 'none';
  }
}

function showRemoteModal() {
  const modal = document.getElementById('remote-modal');
  if (modal) {
    modal.style.display = 'flex';
    showRemoteStep('1');
  }
}

function hideRemoteModal() {
  const modal = document.getElementById('remote-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Clean up if leaving a room
  if (window.RemoteChallenge) {
    window.RemoteChallenge.leaveRoom();
  }
}

// Remote Challenge button handler
function startRemoteChallenge() {
  if (!window.FirebaseConfig?.isAvailable()) {
    showToast({ 
      title: 'Firebase Not Configured', 
      msg: 'Please set up Firebase to use Remote Challenge. See REMOTE_CHALLENGE_SETUP.md', 
      type: 'error',
      timeout: 4000
    });
    return;
  }
  
  showRemoteModal();
}

// Create room flow
async function handleCreateRoom() {
  const hostName = document.getElementById('remote-host-name').value.trim();
  
  if (!hostName) {
    showToast({ title: (window.getText ? window.getText('nameRequired') : 'Name Required'), msg: (window.getText ? window.getText('pleaseEnterName') : 'Please enter your name'), type: 'error' });
    return;
  }
  
  try {
    const settings = {
      difficulty: document.getElementById('difficulty').value,
      numQuestions: parseInt(document.getElementById('num-questions').value) || 10,
      timeLimit: parseInt(document.getElementById('time-limit').value) || 60
    };
    
    const result = await window.RemoteChallenge.createRoom(hostName, settings);
    
    // Show share step
    showRemoteStep('share');
    document.getElementById('remote-room-code').textContent = result.roomCode;
    document.getElementById('remote-share-url').textContent = result.shareUrl;
    
    // Store share URL for later
    window.currentRemoteShareUrl = result.shareUrl;
    
    showToast({ 
      title: 'Room Created!', 
      msg: `Code: ${result.roomCode}`, 
      type: 'success' 
    });
  } catch (error) {
    console.error('Create room error:', error);
    showToast({ 
      title: 'Error', 
      msg: error.message || 'Failed to create room', 
      type: 'error' 
    });
  }
}

// Join room flow
async function handleJoinRoom() {
  const roomCode = document.getElementById('remote-room-code-input').value.trim().toUpperCase();
  const playerName = document.getElementById('remote-join-name').value.trim();
  
  if (!roomCode) {
    showToast({ title: (window.getText ? window.getText('roomCodeRequired') : 'Room Code Required'), msg: (window.getText ? window.getText('pleaseEnterRoomCode') : 'Please enter a room code'), type: 'error' });
    return;
  }
  
  if (!playerName) {
    showToast({ title: (window.getText ? window.getText('nameRequired') : 'Name Required'), msg: (window.getText ? window.getText('pleaseEnterName') : 'Please enter your name'), type: 'error' });
    return;
  }
  
  try {
    const roomData = await window.RemoteChallenge.joinRoom(roomCode, playerName);
    
    // Show joined step
    showRemoteStep('joined');
    document.getElementById('remote-joined-code').textContent = roomCode;
    document.getElementById('remote-host-name-display').textContent = roomData.host;
    
    showToast({ 
      title: 'Joined Room!', 
      msg: `Playing against ${roomData.host}`, 
      type: 'success' 
    });
  } catch (error) {
    console.error('Join room error:', error);
    showToast({ 
      title: 'Error', 
      msg: error.message || 'Failed to join room', 
      type: 'error' 
    });
  }
}

// Copy link handler
async function handleCopyLink() {
  const url = window.currentRemoteShareUrl;
  
  if (!url) return;
  
  try {
    await navigator.clipboard.writeText(url);
    showToast({ 
      title: 'Link Copied!', 
      msg: 'Share URL copied to clipboard', 
      type: 'success',
      timeout: 1500
    });
  } catch (error) {
    console.error('Copy failed:', error);
    showToast({ 
      title: 'Copy Failed', 
      msg: 'Could not copy to clipboard', 
      type: 'error' 
    });
  }
}

// Share link handler
async function handleShareLink() {
  const url = window.currentRemoteShareUrl;
  const roomCode = document.getElementById('remote-room-code').textContent;
  
  if (!url) return;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join my Who-Bible Challenge!',
        text: `Join my Bible quiz challenge! Room code: ${roomCode}`,
        url: url
      });
    } catch (error) {
      // User cancelled or share failed
      if (error.name !== 'AbortError') {
        handleCopyLink(); // Fallback to copy
      }
    }
  } else {
    // No Web Share API - copy instead
    handleCopyLink();
  }
}

// Ready button handlers
async function handleReadyHost() {
  try {
    await window.RemoteChallenge.setReady();
    document.getElementById('btn-ready-host').textContent = 'Ready! Waiting for opponent...';
    document.getElementById('btn-ready-host').disabled = true;
  } catch (error) {
    console.error('Ready error:', error);
    showToast({ title: (window.getText ? window.getText('error') : 'Error'), msg: (window.getText ? window.getText('couldNotSetReady') : 'Could not set ready status'), type: 'error' });
  }
}

async function handleReadyGuest() {
  try {
    await window.RemoteChallenge.setReady();
    document.getElementById('btn-ready-guest').textContent = 'Ready! Waiting for host...';
    document.getElementById('btn-ready-guest').disabled = true;
  } catch (error) {
    console.error('Ready error:', error);
    showToast({ title: (window.getText ? window.getText('error') : 'Error'), msg: (window.getText ? window.getText('couldNotSetReady') : 'Could not set ready status'), type: 'error' });
  }
}

// Callback: When opponent joins or updates
window.onRemoteOpponentUpdate = function(opponent) {
  if (!opponent) return;
  
  // Lobby updates
  const statusEl = document.getElementById('remote-opponent-status');
  if (statusEl && document.getElementById('remote-modal').style.display !== 'none') {
    statusEl.textContent = `${opponent.name} has joined! Click Ready when you're set.`;
  }
  
  const btnReady = document.getElementById('btn-ready-host');
  if (btnReady && document.getElementById('remote-modal').style.display !== 'none') {
    btnReady.style.display = 'inline-block';
  }
  
  // In-game score updates
  if (state.mode === 'remote-challenge') {
    // Determine which score element belongs to opponent
    // In remote mode, we can fix P1 as "You" and P2 as "Opponent" visually, 
    // or stick to the P1/P2 slots.
    // Let's stick to P1/P2 slots to match the data structure.
    
    const myPlayerNum = window.RemoteChallenge.playerNumber;
    const opponentPlayerNum = myPlayerNum === 1 ? 2 : 1;
    
    // Update state
    if (state.players && state.players[opponentPlayerNum - 1]) {
      state.players[opponentPlayerNum - 1].score = opponent.score;
      state.players[opponentPlayerNum - 1].name = opponent.name;
    }
    
    // Update UI
    const p1ScoreEl = document.getElementById('p1-score');
    const p2ScoreEl = document.getElementById('p2-score');
    
    if (opponentPlayerNum === 1 && p1ScoreEl) p1ScoreEl.textContent = opponent.score;
    if (opponentPlayerNum === 2 && p2ScoreEl) p2ScoreEl.textContent = opponent.score;
  }
};

// Callback: When room status changes
window.onRemoteRoomStatusChange = function(status) {
  if (status === 'active') {
    // Both players ready - start the quiz!
    hideRemoteModal();
    startRemoteQuiz();
  }
};

// Callback: When questions are ready
window.onRemoteQuestionsReady = function(questions) {
  // Store questions for the quiz
  window.remoteQuizQuestions = questions;
};

// Start the actual remote quiz
async function startRemoteQuiz() {
  showGame();
  gameTitle.textContent = 'Remote Challenge';
  
  // Set up remote quiz mode
  state.mode = 'remote-challenge';
  state.score = 0;
  state.streak = 0;
  state.qnum = 0;
  state.results = [];
  state.paused = false;
  
  // Get room state to set up players
  try {
    const roomState = await window.RemoteChallenge.getRoomState();
    if (roomState && roomState.players) {
      // Convert players object to array
      state.players = Object.entries(roomState.players)
        .sort(([a], [b]) => {
          const numA = parseInt(a.replace('player', ''));
          const numB = parseInt(b.replace('player', ''));
          return numA - numB;
        })
        .map(([key, player]) => player || { name: key, score: 0 });
    }
  } catch (e) {
    console.warn('Could not fetch room state, using defaults', e);
    state.players = [ { name: 'Player 1', score: 0 } ];
  }
  
  // Use questions from Firebase
  if (window.remoteQuizQuestions) {
    state.questions = window.remoteQuizQuestions;
    state.qtotal = state.questions.length;
    qtotalEl.innerText = state.qtotal;
    scoreEl.innerText = state.score;
    streakEl.innerText = state.streak;
    btnNext.disabled = true;
    
    // Hide timer but SHOW challenge status for remote mode
    timerEl.style.display = 'none';
    btnPause.style.display = 'none';
    
    // Show scores
    const challengeStatusEl = document.getElementById('challenge-status');
    if (challengeStatusEl) {
      challengeStatusEl.style.display = 'inline-flex';
      
      // Update names/scores in UI
      const p1ScoreEl = document.getElementById('p1-score');
      const p2ScoreEl = document.getElementById('p2-score');
      const currentPlayerEl = document.getElementById('current-player');
      
      if (p1ScoreEl) p1ScoreEl.textContent = state.players[0].score;
      if (p2ScoreEl) p2ScoreEl.textContent = state.players[1].score;
      
      // In remote mode, "Current Player" indicator is less relevant as both play simultaneously,
      // but we can set it to the user's number
      if (currentPlayerEl) currentPlayerEl.textContent = window.RemoteChallenge.playerNumber;
    }
    
    // Show the quiz interface
    quizEl.style.display = 'block';
    const welcomeMsg = document.getElementById('welcome-message');
    if(welcomeMsg) welcomeMsg.style.display = 'none';
    
    nextQuestion();
    
    showToast({ 
      title: 'Remote Challenge Started!', 
      msg: 'Answer the questions and watch your opponent\'s score!', 
      type: 'info' 
    });
  }
}

// Generate questions for remote mode (called by host)
window.generateRemoteQuestions = function(settings) {
  const count = settings.numQuestions || 10;
  const difficulty = settings.difficulty || 'medium';
  
  // Use existing question generation logic
  const types = ['whoDid','whoMother','occupation','age','event'];
  let pool = filterPeopleByDifficulty(state.people, difficulty);
  
  if (difficulty === 'hard') {
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
      const rawEvent = person.notable_events?.[0] || 'did something notable';
      questions.push({
        type:'whoDid',
        prompt:`Who ${rawEvent}?`,
        answer:person.name,
        choices: generateChoices(person.name, 'name'),
        ref:person.verses
      });
    }else if(t==='whoMother'){
      if(person.mother) {
        questions.push({
          type:'whoMother',
          prompt:`Who is the mother of ${person.name}?`,
          answer:person.mother,
          choices: generateChoices(person.mother, 'mother'),
          ref:person.verses
        });
      }
    }else if(t==='occupation'){
      if(person.occupation) {
        questions.push({
          type:'occupation',
          prompt:`What was ${person.name}'s occupation?`,
          answer:person.occupation,
          choices: generateChoices(person.occupation, 'occupation'),
          ref:person.verses
        });
      }
    }else if(t==='age'){
      if(person.age_notes) {
        questions.push({
          type:'age',
          prompt:`What do we know about ${person.name}'s age?`,
          answer:person.age_notes,
          choices: generateChoices(person.age_notes, 'age'),
          ref:person.verses
        });
      }
    }else if(t==='event'){
      if(person.notable_events && person.notable_events.length>0) {
        const event = person.notable_events[0];
        questions.push({
          type:'event',
          prompt:`Who ${event}?`,
          answer:person.name,
          choices: generateChoices(person.name, 'name'),
          ref:person.verses
        });
      }
    }
  }
  
  // Fill if needed
  let i = 0;
  while(questions.length < count && i < state.people.length){
    const p = state.people[i++];
    const event = p.notable_events?.[0] || 'did something notable';
    questions.push({
      type:'whoDid',
      prompt:`Who ${event}?`,
      answer:p.name,
      choices: generateChoices(p.name, 'name'),
      ref:p.verses
    });
  }
  
  return questions.slice(0, count);
};

// Helper to generate multiple choice options
function generateChoices(correct, type) {
  const choices = [correct];
  const candidates = state.people.filter(p => {
    if (type === 'name') return p.name !== correct;
    if (type === 'mother') return p.name !== correct && Math.random() > 0.5;
    if (type === 'occupation') return p.occupation && p.occupation !== correct;
    if (type === 'age') return p.age_notes && p.age_notes !== correct;
    return true;
  });
  
  shuffle(candidates);
  
  for (let i = 0; i < Math.min(3, candidates.length); i++) {
    if (type === 'name') {
      choices.push(candidates[i].name);
    } else if (type === 'occupation') {
      choices.push(candidates[i].occupation);
    } else if (type === 'age') {
      choices.push(candidates[i].age_notes);
    } else {
      choices.push(candidates[i].name);
    }
  }
  
  // Ensure 4 choices
  while (choices.length < 4) {
    choices.push(`Option ${choices.length + 1}`);
  }
  
  shuffle(choices);
  return choices;
}

// Export functions for use in app.js
if (typeof window !== 'undefined') {
  window.RemoteChallengeUI = {
    show: showRemoteModal,
    hide: hideRemoteModal,
    showStep: showRemoteStep,
    start: startRemoteChallenge,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    copyLink: handleCopyLink,
    shareLink: handleShareLink,
    readyHost: handleReadyHost,
    readyGuest: handleReadyGuest
  };
}
