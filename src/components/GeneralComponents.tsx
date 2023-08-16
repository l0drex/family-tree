import { Form, Link, NavLink } from "react-router-dom";
import * as React from "react";
import { ReactElement, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { strings } from "../main";
import emojis from "../backend/emojies.json";
import { LayoutContext } from "../Layout";
import { DateTime } from "luxon";

export function Article({noMargin, emoji, title, onClick, children}: {
  noMargin?: boolean,
  emoji?: string,
  title?: string,
  onClick?: () => void,
  children: ReactNode
}) {
  return (
    <article
      className={`bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl p-4 w-full mx-auto max-w-3xl ${noMargin ? "" : `${title ? "mt-6" : "mt-4"} first:mt-0`}`
    + (onClick ? " hover:bg-opacity-100 hover:cursor-pointer transition-colors" : "")} onClick={onClick}>
      {title && <Title emoji={emoji}>{title}</Title>}
      {children}
    </article>
  );
}

export function ArticleCollection({noMargin, children}: { noMargin?: boolean, children }) {
  return <section className={`mx-auto w-full max-w-3xl ${noMargin ? "" : "mt-4 first:mt-0"}`}>
    {children}
  </section>
}

export function ArticleTag({children}) {
  if (!children) return <></>

  return <Tag bgColor="bg-bg-light dark:bg-bg-dark">{children}</Tag>
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

export function Tag({form, path, children, bgColor}: { children: ReactNode, bgColor?: string } & ({form: ReactNode, path: string} | {form?: never, path?: never})) {
  bgColor ??= "bg-white bg-opacity-50 dark:bg-opacity-10";

  return <span
    className={`inline-block rounded-full ${bgColor} w-fit h-min px-3 py-1 text-neutral-700 dark:text-neutral-300 text-sm`}>
    <span>
    {children}
    </span>
    {form && <>
      <EditDataButton path={path}>{form}</EditDataButton>
      <DeleteDataButton path={path}/>
    </>}
  </span>
}

export function Tags({children}: { children: ReactNode }) {
  return <section className="mx-auto w-fit flex flex-row gap-4 flex-wrap justify-center items-baseline">
    {children}
  </section>
}

export function P({children}: { children: ReactNode }) {
  return <p className={"text-block mb-4 last:mb-0"}>{children}</p>
}

export function Hr() {
  return <hr className="border-neutral-500 mx-8"/>
}

export function Loading(props: { text: string, value?: number, max?: number }) {
  return <div className="text-center h-full p-4 flex flex-col justify-center items-center">
    <label htmlFor="progress-bar">{props.text}</label>
    <progress id="progress-bar" value={props.value} max={props.max}
              className="mt-2 rounded-full bg-white dark:bg-opacity-30"/>
  </div>
}

export function Gallery(props: { children: any[], noMargin?: boolean }) {
  const [index, scroll] = useState(0);

  const flatChildren = props.children.flat();

  console.debug("children", props.children);

  return <article className={`rounded-2xl ${props.noMargin ? "" : "mt-4 first:mt-0"} mx-auto w-fit max-w-3xl`}>
    {flatChildren[index]}
    {flatChildren.length > 1 && <span className="w-full flex justify-between items-center px-4 mt-2">
      {<ButtonLike enabled={index > 0}>
        <button className={`px-3 ${index > 0 ? "" : "hover:cursor-not-allowed"}`} onClick={() =>
          scroll(i => Math.max(0, --i))}>⬅
        </button>
      </ButtonLike>}
      <span>{index + 1} / {flatChildren.length}</span>
      {<ButtonLike enabled={index < flatChildren.length - 1}>
        <button className={`px-3 ${index < flatChildren.length - 1 ? "" : "hover:cursor-not-allowed"}`} onClick={() =>
          scroll(i => Math.min(flatChildren.length - 1, ++i))}>➡
        </button>
      </ButtonLike>}
    </span>}
  </article>;
}

export function ExternalContent({children}: { children: ReactNode }) {
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
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mimeType) {
      setError(true);
      return;
    }

    let mediaType = mimeType.split('/');
    if (mediaType[0] !== "text") return;

    fetch(url)
      .then(r => r.text())
      .then(t => setText(t));
  }, [mimeType, url]);

  let media: ReactElement;
  if (mimeType?.startsWith("text")) {
    media = <p>{text}</p>
  } else {
    media = <object type={mimeType} data={url} className={`m-auto rounded-2xl my-2 max-w-full ${!loaded && "hidden"}`}
                    onLoad={() => setLoaded(true)} onError={() => setError(true)}>
      {alt}
    </object>;
  }

  // if there was an error, show it
  // else, if loaded show media
  // else show loading screen
  return <ExternalContent>
    {error ? <div className="w-full h-full pb-8 bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl">
        <p className="text-center p-4">⚠️ {strings.errors.fetchError}</p>
      </div> :
      !loaded && <div className="w-full h-full pb-8 bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl">
        <Loading text={strings.gedcomX.subject.loadingMedia}/>
      </div>}
    {media}
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
    <dialog ref={dialog} className="rounded-2xl p-4">
      {popupContent}
    </dialog>
  </>
}

export function Li({children}: { children: ReactNode }) {
  return <li className={"mb-2 last:mb-0" + children ? "" : " hidden"}>{children}</li>
}

export function DataButton({path, children, buttonLabel}: {
  path: string,
  children: ReactNode,
  buttonLabel: string
}) {
  const dialog = useRef<HTMLDialogElement>();
  const editing = useContext(LayoutContext).edit;

  if (!editing)
    return <></>

  return <>
    <button onClick={() => {
      dialog.current?.showModal();
    }} className="ml-2 first:ml-0 px-4 py-1 bg-white rounded-2xl">
      {buttonLabel}
    </button>
    <dialog ref={dialog} className="p-4 rounded-2xl">
      <Form onSubmit={() => dialog.current?.close()} method="post" action={path}>
        <div className="grid grid-cols-2 gap-2">
          {children}
        </div>
        <div className="w-full flex flex-row justify-end mt-8">
          <ButtonLike>
            <button type="submit" className="px-4 py-2">{`${emojis.save} ${strings.save}`}</button>
          </ButtonLike>
          <ButtonLike>
            <button type="button" className="px-4 py-2"
                    onClick={() => dialog.current?.close()}>{`${emojis.cancel} ${strings.cancel}`}</button>
          </ButtonLike>
        </div>
      </Form>
    </dialog>
  </>
}

export function AddDataButton({dataType, path, children}: {
  dataType: string,
  path: string,
  children: ReactNode
}) {
  return <div className="mt-2 text-center"><DataButton
    buttonLabel={`${emojis.new} ${strings.formatString(strings.addData, dataType)}`}
    path={path} children={children}/></div>
}

export function EditDataButton({path, label, children}: {
  path: string,
  label?: boolean,
  children: ReactNode
}) {
  return <DataButton buttonLabel={`${label ? `${strings.edit} ` : ""}${emojis.edit}`} path={path} children={children}/>
}

export function DeleteDataButton({path, label}: {
  path: string,
  label?: boolean
}) {
  const editing = useContext(LayoutContext).edit;

  if (!editing)
    return <></>

  return <Form method="delete" action={path} className="inline">
    <button type="submit" className="ml-2 px-4 py-1 bg-white rounded-2xl">
      {label ? `${strings.delete} ` : ""}
      {emojis.delete}
    </button>
  </Form>
}

export function EditButtons({path, label, form}: {
  path: string,
  label?: boolean,
  form: ReactNode
}) {
  return <>
    <EditDataButton path={path} label={label}>{form}</EditDataButton>
    <DeleteDataButton path={path} label={label} />
  </>
}

export function CreateNewButton({path, label}: {
  path: string,
  label: string
}) {
  const editing = useContext(LayoutContext).edit;

  if (!editing)
    return <></>

  return <Form method="post" action={path} className="mx-auto mt-4 w-fit">
    <button type="submit" className="bg-white rounded-full px-4 py-2">
      {`${emojis.new} ${label}`}
    </button>
  </Form>
}

export function Input({label, integer, ...props}: {
  type: React.HTMLInputTypeAttribute,
  label: string,
  integer?: boolean
} & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
  const id = crypto.randomUUID();

  return <>
    <label htmlFor={id}>{label}</label>
    <input id={id} className="rounded-full px-4" min={integer ? 0 : undefined} step={integer ? 1 : undefined} {...props} />
  </>
}

export function DateTimeInput({namePrefix, label, defaultValue}: {
  namePrefix: string,
  label: string,
  defaultValue?: DateTime
}) {
  const id = crypto.randomUUID();

  let datetime = defaultValue;
  const defaultDate = datetime?.toISODate()?.toString() ?? "";
  const defaultTime = datetime?.toISOTime({suppressMilliseconds: true, includeOffset: false})?.toString() ?? "";
  let offsetTime = "";
  if (datetime?.offset) {
    offsetTime = DateTime.fromObject({
      hour: Math.abs(Math.floor(datetime?.offset / 60)),
      minute: datetime?.offset % 60
    }).toISOTime({suppressSeconds: true, includeOffset: false});
  }

  return <>
    <label htmlFor={id}>{label}</label>
    <div>
      <input id={id} name={namePrefix + "-date"} type="date" defaultValue={defaultDate} className="rounded-full px-4 mr-2"/>
      <input name={namePrefix + "-time"} type="time" step={1} defaultValue={defaultTime} className="rounded-full px-4 mr-4"/>
      <select name={namePrefix + "-tz-sign"} className="bg-white px-2 py-1 mr-2 rounded-full" defaultValue={datetime?.offset > 0 ? "+" : "-"}>
        <option>+</option>
        <option>-</option>
      </select>
      <input type="time" name={namePrefix + "-tz"} defaultValue={offsetTime} className="rounded-full px-2" required />
    </div>
  </>
}

export function Search({label, values, ...props}: {
  name: string,
  label: string,
  values: { display: string, value: string }[],
  defaultValue?: string
} & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
  return <>
    <Input type="search" label={label} list={`${props.name}-list`} autoComplete="off" {...props} />
    <datalist id={`${props.name}-list`}>
      {values?.map((v, i) => <option key={i} value={v.value}>{v.display}</option>)}
    </datalist>
  </>
}
