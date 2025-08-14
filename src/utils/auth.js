export const setToken = (token) => {
  const decoded = decodeToken(token);
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiry', decoded.exp * 1000); // Store expiration in milliseconds
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const expiry = localStorage.getItem('tokenExpiry');
  return expiry ? new Date().getTime() < expiry : false;
};

export const decodeToken = (token) => {
  if (!token) return {};
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiry');
  window.location.href = '/login';
};