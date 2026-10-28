// Remote Challenge System for Who-Bible
// Handles real-time multiplayer quiz challenges via Firebase

const MAX_PLAYERS = 8; // Maximum players per room

const RemoteChallenge = {
  currentRoom: null,
  playerNumber: null,
  roomRef: null,
  isHost: false,
  
  /**
   * Generate a random room code
   */
  generateRoomCode() {
    const adjectives = ['BRAVE', 'WISE', 'HOLY', 'DIVINE', 'BLESSED', 'MIGHTY', 'FAITH', 'GRACE'];
    const numbers = Math.floor(Math.random() * 1000);
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
    const roomCode = this.generateRoomCode();
    const roomRef = database.ref('rooms/' + roomCode);
    
    const roomData = {
      code: roomCode,
      host: cleanHostName,
      status: 'waiting', // waiting, active, completed
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
    
    await roomRef.set(roomData);
    
    this.currentRoom = cleanRoomCode;
    this.playerNumber = 1;
    this.roomRef = roomRef;
    this.isHost = true;
    
    // Listen for player 2 joining
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
    
    // Security sanitization on roomCode and playerName
    const cleanRoomCode = String(roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 15);
    if (!cleanRoomCode || cleanRoomCode.length < 3) {
      throw new Error('Invalid room code format. Please check the code.');
    }
    const cleanPlayerName = String(playerName || 'Player').trim().replace(/[<>]/g, '').slice(0, 20) || 'Player';

    const database = window.FirebaseConfig.getDatabase();
    const roomRef = database.ref('rooms/' + cleanRoomCode);
    
    // Check if room exists
    const snapshot = await roomRef.once('value');
    if (!snapshot.exists()) {
      throw new Error('Room not found. Please check the code.');
    }
    
    const roomData = snapshot.val();
    
    // Check if room is already completed
    if (roomData.status === 'completed') {
      throw new Error('This room has already finished.');
    }
    
    // Find the next available player slot
    const maxPlayers = roomData.settings?.maxPlayers || MAX_PLAYERS;
    const playerCount = roomData.playerCount || Object.keys(roomData.players).length;
    
    if (playerCount >= maxPlayers) {
      throw new Error(`Room is full. Maximum ${maxPlayers} players allowed.`);
    }
    
    // Find next available player number
    let playerNum = null;
    for (let i = 2; i <= maxPlayers; i++) {
      if (!roomData.players[`player${i}`]) {
        playerNum = i;
        break;
      }
    }
    
    if (!playerNum) {
      throw new Error('Could not find available player slot.');
    }
    
    // Join as the next available player
    await roomRef.child(`players/player${playerNum}`).set({
      name: cleanPlayerName,
      score: 0,
      streak: 0,
      ready: false,
      currentQuestion: 0
    });
    
    // Update player count
    await roomRef.child('playerCount').set(playerCount + 1);
    
    this.currentRoom = roomCode;
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
    await this.roomRef.child(`players/player${this.playerNumber}/ready`).set(true);
  },
  
  /**
   * Generate questions for the room (host only)
   */
  async generateQuestions(settings) {
    if (!this.isHost) return;
    
    // Get the question generation from main app
    if (window.generateRemoteQuestions) {
      const questions = window.generateRemoteQuestions(settings);
      await this.roomRef.child('questions').set(questions);
    }
  },
  
  /**
   * Submit an answer
   */
  async submitAnswer(questionIndex, isCorrect, timeTaken, totalScore, streak) {
    if (!this.roomRef || !this.playerNumber) return;
    
    const playerPath = `players/player${this.playerNumber}`;
    const resultPath = `results/player${this.playerNumber}`;
    
    // Local client is the source of truth for its own points (keeps both screens in sync)
    await this.roomRef.child(playerPath).update({
      score: totalScore || 0,
      streak: streak || 0,
      currentQuestion: questionIndex + 1
    });
    
    // Save result
    const result = {
      questionIndex,
      correct: isCorrect,
      timeTaken,
      timestamp: Date.now()
    };
    
    await this.roomRef.child(`${resultPath}/${questionIndex}`).set(result);
  },
  
  /**
   * Complete the challenge
   */
  async completeChallenge() {
    if (!this.roomRef) return;
    
    await this.roomRef.child(`players/player${this.playerNumber}/finished`).set(true);
    const snapshot = await this.roomRef.once('value');
    const room = snapshot.val() || {};
    const all = Object.values(room.players || {}).filter(Boolean);
    if (all.length && all.every(p => p.finished)) {
      await this.roomRef.child('status').set('completed');
    }
    return room;
  },
  
  /**
   * Reset room for a Rematch
   */
  async requestRematch() {
    if (!this.roomRef) return;
    
    // Reset player scores and ready flags
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
  leaveRoom() {
    if (this.roomRef) {
      this.roomRef.off();
      this.roomRef = null;
    }
    
    this.currentRoom = null;
    this.playerNumber = null;
    this.isHost = false;
  },
  
  /**
   * Get current room state
   */
  async getRoomState() {
    if (!this.roomRef) return null;
    
    const snapshot = await this.roomRef.once('value');
    return snapshot.val();
  },
  
  /**
   * Check if a room code or pin is in URL
   */
  getRoomCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || params.get('pin') || params.get('code');
  }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.RemoteChallenge = RemoteChallenge;
}
