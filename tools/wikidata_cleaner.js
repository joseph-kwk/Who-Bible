// Cleans raw wikidata JSON and normalizes it for the app
// Reads: tools/wikidata_people_raw.json
// Writes: tools/people_from_wikidata.json
const fs = require('fs');

const rawPath = 'tools/wikidata_people_raw.json';
const outPath = 'tools/people_from_wikidata.json';
const existingDataPath = 'assets/js/app.js'; // Fallback path
const existingDataJson = 'assets/data/people.json'; // Preferred canonical data path

function normalizeLabel(s) {
    if (!s) return '';
    // remove parentheticals like "(son of Jacob)", punctuation, and normalize whitespace
    let out = String(s).replace(/\([^)]*\)/g, '');
    out = out.replace(/[.,;:\/\"'\[\]\{\}!\?]/g, '');
    out = out.replace(/\s+/g, ' ').trim().toLowerCase();
    return out;
}

function readJsonIfExists(path) {
    try {
        if (fs.existsSync(path)) {
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        }
    } catch (e) {
        // ignore parse errors here
    }
    return null;
}

function getExistingPeopleMap() {
    // Prefer to read a canonical JSON file if present
    const map = new Map();
    const jsonData = readJsonIfExists(existingDataJson);
    if (jsonData && Array.isArray(jsonData)) {
        jsonData.forEach(p => {
            if (!p || !p.name) return;
            const key = normalizeLabel(p.name);
            map.set(key, { name: p.name, source: 'existing' });
            if (Array.isArray(p.aliases)) {
                p.aliases.forEach(a => {
                    const ak = normalizeLabel(a);
                    if (ak) map.set(ak, { name: p.name, source: 'existing' });
                });
            }
        });
        console.log(`Loaded ${map.size} indexed names/aliases from ${existingDataJson}.`);
        return map;
    }

    // Fallback: try to parse assets/js/app.js for DEFAULT_PEOPLE_DATA
    try {
        const content = fs.readFileSync(existingDataPath, 'utf8');
        const match = content.match(/const DEFAULT_PEOPLE_DATA = (\[[\s\S]*?\]);/);
        if (match && match[1]) {
            const data = JSON.parse(match[1].replace(/'/g, '"'));
            data.forEach(p => {
                if (!p || !p.name) return;
                const key = normalizeLabel(p.name);
                map.set(key, { name: p.name, source: 'existing' });
                if (Array.isArray(p.aliases)) {
                    p.aliases.forEach(a => {
                        const ak = normalizeLabel(a);
                        if (ak) map.set(ak, { name: p.name, source: 'existing' });
                    });
                }
            });
            console.log(`Indexed ${map.size} names/aliases from ${existingDataPath}.`);
            return map;
        }
    } catch (e) {
        console.warn('Could not read existing people data, proceeding without it.');
    }

    return map;
}


function normalizeGender(genderStr) {
    if (!genderStr) return 'unknown';
    const lower = String(genderStr).toLowerCase();
    if (lower.includes('female')) return 'female';
    if (lower.includes('male')) return 'male';
    return 'unknown';
}

function cleanRecord(raw, existingMap) {
    const name = raw.name ? raw.name.trim() : '';
    if (!name) return null;
    // If the name already exists in the canonical dataset, skip to avoid overwriting
    if (existingMap.has(name.toLowerCase())) return null;

    return {
        name: name,
        aliases: raw.aliases || [],
        mother: raw.mother || '',
        father: raw.father || '',
        spouse: raw.spouse || '',
        children: raw.children || [],
        occupation: '', // Wikidata occupation is too noisy, leave blank
        age_notes: '',
        notable_events: [],
        verses: [],
        short_bio: raw.description || '',
        testament: 'unknown', // Needs to be inferred or set manually
        gender: normalizeGender(raw.gender),
        _qid: raw.qid || null,
        _source: `wikidata:${raw.qid}`,
        _wikilink: raw.wikilink || '',
        _inferred_testament: false,
        _inferred_gender: raw.gender ? false : true, // Mark as inferred if we guessed
        _verified: false,
    };
}

function main() {
    if (!fs.existsSync(rawPath)) {
        console.error(`Error: Input file not found at ${rawPath}. Run wikidata_fetch.js first.`);
        process.exit(1);
    }

    try {
        const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
        const existingMap = getExistingPeopleMap();

        // First pass: clean and filter
        let cleanedData = rawData
            .map(rec => cleanRecord(rec, existingMap))
            .filter(Boolean); // Remove nulls

        // Build lookup for newly cleaned items (by name and aliases)
        const cleanedLookup = new Map();
        cleanedData.forEach(p => {
            cleanedLookup.set(p.name.toLowerCase(), { name: p.name, source: p._source, _qid: p._qid });
            if (Array.isArray(p.aliases)) {
                p.aliases.forEach(a => {
                    if (a && a.trim()) cleanedLookup.set(a.trim().toLowerCase(), { name: p.name, source: p._source, _qid: p._qid });
                });
            }
        });

        // Helper to find a match in existingMap or cleanedLookup
        function matchPerson(label) {
                    if (!label) return null;
                    const key = normalizeLabel(label);
                    if (existingMap.has(key)) return existingMap.get(key);
                    if (cleanedLookup.has(key)) return cleanedLookup.get(key);
                    return null;
        }

        // Second pass: link relationships where possible
        cleanedData = cleanedData.map(p => {
            const motherMatch = matchPerson(p.mother);
            if (motherMatch) {
                p.mother = motherMatch.name;
                p._mother_source = motherMatch.source || null;
            }
            const fatherMatch = matchPerson(p.father);
            if (fatherMatch) {
                p.father = fatherMatch.name;
                p._father_source = fatherMatch.source || null;
            }
            if (Array.isArray(p.children) && p.children.length) {
                const resolvedChildren = [];
                const childrenSources = [];
                p.children.forEach(c => {
                    const m = matchPerson(c);
                    if (m) {
                        resolvedChildren.push(m.name);
                        childrenSources.push(m.source || null);
                    } else if (c && c.trim()) {
                        resolvedChildren.push(c);
                    }
                });
                p.children = resolvedChildren;
                if (childrenSources.length) p._children_sources = childrenSources;
            }
            return p;
        });

        // Simple deduplication based on normalized name
        const uniqueData = Array.from(new Map(cleanedData.map(p => [normalizeLabel(p.name), p])).values());

        // Summary counts for report
        let resolvedMother = 0, resolvedFather = 0, resolvedChildren = 0;
        uniqueData.forEach(p => {
            if (p._mother_source) resolvedMother++;
            if (p._father_source) resolvedFather++;
            if (p._children_sources && p._children_sources.length) resolvedChildren += p._children_sources.length;
        });

        fs.writeFileSync(outPath, JSON.stringify(uniqueData, null, 2), 'utf8');
        console.log(`Wrote ${uniqueData.length} cleaned and deduplicated records to ${outPath}.`);
        console.log(`${rawData.length - uniqueData.length} records were skipped (already exist or had no name).`);
        console.log(`Resolved relationships: mothers=${resolvedMother}, fathers=${resolvedFather}, children-links=${resolvedChildren}`);

    } catch (err) {
        console.error('Error cleaning Wikidata file:', err);
        process.exit(2);
    }
}

main();
