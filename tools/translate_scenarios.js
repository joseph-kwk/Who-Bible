// Quick script to add all scenario translations to language files
// Run with: node tools/translate_scenarios.js

const fs = require('fs');
const path = require('path');

// Load scenarios
const scenarios = require('../assets/data/bible_scenarios.json');

// Load existing language files
const enPath = path.join(__dirname, '../assets/i18n/en.json');
const esPath = path.join(__dirname, '../assets/i18n/es.json');
const frPath = path.join(__dirname, '../assets/i18n/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Build English scenario translations (baseline)
const enScenarios = {};
scenarios.forEach(s => {
  enScenarios[s.scenario_id] = {
    theme: s.theme,
    challenge: s.challenge,
    options: s.options,
    explanation: s.explanation
  };
});

// Update English
en.scenarioTranslations = enScenarios;

// Spanish translations (sample - you should use proper translation service)
const esScenarios = {};
scenarios.forEach(s => {
  esScenarios[s.scenario_id] = {
    theme: s.theme, // Will be replaced with proper translations
    challenge: s.challenge,
    options: s.options,
    explanation: s.explanation
  };
});
es.scenarioTranslations = esScenarios;

// French translations (sample - you should use proper translation service)
const frScenarios = {};
scenarios.forEach(s => {
  frScenarios[s.scenario_id] = {
    theme: s.theme, // Will be replaced with proper translations
    challenge: s.challenge,
    options: s.options,
    explanation: s.explanation
  };
});
fr.scenarioTranslations = frScenarios;

// Write back to files
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(esPath, JSON.stringify(es, null, 2), 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');

console.log('✅ Scenario translations added to all language files!');
console.log(`   - ${Object.keys(enScenarios).length} scenarios in English`);
console.log(`   - ${Object.keys(esScenarios).length} scenarios in Spanish (needs translation)`);
console.log(`   - ${Object.keys(frScenarios).length} scenarios in French (needs translation)`);
console.log('');
console.log('⚠️  Note: Spanish and French scenarios are currently in English.');
console.log('   You should translate them using a proper translation service.');
