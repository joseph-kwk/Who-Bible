const TRANSLATIONS = {
  en: {
    // Brand - Keep "Who-Bible" untranslated
    brandTitle: "Who-Bible",
    brandDesc: "A beautiful, accurate, and extensible Bible people challenge. Learn who did what, ages, mothers, occupations, and events — with verse references.",
    
    // Setup Panel
    gameSettings: "Game Settings",
    difficulty: "Difficulty",
    difficultyEasy: "Beginner",
    difficultyMedium: "Intermediate", 
    difficultyHard: "Expert",
    numQuestions: "Number of Questions",
    timeLimit: "Time Limit (seconds)",
    
    // Game Modes
    gameModes: "Game Modes",
    soloMode: "Solo Mode",
    soloDesc: "Practice at your own pace",
    timedMode: "Timed Mode", 
    timedDesc: "Race against the clock",
    challengeMode: "Challenge Mode",
    challengeDesc: "Two players compete",
    studyMode: "Study Mode",
    studyDesc: "Browse and learn",
    
    // Data Management
    dataManagement: "Data Management",
    exportJSON: "Export JSON",
    importJSON: "Import JSON", 
    resetData: "Reset Data",
    
    // Game Area
    backToSetup: "← Back to Setup",
    score: "Score",
    streak: "Streak",
    question: "Question",
    time: "Time",
    player: "Player",
    next: "Next",
    pause: "Pause",
    quit: "Quit",
    welcomeMessage: "Click a mode button to start your quiz!",
    
    // Study Panel
    backFromStudy: "← Back to Setup",
    studyTitle: "Study Mode",
    searchPlaceholder: "Search people (e.g. Moses)",
    shuffleList: "Shuffle",
    sortBy: "Sort by:",
    sortNameAsc: "Name (A–Z)",
    sortNameDesc: "Name (Z–A)",
    filters: "Filters:",
    filterMother: "Mother",
    filterOccupation: "Occupation", 
    filterAge: "Age notes",
    people: "People",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    
    // Challenge Modal
    challengeTitle: "Challenge Mode Setup",
    player1Name: "Player 1 Name",
    player2Name: "Player 2 Name",
    startChallenge: "Start Challenge",
    cancel: "Cancel",
    
    // Notifications
    soloStart: "Solo Mode",
    soloStartMsg: "Answer at your own pace. Good luck!",
    timedStart: "Timed Mode",
    timedStartMsg: "Race against the clock! Time is ticking...",
    challengeStart: "Challenge Mode", 
    challengeStartMsg: "Two players will compete! Good luck to both!",
    studyStart: "Study Mode",
    studyStartMsg: "Browse and learn about Bible people at your own pace.",
    correctAnswer: "Correct!",
    correctMsg: "Great job! +1 point",
    wrongAnswer: "Incorrect!",
    wrongMsg: "The correct answer was: {answer}",
    timeWarning: "Time Warning",
    timeWarningMsg: "Only {time} seconds remaining!",
    timeUp: "Time's Up!",
    timeUpMsg: "Quiz completed!",
    challengeTurn: "Player {player}'s Turn",
    challengeTurnMsg: "It's {player}'s turn to answer!",
    exportSuccess: "Export Successful",
    exportMsg: "Data exported to clipboard",
    importSuccess: "Import Successful", 
    importMsg: "Data imported successfully",
    resetSuccess: "Reset Successful",
    resetMsg: "All data has been reset",
    importError: "Import Error",
    importErrorMsg: "Invalid JSON format. Please check your data.",
    
    // Summary Modal
    summaryTitle: "Quiz Summary",
    summaryStats: "Final Score: {score}/{total} ({percentage}%) | Streak: {streak}",
    summaryCorrect: "Correct Answers",
    summaryIncorrect: "Incorrect Answers",
    
    // Theme Toggle
    toggleTheme: "Toggle theme",
    close: "Close",
    
    // Language Selector
    language: "Language",
    english: "English",
    french: "Français", 
    spanish: "Español",
    
    // Question Templates
    questionWhoDid: "Who is known for: {event}?",
    questionWhoMother: "Who was the mother of {name}?",
    questionOccupation: "What was {name}'s occupation or role?",
    questionAge: "Which age-note is correct for {name}?",
    questionEvent: "Which person is linked to: {event}?",
    fallbackEvent: "a notable event"
  },
  
  fr: {
    // Brand - Keep "Who-Bible" untranslated
    brandTitle: "Who-Bible",
    brandDesc: "Un défi biblique beau, précis et extensible. Apprenez qui a fait quoi, les âges, les mères, les occupations et les événements — avec références bibliques.",
    
    // Setup Panel
    gameSettings: "Paramètres du Jeu",
    difficulty: "Difficulté",
    difficultyEasy: "Débutant",
    difficultyMedium: "Intermédiaire",
    difficultyHard: "Expert", 
    numQuestions: "Nombre de Questions",
    timeLimit: "Limite de Temps (secondes)",
    
    // Game Modes
    gameModes: "Modes de Jeu",
    soloMode: "Mode Solo",
    soloDesc: "Pratiquez à votre rythme",
    timedMode: "Mode Chronométré",
    timedDesc: "Course contre la montre",
    challengeMode: "Mode Défi",
    challengeDesc: "Deux joueurs s'affrontent",
    studyMode: "Mode Étude",
    studyDesc: "Parcourez et apprenez",
    
    // Data Management
    dataManagement: "Gestion des Données",
    exportJSON: "Exporter JSON",
    importJSON: "Importer JSON",
    resetData: "Réinitialiser les Données",
    
    // Game Area
    backToSetup: "← Retour à la Configuration",
    score: "Score",
    streak: "Série",
    question: "Question",
    time: "Temps",
    player: "Joueur",
    next: "Suivant",
    pause: "Pause",
    quit: "Quitter",
    welcomeMessage: "Cliquez sur un bouton de mode pour commencer votre quiz !",
    
    // Study Panel
    backFromStudy: "← Retour à la Configuration",
    studyTitle: "Mode Étude",
    searchPlaceholder: "Rechercher des personnes (ex. Moïse)",
    shuffleList: "Mélanger",
    sortBy: "Trier par :",
    sortNameAsc: "Nom (A–Z)",
    sortNameDesc: "Nom (Z–A)",
    filters: "Filtres :",
    filterMother: "Mère",
    filterOccupation: "Occupation",
    filterAge: "Notes d'âge",
    people: "Personnes",
    expandAll: "Tout développer",
    collapseAll: "Tout réduire",
    
    // Challenge Modal
    challengeTitle: "Configuration du Mode Défi",
    player1Name: "Nom du Joueur 1",
    player2Name: "Nom du Joueur 2", 
    startChallenge: "Commencer le Défi",
    cancel: "Annuler",
    
    // Notifications
    soloStart: "Mode Solo",
    soloStartMsg: "Répondez à votre rythme. Bonne chance !",
    timedStart: "Mode Chronométré",
    timedStartMsg: "Course contre la montre ! Le temps presse...",
    challengeStart: "Mode Défi",
    challengeStartMsg: "Deux joueurs vont s'affronter ! Bonne chance à tous les deux !",
    studyStart: "Mode Étude",
    studyStartMsg: "Parcourez et apprenez sur les personnages bibliques à votre rythme.",
    correctAnswer: "Correct !",
    correctMsg: "Excellent travail ! +1 point",
    wrongAnswer: "Incorrect !",
    wrongMsg: "La bonne réponse était : {answer}",
    timeWarning: "Avertissement de Temps",
    timeWarningMsg: "Il ne reste que {time} secondes !",
    timeUp: "Temps Écoulé !",
    timeUpMsg: "Quiz terminé !",
    challengeTurn: "Tour du Joueur {player}",
    challengeTurnMsg: "C'est au tour de {player} de répondre !",
    exportSuccess: "Export Réussi",
    exportMsg: "Données exportées dans le presse-papiers",
    importSuccess: "Import Réussi",
    importMsg: "Données importées avec succès",
    resetSuccess: "Réinitialisation Réussie",
    resetMsg: "Toutes les données ont été réinitialisées",
    importError: "Erreur d'Import",
    importErrorMsg: "Format JSON invalide. Veuillez vérifier vos données.",
    
    // Summary Modal
    summaryTitle: "Résumé du Quiz",
    summaryStats: "Score Final : {score}/{total} ({percentage}%) | Série : {streak}",
    
    // Theme Toggle
    toggleTheme: "Basculer le thème",
    summaryCorrect: "Réponses Correctes",
    summaryIncorrect: "Réponses Incorrectes",
    close: "Fermer",
    
    // Language Selector
    language: "Langue",
    english: "English",
    french: "Français",
    spanish: "Español",
    
    // Question Templates
    questionWhoDid: "Qui est connu pour : {event} ?",
    questionWhoMother: "Qui était la mère de {name} ?",
    questionOccupation: "Quelle était l'occupation ou le rôle de {name} ?",
    questionAge: "Quelle note d'âge est correcte pour {name} ?",
    questionEvent: "Quelle personne est liée à : {event} ?",
    fallbackEvent: "un événement notable"
  },
  
  es: {
    // Brand - Keep "Who-Bible" untranslated
    brandTitle: "Who-Bible",
    brandDesc: "Un hermoso, preciso y extensible desafío bíblico. Aprende quién hizo qué, edades, madres, ocupaciones y eventos — con referencias bíblicas.",
    
    // Setup Panel
    gameSettings: "Configuración del Juego",
    difficulty: "Dificultad",
    difficultyEasy: "Principiante",
    difficultyMedium: "Intermedio",
    difficultyHard: "Experto",
    numQuestions: "Número de Preguntas",
    timeLimit: "Límite de Tiempo (segundos)",
    
    // Game Modes
    gameModes: "Modos de Juego",
    soloMode: "Modo Individual",
    soloDesc: "Practica a tu propio ritmo",
    timedMode: "Modo Cronometrado",
    timedDesc: "Carrera contra el tiempo",
    challengeMode: "Modo Desafío",
    challengeDesc: "Dos jugadores compiten",
    studyMode: "Modo Estudio",
    studyDesc: "Navega y aprende",
    
    // Data Management
    dataManagement: "Gestión de Datos",
    exportJSON: "Exportar JSON",
    importJSON: "Importar JSON",
    resetData: "Restablecer Datos",
    
    // Game Area
    backToSetup: "← Volver a Configuración",
    score: "Puntuación",
    streak: "Racha",
    question: "Pregunta",
    time: "Tiempo",
    player: "Jugador",
    next: "Siguiente",
    pause: "Pausa",
    quit: "Salir",
    welcomeMessage: "¡Haz clic en un botón de modo para comenzar tu cuestionario!",
    
    // Study Panel
    backFromStudy: "← Volver a Configuración",
    studyTitle: "Modo Estudio",
    searchPlaceholder: "Buscar personas (ej. Moisés)",
    shuffleList: "Mezclar",
    sortBy: "Ordenar por:",
    sortNameAsc: "Nombre (A–Z)",
    sortNameDesc: "Nombre (Z–A)",
    filters: "Filtros:",
    filterMother: "Madre",
    filterOccupation: "Ocupación",
    filterAge: "Notas de edad",
    people: "Personas",
    expandAll: "Expandir todo",
    collapseAll: "Contraer todo",
    
    // Challenge Modal
    challengeTitle: "Configuración del Modo Desafío",
    player1Name: "Nombre del Jugador 1",
    player2Name: "Nombre del Jugador 2",
    startChallenge: "Comenzar Desafío",
    cancel: "Cancelar",
    
    // Notifications
    soloStart: "Modo Individual",
    soloStartMsg: "Responde a tu propio ritmo. ¡Buena suerte!",
    timedStart: "Modo Cronometrado",
    timedStartMsg: "¡Carrera contra el tiempo! El tiempo corre...",
    challengeStart: "Modo Desafío",
    challengeStartMsg: "¡Dos jugadores competirán! ¡Buena suerte a ambos!",
    studyStart: "Modo Estudio",
    studyStartMsg: "Navega y aprende sobre personajes bíblicos a tu propio ritmo.",
    correctAnswer: "¡Correcto!",
    correctMsg: "¡Excelente trabajo! +1 punto",
    wrongAnswer: "¡Incorrecto!",
    wrongMsg: "La respuesta correcta era: {answer}",
    timeWarning: "Advertencia de Tiempo",
    timeWarningMsg: "¡Solo quedan {time} segundos!",
    timeUp: "¡Se Acabó el Tiempo!",
    timeUpMsg: "¡Cuestionario completado!",
    challengeTurn: "Turno del Jugador {player}",
    challengeTurnMsg: "¡Es el turno de {player} de responder!",
    exportSuccess: "Exportación Exitosa",
    exportMsg: "Datos exportados al portapapeles",
    importSuccess: "Importación Exitosa",
    importMsg: "Datos importados exitosamente",
    resetSuccess: "Restablecimiento Exitoso",
    resetMsg: "Todos los datos han sido restablecidos",
    importError: "Error de Importación",
    importErrorMsg: "Formato JSON inválido. Por favor verifica tus datos.",
    
    // Summary Modal
    summaryTitle: "Resumen del Cuestionario",
    
    // Theme Toggle
    toggleTheme: "Cambiar tema",
    summaryStats: "Puntuación Final: {score}/{total} ({percentage}%) | Racha: {streak}",
    summaryCorrect: "Respuestas Correctas",
    summaryIncorrect: "Respuestas Incorrectas",
    close: "Cerrar",
    
    // Language Selector
    language: "Idioma",
    english: "English",
    french: "Français",
    spanish: "Español",
    
    // Question Templates
    questionWhoDid: "¿Quién es conocido por: {event}?",
    questionWhoMother: "¿Quién era la madre de {name}?",
    questionOccupation: "¿Cuál era la ocupación o rol de {name}?",
    questionAge: "¿Qué nota de edad es correcta para {name}?",
    questionEvent: "¿Qué persona está relacionada con: {event}?",
    fallbackEvent: "un evento notable"
  }
};

// Language management functions
let currentLanguage = 'en';

function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem('who-bible-language', lang);
    updateAllText();
  }
}

function getText(key, params = {}) {
  let text = TRANSLATIONS[currentLanguage][key] || TRANSLATIONS['en'][key] || key;
  
  // Replace parameters in the text
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

function updateAllText() {
  // Update brand
  const brandTitle = document.querySelector('.brand-title');
  const brandDesc = document.querySelector('.brand-desc');
  if (brandTitle) brandTitle.textContent = getText('brandTitle');
  if (brandDesc) brandDesc.textContent = getText('brandDesc');
  
  // Update setup panel
  const setupSections = document.querySelectorAll('.setup-section h3');
  setupSections.forEach(section => {
    const text = section.textContent.toLowerCase();
    if (text.includes('game settings') || text.includes('paramètres') || text.includes('configuración')) {
      section.textContent = getText('gameSettings');
    } else if (text.includes('game modes') || text.includes('modes de jeu') || text.includes('modos de juego')) {
      section.textContent = getText('gameModes');
    } else if (text.includes('data management') || text.includes('gestion des données') || text.includes('gestión de datos')) {
      section.textContent = getText('dataManagement');
    }
  });
  
  // Update labels
  const labels = document.querySelectorAll('label');
  labels.forEach(label => {
    const text = label.textContent.toLowerCase();
    if (text.includes('difficulty') || text.includes('difficulté') || text.includes('dificultad')) {
      label.textContent = getText('difficulty');
    } else if (text.includes('number of questions') || text.includes('nombre de questions') || text.includes('número de preguntas')) {
      label.textContent = getText('numQuestions');
    } else if (text.includes('time limit') || text.includes('limite de temps') || text.includes('límite de tiempo')) {
      label.textContent = getText('timeLimit');
    } else if (text.includes('sort by') || text.includes('trier par') || text.includes('ordenar por')) {
      label.textContent = getText('sortBy');
    } else if (text.includes('filters') || text.includes('filtres') || text.includes('filtros')) {
      label.textContent = getText('filters');
    } else if (text.includes('language') || text.includes('langue') || text.includes('idioma')) {
      label.textContent = getText('language');
    }
  });
  
  // Update mode buttons
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    const title = btn.querySelector('.mode-title');
    const desc = btn.querySelector('.mode-desc');
    if (title && desc) {
      const icon = btn.querySelector('.mode-icon').textContent;
      if (icon === '📚') {
        title.textContent = getText('soloMode');
        desc.textContent = getText('soloDesc');
      } else if (icon === '⏱️') {
        title.textContent = getText('timedMode');
        desc.textContent = getText('timedDesc');
      } else if (icon === '⚔️') {
        title.textContent = getText('challengeMode');
        desc.textContent = getText('challengeDesc');
      } else if (icon === '🔍') {
        title.textContent = getText('studyMode');
        desc.textContent = getText('studyDesc');
      }
    }
  });
  
  // Update buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    const text = btn.textContent.toLowerCase();
    if (text.includes('export json') || text.includes('exporter json') || text.includes('exportar json')) {
      btn.textContent = getText('exportJSON');
    } else if (text.includes('import json') || text.includes('importer json') || text.includes('importar json')) {
      btn.textContent = getText('importJSON');
    } else if (text.includes('reset data') || text.includes('réinitialiser') || text.includes('restablecer')) {
      btn.textContent = getText('resetData');
    } else if (text.includes('shuffle') || text.includes('mélanger') || text.includes('mezclar')) {
      btn.textContent = getText('shuffleList');
    } else if (text.includes('expand all') || text.includes('tout développer') || text.includes('expandir todo')) {
      btn.textContent = getText('expandAll');
    } else if (text.includes('collapse all') || text.includes('tout réduire') || text.includes('contraer todo')) {
      btn.textContent = getText('collapseAll');
    } else if (text.includes('next') || text.includes('suivant') || text.includes('siguiente')) {
      btn.textContent = getText('next');
    } else if (text.includes('pause') || text.includes('pause') || text.includes('pausa')) {
      btn.textContent = getText('pause');
    } else if (text.includes('quit') || text.includes('quitter') || text.includes('salir')) {
      btn.textContent = getText('quit');
    } else if (text.includes('close') || text.includes('fermer') || text.includes('cerrar')) {
      btn.textContent = getText('close');
    } else if (text.includes('cancel') || text.includes('annuler') || text.includes('cancelar')) {
      btn.textContent = getText('cancel');
    }
  });
  
  // Update placeholders
  const searchInput = document.getElementById('search-person');
  if (searchInput) {
    searchInput.placeholder = getText('searchPlaceholder');
  }
  
  // Update welcome message
  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) {
    const p = welcomeMsg.querySelector('p');
    if (p) p.textContent = getText('welcomeMessage');
  }
  
  // Update titles
  const gameTitle = document.getElementById('game-title');
  const studyTitle = document.querySelector('.study-title');
  if (gameTitle && gameTitle.textContent.includes('Game Mode')) {
    gameTitle.textContent = getText('gameModes');
  }
  if (studyTitle) {
    studyTitle.textContent = getText('studyTitle');
  }
  
  // Update back buttons
  const backButtons = document.querySelectorAll('.back-btn');
  backButtons.forEach(btn => {
    if (btn.textContent.includes('Back to Setup')) {
      btn.textContent = getText('backToSetup');
    } else if (btn.textContent.includes('Back from Study')) {
      btn.textContent = getText('backFromStudy');
    }
  });
  
  // Update status text
  const statusElements = document.querySelectorAll('.status .small');
  statusElements.forEach(el => {
    const text = el.textContent.toLowerCase();
    if (text.includes('score')) {
      el.innerHTML = el.innerHTML.replace('Score:', getText('score') + ':');
    } else if (text.includes('streak')) {
      el.innerHTML = el.innerHTML.replace('Streak:', getText('streak') + ':');
    } else if (text.includes('question')) {
      el.innerHTML = el.innerHTML.replace('Question:', getText('question') + ':');
    } else if (text.includes('time')) {
      el.innerHTML = el.innerHTML.replace('Time:', getText('time') + ':');
    } else if (text.includes('player')) {
      el.innerHTML = el.innerHTML.replace('Player:', getText('player') + ':');
    }
  });
  
  // Update people count
  const peopleCount = document.getElementById('people-count');
  if (peopleCount) {
    const parent = peopleCount.parentElement;
    if (parent) {
      parent.innerHTML = parent.innerHTML.replace('People:', getText('people') + ':');
    }
  }
  
  // Update filter chips
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    const text = chip.textContent.toLowerCase();
    if (text.includes('mother') || text.includes('mère') || text.includes('madre')) {
      chip.innerHTML = chip.innerHTML.replace(/Mother|Mère|Madre/, getText('filterMother'));
    } else if (text.includes('occupation') || text.includes('occupation') || text.includes('ocupación')) {
      chip.innerHTML = chip.innerHTML.replace(/Occupation|Occupation|Ocupación/, getText('filterOccupation'));
    } else if (text.includes('age notes') || text.includes('notes d\'âge') || text.includes('notas de edad')) {
      chip.innerHTML = chip.innerHTML.replace(/Age notes|Notes d'âge|Notas de edad/, getText('filterAge'));
    }
  });
  
  // Update select options
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    if (select.id === 'difficulty') {
      const options = select.querySelectorAll('option');
      options[0].textContent = getText('difficultyEasy');
      options[1].textContent = getText('difficultyMedium');
      options[2].textContent = getText('difficultyHard');
    } else if (select.id === 'sort-select') {
      const options = select.querySelectorAll('option');
      options[0].textContent = getText('sortNameAsc');
      options[1].textContent = getText('sortNameDesc');
    }
  });
  
  // Update modal elements
  const summaryModalTitle = document.getElementById('summary-modal-title');
  if (summaryModalTitle) summaryModalTitle.textContent = getText('summaryTitle');
  
  const challengeModalTitle = document.getElementById('challenge-modal-title');
  if (challengeModalTitle) challengeModalTitle.textContent = getText('challengeTitle');
  
  const p1NameLabel = document.getElementById('p1-name-label');
  if (p1NameLabel) p1NameLabel.textContent = getText('player1Name');
  
  const p2NameLabel = document.getElementById('p2-name-label');
  if (p2NameLabel) p2NameLabel.textContent = getText('player2Name');
  
  // Update theme toggle title
  const themeToggle = document.getElementById('btn-theme');
  if (themeToggle && themeToggle.getAttribute('data-title-key')) {
    themeToggle.title = getText('toggleTheme');
  }
}

// Initialize language on page load
function initLanguage() {
  const savedLang = localStorage.getItem('who-bible-language');
  if (savedLang && TRANSLATIONS[savedLang]) {
    currentLanguage = savedLang;
  }
  
  // Set the language selector to the current language
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.value = currentLanguage;
  }
  
  updateAllText();
}
