// utils/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.11.115:8000', // IP de ton backend Laravel accessible depuis le mobile
  withCredentials: true,
});

export default api;
