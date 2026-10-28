// Remote Challenge UI Integration for Who-Bible
// Handles the lobby modal (create / join / ready) and hands the match to app.js via window.WB

(function () {
  const $ = (id) => document.getElementById(id);
  const toast = (o) => (window.showToast ? window.showToast(o) : console.log(o.title, o.msg));
  const myName = () => (window.WB && window.WB.state.currentPlayer && window.WB.state.currentPlayer.name) || 'Player';

  let matchStarted = false;

  function showRemoteStep(step) {
    ['remote-step-1', 'remote-step-create', 'remote-step-share', 'remote-step-join', 'remote-step-joined']
      .forEach((id) => { const el = $(id); if (el) el.style.display = 'none'; });
    const map = { '1': 'remote-step-1', create: 'remote-step-create', share: 'remote-step-share', join: 'remote-step-join', joined: 'remote-step-joined' };
    const el = $(map[step]);
    if (el) el.style.display = 'block';
    const back = $('btn-remote-back');
    if (back) back.style.display = (step === 'create' || step === 'join') ? 'inline-flex' : 'none';
    const focusMap = { create: 'remote-host-name', join: 'remote-room-code-input' };
    if (focusMap[step]) setTimeout(() => $(focusMap[step])?.focus(), 60);
  }

  function resetLobbyButtons() {
    const h = $('btn-ready-host'), g = $('btn-ready-guest');
    if (h) { h.disabled = false; h.textContent = "I'm Ready — Start!"; h.style.display = 'none'; }
    if (g) { g.disabled = false; g.textContent = "I'm Ready!"; }
    const roster = $('remote-roster'); if (roster) roster.innerHTML = '';
    const st = $('remote-opponent-status'); if (st) st.textContent = 'Waiting for a friend to join…';
  }

  function showRemoteModal() {
    const modal = $('remote-modal');
    if (!modal) return;
    matchStarted = false;
    resetLobbyButtons();
    modal.style.display = 'flex';
    const hostInput = $('remote-host-name'), joinInput = $('remote-join-name');
    if (hostInput && !hostInput.value) hostInput.value = myName();
    if (joinInput && !joinInput.value) joinInput.value = myName();
    showRemoteStep('1');
  }

  // Close lobby. leave=true abandons the room (user cancelled); false keeps the connection (match starting).
  function hideRemoteModal(leave = true) {
    const modal = $('remote-modal');
    if (modal) modal.style.display = 'none';
    if (leave && !matchStarted && window.RemoteChallenge) window.RemoteChallenge.leaveRoom();
  }

  function startRemoteChallenge() {
    if (!window.FirebaseConfig?.isAvailable()) {
      toast({ title: 'Online play unavailable', msg: 'Could not reach the game server. Check your connection and try again.', type: 'error', timeout: 4000 });
      return;
    }
    showRemoteModal();
  }

  function handleSaveHostName() {
    const v = $('remote-host-name')?.value.trim();
    if (!v) { toast({ title: 'Name required', msg: 'Please enter your name', type: 'error' }); return; }
    toast({ title: 'Name saved', msg: `Ready as ${v}`, type: 'success', timeout: 1400 });
  }
  function handleSaveJoinName() {
    const v = $('remote-join-name')?.value.trim();
    if (!v) { toast({ title: 'Name required', msg: 'Please enter your name', type: 'error' }); return; }
    toast({ title: 'Name saved', msg: `Ready as ${v}`, type: 'success', timeout: 1400 });
  }

  async function handleCreateRoom() {
    const btn = $('btn-create-room-confirm');
    const hostName = $('remote-host-name')?.value.trim() || myName();
    if (btn) { btn.disabled = true; btn.textContent = 'Creating room…'; }
    try {
      const diffEl = document.querySelector('#remote-host-diff-pills .modal-pill.active');
      const qcountEl = document.querySelector('#remote-host-qcount-pills .modal-pill.active');
      const timerEl = document.querySelector('#remote-host-timer-pills .modal-pill.active');

      const settings = {
        difficulty: diffEl?.dataset.value || $('difficulty')?.value || 'medium',
        numQuestions: parseInt(qcountEl?.dataset.value, 10) || parseInt($('num-questions')?.value, 10) || 10,
        timeLimit: parseInt(timerEl?.dataset.value, 10) || parseInt($('time-limit')?.value, 10) || 60
      };
      const result = await window.RemoteChallenge.createRoom(hostName, settings);
      showRemoteStep('share');
      $('remote-room-code').textContent = result.roomCode;
      $('remote-share-url').textContent = result.shareUrl;
      const qr = $('remote-qr-code-img');
      if (qr) {
        qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.shareUrl)}&margin=8`;
        qr.style.display = 'block';
      }
      window.currentRemoteShareUrl = result.shareUrl;
      toast({ title: 'Room created!', msg: `Code: ${result.roomCode}`, type: 'success' });
    } catch (err) {
      console.error('Create room error:', err);
      toast({ title: 'Could not create room', msg: err.message || 'Please try again', type: 'error' });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Create Room & Get Link'; }
    }
  }

  async function handleJoinRoom() {
    const roomCode = $('remote-room-code-input')?.value.trim().toUpperCase();
    const playerName = $('remote-join-name')?.value.trim() || myName();
    if (!roomCode) { toast({ title: 'Room code required', msg: 'Enter the code your friend shared (e.g. FAITH-123)', type: 'error' }); return; }
    const btn = $('btn-join-room-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }
    try {
      const roomData = await window.RemoteChallenge.joinRoom(roomCode, playerName);
      showRemoteStep('joined');
      $('remote-joined-code').textContent = roomCode;
      $('remote-host-name-display').textContent = roomData.host;
      if ($('remote-joined-settings') && roomData.settings) {
        const d = (roomData.settings.difficulty || 'medium').toUpperCase();
        const q = roomData.settings.numQuestions || 10;
        const t = roomData.settings.timeLimit || 60;
        $('remote-joined-settings').textContent = `${d} • ${q} Questions • ${t}s Timer`;
      }
      toast({ title: 'Joined!', msg: `You're in ${roomData.host}'s room`, type: 'success' });
    } catch (err) {
      console.error('Join room error:', err);
      toast({ title: 'Could not join', msg: err.message || 'Please check the code', type: 'error' });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Join Challenge'; }
    }
  }

  async function handleCopyLink() {
    const url = window.currentRemoteShareUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', msg: 'Send it to a friend to join', type: 'success', timeout: 1600 });
    } catch (_) {
      toast({ title: 'Copy failed', msg: url, type: 'error', timeout: 5000 });
    }
  }

  async function handleShareLink() {
    const url = window.currentRemoteShareUrl;
    const code = $('remote-room-code')?.textContent || '';
    if (!url) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'Join my Who-Bible challenge!', text: `📖 Think you know the Bible? Join my Who-Bible match — room ${code}`, url }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    handleCopyLink();
  }

  async function setReady(btnId, waitingText) {
    const btn = $(btnId);
    try {
      if (btn) { btn.disabled = true; btn.textContent = waitingText; }
      await window.RemoteChallenge.setReady();
    } catch (err) {
      console.error('Ready error:', err);
      if (btn) { btn.disabled = false; btn.textContent = "I'm Ready!"; }
      toast({ title: 'Error', msg: 'Could not set ready status', type: 'error' });
    }
  }
  const handleReadyHost = () => setReady('btn-ready-host', 'Ready ✓ — waiting for others…');
  const handleReadyGuest = () => setReady('btn-ready-guest', 'Ready ✓ — waiting for host…');

  // Live roster in the lobby
  window.onRemotePlayersUpdate = function (players) {
    const list = Object.entries(players || {}).filter(([, p]) => p)
      .sort(([a], [b]) => parseInt(a.replace('player', ''), 10) - parseInt(b.replace('player', ''), 10));
    const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const html = list.map(([, p]) => `<li class="roster-item ${p.ready ? 'is-ready' : ''}"><span class="roster-dot"></span><span class="roster-name">${esc(p.name)}</span><span class="roster-state">${p.ready ? 'Ready' : 'Joined'}</span></li>`).join('');
    ['remote-roster', 'remote-roster-guest'].forEach((id) => { const el = $(id); if (el) el.innerHTML = html; });

    const others = list.length - 1;
    const st = $('remote-opponent-status');
    if (st) st.textContent = others > 0 ? `${others} friend${others > 1 ? 's' : ''} joined. Tap Ready when everyone is set.` : 'Waiting for a friend to join…';
    const hb = $('btn-ready-host');
    if (hb && others > 0 && !hb.disabled) hb.style.display = 'inline-flex';

    // In-game: keep opponent scores live
    if (matchStarted && window.WB) window.WB.updateRemoteScores(list.map(([, p]) => p));
  };

  window.onRemoteOpponentUpdate = function () { /* superseded by onRemotePlayersUpdate */ };

  window.onRemoteQuestionsReady = function (questions) {
    window.remoteQuizQuestions = Array.isArray(questions) ? questions : Object.values(questions || {});
  };

  window.onRemoteRoomStatusChange = function (status) {
    if (status === 'active' && !matchStarted) {
      matchStarted = true;
      hideRemoteModal(false);
      startRemoteQuiz();
    } else if (status === 'completed' && window.WB) {
      window.WB.onRemoteMatchComplete();
    }
  };

  async function startRemoteQuiz() {
    let questions = window.remoteQuizQuestions;
    let players = [];
    try {
      const room = await window.RemoteChallenge.getRoomState();
      if (room) {
        if (!questions && room.questions) questions = Array.isArray(room.questions) ? room.questions : Object.values(room.questions);
        players = Object.entries(room.players || {}).filter(([, p]) => p)
          .sort(([a], [b]) => parseInt(a.replace('player', ''), 10) - parseInt(b.replace('player', ''), 10))
          .map(([, p]) => p);
      }
    } catch (e) { console.warn('Could not fetch room state', e); }

    if (!questions || !questions.length) {
      toast({ title: 'Sync problem', msg: 'Questions did not arrive. Please create a new room.', type: 'error' });
      matchStarted = false;
      return;
    }
    window.WB.startRemoteMatch(questions, players, (window.RemoteChallenge.playerNumber || 1) - 1);
  }

  // Host generates the shared question set using the same engine as solo play
  window.generateRemoteQuestions = function (settings) {
    return window.WB.buildSharedQuestions(settings.numQuestions || 10, settings.difficulty || 'medium');
  };

  
  // Modal pill selector helper
  function setupRemotePills() {
    ['remote-host-diff-pills', 'remote-host-qcount-pills', 'remote-host-timer-pills'].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.modal-pill');
        if (!btn) return;
        container.querySelectorAll('.modal-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  document.addEventListener('DOMContentLoaded', setupRemotePills);
  
  window.RemoteChallengeUI = {
    show: showRemoteModal,
    hide: () => hideRemoteModal(true),
    showStep: showRemoteStep,
    start: startRemoteChallenge,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    copyLink: handleCopyLink,
    shareLink: handleShareLink,
    readyHost: handleReadyHost,
    readyGuest: handleReadyGuest,
    saveHostName: handleSaveHostName,
    saveJoinName: handleSaveJoinName,
    isMatchActive: () => matchStarted,
    endMatch: () => { matchStarted = false; }
  };
})();
