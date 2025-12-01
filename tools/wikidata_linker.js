const fs = require('fs');
const path = require('path');

const canonicalPath = path.join('assets','data','people.json');
const wikidataPath = path.join('tools','people_from_wikidata.json');

function normalizeLabel(s){
  if(!s) return '';
  let out = String(s).replace(/\([^)]*\)/g,'');
  out = out.replace(/[.,;:\/\"'\[\]\{\}!\?]/g,'');
  out = out.replace(/\s+/g,' ').trim().toLowerCase();
  return out;
}

function levenshtein(a,b){
  if(a===b) return 0;
  const al = a.length, bl = b.length;
  if(al===0) return bl;
  if(bl===0) return al;
  const v0 = new Array(bl+1).fill(0).map((_,i)=>i);
  const v1 = new Array(bl+1).fill(0);
  for(let i=0;i<al;i++){
    v1[0]=i+1;
    for(let j=0;j<bl;j++){
      const cost = a[i]===b[j]?0:1;
      v1[j+1] = Math.min(v1[j]+1, v0[j+1]+1, v0[j]+cost);
    }
    for(let k=0;k<=bl;k++) v0[k]=v1[k];
  }
  return v1[bl];
}

function editScore(a,b){
  const maxLen = Math.max(a.length,b.length);
  if(maxLen===0) return 1;
  const dist = levenshtein(a,b);
  return 1 - (dist / maxLen);
}

function tokenSetRatio(a,b){
  if(!a || !b) return 0;
  const toksA = Array.from(new Set(a.split(' ').filter(Boolean)));
  const toksB = Array.from(new Set(b.split(' ').filter(Boolean)));
  const setA = new Set(toksA);
  const setB = new Set(toksB);
  let inter = 0;
  toksA.forEach(t=>{ if(setB.has(t)) inter++;});
  const denom = toksA.length + toksB.length;
  if(denom===0) return 0;
  return (2*inter)/denom; // between 0 and 1
}

function scoreNames(a,b){
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  const tscore = tokenSetRatio(na,nb);
  const escore = editScore(na,nb);
  return Math.max(tscore, escore);
}

function loadJson(p){
  if(!fs.existsSync(p)) return null;
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return null; }
}

function main(){
  const canonical = loadJson(canonicalPath);
  const wikidata = loadJson(wikidataPath);
  if(!canonical) { console.error('Canonical file not found:', canonicalPath); process.exit(1); }
  if(!wikidata) { console.error('Wikidata cleaned file not found:', wikidataPath); process.exit(1); }

  // Build canonical lookup entries (name + aliases)
  const canonEntries = [];
  canonical.forEach(p=>{
    const entryName = p.name;
    if(entryName) canonEntries.push({key:normalizeLabel(entryName), display:entryName, source:'canonical'});
    if(Array.isArray(p.aliases)){
      p.aliases.forEach(a=>{ if(a) canonEntries.push({key:normalizeLabel(a), display: p.name, alias: a, source:'canonical-alias'}); });
    }
  });

  // dedupe canonEntries by key keeping first
  const canonMap = new Map();
  canonEntries.forEach(e=>{ if(!canonMap.has(e.key)) canonMap.set(e.key,e); });
  const canonList = Array.from(canonMap.values());

  const high = [];
  const candidates = [];
  const none = [];

  wikidata.forEach(item=>{
    const name = item.name || '';
    let best = {score:0, target:null};
    // compare against canonical list
    canonList.forEach(c=>{
      const s = scoreNames(name, c.display || c.alias || '');
      if(s>best.score) best = {score: s, target: c};
    });
    // Also try direct alias keys in canonMap
    // (already covered by canonList)

    // classify
    if(best.score >= 0.95){
      item._matched_local = { name: best.target.display, score: best.score, source: best.target.source };
      high.push(item);
    } else if (best.score >= 0.80){
      item._candidates = [{ name: best.target.display, score: best.score, source: best.target.source }];
      candidates.push(item);
    } else {
      none.push(item);
    }
  });

  // Write outputs
  fs.writeFileSync(path.join('tools','people_from_wikidata.matched.json'), JSON.stringify(high, null, 2), 'utf8');
  fs.writeFileSync(path.join('tools','people_from_wikidata.candidates.json'), JSON.stringify(candidates, null, 2), 'utf8');
  fs.writeFileSync(path.join('tools','people_from_wikidata.unmatched.json'), JSON.stringify(none, null, 2), 'utf8');

  const summary = {
    total: wikidata.length,
    auto_matched: high.length,
    candidates: candidates.length,
    unmatched: none.length
  };
  fs.writeFileSync(path.join('tools','people_from_wikidata.link_report.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log('Linking complete:', summary);
}

main();
