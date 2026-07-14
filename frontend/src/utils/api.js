import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
 baseURL: "https://academia-share.onrender.com/api",
});

api.interceptors.request.use(async (config) => {


  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;