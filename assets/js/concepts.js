// concepts.js - Biblical Concepts Glossary Module

const ConceptModule = (function() {
  let concepts = [];
  let searchIndex = null;

  // Load concepts from JSON
  async function loadConcepts() {
    try {
      const response = await fetch('assets/data/bible_concepts.json');
      if (!response.ok) throw new Error('Failed to load concepts');
      concepts = await response.json();
      buildSearchIndex();
      return concepts;
    } catch (error) {
      console.error('Error loading concepts:', error);
      return [];
    }
  }

  // Build search index for faster searching
  function buildSearchIndex() {
    searchIndex = concepts.map(concept => ({
      term: concept.term.toLowerCase(),
      definition: concept.definition.toLowerCase(),
      tags: concept.tags.map(t => t.toLowerCase()),
      examples: concept.key_example.join(' ').toLowerCase(),
      refs: concept.biblical_references.join(' ').toLowerCase()
    }));
  }

  // Search concepts
  function searchConcepts(query) {
    if (!query || query.trim() === '') return concepts;
    
    const lowerQuery = query.toLowerCase().trim();
    const results = [];
    
    concepts.forEach((concept, index) => {
      const idx = searchIndex[index];
      let score = 0;
      
      // Term match (highest priority)
      if (idx.term.includes(lowerQuery)) score += 10;
      
      // Tag match
      if (idx.tags.some(tag => tag.includes(lowerQuery))) score += 5;
      
      // Definition match
      if (idx.definition.includes(lowerQuery)) score += 3;
      
      // Examples match
      if (idx.examples.includes(lowerQuery)) score += 2;
      
      // References match
      if (idx.refs.includes(lowerQuery)) score += 1;
      
      if (score > 0) {
        results.push({ concept, score });
      }
    });
    
    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.concept);
  }

  // Filter concepts
  function filterConcepts(filters = {}) {
    let filtered = [...concepts];
    
    if (filters.difficulty) {
      filtered = filtered.filter(c => c.difficulty === filters.difficulty);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        c.tags.some(tag => filters.tags.includes(tag))
      );
    }
    
    if (filters.hasReferences !== undefined) {
      filtered = filtered.filter(c => 
        filters.hasReferences ? c.biblical_references.length > 0 : c.biblical_references.length === 0
      );
    }
    
    return filtered;
  }

  // Sort concepts
  function sortConcepts(conceptsList = concepts, sortBy = 'term') {
    const sorted = [...conceptsList];
    
    switch(sortBy) {
      case 'term':
        sorted.sort((a, b) => a.term.localeCompare(b.term));
        break;
      case 'difficulty':
        const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
        sorted.sort((a, b) => 
          (difficultyOrder[a.difficulty] || 99) - (difficultyOrder[b.difficulty] || 99)
        );
        break;
    }
    
    return sorted;
  }

  // Get concept by term
  function getConceptByTerm(term) {
    return concepts.find(c => 
      c.term.toLowerCase() === term.toLowerCase()
    );
  }

  // Get related concepts (based on shared tags)
  function getRelatedConcepts(concept, limit = 5) {
    if (!concept || !concept.tags) return [];
    
    const related = concepts
      .filter(c => c.term !== concept.term)
      .map(c => {
        const sharedTags = c.tags.filter(tag => concept.tags.includes(tag));
        return { concept: c, score: sharedTags.length };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.concept);
    
    return related;
  }

  // Get all unique tags
  function getTags() {
    const tags = new Set();
    concepts.forEach(c => c.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }

  // Get all difficulties
  function getDifficulties() {
    return [...new Set(concepts.map(c => c.difficulty))];
  }

  // Get random concept
  function getRandomConcept() {
    if (concepts.length === 0) return null;
    const idx = Math.floor(Math.random() * concepts.length);
    return concepts[idx];
  }

  // Generate concept quiz questions
  function generateConceptQuiz(count = 5) {
    const questions = [];
    const shuffled = [...concepts].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const concept = shuffled[i];
      const questionTypes = ['definition', 'example', 'reference'];
      const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      let question = {
        term: concept.term,
        type: qType,
        prompt: '',
        options: [],
        correct: '',
        explanation: concept.definition
      };
      
      switch(qType) {
        case 'definition':
          question.prompt = `What is "${concept.term}"?`;
          question.correct = concept.definition;
          // Generate wrong definitions from other concepts
          const otherDefs = concepts
            .filter(c => c.term !== concept.term)
            .map(c => c.definition);
          question.options = generateOptions(concept.definition, otherDefs, 4);
          break;
          
        case 'example':
          if (concept.key_example.length > 0) {
            question.prompt = `Which is an example of "${concept.term}"?`;
            question.correct = concept.key_example[0];
            // Generate options from other concepts' examples
            const otherExamples = concepts
              .filter(c => c.term !== concept.term && c.key_example.length > 0)
              .flatMap(c => c.key_example);
            question.options = generateOptions(concept.key_example[0], otherExamples, 4);
          }
          break;
          
        case 'reference':
          if (concept.biblical_references.length > 0) {
            question.prompt = `Which biblical reference relates to "${concept.term}"?`;
            question.correct = concept.biblical_references[0];
            // Generate options from other concepts' references
            const otherRefs = concepts
              .filter(c => c.term !== concept.term && c.biblical_references.length > 0)
              .flatMap(c => c.biblical_references);
            question.options = generateOptions(concept.biblical_references[0], otherRefs, 4);
          }
          break;
      }
      
      // Only add if options were generated
      if (question.options.length > 0) {
        questions.push(question);
      }
    }
    
    return questions;
  }

  // Generate multiple choice options
  function generateOptions(correct, pool, count = 4) {
    const unique = [...new Set(pool)].filter(x => x !== correct);
    const wrong = [];
    
    while (wrong.length < count - 1 && unique.length > 0) {
      const idx = Math.floor(Math.random() * unique.length);
      wrong.push(unique.splice(idx, 1)[0]);
    }
    
    const options = [correct, ...wrong];
    return options.sort(() => Math.random() - 0.5);
  }

  // Get concepts by difficulty level
  function getConceptsByDifficulty(difficulty) {
    return concepts.filter(c => c.difficulty === difficulty);
  }

  // Get concepts by tag
  function getConceptsByTag(tag) {
    return concepts.filter(c => 
      c.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  // Export concept as text for sharing
  function exportConceptAsText(concept) {
    let text = `**${concept.term}**\n\n`;
    text += `${concept.definition}\n\n`;
    
    if (concept.key_example.length > 0) {
      text += `**Examples:**\n`;
      concept.key_example.forEach((example, i) => {
        text += `${i + 1}. ${example}\n`;
      });
      text += '\n';
    }
    
    if (concept.biblical_references.length > 0) {
      text += `**Biblical References:**\n`;
      text += concept.biblical_references.join(', ') + '\n\n';
    }
    
    if (concept.tags.length > 0) {
      text += `**Tags:** ${concept.tags.join(', ')}\n`;
    }
    
    return text;
  }

  // Initialize the module
  async function init() {
    await loadConcepts();
    return concepts.length > 0;
  }

  // Public API
  return {
    init,
    loadConcepts,
    searchConcepts,
    filterConcepts,
    sortConcepts,
    getConceptByTerm,
    getRelatedConcepts,
    getTags,
    getDifficulties,
    getRandomConcept,
    generateConceptQuiz,
    getConceptsByDifficulty,
    getConceptsByTag,
    exportConceptAsText,
    get concepts() { return concepts; }
  };
})();

// Make available globally
window.ConceptModule = ConceptModule;
