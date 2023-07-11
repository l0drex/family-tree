import {Link, NavLink} from "react-router-dom";
import * as React from "react";
import {ReactElement, useEffect, useRef, useState} from "react";
import {strings} from "../main";

export function Article({noMargin, emoji, title, children}:
                          { noMargin?: boolean, emoji?: string, title?: string, children }) {
  return (
    <article className={`bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl p-4 w-full ${noMargin ? "" : `${title ? "mt-6" : "mt-4"} first:mt-0`} mx-auto w-full max-w-3xl`}>
      {title && <Title emoji={emoji}>{title}</Title>}
      {children}
    </article>
  );
}

export function ArticleCollection({noMargin, children}: {noMargin?: boolean, children}) {
  return <section className={`mx-auto w-full max-w-3xl ${noMargin ? "" : "mt-4 first:mt-0"}`}>
    {children}
  </section>
}

export function Title(props: { emoji: string, children }) {
  return <h1 className="font-bold text-xl dark:border-gray-400 mb-2 last:mb-0 mt-6 first:mt-0">
    <span className="font-normal">{props.emoji}</span> {props.children}</h1>
}

export function Subtitle({children}) {
  return <h2 className="font-bold text-lg mb-2 mt-6 first:mt-0">{children}</h2>
}

export function VanillaLink(props) {
  return <a className="underline" {...props}>{props.children}</a>
}

export function ReactLink(props) {
  return <Link className="underline" {...props}>{props.children}</Link>
}

export function ReactNavLink(props) {
  return <NavLink
    to={props.to}
    className="block transition-colors hover:bg-white bg-opacity-100 dark:hover:bg-opacity-10 p-2 rounded-lg">
    {props.children}
  </NavLink>
}

export function Details(props) {
  return <details className="rounded-2xl">
    <summary className="font-bold">{props.title}</summary>
    {props.children}
  </details>
}

export function ButtonLike(props: {
  enabled?: boolean,
  primary?: boolean,
  noHover?: boolean,
  className?: string,
  children?
}) {
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

export function Tag({children, bgColor}: { children, bgColor?: string }) {
  bgColor ??= "bg-white bg-opacity-50 dark:bg-opacity-10";

  return <span
    className={`inline-block rounded-full ${bgColor} w-fit px-3 py-1 text-neutral-700 dark:text-neutral-300 text-sm`}>
    {children}
  </span>
}

export function P({children}: { children }) {
  return <p className={"text-block mb-4 last:mb-0"}>{children}</p>
}

export function Hr() {
  return <hr className="border-neutral-500 mx-8"/>
}

export function Loading(props: { text: string, value?: number, max?: number }) {
  return <div className="text-center h-full py-4 px-4 flex flex-col justify-center items-center">
    <label htmlFor="progress-bar">{props.text}</label>
    <progress id="progress-bar" value={props.value} max={props.max}
              className="mt-2 rounded-full bg-white dark:bg-opacity-30"/>
  </div>
}

export function Gallery(props: { children: any[], noMargin?: boolean }) {
  const [index, scroll] = useState(0);

  return <article className={`rounded-2xl ${props.noMargin ? "" : "mt-4 first:mt-0"} mx-auto w-fit max-w-3xl`}>
    {props.children[index]}
    {props.children.length > 1 && <span className="w-full flex justify-between items-center px-4 mt-2">
      {<ButtonLike enabled={index > 0}>
        <button className={`px-3 ${index > 0 ? "" : "hover:cursor-not-allowed"}`} onClick={() =>
          scroll(i => Math.max(0, --i))}>⬅
        </button>
      </ButtonLike>}
      <span>{index + 1} / {props.children.length}</span>
      {<ButtonLike enabled={index < props.children.length - 1}>
        <button className={`px-3 ${index < props.children.length - 1 ? "" : "hover:cursor-not-allowed"}`} onClick={() =>
          scroll(i => Math.min(props.children.length - 1, ++i))}>➡
        </button>
      </ButtonLike>}
    </span>}
  </article>;
}

export function ExternalContent({children}: { children }) {
  const [allowExternalContent, toggleExternalContent] = useState(false);

  if (allowExternalContent) return children;

  return <div
    className="w-full text-center bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl px-4 py-12 my-4 first:mt-0 last:mb-0">
    <ButtonLike primary>
      <button onClick={() => toggleExternalContent(true)}
              className="px-4 py-2">{strings.externalContentButton}</button>
    </ButtonLike>
  </div>
}

export function Media({mimeType, url, alt}: { mimeType: string, url: string, alt: string }) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mediaType = mimeType.split('/');
    if (mediaType[0] !== "text") return;

    fetch(url)
      .then(r => r.text())
      .then(t => setText(t));
  }, [mimeType, url])

  let media: ReactElement;
  if (mimeType.startsWith("text")) {
    media = <p>{text}</p>
  } else {
    media = <object type={mimeType} data={url} className={`m-auto rounded-2xl my-2 max-w-full ${!loaded && "hidden"}`}
                    onLoad={() => setLoaded(true)}>
      {alt}
    </object>;
  }

  return <ExternalContent>
    {media}
    {!loaded && <div className="w-full h-full pb-8 bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl">
      <Loading text={strings.gedcomX.subject.loadingMedia}/>
    </div>}
  </ExternalContent>
}

/**
 * Button that shows a popup when clicked.
 * @constructor
 */
export function PopupButton({title, children: popupContent}) {
  const dialog = useRef<HTMLDialogElement>();

  return <>
    <button onClick={() => dialog.current?.showModal()}>{title}</button>
    <dialog ref={dialog} className="rounded-2xl">
      {popupContent}
    </dialog>
  </>
}
