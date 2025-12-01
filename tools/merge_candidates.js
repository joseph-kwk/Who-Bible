const fs = require('fs');
const path = require('path');

function normalizeName(s){
  if(!s) return '';
  // Basic normalization: Unicode normalize, strip diacritics, lower-case, collapse whitespace
  try{ s = s.normalize('NFKD').replace(/\p{Diacritic}/gu, ''); }catch(_){ /* node older */ }
  return s.toString().toLowerCase().replace(/[()\[\]"']/g,'').replace(/[^\w\s-]/g,'').replace(/\s+/g,' ').trim();
}

function loadJson(p){
  if(!fs.existsSync(p)) return null;
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(err){ console.error('Failed to parse',p,err); return null; }
}

(async function(){
  const repoRoot = path.resolve(__dirname,'..');
  const canonicalPath = path.resolve(repoRoot,'assets','data','people.json');
  const candidatesPath = path.resolve(__dirname,'people_from_wikidata.candidates.relaxed.json');

  const canonical = loadJson(canonicalPath);
  if(!Array.isArray(canonical)) { console.error('Canonical file missing or invalid:', canonicalPath); process.exit(2); }
  const candidates = loadJson(candidatesPath) || [];

  const existingNames = new Set(canonical.map(p=>normalizeName(p.name)));

  const toAdd = [];
  for(const c of candidates){
    const n = normalizeName(c.name);
    if(!n){ console.log('Skipping empty-name candidate', c); continue; }
    if(existingNames.has(n)){
      console.log('Skipping duplicate (name exists):', c.name);
      continue;
    }
    // Build person object for canonical file
    const person = {
      name: c.name,
      aliases: Array.isArray(c.aliases) ? c.aliases : [],
      mother: (c.mother && c.mother.trim()) ? c.mother.trim() : null,
      father: (c.father && c.father.trim()) ? c.father.trim() : null,
      spouse: (c.spouse && c.spouse.trim()) ? c.spouse.trim() : null,
      children: Array.isArray(c.children) ? c.children : [],
      occupation: c.occupation || null,
      age_notes: c.age_notes || null,
      notable_events: Array.isArray(c.notable_events) ? c.notable_events : [],
      verses: Array.isArray(c.verses) ? c.verses : [],
      short_bio: c.short_bio || null,
      testament: (c.testament && c.testament !== 'unknown') ? c.testament : null,
      gender: (c.gender && c.gender !== 'unknown') ? c.gender : null,
      _qid: c._qid || null,
      _source: c._source || (c._wikilink?c._wikilink:null),
      _wikilink: c._wikilink || null,
      _inferred_testament: c._inferred_testament || false,
      _inferred_gender: c._inferred_gender || false,
      _verified: true,
      _accepted_date: (new Date()).toISOString()
    };
    toAdd.push(person);
    existingNames.add(n);
  }

  if(toAdd.length===0){
    console.log('No new candidates to add. Exiting.');
    process.exit(0);
  }

  // Backup canonical
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const backupPath = path.resolve(path.dirname(canonicalPath), `people.backup.${ts}.json`);
  try{
    fs.copyFileSync(canonicalPath, backupPath);
    console.log('Backup written to', backupPath);
  }catch(err){ console.error('Failed to write backup', err); process.exit(3); }

  // Merge and write
  const merged = canonical.concat(toAdd);
  try{
    fs.writeFileSync(canonicalPath, JSON.stringify(merged,null,2),'utf8');
    console.log(`Merged ${toAdd.length} candidate(s) into ${canonicalPath}`);
    console.log('Added names:', toAdd.map(x=>x.name).join(', '));
    process.exit(0);
  }catch(err){
    console.error('Failed to write merged file', err);
    // attempt to restore backup
    try{ fs.copyFileSync(backupPath, canonicalPath); console.log('Restored backup'); }catch(_){ }
    process.exit(4);
  }
})();
