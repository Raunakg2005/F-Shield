import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Update this URL as needed

export const getFraudData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/fraud-data`);
    return response.data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};
