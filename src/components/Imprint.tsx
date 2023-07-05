import {LayoutContext, Main} from "../App";
import {P, Subtitle, Title} from "./GeneralComponents";
import {strings} from "../main";
import * as React from "react";
import {useEffect} from "react";

function Li({children}) {
  return <li className="mt-4">{children}</li>
}

export function Imprint() {
  const layoutContext = React.useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="🔏">{strings.imprint.title}</Title>);
  }, [layoutContext])

  return <Main>
    <article className="max-w-2xl mx-auto">
      <P>{strings.imprint.introduction}</P>
      <ol className="list-decimal">
        <Li>
          <Title emoji="📇">{strings.imprint["1"].title}</Title>
          <P>{strings.imprint["1"].content}</P>
        </Li>
        <Li>
          <Title emoji="📝">{strings.imprint["2"].title}</Title>
          <ol className="list-decimal ml-8">
            <Li>
              <Subtitle>{strings.imprint["2"].content.a.title}</Subtitle>
              <P>{strings.imprint["2"].content.a.content}</P>
            </Li>
            <Li>
              <Subtitle>{strings.imprint["2"].content.b.title}</Subtitle>
              <P>{strings.imprint["2"].content.b.content}</P>
            </Li>
            <Li>
              <Subtitle>{strings.imprint["2"].content.c.title}</Subtitle>
              <P>{strings.imprint["2"].content.c.content}</P>
            </Li>
          </ol>
        </Li>
        <Li>
          <Title emoji="🔒">{strings.imprint["3"].title}</Title>
          <P>{strings.imprint["3"].content}</P>
        </Li>
        <Li>
          <Title emoji="📜">{strings.imprint["4"].title}</Title>
          <P>{strings.imprint["4"].content}</P>
        </Li>
        <Li>
          <Title emoji="🖊️">{strings.imprint["5"].title}</Title>
          <P>{strings.imprint["5"].content}</P>
        </Li>
      </ol>
    </article>
  </Main>
}
