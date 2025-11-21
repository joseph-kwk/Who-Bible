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
      const title = card.querySelector('.card-title')?.textContent || 'Details';
      const desc = card.querySelector('.card-desc')?.textContent || '';
      openCommunityModal(title, `<p>${desc}</p>`);
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
      setAvatarText(p.avatarText || generateAvatarText(p.displayName));
    }catch(_){ setAvatarText('WB'); }
  }
  function saveProfile(){
    const profile = {
      displayName: displayNameInput?.value?.trim() || '',
      avatarText: avatarPreview?.textContent || 'WB',
      locale: (localStorage.getItem('who-bible-language')||'en')
    };
    try{ localStorage.setItem('communityProfile', JSON.stringify(profile)); }catch(_){/* ignore */}
  }
  loadProfile();
  btnGenerateAvatar?.addEventListener('click', ()=>{ setAvatarText(generateAvatarText(displayNameInput?.value)); });
  btnSaveProfile?.addEventListener('click', ()=>{ saveProfile(); showToast({ title: getText('profileSaved')||'Profile saved', type:'success', timeout: 1200 }); });

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

  // Localize static text
  if (typeof window.updateAllText === 'function') {
    window.updateAllText();
  }
})();
