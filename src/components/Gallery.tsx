import {useState} from "react";

interface Props {
  children
}

export function Gallery(props: Props) {
  const [index, scroll] = useState(0);

  return <article className="gallery">
    {props.children[index]}
    {props.children.length > 1 && <span className="buttons">
      {<button className="inline prev" onClick={() =>
        scroll(i => Math.max(0, i - 2 /* why 2?? */))}>⬅</button>}
      {<button className="inline next" onClick={() =>
        scroll(i => Math.min(props.children.length - 1, i + 2))}>➡</button>}
    </span>}
  </article>;
}
