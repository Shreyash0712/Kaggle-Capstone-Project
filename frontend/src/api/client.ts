export interface QueryRequest {
  query: string;
  session_id: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const createSession = async (userPremise: string) => {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      user_premise: userPremise,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create session');
  }

  return response.json();
};

export const runDebate = async (query: string, sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/debate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
};

export const getSession = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch session details');
  }

  return response.json();
};

export const getUserSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/sessions`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user sessions');
  }

  return response.json();
};

export const deleteSession = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete session');
  }

  return response.json();
};

export const runDebateStream = async (query: string, sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/debate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response;
};

export const updateUserName = async (name: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/me/name`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to update name');
  return response.json();
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const headers = getHeaders();
  delete (headers as any)['Content-Type']; // Let browser set multipart/form-data with boundary

  const response = await fetch(`${API_BASE_URL}/auth/me/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload avatar');
  return response.json();
};

export const deleteAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete account');
  return response.json();
};

export const deleteAllSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/sessions`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete all sessions');
  return response.json();
};

export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to request password reset');
  }
  return response.json();
};

export const resetPassword = async (token: string, new_password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to reset password');
  }
  return response.json();
};
