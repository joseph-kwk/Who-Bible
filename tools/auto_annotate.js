const fs = require('fs');
const path = require('path');

const APP_JS = path.join(__dirname, '..', 'assets', 'js', 'app.js');
const OUT_ANNOTATED = path.join(__dirname, 'people_auto_annotated.json');
const OUT_REPORT = path.join(__dirname, 'data_quality_report.json');

function readAppJs(){
  return fs.readFileSync(APP_JS, 'utf8');
}

function extractDefaultData(code){
  const marker = 'const DEFAULT_PEOPLE_DATA';
  const idx = code.indexOf(marker);
  if(idx === -1) throw new Error('DEFAULT_PEOPLE_DATA not found');
  const startArr = code.indexOf('[', idx);
  if(startArr === -1) throw new Error('Start of array not found');
  // find matching closing ] taking strings into account
  let i = startArr;
  let depth = 0;
  let inSingle = false, inDouble = false, inBack = false, escaped = false;
  while(i < code.length){
    const ch = code[i];
    if(!escaped){
      if(ch === "\\") escaped = true;
      else if(ch === "'") { if(!inDouble && !inBack) inSingle = !inSingle; }
      else if(ch === '"') { if(!inSingle && !inBack) inDouble = !inDouble; }
      else if(ch === '`') { if(!inSingle && !inDouble) inBack = !inBack; }
      else if(!inSingle && !inDouble && !inBack){
        if(ch === '[') depth++;
        else if(ch === ']'){
          depth--;
          if(depth === 0){
            // include closing bracket
            return code.slice(startArr, i+1);
          }
        }
      }
    } else {
      escaped = false;
    }
    i++;
  }
  throw new Error('Matching closing bracket not found');
}

function buildModuleFromArrayText(arrText){
  // We'll write a temp module that exports the array text directly
  const tmpPath = path.join(__dirname, '_tmp_default_data.js');
  const moduleText = 'module.exports = ' + arrText + ';\n';
  fs.writeFileSync(tmpPath, moduleText, 'utf8');
  return tmpPath;
}

function inferTestament(person){
  if(!person) return null;
  if(person.testament) return person.testament;
  const verses = (person.verses || []).join(' ');
  if(!verses) return null;
  const ntKeys = ['Matthew','Mark','Luke','John','Acts','Romans','Corinthians','Galatians','Ephesians','Philippians','Colossians','Thessalonians','Timothy','Titus','Philemon','Hebrews','James','Peter','Jude','Revelation'];
  for(const k of ntKeys){ if(verses.includes(k)) return 'nt'; }
  return 'ot';
}

function inferGender(person){
  if(!person) return null;
  if(person.gender) return person.gender;
  const name = (person.name||'').toLowerCase();
  const femaleNames = ['mary','martha','esther','ruth','rebekah','leah','rachel','hannah','naomi','abigail','joanna','salome','sarah','miriam','eve'];
  for(const fn of femaleNames){ if(name.includes(fn)) return 'female'; }
  return 'male';
}

function scoreConfidence(p){
  const testamentSrc = p.testament ? 'explicit' : (p._inferred_testament ? 'inferred' : 'unknown');
  const genderSrc = p.gender ? 'explicit' : (p._inferred_gender ? 'inferred' : 'unknown');
  let score = 0;
  if(testamentSrc === 'explicit') score += 2;
  else if(testamentSrc === 'inferred') score += 1;
  if(genderSrc === 'explicit') score += 2;
  else if(genderSrc === 'inferred') score += 1;
  let level = 'low';
  if(score >= 3) level = 'medium';
  if(score >= 4) level = 'high';
  return { testamentSrc, genderSrc, score, level };
}

function annotate(people){
  const annotated = [];
  const report = [];
  for(const p of people){
    const copy = Object.assign({}, p);
    let inferredT = null, inferredG = null;
    if(!copy.testament){
      inferredT = inferTestament(copy);
      if(inferredT) { copy.testament = inferredT; copy._inferred_testament = true; }
    } else {
      copy._inferred_testament = false;
    }
    if(!copy.gender){
      inferredG = inferGender(copy);
      if(inferredG){ copy.gender = inferredG; copy._inferred_gender = true; }
    } else {
      copy._inferred_gender = false;
    }
    const conf = scoreConfidence(copy);
    annotated.push(copy);
    if(conf.level !== 'high'){
      report.push({ name: copy.name, testament: copy.testament, gender: copy.gender, inferredTestament: inferredT, inferredGender: inferredG, confidence: conf.level, reason: `testament:${conf.testamentSrc},gender:${conf.genderSrc}` });
    }
  }
  return { annotated, report };
}

function main(){
  try{
    const code = readAppJs();
    const arrText = extractDefaultData(code);
    const tmpModulePath = buildModuleFromArrayText(arrText);
    const people = require(tmpModulePath);
    // remove temp module file
    fs.unlinkSync(tmpModulePath);
    if(!Array.isArray(people)) throw new Error('Extracted data is not an array');
    const { annotated, report } = annotate(people);
    fs.writeFileSync(OUT_ANNOTATED, JSON.stringify(annotated, null, 2), 'utf8');
    fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2), 'utf8');
    console.log('Annotated people written to', OUT_ANNOTATED);
    console.log('Data quality report written to', OUT_REPORT);
    console.log('Total persons:', people.length);
    console.log('Annotated:', annotated.length);
    console.log('Ambiguous/Low-confidence count:', report.length);
  }catch(err){
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
