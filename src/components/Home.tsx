import * as React from "react";
import {strings} from "../main";
import Form from "./Form";
import {Article, Details, Kbd, Main, VanillaLink} from "../App";

export function Home() {
  return <Main>
    <Uploader/>
    <NavigationTutorial/>
  </Main>;
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
      <Details title={<><span className="emoji">🗒️</span> {strings.home.uploadArticle.detailSummary}</>}>
        <p className="my-2">
          {strings.formatString(strings.home.uploadArticle.detail,
            <VanillaLink href="https://github.com/FamilySearch/gedcomx/blob/master/specifications/json-format-specification.md">
              {strings.linkContent}</VanillaLink>)}
        </p>
      </Details>
    </Article>
  );
}

function NavigationTutorial() {
  return <Article title={strings.home.navigationArticle.title} emoji="🖥">
    <p>
      {strings.formatString(strings.home.navigationArticle.content,
        <Kbd>{strings.ctrl}</Kbd>)}
    </p>
  </Article>
}

export function Imprint() {
  return <Main>
    <Article title={strings.imprint.privacyArticle.title} emoji="🔐">
      <p>
        {strings.formatString(strings.imprint.privacyArticle.content,
          <VanillaLink href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement">
            {strings.linkContent}
          </VanillaLink>)}
      </p>
    </Article>
    <Article title={strings.imprint.imprintArticle.title} emoji="📇">
      <p>
        <address>
          Hoffmann, Lorenz <br/>
          Robert-Sterl Str 5c <br/>
          01219 Dresden <br/>
          <VanillaLink href="mailto:hoffmann_lorenz@protonmail.com">hoffmann_lorenz@protonmail.com</VanillaLink>
        </address>
      </p>
    </Article>
  </Main>
}
