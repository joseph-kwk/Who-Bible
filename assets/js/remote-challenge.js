// Remote Challenge System for Who-Bible
// Handles real-time multiplayer quiz challenges via Firebase

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
  async createRoom(hostName, settings) {
    if (!window.FirebaseConfig?.isAvailable()) {
      throw new Error('Firebase not available. Remote challenges require Firebase configuration.');
    }
    
    const database = window.FirebaseConfig.getDatabase();
    const roomCode = this.generateRoomCode();
    const roomRef = database.ref('rooms/' + roomCode);
    
    const roomData = {
      code: roomCode,
      host: hostName,
      status: 'waiting', // waiting, active, completed
      createdAt: Date.now(),
      settings: {
        difficulty: settings.difficulty || 'medium',
        numQuestions: settings.numQuestions || 10,
        timeLimit: settings.timeLimit || 60
      },
      players: {
        player1: {
          name: hostName,
          score: 0,
          streak: 0,
          ready: false,
          currentQuestion: 0
        },
        player2: null
      },
      questions: null, // Will be set when both players ready
      results: {
        player1: [],
        player2: []
      }
    };
    
    await roomRef.set(roomData);
    
    this.currentRoom = roomCode;
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
    
    const database = window.FirebaseConfig.getDatabase();
    const roomRef = database.ref('rooms/' + roomCode);
    
    // Check if room exists
    const snapshot = await roomRef.once('value');
    if (!snapshot.exists()) {
      throw new Error('Room not found. Please check the code.');
    }
    
    const roomData = snapshot.val();
    
    // Check if room is full
    if (roomData.players.player2 !== null) {
      throw new Error('Room is full. Only 2 players allowed.');
    }
    
    // Check if room is already completed
    if (roomData.status === 'completed') {
      throw new Error('This room has already finished.');
    }
    
    // Join as player 2
    await roomRef.child('players/player2').set({
      name: playerName,
      score: 0,
      streak: 0,
      ready: false,
      currentQuestion: 0
    });
    
    this.currentRoom = roomCode;
    this.playerNumber = 2;
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
  },
  
  /**
   * Mark player as ready
   */
  async setReady() {
    if (!this.roomRef || !this.playerNumber) return;
    
    await this.roomRef.child(`players/player${this.playerNumber}/ready`).set(true);
    
    // If host and both players ready, generate questions
    if (this.isHost) {
      const snapshot = await this.roomRef.once('value');
      const room = snapshot.val();
      
      if (room.players.player1.ready && room.players.player2?.ready) {
        // Both ready - generate questions
        await this.generateQuestions(room.settings);
        await this.roomRef.child('status').set('active');
      }
    }
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
  async submitAnswer(questionIndex, isCorrect, timeTaken) {
    if (!this.roomRef || !this.playerNumber) return;
    
    const playerPath = `players/player${this.playerNumber}`;
    const resultPath = `results/player${this.playerNumber}`;
    
    // Update score
    const snapshot = await this.roomRef.child(playerPath).once('value');
    const player = snapshot.val();
    
    const newScore = isCorrect ? player.score + 1 : player.score;
    const newStreak = isCorrect ? player.streak + 1 : 0;
    
    await this.roomRef.child(playerPath).update({
      score: newScore,
      streak: newStreak,
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
    
    await this.roomRef.child('status').set('completed');
    
    // Get final results
    const snapshot = await this.roomRef.once('value');
    return snapshot.val();
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
   * Check if a room code is in URL
   */
  getRoomCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.RemoteChallenge = RemoteChallenge;
}
