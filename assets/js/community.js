// Community page bootstrap: reuse app.js community helpers minimally without game setup.
(function(){
  let locationsInitialized = false;
  let conceptsInitialized = false;

  // XSS Protection: Sanitize user-generated content
  function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Profanity filter for usernames
  const PROFANITY_LIST = ['damn', 'hell', 'crap', 'stupid', 'idiot', 'dumb', 'hate', 'kill', 'die', 'sex', 'porn', 'xxx'];
  
  // Username validation using ContentFilter
  function validateUsername(username) {
    if (window.ContentFilter && window.ContentFilter.validateContent) {
      return window.ContentFilter.validateContent(username, {
        type: 'username',
        minLength: 2,
        maxLength: 20,
        allowUrls: false,
        allowEmails: false
      });
    }
    
    // Fallback validation if ContentFilter isn't loaded
    if (!username || username.trim().length < 2) {
      return { valid: false, error: 'Username must be at least 2 characters' };
    }
    if (username.length > 20) {
      return { valid: false, error: 'Username must be 20 characters or less' };
    }
    if (!/^[a-zA-Z][a-zA-Z0-9\s_-]*$/.test(username)) {
      return { valid: false, error: 'Username must start with a letter and contain only letters, numbers, spaces, hyphens and underscores' };
    }
    return { valid: true };
  }
  
  // Bio validation using ContentFilter
  function validateBio(bio) {
    if (window.ContentFilter && window.ContentFilter.validateContent) {
      return window.ContentFilter.validateContent(bio, {
        type: 'bio',
        minLength: 0,
        maxLength: 200,
        allowUrls: false,
        allowEmails: false
      });
    }
    
    // Fallback validation if ContentFilter isn't loaded
    if (bio && bio.length > 200) {
      return { valid: false, error: 'Bio must be 200 characters or less' };
    }
    return { valid: true };
  }

  // Check if user has seen guidelines
  function checkGuidelines() {
    try {
      const accepted = localStorage.getItem('who-bible-guidelines-accepted');
      if (!accepted) {
        const modal = document.getElementById('guidelines-modal');
        if (modal) {
          modal.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error('Error checking guidelines:', error);
    }
  }
  
  // Accept guidelines
  document.getElementById('accept-guidelines-btn')?.addEventListener('click', () => {
    localStorage.setItem('who-bible-guidelines-accepted', 'true');
    const modal = document.getElementById('guidelines-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    showToast({ title: '✅ Guidelines Accepted', msg: 'Welcome to the community!', type: 'success' });
  });

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
      // Default to night theme - no class needed (root variables are night by default)
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
  
  // Click outside to close
  window.addEventListener('click', (e) => {
    if (e.target === communityModal) closeCommunityModal();
  });
  
  // Escape key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && communityModal && communityModal.style.display === 'flex') {
      closeCommunityModal();
    }
  });

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
    { btn: document.getElementById('tab-explore'), sec: document.getElementById('section-explore'), id: 'explore' },
    { btn: document.getElementById('tab-live'), sec: document.getElementById('section-live'), id: 'live' },
    { btn: document.getElementById('tab-concepts'), sec: document.getElementById('section-concepts'), id: 'concepts' },
    { btn: document.getElementById('tab-profile'), sec: document.getElementById('section-profile'), id: 'profile' },
    { btn: document.getElementById('tab-guidelines'), sec: document.getElementById('section-guidelines'), id: 'guidelines' },
  ];
  function setActive(tab){
    tabs.forEach(({btn,sec,id})=>{
      if(!btn||!sec) return;
      const active = (btn===tab);
      
      // Cleanup Firebase listener when leaving Live tab
      if (!active && id === 'live') {
        cleanupLiveRoomsListener();
      }
      
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true':'false');
      sec.style.display = active ? 'block' : 'none';
    });
  }
  tabs.forEach(({btn})=>btn&&btn.addEventListener('click', ()=>setActive(btn)));

  // Profile simple handlers (initials)
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarIcon = document.getElementById('avatar-icon');
  const btnGenerateAvatar = document.getElementById('btn-generate-avatar');
  const displayNameInput = document.getElementById('display-name');
  const profileBioTextarea = document.getElementById('profile-bio');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  
  // Avatar colors palette
  const avatarColors = [
    '#ff8a65', '#ffb74d', '#81c784', '#64b5f6', 
    '#ba68c8', '#4db6ac', '#f06292', '#ffd54f',
    '#a1887f', '#90a4ae', '#ff7043', '#ffa726'
  ];
  
  // Enhanced Avatar Emoji System - 60+ biblically-themed emojis
  const AVATAR_EMOJIS = {
    biblical: [
      { emoji: '👑', name: 'Crown (King/Queen)' },
      { emoji: '⚔️', name: 'Sword (Warrior)' },
      { emoji: '📖', name: 'Book (Scholar)' },
      { emoji: '🕊️', name: 'Dove (Peace)' },
      { emoji: '⛪', name: 'Church' },
      { emoji: '✝️', name: 'Cross' },
      { emoji: '🙏', name: 'Prayer' },
      { emoji: '👤', name: 'Person' },
      { emoji: '👥', name: 'People' },
      { emoji: '🌟', name: 'Star' },
      { emoji: '🕎', name: 'Menorah' },
      { emoji: '🏺', name: 'Vessel' }
    ],
    nature: [
      { emoji: '🌊', name: 'Water' },
      { emoji: '🔥', name: 'Fire' },
      { emoji: '🌈', name: 'Rainbow' },
      { emoji: '🦁', name: 'Lion' },
      { emoji: '🐑', name: 'Sheep' },
      { emoji: '🐟', name: 'Fish' },
      { emoji: '🌾', name: 'Wheat' },
      { emoji: '🌴', name: 'Palm' },
      { emoji: '🏔️', name: 'Mountain' },
      { emoji: '⛅', name: 'Clouds' },
      { emoji: '🌙', name: 'Moon' },
      { emoji: '☀️', name: 'Sun' }
    ],
    virtues: [
      { emoji: '❤️', name: 'Love' },
      { emoji: '😊', name: 'Joy' },
      { emoji: '☮️', name: 'Peace' },
      { emoji: '💫', name: 'Hope' },
      { emoji: '💎', name: 'Precious' },
      { emoji: '✨', name: 'Glory' },
      { emoji: '🎯', name: 'Purpose' },
      { emoji: '🏆', name: 'Victory' },
      { emoji: '🛡️', name: 'Faith' },
      { emoji: '⚡', name: 'Power' },
      { emoji: '🎁', name: 'Gift' },
      { emoji: '🕯️', name: 'Light' }
    ],
    people: [
      { emoji: '👨', name: 'Man' },
      { emoji: '👩', name: 'Woman' },
      { emoji: '👧', name: 'Girl' },
      { emoji: '👦', name: 'Boy' },
      { emoji: '👴', name: 'Elder Man' },
      { emoji: '👵', name: 'Elder Woman' },
      { emoji: '🧔', name: 'Bearded Man' },
      { emoji: '👨‍🦳', name: 'Wise Man' },
      { emoji: '👩‍🦳', name: 'Wise Woman' },
      { emoji: '🧑‍🦱', name: 'Curly Hair' },
      { emoji: '👨‍🦰', name: 'Red Hair Man' },
      { emoji: '👩‍🦰', name: 'Red Hair Woman' }
    ],
    objects: [
      { emoji: '📜', name: 'Scroll' },
      { emoji: '🗝️', name: 'Key' },
      { emoji: '🚪', name: 'Door' },
      { emoji: '⚓', name: 'Anchor' },
      { emoji: '📿', name: 'Beads' },
      { emoji: '🎺', name: 'Trumpet' },
      { emoji: '🪨', name: 'Stone' },
      { emoji: '🌿', name: 'Olive Branch' },
      { emoji: '🍞', name: 'Bread' },
      { emoji: '🍷', name: 'Wine' },
      { emoji: '🏛️', name: 'Temple' },
      { emoji: '🕊', name: 'Spirit' }
    ]
  };
  
  // Flatten all emojis for easy access
  const ALL_AVATAR_EMOJIS = Object.values(AVATAR_EMOJIS).flat().map(e => e.emoji);
  
  let currentAvatarColorIndex = 0;
  let currentAvatarIcon = '📖';
  let currentAvatarEmoji = null; // null = use initials, otherwise use emoji
  
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
  
  function setAvatarText(txt){ 
    if(avatarPreview) {
      // If we have a selected emoji, use it; otherwise use initials
      const displayText = currentAvatarEmoji || txt || 'WB';
      avatarPreview.textContent = displayText;
      // Adjust font size based on content
      if (currentAvatarEmoji) {
        avatarPreview.style.fontSize = '48px'; // Larger for emoji
      } else {
        avatarPreview.style.fontSize = '28px'; // Original size for initials
      }
    }
  }
  
  function updateAvatarStyle() {
    if (avatarPreview) {
      avatarPreview.style.background = avatarColors[currentAvatarColorIndex];
      // Update text size if emoji is selected
      if (currentAvatarEmoji) {
        avatarPreview.style.fontSize = '48px';
      } else {
        avatarPreview.style.fontSize = '28px';
      }
    }
    if (avatarIcon) {
      avatarIcon.textContent = currentAvatarIcon;
    }
  }
  
  // Achievement definitions
  const achievements = [
    { id: 'first_quiz', icon: '🎯', title: 'First Steps', desc: 'Complete your first quiz', check: (stats) => stats.quizzes >= 1 },
    { id: 'ten_games', icon: '🎮', title: 'Getting Started', desc: 'Play 10 quizzes', check: (stats) => stats.quizzes >= 10 },
    { id: 'perfect_score', icon: '💯', title: 'Perfection', desc: 'Get a perfect score', check: (stats) => stats.perfectGames >= 1 },
    { id: 'high_streak', icon: '🔥', title: 'On Fire!', desc: 'Get a 5+ streak', check: (stats) => stats.bestStreak >= 5 },
    { id: 'scholar', icon: '📚', title: 'Bible Scholar', desc: 'Play 50+ quizzes', check: (stats) => stats.quizzes >= 50 },
    { id: 'master', icon: '👑', title: 'Master', desc: 'Play 100+ quizzes', check: (stats) => stats.quizzes >= 100 },
    { id: 'high_accuracy', icon: '🎯', title: 'Sharp Mind', desc: '80%+ accuracy', check: (stats) => stats.accuracy >= 80 },
    { id: 'dedicated', icon: '⭐', title: 'Dedicated', desc: 'Play 25+ quizzes', check: (stats) => stats.quizzes >= 25 }
  ];
  
  function renderAchievements(stats) {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    achievements.forEach(achievement => {
      const unlocked = achievement.check(stats);
      const badge = document.createElement('div');
      badge.className = 'achievement-badge';
      badge.style.cssText = `
        background: ${unlocked ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'var(--bg-2)'};
        border: 2px solid ${unlocked ? 'var(--accent)' : 'var(--border)'};
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        transition: all 0.3s;
        cursor: pointer;
        ${unlocked ? 'box-shadow: 0 4px 12px rgba(0,0,0,0.15);' : 'opacity: 0.6;'}
      `;
      
      badge.innerHTML = `
        <div style=\"font-size: 32px; margin-bottom: 8px; ${unlocked ? '' : 'filter: grayscale(100%);'}\">${achievement.icon}</div>
        <div style=\"font-weight: 600; font-size: 13px; color: ${unlocked ? 'white' : 'var(--muted)'}; margin-bottom: 4px;\">${achievement.title}</div>
        <div style=\"font-size: 11px; color: ${unlocked ? 'rgba(255,255,255,0.8)' : 'var(--muted)'};\">${achievement.desc}</div>
      `;
      
      badge.addEventListener('mouseenter', () => {
        if (unlocked) {
          badge.style.transform = 'translateY(-4px) scale(1.05)';
        }
      });
      badge.addEventListener('mouseleave', () => {
        badge.style.transform = 'translateY(0) scale(1)';
      });
      
      grid.appendChild(badge);
    });
  }
  
  function loadProfile(){
    try{
      // SYNC WITH MAIN APP: Try to load name from who-bible-player first
      let playerName = '';
      try {
        const playerData = localStorage.getItem('who-bible-player');
        if (playerData) {
          const player = JSON.parse(playerData);
          playerName = player.name || '';
        }
      } catch(_) {}
      
      const txt = localStorage.getItem('communityProfile');
      if(!txt) { 
        // No profile yet, but use player name if available
        if (displayNameInput && playerName) displayNameInput.value = playerName;
        setAvatarText(playerName ? generateAvatarText(playerName) : 'WB'); 
        updateAvatarStyle();
        return; 
      }
      
      let p;
      try {
        p = JSON.parse(txt);
      } catch (parseError) {
        console.error('Profile data corrupted:', parseError);
        showToast({ title: getText('error'), msg: 'Profile data corrupted, using defaults', type: 'warn', timeout: 2000 });
        setAvatarText('WB'); 
        updateAvatarStyle();
        return;
      }
      
      // SYNC: Prefer player name from main app over profile displayName
      const syncedName = playerName || p.displayName || '';
      
      if(displayNameInput) displayNameInput.value = syncedName;
      if(profileBioTextarea) profileBioTextarea.value = p.bio || '';
      currentAvatarEmoji = p.avatarEmoji || null; // Restore emoji selection
      setAvatarText(p.avatarText || generateAvatarText(syncedName));
      currentAvatarColorIndex = p.avatarColorIndex || 0;
      currentAvatarIcon = p.avatarIcon || '📖';
      updateAvatarStyle();
    }catch(_){ 
      setAvatarText('WB'); 
      updateAvatarStyle();
    }
  }
  
  function saveProfile(){
    const name = displayNameInput?.value?.trim() || '';
    const bio = profileBioTextarea?.value?.trim() || '';
    
    // Validate username
    const nameValidation = validateUsername(name);
    if (!nameValidation.valid) {
      showToast({ title: `❌ ${getText('invalidUsername')}`, msg: nameValidation.error, type: 'error', timeout: 3000 });
      return false;
    }
    
    // Validate bio
    if (bio) {
      const bioValidation = validateBio(bio);
      if (!bioValidation.valid) {
        showToast({ title: '❌ Invalid Bio', msg: bioValidation.error, type: 'error', timeout: 3000 });
        return false;
      }
    }
    
    const profile = {
      displayName: name,
      bio: bio,
      avatarText: avatarPreview?.textContent || 'WB',
      avatarColorIndex: currentAvatarColorIndex,
      avatarIcon: currentAvatarIcon,
      avatarEmoji: currentAvatarEmoji, // Save selected emoji
      locale: (localStorage.getItem('who-bible-language')||'en')
    };
    try{ 
      localStorage.setItem('communityProfile', JSON.stringify(profile)); 
      localStorage.setItem('who-bible-profile-name', name); // For reports
      
      // SYNC WITH MAIN APP: Update the player name in who-bible-player too
      const playerData = localStorage.getItem('who-bible-player');
      if (playerData) {
        try {
          const player = JSON.parse(playerData);
          player.name = name; // Update the player name
          localStorage.setItem('who-bible-player', JSON.stringify(player));
        } catch(_) {}
      }
    }catch(_){/* ignore */}
    return true;
  }
  
  function loadUserStats() {
    // Load stats from localStorage (from main app)
    try {
      // Get player data from main app (NEW: correct source)
      const playerStr = localStorage.getItem('who-bible-player');
      let player = null;
      let stats = null;
      
      if (playerStr) {
        try {
          player = JSON.parse(playerStr);
          stats = player?.stats || null;
        } catch (parseError) {
          console.error('Failed to parse player data:', parseError);
          stats = null;
        }
      }
      
      // If player stats exist, use them; otherwise default to 0
      const quizzesPlayed = stats?.gamesPlayed || 0;
      const bestScore = stats?.highestScore || 0;
      const bestStreak = stats?.bestStreak || 0;
      const accuracy = stats?.winRate || 0; // winRate is accuracy percentage
      
      // Find favorite mode from stats
      const favoriteMode = stats?.favoriteMode || null;
      
      // Update UI
      const quizzesEl = document.getElementById('user-quizzes-played');
      const scoreEl = document.getElementById('user-best-score');
      const streakEl = document.getElementById('user-streak');
      const accuracyEl = document.getElementById('user-accuracy');
      
      if (quizzesEl) quizzesEl.textContent = quizzesPlayed;
      if (scoreEl) scoreEl.textContent = bestScore;
      if (streakEl) streakEl.textContent = bestStreak;
      if (accuracyEl) accuracyEl.textContent = accuracy + '%';
      
      // Learning progress (set to default for now as we don't track individual people)
      const masteredCount = 0;
      const masteredEl = document.getElementById('people-mastered');
      const progressBar = document.getElementById('people-progress-bar');
      if (masteredEl) masteredEl.textContent = `${masteredCount} / 73`;
      if (progressBar) progressBar.style.width = `${(masteredCount / 73) * 100}%`;
      
      // Favorite mode
      const favModeEl = document.getElementById('favorite-mode');
      if (favModeEl && favoriteMode) {
        const modeNames = {
          solo: '🎯 Solo Mode',
          timed: '⏱️ Timed Mode',
          challenge: '🤝 Challenge Mode',
          'remote-challenge': '🌐 Remote Challenge',
          scenarios: '🎭 Scenarios Mode',
          study: '📚 Study Mode'
        };
        favModeEl.textContent = modeNames[favoriteMode] || favoriteMode;
      } else if (favModeEl) {
        favModeEl.textContent = 'Play more to discover!';
      }
      
      // Weak areas (placeholder since we don't track individual people in new stats)
      const weakAreasEl = document.getElementById('weak-areas');
      if (weakAreasEl) {
        if (quizzesPlayed > 0) {
          weakAreasEl.innerHTML = 'Keep playing to improve!';
        } else {
          weakAreasEl.innerHTML = 'Complete more quizzes for personalized suggestions';
        }
      }
      
      // Render achievements
      const achievementStats = {
        quizzes: quizzesPlayed,
        bestScore,
        bestStreak,
        accuracy,
        perfectGames: 0 // Not tracked in new system yet
      };
      renderAchievements(achievementStats);
      
    } catch(e) {
      console.error('Error loading stats:', e);
      // Set defaults
      renderAchievements({ quizzes: 0, bestScore: 0, bestStreak: 0, accuracy: 0, perfectGames: 0 });
    }
  }
  
  loadProfile();
  loadUserStats();
  
  // Avatar color cycle button (NOW: Generate Random Avatar - emoji + color)
  btnGenerateAvatar?.addEventListener('click', ()=>{ 
    // Pick a random emoji from all available emojis
    const randomEmoji = ALL_AVATAR_EMOJIS[Math.floor(Math.random() * ALL_AVATAR_EMOJIS.length)];
    currentAvatarEmoji = randomEmoji;
    
    // Pick a random color
    currentAvatarColorIndex = Math.floor(Math.random() * avatarColors.length);
    
    // Update the avatar display
    setAvatarText(randomEmoji);
    updateAvatarStyle();
    
    // Show feedback toast
    showToast({ 
      title: '✨ Avatar Generated!', 
      msg: `New random avatar: ${randomEmoji}`, 
      type: 'success', 
      timeout: 1500 
    });
  });
  
  // Avatar icon selection buttons
  document.querySelectorAll('.avatar-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = btn.dataset.icon;
      currentAvatarIcon = icon;
      updateAvatarStyle();
      
      // Highlight selected
      document.querySelectorAll('.avatar-icon-btn').forEach(b => {
        b.style.borderColor = 'var(--border)';
        b.style.background = 'var(--bg-2)';
        b.style.transform = 'scale(1)';
      });
      btn.style.borderColor = 'var(--accent)';
      btn.style.background = 'var(--accent-2)';
      btn.style.transform = 'scale(1.1)';
    });
    
    // Hover effect
    btn.addEventListener('mouseenter', () => {
      if (btn.dataset.icon !== currentAvatarIcon) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.transform = 'scale(1.05)';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.dataset.icon !== currentAvatarIcon) {
        btn.style.borderColor = 'var(--border)';
        btn.style.transform = 'scale(1)';
      }
    });
  });
  
  btnSaveProfile?.addEventListener('click', ()=>{ 
    if (saveProfile()) {
      showToast({ title: getText('profileSaved')||'Profile saved', type:'success', timeout: 1200 }); 
      // Add subtle animation
      if (btnSaveProfile) {
        btnSaveProfile.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btnSaveProfile.style.transform = 'scale(1)';
        }, 100);
      }
    }
  });

  // ===== Emoji Picker System =====
  const emojiPickerModal = document.getElementById('emoji-picker-modal');
  const emojiGrid = document.getElementById('emoji-grid');
  const btnChooseEmoji = document.getElementById('btn-choose-emoji');
  const btnEmojiClose = document.getElementById('btn-emoji-close');
  const btnRandomEmoji = document.getElementById('btn-random-emoji');
  const btnUseInitials = document.getElementById('btn-use-initials');
  
  let currentEmojiCategory = 'all';
  
  // Populate emoji grid based on category
  function populateEmojiGrid(category = 'all') {
    if (!emojiGrid) return;
    
    emojiGrid.innerHTML = '';
    
    let emojisToShow = [];
    if (category === 'all') {
      emojisToShow = Object.values(AVATAR_EMOJIS).flat();
    } else if (AVATAR_EMOJIS[category]) {
      emojisToShow = AVATAR_EMOJIS[category];
    }
    
    emojisToShow.forEach(emojiObj => {
      const btn = document.createElement('button');
      btn.className = 'emoji-option';
      btn.textContent = emojiObj.emoji;
      btn.title = emojiObj.name;
      btn.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 12px;
        border: 2px solid var(--border);
        background: var(--bg-2);
        cursor: pointer;
        font-size: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      `;
      
      // Highlight if currently selected
      if (currentAvatarEmoji === emojiObj.emoji) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'var(--accent-2)';
        btn.style.transform = 'scale(1.05)';
      }
      
      // Hover effect
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = 'var(--accent)';
        btn.style.transform = 'scale(1.1)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      });
      btn.addEventListener('mouseleave', () => {
        if (currentAvatarEmoji !== emojiObj.emoji) {
          btn.style.borderColor = 'var(--border)';
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = 'none';
        }
      });
      
      // Click to select
      btn.addEventListener('click', () => {
        currentAvatarEmoji = emojiObj.emoji;
        setAvatarText(emojiObj.emoji);
        updateAvatarStyle();
        showToast({ title: '✅ Avatar Updated', msg: `Selected ${emojiObj.name}`, type: 'success', timeout: 1500 });
        emojiPickerModal.style.display = 'none';
      });
      
      emojiGrid.appendChild(btn);
    });
  }
  
  // Open emoji picker
  btnChooseEmoji?.addEventListener('click', () => {
    if (emojiPickerModal) {
      emojiPickerModal.style.display = 'flex';
      populateEmojiGrid(currentEmojiCategory);
    }
  });
  
  // Close emoji picker
  btnEmojiClose?.addEventListener('click', () => {
    if (emojiPickerModal) emojiPickerModal.style.display = 'none';
  });
  
  // Close on backdrop click
  emojiPickerModal?.addEventListener('click', (e) => {
    if (e.target === emojiPickerModal) {
      emojiPickerModal.style.display = 'none';
    }
  });
  
  // Category tabs
  document.querySelectorAll('.emoji-category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      currentEmojiCategory = category;
      
      // Update tab styles
      document.querySelectorAll('.emoji-category-tab').forEach(t => {
        t.style.background = 'var(--bg-2)';
        t.style.color = 'var(--text)';
      });
      tab.style.background = 'var(--accent)';
      tab.style.color = 'white';
      
      // Repopulate grid
      populateEmojiGrid(category);
    });
  });
  
  // Random emoji button
  btnRandomEmoji?.addEventListener('click', () => {
    const randomEmoji = ALL_AVATAR_EMOJIS[Math.floor(Math.random() * ALL_AVATAR_EMOJIS.length)];
    currentAvatarEmoji = randomEmoji;
    setAvatarText(randomEmoji);
    updateAvatarStyle();
    showToast({ title: '🎲 Random Avatar', msg: 'Feeling lucky!', type: 'success', timeout: 1500 });
    emojiPickerModal.style.display = 'none';
  });
  
  // Use initials button
  btnUseInitials?.addEventListener('click', () => {
    currentAvatarEmoji = null;
    const name = displayNameInput?.value?.trim() || '';
    setAvatarText(generateAvatarText(name));
    updateAvatarStyle();
    showToast({ title: '✏️ Using Initials', msg: 'Avatar reset to initials', type: 'success', timeout: 1500 });
  });
  // ===== End Emoji Picker System =====


  // =========================
  // Firebase Live Rooms Integration
  // =========================
  let liveRoomsListener = null;
  const liveRoomsList = document.getElementById('live-rooms-list');
  let currentRoomData = null;
  
  // Cleanup function for Firebase listeners
  function cleanupLiveRoomsListener() {
    if (liveRoomsListener && typeof FirebaseConfig !== 'undefined' && FirebaseConfig.getDatabase) {
      try {
        const db = FirebaseConfig.getDatabase();
        const roomsRef = db.ref('rooms');
        roomsRef.off('value', liveRoomsListener);
        liveRoomsListener = null;
        console.log('✓ Firebase listener cleaned up');
      } catch(error) {
        console.error('Error cleaning up listener:', error);
      }
    }
  }
  
  // Helper to generate avatar color from name
  function getAvatarColor(name) {
    const colors = ['#ff8a65', '#ffb74d', '#81c784', '#64b5f6', '#ba68c8', '#4db6ac', '#f06292', '#ffd54f'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  
  // Helper to get initials from name
  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/[\s-]+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  function setupLiveRoomsListener() {
    // Check if Firebase is available
    if (typeof FirebaseConfig === 'undefined' || !FirebaseConfig.isFirebaseAvailable || !FirebaseConfig.isFirebaseAvailable()) {
      if (liveRoomsList) {
        liveRoomsList.innerHTML = `
          <div class="card">
            <div class="card-icon">🔧</div>
            <div class="card-title">Live Rooms Coming Soon</div>
            <div class="card-desc">Firebase configuration needed for real-time multiplayer features. This feature will be available once the backend is set up.</div>
          </div>
        `;
      }
      return;
    }
    
    try {
      const db = FirebaseConfig.getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      const roomsRef = db.ref('rooms');
      
      // Listen for all active rooms with real-time updates
      liveRoomsListener = roomsRef.on('value', (snapshot) => {
        const rooms = snapshot.val();
        displayLiveRooms(rooms);
      });
      
    } catch (error) {
      console.error('Firebase error:', error);
      if (liveRoomsList) {
        liveRoomsList.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <div class="card-title" style="color: var(--error);">${getText('errorLoadingRooms') || 'Error Loading Rooms'}</div>
            <div class="card-desc" style="margin-top: 12px;">${sanitizeHTML(error.message) || 'Please try refreshing the page'}</div>
          </div>
        `;
      }
      showToast({ title: getText('error'), msg: 'Failed to connect to live rooms', type: 'error' });
    }
  }
  
  function displayLiveRooms(rooms) {
    if (!liveRoomsList) return;
    
    // Clear current display
    liveRoomsList.innerHTML = '';
    
    if (!rooms) {
      liveRoomsList.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎮</div>
          <div class="card-title">${getText('noActiveRooms')}</div>
          <div class="card-desc" style="margin-bottom: 16px;">${getText('beFirstToCreate')}</div>
          <button onclick="document.getElementById('btn-create-room').click()" class="primary" style="padding: 10px 24px; border-radius: 8px; background: var(--accent); color: white; border: none; cursor: pointer; font-weight: 600;">${getText('createRoom')}</button>
        </div>
      `;
      return;
    }
    
    // Filter to only show active (non-completed) rooms
    const activeRooms = Object.entries(rooms).filter(([_, room]) => {
      return room.status !== 'completed' && room.status !== 'abandoned';
    });
    
    if (activeRooms.length === 0) {
      liveRoomsList.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
          <div class="card-title">${getText('allRoomsFinished')}</div>
          <div class="card-desc" style="margin-bottom: 16px;">${getText('createNewRoom')}</div>
          <button onclick="document.getElementById('btn-create-room').click()" class="primary" style="padding: 10px 24px; border-radius: 8px; background: var(--accent); color: white; border: none; cursor: pointer; font-weight: 600;">${getText('createRoom')}</button>
        </div>
      `;
      return;
    }
    
    // Display each room with enhanced styling
    activeRooms.forEach(([roomCode, room]) => {
      const card = document.createElement('div');
      card.className = 'card room-card';
      card.style.cssText = 'cursor: pointer; transition: all 0.3s ease; border: 2px solid var(--border); position: relative; overflow: hidden;';
      card.dataset.roomCode = roomCode;
      
      const hostName = sanitizeHTML(room.host || 'Unknown Host');
      const players = room.players || {};
      const playerCount = Object.keys(players).length;
      const maxPlayers = room.settings?.maxPlayers || 8;
      const isFull = playerCount >= maxPlayers;
      
      // Status badges and colors
      let statusBadge = '';
      let statusColor = '';
      if (room.status === 'active') {
        statusBadge = '🔥 Active';
        statusColor = '#10b981';
      } else if (room.status === 'ready') {
        statusBadge = '🎮 Ready';
        statusColor = '#3b82f6';
      } else {
        statusBadge = '⏳ Waiting';
        statusColor = '#f59e0b';
      }
      
      const settings = room.settings || {};
      const difficulty = settings.difficulty || 'medium';
      const numQuestions = settings.numQuestions || 10;
      
      // Create player avatars
      let avatarsHTML = '<div style=\"display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;\">';
      Object.entries(players).slice(0, 6).forEach(([key, player]) => {
        if (player && player.name) {
          // Check if player has emoji avatar, otherwise use initials
          let displayContent = player.avatarEmoji || getInitials(player.name);
          const fontSize = player.avatarEmoji ? '18px' : '11px';
          const bgColor = getAvatarColor(player.name);
          avatarsHTML += `
            <div style=\"width: 32px; height: 32px; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: ${fontSize}; font-weight: bold; border: 2px solid var(--bg); box-shadow: 0 2px 4px rgba(0,0,0,0.2);\" title=\"${player.name}\">${displayContent}</div>
          `;
        }
      });
      if (playerCount > 6) {
        avatarsHTML += `<div style=\"width: 32px; height: 32px; border-radius: 50%; background: var(--bg-3); color: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid var(--bg);\">+${playerCount - 6}</div>`;
      }
      avatarsHTML += '</div>';
      
      card.innerHTML = `
        <div style=\"position: absolute; top: 12px; right: 12px; padding: 4px 12px; background: ${statusColor}; color: white; border-radius: 12px; font-size: 12px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);\">${statusBadge}</div>
        <div class=\"card-icon\" style=\"font-size: 32px; margin-bottom: 8px;\">🏆</div>
        <div class=\"card-title\" style=\"font-size: 18px; margin-bottom: 8px; padding-right: 80px;\">${roomCode}</div>
        <div class=\"card-desc\" style=\"font-size: 14px;\">
          <div style=\"margin-bottom: 6px;\"><strong>Host:</strong> ${hostName}</div>
          <div style=\"margin-bottom: 6px;\">
            <strong>Players:</strong> 
            <span style=\"color: ${isFull ? '#ef4444' : '#10b981'}; font-weight: 600;\">${playerCount}/${maxPlayers}</span>
            ${isFull ? '<span style=\"margin-left: 8px; color: #ef4444; font-weight: 600;\">FULL</span>' : ''}
          </div>
          ${avatarsHTML}
          <div style=\"margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 13px; color: var(--muted);\">
            ${numQuestions} questions • ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
        </div>
        <div style=\"margin-top: 16px; display: flex; gap: 8px;\">
          ${!isFull && room.status === 'waiting' ? `<button class=\"btn-join-room primary\" data-room-code=\"${roomCode}\" style=\"flex: 1; padding: 10px; border-radius: 6px; background: var(--accent); color: white; border: none; cursor: pointer; font-weight: 600; transition: transform 0.2s;\">Join Now</button>` : ''}
          <button class=\"btn-view-room secondary\" data-room-code=\"${roomCode}\" style=\"${!isFull && room.status === 'waiting' ? 'padding: 10px 16px;' : 'flex: 1; padding: 10px;'} border-radius: 6px; border: 2px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-weight: 600;\">Details</button>
          <button class=\"btn-report-room\" data-room-code=\"${roomCode}\" data-host=\"${hostName}\" style=\"padding: 10px 16px; border-radius: 6px; border: 2px solid #ff6b6b; background: transparent; color: #ff6b6b; cursor: pointer; font-weight: 600; transition: all 0.2s;\" title=\"Report inappropriate behavior\">⚠️</button>
        </div>
      `;
      
      // Add hover effect
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        card.style.borderColor = 'var(--accent)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
        card.style.borderColor = 'var(--border)';
      });
      
      // Add click handlers
      const joinBtn = card.querySelector('.btn-join-room');
      const viewBtn = card.querySelector('.btn-view-room');
      
      if (joinBtn) {
        joinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showJoinRoomModal(roomCode, room);
        });
      }
      
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          viewRoomDetails(roomCode, room);
        });
      }
      
      // Report button
      const reportBtn = card.querySelector('.btn-report-room');
      if (reportBtn) {
        reportBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const hostName = reportBtn.dataset.host;
          showReportModal(roomCode, hostName);
        });
      }
      
      liveRoomsList.appendChild(card);
    });
  }
  
  function showReportModal(roomCode, hostName) {
    const html = `
      <div style="margin-bottom: 20px;">
        <p style="color: var(--muted); margin-bottom: 16px;">You are reporting room <strong>${roomCode}</strong> hosted by <strong>${hostName}</strong></p>
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Reason:</label>
        <select id="report-reason" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); margin-bottom: 16px;">
          <option value="">Select a reason...</option>
          <option value="harassment">Harassment or bullying</option>
          <option value="profanity">Profanity or inappropriate language</option>
          <option value="cheating">Cheating or unfair play</option>
          <option value="spam">Spam or advertising</option>
          <option value="false_teaching">False teaching or misrepresenting Scripture</option>
          <option value="offensive_name">Offensive username</option>
          <option value="other">Other</option>
        </select>
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Additional details (optional):</label>
        <textarea id="report-details" rows="4" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); resize: vertical;" placeholder="Please provide any additional context..."></textarea>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button onclick="document.getElementById('community-modal').style.display='none'" class="secondary" style="padding: 10px 20px; border-radius: 8px; border: 2px solid var(--border); background: transparent; cursor: pointer;">Cancel</button>
        <button id="submit-report-btn" class="primary" style="padding: 10px 24px; border-radius: 8px; background: #ff6b6b; color: white; border: none; cursor: pointer; font-weight: 600;">Submit Report</button>
      </div>
    `;
    
    openCommunityModal('⚠️ Report Room', html);
    
    document.getElementById('submit-report-btn')?.addEventListener('click', () => {
      const reason = document.getElementById('report-reason')?.value;
      const details = document.getElementById('report-details')?.value;
      
      if (!reason) {
        showToast({ title: getText('error'), msg: getText('pleaseSelectReason'), type: 'error' });
        return;
      }
      
      // Validate report details content
      if (details && window.ContentFilter) {
        const validation = window.ContentFilter.validateContent(details, {
          type: 'report',
          minLength: 0,
          maxLength: 500,
          allowUrls: false,
          allowEmails: false
        });
        if (!validation.valid) {
          showToast({ title: '❌ Invalid Details', msg: validation.error, type: 'error', timeout: 3000 });
          return;
        }
      }
      
      // Save report to Firebase (admin can review)
      try {
        if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.isFirebaseAvailable && FirebaseConfig.isFirebaseAvailable()) {
          const db = FirebaseConfig.getDatabase();
          const reportRef = db.ref('reports').push();
          reportRef.set({
            roomCode: sanitizeHTML(roomCode),
            hostName: sanitizeHTML(hostName),
            reason: sanitizeHTML(reason),
            details: sanitizeHTML(details || ''),
            timestamp: Date.now(),
            reporter: sanitizeHTML(localStorage.getItem('who-bible-profile-name') || 'Anonymous')
          });
        } else {
          throw new Error('Firebase not available');
        }
      } catch (error) {
        console.error('Report error:', error);
        showToast({ title: getText('error'), msg: 'Failed to submit report. Please try again.', type: 'error' });
        return;
      }
      
      document.getElementById('community-modal').style.display = 'none';
      showToast({ title: '✅ Report Submitted', msg: 'Thank you for helping keep our community safe', type: 'success', timeout: 3000 });
    });
  }
  
  function viewRoomDetails(roomCode, room) {
    const hostName = sanitizeHTML(room.host?.name || 'Unknown');
    const playerCount = room.players ? Object.keys(room.players).length : 0;
    const statusText = sanitizeHTML(room.status || 'waiting');
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
    cleanupLiveRoomsListener();
  });

  // ===== LOCATIONS TAB ===== (DISABLED - Feature temporarily removed)
  /*
  // locationsInitialized is defined at top of scope
  let locationsMap = null;
  let currentJourney = null;
  
  // Journey path definitions with biblical accuracy
  const journeyPaths = {
    exodus: {
      color: '#FF6B6B',
      icon: '📜',
      locations: [
        { name: 'Rameses', coords: [180, 320], type: 'start', desc: 'Starting point in Egypt, land of bondage (Ex 12:37)', person: '👥' },
        { name: 'Succoth', coords: [200, 330], type: 'stop', desc: 'First encampment: 600,000 men plus families (Ex 12:37)' },
        { name: 'Etham', coords: [220, 350], type: 'stop', desc: 'Edge of the wilderness, pillar of cloud and fire appeared (Ex 13:20-22)' },
        { name: 'Pi-hahiroth', coords: [190, 370], type: 'stop', desc: 'Before the Red Sea, trapped by Pharaoh\'s army (Ex 14:2)' },
        { name: 'Red Sea Crossing', coords: [180, 390], type: 'miracle', desc: 'Waters parted, walked on dry ground (Ex 14:21-29)', person: '🌊' },
        { name: 'Marah', coords: [200, 410], type: 'stop', desc: 'Bitter waters made sweet by a tree (Ex 15:23-25)' },
        { name: 'Elim', coords: [220, 420], type: 'stop', desc: 'Oasis with 12 springs and 70 palm trees (Ex 15:27)', person: '🌴' },
        { name: 'Wilderness of Sin', coords: [240, 400], type: 'stop', desc: 'Manna and quail provided from heaven (Ex 16:1-36)', person: '🍞' },
        { name: 'Rephidim', coords: [260, 390], type: 'stop', desc: 'Water from rock; defeated Amalek (Ex 17:1-16)' },
        { name: 'Mount Sinai', coords: [270, 370], type: 'holy', desc: 'Ten Commandments received amid thunder and fire (Ex 19-20)', person: '⚡' }
      ]
    },
    paul: {
      color: '#4ECDC4',
      icon: '⛵',
      locations: [
        { name: 'Antioch', coords: [420, 160], type: 'start', desc: 'Church commissioned Paul and Barnabas (Acts 13:1-3)', person: '⛪' },
        { name: 'Seleucia', coords: [430, 170], type: 'stop', desc: 'Port city where journey began by sea (Acts 13:4)' },
        { name: 'Cyprus', coords: [360, 190], type: 'stop', desc: 'Barnabas\' homeland; proconsul Sergius Paulus believed (Acts 13:4-12)', person: '🏛️' },
        { name: 'Perga', coords: [340, 200], type: 'stop', desc: 'John Mark departed here and returned to Jerusalem (Acts 13:13)' },
        { name: 'Antioch (Pisidia)', coords: [360, 210], type: 'city', desc: 'Preached in synagogue; many believed (Acts 13:14-52)', person: '📖' },
        { name: 'Iconium', coords: [380, 215], type: 'city', desc: 'Long ministry despite persecution plot (Acts 14:1-7)' },
        { name: 'Lystra', coords: [370, 225], type: 'city', desc: 'Stoned and left for dead; Timothy\'s hometown (Acts 14:8-20)', person: '👤' },
        { name: 'Derbe', coords: [390, 230], type: 'city', desc: 'Made many disciples without persecution (Acts 14:20-21)' },
        { name: 'Attalia', coords: [340, 210], type: 'stop', desc: 'Sailed back to Antioch from this port (Acts 14:25-26)' }
      ]
    },
    jesus: {
      color: '#95E1D3',
      icon: '✝️',
      locations: [
        { name: 'Bethlehem', coords: [350, 270], type: 'holy', desc: 'Born in manger, city of David (Luke 2:4-7)', person: '⭐' },
        { name: 'Nazareth', coords: [370, 200], type: 'city', desc: 'Grew up here; rejected in synagogue (Luke 4:16-30)', person: '🏠' },
        { name: 'Capernaum', coords: [385, 175], type: 'city', desc: 'Base of Galilee ministry; many miracles (Matt 4:13)', person: '🏘️' },
        { name: 'Sea of Galilee', coords: [380, 180], type: 'holy', desc: 'Called disciples; walked on water; calmed storm (Mark 4:35-41)', person: '🚣' },
        { name: 'Cana', coords: [375, 195], type: 'miracle', desc: 'First miracle: water to wine at wedding (John 2:1-11)', person: '🍷' },
        { name: 'Jerusalem', coords: [355, 260], type: 'holy', desc: 'Crucifixion and resurrection (John 19-20)', person: '✝️' },
        { name: 'Bethany', coords: [360, 265], type: 'city', desc: 'Lazarus raised; Mary & Martha\'s home (John 11)', person: '👨' },
        { name: 'Jericho', coords: [365, 275], type: 'city', desc: 'Healed blind Bartimaeus; Zacchaeus believed (Luke 18-19)', person: '🌳' },
        { name: 'Jordan River', coords: [370, 250], type: 'holy', desc: 'Baptized by John the Baptist (Matt 3:13-17)', person: '💧' }
      ]
    },
    abraham: {
      color: '#FFD93D',
      icon: '🌟',
      locations: [
        { name: 'Ur', coords: [650, 340], type: 'start', desc: 'Birthplace in Mesopotamia (Gen 11:28-31)', person: '🏛️' },
        { name: 'Haran', coords: [520, 140], type: 'city', desc: 'Father Terah died; God called Abraham (Gen 11:31-12:1)', person: '🏘️' },
        { name: 'Shechem', coords: [365, 230], type: 'stop', desc: 'First stop in Canaan; God appeared, built altar (Gen 12:6-7)', person: '🔥' },
        { name: 'Bethel', coords: [358, 250], type: 'holy', desc: 'Built altar, called on the Lord (Gen 12:8)', person: '⛪' },
        { name: 'Egypt', coords: [180, 360], type: 'stop', desc: 'Went during famine (Gen 12:10)', person: '🌾' },
        { name: 'Hebron', coords: [350, 280], type: 'city', desc: 'Settled near oaks of Mamre (Gen 13:18)', person: '🌳' },
        { name: 'Beersheba', coords: [340, 310], type: 'city', desc: 'Made covenant with Abimelech (Gen 21:32)', person: '🤝' }
      ]
    }
  };
  
  async function initLocationsTab() {
    if (locationsInitialized) return;
    locationsInitialized = true;
    
    if (!window.LocationModule) {
      showToast({ title: getText('error'), msg: 'Locations module not loaded', type: 'error' });
      return;
    }
    
    try {
      // Initialize map
      locationsMap = window.LocationModule.initSimpleMap('locations-map-container');
      window.LocationModule.addLocationMarkers();
      
      // Render location cards
      renderLocationCards(window.LocationModule.locations);
      
      // Setup filters
      const testamentFilter = document.getElementById('testament-filter-locations');
      const importanceFilter = document.getElementById('importance-filter-locations');
      const btnResetMap = document.getElementById('btn-reset-map');
      
      if (testamentFilter) {
        testamentFilter.addEventListener('change', filterLocations);
      }
      
      if (importanceFilter) {
        importanceFilter.addEventListener('change', filterLocations);
      }
      
      if (btnResetMap) {
        btnResetMap.addEventListener('click', () => {
          testamentFilter.value = '';
          importanceFilter.value = '0';
          currentJourney = null;
          updateJourneyButtons();
          filterLocations();
        });
      }
      
      // Journey buttons
      document.querySelectorAll('.journey-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const journey = btn.dataset.journey;
          showJourney(journey);
        });
      });
      
      const btnClearJourney = document.getElementById('btn-clear-journey');
      if (btnClearJourney) {
        btnClearJourney.addEventListener('click', () => {
          currentJourney = null;
          updateJourneyButtons();
          window.LocationModule.addLocationMarkers();
        });
      }
      
      // Location Quiz button
      const btnLocationQuiz = document.getElementById('btn-location-quiz');
      if (btnLocationQuiz) {
        btnLocationQuiz.addEventListener('click', startLocationQuiz);
      }
      
      // Listen for location selection from map
      window.addEventListener('location-selected', (e) => {
        showLocationDetails(e.detail);
      });
      
      locationsInitialized = true;
      
      // Add touch support for mobile
      const mapSvg = document.getElementById('biblical-map');
      if (mapSvg && 'ontouchstart' in window) {
        mapSvg.style.touchAction = 'pan-y';
      }
    } catch(err) {
      console.error('Error initializing locations:', err);
      showToast({ title: getText('error'), msg: getText('failedToLoadLocations'), type: 'error' });
    }
  }
  
  function showJourney(journeyKey) {
    currentJourney = journeyKey;
    updateJourneyButtons();
    
    const journey = journeyPaths[journeyKey];
    if (!journey) return;
    
    const pathsGroup = document.getElementById('journey-paths');
    const markersGroup = document.getElementById('location-markers');
    const tooltip = document.getElementById('map-tooltip');
    
    if (!pathsGroup || !markersGroup) return;
    
    // Clear previous journey
    pathsGroup.innerHTML = '';
    markersGroup.innerHTML = '';
    
    const locations = journey.locations;
    const color = journey.color;
    
    // Draw animated path connecting all locations
    let pathData = `M ${locations[0].coords[0]} ${locations[0].coords[1]}`;
    for (let i = 1; i < locations.length; i++) {
      pathData += ` L ${locations[i].coords[0]} ${locations[i].coords[1]}`;
    }
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.7');
    path.setAttribute('stroke-dasharray', '8,4');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.classList.add('journey-path');
    
    // Animate the path
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;
    path.style.animation = 'drawPath 2s ease-in-out forwards';
    
    pathsGroup.appendChild(path);
    
    // Add CSS animation if not exists
    if (!document.getElementById('path-animation-style')) {
      const style = document.createElement('style');
      style.id = 'path-animation-style';
      style.textContent = `
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .location-marker { cursor: pointer; transition: all 0.3s; }
        .location-marker:hover { filter: url(#glow); transform: scale(1.3); }
      `;
      document.head.appendChild(style);
    }
    
    // Draw location markers with icons
    locations.forEach((loc, idx) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.classList.add('location-marker');
      group.setAttribute('transform', `translate(${loc.coords[0]}, ${loc.coords[1]})`);
      
      // Determine color based on type
      let markerColor = color;
      if (loc.type === 'holy') markerColor = '#4ECDC4';
      if (loc.type === 'miracle') markerColor = '#FFD93D';
      if (loc.type === 'start') markerColor = '#FF6B6B';
      
      // Outer ring (pulsing)
      const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outerRing.setAttribute('r', '12');
      outerRing.setAttribute('fill', markerColor);
      outerRing.setAttribute('opacity', '0.3');
      outerRing.style.animation = 'pulse 2s ease-in-out infinite';
      outerRing.style.animationDelay = `${idx * 0.2}s`;
      
      // Inner circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', markerColor);
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      
      // Person/icon emoji
      if (loc.person) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '5');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.textContent = loc.person;
        text.style.pointerEvents = 'none';
        text.style.animation = 'float 3s ease-in-out infinite';
        text.style.animationDelay = `${idx * 0.3}s`;
        group.appendChild(text);
      }
      
      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('y', '24');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', 'var(--text)');
      label.setAttribute('font-weight', 'bold');
      label.textContent = loc.name;
      label.style.pointerEvents = 'none';
      
      group.appendChild(outerRing);
      group.appendChild(circle);
      group.appendChild(label);
      
      // Tooltip on hover/touch
      const showTooltip = (e) => {
        const rect = document.getElementById('biblical-map').getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        tooltip.style.display = 'block';
        
        // Position tooltip, keeping it on screen
        let left = rect.left + loc.coords[0] + 15;
        let top = rect.top + loc.coords[1] - 30;
        
        // Adjust if tooltip would go off screen
        if (isMobile) {
          left = Math.min(left, window.innerWidth - 160);
          top = Math.max(top, 10);
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        document.getElementById('tooltip-title').textContent = loc.name;
        document.getElementById('tooltip-desc').textContent = loc.desc;
      };
      
      const hideTooltip = () => {
        tooltip.style.display = 'none';
      };
      
      group.addEventListener('mouseenter', showTooltip);
      group.addEventListener('mouseleave', hideTooltip);
      
      // Touch support for mobile
      group.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showTooltip(e);
        setTimeout(hideTooltip, 3000); // Auto-hide after 3 seconds on touch
      });
      
      markersGroup.appendChild(group);
    });
    
    showToast({ 
      title: `${journey.icon} ${journeyKey.toUpperCase()}`, 
      msg: `Following ${locations.length} locations`, 
      type: 'success',
      timeout: 2000
    });
  }
  
  function updateJourneyButtons() {
    document.querySelectorAll('.journey-btn').forEach(btn => {
      const isActive = btn.dataset.journey === currentJourney;
      btn.style.background = isActive ? 'var(--accent)' : 'var(--bg)';
      btn.style.color = isActive ? 'white' : 'var(--text)';
      btn.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
    });
  }
  
  function startLocationQuiz() {
    const locations = window.LocationModule?.locations || [];
    if (locations.length === 0) {
      showToast({ title: getText('error'), msg: getText('noLocationsLoaded'), type: 'error' });
      return;
    }
    
    // Pick 5 random locations
    const shuffled = locations.sort(() => 0.5 - Math.random());
    const quizLocations = shuffled.slice(0, 5);
    
    let html = '<div style=\"margin-bottom: 20px;\"><strong>Match these events to locations:</strong></div>';
    html += '<div style=\"display: grid; gap: 16px;\">';
    
    quizLocations.forEach((loc, i) => {
      const event = loc.key_events[0] || 'A significant biblical event';
      html += `
        <div style=\"padding: 16px; background: var(--bg-2); border-radius: 8px; border: 2px solid var(--border);\">
          <div style=\"font-weight: 600; margin-bottom: 8px; color: var(--accent);\">${i + 1}. ${event}</div>
          <div style=\"color: var(--muted); font-size: 14px;\">Answer: <strong style=\"color: var(--text);\">${loc.location_name}</strong></div>
        </div>
      `;
    });
    
    html += '</div>';
    html += '<div style=\"margin-top: 20px; text-align: center; color: var(--muted); font-size: 14px;\">Full quiz mode coming soon!</div>';
    
    openCommunityModal('📍 Location Quiz', html);
  }
  
  function filterLocations() {
    const testamentFilter = document.getElementById('testament-filter-locations');
    const importanceFilter = document.getElementById('importance-filter-locations');
    
    const filters = {
      testament: testamentFilter?.value || '',
      minImportance: parseInt(importanceFilter?.value || '0')
    };
    
    const filtered = window.LocationModule.filterLocations(filters);
    window.LocationModule.addLocationMarkers(filtered);
    renderLocationCards(filtered);
  }
  
  function renderLocationCards(locations) {
    const container = document.getElementById('locations-list');
    if (!container) return;
    
    container.innerHTML = '';
    const sorted = window.LocationModule.sortLocations(locations, 'importance');
    
    sorted.forEach(location => {
      const card = document.createElement('div');
      card.className = 'location-card';
      card.innerHTML = `
        <h3>${location.location_name}</h3>
        <div class="location-meta">
          <span>${location.testament_link}</span>
          <span>${location.era}</span>
          <span>${location.primary_role}</span>
          <span>⭐ ${location.importance}/10</span>
        </div>
        <div><strong>Key Events:</strong></div>
        <ul>
          ${location.key_events.map(event => `<li>${event}</li>`).join('')}
        </ul>
        <div style="margin-top: 12px;"><strong>Related Figures:</strong> ${location.related_figures.join(', ')}</div>
        <div style="margin-top: 8px; font-size: 14px; color: var(--muted);"><em>Modern location: ${location.modern_country}</em></div>
      `;
      
      card.addEventListener('click', () => showLocationDetails(location));
      container.appendChild(card);
    });
  }
  
  function showLocationDetails(location) {
    const html = `
      <div>
        <h3 style="margin-top: 0; color: var(--accent);">${location.location_name}</h3>
        <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <span style="padding: 6px 12px; background: var(--bg-3); border-radius: 12px; font-size: 13px;">${location.testament_link}</span>
          <span style="padding: 6px 12px; background: var(--bg-3); border-radius: 12px; font-size: 13px;">${location.era}</span>
          <span style="padding: 6px 12px; background: var(--bg-3); border-radius: 12px; font-size: 13px;">${location.primary_role}</span>
        </div>
        <div style="margin-bottom: 16px;">
          <strong>Key Events:</strong>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${location.key_events.map(event => `<li style="margin: 6px 0;">${event}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>Related Biblical Figures:</strong><br/>
          ${location.related_figures.join(', ')}
        </div>
        <div style="padding: 12px; background: var(--bg-2); border-radius: 6px; margin-top: 16px;">
          <strong>Modern Location:</strong> ${location.modern_country}<br/>
          <small style="color: var(--muted);">Coordinates: ${location.coordinates.lat}°N, ${location.coordinates.lon}°E</small>
        </div>
      </div>
    `;
    
    openCommunityModal(location.location_name, html);
  }
  */
  // ===== END LOCATIONS TAB =====

  // ===== CONCEPTS TAB =====
  let flashcardMode = false;
  let flashcardConcepts = [];
  let currentFlashcardIndex = 0;
  let flashcardRevealed = false;
  
  async function initConceptsTab() {
    if (conceptsInitialized) return;
    conceptsInitialized = true;
    
    if (!window.ConceptModule) {
      showToast({ title: getText('error'), msg: 'Concepts module not loaded', type: 'error' });
      return;
    }
    
    try {
      // Render all concepts
      renderConceptCards(window.ConceptModule.concepts);
    
    // Setup search
    const conceptSearch = document.getElementById('concept-search');
    if (conceptSearch) {
      conceptSearch.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = window.ConceptModule.searchConcepts(query);
        renderConceptCards(results);
      });
    }
    
    // Setup difficulty filter
    const difficultyFilter = document.getElementById('difficulty-filter-concepts');
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        const difficulty = e.target.value;
        if (difficulty) {
          const filtered = window.ConceptModule.getConceptsByDifficulty(difficulty);
          renderConceptCards(filtered);
        } else {
          renderConceptCards(window.ConceptModule.concepts);
        }
      });
    }
    
    // Random concept button
    const btnRandom = document.getElementById('btn-random-concept');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const concept = window.ConceptModule.getRandomConcept();
        if (concept) {
          showConceptDetails(concept);
        }
      });
    }
    
    // Flashcard mode button
    const btnFlashcardMode = document.getElementById('btn-flashcard-mode');
    if (btnFlashcardMode) {
      btnFlashcardMode.addEventListener('click', toggleFlashcardMode);
    }
    
    // Concept quiz button
    const btnConceptQuiz = document.getElementById('btn-concept-quiz');
    if (btnConceptQuiz) {
      btnConceptQuiz.addEventListener('click', startConceptQuiz);
    }
    
    // Flashcard controls
    setupFlashcardControls();
    } catch (error) {
      console.error('Error initializing concepts:', error);
      showToast({ title: getText('error'), msg: 'Failed to load concepts', type: 'error' });
    }
  }
  
  function toggleFlashcardMode() {
    flashcardMode = !flashcardMode;
    const container = document.getElementById('flashcard-container');
    const controls = document.getElementById('concepts-controls');
    const list = document.getElementById('concepts-list');
    const btnFlashcard = document.getElementById('btn-flashcard-mode');
    
    if (flashcardMode) {
      // Enter flashcard mode
      if (container) container.style.display = 'block';
      if (controls) controls.style.display = 'none';
      if (list) list.style.display = 'none';
      if (btnFlashcard) {
        btnFlashcard.style.background = 'var(--accent)';
        btnFlashcard.style.color = 'white';
        btnFlashcard.style.borderColor = 'var(--accent)';
        btnFlashcard.textContent = `📋 ${getText('showList')}`;
      }
      
      // Load concepts for flashcards
      flashcardConcepts = [...(window.ConceptModule?.concepts || [])];
      currentFlashcardIndex = 0;
      showFlashcard();
    } else {
      // Exit flashcard mode
      if (container) container.style.display = 'none';
      if (controls) controls.style.display = 'flex';
      if (list) list.style.display = 'grid';
      if (btnFlashcard) {
        btnFlashcard.style.background = 'var(--bg-2)';
        btnFlashcard.style.color = 'var(--text)';
        btnFlashcard.style.borderColor = 'var(--border)';
        btnFlashcard.textContent = `🎴 ${getText('flashcards')}`;
      }
    }
  }
  
  function setupFlashcardControls() {
    const flashcardEl = document.querySelector('#flashcard-container > div');
    if (flashcardEl) {
      flashcardEl.addEventListener('click', revealFlashcard);
    }
    
    const btnPrev = document.getElementById('btn-flashcard-prev');
    const btnNext = document.getElementById('btn-flashcard-next');
    const btnShuffle = document.getElementById('btn-flashcard-shuffle');
    
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentFlashcardIndex > 0) {
          currentFlashcardIndex--;
          flashcardRevealed = false;
          showFlashcard();
        }
      });
    }
    
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (currentFlashcardIndex < flashcardConcepts.length - 1) {
          currentFlashcardIndex++;
          flashcardRevealed = false;
          showFlashcard();
        }
      });
    }
    
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        flashcardConcepts.sort(() => 0.5 - Math.random());
        currentFlashcardIndex = 0;
        flashcardRevealed = false;
        showFlashcard();
        showToast({ title: '🔀 Shuffled', msg: 'Cards randomized', type: 'success', timeout: 1000 });
      });
    }
  }
  
  function showFlashcard() {
    if (flashcardConcepts.length === 0) return;
    
    const concept = flashcardConcepts[currentFlashcardIndex];
    const termEl = document.getElementById('flashcard-term');
    const definitionEl = document.getElementById('flashcard-definition');
    const hintEl = document.getElementById('flashcard-hint');
    const progressEl = document.getElementById('flashcard-progress');
    
    if (termEl) termEl.textContent = concept.term;
    if (definitionEl) {
      definitionEl.textContent = concept.definition;
      definitionEl.style.display = 'none';
    }
    if (hintEl) hintEl.style.display = 'block';
    if (progressEl) progressEl.textContent = `${currentFlashcardIndex + 1} / ${flashcardConcepts.length}`;
    
    flashcardRevealed = false;
  }
  
  function revealFlashcard() {
    const definitionEl = document.getElementById('flashcard-definition');
    const termEl = document.getElementById('flashcard-term');
    const hintEl = document.getElementById('flashcard-hint');
    
    if (!flashcardRevealed) {
      if (definitionEl) definitionEl.style.display = 'block';
      if (termEl) termEl.style.fontSize = '22px';
      if (hintEl) hintEl.style.display = 'none';
      flashcardRevealed = true;
    }
  }
  
  function startConceptQuiz() {
    const concepts = window.ConceptModule?.concepts || [];
    if (concepts.length === 0) {
      showToast({ title: getText('error'), msg: getText('noConceptsLoaded'), type: 'error' });
      return;
    }
    
    // Pick 5 random concepts
    const shuffled = concepts.sort(() => 0.5 - Math.random());
    const quizConcepts = shuffled.slice(0, 5);
    
    let html = '<div style=\"margin-bottom: 20px;\"><strong>Match these definitions to concepts:</strong></div>';
    html += '<div style=\"display: grid; gap: 16px;\">';
    
    quizConcepts.forEach((concept, i) => {
      html += `
        <div style=\"padding: 16px; background: var(--bg-2); border-radius: 8px; border: 2px solid var(--border);\">
          <div style=\"font-weight: 600; margin-bottom: 8px; color: var(--accent);\">${i + 1}. ${concept.definition.substring(0, 80)}...</div>
          <div style=\"color: var(--muted); font-size: 14px;\">Answer: <strong style=\"color: var(--text);\">${concept.term}</strong></div>
          <div style=\"margin-top: 8px; padding: 6px 12px; background: var(--bg-3); border-radius: 12px; display: inline-block; font-size: 12px;\">${concept.difficulty}</div>
        </div>
      `;
    });
    
    html += '</div>';
    html += '<div style=\"margin-top: 20px; text-align: center; color: var(--muted); font-size: 14px;\">Interactive quiz mode coming soon!</div>';
    
    openCommunityModal('📚 Concept Quiz', html);
  }
  
  function renderConceptCards(concepts) {
    const container = document.getElementById('concepts-list');
    if (!container) return;
    
    container.innerHTML = '';
    const sorted = window.ConceptModule.sortConcepts(concepts, 'term');
    
    sorted.forEach(concept => {
      const card = document.createElement('div');
      card.className = 'concept-card';
      card.innerHTML = `
        <h3>${concept.term}</h3>
        <div class="concept-difficulty">${concept.difficulty}</div>
        <div class="concept-definition">${concept.definition}</div>
        <div class="concept-tags">
          ${concept.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      `;
      
      card.addEventListener('click', () => showConceptDetails(concept));
      container.appendChild(card);
    });
    
    if (concepts.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--muted);">${getText('noConceptsFound')}</p>`;
    }
  }
  
  function showConceptDetails(concept) {
    const html = `
      <div>
        <h3 style="margin-top: 0; color: var(--accent);">${concept.term}</h3>
        <div style="display: inline-block; padding: 6px 12px; background: var(--bg-3); border-radius: 12px; font-size: 13px; margin-bottom: 16px;">
          ${concept.difficulty}
        </div>
        <div style="margin-bottom: 16px; line-height: 1.6;">
          ${concept.definition}
        </div>
        ${concept.key_example.length > 0 ? `
          <div style="margin-bottom: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
            <strong>Examples:</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              ${concept.key_example.map(ex => `<li style="margin: 6px 0; line-height: 1.5;">${ex}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${concept.biblical_references.length > 0 ? `
          <div style="padding: 12px; background: var(--bg-2); border-radius: 6px; margin-top: 16px;">
            <strong>Biblical References:</strong><br/>
            <span style="font-size: 14px; color: var(--muted);">${concept.biblical_references.join(', ')}</span>
          </div>
        ` : ''}
        <div style="margin-top: 16px;">
          <strong>Tags:</strong>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            ${concept.tags.map(tag => `<span style="padding: 4px 10px; background: var(--bg-3); border: 1px solid var(--border); border-radius: 12px; font-size: 12px;">${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
    
    openCommunityModal(concept.term, html);
  }

  // Initialize new tabs when clicked
  document.getElementById('tab-concepts')?.addEventListener('click', () => {
    if (!conceptsInitialized) {
      initConceptsTab();
    }
  });

  // Feedback System
  function initFeedback() {
    const modal = document.getElementById('feedback-modal');
    const btnOpen = document.getElementById('btn-feedback');
    const btnClose = document.getElementById('btn-feedback-close');
    const btnCancel = document.getElementById('btn-feedback-cancel');
    const btnSubmit = document.getElementById('btn-feedback-submit');
    const ratingBtns = document.querySelectorAll('.rating-btn');
    
    if (!modal || !btnOpen) return;

    let selectedRating = 0;
    let scrollPosition = 0; // Store scroll position

    // Open Modal
    btnOpen.addEventListener('click', () => {
      // Save current scroll position before locking
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      // Show modal
      modal.style.display = 'flex';
      modal.classList.add('show');
      
      // Lock body scroll and maintain position
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollPosition}px`;
      
      // Reset form
      selectedRating = 0;
      ratingBtns.forEach(b => b.classList.remove('selected'));
      const msgEl = document.getElementById('feedback-message');
      if (msgEl) msgEl.value = '';
      const expEl = document.getElementById('feedback-experience');
      if (expEl) expEl.value = '';
      
      // Reset rating selects
      const selects = ['rating-solo', 'rating-timed', 'rating-challenge', 'rating-study', 'rating-accuracy', 'rating-scenarios', 'rating-online', 'rating-classroom'];
      selects.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.selectedIndex = 0;
      });
    });

    // Close Modal
    const close = () => {
      modal.classList.remove('show');
      
      // Restore body scroll
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollPosition);
      
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300); // Wait for animation
    };
    if(btnClose) btnClose.addEventListener('click', close);
    if(btnCancel) btnCancel.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Rating Selection
    ratingBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.rating);
        ratingBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Submit
    if(btnSubmit) {
      btnSubmit.addEventListener('click', async () => {
        const message = document.getElementById('feedback-message').value.trim();
        const experience = document.getElementById('feedback-experience')?.value.trim();
        
        const ratingSolo = document.getElementById('rating-solo')?.value;
        const ratingTimed = document.getElementById('rating-timed')?.value;
        const ratingChallenge = document.getElementById('rating-challenge')?.value;
        const ratingStudy = document.getElementById('rating-study')?.value;
        const ratingAccuracy = document.getElementById('rating-accuracy')?.value;
        const ratingScenarios = document.getElementById('rating-scenarios')?.value;
        const ratingOnline = document.getElementById('rating-online')?.value;
        const ratingClassroom = document.getElementById('rating-classroom')?.value;

        if (!message && !experience && selectedRating === 0 && !ratingSolo && !ratingTimed && !ratingChallenge && !ratingStudy && !ratingAccuracy && !ratingScenarios && !ratingOnline && !ratingClassroom) {
          showToast({ title: getText('feedback'), msg: getText('feedbackPrompt'), type: 'warn' });
          return;
        }
        
        // Validate feedback message content
        if (message && window.ContentFilter) {
          const validation = window.ContentFilter.validateContent(message, {
            type: 'feedback',
            minLength: 0,
            maxLength: 1000,
            allowUrls: false,
            allowEmails: true
          });
          if (!validation.valid) {
            showToast({ title: '❌ Invalid Feedback', msg: validation.error, type: 'error', timeout: 3000 });
            return;
          }
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = getText('sendingFeedback');

        const feedbackData = {
          rating: selectedRating,
          experience: experience || null,
          ratingSolo: ratingSolo || null,
          ratingTimed: ratingTimed || null,
          ratingChallenge: ratingChallenge || null,
          ratingStudy: ratingStudy || null,
          ratingAccuracy: ratingAccuracy || null,
          ratingScenarios: ratingScenarios || null,
          ratingOnline: ratingOnline || null,
          ratingClassroom: ratingClassroom || null,
          message,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };

        try {
          // Check for global database object from firebase-config.js
          if (typeof database !== 'undefined' && database) {
            await database.ref('feedback').push(feedbackData);
            showToast({ title: getText('thankYou'), msg: getText('feedbackReceived'), type: 'success' });
          } else {
            // Fallback if Firebase not loaded
            console.log('Feedback (simulated):', feedbackData);
            showToast({ title: getText('thankYou'), msg: getText('feedbackSimulated'), type: 'success' });
          }
          close();
        } catch (error) {
          console.error('Feedback error:', error);
          showToast({ title: getText('feedbackError'), msg: getText('feedbackErrorMsg'), type: 'error' });
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.textContent = getText('sendFeedback');
        }
      });
    }
  }

  // Initialize modules on page load
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      initFeedback();
    } catch (error) {
      console.error('Failed to initialize feedback:', error);
    }
    
    // Load people data for stats
    try {
      const response = await fetch('assets/data/people.json');
      if (response.ok) {
        const people = await response.json();
        updateCommunityStats(people);
      } else {
        console.warn('Failed to fetch people data:', response.status);
      }
    } catch (e) {
      console.error('Error loading people data for stats:', e);
      showToast({ title: getText('error'), msg: 'Failed to load statistics', type: 'warn', timeout: 2000 });
    }

    if (window.LocationModule) {
      await window.LocationModule.init();
      console.log('✓ Locations loaded:', window.LocationModule.locations.length);
    }
    
    if (window.ConceptModule) {
      await window.ConceptModule.init();
      console.log('✓ Concepts loaded:', window.ConceptModule.concepts.length);
    }

    // Initialize authentication UI
    if (window.initAuthUI && typeof window.initAuthUI === 'function') {
      window.initAuthUI();
      console.log('✓ Authentication UI initialized');
    }
  });

  function updateCommunityStats(people) {
    if (!people || !Array.isArray(people)) return;
    
    const total = people.length;
    const ot = people.filter(p => p.testament === 'ot').length;
    const nt = people.filter(p => p.testament === 'nt').length;
    const withVerses = people.filter(p => p.verses && p.verses.length > 0).length;
    
    const elTotal = document.getElementById('stat-people');
    const elOt = document.getElementById('stat-ot');
    const elNt = document.getElementById('stat-nt');
    const elVerses = document.getElementById('stat-verses');
    
    if (elTotal) elTotal.textContent = total;
    if (elOt) elOt.textContent = ot;
    if (elNt) elNt.textContent = nt;
    if (elVerses) elVerses.textContent = withVerses;
  }

  // Localize static text
  if (typeof window.updateAllText === 'function') {
    window.updateAllText();
  }

  // =========================
  // Join Room Modal
  // =========================
  const joinRoomModal = document.getElementById('join-room-modal');
  const joinRoomCodeDisplay = document.getElementById('join-room-code-display');
  const joinPlayerNameInput = document.getElementById('join-player-name');
  const btnJoinCancel = document.getElementById('btn-join-cancel');
  const btnJoinConfirm = document.getElementById('btn-join-confirm');
  const btnJoinRoomClose = document.getElementById('btn-join-room-close');
  
  function showJoinRoomModal(roomCode, room) {
    currentRoomData = { roomCode, room };
    if (joinRoomCodeDisplay) joinRoomCodeDisplay.textContent = roomCode;
    if (joinPlayerNameInput) {
      // Try to get name from profile
      try {
        const profile = JSON.parse(localStorage.getItem('communityProfile') || '{}');
        joinPlayerNameInput.value = profile.displayName || '';
      } catch(_) {
        joinPlayerNameInput.value = '';
      }
    }
    if (joinRoomModal) joinRoomModal.style.display = 'flex';
  }
  
  function hideJoinRoomModal() {
    if (joinRoomModal) joinRoomModal.style.display = 'none';
    currentRoomData = null;
  }
  
  if (btnJoinCancel) btnJoinCancel.addEventListener('click', hideJoinRoomModal);
  if (btnJoinRoomClose) btnJoinRoomClose.addEventListener('click', hideJoinRoomModal);
  
  if (btnJoinConfirm) {
    btnJoinConfirm.addEventListener('click', async () => {
      const playerName = joinPlayerNameInput?.value.trim();
      if (!playerName) {
        showToast({ title: getText('error'), msg: getText('pleaseEnterName'), type: 'warn' });
        return;
      }
      
      // Validate player name
      const nameValidation = validateUsername(playerName);
      if (!nameValidation.valid) {
        showToast({ title: '❌ Invalid Name', msg: nameValidation.error, type: 'error', timeout: 3000 });
        return;
      }
      
      if (!currentRoomData) return;
      
      btnJoinConfirm.disabled = true;
      btnJoinConfirm.textContent = getText('joining');
      
      try {
        // Redirect to main app with room code and player name
        const url = `index.html?room=${currentRoomData.roomCode}&playerName=${encodeURIComponent(playerName)}`;
        window.location.href = url;
      } catch (error) {
        console.error('Error joining room:', error);
        showToast({ title: getText('error'), msg: `${getText('failedToJoinRoom')}: ${error.message}`, type: 'error' });
        btnJoinConfirm.disabled = false;
        btnJoinConfirm.textContent = getText('joinGame');
      }
    });
  }
  
  // =========================
  // Create Room Modal
  // =========================
  const createRoomModal = document.getElementById('create-room-modal');
  const createHostNameInput = document.getElementById('create-host-name');
  const createNumQuestionsSelect = document.getElementById('create-num-questions');
  const createDifficultySelect = document.getElementById('create-difficulty');
  const btnCreateCancel = document.getElementById('btn-create-cancel');
  const btnCreateConfirm = document.getElementById('btn-create-confirm');
  const btnCreateRoomClose = document.getElementById('btn-create-room-close');
  const btnCreateRoom = document.getElementById('btn-create-room');
  
  function showCreateRoomModal() {
    if (createHostNameInput) {
      // Try to get name from profile
      try {
        const profile = JSON.parse(localStorage.getItem('communityProfile') || '{}');
        createHostNameInput.value = profile.displayName || '';
      } catch(_) {
        createHostNameInput.value = '';
      }
    }
    if (createRoomModal) createRoomModal.style.display = 'flex';
  }
  
  function hideCreateRoomModal() {
    if (createRoomModal) createRoomModal.style.display = 'none';
  }
  
  if (btnCreateRoom) btnCreateRoom.addEventListener('click', showCreateRoomModal);
  if (btnCreateCancel) btnCreateCancel.addEventListener('click', hideCreateRoomModal);
  if (btnCreateRoomClose) btnCreateRoomClose.addEventListener('click', hideCreateRoomModal);
  
  if (btnCreateConfirm) {
    btnCreateConfirm.addEventListener('click', async () => {
      const hostName = createHostNameInput?.value.trim();
      const numQuestions = parseInt(createNumQuestionsSelect?.value || '10');
      const difficulty = createDifficultySelect?.value || 'medium';
      
      if (!hostName) {
        showToast({ title: getText('error'), msg: getText('pleaseEnterName'), type: 'warn' });
        return;
      }
      
      // Validate host name
      const nameValidation = validateUsername(hostName);
      if (!nameValidation.valid) {
        showToast({ title: '❌ Invalid Name', msg: nameValidation.error, type: 'error', timeout: 3000 });
        return;
      }
      
      // Check if RemoteChallenge module is available
      if (typeof RemoteChallenge === 'undefined') {
        showToast({ title: getText('error'), msg: getText('remoteModuleNotLoaded'), type: 'error' });
        return;
      }
      
      btnCreateConfirm.disabled = true;
      btnCreateConfirm.textContent = getText('creating');
      
      try {
        // Create room using RemoteChallenge module
        const result = await RemoteChallenge.createRoom(hostName, {
          numQuestions,
          difficulty,
          timeLimit: 60
        });
        
        hideCreateRoomModal();
        showToast({ title: getText('roomCreated'), msg: getText('roomCreatedSuccess', { roomCode: result.roomCode }), type: 'success', timeout: 2000 });
        
        // Redirect to main app with room code
        setTimeout(() => {
          window.location.href = `index.html?room=${result.roomCode}&host=true`;
        }, 1000);
        
      } catch (error) {
        console.error('Error creating room:', error);
        showToast({ title: getText('error'), msg: `${getText('failedToCreateRoom')}: ${error.message}`, type: 'error' });
        btnCreateConfirm.disabled = false;
        btnCreateConfirm.textContent = getText('createRoom');
      }
    });
  }
  
  // Close modals on click outside
  window.addEventListener('click', (e) => {
    if (e.target === joinRoomModal) hideJoinRoomModal();
    if (e.target === createRoomModal) hideCreateRoomModal();
  });
  
  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (joinRoomModal && joinRoomModal.style.display === 'flex') hideJoinRoomModal();
      if (createRoomModal && createRoomModal.style.display === 'flex') hideCreateRoomModal();
    }
  });
  
  // Initialize - check guidelines acceptance
  checkGuidelines();
})();
