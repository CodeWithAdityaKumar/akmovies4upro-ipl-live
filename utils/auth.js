// Custom auth utility that uses our API endpoints instead of Supabase

export async function signIn(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Authentication failed');
  }
  
  const data = await response.json();
  
  // Store session in localStorage
  localStorage.setItem('auth_session', JSON.stringify(data.session));
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  
  return data;
}

export async function signOut() {
  // Clear local session
  localStorage.removeItem('auth_session');
  localStorage.removeItem('auth_user');
  
  // Optional: Call logout endpoint to invalidate session on server
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error during signout:', error);
  }
}

export async function getCurrentUser() {
  // Get user from localStorage
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

export async function getUserRole(userId) {
  if (!userId) return null;
  
  // Get user from localStorage first
  const user = await getCurrentUser();
  if (user && user.id === userId) {
    return user.role;
  }
  
  // If not in localStorage, fetch from API
  try {
    const response = await fetch(`/api/users/${userId}/role`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function isAdmin(userId) {
  const role = await getUserRole(userId);
  return role === 'admin';
}

// Check if the current user is authenticated and has admin privileges
export async function requireAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // Check if session is still valid
    const session = JSON.parse(localStorage.getItem('auth_session') || 'null');
    if (!session || !session.token) return false;
    
    // Check session expiry
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      // Session expired
      signOut();
      return false;
    }
    
    return await isAdmin(user.id);
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}
