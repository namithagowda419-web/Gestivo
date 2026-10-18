// Global Diagnostic Ring Buffer for Developer & Caregiver ?debug=1 diagnostics

interface DiagnosticEntry {
  id: string;
  time: string;
  type: 'error' | 'warn' | 'info';
  message: string;
}

const MAX_LOG_ENTRIES = 20;
const diagnosticRing: DiagnosticEntry[] = [];
const listeners: Set<() => void> = new Set();

export function recordDiagnosticLog(type: 'error' | 'warn' | 'info', message: string) {
  const entry: DiagnosticEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toLocaleTimeString(),
    type,
    message,
  };

  diagnosticRing.unshift(entry);
  if (diagnosticRing.length > MAX_LOG_ENTRIES) {
    diagnosticRing.pop();
  }

  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function getRecentDiagnostics(): DiagnosticEntry[] {
  return [...diagnosticRing];
}

export function subscribeDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Global window error listener setup once
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || 'Unknown window error';
    recordDiagnosticLog('error', `[Window Error] ${msg}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason) || 'Unhandled promise rejection';
    recordDiagnosticLog('error', `[Unhandled Promise] ${reason}`);
  });
}
