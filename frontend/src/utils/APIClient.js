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

  // Convenience methods
  static async get(url, options = {}) {
    return this.fetch(url, { method: 'GET', ...options });
  }

  static async post(url, data, options = {}) {
    return this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    });
  }

  static async put(url, data, options = {}) {
    return this.fetch(url, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    });
  }

  static async delete(url, options = {}) {
    return this.fetch(url, { method: 'DELETE', ...options });
  }
}

export default APIClient;
