import {Link, NavLink} from "react-router-dom";
import * as React from "react";
import {useState} from "react";
import {strings} from "../main";
import {LayoutContext} from "../App";

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
  return <h1 className="font-bold text-xl dark:border-gray-400 mb-2 last:mb-0 mt-6 first:mt-0">
    <span className="font-normal">{props.emoji}</span> {props.children}</h1>
}

export function Subtitle({children}) {
  return <h2 className="font-bold text-lg mb-2 mt-6 first:mt-0">{children}</h2>
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
    if (!noHover) style += "shadow-black hover:shadow-md hover:scale-110 active:scale-105 active:shadow-sm transition-all";
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
    {props.children.length > 1 && <span className="w-full flex justify-between items-center px-4 mt-2">
      {<ButtonLike enabled={index > 0}><button className={`px-3 ${index > 0 ? "" : "hover:cursor-not-allowed"}`} onClick={() =>
        scroll(i => Math.max(0, --i))}>⬅</button></ButtonLike>}
      <span>{index + 1} / {props.children.length}</span>
      {<ButtonLike enabled={index < props.children.length - 1}><button className={`px-3 ${index < props.children.length - 1 ? "" : "hover:cursor-not-allowed"}`} onClick={() =>
        scroll(i => Math.min(props.children.length - 1, ++i))}>➡</button></ButtonLike>}
    </span>}
  </article>;
}

export function ExternalContent({children}: {children}) {
  const layoutContext = React.useContext(LayoutContext);

  if (layoutContext.allowExternalContent) return children;

  return <div className="w-full text-center bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl px-4 py-12 my-4 first:mt-0 last:mb-0">
    <ButtonLike primary><button onClick={() => layoutContext.toggleExternalContent(true)} className="px-4 py-2">{strings.externalContentButton}</button></ButtonLike>
  </div>
}
