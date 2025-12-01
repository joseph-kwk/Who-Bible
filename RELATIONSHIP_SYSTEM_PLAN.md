# Relationship & Suggestion System Implementation Plan

## Phase 1: Enhanced Data Model ✓
Add to each person object:
- `father`: string | null
- `spouse`: string | string[] | null  
- `children`: string[]
- `siblings`: string[]
- `testament`: 'ot' | 'nt' | 'both'
- `gender`: 'male' | 'female'

## Phase 2: Relationship Graph Builder
Create functions to:
- Build bidirectional relationship map
- Find all related people (family tree)
- Group by relationship type
- Cache for performance

## Phase 3: Smart Suggestions
Suggestion types:
1. **Family Relations** - direct relatives
2. **Testament Context** - same/different testament
3. **Occupation Groups** - same occupation category
4. **Time Period** - contemporaries
5. **Location** - same region/city
6. **Event Connections** - shared events

## Phase 4: UI Integration
Where to show suggestions:
1. **Study Mode** - Relation chips on person cards
2. **After Quiz Answer** - "Related people" panel
3. **Search Results** - "People also searched"
4. **Person Detail Modal** - Full relationship section

## Implementation Steps
1. Update DEFAULT_PEOPLE_DATA with new fields
2. Create relationship utility functions
3. Add suggestion rendering functions
4. Integrate into existing UI components
5. Add filtering by testament/gender in all modes
