const axios = require('axios');

const testData = {
    Contact: {
        EmailAddress: "test_lead@example.com",
        Phone: "9876543210",
        FirstName: "Test",
        LastName: "User"
    },
    EventCode: "ADMISSION_CONFIRMED",
    Timestamp: new Date().toISOString()
};

async function sendTestWebhook() {
    try {
        console.log('Sending test webhook to http://localhost:3000/webhook/lsq...');
        const response = await axios.post('http://localhost:3000/webhook/lsq', testData);
        console.log('Response from server:', response.data);
    } catch (error) {
        console.error('Error sending test webhook:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Make sure your server is running (npm start)!');
        }
    }
}

sendTestWebhook();
