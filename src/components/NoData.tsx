import {strings} from "../main";
import {Article, P, Title} from "./GeneralComponents";
import emojis from '../backend/emojies.json';

export default function NoData() {
  return <Article>
      <Title emoji={emojis.warning}>{strings.errors.title}</Title>
      <P>{strings.errors.noData}</P>
    </Article>
}
