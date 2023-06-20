import {useEffect} from "react";

export default function Sidebar(props) {
  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.add("sidebar-visible");
  }, [])

  return <aside className="overflow-y-auto overflow-x-scroll flex gap-4 portrait:flex-row landscape:flex-col flex-wrap py-4 ml-4 basis-1/4">
    {props.children}
  </aside>
}
