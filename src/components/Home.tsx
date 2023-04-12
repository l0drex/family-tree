import * as React from "react";
import Header from "./Header";
import {strings} from "../main";
import Form from "./Form";
import "./Article.css";

export function Home() {
  return <>
    <Header/>
    <main>
      <Uploader/>
      <NavigationTutorial/>
    </main>
  </>;
}

function Uploader() {
  let root = document.getElementById("root");
  root.classList.remove("sidebar-visible");

  return (
    <Article title={strings.home.uploadArticle.title} emoji="📁">
      <p>
        {strings.home.uploadArticle.content}
      </p>
      <Form submit={strings.home.uploadArticle.openButton}/>
      <details>
        <summary><span className="emoji">🗒️</span> {strings.home.uploadArticle.detailSummary}</summary>
        <p>
          {strings.formatString(strings.home.uploadArticle.detail,
            <a href="https://github.com/FamilySearch/gedcomx/blob/master/specifications/json-format-specification.md">
              {strings.linkContent}</a>)}
        </p>
      </details>
    </Article>
  );
}

function Article(props) {
  return (
    <article lang={props.lang}>
      <h1><span className="emoji">{props.emoji}</span> {props.title}</h1>
      {props.children}
    </article>
  );
}


function NavigationTutorial() {
  return <Article title={strings.home.navigationArticle.title} emoji="🖥">
  <p>
    {strings.formatString(strings.home.navigationArticle.content,
      <kbd>{strings.ctrl}</kbd>)}
  </p>
  </Article>
}

export function Imprint() {
  return <>
    <Header/>
    <main>
      <Article title={strings.imprint.privacyArticle.title} emoji="🔐">
        <p>
          {strings.formatString(strings.imprint.privacyArticle.content,
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement">
              {strings.linkContent}
            </a>)}
        </p>
      </Article>
      <Article title={strings.imprint.imprintArticle.title} emoji="📇">
        <p>
          <address>
            Hoffmann, Lorenz <br/>
            Robert-Sterl Str 5c <br/>
            01219 Dresden <br/>
            <a href="mailto:hoffmann_lorenz@protonmail.com">hoffmann_lorenz@protonmail.com</a>
          </address>
        </p>
      </Article>
    </main>
  </>
}
