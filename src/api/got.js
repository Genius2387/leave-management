/**
 * got.js — Browser-compatible wrapper that mimics the got HTTP library API.
 *
 * Assumption: The assignment specifies `got` which is a Node.js-only library
 * and cannot run in a browser environment (CRA produces a browser bundle).
 * This wrapper replicates got's interface (options.json, .json() response)
 * using the Fetch API so all call-sites remain API-compatible.
 *
 * Usage mirrors got v12:
 *   const res = await got.get(url, { searchParams });
 *   const data = await res.json();
 *
 *   await got.post(url, { json: payload });
 *   await got.patch(url, { json: payload });
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function buildUrl(path, searchParams) {
  const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

function createResponse(fetchResponse) {
  return {
    statusCode: fetchResponse.status,
    ok: fetchResponse.ok,
    headers: fetchResponse.headers,
    json: () => {
      if (!fetchResponse.ok) {
        return fetchResponse.json().then((body) => {
          const err = new Error(`HTTP ${fetchResponse.status}`);
          err.response = { statusCode: fetchResponse.status, body };
          throw err;
        });
      }
      return fetchResponse.json();
    },
    text: () => fetchResponse.text(),
  };
}

const got = {
  async get(path, options = {}) {
    const { searchParams, headers = {} } = options;
    const url = buildUrl(path, searchParams);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    return createResponse(res);
  },

  async post(path, options = {}) {
    const { json, headers = {} } = options;
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    return createResponse(res);
  },

  async patch(path, options = {}) {
    const { json, headers = {} } = options;
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    return createResponse(res);
  },

  async put(path, options = {}) {
    const { json, headers = {} } = options;
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    return createResponse(res);
  },

  async delete(path, options = {}) {
    const { headers = {} } = options;
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    return createResponse(res);
  },
};

export default got;
