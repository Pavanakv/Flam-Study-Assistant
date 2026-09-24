export default function ErrorState({ message, onRetry }) {
  return (
    <div className="panel center error" role="alert">
      <p><strong>Something went wrong.</strong></p>
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
