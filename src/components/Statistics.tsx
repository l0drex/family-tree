import "./Statistics.css";

import {Component, ReactNode} from "react";
import {baseUri} from "../backend/gedcomx-enums";
import {AreaStack, BarStackHorizontal, BarGroupHorizontal, Pie} from "@visx/shape";
import {scaleBand, scaleLinear, scaleOrdinal, scaleTime} from "@visx/scale";
import {
  getBirthPlace,
  getGenderPerGeneration, getLastNames,
  getOccupations,
  getReligionPerBirthYear
} from "../backend/StatisticsProvider";
import * as d3 from "d3";
import {LegendOrdinal} from "@visx/legend";
import {NaturalEarth} from "@visx/geo";
import {AxisRight} from "@visx/axis";

const width = 200, height = 200;
const radius = Math.min(width, height) / 2;

function Stat(props: { title: string, legend?: ReactNode, children }) {
  return <div id={props.title.toLowerCase().replace(" ", "-")} className={"graph"}>
    <h1>{props.title}</h1>
    <svg width={width} height={height}>
      {props.children}
    </svg>
    {props.legend}
  </div>
}

function GenderStats() {
  let data = getGenderPerGeneration();
  let keys = Array.from(new Set(data.map(d => Object.keys(d.gender)).flat())).map(g => g.substring(baseUri.length));
  let colorScale = scaleOrdinal({
    domain: keys,
    range: d3.schemeSet1.map(c => c.toString())
  });
  let legend = <LegendOrdinal scale={colorScale}/>

  return <Stat title="Gender" legend={legend}>
    <BarStackHorizontal
      data={data}
      keys={keys}
      xScale={scaleLinear<number>({
        domain: [0, Math.max(...data.map(d => Object.values(d.gender)
          .reduce((a, b) => a + b)))],
        range: [0, width]
      })}
      yScale={scaleBand<number>({
        domain: data.map(d => d.generation),
        range: [0, height],
        paddingInner: 0.1
      })}
      color={colorScale}
      y={d => d.generation}
      value={(d, key) => d.gender[baseUri + key] ?? 0}
      left={width / 2}
      offset="silhouette"/>
  </Stat>
}

function ReligionStats() {
  let data = getReligionPerBirthYear();
  let keysUnfiltered = Array.from(new Set(data.map(d => Object.keys(d.religion)).flat()));
  let keys = keysUnfiltered.filter(r => r !== "?");
  let colorScale = scaleOrdinal({
    domain: keys,
    range: d3.schemeCategory10.map(c => c.toString())
  });
  let legend = <LegendOrdinal scale={colorScale}/>

  let yScale = d => scaleLinear({
    domain: [0, keysUnfiltered.map(k => d.data.religion[k] ?? 0).reduce((a, b) => a + b)],
    range: [height, 0]
  });

  return <Stat title="Religion" legend={legend}>
    <AreaStack
      data={data}
      keys={keys}
      value={(d, key) => d.religion[key] ?? 0}
      color={colorScale}
      x={d => scaleTime({
        domain: [data[0].birthDecade, data[data.length - 1].birthDecade],
        range: [0, width]
      })(d.data.birthDecade)}
      y0={d => yScale(d)(d[0])}
      y1={d => yScale(d)(d[1])}
      order="ascending"
    />
  </Stat>
}

function OccupationStats() {
  let data = getOccupations();
  let colorScale = scaleOrdinal({
    domain: data.map(d => d.label),
    range: d3.schemeSet3.map(c => c.toString())
  });
  let legend = <LegendOrdinal scale={colorScale}/>

  return <Stat title="Occupation" legend={legend}>
    <Pie
      data={data}
      outerRadius={radius}
      top={height / 2}
      left={width / 2}
      pieValue={d => d.value}
      fill={d => colorScale(d.data.label)}
    />
  </Stat>;
}

function LocationStats() {
  let data = getBirthPlace();

  return <Stat title="Location">
    <NaturalEarth
      data={data}
      center={[530, -50]}
    />
  </Stat>
}

function NameStats() {
  let data = getLastNames();
  console.debug(data)
  let nameScale = scaleBand({
    domain: data.map(d => d.label),
    range: [0, height],
    paddingInner: .2
  });

  return <Stat title="Last Names">
    <BarGroupHorizontal
      data={data}
      keys={["value"]}
      color={scaleOrdinal({
        range: d3.schemeSet2.map(c => c.toString())
      })}
      width={width}
      xScale={scaleLinear({
        domain: [0, Math.max(...data.map(n => n.value))],
        range: [0, width]
      })}
      y0={d => d.label}
      y0Scale={nameScale}
      y1Scale={scaleBand<string>({
        domain: ["value"],
        range: [0, nameScale.bandwidth()]
      })}
    />
    <AxisRight
      hideAxisLine={true}
      hideTicks={true}
      scale={nameScale}
      left={-5}
    ></AxisRight>
  </Stat>
}

export default class Statistics extends Component<any, any> {
  render() {
    return <main id="stats">
      <GenderStats/>
      <ReligionStats/>
      <OccupationStats/>
      <NameStats/>
    </main>
  }
}
