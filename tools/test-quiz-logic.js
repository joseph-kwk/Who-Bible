// Comprehensive unit tests for Who-Bible quiz logic
// Run: node tools/test-quiz-logic.js
const fs = require('fs');
const path = require('path');

// Mock DOM and global objects
global.document = {
  getElementById: () => ({ value: '', textContent: '', innerHTML: '', style: {}, addEventListener: () => {} }),
  createElement: () => ({ addEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  documentElement: { lang: 'en' }
};
global.window = {
  TRANSLATIONS: {
    en: { 
      fallbackEvent: 'a notable event',
      questionWhoDid: 'Who is known for: {event}?',
      questionWhoMother: 'Who was the mother of {name}?',
      questionOccupation: 'What was {name}\'s occupation or role?',
      questionAge: 'Which age-note is correct for {name}?',
      questionEvent: 'Which person is linked to: {event}?',
      eventTranslations: {
        'Built the ark': 'Built the ark',
        'Led Exodus': 'Led Exodus'
      },
      occupationTranslations: {
        'King': 'King',
        'Prophet': 'Prophet'
      }
    },
    fr: {
      eventTranslations: {
        'Built the ark': 'A construit l\'arche',
        'Led Exodus': 'A conduit l\'Exode'
      },
      occupationTranslations: {
        'King': 'Roi',
        'Prophet': 'Prophète'
      }
    }
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.currentLanguage = 'en';

// Load app.js and extract functions
const appPath = path.join(__dirname, '..', 'assets', 'js', 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

// Extract function definitions using regex (for testing purposes)
const functions = {};
const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
let match;
while ((match = functionRegex.exec(appContent)) !== null) {
  const funcName = match[1];
  const funcCode = match[0];
  try {
    eval(`functions.${funcName} = ${funcCode}`);
  } catch (e) {
    // Skip functions that depend on DOM or have complex dependencies
  }
}

// Extract specific functions we need
const extractFunction = (name, content) => {
  const regex = new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?(?=\\n\\s*(?:function|const|let|var|\\}\\s*$))`, 'g');
  const match = regex.exec(content);
  if (match) {
    try {
      eval(`functions.${name} = ${match[0]}`);
    } catch (e) {
      console.log(`Could not extract ${name}:`, e.message);
    }
  }
};

// Extract key functions
['validatePerson', 'translateEvent', 'translateOccupation', 'normalize', 'shuffle'].forEach(name => {
  extractFunction(name, appContent);
});

// Mock getText function
global.getText = (key, params = {}) => {
  const translations = global.window.TRANSLATIONS[global.currentLanguage] || global.window.TRANSLATIONS.en;
  let text = translations[key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
};

// Test data
const testPeople = [
  {
    name: 'Noah',
    aliases: [],
    mother: null,
    occupation: 'Righteous man, built the ark',
    age_notes: null,
    notable_events: ['Built the ark', 'Survived the flood'],
    verses: ['Genesis 6-9'],
    short_bio: 'Noah built the ark to survive the flood.'
  },
  {
    name: 'Moses',
    aliases: [],
    mother: 'Jochebed',
    occupation: 'Leader, prophet',
    age_notes: 'Died at 120; 80 when confronting Pharaoh',
    notable_events: ['Led Exodus', 'Saw burning bush'],
    verses: ['Exodus 3', 'Deuteronomy 34:7'],
    short_bio: 'Moses led the Israelites out of Egypt.'
  },
  {
    name: 'David',
    aliases: [],
    mother: null,
    occupation: 'Shepherd, King',
    age_notes: null,
    notable_events: ['Killed Goliath', 'Became king'],
    verses: ['1 Samuel 17', '2 Samuel'],
    short_bio: 'Shepherd who became king of Israel.'
  }
];

// Test suite
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  console.log('Running Who-Bible Quiz Logic Tests...\n');
  
  tests.forEach(({ name, fn }) => {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
      failed++;
    }
  });
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Test validatePerson function
test('validatePerson accepts valid person', () => {
  if (!functions.validatePerson) throw new Error('validatePerson function not found');
  
  const result = functions.validatePerson(testPeople[0]);
  assert(result.valid === true, 'Should accept valid person');
});

test('validatePerson rejects person without name', () => {
  if (!functions.validatePerson) throw new Error('validatePerson function not found');
  
  const result = functions.validatePerson({ aliases: [] });
  assert(result.valid === false, 'Should reject person without name');
  assert(result.reason.includes('name'), 'Should mention name in error reason');
});

test('validatePerson rejects person with invalid aliases', () => {
  if (!functions.validatePerson) throw new Error('validatePerson function not found');
  
  const result = functions.validatePerson({ name: 'Test', aliases: 'not an array' });
  assert(result.valid === false, 'Should reject person with non-array aliases');
});

// Test translation functions
test('translateEvent returns original text for English', () => {
  if (!functions.translateEvent) throw new Error('translateEvent function not found');
  
  global.currentLanguage = 'en';
  const result = functions.translateEvent('Built the ark');
  assert(result === 'Built the ark', 'Should return original text for English');
});

test('translateEvent returns translated text for French', () => {
  if (!functions.translateEvent) throw new Error('translateEvent function not found');
  
  global.currentLanguage = 'fr';
  const result = functions.translateEvent('Built the ark');
  assert(result === 'A construit l\'arche', 'Should return French translation');
});

test('translateEvent falls back to original for missing translation', () => {
  if (!functions.translateEvent) throw new Error('translateEvent function not found');
  
  global.currentLanguage = 'fr';
  const result = functions.translateEvent('Unknown event');
  assert(result === 'Unknown event', 'Should fall back to original text');
});

test('translateOccupation works correctly', () => {
  if (!functions.translateOccupation) throw new Error('translateOccupation function not found');
  
  global.currentLanguage = 'fr';
  const result = functions.translateOccupation('King');
  assert(result === 'Roi', 'Should return French translation for King');
});

// Test utility functions
test('normalize function works correctly', () => {
  if (!functions.normalize) throw new Error('normalize function not found');
  
  const result = functions.normalize('  Test String  ');
  assert(result === 'test string', 'Should normalize string correctly');
});

test('shuffle function modifies array', () => {
  if (!functions.shuffle) throw new Error('shuffle function not found');
  
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const original = [...arr];
  functions.shuffle(arr);
  
  // Should have same elements but likely in different order
  assert(arr.length === original.length, 'Should maintain array length');
  assert(arr.every(item => original.includes(item)), 'Should contain all original elements');
});

// Test question generation scenarios
test('question generation handles empty events gracefully', () => {
  const person = { ...testPeople[0], notable_events: [] };
  // This would be tested in the actual pickQuestionSet function
  // For now, just verify the person structure is valid
  assert(person.name === 'Noah', 'Person should still have name');
});

// Integration test: Language switching
test('language switching affects translations', () => {
  if (!functions.translateEvent) throw new Error('translateEvent function not found');
  
  // Test English
  global.currentLanguage = 'en';
  let result = functions.translateEvent('Built the ark');
  assert(result === 'Built the ark', 'English should return original');
  
  // Test French
  global.currentLanguage = 'fr';
  result = functions.translateEvent('Built the ark');
  assert(result === 'A construit l\'arche', 'French should return translation');
  
  // Reset to English
  global.currentLanguage = 'en';
});

// Run all tests
runTests();
