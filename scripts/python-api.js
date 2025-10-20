class PythonAPI {
    constructor(baseURL = 'http://localhost:5000') {
        this.baseURL = baseURL;
    }

    async optimizeCutting(orders, machineSettings) {
        try {
            const response = await fetch(`${this.baseURL}/optimize`, {
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
const pythonAPI = new PythonAPI();
// 