// configuration variables
const config = {
  // language to use
  browserLang: window.navigator.language.substring(0, 2),
  gridSize: 32,
  // distance between nodes
  margin: 20,
  // length of the vertical line between families (-) and their children
  personDiff: 25,
  supportedLanguages: ['de', 'en'],
  // max number of elements automatically added to the view graph; too high and it becomes slow
  // this was chosen via trial and error on Firefox on a high performant machine
  maxElements: 70
}

export default config;
