// IMPORTANT: This must be the base URL of YOUR Xano API Group.
// The error "Unable to locate request" means that your Base URL,
// or the specific endpoint paths in 'services/api.ts' (e.g., '/product', '/sale'),
// do not match your Xano backend setup. Please double-check them.
export const XANO_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:qRhKs4jB';

export const xanoRequest = async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body: any = null) => {
  const url = `${XANO_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${JSON.parse(token)}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An error occurred with the API request.');
  }
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
};