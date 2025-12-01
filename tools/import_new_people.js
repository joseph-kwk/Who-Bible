// Script to import new people from CSV data
const fs = require('fs');

// Your CSV data
const csvData = `name,aliases,mother,father,spouse,children,siblings,occupation,age_notes,notable_events,verses,testament,gender
Adam,,null,God (Directly Created),Eve,"Cain|Abel|Seth|Daughters",,First Man, Gardener,Lived 930 years,"Creation of man|Naming of animals|Fall of man and expulsion from Eden","Genesis 1-5|Romans 5:14",OT,male
Eve,,null,God (Created from Adam's rib),Adam,"Cain|Abel|Seth|Daughters",,First Woman, Mother of all living,null,"Creation of woman|Temptation by the serpent|Ate from the tree of knowledge","Genesis 2-4|1 Timothy 2:13",OT,female
Cain,,Eve,Adam,Unnamed wife,Enoch,"Abel|Seth",Farmer,null,"Killed his brother Abel (first murder)|Mark of Cain|Built a city named Enoch","Genesis 4",OT,male
Abel,,Eve,Adam,null,,Cain|Seth,Shepherd,Killed young,"His sacrifice was acceptable to God|First martyr","Genesis 4|Hebrews 11:4",OT,male
Seth,,Eve,Adam,null,Enosh,Cain|Abel,null,Lived 912 years,"Born to replace Abel|His line called upon the name of the Lord","Genesis 4:25 - 5:8",OT,male
Enosh,,null,Seth,null,Kenan,,null,Lived 905 years,During his time, people began to call upon the name of the Lord,"Genesis 5:9-11",OT,male
Kenan,,null,Enosh,null,Mahalalel,,null,Lived 910 years,,Genesis 5:12-14,OT,male
Mahalalel,,null,Kenan,null,Jared,,null,Lived 895 years,,Genesis 5:15-17,OT,male
Jared,,null,Mahalalel,null,Enoch,,null,Lived 962 years,,Genesis 5:18-20,OT,male
Enoch (Jared's Son),,null,Jared,null,Methuselah,,Prophet,Lived 365 years,"'Walked with God' and was taken away without seeing death","Genesis 5:21-24|Hebrews 11:5",OT,male
Methuselah,,null,Enoch (Jared's Son),null,Lamech,,null,Lived 969 years (Oldest man in the Bible),,Genesis 5:25-27,OT,male
Lamech (Methuselah's Son),,null,Methuselah,null,Noah,,null,Lived 777 years,Named his son Noah, believing he would bring comfort,"Genesis 5:28-31",OT,male
Noah,,Noah's wife,Lamech (Methuselah's Son),Unnamed wife,"Shem|Ham|Japheth",,Builder, Farmer, Preacher of righteousness,Lived 950 years,"Built the Ark|Survived the Great Flood|God's covenant of the rainbow","Genesis 6-10|Hebrews 11:7",OT,male
Shem,,Noah's wife,Noah,null,"Elam|Asshur|Arpachshad|Lud|Aram","Ham|Japheth",Patriarch,Lived 600 years,Ancestor of Abraham and the Israelites,"Genesis 10-11",OT,male
Ham,,Noah's wife,Noah,null,"Cush|Mizraim|Put|Canaan","Shem|Japheth",Patriarch,null,"Saw his father Noah naked and was cursed (via his son Canaan)","Genesis 9-10",OT,male
Japheth,,Noah's wife,Noah,null,"Gomer|Magog|Madai|Javan|Tubal|Meshech|Tiras","Shem|Ham",Patriarch,null,,Genesis 10:2-5,OT,male
Nimrod,Mighty Hunter,null,Cush,null,,Seba|Havilah|Sabtah|Raamah|Sabteca,Mighty Hunter, King,null,"First mighty warrior on earth|Established the kingdom of Babel and cities like Nineveh","Genesis 10:8-12",OT,male
Terah,,null,Nahor (Shem's descendant),null,"Abram (Abraham)|Nahor|Haran",,null,Lived 205 years,"Father of Abraham|Traveled from Ur to Haran","Genesis 11:24-32",OT,male
Abraham,Abram|Father of many nations,null,Terah,"Sarah|Keturah|Hagar (concubine)","Ishmael|Isaac|Zimran|Jokshan|Medan|Midian|Ishbak|Shuah","Nahor|Haran",Patriarch, Shepherd,Died at 175,"Called by God to leave Ur|Covenant of circumcision|Willingness to sacrifice Isaac","Genesis 12-25|Romans 4:3|Hebrews 11:8",OT,male
Sarah,Sarai,null,null,Abraham,Isaac,,Matriarch,Died at 127,"Laughed when told she would have a son|Mother of Isaac in old age","Genesis 11-23|1 Peter 3:6",OT,female
Hagar,,null,null,Abraham (concubine),Ishmael,,Egyptian Servant of Sarah,null,"Mother of Ishmael|Sent away into the wilderness twice","Genesis 16|21",OT,female
Ishmael,,Hagar,Abraham,null,"Nebaioth|Kedar|Adbeel|Mibsam|Mishma|Dumah|Massa|Hadad|Tema|Jetur|Naphish|Kedemah",Isaac (half-brother),Archer, Patriarch of Ishmaelites,Lived 137 years,Prophesied to be a 'wild donkey of a man',"Genesis 16|21|25",OT,male
Lot,,null,Haran,Unnamed wife,"Moab|Ben-Ammi (ancestor of Ammonites)","Milcah|Iscah",Nephew of Abraham, Shepherd,null,"Rescued by Abraham from kings|Fled the destruction of Sodom and Gomorrah","Genesis 13|14|19|2 Peter 2:7",OT,male`;

// Parse CSV
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i];
    
    // More sophisticated CSV parsing to handle commas within quotes
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < currentLine.length; j++) {
      const char = currentLine[j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue); // Push last value
    
    // Map values to headers
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let value = values[j] || '';
      
      // Process the value
      if (value === 'null' || value === '') {
        value = null;
      } else if (header === 'aliases' || header === 'children' || header === 'siblings' || header === 'notable_events' || header === 'verses') {
        value = value.split('|').map(v => v.trim()).filter(v => v);
      }
      
      obj[header] = value;
    }
    
    result.push(obj);
  }
  
  return result;
}

// Convert to proper format
function convertToPeopleFormat(data) {
  return data.map(person => ({
    name: person.name,
    aliases: person.aliases || [],
    mother: person.mother,
    father: person.father,
    spouse: person.spouse,
    children: person.children || [],
    siblings: person.siblings || [],
    occupation: person.occupation,
    age_notes: person.age_notes,
    notable_events: person.notable_events || [],
    verses: person.verses || [],
    testament: person.testament,
    gender: person.gender
  }));
}

// Read existing data
const existingData = JSON.parse(fs.readFileSync('./assets/data/people.json', 'utf8'));
const newPeople = convertToPeopleFormat(parseCSV(csvData));

console.log(`Existing people: ${existingData.length}`);
console.log(`New people to add: ${newPeople.length}`);

// Create backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.writeFileSync(
  `./assets/data/people.backup.${timestamp}.json`,
  JSON.stringify(existingData, null, 2)
);
console.log(`Backup created: people.backup.${timestamp}.json`);

// Merge (add only new ones, avoid duplicates)
const existingNames = new Set(existingData.map(p => p.name.toLowerCase()));
const uniqueNewPeople = newPeople.filter(p => !existingNames.has(p.name.toLowerCase()));

console.log(`Unique new people: ${uniqueNewPeople.length}`);

const mergedData = [...existingData, ...uniqueNewPeople];

// Save
fs.writeFileSync('./assets/data/people.json', JSON.stringify(mergedData, null, 2));
console.log(`✓ Merged database saved with ${mergedData.length} total people`);
console.log(`\nSample of new additions:`);
uniqueNewPeople.slice(0, 5).forEach(p => {
  console.log(`  - ${p.name} (${p.testament}, ${p.gender})`);
});
