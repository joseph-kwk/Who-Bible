// Community page bootstrap: reuse app.js community helpers minimally without game setup.
(function(){
  // Minimal utilities copied from app.js
  const toastContainer = document.getElementById('toast-container');
  function showToast({ title, msg = '', type = 'info', timeout = 2000 }){
    if(!toastContainer) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-title">${title||''}</div>${msg?`<div class="toast-msg">${msg}</div>`:''}`;
    toastContainer.appendChild(el);
    setTimeout(()=>{ el.classList.add('show'); }, 10);
    setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(), 300); }, timeout);
  }

  // i18n helpers
  function getText(key, params={}){
    try{
      const lang = localStorage.getItem('who-bible-language')||'en';
      const t = (window.TRANSLATIONS && (window.TRANSLATIONS[lang]||window.TRANSLATIONS['en'])) || {};
      let text = t[key] || key;
      Object.keys(params).forEach(k=>{ text = text.replace(`{${k}}`, params[k]); });
      return text;
    }catch(_){ return key; }
  }

  // Restore year
  const fy = document.getElementById('footer-year');
  if (fy) fy.textContent = String(new Date().getFullYear());

  // Theme toggle re-use
  const btnTheme = document.getElementById('btn-theme');
  function applyTheme(theme){
    // Remove all theme classes first
    document.body.classList.remove('day', 'night');
    
    // Apply the new theme
    if(theme === 'day') {
      document.body.classList.add('day');
    } else {
      // Default to night theme
      document.body.classList.add('night');
      theme = 'night'; // Normalize to night if invalid theme
    }
    
    try{ 
      const s = JSON.parse(localStorage.getItem('settings')||'{}'); 
      s.theme = theme; 
      localStorage.setItem('settings', JSON.stringify(s)); 
    }catch(_){ }
  }
  
  try{
    const s = JSON.parse(localStorage.getItem('settings')||'{}');
    applyTheme(s.theme||'night');
    const keyMap = { 'night':'themeNight','day':'themeDay' };
    const label = getText(keyMap[s.theme]||'themeNight');
    if(btnTheme) btnTheme.setAttribute('title', `${getText('toggleTheme')} — ${label}`);
  }catch(_){ applyTheme('night'); }
  
  if (btnTheme){
    btnTheme.addEventListener('click', ()=>{
      const THEMES = ['night','day'];
      const current = document.body.classList.contains('day') ? 'day' : 'night';
      const next = THEMES[(THEMES.indexOf(current)+1)%THEMES.length];
      applyTheme(next);
      // Set a helpful tooltip with the current theme
      try{
        const label = next === 'day' ? 'Day' : 'Night';
        btnTheme.setAttribute('title', `Toggle theme — ${label}`);
      }catch(_){}
    });
  }

  // Share functionality
  const btnShare = document.getElementById('btn-share');
  if (btnShare) {
    btnShare.addEventListener('click', async ()=>{
      const url = window.location.href;
      const text = getText('shareText') || 'Check out Who-Bible Community!';
      if(navigator.share){
        try{ await navigator.share({ title: 'Who-Bible', text, url }); }
        catch(_){ /* user cancelled */ }
      } else if(navigator.clipboard?.writeText){
        try{
          await navigator.clipboard.writeText(url);
          showToast({ title: getText('linkCopied') || 'Link copied', msg: getText('linkCopiedMsg') || 'Link copied to clipboard', type: 'success', timeout: 1500 });
        }catch(_){
          showToast({ title: getText('shareError') || 'Error', msg: getText('shareErrorMsg') || 'Could not share', type: 'error' });
        }
      }
    });
  }

  // Language selector
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    try {
      const currentLang = localStorage.getItem('who-bible-language') || 'en';
      langSelect.value = currentLang;
    } catch(_) {}
    
    langSelect.addEventListener('change', (e)=>{
      const lang = e.target.value;
      try {
        localStorage.setItem('who-bible-language', lang);
        // Reload translations if available
        if (window.loadLanguage) {
          window.loadLanguage(lang);
        } else {
          // Fallback: reload page to apply new language
          window.location.reload();
        }
      } catch(_) {}
    });
  }

  // Wire community behaviors similar to app.js
  const featured = document.getElementById('featured-rooms');
  const communityModal = document.getElementById('community-modal');
  const communityModalTitle = document.getElementById('community-modal-title');
  const communityModalBody = document.getElementById('community-modal-body');
  const btnCommunityClose = document.getElementById('btn-community-close');
  const btnCommunityOk = document.getElementById('btn-community-ok');

  function openCommunityModal(title, html){
    if(communityModalTitle) communityModalTitle.textContent = title;
    if(communityModalBody) communityModalBody.innerHTML = html||'';
    if(communityModal) communityModal.style.display = 'flex';
  }
  function closeCommunityModal(){ if(communityModal) communityModal.style.display = 'none'; }
  btnCommunityClose?.addEventListener('click', closeCommunityModal);
  btnCommunityOk?.addEventListener('click', closeCommunityModal);

  if (featured) {
    featured.addEventListener('click', (e)=>{
      const card = e.target.closest('.card');
      if(!card) return;
      const feature = card.dataset.feature;
      const title = card.querySelector('.card-title')?.textContent || 'Details';
      const desc = card.querySelector('.card-desc')?.textContent || '';
      
      let html = `<p>${desc}</p>`;
      
      // Add specific actions based on feature
      if (feature === 'spotlight') {
        html += `<p style="margin-top: 16px;"><a href="index.html" class="primary" style="text-decoration: none; display: inline-block; padding: 10px 20px; border-radius: 8px; background: var(--accent); color: white;">Explore in Study Mode</a></p>`;
      } else if (feature === 'challenges') {
        html += `<p style="margin-top: 16px;"><a href="index.html" class="primary" style="text-decoration: none; display: inline-block; padding: 10px 20px; border-radius: 8px; background: var(--accent); color: white;">Start a Challenge</a></p>`;
      } else if (feature === 'study') {
        html += `<p style="margin-top: 16px;"><a href="index.html" class="primary" style="text-decoration: none; display: inline-block; padding: 10px 20px; border-radius: 8px; background: var(--accent); color: white;">Browse Study Mode</a></p>`;
      } else if (feature === 'remote') {
        html += `<p style="margin-top: 16px;"><a href="index.html" class="primary" style="text-decoration: none; display: inline-block; padding: 10px 20px; border-radius: 8px; background: var(--accent); color: white;">Create Remote Room</a></p>`;
      }
      
      openCommunityModal(title, html);
    });
  }

  // Tabs
  const tabs = [
    { btn: document.getElementById('tab-explore'), sec: document.getElementById('section-explore') },
    { btn: document.getElementById('tab-live'), sec: document.getElementById('section-live') },
    { btn: document.getElementById('tab-profile'), sec: document.getElementById('section-profile') },
    { btn: document.getElementById('tab-guidelines'), sec: document.getElementById('section-guidelines') },
  ];
  function setActive(tab){
    tabs.forEach(({btn,sec})=>{
      if(!btn||!sec) return;
      const active = (btn===tab);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true':'false');
      sec.style.display = active ? 'block' : 'none';
    });
  }
  tabs.forEach(({btn})=>btn&&btn.addEventListener('click', ()=>setActive(btn)));

  // Profile simple handlers (initials)
  const avatarPreview = document.getElementById('avatar-preview');
  const btnGenerateAvatar = document.getElementById('btn-generate-avatar');
  const displayNameInput = document.getElementById('display-name');
  const profileBioTextarea = document.getElementById('profile-bio');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  
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
  function setAvatarText(txt){ if(avatarPreview) avatarPreview.textContent = (txt||'WB'); }
  
  function loadProfile(){
    try{
      const txt = localStorage.getItem('communityProfile');
      if(!txt) { setAvatarText('WB'); return; }
      const p = JSON.parse(txt);
      if(displayNameInput) displayNameInput.value = p.displayName || '';
      if(profileBioTextarea) profileBioTextarea.value = p.bio || '';
      setAvatarText(p.avatarText || generateAvatarText(p.displayName));
    }catch(_){ setAvatarText('WB'); }
  }
  
  function saveProfile(){
    const profile = {
      displayName: displayNameInput?.value?.trim() || '',
      bio: profileBioTextarea?.value?.trim() || '',
      avatarText: avatarPreview?.textContent || 'WB',
      locale: (localStorage.getItem('who-bible-language')||'en')
    };
    try{ localStorage.setItem('communityProfile', JSON.stringify(profile)); }catch(_){/* ignore */}
  }
  
  function loadUserStats() {
    // Load stats from localStorage (from main app)
    try {
      // Get results from main app
      const resultsStr = localStorage.getItem('who-bible-results');
      const results = resultsStr ? JSON.parse(resultsStr) : [];
      
      const quizzesPlayed = results.length;
      const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score || 0)) : 0;
      const bestStreak = results.length > 0 ? Math.max(...results.map(r => r.streak || 0)) : 0;
      
      const quizzesEl = document.getElementById('user-quizzes-played');
      const scoreEl = document.getElementById('user-best-score');
      const streakEl = document.getElementById('user-streak');
      
      if (quizzesEl) quizzesEl.textContent = quizzesPlayed;
      if (scoreEl) scoreEl.textContent = bestScore;
      if (streakEl) streakEl.textContent = bestStreak;
    } catch(_) {
      // Ignore errors
    }
  }
  
  loadProfile();
  loadUserStats();
  
  btnGenerateAvatar?.addEventListener('click', ()=>{ setAvatarText(generateAvatarText(displayNameInput?.value)); });
  btnSaveProfile?.addEventListener('click', ()=>{ 
    saveProfile(); 
    showToast({ title: getText('profileSaved')||'Profile saved', type:'success', timeout: 1200 }); 
  });

  // Room creation
  const btnCreateRoom = document.getElementById('btn-create-room');
  const roomNameInput = document.getElementById('room-name');
  const myRoomsContainer = document.getElementById('my-rooms');
  
  function loadMyRooms() {
    if (!myRoomsContainer) return;
    try {
      const rooms = JSON.parse(localStorage.getItem('communityRooms') || '[]');
      myRoomsContainer.innerHTML = '';
      
      if (rooms.length === 0) {
        myRoomsContainer.innerHTML = '<p class="muted">No rooms yet. Create one above!</p>';
        return;
      }
      
      rooms.forEach((room, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-title">${room.name}</div>
          <div class="card-desc">Created ${new Date(room.created).toLocaleDateString()}</div>
          <button class="small-btn delete-room" data-idx="${idx}" style="margin-top: 8px;">Delete</button>
        `;
        myRoomsContainer.appendChild(card);
      });
      
      // Add delete handlers
      myRoomsContainer.querySelectorAll('.delete-room').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx);
          deleteRoom(idx);
        });
      });
    } catch(_) {
      myRoomsContainer.innerHTML = '<p class="muted">Error loading rooms</p>';
    }
  }
  
  function createRoom() {
    const name = roomNameInput?.value?.trim();
    if (!name) {
      showToast({ title: getText('error') || 'Error', msg: 'Please enter a room name', type: 'error', timeout: 1500 });
      return;
    }
    
    try {
      const rooms = JSON.parse(localStorage.getItem('communityRooms') || '[]');
      rooms.push({
        name: name,
        created: new Date().toISOString(),
        owner: displayNameInput?.value?.trim() || 'Anonymous'
      });
      localStorage.setItem('communityRooms', JSON.stringify(rooms));
      
      if (roomNameInput) roomNameInput.value = '';
      loadMyRooms();
      showToast({ title: getText('success') || 'Success', msg: `Room "${name}" created!`, type: 'success', timeout: 2000 });
    } catch(_) {
      showToast({ title: getText('error') || 'Error', msg: 'Could not create room', type: 'error', timeout: 1500 });
    }
  }
  
  function deleteRoom(idx) {
    try {
      const rooms = JSON.parse(localStorage.getItem('communityRooms') || '[]');
      const roomName = rooms[idx]?.name || 'this room';
      rooms.splice(idx, 1);
      localStorage.setItem('communityRooms', JSON.stringify(rooms));
      loadMyRooms();
      showToast({ title: getText('deleted') || 'Deleted', msg: `Removed "${roomName}"`, type: 'info', timeout: 1500 });
    } catch(_) {
      showToast({ title: getText('error') || 'Error', msg: 'Could not delete room', type: 'error', timeout: 1500 });
    }
  }
  
  btnCreateRoom?.addEventListener('click', createRoom);
  roomNameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createRoom();
  });
  
  // Load rooms on page load
  loadMyRooms();

  // =========================
  // Firebase Live Rooms Integration
  // =========================
  let liveRoomsListener = null;
  const liveRoomsList = document.getElementById('live-rooms-list');
  
  function setupLiveRoomsListener() {
    // Check if Firebase is available
    if (typeof FirebaseConfig === 'undefined' || !FirebaseConfig.isFirebaseAvailable || !FirebaseConfig.isFirebaseAvailable()) {
      if (liveRoomsList) {
        liveRoomsList.innerHTML = '<div class="card"><div class="card-desc">Firebase not configured. Live rooms unavailable.</div></div>';
      }
      return;
    }
    
    try {
      const db = FirebaseConfig.getDatabase();
      const roomsRef = db.ref('rooms');
      
      // Listen for all active rooms
      liveRoomsListener = roomsRef.on('value', (snapshot) => {
        const rooms = snapshot.val();
        displayLiveRooms(rooms);
      });
      
    } catch (error) {
      console.error('Firebase error:', error);
      if (liveRoomsList) {
        liveRoomsList.innerHTML = '<div class="card"><div class="card-desc">Error loading live rooms. Please refresh.</div></div>';
      }
    }
  }
  
  function displayLiveRooms(rooms) {
    if (!liveRoomsList) return;
    
    // Clear current display
    liveRoomsList.innerHTML = '';
    
    if (!rooms) {
      liveRoomsList.innerHTML = '<div class="card"><div class="card-desc muted">No live rooms available. Create one to get started!</div></div>';
      return;
    }
    
    // Filter to only show active (non-completed) rooms
    const activeRooms = Object.entries(rooms).filter(([_, room]) => {
      return room.status !== 'completed' && room.status !== 'abandoned';
    });
    
    if (activeRooms.length === 0) {
      liveRoomsList.innerHTML = '<div class="card"><div class="card-desc muted">No active rooms right now. Be the first to create one!</div></div>';
      return;
    }
    
    // Display each room
    activeRooms.forEach(([roomCode, room]) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cursor = 'pointer';
      card.dataset.roomCode = roomCode;
      
      const hostName = room.host?.name || 'Unknown Host';
      const playerCount = room.players ? Object.keys(room.players).length : 0;
      const statusText = room.status === 'ready' ? '🎮 Ready' : room.status === 'waiting' ? '⏳ Waiting' : '🎯 In Progress';
      const settings = room.settings || {};
      const difficulty = settings.difficulty || 'medium';
      const questionCount = settings.questionCount || 10;
      
      card.innerHTML = `
        <div class="card-title">🏆 ${roomCode}</div>
        <div class="card-desc">
          <div style="margin-bottom: 4px;">Host: <strong>${hostName}</strong></div>
          <div style="margin-bottom: 4px;">Players: ${playerCount}/2 | ${statusText}</div>
          <div style="font-size: 0.9em; color: var(--color-text-secondary);">
            ${questionCount} questions • ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
        </div>
      `;
      
      // Make clickable to view or join
      card.addEventListener('click', () => {
        viewRoomDetails(roomCode, room);
      });
      
      liveRoomsList.appendChild(card);
    });
  }
  
  function viewRoomDetails(roomCode, room) {
    const hostName = room.host?.name || 'Unknown';
    const playerCount = room.players ? Object.keys(room.players).length : 0;
    const statusText = room.status || 'waiting';
    const settings = room.settings || {};
    
    const html = `
      <div style="margin-bottom: 16px;">
        <h4 style="margin-top: 0;">Room: ${roomCode}</h4>
        <p><strong>Host:</strong> ${hostName}</p>
        <p><strong>Status:</strong> ${statusText}</p>
        <p><strong>Players:</strong> ${playerCount}/2</p>
        <p><strong>Settings:</strong> ${settings.questionCount || 10} questions, ${settings.difficulty || 'medium'} difficulty</p>
      </div>
      <div style="margin-top: 16px;">
        <p style="color: var(--color-text-secondary); font-size: 0.9em;">
          To join this room, go to the main app and use "Remote Challenge" with room code: <strong>${roomCode}</strong>
        </p>
        <button onclick="window.location.href='index.html?room=${roomCode}'" class="primary" style="margin-top: 12px;">
          Join Room in App
        </button>
      </div>
    `;
    
    openCommunityModal('Room Details', html);
  }
  
  // Setup Firebase listener when on Live tab
  document.getElementById('tab-live')?.addEventListener('click', () => {
    if (!liveRoomsListener) {
      setupLiveRoomsListener();
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (liveRoomsListener && typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
      try {
        const db = FirebaseConfig.getDatabase();
        db.ref('rooms').off('value', liveRoomsListener);
      } catch(_) {}
    }
  });

  // Localize static text
  if (typeof window.updateAllText === 'function') {
    window.updateAllText();
  }
})();
