import axios from "axios";

// Central Axios instance so every API call shares the same base URL
// and always sends the PHP session cookie (withCredentials).
const api = axios.create({
baseURL: "http://localhost/staygo/backend/api",
  withCredentials: true,
});

export default api;
