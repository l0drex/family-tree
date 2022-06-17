/**
 * Only show elements with the correct langauge
 * @param language the language to show, e.g. window.navigator.language
 */
import config from "./config";

export function localize(language) {
    // strip country-specific stuff
    language = language.slice(0, 2);

    if (config.supportedLanguages.includes(language)) {
        document.querySelector("html").setAttribute("lang", language)
        // set the page title
        document.title = document.querySelector("#title").innerHTML;
    } else {
        console.warn(`Language ${language} is not supported. Falling back to english.`);
        localize("en");
    }
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
        console.debug(`${translationObject} has no translation for the currently used language!`)
        return translationObject.en;
    }
    return translationObject[config.browserLang];
}
