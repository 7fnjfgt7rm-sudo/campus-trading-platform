const isProduction = process.env.NODE_ENV === 'production';

export const API_URL = isProduction ? '/api' : 'http://localhost:5001/api';
export const SOCKET_URL = isProduction ? window.location.origin : 'http://localhost:5001';
export const IMAGE_BASE_URL = isProduction ? '' : 'http://localhost:5001';