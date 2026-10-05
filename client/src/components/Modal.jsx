import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] animate-[fadeInUp_0.18s_ease-out] ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
        style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <h2 className="font-serif font-semibold text-base" style={{ color: '#F5F0E8' }}>{title}</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(245,240,232,0.68)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; e.currentTarget.style.background = 'transparent'; }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
