import axios from 'axios';
import 'dotenv/config';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

console.log('Testing Email Service Configuration...');
console.log('URL:', EMAIL_SERVICE_URL);
console.log('API Key:', EMAIL_API_KEY ? '******' : 'Not Set');

if (!EMAIL_SERVICE_URL) {
    console.error('❌ EMAIL_SERVICE_URL is missing in .env');
    process.exit(1);
}

const testHealth = async () => {
    try {
        console.log('\nTesting /api/health...');
        const response = await axios.get(`${EMAIL_SERVICE_URL}/api/health`);
        console.log('✅ Health Check Passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        return false;
    }
};

const run = async () => {
    const healthPassed = await testHealth();
    if (!healthPassed) {
        console.log('\n❌ Service checks failed. Please check the URL and deployment status.');
        return;
    }
    console.log('\n✅ Email Service looks reachable!');
};

run();
