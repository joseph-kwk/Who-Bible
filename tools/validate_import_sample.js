// Small Node script to exercise import validation logic from app.js
// Run: node tools/validate_import_sample.js
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname,'..','assets','js','app.js'),'utf8');
// Extract validatePerson function text by simple regex (for demo only)
const m = app.match(/function validatePerson\([^)]*\)\{[\s\S]*?^}/m);
if(!m){
  console.error('validatePerson not found in app.js'); process.exit(1);
}
const funcText = m[0];
// Create a sandbox and evaluate the function
const vm = require('vm');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(funcText, sandbox);
const validatePerson = sandbox.validatePerson;
if(typeof validatePerson !== 'function'){ console.error('validatePerson not loaded'); process.exit(1); }

const samples = [
  { name: 'Valid Person', aliases: ['X'], mother: 'Y', occupation: 'Z', age_notes: 'Died at 100', notable_events: ['Event'], verses: ['Gen 1'] },
  { name: '', aliases: 'nope' },
  'not an object',
  { name: 'Has bad events', notable_events: 'should be array' }
];

samples.forEach((s,i)=>{
  const res = validatePerson(s);
  console.log(`Sample ${i+1}:`, res);
});
