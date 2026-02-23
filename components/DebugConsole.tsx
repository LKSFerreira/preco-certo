import React from 'react';
import { useLogger, logger } from '../services/logger';

const DebugConsole: React.FC = () => {
  const { logs, isVisible, toggleVisibility, clearLogs } = useLogger();

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 left-4 z-[9999] bg-gray-800 text-white p-2 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity"
        title="Abrir Console de Debug"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 h-1/2 bg-gray-900 border-t-2 border-verde-500 z-[9999] flex flex-col shadow-2xl animate-slide-up font-mono text-xs">
      {/* Cabeçalho */}
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center shrink-0">
        <div className="flex gap-2 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          <span className="font-bold">Console de Debug</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded text-[10px]">{logs.length} eventos</span>
        </div>
        <div className="flex gap-2">
          <button onClick={clearLogs} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-[10px] uppercase font-bold">
            Limpar
          </button>
          <button onClick={toggleVisibility} className="text-gray-400 hover:text-white px-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
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
              <span className={`uppercase font-bold ${log.level === 'error' ? 'text-red-500' :
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

export default DebugConsole;
