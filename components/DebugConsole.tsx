import React from 'react';
import { useLogger, logger } from '../services/logger';

export const DebugConsole: React.FC = () => {
  const { logs, isVisible, toggleVisibility, clearLogs } = useLogger();

  if (!isVisible) {
    return (
      <button 
        onClick={toggleVisibility}
        className="fixed bottom-4 left-4 z-[9999] bg-gray-800 text-white p-2 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity"
        title="Abrir Console de Debug"
      >
        <i className="fas fa-bug"></i>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 h-1/2 bg-gray-900 border-t-2 border-verde-500 z-[9999] flex flex-col shadow-2xl animate-slide-up font-mono text-xs">
      {/* Cabeçalho */}
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center shrink-0">
        <div className="flex gap-2 items-center">
          <i className="fas fa-terminal"></i>
          <span className="font-bold">Console de Debug</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded text-[10px]">{logs.length} eventos</span>
        </div>
        <div className="flex gap-2">
          <button onClick={clearLogs} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-[10px] uppercase font-bold">
            Limpar
          </button>
          <button onClick={toggleVisibility} className="text-gray-400 hover:text-white px-2">
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-black/50">
        {logs.length === 0 && (
          <div className="text-gray-500 text-center mt-10 italic">Nenhum log registrado.</div>
        )}
        
        {logs.map(log => (
          <div key={log.id} className="border-l-2 pl-2 py-1" style={{
            borderColor: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#eab308' : log.level === 'success' ? '#22c55e' : '#3b82f6'
          }}>
            <div className="flex gap-2 text-gray-400 text-[10px] mb-0.5">
              <span>{log.timestamp.toLocaleTimeString()}</span>
              <span className={`uppercase font-bold ${
                log.level === 'error' ? 'text-red-500' : 
                log.level === 'warn' ? 'text-yellow-500' : 
                log.level === 'success' ? 'text-green-500' : 'text-blue-500'
              }`}>{log.level}</span>
            </div>
            <div className="text-gray-200 break-words">{log.message}</div>
            {log.details && (
              <pre className="mt-1 text-gray-500 text-[9px] overflow-x-auto bg-black/30 p-1 rounded">
                {log.details}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
