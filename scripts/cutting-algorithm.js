// Enhanced cutting pattern generation with full width utilization
function generateCuttingPatterns(widths, quantities, machineSettings) {
    console.log('🔧 Generating patterns with full width utilization:', { widths, quantities, machineSettings });

    try {
        const jumboWidth = machineSettings.maxJumboWidth;
        const minTrim = machineSettings.minTrimWidth;
        const maxSections = machineSettings.maxSections;

        const patterns = [];
        const remainingQuantities = [...quantities];

        // Sort widths to try different combinations for better utilization
        const sortedWidths = widths.map((width, index) => ({ width, index }))
            .sort((a, b) => b.width - a.width);

        let iteration = 0;
        const maxIterations = 1000;

        while (remainingQuantities.some(qty => qty > 0) && iteration < maxIterations) {
            iteration++;

            let bestPattern = null;
            let bestUtilization = 0;
            let bestRemainingWidth = jumboWidth;

            // Try multiple strategies to find the best pattern
            for (let strategy = 0; strategy < 3; strategy++) {
                let currentWidth = 0;
                const pattern = [];
                const usedIndexes = [];
                const available = sortedWidths.filter(item => remainingQuantities[item.index] > 0);

                // Strategy 0: Largest first (default)
                // Strategy 1: Smallest first  
                // Strategy 2: Mixed approach
                let sortedAvailable = [...available];
                if (strategy === 1) {
                    sortedAvailable = [...available].sort((a, b) => a.width - b.width);
                } else if (strategy === 2) {
                    sortedAvailable = [...available].sort(() => Math.random() - 0.5);
                }

                for (const item of sortedAvailable) {
                    if (currentWidth + item.width <= jumboWidth - minTrim &&
                        pattern.length < maxSections) {

                        // Check if this gives better utilization
                        const newWidth = currentWidth + item.width;
                        const remaining = jumboWidth - newWidth;

                        if (remaining >= 0 && remaining <= bestRemainingWidth) {
                            pattern.push(item.width);
                            currentWidth = newWidth;
                            usedIndexes.push(item.index);

                            if (remaining < bestRemainingWidth) {
                                bestRemainingWidth = remaining;
                                bestUtilization = (currentWidth / jumboWidth) * 100;
                                bestPattern = {
                                    pattern: [...pattern],
                                    usedIndexes: [...usedIndexes],
                                    width: currentWidth,
                                    waste: remaining
                                };
                            }
                        }
                    }
                }
            }

            if (bestPattern && bestPattern.usedIndexes.length > 0) {
                // Calculate maximum usage for this pattern
                const maxUsage = Math.min(...bestPattern.usedIndexes.map(idx => remainingQuantities[idx]));

                if (maxUsage > 0) {
                    patterns.push({
                        pattern: bestPattern.pattern,
                        waste: bestPattern.waste,
                        usage: maxUsage,
                        efficiency: ((bestPattern.width / jumboWidth) * 100).toFixed(1)
                    });

                    // Update remaining quantities
                    bestPattern.usedIndexes.forEach(idx => {
                        remainingQuantities[idx] -= maxUsage;
                    });

                    console.log(`✅ Pattern ${patterns.length}: ${bestPattern.pattern.join('+')} = ${bestPattern.width}mm (${bestPattern.efficiency}% efficiency)`);
                } else {
                    break;
                }
            } else {
                // Handle any leftover orders individually
                handleLeftoverOrders(widths, remainingQuantities, patterns, machineSettings);
                break;
            }
        }

        // Sort patterns by efficiency (highest first)
        patterns.sort((a, b) => b.efficiency - a.efficiency);

        console.log('✅ Final patterns generated:', patterns);
        return patterns;

    } catch (error) {
        console.error('❌ Error in pattern generation:', error);
        return []; // Return empty array instead of crashing
    }
}

function handleLeftoverOrders(widths, quantities, patterns, machineSettings) {
    console.log('🔄 Handling leftover orders');

    const jumboWidth = machineSettings.maxJumboWidth;

    for (let i = 0; i < widths.length; i++) {
        while (quantities[i] > 0) {
            if (widths[i] <= jumboWidth) {
                const waste = jumboWidth - widths[i];
                patterns.push({
                    pattern: [widths[i]],
                    waste: waste,
                    usage: quantities[i],
                    efficiency: ((widths[i] / jumboWidth) * 100).toFixed(1)
                });
                quantities[i] = 0;
                console.log(`📦 Leftover pattern: ${widths[i]}mm (waste: ${waste}mm)`);
            } else {
                console.warn(`⚠️ Order width ${widths[i]}mm exceeds jumbo width ${jumboWidth}mm`);
                quantities[i] = 0;
            }
        }
    }
}

// Make functions globally available
window.generateCuttingPatterns = generateCuttingPatterns;
window.handleLeftoverOrders = handleLeftoverOrders;
// 