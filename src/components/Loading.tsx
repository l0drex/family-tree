import './Loading.css';

export function Loading(props: {text: string, value: number, max?: number}) {
  return <div className="loading">
    <label htmlFor="progress-bar">{props.text}</label>
    <progress id="progress-bar" value={props.value} max={props.max}></progress>
  </div>
}
