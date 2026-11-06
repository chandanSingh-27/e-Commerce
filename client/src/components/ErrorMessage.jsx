import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="alert alert-error error-message-wrapper" role="alert">
      <div className="error-message-content">
        <AlertCircle size={20} className="error-icon" />
        <span className="error-text">{message}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-sm btn-secondary error-retry-btn">
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
