import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.mode === "development" ? "http://localhost:5000/api/v1": "/v1",
    // it send cookies to the server
    withCredentials: true,  
});

export default axiosInstance;