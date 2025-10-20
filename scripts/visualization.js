// Enhanced visualization with solid colors and consistent ordering
let orderColorMap = new Map();

function displayPatterns(patterns, machineSettings) {
    console.log('🎨 Displaying patterns with solid colors:', patterns);

    const container = document.getElementById('patternsContainer');

    if (!container) {
        console.error('Patterns container not found!');
        return;
    }

    if (!patterns || patterns.length === 0) {
        container.innerHTML = '<p class="no-patterns-message">No patterns generated.</p>';
        updateSummary(0, 0, 0);
        return;
    }

    // Reset color map for new optimization
    orderColorMap.clear();

    container.innerHTML = '';
    let totalWaste = 0;
    let totalUsed = 0;
    let totalReels = 0;

    patterns.forEach((patternObj, index) => {
        const patternElement = createEnhancedPatternElement(patternObj, index, machineSettings);
        container.appendChild(patternElement);

        totalWaste += patternObj.waste * patternObj.usage;
        totalUsed += (machineSettings.maxJumboWidth - patternObj.waste) * patternObj.usage;
        totalReels += patternObj.usage;
    });

    // Add color legend
    addColorLegend();

    updateSummary(totalReels, totalWaste, totalUsed);
}

function createEnhancedPatternElement(patternObj, index, machineSettings) {
    const patternDiv = document.createElement('div');
    patternDiv.className = 'pattern-visualization';

    const jumboWidth = machineSettings.maxJumboWidth;

    // Pattern information panel
    const patternInfo = `
        <div class="pattern-info">
            <div class="pattern-header">Pattern ${index + 1}</div>
            <div class="pattern-details">
                Usage: ${patternObj.usage} time${patternObj.usage > 1 ? 's' : ''}<br>
                Efficiency: ${patternObj.efficiency}%<br>
                Waste: ${patternObj.waste}mm<br>
                Sections: ${patternObj.pattern.length}
            </div>
        </div>
    `;

    // Create visual sections with solid colors
    const sectionsHTML = patternObj.pattern.map((width, sectionIndex) => {
        const percentage = (width / jumboWidth) * 100;
        const colorClass = getColorForWidth(width);

        return `
            <div class="section-visual ${colorClass}" 
                 style="width: ${percentage}%;"
                 title="Order: ${width}mm">
                ${width}
            </div>
        `;
    }).join('');

    // Waste section
    const wastePercentage = (patternObj.waste / jumboWidth) * 100;
    const wasteHTML = patternObj.waste > 0 ? `
        <div class="waste-visual" style="width: ${wastePercentage}%;" 
             title="Waste: ${patternObj.waste}mm">
            ${patternObj.waste}
        </div>
    ` : '';

    patternDiv.innerHTML = `
        ${patternInfo}
        <div class="pattern-graphic">
            <div class="jumbo-reel-visual">
                ${sectionsHTML}
                ${wasteHTML}
            </div>
            <div class="pattern-stats">
                Total Width: ${patternObj.pattern.reduce((a, b) => a + b, 0)}mm | 
                Jumbo: ${jumboWidth}mm
            </div>
        </div>
    `;

    return patternDiv;
}

function getColorForWidth(width) {
    if (!orderColorMap.has(width)) {
        // Assign a consistent solid blue shade based on width
        const blueShades = [
            'section-blue-1', 'section-blue-2', 'section-blue-3', 'section-blue-4', 'section-blue-5',
            'section-blue-6', 'section-blue-7', 'section-blue-8', 'section-blue-9', 'section-blue-10',
            'section-blue-11', 'section-blue-12', 'section-blue-13', 'section-blue-14', 'section-blue-15'
        ];

        // Use width to determine color index (consistent for same width)
        const colorIndex = Math.abs(width.toString().hashCode() % blueShades.length);
        orderColorMap.set(width, blueShades[colorIndex]);
    }

    return orderColorMap.get(width);
}

// Simple hash function for consistent color assignment
String.prototype.hashCode = function () {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
};

function addColorLegend() {
    if (orderColorMap.size === 0) return;

    const container = document.getElementById('patternsContainer');
    const legend = document.createElement('div');
    legend.className = 'order-legend';
    legend.innerHTML = '<strong>Order Colors:</strong>';

    // Get unique widths and sort them
    const uniqueWidths = Array.from(orderColorMap.keys()).sort((a, b) => a - b);

    uniqueWidths.forEach(width => {
        const colorClass = orderColorMap.get(width);
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color ${colorClass}"></div>
            <span>${width}mm</span>
        `;
        legend.appendChild(legendItem);
    });

    container.appendChild(legend);
}

function calculatePatternEfficiency(pattern, jumboWidth) {
    const usedWidth = jumboWidth - pattern.waste;
    return ((usedWidth / jumboWidth) * 100).toFixed(1);
}

function updateSummary(totalReels, totalWaste, totalUsed) {
    const totalReelsElement = document.getElementById('totalReels');
    const totalWasteElement = document.getElementById('totalWaste');
    const efficiencyElement = document.getElementById('efficiency');

    if (totalReelsElement) totalReelsElement.textContent = totalReels;
    if (totalWasteElement) totalWasteElement.textContent = `${Math.round(totalWaste)} mm`;

    const totalArea = totalUsed + totalWaste;
    const efficiency = totalArea > 0 ? ((totalUsed / totalArea) * 100).toFixed(2) : 0;
    if (efficiencyElement) efficiencyElement.textContent = `${efficiency}%`;

    console.log('📊 Summary updated:', { totalReels, totalWaste: Math.round(totalWaste), efficiency });
}

// Make functions globally available
window.displayPatterns = displayPatterns;
window.getColorForWidth = getColorForWidth;
// 