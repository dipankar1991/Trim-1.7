// Input validation functions
const Validators = {
    // Validate GSM value
    validateGSM: (gsm) => {
        if (typeof gsm !== 'number' || isNaN(gsm)) return 'GSM must be a number';
        if (gsm < 1) return 'GSM must be at least 1 g/m²';
        if (gsm > 1000) return 'GSM seems too high. Please verify.';
        return null;
    },

    // Validate caliper value
    validateCaliper: (caliper) => {
        if (typeof caliper !== 'number' || isNaN(caliper)) return 'Caliper must be a number';
        if (caliper < 0.01) return 'Caliper must be at least 0.01 mm';
        if (caliper > 10) return 'Caliper seems too high. Please verify.';
        return null;
    },

    // Validate diameter values
    validateDiameter: (value, name, minValue) => {
        if (typeof value !== 'number' || isNaN(value)) return `${name} must be a number`;
        if (value < minValue) return `${name} must be at least ${minValue} mm`;
        if (value > 5000) return `${name} seems too large. Please verify.`;
        return null;
    },

    // Validate width values
    validateWidth: (width, machineSettings) => {
        if (typeof width !== 'number' || isNaN(width)) return 'Width must be a number';
        if (width < 100) return 'Width must be at least 100 mm';
        if (width > machineSettings.maxJumboWidth) {
            return `Width cannot exceed maximum jumbo width of ${machineSettings.maxJumboWidth} mm`;
        }
        return null;
    },

    // Validate quantity
    validateQuantity: (quantity) => {
        if (typeof quantity !== 'number' || isNaN(quantity)) return 'Quantity must be a number';
        if (quantity < 1) return 'Quantity must be at least 1';
        if (quantity > 10000) return 'Quantity seems too high. Please verify.';
        return null;
    },

    // Comprehensive order validation
    validateOrder: (orderData, machineSettings) => {
        const errors = [];

        const gsmError = this.validateGSM(orderData.gsm);
        if (gsmError) errors.push(gsmError);

        const caliperError = this.validateCaliper(orderData.caliper);
        if (caliperError) errors.push(caliperError);

        const coreError = this.validateDiameter(orderData.coreOD, 'Core OD', 50);
        if (coreError) errors.push(coreError);

        const rollError = this.validateDiameter(orderData.rollOD, 'Roll OD', 100);
        if (rollError) errors.push(rollError);

        const widthError = this.validateWidth(orderData.width, machineSettings);
        if (widthError) errors.push(widthError);

        const quantityError = this.validateQuantity(orderData.quantity);
        if (quantityError) errors.push(quantityError);

        return errors;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
// 