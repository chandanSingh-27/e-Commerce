export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'loader-sm',
    md: 'loader-md',
    lg: 'loader-lg',
  };

  const selectedSizeClass = sizeClasses[size] || 'loader-md';

  return (
    <div className="loader-container">
      <div className={`spinner ${selectedSizeClass}`} aria-label="Loading spinner"></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
