// scenarios.js - Biblical Scenarios & Moral Dilemmas Module

const ScenarioModule = (function() {
  let scenarios = [];
  let currentScenarioIndex = 0;
  let correctAnswers = 0;
  let totalAttempts = 0;

  // Load scenarios from JSON
  async function loadScenarios() {
    try {
      // Add cache buster to prevent stale data
      const response = await fetch('assets/data/bible_scenarios.json?v=' + new Date().getTime());
      if (!response.ok) throw new Error('Failed to load scenarios');
      scenarios = await response.json();
      return scenarios;
    } catch (error) {
      console.error('Error loading scenarios:', error);
      return [];
    }
  }

  // Filter scenarios by level or tags
  function filterScenarios(filters = {}) {
    let filtered = [...scenarios];
    
    if (filters.level) {
      filtered = filtered.filter(s => s.level === filters.level);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(s => 
        s.tags.some(tag => filters.tags.includes(tag))
      );
    }
    
    if (filters.theme) {
      filtered = filtered.filter(s => 
        s.theme.toLowerCase().includes(filters.theme.toLowerCase())
      );
    }
    
    return filtered;
  }

  // Shuffle scenarios for random order
  function shuffleScenarios() {
    for (let i = scenarios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scenarios[i], scenarios[j]] = [scenarios[j], scenarios[i]];
    }
  }

  // Get scenario by ID
  function getScenarioById(id) {
    return scenarios.find(s => s.scenario_id === id);
  }

  // Get current scenario
  function getCurrentScenario() {
    if (currentScenarioIndex >= scenarios.length) return null;
    return scenarios[currentScenarioIndex];
  }

  // Move to next scenario
  function nextScenario() {
    currentScenarioIndex++;
    return getCurrentScenario();
  }

  // Check answer
  function checkAnswer(selectedOption) {
    const current = getCurrentScenario();
    if (!current) return null;
    
    totalAttempts++;
    const isCorrect = selectedOption === current.correct_answer;
    if (isCorrect) correctAnswers++;
    
    return {
      isCorrect,
      explanation: current.explanation,
      correctAnswer: current.correct_answer,
      bookRef: current.book_ref,
      theme: current.theme
    };
  }

  // Get statistics
  function getStats() {
    return {
      total: scenarios.length,
      current: currentScenarioIndex,
      correct: correctAnswers,
      attempts: totalAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0
    };
  }

  // Reset progress
  function reset() {
    currentScenarioIndex = 0;
    correctAnswers = 0;
    totalAttempts = 0;
  }

  // Get all unique levels
  function getLevels() {
    return [...new Set(scenarios.map(s => s.level))];
  }

  // Get all unique tags
  function getTags() {
    const tags = new Set();
    scenarios.forEach(s => s.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }

  // Get all unique themes
  function getThemes() {
    return [...new Set(scenarios.map(s => s.theme))];
  }

  // Initialize the module
  async function init() {
    await loadScenarios();
    return scenarios.length > 0;
  }

  // Public API
  return {
    init,
    loadScenarios,
    filterScenarios,
    shuffleScenarios,
    getScenarioById,
    getCurrentScenario,
    nextScenario,
    checkAnswer,
    getStats,
    reset,
    getLevels,
    getTags,
    getThemes,
    get scenarios() { return scenarios; }
  };
})();

// Make available globally
window.ScenarioModule = ScenarioModule;
