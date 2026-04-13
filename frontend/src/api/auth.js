import api from "../utils/axios";

// Register a new NepSaathi user with email and password
export const register = async (data) => {
  const response = await api.post("/api/auth/registration/", {
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    password1: data.password,
    password2: data.confirmPassword,
  });
  return response.data;
};

// Login with email and password
// Returns access token, refresh token and user object
export const login = async (email, password) => {
  const response = await api.post("/api/auth/login/", { email, password });
  return response.data;
};

// Logout — blacklists the refresh token on Django
export const logout = async (refreshToken) => {
  const response = await api.post("/api/users/auth/logout/", {
    refresh: refreshToken,
  });
  return response.data;
};

// Get the logged in user's profile
export const getProfile = async () => {
  const response = await api.get("/api/users/profile/");
  return response.data;
};

// Update the logged in user's profile
export const updateProfile = async (data) => {
  const response = await api.patch("/api/users/profile/", data);
  return response.data;
};

// Google OAuth login
// Sends the Google access token to Django which verifies it
export const googleLogin = async (accessToken) => {
  const response = await api.post("/api/users/auth/google/", {
    access_token: accessToken,
  });
  return response.data;
};
