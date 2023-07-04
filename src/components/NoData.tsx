import {strings} from "../main";
import {Article, P, Title} from "./GeneralComponents";

export default function NoData() {
  return <Article>
      <Title emoji="⚠️">{strings.errors.title}</Title>
      <P>{strings.errors.noData}</P>
    </Article>
}
