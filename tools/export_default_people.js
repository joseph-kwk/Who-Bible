const fs = require('fs');
const appPath = 'assets/js/app.js';
const outPath = 'assets/data/people.json';

function main() {
  if (!fs.existsSync(appPath)) {
    console.error('Could not find', appPath);
    process.exit(1);
  }
  const content = fs.readFileSync(appPath, 'utf8');
  const m = content.match(/const DEFAULT_PEOPLE_DATA = (\[[\s\S]*?\]);/);
  if (!m || !m[1]) {
    console.error('Could not locate DEFAULT_PEOPLE_DATA in app.js');
    process.exit(1);
  }
  let arrText = m[1];
  try {
    // Remove block comments and line comments to make valid JSON
    arrText = arrText.replace(/\/\*[\s\S]*?\*\//g, '');
    arrText = arrText.replace(/\/\/.*$/gm, '');
    // Remove trailing commas before object/array closers
    arrText = arrText.replace(/,\s*(\]|\})/g, '$1');
    const data = JSON.parse(arrText);
    fs.mkdirSync('assets/data', { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Wrote', outPath, 'with', data.length, 'records');
  } catch (err) {
    console.error('Error parsing DEFAULT_PEOPLE_DATA:', err);
    process.exit(2);
  }
}

main();
