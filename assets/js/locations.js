// locations.js - Biblical Locations & Geography Module

const LocationModule = (function() {
  let locations = [];
  let map = null;
  let markers = [];

  // Load locations from JSON
  async function loadLocations() {
    try {
      const response = await fetch('assets/data/bible_locations.json');
      if (!response.ok) throw new Error('Failed to load locations');
      locations = await response.json();
      return locations;
    } catch (error) {
      console.error('Error loading locations:', error);
      return [];
    }
  }

  // Filter locations by criteria
  function filterLocations(filters = {}) {
    let filtered = [...locations];
    
    if (filters.era) {
      filtered = filtered.filter(l => l.era.includes(filters.era));
    }
    
    if (filters.testament) {
      filtered = filtered.filter(l => l.testament_link.includes(filters.testament));
    }
    
    if (filters.role) {
      filtered = filtered.filter(l => l.primary_role === filters.role);
    }
    
    if (filters.figure) {
      filtered = filtered.filter(l => 
        l.related_figures.some(f => 
          f.toLowerCase().includes(filters.figure.toLowerCase())
        )
      );
    }
    
    if (filters.minImportance) {
      filtered = filtered.filter(l => l.importance >= filters.minImportance);
    }
    
    return filtered;
  }

  // Sort locations
  function sortLocations(locations, sortBy = 'importance') {
    const sorted = [...locations];
    
    switch(sortBy) {
      case 'importance':
        sorted.sort((a, b) => b.importance - a.importance);
        break;
      case 'name':
        sorted.sort((a, b) => a.location_name.localeCompare(b.location_name));
        break;
      case 'era':
        sorted.sort((a, b) => a.era.localeCompare(b.era));
        break;
      case 'testament':
        sorted.sort((a, b) => a.testament_link.localeCompare(b.testament_link));
        break;
    }
    
    return sorted;
  }

  // Initialize simple SVG map
  function initSimpleMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create SVG map of Middle East region
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 800 600');
    svg.setAttribute('class', 'location-map');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.border = '1px solid var(--border)';
    svg.style.borderRadius = '8px';
    svg.style.backgroundColor = 'var(--bg-secondary)';
    
    // Add background water (Mediterranean)
    const water = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    water.setAttribute('x', '0');
    water.setAttribute('y', '0');
    water.setAttribute('width', '800');
    water.setAttribute('height', '600');
    water.setAttribute('fill', '#4a90b8');
    water.setAttribute('opacity', '0.2');
    svg.appendChild(water);
    
    // Add land mass (simplified Middle East)
    const land = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    land.setAttribute('d', 'M 50 50 L 750 50 L 750 550 L 50 550 Z');
    land.setAttribute('fill', 'var(--bg)');
    land.setAttribute('stroke', 'var(--border)');
    land.setAttribute('stroke-width', '2');
    svg.appendChild(land);
    
    // Add grid lines for reference
    for (let i = 100; i < 800; i += 100) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i);
      line.setAttribute('y1', '50');
      line.setAttribute('x2', i);
      line.setAttribute('y2', '550');
      line.setAttribute('stroke', 'var(--border)');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      svg.appendChild(line);
    }
    
    for (let i = 100; i < 600; i += 100) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '50');
      line.setAttribute('y1', i);
      line.setAttribute('x2', '750');
      line.setAttribute('y2', i);
      line.setAttribute('stroke', 'var(--border)');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      svg.appendChild(line);
    }
    
    container.appendChild(svg);
    map = { svg, container, markers: [] };
    return map;
  }

  // Convert lat/lon to SVG coordinates (simplified projection)
  function latLonToSVG(lat, lon) {
    // Middle East bounding box: ~25-40°N, ~30-50°E
    const minLat = 25, maxLat = 40;
    const minLon = 30, maxLon = 50;
    const svgWidth = 700, svgHeight = 500; // usable area
    const offsetX = 50, offsetY = 50;
    
    const x = offsetX + ((lon - minLon) / (maxLon - minLon)) * svgWidth;
    const y = offsetY + ((maxLat - lat) / (maxLat - minLat)) * svgHeight; // inverted Y
    
    return { x, y };
  }

  // Add location markers to map
  function addLocationMarkers(locationsToShow = locations) {
    if (!map) return;
    
    // Clear existing markers
    map.markers.forEach(m => m.remove());
    map.markers = [];
    
    locationsToShow.forEach(location => {
      const { x, y } = latLonToSVG(location.coordinates.lat, location.coordinates.lon);
      
      // Create marker group
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'location-marker');
      group.setAttribute('data-location', location.location_name);
      group.style.cursor = 'pointer';
      
      // Marker circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', Math.sqrt(location.importance) * 2);
      circle.setAttribute('fill', '#e74c3c');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('opacity', '0.8');
      group.appendChild(circle);
      
      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y - 15);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--text)');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.textContent = location.location_name;
      group.appendChild(text);
      
      // Add hover effect
      group.addEventListener('mouseenter', () => {
        circle.setAttribute('r', Math.sqrt(location.importance) * 3);
        circle.setAttribute('opacity', '1');
      });
      
      group.addEventListener('mouseleave', () => {
        circle.setAttribute('r', Math.sqrt(location.importance) * 2);
        circle.setAttribute('opacity', '0.8');
      });
      
      // Add click event
      group.addEventListener('click', () => {
        showLocationDetails(location);
      });
      
      map.svg.appendChild(group);
      map.markers.push(group);
    });
  }

  // Show location details in a modal or panel
  function showLocationDetails(location) {
    const event = new CustomEvent('location-selected', { 
      detail: location 
    });
    window.dispatchEvent(event);
  }

  // Generate location-based quiz questions
  function generateLocationQuiz(count = 5) {
    const questions = [];
    const shuffled = [...locations].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const location = shuffled[i];
      const questionTypes = [
        'related_figures',
        'primary_role',
        'testament',
        'era',
        'modern_country'
      ];
      
      const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      let question = {
        location: location.location_name,
        type: qType,
        prompt: '',
        options: [],
        correct: ''
      };
      
      switch(qType) {
        case 'related_figures':
          question.prompt = `Which biblical figure is associated with ${location.location_name}?`;
          question.correct = location.related_figures[0];
          question.options = generateOptions(location.related_figures[0], 
            locations.flatMap(l => l.related_figures));
          break;
          
        case 'primary_role':
          question.prompt = `What was the primary role of ${location.location_name}?`;
          question.correct = location.primary_role;
          question.options = generateOptions(location.primary_role,
            locations.map(l => l.primary_role));
          break;
          
        case 'testament':
          question.prompt = `In which testament(s) is ${location.location_name} primarily featured?`;
          question.correct = location.testament_link;
          question.options = ['OT', 'NT', 'OT & NT'];
          break;
          
        case 'era':
          question.prompt = `During which era was ${location.location_name} significant?`;
          question.correct = location.era;
          question.options = generateOptions(location.era,
            locations.map(l => l.era));
          break;
          
        case 'modern_country':
          question.prompt = `In which modern country is ${location.location_name} located?`;
          question.correct = location.modern_country;
          question.options = generateOptions(location.modern_country,
            locations.map(l => l.modern_country));
          break;
      }
      
      questions.push(question);
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

  // Get unique values for filters
  function getEras() {
    return [...new Set(locations.map(l => l.era))];
  }

  function getRoles() {
    return [...new Set(locations.map(l => l.primary_role))];
  }

  function getTestaments() {
    return [...new Set(locations.map(l => l.testament_link))];
  }

  function getCountries() {
    return [...new Set(locations.map(l => l.modern_country))];
  }

  // Initialize the module
  async function init() {
    await loadLocations();
    return locations.length > 0;
  }

  // Public API
  return {
    init,
    loadLocations,
    filterLocations,
    sortLocations,
    initSimpleMap,
    addLocationMarkers,
    showLocationDetails,
    generateLocationQuiz,
    getEras,
    getRoles,
    getTestaments,
    getCountries,
    get locations() { return locations; }
  };
})();

// Make available globally
window.LocationModule = LocationModule;
