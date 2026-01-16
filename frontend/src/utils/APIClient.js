// Simple CSRF-protected fetch wrapper
class APIClient {
  static async fetch(url, options = {}) {
    // Get CSRF token from cookie
    const csrfToken = this.getCookie('XSRF-TOKEN');
    
    // Add CSRF token to headers for state-changing requests
    if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken || ''
      };
    }

    // Always include credentials
    options.credentials = 'include';

    return fetch(url, options);
  }

  static getCookie(name) {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1];
  }

  // Convenience methods that return parsed JSON
  static async get(url, options = {}) {
    const response = await this.fetch(url, { method: 'GET', ...options });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  static async post(url, data, options = {}) {
    const response = await this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  static async put(url, data, options = {}) {
    const response = await this.fetch(url, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  static async delete(url, data, options = {}) {
    const response = await this.fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}

export default APIClient;
