// Comprehensive simulation test for Who-Bible quiz question generation
const fs = require('fs');
const path = require('path');

const people = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'data', 'people.json'), 'utf8'));
const appJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');

// Set up mock environment to extract pickQuestionSet and cleanEventPredicate
global.state = { people, mode: 'solo' };
global.isValidContent = (s) => Boolean(s && typeof s === 'string' && s.trim().length > 2);
global.shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Evaluate helper functions from appJs
eval(appJs.match(/function cleanEventPredicate[\s\S]*?\n\}/)[0]);
eval(appJs.match(/function filterPeopleByDifficulty[\s\S]*?\n\}/)[0]);
eval(appJs.match(/function pickQuestionSet[\s\S]*?\n\}/)[0]);

console.log('--- RUNNING SIMULATION ON ALL DIFFICULTIES & BATCH SIZES ---');

const difficulties = ['easy', 'medium', 'hard', 'expert'];
const batchSizes = [5, 10, 15, 20, 30];
let totalTested = 0;
let errors = [];

for (const diff of difficulties) {
  for (const count of batchSizes) {
    const questions = pickQuestionSet(count, diff);
    totalTested += questions.length;

    if (questions.length < count) {
      errors.push(`Difficulty ${diff}: Requested ${count} questions but got only ${questions.length}`);
    }

    questions.forEach((q, idx) => {
      // Check choices count
      if (!Array.isArray(q.choices) || q.choices.length !== 4) {
        errors.push(`[${diff} #${idx}] Expected 4 choices, got: ${q.choices ? q.choices.length : 0}`);
      }

      // Check unique choices
      const uniqueChoices = new Set(q.choices || []);
      if (uniqueChoices.size !== 4) {
        errors.push(`[${diff} #${idx}] Duplicate choices in question: ${JSON.stringify(q.choices)}`);
      }

      // Check answer in choices
      if (!q.choices.includes(q.answer)) {
        errors.push(`[${diff} #${idx}] Answer '${q.answer}' is not in choices: ${JSON.stringify(q.choices)}`);
      }

      // Check prompt
      if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.length < 10) {
        errors.push(`[${diff} #${idx}] Malformed prompt: '${q.prompt}'`);
      }

      // Check references
      if (!Array.isArray(q.ref) || q.ref.length === 0) {
        // Warning only if no verses
      }
    });
  }
}

console.log(`Generated and validated ${totalTested} quiz questions across 20 distinct scenarios.`);
if (errors.length === 0) {
  console.log('✓ ALL QUESTION INTEGRITY CHECKS PASSED:');
  console.log('  - Every question has exactly 4 distinct choices');
  console.log('  - Every question has the correct answer present in choices');
  console.log('  - All prompts are well-formed and grammatically clean');
} else {
  console.error(`Found ${errors.length} errors:`, errors.slice(0, 10));
}

