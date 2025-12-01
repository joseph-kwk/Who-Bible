const fs = require('fs');
const path = require('path');

function normalizeName(s){
  if(!s) return '';
  try{ s = s.normalize('NFKD').replace(/\p{Diacritic}/gu, ''); }catch(_){ }
  return s.toString().toLowerCase().replace(/[()\[\]"']/g,'').replace(/[^\w\s-]/g,'').replace(/\s+/g,' ').trim();
}

function loadJson(p){
  if(!fs.existsSync(p)) return null;
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(err){ console.error('Failed to parse',p,err); return null; }
}

const repoRoot = path.resolve(__dirname,'..');
const canonicalPath = path.resolve(repoRoot,'assets','data','people.json');
const canonical = loadJson(canonicalPath);
if(!Array.isArray(canonical)){
  console.error('Canonical file missing or invalid at', canonicalPath);
  process.exit(2);
}

const freq = new Map();
for(const p of canonical){
  const n = normalizeName(p.name || '');
  if(!n) continue;
  freq.set(n, (freq.get(n)||0)+1);
}

const duplicates = Array.from(freq.entries()).filter(([,c])=>c>1).map(([name,c])=>({name,c}));

console.log('Total records in canonical:', canonical.length);
if(duplicates.length===0){
  console.log('No duplicate normalized names found.');
} else {
  console.warn('Found duplicates:', duplicates.length);
  duplicates.slice(0,20).forEach(d=>console.warn(`  ${d.name} -> ${d.c} occurrences`));
}

// Check merged candidate names
const expected = ['Joah','Abey','Maro','Aram'].map(s=>normalizeName(s));
const present = expected.map(e=>({name:e, found: freq.has(e)}));
console.log('Merged candidate presence:');
present.forEach(p=>console.log(`  ${p.name} -> ${p.found ? 'present' : 'MISSING'}`));

const missing = present.filter(p=>!p.found);
if(missing.length>0){
  console.error('Some expected merged names are missing:', missing.map(m=>m.name).join(', '));
  process.exit(3);
}

if(duplicates.length>0){
  console.error('Duplicate normalized names detected. Please resolve before committing.');
  process.exit(4);
}

console.log('Validation passed. Ready to commit.');
process.exit(0);
