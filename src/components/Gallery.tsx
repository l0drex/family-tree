import {useState} from "react";

interface Props {
  children
  noMargin?: boolean
}

export function Gallery(props: Props) {
  const [index, scroll] = useState(0);

  return <article className={`rounded-2xl ${props.noMargin ? "" : "mt-4 first:mt-0"} mx-auto w-fit max-w-3xl`}>
    {props.children[index]}
    {props.children.length > 1 && <span className="buttons">
      {<button className="inline prev" onClick={() =>
        scroll(i => Math.max(0, i - 2 /* why 2?? */))}>⬅</button>}
      {<button className="inline next" onClick={() =>
        scroll(i => Math.min(props.children.length - 1, i + 2))}>➡</button>}
    </span>}
  </article>;
}
