const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new HttpError(res.status, message);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult<T> {
  promise: Promise<T>;
  abort: () => void;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      headers: { ...getAuthHeader() },
    }).then((res) => parseResponse<T>(res));
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => parseResponse<T>(res));
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => parseResponse<T>(res));
  },

  delete<T>(path: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    }).then((res) => parseResponse<T>(res));
  },

  upload<T>(path: string, formData: FormData): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    }).then((res) => parseResponse<T>(res));
  },

  uploadWithProgress<T>(
    path: string,
    formData: FormData,
    onProgress: (progress: UploadProgress) => void,
  ): UploadResult<T> {
    const xhr = new XMLHttpRequest();

    const promise = new Promise<T>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const contentType = xhr.getResponseHeader('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              resolve(undefined as T);
              return;
            }
            resolve(JSON.parse(xhr.responseText) as T);
          } catch {
            resolve(undefined as T);
          }
        } else {
          let message = `HTTP ${xhr.status}`;
          try {
            const body = JSON.parse(xhr.responseText) as { error?: string };
            message = body.error ?? message;
          } catch {
            // ignore
          }
          reject(new HttpError(xhr.status, message));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new HttpError(0, 'Network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new HttpError(0, 'Upload cancelled'));
      });

      xhr.open('POST', `${BASE_URL}${path}`);
      const auth = getAuthHeader();
      for (const [key, value] of Object.entries(auth)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.send(formData);
    });

    return {
      promise,
      abort: () => xhr.abort(),
    };
  },
};
