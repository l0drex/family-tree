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

export function isString(data: any): data is string {
  return typeof data === "string";
}

export interface Equals {
  equals(object: any): boolean
}

export function unique<T extends Equals>(elements: T[]): T[] {
  if (elements.length === 0) return [];

  let uniqueElements = [elements[0]];
  for (const element of elements) {
    let contained = uniqueElements.find(u => u.equals(element));
    if (!contained) uniqueElements.push(element);
  }

  return uniqueElements;
}
