// configuration variables
const config = {
  // language to use
  browserLang: window.navigator.language.substring(0, 2),
  gridSize: 32,
  // distance between nodes
  margin: 20,
  // length of the vertical line between families (-) and their children
  personDiff: 25,
  supportedLanguages: ['de', 'en']
}

export default config;
