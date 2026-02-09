/**
 * Chart Components for Analytics Dashboard
 * Lightweight charting using Canvas API (no external dependencies)
 */

/**
 * Create a line chart
 */
export function createLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const {
        color = '#569CD6',
        fillColor = 'rgba(86, 156, 214, 0.1)',
        gridColor = 'rgba(255, 255, 255, 0.1)',
        textColor = '#ccc',
        showGrid = true,
        showLabels = true,
        smooth = true,
        maxPoints = 30
    } = options;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
        drawEmptyState(ctx, width, height, textColor);
        return;
    }

    // Sample data if too many points
    const displayData = data.length > maxPoints 
        ? sampleData(data, maxPoints) 
        : data;

    // Calculate scales
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const values = displayData.map(d => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    if (showGrid) {
        drawGrid(ctx, padding, chartWidth, chartHeight, gridColor);
    }

    // Calculate points
    const points = displayData.map((d, i) => ({
        x: padding + (i / (displayData.length - 1 || 1)) * chartWidth,
        y: padding + chartHeight - ((d.value - minValue) / valueRange) * chartHeight,
        label: d.label,
        value: d.value
    }));

    // Draw filled area
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - padding);
        ctx.closePath();
        ctx.fill();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    if (smooth && points.length > 2) {
        drawSmoothLine(ctx, points);
    } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    }

    // Draw points
    points.forEach(p => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw labels
    if (showLabels) {
        ctx.fillStyle = textColor;
        ctx.font = '11px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels (sample every few points for readability)
        const labelStep = Math.ceil(displayData.length / 6);
        displayData.forEach((d, i) => {
            if (i % labelStep === 0 || i === displayData.length - 1) {
                ctx.fillText(d.label, points[i].x, height - padding + 20);
            }
        });

        // Y-axis labels
        ctx.textAlign = 'right';
        const ySteps = 4;
        for (let i = 0; i <= ySteps; i++) {
            const value = minValue + (valueRange / ySteps) * i;
            const y = height - padding - (i / ySteps) * chartHeight;
            ctx.fillText(value.toFixed(0), padding - 10, y + 4);
        }
    }
}

/**
 * Create a bar chart
 */
export function createBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const {
        color = '#569CD6',
        hoverColor = '#6AACD8',
        textColor = '#ccc',
        showValues = true
    } = options;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
        drawEmptyState(ctx, width, height, textColor);
        return;
    }

    const padding = 40;
    const chartHeight = height - padding * 2;
    const barWidth = (width - padding * 2) / data.length * 0.8;
    const barSpacing = (width - padding * 2) / data.length * 0.2;

    const maxValue = Math.max(...data.map(d => d.value), 1);

    data.forEach((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
        const y = height - padding - barHeight;

        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw label
        ctx.fillStyle = textColor;
        ctx.font = '11px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, height - padding + 20);

        // Draw value
        if (showValues) {
            ctx.fillText(d.value.toFixed(0), x + barWidth / 2, y - 5);
        }
    });
}

/**
 * Create a pie/donut chart
 */
export function createPieChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const {
        colors = ['#569CD6', '#4EC9B0', '#CE9178', '#C586C0', '#DCDCAA'],
        donut = true,
        donutSize = 0.6,
        showLabels = true,
        showLegend = true,
        textColor = '#ccc'
    } = options;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
        drawEmptyState(ctx, width, height, textColor);
        return;
    }

    const centerX = showLegend ? width * 0.4 : width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((d, i) => {
        const sliceAngle = (d.value / total) * Math.PI * 2;
        const color = colors[i % colors.length];

        // Draw slice
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fill();

        // Draw label on slice
        if (showLabels && d.value / total > 0.05) {
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${(d.value / total * 100).toFixed(0)}%`, labelX, labelY);
        }

        currentAngle += sliceAngle;
    });

    // Draw donut hole
    if (donut) {
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--card-bg') || '#1e1e1e';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * donutSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw legend
    if (showLegend) {
        const legendX = width * 0.65;
        let legendY = 40;
        const legendItemHeight = 25;

        ctx.font = '12px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        data.forEach((d, i) => {
            const color = colors[i % colors.length];
            
            // Color box
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY, 15, 15);

            // Label
            ctx.fillStyle = textColor;
            const percentage = ((d.value / total) * 100).toFixed(1);
            ctx.fillText(`${d.label} (${percentage}%)`, legendX + 20, legendY + 7);

            legendY += legendItemHeight;
        });
    }
}

/**
 * Create a progress ring (circular progress)
 */
export function createProgressRing(canvasId, value, max, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const {
        color = '#569CD6',
        backgroundColor = 'rgba(255, 255, 255, 0.1)',
        lineWidth = 10,
        showValue = true,
        textColor = '#ccc',
        label = ''
    } = options;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - lineWidth;

    const percentage = Math.min((value / max) * 100, 100);
    const angle = (percentage / 100) * Math.PI * 2;

    // Draw background circle
    ctx.strokeStyle = backgroundColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw progress arc
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.stroke();

    // Draw value
    if (showValue) {
        ctx.fillStyle = textColor;
        ctx.font = 'bold 24px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage.toFixed(0)}%`, centerX, centerY - 5);

        if (label) {
            ctx.font = '12px -apple-system, system-ui, sans-serif';
            ctx.fillText(label, centerX, centerY + 20);
        }
    }
}

/**
 * Create a heat map calendar (contribution-style)
 */
export function createHeatMap(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const {
        lowColor = 'rgba(86, 156, 214, 0.2)',
        highColor = '#569CD6',
        cellSize = 12,
        cellGap = 3,
        textColor = '#ccc'
    } = options;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const weeks = Math.ceil(data.length / 7);

    data.forEach((d, i) => {
        const week = Math.floor(i / 7);
        const day = i % 7;
        const x = week * (cellSize + cellGap);
        const y = day * (cellSize + cellGap);

        const intensity = d.value / maxValue;
        ctx.fillStyle = blendColors(lowColor, highColor, intensity);
        ctx.fillRect(x, y, cellSize, cellSize);
    });
}

// Helper functions

function drawGrid(ctx, padding, chartWidth, chartHeight, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= 6; i++) {
        const x = padding + (chartWidth / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
    }
}

function drawSmoothLine(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
}

function drawEmptyState(ctx, width, height, textColor) {
    ctx.fillStyle = textColor;
    ctx.font = '14px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data available', width / 2, height / 2);
}

function sampleData(data, maxPoints) {
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0);
}

function blendColors(color1, color2, ratio) {
    // Simple color blending for heat map
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
}
