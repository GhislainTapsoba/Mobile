import axios from 'axios';

const api = axios.create({
  baseURL: 'https://votre-api.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentification conforme au diagramme
export const authenticate = async (email, password) => {
  try {
    const response = await api.post('/Auth', { 
      email, 
      password,
      deviceInfo: {
        platform: Platform.OS,
        // Ajoutez d'autres métadonnées si nécessaire
      }
    });
    return response.data;
  } catch (error) {
    // Gestion d'erreur améliorée
    if (error.response) {
      throw new Error(error.response.data.message || 'Erreur d\'authentification');
    } else {
      throw new Error('Problème de connexion au serveur');
    }
  }
};

// Réservation de ticket avec géolocalisation
export const reserveTicket = async (clientId, location) => {
  try {
    const response = await api.post('/tickets', {
      clientId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de réservation');
  }
};

// Nouveaux endpoints conformes aux diagrammes
export const fetchQueueStats = async () => {
  return api.get('/stats/queue');
};

export const callNextTicket = async (agentId) => {
  return api.post(`/agent/${agentId}/call-next`);
};

export const stopDistribution = async () => {
  return api.post('/admin/stop-distribution');
};