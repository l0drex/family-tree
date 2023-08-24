import {useRouteError} from "react-router-dom";
import {Article, Details, Title} from "./GeneralComponents";
import {LayoutContext, Main} from "../Layout";
import {strings} from "../main";
import {useContext, useEffect} from "react";
import emojis from '../backend/emojies.json';

export default function ErrorBoundary() {
  const error = useRouteError() as Error;
  const layoutContext = useContext(LayoutContext);
  console.error(error);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.error}>{strings.errors.title}</Title>);
  }, [error, layoutContext]);

  return <Main>
    <Article emoji={emojis.error} title={error.message}>
      <Details title={strings.errors.stack}>
        <output className="font-mono text-neutral-700 dark:text-neutral-300">{error.stack}</output>
      </Details>
    </Article>
  </Main>
}
