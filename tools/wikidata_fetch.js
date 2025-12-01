// Fetch candidate biblical persons from Wikidata via SPARQL
// Writes tools/wikidata_people_raw.json
const fs = require('fs');
const endpoint = 'https://query.wikidata.org/sparql';

const query = `
SELECT 
  ?item ?itemLabel ?description ?genderLabel 
  ?motherLabel ?fatherLabel
  (GROUP_CONCAT(DISTINCT ?childLabel; separator="||") AS ?children)
  (GROUP_CONCAT(DISTINCT ?alias; separator="||") AS ?aliases) 
  ?wikilink 
WHERE {
  ?item wdt:P31 wd:Q202444. # Instance of Biblical Character
  
  OPTIONAL { ?item schema:description ?description FILTER(LANG(?description)='en') }
  OPTIONAL { ?item wdt:P21 ?gender . }
  OPTIONAL { ?item wdt:P25 ?mother . }
  OPTIONAL { ?item wdt:P22 ?father . }
  OPTIONAL { ?item wdt:P40 ?child . }
  OPTIONAL { ?item skos:altLabel ?alias FILTER(LANG(?alias)='en') }
  OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. BIND(STR(?article) AS ?wikilink) }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?description ?genderLabel ?motherLabel ?fatherLabel ?wikilink
LIMIT 500
`;

async function fetchSparql(q){
  const url = endpoint + '?query=' + encodeURIComponent(q);
  const res = await fetch(url, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'Who-Bible/1.0 (bot)'} });
  if(!res.ok) throw new Error('SPARQL request failed: ' + res.status + ' ' + res.statusText);
  return res.json();
}

(async ()=>{
  try{
    console.log('Querying Wikidata SPARQL...');
    const data = await fetchSparql(query);
    const rows = (data.results && data.results.bindings) || [];
    const out = rows.map(r=>{
      const item = r.item.value;
      const qid = item.split('/').pop();
      return {
        qid,
        name: r.itemLabel?.value || '',
        description: r.description?.value || '',
        aliases: (r.aliases && r.aliases.value) ? r.aliases.value.split('||').map(s=>s.trim()).filter(Boolean) : [],
        gender: r.genderLabel?.value || null,
        mother: r.motherLabel?.value || null,
        father: r.fatherLabel?.value || null,
        spouse: r.spouseLabel?.value || null,
        spouse: r.spouseLabel?.value || null,
        children: (r.children && r.children.value) ? r.children.value.split('||').map(s=>s.trim()).filter(Boolean) : [],
        wikilink: r.wikilink?.value || null
      };
    });
    fs.writeFileSync('tools/wikidata_people_raw.json', JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote tools/wikidata_people_raw.json —', out.length, 'records');
  }catch(err){
    console.error('Error fetching Wikidata:', err);
    process.exitCode = 2;
  }
})();
