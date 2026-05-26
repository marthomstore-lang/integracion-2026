'use client';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'rgba(236, 253, 245, 0.85)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#065f46',
          icon: '✅'
        };
      case 'error':
        return {
          background: 'rgba(254, 242, 242, 0.85)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#991b1b',
          icon: '⚠️'
        };
      case 'info':
      default:
        return {
          background: 'rgba(240, 249, 255, 0.85)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          color: '#075985',
          icon: 'ℹ️'
        };
    }
  };

  const styleConfig = getStyles();

  return (
    <div 
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        backgroundColor: styleConfig.background,
        border: styleConfig.border,
        color: styleConfig.color,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
        fontWeight: 600,
        fontSize: '0.9rem',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}
      className="no-print"
    >
      <span style={{ fontSize: '1.2rem' }}>{styleConfig.icon}</span>
      <span>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '1.1rem',
          marginLeft: '0.5rem',
          opacity: 0.6,
          transition: 'opacity 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
      >
        ×
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      ` }} />
    </div>
  );
}
