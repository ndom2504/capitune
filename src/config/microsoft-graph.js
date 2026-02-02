import axios from 'axios';

const graph = axios.create({
  baseURL: 'https://graph.microsoft.com/v1.0',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getMicrosoftUserInfo = async (accessToken) => {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur récupération infos Microsoft:', error);
    throw error;
  }
};

export default graph;
