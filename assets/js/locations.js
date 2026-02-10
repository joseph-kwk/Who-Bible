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
    
    // Create SVG map with modern design
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1400 900');
    svg.setAttribute('id', 'biblical-map');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.minHeight = '600px';
    svg.style.background = 'linear-gradient(135deg, #1e3a5f 0%, #2c5f7c 50%, #1e3a5f 100%)';
    svg.style.cursor = 'grab';
    
    // Zoom and pan state
    let currentZoom = 1;
    let currentPan = { x: 0, y: 0 };
    let isDragging = false;
    let startPoint = { x: 0, y: 0 };
    
    // Create main content group for transform
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.setAttribute('id', 'map-content');
    
    // Add definitions for gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Modern ocean gradient with depth effect
    const oceanGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    oceanGradient.setAttribute('id', 'oceanGradient');
    oceanGradient.setAttribute('cx', '30%');
    oceanGradient.setAttribute('cy', '30%');
    oceanGradient.innerHTML = `
      <stop offset="0%" style="stop-color:#4a90b8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3d7a9c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2c5f7c;stop-opacity:1" />
    `;
    defs.appendChild(oceanGradient);
    
    // Enhanced land gradient with terrain feel
    const landGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    landGradient.setAttribute('id', 'landGradient');
    landGradient.setAttribute('x1', '0%');
    landGradient.setAttribute('y1', '0%');
    landGradient.setAttribute('x2', '0%');
    landGradient.setAttribute('y2', '100%');
    landGradient.innerHTML = `
      <stop offset="0%" style="stop-color:#e8dcc8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d4c5a0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b8a880;stop-opacity:1" />
    `;
    defs.appendChild(landGradient);
    
    // Glow effect for locations
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glow.setAttribute('id', 'glow');
    glow.innerHTML = `
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
    defs.appendChild(glow);
    
    // Shadow for 3D depth
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadow.setAttribute('id', 'shadow');
    shadow.innerHTML = `
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
    `;
    defs.appendChild(shadow);
    
    // Add pattern for sandy texture
    const sandPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    sandPattern.setAttribute('id', 'sandPattern');
    sandPattern.setAttribute('width', '30');
    sandPattern.setAttribute('height', '30');
    sandPattern.setAttribute('patternUnits', 'userSpaceOnUse');
    sandPattern.innerHTML = `
      <circle cx="5" cy="5" r="1.5" fill="#d4b896" opacity="0.4"/>
      <circle cx="18" cy="12" r="1" fill="#c9b088" opacity="0.3"/>
      <circle cx="25" cy="22" r="1.2" fill="#dcc5a0" opacity="0.35"/>
    `;
    defs.appendChild(sandPattern);
    
    svg.appendChild(defs);
    
    // Ocean background with texture
    const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ocean.setAttribute('x', '0');
    ocean.setAttribute('y', '0');
    ocean.setAttribute('width', '1400');
    ocean.setAttribute('height', '900');
    ocean.setAttribute('fill', 'url(#oceanGradient)');
    mainGroup.appendChild(ocean);
    
    // Add wave pattern for ocean texture
    for (let i = 0; i < 15; i++) {
      const wave = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const y = 50 + i * 60;
      wave.setAttribute('d', `M 0 ${y} Q 100 ${y-10}, 200 ${y} T 400 ${y} T 600 ${y} T 800 ${y} T 1000 ${y} T 1200 ${y} T 1400 ${y}`);
      wave.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      wave.setAttribute('stroke-width', '2');
      wave.setAttribute('fill', 'none');
      mainGroup.appendChild(wave);
    }
    
    // Main land mass with improved topology
    const mainLand = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mainLand.setAttribute('d', `
      M 150 100 
      L 200 80 Q 250 70, 300 90
      L 350 110 Q 400 130, 450 150
      L 500 170 Q 550 180, 600 170
      L 700 160 Q 800 155, 900 160
      L 1000 170 L 1100 180 L 1200 190
      L 1300 200 L 1400 210 L 1400 900
      L 0 900 L 0 300
      Q 50 250, 100 200
      L 150 150 Z
    `);
    mainLand.setAttribute('fill', 'url(#landGradient)');
    mainLand.setAttribute('stroke', '#9b8a6f');
    mainLand.setAttribute('stroke-width', '3');
    mainLand.setAttribute('filter', 'url(#shadow)');
    mainGroup.appendChild(mainLand);
    
    // Add desert sand texture overlay
    const desertRegion = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    desertRegion.setAttribute('x', '600');
    desertRegion.setAttribute('y', '250');
    desertRegion.setAttribute('width', '600');
    desertRegion.setAttribute('height', '400');
    desertRegion.setAttribute('fill', 'url(#sandPattern)');
    desertRegion.setAttribute('opacity', '0.3');
    mainGroup.appendChild(desertRegion);
    
    // Mediterranean coastline detail
    const coastDetail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    coastDetail.setAttribute('d', 'M 200 80 Q 220 100, 240 120 L 260 150 Q 270 180, 280 200 L 290 230');
    coastDetail.setAttribute('stroke', '#3d7a9c');
    coastDetail.setAttribute('stroke-width', '4');
    coastDetail.setAttribute('fill', 'none');
    coastDetail.setAttribute('opacity', '0.6');
    mainGroup.appendChild(coastDetail);
    
    // Add major cities/locations with enhanced markers
    const cities = [
      { name: 'Jerusalem', x: 350, y: 300, size: 'large', icon: '⭐' },
      { name: 'Bethlehem', x: 345, y: 310, size: 'medium', icon: '🌟' },
      { name: 'Nazareth', x: 365, y: 230, size: 'medium', icon: '🏠' },
      { name: 'Jericho', x: 358, y: 315, size: 'small', icon: '🏛️' },
      { name: 'Capernaum', x: 375, y: 245, size: 'small', icon: '🎣' },
      { name: 'Damascus', x: 420, y: 140, size: 'large', icon: '🏙️' },
      { name: 'Caesarea', x: 330, y: 260, size: 'medium', icon: '⚓' },
      { name: 'Beersheba', x: 335, y: 410, size: 'small', icon: '🌴' }
    ];
    
    cities.forEach(city => {
      const cityGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      cityGroup.setAttribute('class', 'city-marker');
      cityGroup.style.cursor = 'pointer';
      
      // City marker circle
      const markerSize = city.size === 'large' ? 10 : city.size === 'medium' ? 7 : 5;
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('cx', city.x);
      marker.setAttribute('cy', city.y);
      marker.setAttribute('r', markerSize);
      marker.setAttribute('fill', '#ff8a65');
      marker.setAttribute('stroke', 'white');
      marker.setAttribute('stroke-width', '2');
      marker.setAttribute('filter', 'url(#glow)');
      cityGroup.appendChild(marker);
      
      // Pulsing rings
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('cx', city.x);
      pulse.setAttribute('cy', city.y);
      pulse.setAttribute('r', markerSize + 3);
      pulse.setAttribute('fill', 'none');
      pulse.setAttribute('stroke', '#ff8a65');
      pulse.setAttribute('stroke-width', '2');
      pulse.setAttribute('opacity', '0.6');
      pulse.innerHTML = '<animate attributeName="r" from="' + (markerSize + 3) + '" to="' + (markerSize + 15) + '" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>';
      cityGroup.appendChild(pulse);
      
      // City icon
      const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      iconText.setAttribute('x', city.x);
      iconText.setAttribute('y', city.y - markerSize - 8);
      iconText.setAttribute('text-anchor', 'middle');
      iconText.setAttribute('font-size', '18');
      iconText.textContent = city.icon;
      cityGroup.appendChild(iconText);
      
      // City label with background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const textWidth = city.name.length * 6;
      labelBg.setAttribute('x', city.x - textWidth/2 - 6);
      labelBg.setAttribute('y', city.y + markerSize + 12);
      labelBg.setAttribute('width', textWidth + 12);
      labelBg.setAttribute('height', '20');
      labelBg.setAttribute('rx', '4');
      labelBg.setAttribute('fill', 'rgba(0,0,0,0.75)');
      cityGroup.appendChild(labelBg);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', city.x);
      label.setAttribute('y', city.y + markerSize + 26);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '12');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('fill', 'white');
      label.textContent = city.name;
      cityGroup.appendChild(label);
      
      mainGroup.appendChild(cityGroup);
    });
    
    // Dead Sea with realistic shape
    const deadSeaGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const deadSea = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    deadSea.setAttribute('cx', '360');
    deadSea.setAttribute('cy', '360');
    deadSea.setAttribute('rx', '20');
    deadSea.setAttribute('ry', '55');
    deadSea.setAttribute('fill', '#1e4d66');
    deadSea.setAttribute('stroke', '#4a90b8');
    deadSea.setAttribute('stroke-width', '2');
    deadSea.setAttribute('filter', 'url(#shadow)');
    deadSeaGroup.appendChild(deadSea);
    
    // Dead Sea label
    const deadSeaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    deadSeaLabel.setAttribute('x', '395');
    deadSeaLabel.setAttribute('y', '365');
    deadSeaLabel.setAttribute('fill', 'white');
    deadSeaLabel.setAttribute('font-size', '12');
    deadSeaLabel.setAttribute('font-weight', 'bold');
    deadSeaLabel.setAttribute('text-anchor', 'start');
    deadSeaLabel.textContent = 'Dead Sea';
    deadSeaGroup.appendChild(deadSeaLabel);
    mainGroup.appendChild(deadSeaGroup);
    
    // Sea of Galilee
    const galileeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const galileeSea = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    galileeSea.setAttribute('cx', '370');
    galileeSea.setAttribute('cy', '250');
    galileeSea.setAttribute('rx', '18');
    galileeSea.setAttribute('ry', '24');
    galileeSea.setAttribute('fill', '#4a90b8');
    galileeSea.setAttribute('stroke', '#3d7a9c');
    galileeSea.setAttribute('stroke-width', '2');
    galileeSea.setAttribute('filter', 'url(#shadow)');
    galileeGroup.appendChild(galileeSea);
    
    const galileeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    galileeLabel.setAttribute('x', '395');
    galileeLabel.setAttribute('y', '255');
    galileeLabel.setAttribute('fill', 'white');
    galileeLabel.setAttribute('font-size', '12');
    galileeLabel.setAttribute('font-weight', 'bold');
    galileeLabel.setAttribute('text-anchor', 'start');
    galileeLabel.textContent = 'Sea of Galilee';
    galileeGroup.appendChild(galileeLabel);
    mainGroup.appendChild(galileeGroup);
    
    // Jordan River with flowing effect
    const jordanRiver = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    jordanRiver.setAttribute('d', 'M 370 274 Q 375 290, 372 310 Q 368 330, 365 350');
    jordanRiver.setAttribute('stroke', '#5aa9d6');
    jordanRiver.setAttribute('stroke-width', '4');
    jordanRiver.setAttribute('fill', 'none');
    jordanRiver.setAttribute('stroke-linecap', 'round');
    jordanRiver.setAttribute('opacity', '0.8');
    jordanRiver.setAttribute('filter', 'url(#glow)');
    
    // Add river label
    const riverLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    riverLabel.setAttribute('x', '345');
    riverLabel.setAttribute('y', '310');
    riverLabel.setAttribute('fill', 'white');
    riverLabel.setAttribute('font-size', '11');
    riverLabel.setAttribute('font-style', 'italic');
    riverLabel.setAttribute('transform', 'rotate(-10, 345, 310)');
    riverLabel.textContent = 'Jordan River';
    mainGroup.appendChild(jordanRiver);
    mainGroup.appendChild(riverLabel);
    
    // Mountain ranges with shading
    const mountainsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mountainsGroup.setAttribute('opacity', '0.25');
    
    for (let i = 0; i < 8; i++) {
      const mountain = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const x = 450 + i * 80;
      const y = 300 + Math.sin(i) * 50;
      mountain.setAttribute('d', `M ${x} ${y} L ${x-15} ${y+30} L ${x+15} ${y+30} Z`);
      mountain.setAttribute('fill', '#8b7a5f');
      mountain.setAttribute('stroke', '#6b5a4f');
      mountain.setAttribute('stroke-width', '1');
      mountainsGroup.appendChild(mountain);
    }
    mainGroup.appendChild(mountainsGroup);
    
    // Add modern compass rose
    const compass = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    compass.setAttribute('transform', 'translate(1300, 80)');
    compass.innerHTML = `
      <circle cx="0" cy="0" r="50" fill="rgba(255,255,255,0.95)" stroke="var(--accent)" stroke-width="3" filter="url(#shadow)"/>
      <path d="M 0 -40 L -8 -5 L 0 -25 L 8 -5 Z" fill="#e63946" stroke="#333" stroke-width="1.5"/>
      <path d="M 0 40 L -8 5 L 0 25 L 8 5 Z" fill="#f1faee" stroke="#333" stroke-width="1.5"/>
      <path d="M -40 0 L -5 -8 L -25 0 L -5 8 Z" fill="#f1faee" stroke="#333" stroke-width="1.5"/>
      <path d="M 40 0 L 5 -8 L 25 0 L 5 8 Z" fill="#f1faee" stroke="#333" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="6" fill="var(--accent)" stroke="white" stroke-width="2"/>
      <text x="0" y="-55" text-anchor="middle" font-size="20" font-weight="bold" fill="white" filter="url(#shadow)">N</text>
      <text x="0" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="white">S</text>
      <text x="-58" y="5" text-anchor="middle" font-size="14" font-weight="bold" fill="white">W</text>
      <text x="58" y="5" text-anchor="middle" font-size="14" font-weight="bold" fill="white">E</text>
    `;
    // Compass is fixed, not in mainGroup
    svg.appendChild(compass);
    
    // Add decorative title
    const titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const titleBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    titleBg.setAttribute('x', '20');
    titleBg.setAttribute('y', '20');
    titleBg.setAttribute('width', '350');
    titleBg.setAttribute('height', '80');
    titleBg.setAttribute('rx', '12');
    titleBg.setAttribute('fill', 'rgba(255,255,255,0.95)');
    titleBg.setAttribute('filter', 'url(#shadow)');
    titleGroup.appendChild(titleBg);
    
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '195');
    titleText.setAttribute('y', '55');
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('font-size', '24');
    titleText.setAttribute('font-weight', 'bold');
    titleText.setAttribute('fill', 'var(--accent)');
    titleText.textContent = '🗺️ Biblical Lands';
    titleGroup.appendChild(titleText);
    
    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', '195');
    subtitle.setAttribute('y', '80');
    subtitle.setAttribute('text-anchor', 'middle');
    subtitle.setAttribute('font-size', '14');
    subtitle.setAttribute('fill', '#666');
    subtitle.textContent = 'Ancient Middle East Region';
    titleGroup.appendChild(subtitle);
    // Title is fixed, not in mainGroup
    svg.appendChild(titleGroup);
    
    // Create groups for dynamic content
    const journeyPaths = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    journeyPaths.setAttribute('id', 'journey-paths');
    mainGroup.appendChild(journeyPaths);
    
    const locationMarkers = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    locationMarkers.setAttribute('id', 'location-markers');
    mainGroup.appendChild(locationMarkers);
    
    // Add mainGroup to SVG
    svg.appendChild(mainGroup);
    
    // Add zoom controls UI
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
    `;
    
    const createButton = (text, title) => {
      const btn = document.createElement('button');
      btn.innerHTML = text;
      btn.title = title;
      btn.style.cssText = `
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid var(--accent);
        color: var(--accent);
        font-size: 22px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      `;
      btn.onmouseenter = () => {
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.transform = 'scale(1.1)';
      };
      btn.onmouseleave = () => {
        btn.style.background = 'rgba(255, 255, 255, 0.95)';
        btn.style.color = 'var(--accent)';
        btn.style.transform = 'scale(1)';
      };
      return btn;
    };
    
    const zoomInBtn = createButton('+', 'Zoom In');
    const zoomOutBtn = createButton('−', 'Zoom Out');
    const resetBtn = createButton('⟲', 'Reset View');
    
    controlsDiv.appendChild(zoomInBtn);
    controlsDiv.appendChild(zoomOutBtn);
    controlsDiv.appendChild(resetBtn);
    container.appendChild(controlsDiv);
    
    // Zoom and pan functions
    const updateTransform = () => {
      mainGroup.setAttribute('transform', `translate(${currentPan.x}, ${currentPan.y}) scale(${currentZoom})`);
    };
    
    const zoom = (factor) => {
      const newZoom = Math.max(0.5, Math.min(3, currentZoom * factor));
      currentZoom = newZoom;
      updateTransform();
    };
    
    const resetView = () => {
      currentZoom = 1;
      currentPan = { x: 0, y: 0 };
      updateTransform();
    };
    
    // Event listeners for controls
    zoomInBtn.addEventListener('click', () => zoom(1.2));
    zoomOutBtn.addEventListener('click', () => zoom(0.8));
    resetBtn.addEventListener('click', resetView);
    
    // Mouse wheel zoom
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom(factor);
    });
    
    // Pan with mouse drag
    svg.addEventListener('mousedown', (e) => {
      if (e.target === svg || e.target.closest('#map-content')) {
        isDragging = true;
        startPoint = { x: e.clientX - currentPan.x, y: e.clientY - currentPan.y };
        svg.style.cursor = 'grabbing';
      }
    });
    
    svg.addEventListener('mousemove', (e) => {
      if (isDragging) {
        currentPan.x = e.clientX - startPoint.x;
        currentPan.y = e.clientY - startPoint.y;
        updateTransform();
      }
    });
    
    svg.addEventListener('mouseup', () => {
      isDragging = false;
      svg.style.cursor = 'grab';
    });
    
    svg.addEventListener('mouseleave', () => {
      isDragging = false;
      svg.style.cursor = 'grab';
    });
    
    // Touch support for mobile
    let touchStartDist = 0;
    let touchStartPan = { x: 0, y: 0 };
    
    svg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchStartDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      } else if (e.touches.length === 1) {
        // Pan start
        isDragging = true;
        const touch = e.touches[0];
        startPoint = { x: touch.clientX - currentPan.x, y: touch.clientY - currentPan.y };
      }
    });
    
    svg.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 2 && touchStartDist > 0) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const factor = dist / touchStartDist;
        zoom(factor);
        touchStartDist = dist;
      } else if (e.touches.length === 1 && isDragging) {
        // Pan
        const touch = e.touches[0];
        currentPan.x = touch.clientX - startPoint.x;
        currentPan.y = touch.clientY - startPoint.y;
        updateTransform();
      }
    });
    
    svg.addEventListener('touchend', () => {
      isDragging = false;
      touchStartDist = 0;
    });
    
    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      display: none;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      pointer-events: none;
      z-index: 1000;
      max-width: 250px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    tooltip.innerHTML = '<div id="tooltip-title" style="font-weight: bold; margin-bottom: 4px;"></div><div id="tooltip-desc" style="font-size: 12px; opacity: 0.9;"></div>';
    container.appendChild(tooltip);
    
    container.appendChild(svg);
    return svg;
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
