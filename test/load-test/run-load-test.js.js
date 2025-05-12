const { APILoadTester } = require('./load-tester');

// Configuration for your environment
const config = {
    baseURL: 'http://localhost:3000', // Change this according to your environment
    // Add any other configuration needed
};

const runTest = async () => {
    const tester = new APILoadTester(config.baseURL);
    
    // Add your actual agent names and other real data here
    await tester.runTest({
        concurrent: 10,
        scenarios: [
            {
                name: 'jaspreet kaur',
                params: {
                    startDate: "2023-01-02",
                    endDate: "2025-01-02",
                    ivrNumber: '8517009997'
                }
            },
            {
                name: 'yamini dewangan',
                params: {
                 startDate: "2023-01-02",
                 endDate: "2025-01-02",
                    ivrNumber: '8517009998'
                }
            }
            // Add more scenarios as needed
        ]
    });
};

runTest().catch(console.error);