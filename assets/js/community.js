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
    document.body.classList.remove('light','sepia','high-contrast');
    if(theme && theme!=='dark') document.body.classList.add(theme);
    try{ const s = JSON.parse(localStorage.getItem('settings')||'{}'); s.theme = theme; localStorage.setItem('settings', JSON.stringify(s)); }catch(_){ }
  }
  try{
    const s = JSON.parse(localStorage.getItem('settings')||'{}');
    applyTheme(s.theme||'dark');
    const keyMap = { 'dark':'themeDark','light':'themeLight','sepia':'themeSepia','high-contrast':'themeHighContrast' };
    const label = getText(keyMap[s.theme]||'themeDark');
    if(btnTheme) btnTheme.setAttribute('title', `${getText('toggleTheme')} — ${label}`);
  }catch(_){ applyTheme('dark'); }
  if (btnTheme){
    btnTheme.addEventListener('click', ()=>{
      const THEMES = ['dark','light','sepia','high-contrast'];
      const current = THEMES.find(t=>document.body.classList.contains(t)) || 'dark';
      const next = THEMES[(THEMES.indexOf(current)+1)%THEMES.length];
      applyTheme(next);
      // Set a helpful tooltip with the current theme
      try{
        const keyMap = {
          'dark':'themeDark','light':'themeLight','sepia':'themeSepia','high-contrast':'themeHighContrast'
        };
        const label = getText(keyMap[next]) || next;
        btnTheme.setAttribute('title', `${getText('toggleTheme')} — ${label}`);
      }catch(_){ }
    });
    const themeSelect = document.getElementById('theme-select');
    if(themeSelect){
      try{ themeSelect.value = (document.body.classList.contains('light')?'light':(document.body.classList.contains('sepia')?'sepia':(document.body.classList.contains('high-contrast')?'high-contrast':'dark'))); }catch(_){ }
      themeSelect.addEventListener('change', (e)=>{ applyTheme(e.target.value); });
    }
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

  // Localize static text
  if (typeof window.updateAllText === 'function') {
    window.updateAllText();
  }
})();
