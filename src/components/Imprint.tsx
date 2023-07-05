import {Main} from "../App";
import {Article, VanillaLink} from "./GeneralComponents";
import {strings} from "../main";
import * as React from "react";

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
