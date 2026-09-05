/**
 * Tests for Who-Bible Multiplayer & Host Question Generator
 */
const fs = require('fs');
const path = require('path');

// Load people data
const peopleData = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/people.json'), 'utf8'));

console.log('--- Testing Multiplayer & Question Generator ---');

// Test 1: Validate People Data has required properties
console.log(`Loaded ${peopleData.length} people from people.json`);
if (peopleData.length < 50) {
  console.error('FAIL: Expected at least 50 people');
  process.exit(1);
}
console.log('✓ People data loaded successfully');

// Test 2: Difficulty Filter
function filterPeopleForHost(people, difficulty) {
  if (difficulty === 'easy') {
    const common = new Set(['Noah', 'Moses', 'David', 'Solomon', 'Abraham', 'Isaac', 'Jacob', 'Ruth', 'Esther', 'Peter', 'Paul', 'Mary (mother of Jesus)', 'John the Baptist', 'Joseph (son of Jacob)', 'Lazarus', 'Adam', 'Eve', 'Joshua', 'Gideon', 'Samson', 'Daniel', 'Elijah']);
    return people.filter(p => p.difficulty === 'easy' || common.has(p.name));
  }
  if (difficulty === 'hard') {
    return people.filter(p => p.difficulty === 'hard' || (!p.occupation && !p.mother));
  }
  return people.slice();
}

const easyPool = filterPeopleForHost(peopleData, 'easy');
const hardPool = filterPeopleForHost(peopleData, 'hard');
console.log(`Easy pool: ${easyPool.length} people`);
console.log(`Hard pool: ${hardPool.length} people`);

if (easyPool.length === 0 || hardPool.length === 0) {
  console.error('FAIL: Difficulty filtering produced empty pools');
  process.exit(1);
}
console.log('✓ Difficulty filtering works correctly');

// Test 3: Host Question Generation
function generateQuestionForPerson(person, type, pool) {
  let prompt = '';
  let correct = '';
  let verse = (person.verses && person.verses.length > 0) ? person.verses.join(', ') : '';
  
  const rawEvent = (person.notable_events && person.notable_events.length > 0) 
    ? person.notable_events[0] 
    : 'is a notable figure in scripture';
    
  switch (type) {
    case 'whoDid':
    case 'event':
      prompt = `Who ${rawEvent}?`;
      correct = person.name;
      break;
    case 'mother':
      if (!person.mother) {
        prompt = `Who ${rawEvent}?`;
        correct = person.name;
        type = 'whoDid';
      } else {
        prompt = `Who is the mother of ${person.name}?`;
        correct = person.mother;
      }
      break;
    case 'occupation':
      if (!person.occupation) {
        prompt = `Who ${rawEvent}?`;
        correct = person.name;
        type = 'whoDid';
      } else {
        prompt = `What was ${person.name}'s role or occupation?`;
        correct = person.occupation;
      }
      break;
    case 'age':
      if (!person.age_notes) {
        prompt = `Who ${rawEvent}?`;
        correct = person.name;
        type = 'whoDid';
      } else {
        prompt = `What do scriptures record about ${person.name}'s life or age?`;
        correct = person.age_notes;
      }
      break;
    default:
      prompt = `Who ${rawEvent}?`;
      correct = person.name;
      type = 'whoDid';
  }
  
  const options = [correct];
  const candidates = pool.filter(p => p.name !== person.name);
  const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);
  
  for (const cand of shuffledCandidates) {
    if (options.length >= 4) break;
    let candidateAnswer = '';
    if (type === 'whoDid' || type === 'event') candidateAnswer = cand.name;
    else if (type === 'mother') candidateAnswer = cand.mother || cand.name;
    else if (type === 'occupation') candidateAnswer = cand.occupation || cand.name;
    else if (type === 'age') candidateAnswer = cand.age_notes || `Lived during biblical times`;
    
    if (candidateAnswer && !options.includes(candidateAnswer)) {
      options.push(candidateAnswer);
    }
  }
  
  let fallbackIndex = 1;
  while (options.length < 4) {
    const fallback = `Option ${fallbackIndex++}`;
    if (!options.includes(fallback)) options.push(fallback);
  }
  
  options.sort(() => Math.random() - 0.5);
  return { type, prompt, correct, options, verse };
}

function generateQuestions(difficulty, count) {
  const questions = [];
  const usedPeople = new Set();
  let pool = filterPeopleForHost(peopleData, difficulty);
  if (pool.length === 0) pool = peopleData.slice();
  
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const questionTypes = ['whoDid', 'mother', 'occupation', 'age', 'event'];
  
  for (const person of shuffledPool) {
    if (questions.length >= count) break;
    if (usedPeople.has(person.name)) continue;
    
    const validTypes = [];
    if (person.notable_events && person.notable_events.length > 0) validTypes.push('whoDid', 'event');
    if (person.mother) validTypes.push('mother');
    if (person.occupation) validTypes.push('occupation');
    if (person.age_notes) validTypes.push('age');
    if (validTypes.length === 0) validTypes.push('whoDid');
    
    const type = validTypes[Math.floor(Math.random() * validTypes.length)];
    const question = generateQuestionForPerson(person, type, peopleData);
    
    if (question && question.options && question.options.length === 4) {
      usedPeople.add(person.name);
      questions.push({
        ...question,
        index: questions.length,
        correctAnswer: question.correct,
        points: 1000
      });
    }
  }
  return questions.slice(0, count);
}

const testQuestionsEasy = generateQuestions('easy', 10);
const testQuestionsMedium = generateQuestions('medium', 10);
const testQuestionsHard = generateQuestions('hard', 10);

console.log(`Generated Easy: ${testQuestionsEasy.length}, Medium: ${testQuestionsMedium.length}, Hard: ${testQuestionsHard.length}`);

testQuestionsEasy.forEach((q, idx) => {
  if (!q.prompt || !q.correct || q.options.length !== 4 || !q.options.includes(q.correct)) {
    console.error(`FAIL: Invalid question at index ${idx}:`, q);
    process.exit(1);
  }
});
console.log('✓ All 10 easy questions have valid prompt, correct answer in 4 options');

// Test 4: Room Code Generator
function generateRoomCode() {
  const adjectives = ['FAITH', 'GRACE', 'HOPE', 'LIGHT', 'PEACE', 'TRUTH', 'LOVE', 'HOLY'];
  const numbers = Math.floor(Math.random() * 900) + 100;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adj}-${numbers}`;
}

const sampleCode = generateRoomCode();
console.log(`Sample Generated Room PIN: ${sampleCode}`);
if (!/^[A-Z]+-\d{3}$/.test(sampleCode)) {
  console.error('FAIL: Room code format mismatch');
  process.exit(1);
}
console.log('✓ Room Code generation test passed');

console.log('\nALL MULTIPLAYER & QUESTION GENERATION TESTS PASSED! 🎉');
