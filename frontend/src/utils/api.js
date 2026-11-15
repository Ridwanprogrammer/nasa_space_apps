const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, { status = null, kind = 'api' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}

function detailToMessage(detail, status) {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => (entry && typeof entry.msg === 'string' ? entry.msg : null))
      .filter(Boolean);
    if (messages.length > 0) return messages.join(' · ');
  }
  return `The analysis engine returned HTTP ${status}.`;
}

async function request(path, { signal, timeoutMs = 60000, ...options } = {}) {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(signal.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', forwardAbort, { once: true });
  }

  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      throw new ApiError(detailToMessage(data?.detail, response.status), {
        status: response.status,
        kind: response.status >= 500 ? 'server' : 'validation'
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) {
      throw new ApiError('The request timed out. NASA POWER can be slow; try again in a moment.', {
        kind: 'timeout'
      });
    }
    if (controller.signal.aborted) {
      const abortError = new DOMException('Request cancelled', 'AbortError');
      throw abortError;
    }
    throw new ApiError(
      'Could not reach the analysis engine. Confirm the FastAPI server is running on 127.0.0.1:8000.',
      { kind: 'network' }
    );
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

export async function fetchHealth({ signal } = {}) {
  return request('/health', { signal, timeoutMs: 8000 });
}

export async function fetchCatalog({ signal } = {}) {
  const data = await request('/variables', { signal, timeoutMs: 15000 });
  return {
    variables: data?.variables || [],
    catalog: data?.catalog || null
  };
}

export async function fetchPresets({ signal } = {}) {
  const data = await request('/presets', { signal, timeoutMs: 15000 });
  return data?.presets || [];
}

export async function runInvestigation(params, { signal } = {}) {
  return request('/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
    timeoutMs: 90000
  });
}
