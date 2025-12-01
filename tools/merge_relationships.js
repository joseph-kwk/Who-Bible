// Merge enhanced relationship data into DEFAULT_PEOPLE_DATA
const fs = require('fs');
const path = require('path');

// Read the enhanced relationships
const enhancedPath = path.join(__dirname, 'enhanced_relationships.json');
const enhanced = JSON.parse(fs.readFileSync(enhancedPath, 'utf8'));

// Read the current app.js to get DEFAULT_PEOPLE_DATA
const appPath = path.join(__dirname, '..', 'assets', 'js', 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

// Extract DEFAULT_PEOPLE_DATA array
const startMarker = 'const DEFAULT_PEOPLE_DATA = [';
const endMarker = '];';
const startIdx = appContent.indexOf(startMarker);
const endIdx = appContent.indexOf(endMarker, startIdx) + 2;

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find DEFAULT_PEOPLE_DATA in app.js');
  process.exit(1);
}

// Parse the existing data (with eval - safe here since it's our own code)
const dataString = appContent.substring(startIdx + 'const DEFAULT_PEOPLE_DATA = '.length, endIdx - 1);
let currentData;
try {
  currentData = eval(dataString);
} catch (e) {
  console.error('Failed to parse DEFAULT_PEOPLE_DATA:', e);
  process.exit(1);
}

console.log(`Current data: ${currentData.length} people`);
console.log(`Enhanced data: ${enhanced.length} people`);

// Merge: add testament, gender, father, spouse, children, siblings to each person
const merged = currentData.map(person => {
  const match = enhanced.find(e => e.name === person.name);
  if (match) {
    return {
      ...person,
      testament: match.testament,
      gender: match.gender,
      father: match.father,
      spouse: match.spouse,
      children: match.children || [],
      siblings: match.siblings || []
    };
  }
  // If no match, add defaults
  return {
    ...person,
    testament: 'ot', // default
    gender: 'male', // default
    father: null,
    spouse: null,
    children: [],
    siblings: []
  };
});

console.log(`Merged: ${merged.length} people`);

// Format as JavaScript code
const formattedData = 'const DEFAULT_PEOPLE_DATA = [\n' + 
  merged.map(p => {
    const obj = {
      name: p.name,
      aliases: p.aliases || [],
      mother: p.mother,
      father: p.father,
      spouse: p.spouse,
      children: p.children,
      siblings: p.siblings,
      occupation: p.occupation,
      age_notes: p.age_notes,
      notable_events: p.notable_events || [],
      verses: p.verses || [],
      short_bio: p.short_bio,
      testament: p.testament,
      gender: p.gender
    };
    return '  ' + JSON.stringify(obj).replace(/"/g, "'");
  }).join(',\n') +
'\n];';

// Replace in app.js
const newContent = appContent.substring(0, startIdx) + formattedData + appContent.substring(endIdx);

// Write back
fs.writeFileSync(appPath, newContent, 'utf8');
console.log('\n✓ Successfully merged relationship data into app.js');
console.log('✓ Added: testament, gender, father, spouse, children, siblings to all people');
