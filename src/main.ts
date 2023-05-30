import LocalizedStrings from "react-localization";
import * as en from "./locales/en.json";
import * as de from "./locales/de.json";
import {Conclusion, NameForm, Note, SourceCitation, TextValue} from "gedcomx-js";

export let strings = new LocalizedStrings({
  en: en,
  de: de
})

/**
 * Filter gedcomx objects that are not in the current language
 * @param object gedcomX object with a language
 */
export function filterLang(object: Note | TextValue | SourceCitation | Conclusion | NameForm) {
  return [strings.getLanguage(), "", null, undefined].includes(object.getLang());
}
