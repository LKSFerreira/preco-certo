import { create } from 'zustand';

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
}

interface LoggerState {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, details?: any) => void;
  clearLogs: () => void;
  isVisible: boolean;
  toggleVisibility: () => void;
}

export const useLogger = create<LoggerState>((set) => ({
  logs: [],
  isVisible: false,
  
  addLog: (level, message, details) => set((state) => ({
    logs: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        message,
        details: details ? JSON.stringify(details, null, 2) : undefined
      },
      ...state.logs
    ].slice(0, 50) // Mantém apenas os últimos 50 logs
  })),

  clearLogs: () => set({ logs: [] }),
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible }))
}));

export const logger = {
  info: (msg: string, details?: any) => useLogger.getState().addLog('info', msg, details),
  warn: (msg: string, details?: any) => useLogger.getState().addLog('warn', msg, details),
  error: (msg: string, details?: any) => useLogger.getState().addLog('error', msg, details),
  success: (msg: string, details?: any) => useLogger.getState().addLog('success', msg, details),
};
