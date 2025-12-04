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

  // Initialize modern realistic SVG map
  function initSimpleMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create SVG map of Middle East region
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1400 900');
    svg.setAttribute('class', 'location-map');
    svg.style.width = '100%';
    svg.style.height = '700px';
    svg.style.minHeight = '600px';
    svg.style.borderRadius = '12px';
    svg.style.overflow = 'hidden';
    svg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    
    // Add clipping path to prevent overflow
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'mapClip');
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', '0');
    clipRect.setAttribute('y', '0');
    clipRect.setAttribute('width', '1400');
    clipRect.setAttribute('height', '900');
    clipPath.appendChild(clipRect);
    
    // Add definitions for gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Add clipPath to defs
    defs.appendChild(clipPath);
    
    // Ocean gradient
    const oceanGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    oceanGradient.setAttribute('id', 'oceanGradient');
    oceanGradient.setAttribute('x1', '0%');
    oceanGradient.setAttribute('y1', '0%');
    oceanGradient.setAttribute('x2', '0%');
    oceanGradient.setAttribute('y2', '100%');
    oceanGradient.innerHTML = `
      <stop offset="0%" style="stop-color:#2c5f7c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4a90b8;stop-opacity:1" />
    `;
    defs.appendChild(oceanGradient);
    
    // Land gradient
    const landGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    landGradient.setAttribute('id', 'landGradient');
    landGradient.setAttribute('cx', '50%');
    landGradient.setAttribute('cy', '50%');
    landGradient.innerHTML = `
      <stop offset="0%" style="stop-color:#d4c5a0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b8a880;stop-opacity:1" />
    `;
    defs.appendChild(landGradient);
    
    // Desert pattern
    const desertPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    desertPattern.setAttribute('id', 'desertPattern');
    desertPattern.setAttribute('patternUnits', 'userSpaceOnUse');
    desertPattern.setAttribute('width', '20');
    desertPattern.setAttribute('height', '20');
    desertPattern.innerHTML = `
      <circle cx="2" cy="2" r="1" fill="#c9b896" opacity="0.3"/>
      <circle cx="12" cy="12" r="1" fill="#c9b896" opacity="0.3"/>
    `;
    defs.appendChild(desertPattern);
    
    // Shadow filter for elevation
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadow.setAttribute('id', 'landShadow');
    shadow.innerHTML = `
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
    defs.appendChild(shadow);
    
    svg.appendChild(defs);
    
    // Add ocean background
    const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ocean.setAttribute('x', '0');
    ocean.setAttribute('y', '0');
    ocean.setAttribute('width', '1400');
    ocean.setAttribute('height', '900');
    ocean.setAttribute('fill', 'url(#oceanGradient)');
    svg.appendChild(ocean);
    
    // Draw realistic coastline and land masses
    // Mediterranean Sea (western area)
    const mediterranean = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mediterranean.setAttribute('d', 'M 0 0 L 0 400 Q 50 380, 100 360 Q 150 340, 180 300 L 200 250 Q 220 200, 200 150 Q 180 100, 150 80 L 100 50 L 0 0 Z');
    mediterranean.setAttribute('fill', '#3d7a9c');
    mediterranean.setAttribute('opacity', '0.9');
    svg.appendChild(mediterranean);
    
    // Main land mass (Middle East)
    const mainLand = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Realistic coastline following the eastern Mediterranean, Dead Sea region, and Persian Gulf area
    mainLand.setAttribute('d', `
      M 200 80 
      L 220 100 Q 240 120, 260 150 
      L 280 200 Q 290 240, 300 280
      L 320 340 Q 330 380, 340 420
      L 360 480 Q 370 520, 380 550
      L 400 580 L 450 600 L 550 620
      L 650 630 Q 750 640, 850 640
      L 950 630 L 1000 620 L 1000 0
      L 200 0 Z
    `);
    mainLand.setAttribute('fill', 'url(#landGradient)');
    mainLand.setAttribute('stroke', '#9b8a6f');
    mainLand.setAttribute('stroke-width', '2');
    mainLand.setAttribute('filter', 'url(#landShadow)');
    svg.appendChild(mainLand);
    
    // Add desert pattern overlay
    const desertOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    desertOverlay.setAttribute('x', '500');
    desertOverlay.setAttribute('y', '200');
    desertOverlay.setAttribute('width', '500');
    desertOverlay.setAttribute('height', '400');
    desertOverlay.setAttribute('fill', 'url(#desertPattern)');
    desertOverlay.setAttribute('opacity', '0.4');
    svg.appendChild(desertOverlay);
    
    // Dead Sea
    const deadSea = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    deadSea.setAttribute('cx', '360');
    deadSea.setAttribute('cy', '340');
    deadSea.setAttribute('rx', '15');
    deadSea.setAttribute('ry', '45');
    deadSea.setAttribute('fill', '#2c5f7c');
    deadSea.setAttribute('stroke', '#1e4d66');
    deadSea.setAttribute('stroke-width', '1');
    deadSea.setAttribute('opacity', '0.9');
    svg.appendChild(deadSea);
    
    // Sea of Galilee
    const galileeSea = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    galileeSea.setAttribute('cx', '360');
    galileeSea.setAttribute('cy', '240');
    galileeSea.setAttribute('rx', '12');
    galileeSea.setAttribute('ry', '18');
    galileeSea.setAttribute('fill', '#4a90b8');
    galileeSea.setAttribute('stroke', '#3d7a9c');
    galileeSea.setAttribute('stroke-width', '1');
    galileeSea.setAttribute('opacity', '0.9');
    svg.appendChild(galileeSea);
    
    // Jordan River (connecting Galilee to Dead Sea)
    const jordanRiver = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    jordanRiver.setAttribute('d', 'M 360 258 Q 365 280, 362 300 Q 358 320, 360 340');
    jordanRiver.setAttribute('stroke', '#5aa9d6');
    jordanRiver.setAttribute('stroke-width', '3');
    jordanRiver.setAttribute('fill', 'none');
    jordanRiver.setAttribute('opacity', '0.7');
    svg.appendChild(jordanRiver);
    
    // Mountain ranges (subtle shading)
    const mountains1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mountains1.setAttribute('d', 'M 250 150 Q 300 140, 350 160 Q 400 180, 450 170 Q 500 160, 550 180');
    mountains1.setAttribute('stroke', '#9b8a6f');
    mountains1.setAttribute('stroke-width', '8');
    mountains1.setAttribute('fill', 'none');
    mountains1.setAttribute('opacity', '0.3');
    svg.appendChild(mountains1);
    
    const mountains2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mountains2.setAttribute('d', 'M 300 400 Q 350 390, 400 410 Q 450 430, 500 420');
    mountains2.setAttribute('stroke', '#9b8a6f');
    mountains2.setAttribute('stroke-width', '8');
    mountains2.setAttribute('fill', 'none');
    mountains2.setAttribute('opacity', '0.3');
    svg.appendChild(mountains2);
    
    // Add subtle coordinate grid
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('opacity', '0.15');
    
    for (let i = 140; i < 1400; i += 140) {
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', i);
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', i);
      vLine.setAttribute('y2', '900');
      vLine.setAttribute('stroke', '#000');
      vLine.setAttribute('stroke-width', '0.5');
      gridGroup.appendChild(vLine);
    }
    
    for (let i = 140; i < 900; i += 140) {
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', i);
      hLine.setAttribute('x2', '1400');
      hLine.setAttribute('y2', i);
      hLine.setAttribute('stroke', '#000');
      hLine.setAttribute('stroke-width', '0.5');
      gridGroup.appendChild(hLine);
    }
    
    svg.appendChild(gridGroup);
    
    // Add compass rose
    const compass = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    compass.setAttribute('transform', 'translate(1260, 70)');
    compass.innerHTML = `
      <circle cx="0" cy="0" r="42" fill="rgba(255,255,255,0.9)" stroke="#333" stroke-width="2"/>
      <path d="M 0 -35 L -7 0 L 0 -21 L 7 0 Z" fill="#c44" stroke="#333" stroke-width="1"/>
      <path d="M 0 35 L -7 0 L 0 21 L 7 0 Z" fill="#fff" stroke="#333" stroke-width="1"/>
      <text x="0" y="-45" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">N</text>
    `;
    svg.appendChild(compass);
    
    // Add scale bar
    const scale = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    scale.setAttribute('transform', 'translate(70, 820)');
    scale.innerHTML = `
      <line x1="0" y1="0" x2="140" y2="0" stroke="#333" stroke-width="3"/>
      <line x1="0" y1="-7" x2="0" y2="7" stroke="#333" stroke-width="3"/>
      <line x1="140" y1="-7" x2="140" y2="7" stroke="#333" stroke-width="3"/>
      <text x="70" y="-14" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">200 km</text>
    `;
    svg.appendChild(scale);
    
    container.appendChild(svg);
    map = { svg, container, markers: [] };
    return map;
  }

  // Convert lat/lon to SVG coordinates with accurate projection
  function latLonToSVG(lat, lon) {
    // Expanded bounding box to include Europe (Rome, Corinth) to Middle East
    // Lat: 25-42°N (covers from Arabia to Italy)
    // Lon: 10-50°E (covers from Rome to Persia)
    const minLat = 25, maxLat = 43;
    const minLon = 10, maxLon = 50;
    const svgWidth = 1200, svgHeight = 820;
    const offsetX = 100;
    const offsetY = 30;
    
    // Clamp coordinates to prevent locations from going outside map
    const clampedLat = Math.max(minLat, Math.min(maxLat, lat));
    const clampedLon = Math.max(minLon, Math.min(maxLon, lon));
    
    // Mercator-like projection for better accuracy
    const x = offsetX + ((clampedLon - minLon) / (maxLon - minLon)) * svgWidth;
    const y = offsetY + ((maxLat - clampedLat) / (maxLat - minLat)) * svgHeight;
    
    return { x, y };
  }

  // Add modern location markers to map
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
      group.style.transition = 'all 0.3s ease';
      
      // Pin shadow (for depth)
      const pinShadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      pinShadow.setAttribute('cx', x);
      pinShadow.setAttribute('cy', y + 28);
      pinShadow.setAttribute('rx', '9');
      pinShadow.setAttribute('ry', '3');
      pinShadow.setAttribute('fill', '#000');
      pinShadow.setAttribute('opacity', '0.3');
      group.appendChild(pinShadow);
      
      // Modern pin shape (larger)
      const pin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Pin body (teardrop shape) - bigger size
      const pinBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pinSize = 12 + (location.importance * 2);
      pinBody.setAttribute('d', `M ${x} ${y} 
        Q ${x - pinSize/2} ${y - pinSize/3}, ${x - pinSize/2} ${y - pinSize}
        A ${pinSize/2} ${pinSize/2} 0 1 1 ${x + pinSize/2} ${y - pinSize}
        Q ${x + pinSize/2} ${y - pinSize/3}, ${x} ${y} Z`);
      
      // Color based on testament
      let pinColor = '#e74c3c'; // Red for OT
      if (location.testament_link === 'NT') pinColor = '#3498db'; // Blue for NT
      if (location.testament_link === 'OT & NT') pinColor = '#9b59b6'; // Purple for both
      
      pinBody.setAttribute('fill', pinColor);
      pinBody.setAttribute('stroke', '#fff');
      pinBody.setAttribute('stroke-width', '3');
      pinBody.setAttribute('filter', 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))');
      pin.appendChild(pinBody);
      
      // Inner circle (for better visibility)
      const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerCircle.setAttribute('cx', x);
      innerCircle.setAttribute('cy', y - pinSize * 0.7);
      innerCircle.setAttribute('r', pinSize * 0.3);
      innerCircle.setAttribute('fill', '#fff');
      innerCircle.setAttribute('opacity', '0.95');
      pin.appendChild(innerCircle);
      
      group.appendChild(pin);
      
      // Label with background - LARGER TEXT
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', x);
      labelText.setAttribute('y', y - pinSize - 12);
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('font-size', '18');
      labelText.setAttribute('font-weight', 'bold');
      labelText.setAttribute('fill', '#2c3e50');
      labelText.textContent = location.location_name;
      
      // Calculate text bounds for background
      group.appendChild(labelText);
      const bbox = labelText.getBBox();
      
      labelBg.setAttribute('x', bbox.x - 6);
      labelBg.setAttribute('y', bbox.y - 3);
      labelBg.setAttribute('width', bbox.width + 12);
      labelBg.setAttribute('height', bbox.height + 6);
      labelBg.setAttribute('rx', '6');
      labelBg.setAttribute('fill', 'rgba(255, 255, 255, 0.95)');
      labelBg.setAttribute('stroke', pinColor);
      labelBg.setAttribute('stroke-width', '2');
      
      // Insert background before text
      group.insertBefore(labelBg, labelText);
      
      // Importance indicator (star for importance >= 9)
      if (location.importance >= 9) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x + bbox.width/2 + 8);
        star.setAttribute('y', y - pinSize - 12);
        star.setAttribute('font-size', '20');
        star.textContent = '⭐';
        group.appendChild(star);
      }
      
      // Create tooltip (hidden by default)
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tooltip.setAttribute('class', 'location-tooltip');
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.transition = 'opacity 0.2s ease';
      
      // Tooltip background
      const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tooltipBg.setAttribute('x', x + 30);
      tooltipBg.setAttribute('y', y - 80);
      tooltipBg.setAttribute('width', '220');
      tooltipBg.setAttribute('height', '75');
      tooltipBg.setAttribute('rx', '8');
      tooltipBg.setAttribute('fill', 'rgba(44, 62, 80, 0.95)');
      tooltipBg.setAttribute('stroke', pinColor);
      tooltipBg.setAttribute('stroke-width', '2');
      tooltip.appendChild(tooltipBg);
      
      // Tooltip content
      const tooltipTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tooltipTitle.setAttribute('x', x + 40);
      tooltipTitle.setAttribute('y', y - 58);
      tooltipTitle.setAttribute('font-size', '16');
      tooltipTitle.setAttribute('font-weight', 'bold');
      tooltipTitle.setAttribute('fill', '#fff');
      tooltipTitle.textContent = location.location_name;
      tooltip.appendChild(tooltipTitle);
      
      const tooltipEra = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tooltipEra.setAttribute('x', x + 40);
      tooltipEra.setAttribute('y', y - 38);
      tooltipEra.setAttribute('font-size', '13');
      tooltipEra.setAttribute('fill', '#ecf0f1');
      tooltipEra.textContent = `Era: ${location.era || 'Ancient'}`;
      tooltip.appendChild(tooltipEra);
      
      const tooltipImportance = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tooltipImportance.setAttribute('x', x + 40);
      tooltipImportance.setAttribute('y', y - 20);
      tooltipImportance.setAttribute('font-size', '13');
      tooltipImportance.setAttribute('fill', '#ecf0f1');
      tooltipImportance.textContent = `Importance: ${location.importance}/10`;
      tooltip.appendChild(tooltipImportance);
      
      group.appendChild(tooltip);
      
      // Add hover effects with tooltip
      group.addEventListener('mouseenter', () => {
        pin.style.transform = 'scale(1.4)';
        pin.style.transformOrigin = `${x}px ${y}px`;
        labelBg.setAttribute('fill', 'rgba(255, 255, 255, 1)');
        labelBg.setAttribute('stroke-width', '3');
        labelText.setAttribute('font-size', '20');
        pinShadow.setAttribute('rx', '12');
        pinShadow.setAttribute('opacity', '0.5');
        tooltip.style.opacity = '1';
      });
      
      group.addEventListener('mouseleave', () => {
        pin.style.transform = 'scale(1)';
        labelBg.setAttribute('fill', 'rgba(255, 255, 255, 0.95)');
        labelBg.setAttribute('stroke-width', '2');
        labelText.setAttribute('font-size', '18');
        pinShadow.setAttribute('rx', '9');
        pinShadow.setAttribute('opacity', '0.3');
        tooltip.style.opacity = '0';
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
