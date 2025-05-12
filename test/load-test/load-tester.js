const axios = require('axios');
const moment = require('moment');

class APILoadTester {
    constructor(baseURL = 'http://localhost:3002') {
        this.baseURL = baseURL;
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Run load test with given scenarios
     * @param {Object} options Test configuration options
     */
    async runTest({
        concurrent = 10,
        iterations = 50,
        scenarios = [
            {
                name: 'jaspreet',
                params: {
                    startDate:  "2023-01-02",
                    ivrNumber: '8517009997'
                }
            }
        ]
    } = {}) {
        console.log('\n🚀 Starting Load Test');
        console.log(`Concurrent Requests: ${concurrent}`);
        console.log(`Total Iterations: ${iterations}`);
        console.log('----------------------------------------');

        this.startTime = Date.now();

        for (const scenario of scenarios) {
            console.log(`\n📊 Running Scenario: ${scenario.name}`);
            const scenarioResults = [];
            
            // Run batches of concurrent requests
            for (let i = 0; i < iterations; i += concurrent) {
                const batchSize = Math.min(concurrent, iterations - i);
                const batchNumber = Math.floor(i / concurrent) + 1;
                const totalBatches = Math.ceil(iterations / concurrent);
                
                console.log(`\nBatch ${batchNumber}/${totalBatches} (${batchSize} requests)`);
                
                const requests = Array(batchSize).fill().map(() => this.makeRequest(scenario.params));
                
                const batchStart = Date.now();
                const responses = await Promise.all(requests);
                const batchDuration = Date.now() - batchStart;
                
                responses.forEach((response, index) => {
                    scenarioResults.push({
                        responseTime: response.duration,
                        status: response.status,
                        error: response.error,
                        timestamp: new Date(batchStart + (index * (batchDuration) / batchSize))
                    });
                });

                // Print progress
                const successCount = responses.filter(r => r.status === 200).length;
                const avgResponseTime = (responses.reduce((sum, r) => sum + r.duration, 0) / responses.length).toFixed(2);
                console.log(`✓ Completed: ${successCount}/${batchSize} successful, Avg Response: ${avgResponseTime}ms`);
                
                // Add delay between batches to prevent overwhelming the server
                if (i + concurrent < iterations) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            this.analyzeResults(scenario.name, scenarioResults);
        }

        this.endTime = Date.now();
        this.printSummary();
    }

    /**
     * Make a single API request
     * @param {Object} params Request parameters
     */
    async makeRequest(params) {
        const start = Date.now();
        try {
            const response = await axios.get(`${this.baseURL}/api/outbound-call-analytics`, {
                params,
                timeout: 30000 // 30 second timeout
            });
            
            return {
                status: response.status,
                duration: Date.now() - start,
                dataSize: JSON.stringify(response.data).length
            };
        } catch (error) {
            return {
                status: error.response?.status || 500,
                duration: Date.now() - start,
                error: error.message
            };
        }
    }

    /**
     * Analyze results for a scenario
     * @param {string} scenarioName Name of the scenario
     * @param {Array} results Results array
     */
    analyzeResults(scenarioName, results) {
        const responseTimes = results.map(r => r.duration);
        const successful = results.filter(r => r.status === 200).length;
        const failed = results.length - successful;
        
        const stats = {
            'Total Requests': results.length,
            'Successful': successful,
            'Failed': failed,
            'Success Rate': ((successful / results.length) * 100).toFixed(2) + '%',
            'Min Response Time': Math.min(...responseTimes) + 'ms',
            'Max Response Time': Math.max(...responseTimes) + 'ms',
            'Avg Response Time': (responseTimes.reduce((a, b) => a + b, 0) / results.length).toFixed(2) + 'ms',
            '95th Percentile': this.percentile(responseTimes, 95) + 'ms',
            '99th Percentile': this.percentile(responseTimes, 99) + 'ms'
        };

        console.log('\n📈 Results for:', scenarioName);
        console.table(stats);

        // Check for warnings
        this.checkWarnings(stats, scenarioName);
    }

    /**
     * Calculate percentile value
     * @param {Array} arr Array of numbers
     * @param {number} p Percentile to calculate
     */
    percentile(arr, p) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const position = (sorted.length - 1) * p / 100;
        const base = Math.floor(position);
        const rest = position - base;
        
        if (sorted[base + 1] !== undefined) {
            return Math.round(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
        } else {
            return Math.round(sorted[base]);
        }
    }

    /**
     * Check for performance warnings
     * @param {Object} stats Statistics object
     * @param {string} scenarioName Name of the scenario
     */
    checkWarnings(stats, scenarioName) {
        const warnings = [];
        
        if (parseFloat(stats['Max Response Time']) > 5000) {
            warnings.push(`Some requests took over 5 seconds (max: ${stats['Max Response Time']})`);
        }
        
        if (parseFloat(stats['95th Percentile']) > 3000) {
            warnings.push(`95th percentile response time is high (${stats['95th Percentile']})`);
        }
        
        if (parseFloat(stats['Success Rate']) < 95) {
            warnings.push(`Low success rate (${stats['Success Rate']})`);
        }

        if (warnings.length > 0) {
            console.log('\n⚠️ Warnings for', scenarioName);
            warnings.forEach(warning => console.log(`- ${warning}`));
        }
    }

    /**
     * Print summary of all tests
     */
    printSummary() {
        const totalDuration = (this.endTime - this.startTime) / 1000;
        
        console.log('\n📋 Test Summary');
        console.log('----------------------------------------');
        console.log(`Total Duration: ${totalDuration.toFixed(2)} seconds`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('----------------------------------------');
    }
}

module.exports = { APILoadTester };