// Remote Challenge System for Who-Bible
// Handles real-time multiplayer quiz challenges via Firebase

const MAX_PLAYERS = 8; // Maximum players per room
const FB_TIMEOUT_MS = 10000;

function withTimeout(promise, ms = FB_TIMEOUT_MS, errorMsg = 'Connection timed out. Please check your internet and try again.') {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timerId));
}

const RemoteChallenge = {
  currentRoom: null,
  playerNumber: null,
  roomRef: null,
  isHost: false,
  _starting: false,
  
  /**
   * Generate a random room code (e.g. FAITH-482)
   */
  generateRoomCode() {
    const adjectives = ['BRAVE', 'WISE', 'HOLY', 'DIVINE', 'BLESSED', 'MIGHTY', 'FAITH', 'GRACE'];
    const numbers = Math.floor(100 + Math.random() * 900);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${adj}-${numbers}`;
  },
  
  /**
   * Create a new challenge room
   */
  async createRoom(hostName, settings = {}) {
    if (!window.FirebaseConfig?.isAvailable()) {
      throw new Error('Firebase not available. Remote challenges require Firebase configuration.');
    }

    // Clean up any prior room listeners first
    this.leaveRoom();
    
    // Security sanitization on hostName
    const cleanHostName = String(hostName || 'Host').trim().replace(/[<>]/g, '').slice(0, 20) || 'Host';

    // Validate settings
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    const difficulty = validDifficulties.includes(settings.difficulty) ? settings.difficulty : 'medium';
    let numQuestions = parseInt(settings.numQuestions, 10) || 10;
    // Guaranteed even question count so all players have equal chances
    numQuestions = Math.min(30, Math.max(6, numQuestions % 2 === 0 ? numQuestions : numQuestions + 1));
    const timeLimit = [15, 30, 60, 90].includes(parseInt(settings.timeLimit, 10)) ? parseInt(settings.timeLimit, 10) : 60;

    const database = window.FirebaseConfig.getDatabase();

    // Generate unique non-colliding room code
    let roomCode = this.generateRoomCode();
    let roomRef = database.ref('rooms/' + roomCode);
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await withTimeout(roomRef.once('value'), FB_TIMEOUT_MS);
      if (!existing.exists() || existing.val()?.status === 'completed' || existing.val()?.status === 'cancelled') {
        break;
      }
      roomCode = this.generateRoomCode();
      roomRef = database.ref('rooms/' + roomCode);
    }
    
    const roomData = {
      code: roomCode,
      host: cleanHostName,
      status: 'waiting', // waiting, active, completed, cancelled
      createdAt: Date.now(),
      settings: {
        difficulty,
        numQuestions,
        timeLimit,
        maxPlayers: MAX_PLAYERS
      },
      players: {
        player1: {
          name: cleanHostName,
          score: 0,
          streak: 0,
          ready: false,
          currentQuestion: 0
        }
      },
      playerCount: 1,
      questions: null, // Will be set when all players ready
      results: {}
    };
    
    await withTimeout(roomRef.set(roomData), FB_TIMEOUT_MS);
    
    this.currentRoom = roomCode;
    this.playerNumber = 1;
    this.roomRef = roomRef;
    this.isHost = true;
    
    // Listen for player 2+ joining
    this.setupRoomListeners();
    
    return {
      roomCode,
      shareUrl: `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    };
  },
  
  /**
   * Join an existing room
   */
  async joinRoom(roomCode, playerName) {
    if (!window.FirebaseConfig?.isAvailable()) {
      throw new Error('Firebase not available');
    }

    // Clean up any prior room listeners first
    this.leaveRoom();
    
    // Security sanitization on roomCode and playerName
    const cleanRoomCode = String(roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 15);
    if (!cleanRoomCode || cleanRoomCode.length < 3) {
      throw new Error('Invalid room code format. Please check the code.');
    }
    const cleanPlayerName = String(playerName || 'Player').trim().replace(/[<>]/g, '').slice(0, 20) || 'Player';

    const database = window.FirebaseConfig.getDatabase();
    const roomRef = database.ref('rooms/' + cleanRoomCode);
    
    // Check if room exists
    const snapshot = await withTimeout(roomRef.once('value'), FB_TIMEOUT_MS);
    if (!snapshot.exists()) {
      throw new Error('Room not found. Please check the code.');
    }
    
    const roomData = snapshot.val();
    
    // Check if room is already completed or cancelled
    if (roomData.status === 'completed') {
      throw new Error('This room has already finished.');
    }
    if (roomData.status === 'cancelled') {
      throw new Error('The host closed this room.');
    }
    if (roomData.status === 'active') {
      throw new Error('This match is already in progress.');
    }
    
    // Find the next available player slot
    const maxPlayers = roomData.settings?.maxPlayers || MAX_PLAYERS;
    const playersObj = roomData.players || {};
    const activePlayersCount = Object.keys(playersObj).filter(k => playersObj[k]).length;
    
    if (activePlayersCount >= maxPlayers) {
      throw new Error(`Room is full. Maximum ${maxPlayers} players allowed.`);
    }
    
    // Find next available player number
    let playerNum = null;
    for (let i = 2; i <= maxPlayers; i++) {
      if (!playersObj[`player${i}`]) {
        playerNum = i;
        break;
      }
    }
    
    if (!playerNum) {
      throw new Error('Could not find available player slot.');
    }
    
    // Join as the next available player
    await withTimeout(roomRef.child(`players/player${playerNum}`).set({
      name: cleanPlayerName,
      score: 0,
      streak: 0,
      ready: false,
      currentQuestion: 0
    }), FB_TIMEOUT_MS);
    
    // Update player count
    await roomRef.child('playerCount').set(activePlayersCount + 1);
    
    this.currentRoom = cleanRoomCode;
    this.playerNumber = playerNum;
    this.roomRef = roomRef;
    this.isHost = false;
    
    this.setupRoomListeners();
    
    return roomData;
  },
  
  /**
   * Set up real-time listeners for room updates
   */
  setupRoomListeners() {
    if (!this.roomRef) return;
    
    // Listen for room status changes
    this.roomRef.child('status').on('value', (snapshot) => {
      const status = snapshot.val();
      if (window.onRemoteRoomStatusChange) {
        window.onRemoteRoomStatusChange(status);
      }
    });
    
    // Listen for opponent updates
    const opponentNum = this.playerNumber === 1 ? 2 : 1;
    this.roomRef.child(`players/player${opponentNum}`).on('value', (snapshot) => {
      const opponent = snapshot.val();
      if (window.onRemoteOpponentUpdate) {
        window.onRemoteOpponentUpdate(opponent);
      }
    });
    
    // Listen for questions being set (when both players ready)
    this.roomRef.child('questions').on('value', (snapshot) => {
      const questions = snapshot.val();
      if (questions && window.onRemoteQuestionsReady) {
        window.onRemoteQuestionsReady(questions);
      }
    });

    // Host watches the whole roster so the match starts no matter who readies last
    if (this.isHost) {
      this._starting = false;
      this.roomRef.child('players').on('value', (snapshot) => {
        const players = snapshot.val() || {};
        if (window.onRemotePlayersUpdate) window.onRemotePlayersUpdate(players);
        this.tryStartMatch(players);
      });
    } else {
      this.roomRef.child('players').on('value', (snapshot) => {
        if (window.onRemotePlayersUpdate) window.onRemotePlayersUpdate(snapshot.val() || {});
      });
    }
  },

  async tryStartMatch(players) {
    if (!this.isHost || this._starting || !this.roomRef) return;
    const list = Object.values(players || {}).filter(Boolean);
    if (list.length < 2 || !list.every(p => p.ready)) return;
    const statusSnap = await this.roomRef.child('status').once('value');
    if (statusSnap.val() === 'active') return;
    this._starting = true;
    try {
      const settingsSnap = await this.roomRef.child('settings').once('value');
      await this.generateQuestions(settingsSnap.val() || {});
      await this.roomRef.child('status').set('active');
    } finally {
      this._starting = false;
    }
  },
  
  /**
   * Mark player as ready
   */
  async setReady() {
    if (!this.roomRef || !this.playerNumber) return;
    await withTimeout(this.roomRef.child(`players/player${this.playerNumber}/ready`).set(true), FB_TIMEOUT_MS);
  },
  
  /**
   * Generate questions for the room (host only)
   */
  async generateQuestions(settings) {
    if (!this.isHost || !this.roomRef) return;
    
    if (window.generateRemoteQuestions) {
      const questions = window.generateRemoteQuestions(settings);
      await withTimeout(this.roomRef.child('questions').set(questions), FB_TIMEOUT_MS);
    }
  },
  
  /**
   * Submit an answer
   */
  async submitAnswer(questionIndex, isCorrect, timeTaken, totalScore, streak) {
    if (!this.roomRef || !this.playerNumber) return;
    
    const playerPath = `players/player${this.playerNumber}`;
    const resultPath = `results/player${this.playerNumber}`;
    
    try {
      await this.roomRef.child(playerPath).update({
        score: totalScore || 0,
        streak: streak || 0,
        currentQuestion: questionIndex + 1
      });
      
      const result = {
        questionIndex,
        correct: isCorrect,
        timeTaken,
        timestamp: Date.now()
      };
      
      await this.roomRef.child(`${resultPath}/${questionIndex}`).set(result);
    } catch (err) {
      console.warn('Could not sync remote answer:', err);
    }
  },
  
  /**
   * Complete the challenge
   */
  async completeChallenge() {
    if (!this.roomRef || !this.playerNumber) return null;
    
    try {
      await this.roomRef.child(`players/player${this.playerNumber}/finished`).set(true);
      const snapshot = await this.roomRef.once('value');
      const room = snapshot.val() || {};
      const all = Object.values(room.players || {}).filter(Boolean);
      if (all.length && all.every(p => p.finished)) {
        await this.roomRef.child('status').set('completed');
      }
      return room;
    } catch (err) {
      console.warn('Could not complete remote challenge:', err);
      return null;
    }
  },
  
  /**
   * Reset room for a Rematch
   */
  async requestRematch() {
    if (!this.roomRef) return;
    
    const snapshot = await this.roomRef.once('value');
    const room = snapshot.val();
    if (!room) return;
    
    const updates = {
      status: 'waiting',
      results: null
    };
    
    Object.keys(room.players || {}).forEach(key => {
      updates[`players/${key}/score`] = 0;
      updates[`players/${key}/streak`] = 0;
      updates[`players/${key}/currentQuestion`] = 0;
      updates[`players/${key}/ready`] = false;
      updates[`players/${key}/finished`] = false;
    });
    
    await this.roomRef.update(updates);
    
    if (this.isHost) {
      await this.generateQuestions(room.settings || {});
    }
  },

  /**
   * Leave room and clean up listeners
   */
  leaveRoom(notifyRoom = true) {
    const ref = this.roomRef;
    const wasHost = this.isHost;
    const pNum = this.playerNumber;

    if (ref) {
      ref.off();
      if (notifyRoom) {
        ref.child('status').once('value').then((snap) => {
          const st = snap.val();
          if (st === 'waiting') {
            if (wasHost) {
              ref.child('status').set('cancelled').catch(() => {});
            } else if (pNum && pNum > 1) {
              ref.child(`players/player${pNum}`).remove().catch(() => {});
            }
          }
        }).catch(() => {});
      }
      this.roomRef = null;
    }
    
    this.currentRoom = null;
    this.playerNumber = null;
    this.isHost = false;
    this._starting = false;
  },
  
  /**
   * Get current room state
   */
  async getRoomState() {
    if (!this.roomRef) return null;
    
    const snapshot = await withTimeout(this.roomRef.once('value'), FB_TIMEOUT_MS);
    return snapshot.val();
  },
  
  /**
   * Check if a room code is in URL
   */
  getRoomCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || params.get('code');
  }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.RemoteChallenge = RemoteChallenge;
}
