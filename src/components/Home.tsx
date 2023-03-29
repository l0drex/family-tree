import * as React from "react";
import Header from "./Header";
import Uploader from "./Uploader";
import NavigationTutorial from "./NavigationTutorial";

export function Home() {
  return <>
    <Header/>
    <main>
      <Uploader onFileSelected={onFileSelected}/>
      <NavigationTutorial/>
    </main>
  </>;
}

function onFileSelected(fileContent) {
  localStorage.setItem("familyData", fileContent);
  let url = new URL(window.location.href);
  url.pathname = "/family-tree/view";
  window.location.href = url.href;
}
