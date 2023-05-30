import {useEffect} from "react";

export default function Sidebar(props) {
  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.add("sidebar-visible");
  }, [])

  return <aside>{props.children}</aside>
}
