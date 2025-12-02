# New Features: Biblical Scenarios, Locations & Concepts

This document describes the three major content expansions added to Who-Bible to enhance the learning experience.

## 📖 Overview

Three new data-rich features have been integrated into Who-Bible:

1. **Scenarios Mode** - Biblical moral dilemmas and decision-making challenges
2. **Biblical Places** - Interactive map and location explorer
3. **Concepts Glossary** - Theological terms and doctrines reference

## 🎭 1. Scenarios Mode

### Description
Scenarios Mode presents users with biblical situations requiring moral judgment and theological knowledge. Each scenario includes context, multiple-choice options, and detailed explanations.

### Data Structure (`bible_scenarios.json`)
```json
{
  "scenario_id": "Gideon_Army_Selection",
  "theme": "Trust and Obedience",
  "book_ref": "Judges 7:2-7",
  "challenge": "Question text...",
  "options": ["A. Option 1", "B. Option 2", "C. Option 3"],
  "correct_answer": "C",
  "explanation": "Detailed explanation...",
  "level": "Intermediate",
  "tags": ["Gideon", "Judges", "Faith", "Military"]
}
```

### Features
- **7 curated scenarios** covering OT and NT
- **Difficulty levels**: Beginner, Intermediate, Advanced, Expert
- **Thematic organization**: Trust, Wisdom, Theology, etc.
- **Rich explanations** with biblical context
- **Tag-based categorization** for easy filtering

### Usage (Main App)
1. Click **"Scenarios Mode"** button on setup panel (🎭 icon)
2. Select number of questions (up to 7 currently)
3. Answer multiple-choice questions
4. View explanations and biblical references
5. Track score and streak

### Technical Implementation
- **Module**: `assets/js/scenarios.js`
- **Core Functions**:
  - `ScenarioModule.init()` - Load scenarios
  - `ScenarioModule.getCurrentScenario()` - Get active scenario
  - `ScenarioModule.checkAnswer(option)` - Validate answer
  - `ScenarioModule.filterScenarios(filters)` - Filter by level/tags
- **Integration**: Seamlessly integrated into existing quiz flow in `app.js`
- **Styling**: Custom scenario styles in `styles.css` (`.scenario-*` classes)

## 🗺️ 2. Biblical Places (Locations)

### Description
An interactive map showing key biblical locations with historical context, related figures, and geographical data.

### Data Structure (`bible_locations.json`)
```json
{
  "location_name": "Jerusalem",
  "era": "Iron Age to Roman",
  "primary_role": "Capital City",
  "testament_link": "OT & NT",
  "coordinates": { "lat": 31.7683, "lon": 35.2137 },
  "key_events": ["David captured it...", "Solomon built..."],
  "related_figures": ["David", "Solomon", "Jesus", "Peter"],
  "modern_country": "Israel",
  "importance": 10
}
```

### Features
- **12 key locations** across Middle East
- **Interactive SVG map** with clickable markers
- **Coordinate mapping** (lat/lon to SVG projection)
- **Filtering**: By testament, importance, era, role
- **Location cards**: Detailed information with events and figures
- **Importance ratings** (1-10 scale)

### Usage (Community Page)
1. Navigate to **Community** page
2. Click **"Places"** tab
3. Interact with map or browse location cards
4. Click locations for detailed modal view
5. Use filters to narrow results

### Technical Implementation
- **Module**: `assets/js/locations.js`
- **Core Functions**:
  - `LocationModule.init()` - Load locations
  - `LocationModule.initSimpleMap(containerId)` - Create SVG map
  - `LocationModule.addLocationMarkers(locations)` - Plot locations
  - `LocationModule.filterLocations(filters)` - Filter by criteria
  - `LocationModule.latLonToSVG(lat, lon)` - Coordinate projection
- **Map Technology**: Custom SVG with JavaScript (no external dependencies)
- **Event System**: Dispatches `location-selected` custom event

## 📚 3. Concepts Glossary

### Description
A comprehensive reference of biblical and theological concepts with definitions, examples, and scriptural references.

### Data Structure (`bible_concepts.json`)
```json
{
  "term": "Covenant (Berith)",
  "definition": "A formal, legally binding agreement...",
  "key_example": [
    "Noahic Covenant: Rainbow sign",
    "Abrahamic Covenant: Land promise"
  ],
  "biblical_references": ["Genesis 9:11", "Genesis 12:1-3"],
  "tags": ["Law", "Relationship", "Theology"],
  "difficulty": "Intermediate"
}
```

### Features
- **10 foundational concepts** (Grace, Trinity, Atonement, etc.)
- **Difficulty levels**: Beginner to Expert
- **Search functionality**: Full-text search across terms, definitions, examples
- **Tag-based filtering**: By theological categories
- **Related concepts**: Automatic linking based on shared tags
- **Export capability**: Copy concept details as formatted text

### Usage (Community Page)
1. Navigate to **Community** page
2. Click **"Learn"** tab
3. Search for concepts or browse by difficulty
4. Click **"Random Concept"** for discovery
5. Click concept cards for full details

### Technical Implementation
- **Module**: `assets/js/concepts.js`
- **Core Functions**:
  - `ConceptModule.init()` - Load concepts
  - `ConceptModule.searchConcepts(query)` - Full-text search with scoring
  - `ConceptModule.filterConcepts(filters)` - Filter by difficulty/tags
  - `ConceptModule.getRelatedConcepts(concept)` - Find related entries
  - `ConceptModule.exportConceptAsText(concept)` - Export formatted text
- **Search Algorithm**: Weighted scoring (term > tags > definition > examples)
- **Performance**: In-memory search index for fast lookups

## 🎨 Styling & UI

### New CSS Classes

**Scenarios**:
- `.scenario-header` - Theme and level badges
- `.scenario-challenge` - Question prompt styling
- `.scenario-explanation` - Answer feedback with explanation
- `.scenario-tags` - Tag chips display

**Locations**:
- `.location-map` - SVG map container
- `.location-marker` - Interactive map markers
- `.location-card` - Location detail cards
- `.location-meta` - Metadata badges (testament, era, role)

**Concepts**:
- `.concept-card` - Glossary entry cards
- `.concept-difficulty` - Difficulty badge
- `.concept-examples` - Examples section
- `.concept-references` - Biblical references
- `.concept-tags` - Tag chips

### Responsive Design
All new features are fully responsive with:
- Flexible grid layouts
- Mobile-friendly touch targets
- Adaptive font sizes
- Collapsible sections

## 🌐 Internationalization (i18n)

### New Translation Keys (EN)
```json
{
  "scenariosMode": "Scenarios Mode",
  "scenariosDesc": "Moral dilemmas & decisions",
  "scenariosStart": "Scenarios Mode",
  "scenariosStartMsg": "Test your knowledge of biblical scenarios!",
  "locationsTab": "Places",
  "conceptsTab": "Learn",
  "biblicalPlaces": "Biblical Places",
  "biblicalConcepts": "Biblical Concepts Glossary",
  "searchConcepts": "Search concepts...",
  "allLevels": "All Levels",
  "randomConcept": "Random Concept",
  "keyEvents": "Key Events",
  "relatedFigures": "Related Figures",
  "modernLocation": "Modern Location",
  "coordinates": "Coordinates",
  "testament": "Testament",
  "importance": "Importance",
  "resetMap": "Reset Map"
}
```

**Note**: Spanish and French translations need to be added manually to `es.json` and `fr.json`.

## 🔧 Integration Points

### Main App (`index.html` & `app.js`)
- New **"Scenarios Mode"** button added to game modes section
- Event handler wired to `startScenarios()` function
- Quiz flow modified to support scenario-specific rendering
- Module initialization in `init()` function

### Community Page (`community.html` & `community.js`)
- Two new tabs: **"Places"** and **"Learn"**
- Lazy initialization on tab click
- Shared modal system for detail views
- Filter controls for both features

### Shared Infrastructure
- All three modules follow the same pattern:
  - Async `init()` function
  - Module pattern with private state
  - Public API via `window.Module`
  - JSON data loading with error handling
  - Event-driven architecture

## 📊 Data Summary

| Feature | Data File | Items | Size | Expandable |
|---------|-----------|-------|------|------------|
| Scenarios | `bible_scenarios.json` | 7 | ~5 KB | ✅ Yes |
| Locations | `bible_locations.json` | 12 | ~6 KB | ✅ Yes |
| Concepts | `bible_concepts.json` | 10 | ~8 KB | ✅ Yes |

## 🚀 Future Enhancements

### Scenarios
- [ ] Add 50+ more scenarios covering all biblical books
- [ ] Implement scenario creation tool for community contributions
- [ ] Add "moral dilemma" mode with no single correct answer
- [ ] Create scenario collections (e.g., "Wisdom Literature", "Epistles")

### Locations
- [ ] Add journey tracing (e.g., Paul's missionary journeys)
- [ ] Integrate real map tiles (OpenStreetMap) for accuracy
- [ ] Add timeline filter (Bronze Age, Iron Age, Roman, etc.)
- [ ] Create location-based quiz mode ("Where did this happen?")
- [ ] Add photos/illustrations of archaeological sites

### Concepts
- [ ] Expand to 100+ concepts covering systematic theology
- [ ] Add concept relationships graph visualization
- [ ] Implement "Learn a Concept Daily" feature
- [ ] Create concept quiz mode
- [ ] Add audio pronunciation for Hebrew/Greek terms
- [ ] Link concepts to relevant people and scenarios

## 🧪 Testing Checklist

### Scenarios Mode
- [x] Data loads correctly
- [x] Questions display with formatting
- [x] Answer selection works
- [x] Correct/incorrect feedback shown
- [x] Explanations display properly
- [x] Score and streak update
- [x] Tags display correctly
- [x] Quiz completes and shows summary

### Locations
- [x] Data loads correctly
- [x] Map renders with correct dimensions
- [x] Markers plot at correct positions
- [x] Location cards render
- [x] Filters work correctly
- [x] Reset map button functions
- [x] Click on location shows modal
- [x] Modal displays all information

### Concepts
- [x] Data loads correctly
- [x] All concepts display
- [x] Search returns relevant results
- [x] Difficulty filter works
- [x] Random concept button works
- [x] Click on concept shows modal
- [x] Modal displays all fields
- [x] Tags are clickable

## 📱 Browser Compatibility

All features tested and working on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## 📝 Code Quality

- **Modularity**: Each feature is self-contained
- **Error Handling**: Graceful fallbacks if data fails to load
- **Performance**: Lazy loading, efficient search algorithms
- **Accessibility**: Semantic HTML, ARIA labels where needed
- **Maintainability**: Well-documented, consistent patterns

## 🎓 Educational Value

These features enhance Who-Bible's educational mission:

1. **Scenarios**: Develop critical thinking about biblical ethics and theology
2. **Locations**: Understand geographical and historical context
3. **Concepts**: Build theological literacy and doctrinal understanding

Together, they create a comprehensive Bible learning experience beyond simple memorization.

## 🤝 Contributing

To add more data:

1. **Scenarios**: Add entries to `bible_scenarios.json` following the schema
2. **Locations**: Add entries to `bible_locations.json` with accurate coordinates
3. **Concepts**: Add entries to `bible_concepts.json` with references

All data files use simple JSON arrays and are easy to extend.

## 📞 Support

For questions or issues with these features:
1. Check console for error messages
2. Verify JSON data is valid
3. Ensure modules are loaded (`window.ScenarioModule`, etc.)
4. Test in browser DevTools console

---

**Version**: 1.0.0  
**Last Updated**: December 2, 2025  
**Total New Code**: ~1500 lines across 3 modules + integration
