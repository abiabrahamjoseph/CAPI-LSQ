require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID = process.env.META_PIXEL_ID;

// Helper function to hash user data (SHA-256) as required by Meta
function hashData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * Handle LeadSquared Webhook
 * Expected payload structure from LSQ:
 * {
 *   "Contact": {
 *     "EmailAddress": "test@example.com",
 *     "Phone": "1234567890",
 *     "FirstName": "John",
 *     "LastName": "Doe"
 *   },
 *   "EventCode": "ADMISSION_CONFIRMED", // Example event trigger
 *   "Timestamp": "2024-01-01T00:00:00Z"
 * }
 */
app.post('/webhook/lsq', async (req, res) => {
    console.log('Received LSQ Webhook:', JSON.stringify(req.body, null, 2));

    try {
        const { Contact, EventCode } = req.body;

        if (!Contact) {
            return res.status(400).json({ error: 'No contact data provided' });
        }

        // 1. Prepare User Data (Hashed)
        const userData = {
            em: [hashData(Contact.EmailAddress)],
            ph: [hashData(Contact.Phone)],
            // Add more fields if available (client_ip_address, client_user_agent, etc.)
        };

        // 2. Prepare Event Data
        const eventData = {
            event_name: 'Lead', // You can map EventCode to Meta event names
            event_time: Math.floor(Date.now() / 1000),
            user_data: userData,
            custom_data: {
                lsq_event_code: EventCode || 'N/A',
                source: 'LeadSquared'
            },
            action_source: 'system_generated' // Since it's server-side
        };

        // 3. Send to Meta CAPI
        const metaUrl = `https://graph.facebook.com/v17.0/${META_PIXEL_ID}/events`;
        const response = await axios.post(metaUrl, {
            data: [eventData],
            access_token: META_ACCESS_TOKEN
        });

        console.log('Successfully sent to Meta:', response.data);
        res.status(200).json({ message: 'Success', metaResponse: response.data });

    } catch (error) {
        console.error('Error processing webhook:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to process webhook', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Meta CAPI Bridge is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
