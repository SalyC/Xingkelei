import axios, { InternalAxiosRequestConfig } from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Не добавляем Authorization для запросов логина и регистрации
  const isAuthEndpoint = config.url?.includes("/auth/login") || config.url?.includes("/auth/register")

  if (!isAuthEndpoint) {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export default api