// Relationship and Suggestion System
// Provides smart suggestions based on family, occupation, testament, etc.

const RelationshipSystem = {
  // Relationship graph cache
  relationshipGraph: null,
  
  /**
   * Build relationship graph from people data
   */
  buildRelationshipGraph(people) {
    const graph = new Map();
    
    people.forEach(person => {
      const relations = {
        family: [],
        sameTestament: [],
        sameOccupation: [],
        sameGender: [],
        contemporaries: []
      };
      
      // Find family members
      if (person.mother) {
        const mother = people.find(p => p.name === person.mother);
        if (mother) relations.family.push({ name: mother.name, relation: 'mother' });
      }
      
      if (person.father) {
        const father = people.find(p => p.name === person.father);
        if (father) relations.family.push({ name: father.name, relation: 'father' });
      }
      
      if (person.spouse) {
        const spouses = Array.isArray(person.spouse) ? person.spouse : [person.spouse];
        spouses.forEach(spouseName => {
          const spouse = people.find(p => p.name === spouseName);
          if (spouse) relations.family.push({ name: spouse.name, relation: 'spouse' });
        });
      }
      
      if (person.children && person.children.length > 0) {
        person.children.forEach(childName => {
          const child = people.find(p => p.name === childName);
          if (child) relations.family.push({ name: child.name, relation: 'child' });
        });
      }
      
      if (person.siblings && person.siblings.length > 0) {
        person.siblings.forEach(siblingName => {
          const sibling = people.find(p => p.name === siblingName);
          if (sibling) relations.family.push({ name: sibling.name, relation: 'sibling' });
        });
      }
      
      // Find people in same testament
      if (person.testament) {
        relations.sameTestament = people
          .filter(p => p.name !== person.name && p.testament === person.testament)
          .map(p => p.name)
          .slice(0, 5); // Limit to 5
      }
      
      // Find people with same occupation category
      if (person.occupation) {
        const occCategory = this.categorizeOccupation(person.occupation);
        relations.sameOccupation = people
          .filter(p => {
            if (p.name === person.name || !p.occupation) return false;
            return this.categorizeOccupation(p.occupation) === occCategory;
          })
          .map(p => p.name)
          .slice(0, 5);
      }
      
      // Find people of same gender
      if (person.gender) {
        relations.sameGender = people
          .filter(p => p.name !== person.name && p.gender === person.gender)
          .map(p => p.name)
          .slice(0, 5);
      }
      
      graph.set(person.name, relations);
    });
    
    this.relationshipGraph = graph;
    return graph;
  },
  
  /**
   * Categorize occupation into broader groups
   */
  categorizeOccupation(occupation) {
    const occ = occupation.toLowerCase();
    if (occ.includes('prophet')) return 'prophet';
    if (occ.includes('king') || occ.includes('ruler')) return 'ruler';
    if (occ.includes('priest')) return 'priest';
    if (occ.includes('judge')) return 'judge';
    if (occ.includes('apostle') || occ.includes('disciple')) return 'apostle';
    if (occ.includes('shepherd')) return 'shepherd';
    if (occ.includes('patriarch')) return 'patriarch';
    return 'other';
  },
  
  /**
   * Get suggestions for a person
   */
  getSuggestions(personName, people, maxPerType = 3) {
    if (!this.relationshipGraph) {
      this.buildRelationshipGraph(people);
    }
    
    const relations = this.relationshipGraph.get(personName);
    if (!relations) return null;
    
    return {
      family: relations.family.slice(0, maxPerType),
      sameTestament: relations.sameTestament.slice(0, maxPerType),
      sameOccupation: relations.sameOccupation.slice(0, maxPerType),
      sameGender: relations.sameGender.slice(0, maxPerType)
    };
  },
  
  /**
   * Get family tree for a person (multi-level)
   */
  getFamilyTree(personName, people, maxDepth = 2) {
    const visited = new Set();
    const tree = [];
    
    const explore = (name, depth, relation) => {
      if (depth > maxDepth || visited.has(name)) return;
      visited.add(name);
      
      const person = people.find(p => p.name === name);
      if (!person) return;
      
      if (relation) {
        tree.push({ name, relation, depth });
      }
      
      // Explore family
      if (person.mother) explore(person.mother, depth + 1, 'mother');
      if (person.father) explore(person.father, depth + 1, 'father');
      if (person.spouse) {
        const spouses = Array.isArray(person.spouse) ? person.spouse : [person.spouse];
        spouses.forEach(s => explore(s, depth + 1, 'spouse'));
      }
      if (person.children) {
        person.children.forEach(c => explore(c, depth + 1, 'child'));
      }
      if (person.siblings) {
        person.siblings.forEach(s => explore(s, depth + 1, 'sibling'));
      }
    };
    
    explore(personName, 0, null);
    return tree;
  },
  
  /**
   * Get search suggestions based on query
   */
  getSearchSuggestions(query, people, limit = 5) {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    
    const matches = [];
    
    people.forEach(person => {
      let score = 0;
      
      // Exact name match
      if (person.name.toLowerCase() === q) score += 100;
      // Name starts with query
      else if (person.name.toLowerCase().startsWith(q)) score += 50;
      // Name contains query
      else if (person.name.toLowerCase().includes(q)) score += 20;
      
      // Check aliases
      if (person.aliases) {
        person.aliases.forEach(alias => {
          if (alias.toLowerCase().includes(q)) score += 15;
        });
      }
      
      // Check occupation
      if (person.occupation && person.occupation.toLowerCase().includes(q)) {
        score += 10;
      }
      
      // Check events
      if (person.notable_events) {
        person.notable_events.forEach(event => {
          if (event.toLowerCase().includes(q)) score += 5;
        });
      }
      
      if (score > 0) {
        matches.push({ person, score });
      }
    });
    
    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => m.person.name);
  },
  
  /**
   * Filter people by criteria
   */
  filterPeople(people, filters) {
    let filtered = people;
    
    if (filters.testament && filters.testament !== 'all') {
      filtered = filtered.filter(p => p.testament === filters.testament);
    }
    
    if (filters.gender && filters.gender !== 'all') {
      filtered = filtered.filter(p => p.gender === filters.gender);
    }
    
    if (filters.occupation) {
      const category = this.categorizeOccupation(filters.occupation);
      filtered = filtered.filter(p => {
        if (!p.occupation) return false;
        return this.categorizeOccupation(p.occupation) === category;
      });
    }
    
    return filtered;
  },
  
  /**
   * Get related questions for quiz mode
   */
  getRelatedQuestions(personName, people, currentQuestionType) {
    const suggestions = this.getSuggestions(personName, people, 2);
    if (!suggestions) return [];
    
    // Combine all suggestions
    const related = [
      ...suggestions.family.map(f => f.name),
      ...suggestions.sameOccupation,
      ...suggestions.sameTestament
    ];
    
    // Remove duplicates
    return [...new Set(related)].slice(0, 3);
  }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RelationshipSystem;
}
