import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function MessageBanner({ message, onClose }) {
    if (!message) return null;

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        info: <Info size={20} />,
    };

    const styles = {
        success: { background: '#F0FDF4', borderColor: '#059669', color: '#065F46' },
        error: { background: '#FEF2F2', borderColor: '#DC2626', color: '#991B1B' },
        info: { background: '#EFF6FF', borderColor: '#1E40AF', color: '#1E40AF' },
    };

    return (
        <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            maxWidth: '600px',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            zIndex: 1000,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            ...styles[message.type || 'info']
        }}>
            {icons[message.type || 'info']}
            <span style={{ flex: 1, whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: '1.5' }}>
                {message.text}
            </span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: 0,
                    flexShrink: 0
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
}
