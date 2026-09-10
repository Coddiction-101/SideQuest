export default function ProgressBar({ label, percent, detail }) {
  return <div className="progress-row">
    <div className="progress-heading"><span>{label}</span><span>{Math.floor(percent)}%</span></div>
    <div className="progress-track" role="progressbar" aria-label={`${label} elapsed`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(percent)}><span style={{ width: `${percent}%` }} /></div>
    <p>{detail}</p>
  </div>
}
