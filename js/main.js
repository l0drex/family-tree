import * as d3 from "https://cdn.skypack.dev/d3@4";


export const config = {
  browserLang: window.navigator.language.substr(0, 2),
  // configuration variables
  personNodeSize: [277, 30],
  // defines a virtual circle around the partner nodes (these rings) inside which links are not drawn
  partnerNodeRadius: 20
}

const supportedLanguages = ['de', 'en'];

if (typeof d3 === "undefined") {
  showError({
    en: "d3 could not be loaded. The family tree will not work.",
    de: "d3 konnte nicht geladen werden. Der Stammbaum wird nicht funktionieren!"
  }, "d3");
}

localize(config.browserLang);

/**
 * Only show elements with the correct langauge
 * @param language the language to show, e.g. window.navigator.language
 */
export function localize(language) {
  // strip country-specific stuff
  language = language.slice(0, 2);

  if (supportedLanguages.includes(language)) {
    d3.select("html").attr("lang", language);
    let lang = `:lang(${language})`;
    d3.selectAll(`[lang]:not(${lang})`).style('display', 'none');

    d3.selectAll(`[lang]${lang}`).style('display', 'revert');

    // set the page title
    document.title = translationToString({
      en: "Family tree",
      de: "Stammbaum"
    });
    d3.select("#title").html(document.title);
  } else {
    console.warn(`Language ${language} is not supported. Falling back to english.`);
    localize("en");
  }
}

/**
 * Show a warning to the user, visible in the html and in the console
 * @param message {string | object} the message to send
 * @param reason {string} the reason for the warning
 */
export function showWarning(message, reason) {
  if (typeof message === "object")
    message = translationToString(message);

  console.warn(message);

  let html = d3.select("#warning").node().content.cloneNode(true);
  html.querySelector("article").setAttribute("data-reason", reason);
  html.querySelector("article p").innerHTML = message;
  d3.select("main").node().prepend(html);
}

/**
 * Hide the warning with given reason
 * @param reason {string} the reason with which the warning shall be identified
 */
export function hideWarning(reason) {
  d3.select(`.warning[data-reason=${reason}]`).classed("hidden", true);
}

/**
 * Same as showWarning, but for errors.
 * @param message {string | object}
 * @param reason {string} the reason for the error message
 */
export function showError(message, reason) {
  if (typeof message === "object")
    message = translationToString(message);

  console.error(message);

  // NOTE: Don't use d3 here, as this is used to display and error when d3 is null!
  let html = document.querySelector("#error").content.cloneNode(true);
  html.querySelector("article").setAttribute("data-reason", reason);
  html.querySelector("article p").innerHTML = message;
  document.querySelector("main").prepend(html);
}

/**
 * Hide the error with given reason
 * @param reason {string} the reason with which the warning shall be identified
 */
export function hideError(reason) {
  d3.select(`.error[data-reason=${reason}]`).classed("hidden", true);
}

/**
 * Returns the correct translation for an translationObject
 * The translationObject maps two-letter language strings to a message string.
 * @param translationObject {object}
 * @returns {string}
 */
export function translationToString(translationObject) {
  if (!("en" in translationObject))
    console.error(`${translationObject} has no translation into english, the default language!`);

  if (!(config.browserLang in translationObject)) {
    showWarning(translationToString({
      en: "The translations might be incomplete.",
      de: "Die Übersetzungen sind möglicherweise unvollständig."
    }), "localization");
    console.debug(`${translationObject} has no translation for the currently used language!`)
    return translationObject.en;
  }
  return translationObject[config.browserLang];
}
