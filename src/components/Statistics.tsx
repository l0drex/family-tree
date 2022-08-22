import * as d3 from "d3";
import "./Statistics.css";

import {Component} from "react";
import {GenderTypes, PersonFactTypes} from "../backend/gedcomx-enums";
import {graphModel} from "../backend/ModelGraph";
import {BarStackHorizontal, Pie} from "@visx/shape";
import {scaleBand, scaleLinear, scaleOrdinal} from "@visx/scale";

/**
 * Counts how many of each value is in the array
 * @param array
 */
function count(array: string[]): { label: string; value: number }[] {
  let counter = {}
  array.forEach(key => {
    if (key in counter) {
      counter[key]++;
    } else {
      counter[key] = 1;
    }
  });

  return Object.keys(counter).map(k => {
    return {
      label: k,
      value: counter[k]
    }
  });
}

const width = 200, height = 200, padding = 0;
const radius = Math.min(width, height) / 2;

function Stat(props: { title: string, children }) {
  return <div id={props.title.toLowerCase().replace(" ", "-")} className={"graph"}>
    <h1>{props.title}</h1>
    <svg width={width} height={height}>
      {props.children}
    </svg>
  </div>
}

function getGenderPerGeneration() {
  let data: { [generation: string]: {[gender: string]: number} } = {};

  graphModel.persons.forEach(p => {
    let genFact = p.getFactsByType(PersonFactTypes.Generation)[0];
    let generation;
    try {
      generation = genFact.getValue();
    } catch (e) {
      return;
    }
    if (!(generation in data)) {
      data[generation] = {};
    }

    let gender = p.getGender().getType() ?? GenderTypes.Unknown;
    if (gender in data[generation]) {
      data[generation][gender]++;
    } else {
      data[generation][gender] = 1;
    }
  })

  return Object.keys(data).map(key => {
    return {
      generation: key,
      gender: data[key]
    }
  })
}

function GenderStats() {
  let data = getGenderPerGeneration();
  console.debug(data)

  let keys = [GenderTypes.Female, GenderTypes.Male, GenderTypes.Intersex];

  return <Stat title="Gender">
    <BarStackHorizontal
      data={data}
      keys={keys}
      xScale={scaleLinear<number>({
        domain: [0, Math.max(...data.map(d => Object.values(d.gender)
          .reduce((a, b) => a + b)))],
        range: [0, width],
        nice: true
      })}
      yScale={scaleBand<string>({
        domain: data.map(d => d.generation),
        range: [0, height],
        paddingInner: 5
      })}
      color={scaleOrdinal({
        domain: keys,
        range: d3.schemeSet1.map(e => e.toString())
      })}
      y={d => d.generation}
      value={(d, key) => d.gender[key] ?? 0}
      left={width/2}
      offset="wiggle"/>
  </Stat>
}

export default class Statistics extends Component<any, any> {
  render() {
    let religionData = count(graphModel.persons.map(p => {
      let fact = p.getFactsByType(PersonFactTypes.Religion)[0];
      if (fact === undefined) return undefined;
      else return fact.getValue();
    }));

    return <main id="stats">
      <GenderStats/>
      <Stat title="Religion">
        <Pie
          data={religionData}
          top={height / 2}
          left={width / 2}
          pieValue={d => d.value}
          outerRadius={radius}
          fill={d => scaleOrdinal<string, string>({
            domain: religionData.map(d => d.label),
            range: d3.schemeSet2.map(e => e.toString())
          })(d.data.label)}/>
      </Stat>
      <Stat title="Occupation">
        <Pie></Pie>
      </Stat>
    </main>
  }
}
