/** Shown instantly while an admin page loads, so menu taps respond right away. */
export default function Loading() {
  return (
    <div className="hl-skeleton" aria-busy="true" aria-label="Loading">
      <div className="hl-skel-title" />
      <div className="hl-skel-kpis">
        {[0, 1, 2, 3].map((i) => <div key={i} className="hl-skel-card" />)}
      </div>
      <div className="hl-skel-list">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="hl-skel-row">
            <span className="hl-skel-dot" />
            <span className="hl-skel-line" style={{ width: `${70 - i * 7}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
