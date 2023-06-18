// configuration variables
const config = {
  gridSize: 32,
  // distance between nodes
  margin: 20,
  // length of the vertical line between families (-) and their children
  personDiff: 25,
  // max number of elements automatically added to the view graph; too high and it becomes slow
  // this was chosen via trial and error on Firefox desktop
  maxElements: 70
}

export default config;
