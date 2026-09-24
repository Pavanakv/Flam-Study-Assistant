export default function LoadingState() {
  return (
    <div className="panel center" role="status" aria-live="polite">
      <div className="spinner" />
      <p>Generating your study set…</p>
    </div>
  );
}
