// Google OR-Tools ILP Optimizer
class ORToolsOptimizer {
    constructor() {
        this.backendURL = 'http://localhost:5000';
        this.isBackendAvailable = false;
        this.checkBackendHealth();
    }

    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.backendURL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            this.isBackendAvailable = response.ok;
            console.log(`🔍 Backend health: ${this.isBackendAvailable ? '✅ Healthy' : '❌ Unavailable'}`);
        } catch (error) {
            this.isBackendAvailable = false;
            console.log('🔍 Backend health: ❌ Unavailable', error.message);
        }
    }

    async optimizeWithORTools(orders, machineSettings) {
        if (!this.isBackendAvailable) {
            console.log('🔄 Using fallback JavaScript optimizer');
            return this.fallbackOptimization(orders, machineSettings);
        }

        try {
            console.log('🚀 Sending to OR-Tools backend:', { orders, machineSettings });

            const response = await fetch(`${this.backendURL}/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orders: orders,
                    machineSettings: machineSettings
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ OR-Tools result:', result);

            if (result.success) {
                return this.formatORResult(result);
            } else {
                throw new Error(result.error || 'Unknown error from OR-Tools');
            }

        } catch (error) {
            console.error('❌ OR-Tools optimization failed:', error);
            console.log('🔄 Falling back to JavaScript optimizer');
            return this.fallbackOptimization(orders, machineSettings);
        }
    }

    formatORResult(result) {
        // Convert OR-Tools result to our format
        return result.patterns.map(pattern => ({
            pattern: pattern.pattern,
            waste: pattern.waste,
            usage: pattern.usage,
            efficiency: pattern.efficiency || ((pattern.pattern.reduce((a, b) => a + b, 0) / pattern.pattern.reduce((a, b) => a + b, 0) + pattern.waste) * 100).toFixed(1)
        }));
    }

    fallbackOptimization(orders, machineSettings) {
        console.log('🔄 Running fallback optimization');
        // Use our JavaScript pattern generator as fallback
        const widths = orders.map(order => order.width);
        const quantities = orders.map(order => order.quantity);

        return generateCuttingPatterns(widths, quantities, machineSettings);
    }

    // Advanced JavaScript ILP-like optimizer
    advancedJSOptimization(orders, machineSettings) {
        console.log('🔬 Running advanced JS optimization');

        const widths = orders.map(order => order.width);
        const quantities = orders.map(order => order.quantity);
        const jumboWidth = machineSettings.maxJumboWidth;

        // Generate all possible patterns
        const allPatterns = this.generateAllPatterns(widths, jumboWidth, machineSettings);

        // Simple column generation approach
        const selectedPatterns = [];
        const remainingDemand = [...quantities];

        while (remainingDemand.some(qty => qty > 0)) {
            let bestPattern = null;
            let bestEfficiency = 0;

            // Find the most efficient pattern for current demand
            for (const pattern of allPatterns) {
                const efficiency = this.calculatePatternEfficiency(pattern, jumboWidth);
                const canUse = this.canUsePattern(pattern, remainingDemand, widths);

                if (canUse && efficiency > bestEfficiency) {
                    bestPattern = pattern;
                    bestEfficiency = efficiency;
                }
            }

            if (bestPattern) {
                const usage = this.calculateMaxUsage(bestPattern, remainingDemand, widths);
                selectedPatterns.push({
                    pattern: bestPattern,
                    waste: jumboWidth - bestPattern.reduce((a, b) => a + b, 0),
                    usage: usage,
                    efficiency: bestEfficiency
                });

                // Update remaining demand
                this.updateDemand(remainingDemand, bestPattern, usage, widths);
            } else {
                break;
            }
        }

        return selectedPatterns;
    }

    generateAllPatterns(widths, jumboWidth, machineSettings) {
        const patterns = [];
        const maxSections = machineSettings.maxSections;

        function generate(currentPattern, currentWidth, startIndex) {
            if (currentPattern.length > 0) {
                patterns.push([...currentPattern]);
            }

            if (currentPattern.length >= maxSections) return;

            for (let i = startIndex; i < widths.length; i++) {
                const newWidth = currentWidth + widths[i];
                if (newWidth <= jumboWidth) {
                    currentPattern.push(widths[i]);
                    generate(currentPattern, newWidth, i);
                    currentPattern.pop();
                }
            }
        }

        generate([], 0, 0);
        return patterns;
    }

    calculatePatternEfficiency(pattern, jumboWidth) {
        const usedWidth = pattern.reduce((a, b) => a + b, 0);
        return (usedWidth / jumboWidth) * 100;
    }

    canUsePattern(pattern, demand, widths) {
        const patternCounts = {};
        pattern.forEach(width => {
            patternCounts[width] = (patternCounts[width] || 0) + 1;
        });

        for (const width of Object.keys(patternCounts)) {
            const widthIndex = widths.indexOf(parseFloat(width));
            if (widthIndex === -1 || demand[widthIndex] < patternCounts[width]) {
                return false;
            }
        }
        return true;
    }

    calculateMaxUsage(pattern, demand, widths) {
        const patternCounts = {};
        pattern.forEach(width => {
            patternCounts[width] = (patternCounts[width] || 0) + 1;
        });

        let maxUsage = Infinity;
        for (const width of Object.keys(patternCounts)) {
            const widthIndex = widths.indexOf(parseFloat(width));
            if (widthIndex !== -1) {
                maxUsage = Math.min(maxUsage, Math.floor(demand[widthIndex] / patternCounts[width]));
            }
        }

        return maxUsage === Infinity ? 0 : maxUsage;
    }

    updateDemand(demand, pattern, usage, widths) {
        pattern.forEach(width => {
            const widthIndex = widths.indexOf(width);
            if (widthIndex !== -1) {
                demand[widthIndex] -= usage;
            }
        });
    }
}

// Create global instance
window.ortoolsOptimizer = new ORToolsOptimizer();
// 