// Main application state and initialization
class TrimOptimizationApp {
    constructor() {
        this.machineSettings = {
            minJumboWidth: 1000,
            maxJumboWidth: 3000,
            maxSections: 8,
            minTrimWidth: 10
        };

        this.customerOrders = [];
        this.currentPatterns = [];
        this.isOptimizing = false;

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.loadMachineSettings();
            });
        } else {
            this.initializeEventListeners();
            this.loadMachineSettings();
        }
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...'); // Debug

        // Customer form submission
        const customerForm = document.getElementById('customerForm');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCustomerOrder();
            });
            console.log('Customer form event listener added'); // Debug
        } else {
            console.error('Customer form not found! Check HTML ID.');
        }

        // Machine settings form submission
        const machineForm = document.getElementById('machineForm');
        if (machineForm) {
            machineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMachineSettings();
            });
            console.log('Machine form event listener added'); // Debug
        } else {
            console.error('Machine form not found! Check HTML ID.');
        }

        // Manual optimization button
        const optimizeBtn = document.querySelector('.btn-optimize');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.runOptimization();
            });
            console.log('Optimize button event listener added'); // Debug
        }
    }

    loadMachineSettings() {
        try {
            const saved = localStorage.getItem('machineSettings');
            if (saved) {
                this.machineSettings = JSON.parse(saved);
                this.populateMachineForm();
                console.log('Machine settings loaded:', this.machineSettings); // Debug
            }
        } catch (error) {
            console.error('Error loading machine settings:', error);
        }
    }

    populateMachineForm() {
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                console.log(`Set ${id} to ${value}`); // Debug
            } else {
                console.error(`Element ${id} not found!`); // Debug
            }
        };

        setValue('minJumboWidth', this.machineSettings.minJumboWidth);
        setValue('maxJumboWidth', this.machineSettings.maxJumboWidth);
        setValue('maxSections', this.machineSettings.maxSections);
        setValue('minTrimWidth', this.machineSettings.minTrimWidth);
    }

    saveMachineSettings() {
        try {
            console.log('Saving machine settings...'); // Debug

            const minJumboWidth = document.getElementById('minJumboWidth');
            const maxJumboWidth = document.getElementById('maxJumboWidth');
            const maxSections = document.getElementById('maxSections');
            const minTrimWidth = document.getElementById('minTrimWidth');

            // Check if elements exist
            if (!minJumboWidth || !maxJumboWidth || !maxSections || !minTrimWidth) {
                throw new Error('One or more form elements not found');
            }

            this.machineSettings = {
                minJumboWidth: parseInt(minJumboWidth.value) || 1000,
                maxJumboWidth: parseInt(maxJumboWidth.value) || 3000,
                maxSections: parseInt(maxSections.value) || 8,
                minTrimWidth: parseInt(minTrimWidth.value) || 10
            };

            console.log('Settings to save:', this.machineSettings); // Debug

            localStorage.setItem('machineSettings', JSON.stringify(this.machineSettings));
            this.showMessage('Machine settings saved successfully!', 'success');

            // Recalculate patterns if orders exist
            if (this.customerOrders.length > 0) {
                this.calculateCuttingPattern();
            }
        } catch (error) {
            console.error('Save machine settings error:', error);
            this.showMessage('Error saving machine settings: ' + error.message, 'error');
        }
    }

    addCustomerOrder() {
        console.log('Add order button clicked!'); // Debug

        try {
            const formData = this.getCustomerFormData();
            console.log('Form data:', formData); // Debug

            if (!this.validateCustomerInput(formData)) {
                this.showMessage('Please fill all fields with valid values', 'error');
                return;
            }

            // Check if calculateRollProperties function exists
            if (typeof calculateRollProperties !== 'function') {
                throw new Error('calculateRollProperties function not found. Check calculations.js loading.');
            }

            const properties = calculateRollProperties(
                formData.gsm,
                formData.caliper,
                formData.coreOD,
                formData.rollOD,
                formData.width
            );

            const order = {
                id: this.customerOrders.length + 1,
                ...formData,
                ...properties,
                timestamp: new Date().toISOString()
            };

            this.customerOrders.push(order);
            this.updateOrdersTable();
            this.calculateCuttingPattern();
            this.clearCustomerForm();

            this.showMessage('Order added successfully!', 'success');
            console.log('Order added:', order); // Debug

        } catch (error) {
            console.error('Add order error:', error);
            this.showMessage('Error adding order: ' + error.message, 'error');
        }
    }

    getCustomerFormData() {
        const getValue = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element ${id} not found!`); // Debug
                return null;
            }
            const value = element.value;
            console.log(`${id}:`, value); // Debug
            return value;
        };

        return {
            gsm: parseFloat(getValue('gsmInput')) || 0,
            caliper: parseFloat(getValue('caliperInput')) || 0,
            coreOD: parseFloat(getValue('coreOdInput')) || 0,
            rollOD: parseFloat(getValue('rollOdInput')) || 0,
            width: parseFloat(getValue('widthInput')) || 0,
            quantity: parseInt(getValue('quantityInput')) || 0
        };
    }

    validateCustomerInput(data) {
        const errors = [];

        if (!data.gsm || data.gsm < 1) errors.push('GSM must be at least 1');
        if (!data.caliper || data.caliper < 0.01) errors.push('Caliper must be at least 0.01 mm');
        if (!data.coreOD || data.coreOD < 50) errors.push('Core OD must be at least 50 mm');
        if (!data.rollOD || data.rollOD < 100) errors.push('Roll OD must be at least 100 mm');
        if (!data.width || data.width < 100) errors.push('Width must be at least 100 mm');
        if (!data.quantity || data.quantity < 1) errors.push('Quantity must be at least 1');

        if (errors.length > 0) {
            console.log('Validation errors:', errors);
            return false;
        }

        return true;
    }

    clearCustomerForm() {
        const form = document.getElementById('customerForm');
        if (form) {
            // form.reset();
            // console.log('Form cleared'); // Debug
        }
    }

    updateOrdersTable() {
        const tableBody = document.getElementById('ordersTableBody');
        if (!tableBody) {
            console.error('Orders table body not found!');
            return;
        }

        tableBody.innerHTML = '';

        if (this.customerOrders.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="11" style="text-align: center; color: #999;">No orders added yet</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }

        this.customerOrders.forEach(order => {
            const row = this.createOrderTableRow(order);
            tableBody.appendChild(row);
        });

        console.log('Orders table updated with', this.customerOrders.length, 'orders');

        // NEW: Initialize click events for customer order rows
        if (typeof initializeCustomerOrderRowClickEvents === 'function') {
            initializeCustomerOrderRowClickEvents();
        }
    }

    createOrderTableRow(order) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.gsm}</td>
            <td>${order.width}</td>
            <td>${order.coreOD}</td>
            <td>${order.rollOD}</td>
            <td>${order.quantity}</td>
            <td>${order.rollDensity}</td>
            <td>${order.length}</td>
            <td>${order.nominalWeight}</td>
            <td>${order.packCount}</td>
            <td>
                <button class="btn-danger" onclick="app.deleteOrder(${order.id})">
                    Delete
                </button>
            </td>
        `;

        return row;
    }

    deleteOrder(orderId) {
        this.customerOrders = this.customerOrders.filter(order => order.id !== orderId);

        // Reassign IDs
        this.customerOrders.forEach((order, index) => {
            order.id = index + 1;
        });

        this.updateOrdersTable();
        this.calculateCuttingPattern();
        this.showMessage('Order deleted successfully!', 'success');
    }

    calculateCuttingPattern() {
        console.log('🎯 Calculating cutting pattern...');

        if (this.customerOrders.length === 0) {
            this.clearVisualization();
            return;
        }

        // Extract orders with widths and quantities
        const optimizationOrders = this.customerOrders.map(order => ({
            width: order.width,
            quantity: order.quantity
        }));

        console.log('📦 Orders for optimization:', optimizationOrders);

        try {
            // Try to use quantity-aware optimizer if available, otherwise fallback
            if (typeof quantityAwareOptimizer !== 'undefined' &&
                typeof quantityAwareOptimizer.optimizeWithQuantities === 'function') {

                console.log('🚀 Using quantity-aware optimizer');
                this.currentPatterns = quantityAwareOptimizer.optimizeWithQuantities(
                    optimizationOrders,
                    this.machineSettings
                );
            } else {
                // Fallback to basic pattern generator
                console.log('🔄 Using fallback pattern generator');
                const widths = optimizationOrders.map(order => order.width);
                const quantities = optimizationOrders.map(order => order.quantity);

                this.currentPatterns = generateCuttingPatterns(
                    widths,
                    quantities,
                    this.machineSettings
                );
            }

            // Display results
            if (typeof displayPatterns === 'function') {
                displayPatterns(this.currentPatterns, this.machineSettings);
            } else {
                console.error('❌ displayPatterns function not found!');
                this.showMessage('Error: Visualization not loaded', 'error');
            }

        } catch (error) {
            console.error('❌ Optimization error:', error);
            this.showMessage('Error in optimization: ' + error.message, 'error');
        }
    }

    clearVisualization() {
        const container = document.getElementById('patternsContainer');
        if (container) {
            container.innerHTML = '<p class="no-orders-message">No orders to display. Add customer orders to see cutting patterns.</p>';
        }

        document.getElementById('totalReels').textContent = '0';
        document.getElementById('totalWaste').textContent = '0 mm';
        document.getElementById('efficiency').textContent = '0%';
    }

    async runOptimization() {
        if (this.customerOrders.length === 0) {
            this.showMessage('No orders to optimize. Please add customer orders first.', 'error');
            return;
        }

        this.isOptimizing = true;
        this.showMessage('🚀 Running optimization with Google OR-Tools...', 'success');

        try {
            // Prepare optimization data
            const optimizationData = {
                orders: this.customerOrders.map(order => ({
                    width: order.width,
                    quantity: order.quantity
                })),
                machineSettings: this.machineSettings
            };

            console.log('📦 Sending for optimization:', optimizationData);

            // Use OR-Tools optimizer
            const optimizedPatterns = await ortoolsOptimizer.optimizeWithORTools(
                optimizationData.orders,
                optimizationData.machineSettings
            );

            this.currentPatterns = optimizedPatterns;
            this.displayOptimizationResults();

            const efficiency = this.calculateOverallEfficiency();
            this.showMessage(`✅ Optimization complete! Efficiency: ${efficiency}%`, 'success');

        } catch (error) {
            console.error('❌ Optimization error:', error);
            this.showMessage('⚠️ Using fallback optimization algorithm', 'error');
            // Fallback to basic pattern generation
            this.calculateCuttingPattern();
        } finally {
            this.isOptimizing = false;
        }
    }

    calculateOverallEfficiency() {
        if (!this.currentPatterns || this.currentPatterns.length === 0) return 0;

        let totalUsed = 0;
        let totalWaste = 0;

        this.currentPatterns.forEach(pattern => {
            const patternWidth = pattern.pattern.reduce((a, b) => a + b, 0);
            totalUsed += patternWidth * pattern.usage;
            totalWaste += pattern.waste * pattern.usage;
        });

        const totalArea = totalUsed + totalWaste;
        return totalArea > 0 ? ((totalUsed / totalArea) * 100).toFixed(2) : 0;
    }

    displayOptimizationResults() {
        if (this.currentPatterns && this.currentPatterns.length > 0) {
            // Check if displayPatterns function exists
            if (typeof displayPatterns === 'function') {
                displayPatterns(this.currentPatterns, this.machineSettings);
            } else {
                console.error('❌ displayPatterns function not found!');
                this.showMessage('Error: Visualization function not loaded', 'error');
            }
        } else {
            this.showMessage('No patterns generated from optimization', 'error');
        }
    }

    calculateOverallEfficiency() {
        if (!this.currentPatterns || this.currentPatterns.length === 0) return 0;

        let totalUsed = 0;
        let totalWaste = 0;

        this.currentPatterns.forEach(pattern => {
            const patternWidth = pattern.pattern.reduce((a, b) => a + b, 0);
            totalUsed += patternWidth * pattern.usage;
            totalWaste += pattern.waste * pattern.usage;
        });

        const totalArea = totalUsed + totalWaste;
        return totalArea > 0 ? ((totalUsed / totalArea) * 100).toFixed(2) : 0;
    }

    displayOptimizationResults() {
        if (this.currentPatterns && this.currentPatterns.length > 0) {
            // Check if displayPatterns function exists
            if (typeof displayPatterns === 'function') {
                displayPatterns(this.currentPatterns, this.machineSettings);
            } else {
                console.error('❌ displayPatterns function not found!');
                this.showMessage('Error: Visualization function not loaded', 'error');
            }
        } else {
            this.showMessage('No patterns generated from optimization', 'error');
        }
    }

    clearAllOrders() {
        if (this.customerOrders.length === 0) return;

        if (confirm('Are you sure you want to clear all orders?')) {
            this.customerOrders = [];
            this.updateOrdersTable();
            this.clearVisualization();
            this.showMessage('All orders cleared.', 'success');
        }
    }

    showMessage(message, type) {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message-temporary');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message-temporary message-${type}`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the application
console.log('Loading Trim Optimization App...'); // Debug
window.app = new TrimOptimizationApp();

console.log('🔍 Debug - Checking loaded functions:');
console.log('- generateCuttingPatterns:', typeof generateCuttingPatterns);
console.log('- quantityAwareOptimizer:', typeof quantityAwareOptimizer);
console.log('- displayPatterns:', typeof displayPatterns);
// 