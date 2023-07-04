import {Link, NavLink} from "react-router-dom";
import * as React from "react";
import {useState} from "react";

export function Article(props) {
  let other = {};
  Object.assign(other, props);
  delete other["noMargin"];

  return (
    <article
      className={`bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl ${props.noMargin ? "" : "mt-4 first:mt-0"} mx-auto p-4 w-full max-w-3xl`} {...other}>
      {props.title && <Title emoji={props.emoji}>{props.title}</Title>}
      {props.children}
    </article>
  );
}

export function Title(props: { emoji: string, children }) {
  return <h1 className="font-bold text-xl dark:border-gray-400 mb-2 last:mb-0">
    <span className="font-normal">{props.emoji}</span> {props.children}</h1>
}

export function Kbd(props) {
  return <kbd
    className="bg-gray-200 dark:bg-neutral-600 rounded-lg p-1 border-b-2 border-b-gray-400">{props.children}</kbd>
}

export function VanillaLink(props) {
  return <a className="underline" {...props}>{props.children}</a>
}

export function ReactLink(props) {
  return <Link className="underline" {...props}>{props.children}</Link>
}

export function ReactNavLink(props) {
  return <NavLink to={props.to}
                  className="block transition-colors hover:bg-white bg-opacity-100 dark:hover:bg-opacity-10 p-2 rounded-lg">{props.children}</NavLink>
}

export function Details(props) {
  return <details className="rounded-2xl">
    <summary className="font-bold">{props.title}</summary>
    {props.children}
  </details>
}

export function ButtonLike(props: { enabled?: boolean, primary?: boolean, noHover?: boolean, className?: string, children? }) {
  const enabled = props.enabled ?? true;
  const primary = props.primary ?? false;
  const noHover = props.noHover ?? false;

  let style: string;
  if (enabled) {
    style = "cursor-pointer";
    if (!noHover) style += "hover:shadow-md hover:scale-110 active:scale-105 active:shadow-sm transition-all";
    if (primary) style += " bg-green-700 text-white";
    else style += " bg-white dark:bg-neutral-500";
  } else {
    style = "border-green-700 border-2 cursor-not-allowed";
  }

  return <div
    className={`inline-block rounded-full max-w-fit max-h-fit mx-2 ${style} ` + props.className}>
    {props.children}
  </div>
}

export function Tag({children}) {
  return <span
    className="inline-block rounded-full bg-white bg-opacity-50 dark:bg-opacity-10 w-fit px-4 py-1 text-neutral-700 dark:text-neutral-300 text-sm">
    {children}
  </span>
}

export function P({noMargin, children}: { noMargin?: boolean, children }) {
  return <p className={"text-block " + (noMargin ? "" : "mb-4 last:mb-0")}>{children}</p>
}

export function Hr() {
  return <hr className="border-neutral-500 mx-8"/>
}

export function Gallery(props: { children: any[], noMargin?: boolean }) {
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
