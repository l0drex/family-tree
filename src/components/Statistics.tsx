import "./Statistics.css";

import {Component, ReactNode} from "react";
import {baseUri} from "../backend/gedcomx-enums";
import {AreaStack, BarStackHorizontal, Pie, LineRadial} from "@visx/shape";
import {scaleBand, scaleLinear, scaleOrdinal, scaleTime, scaleLog} from "@visx/scale";
import {
  getBirthDeathMonthOverYears,
  getBirthPlace,
  getGenderPerGeneration, getNames,
  getOccupations,
  getReligionPerYear
} from "../backend/StatisticsProvider";
import * as d3 from "d3";
import {LegendOrdinal} from "@visx/legend";
import {NaturalEarth} from "@visx/geo";
import {AxisLeft, AxisBottom} from "@visx/axis";
import {GridRadial, GridAngle} from "@visx/grid";
import {Group} from "@visx/group";
import {curveLinearClosed} from "d3";
import {Wordcloud} from "@visx/wordcloud";

const width = 200, height = 200;
const radius = Math.min(width, height) / 2;

function Stat(props: { title: string, legend?: ReactNode, children, width?: number }) {
  return <div id={props.title.toLowerCase().replace(" ", "-")} className={"graph"}>
    <h1>{props.title}</h1>
    <svg width={props.width ?? width} height={height}>
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
  let generationScale = scaleBand<number>({
    domain: data.map(d => d.generation),
    range: [0, height],
    paddingInner: 0.1
  });

  let legend = <LegendOrdinal scale={colorScale} direction="row"/>

  return <Stat title="Gender" legend={legend}>
    <BarStackHorizontal
      data={data}
      keys={keys}
      xScale={scaleLinear<number>({
        domain: [0, Math.max(...data.map(d => Object.values(d.gender)
          .reduce((a, b) => a + b)))],
        range: [0, width]
      })}
      yScale={generationScale}
      color={colorScale}
      y={d => d.generation}
      value={(d, key) => d.gender[baseUri + key] ?? 0}
      left={width / 2}
      offset="silhouette"/>
    <AxisLeft
      scale={generationScale}
      left={60} hideAxisLine={true} hideTicks={true}
      label={"Generation"}
    />
  </Stat>
}

function ReligionStats() {
  let data = getReligionPerYear();
  let keysUnfiltered = Array.from(new Set(data.map(d => Object.keys(d.religion)).flat()));
  let keys = keysUnfiltered.filter(r => r !== "");
  let colorScale = scaleOrdinal({
    domain: keys,
    range: d3.schemeCategory10.map(c => c.toString())
  });
  let xScale = scaleTime({
    domain: [data[0].birthDecade, data[data.length - 1].birthDecade],
    range: [0, width * 2]
  });
  let legend = <LegendOrdinal scale={colorScale} direction="row"/>

  let yScale = d => scaleLinear({
    domain: [0, keysUnfiltered.map(k => d.data.religion[k] ?? 0).reduce((a, b) => a + b)],
    range: [height - 25, 0]
  });

  return <Stat title="Religion" legend={legend} width={width * 2}>
    <AreaStack
      data={data}
      keys={keys}
      value={(d, key) => d.religion[key] ?? 0}
      color={colorScale}
      x={d => xScale(d.data.birthDecade)}
      y0={d => yScale(d)(d[0])}
      y1={d => yScale(d)(d[1])}
      order="ascending"
    />
    <AxisBottom
      scale={xScale} top={height - 25}/>
  </Stat>
}

function OccupationStats() {
  let data = getOccupations();
  let colorScale = scaleOrdinal({
    domain: data.map(d => d.label),
    range: d3.schemeSet3.map(c => c.toString())
  });

  return <Stat title="Occupation">
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

function NameStats(props: { nameType: "First" | "Last" }) {
  let data = getNames(props.nameType);
  console.debug(data)

  const colors = scaleOrdinal({
    domain: data.map(d => d.label),
    range: d3.schemeSet2.map(c => c.toString())
  });

  return <Stat title={`${props.nameType} Names`}>
    <Wordcloud
      height={height}
      width={width}
      words={data.map(d => {
        return {text: d.label, value: d.value}
      })}
      fontSize={d => scaleLog({
        domain: [Math.min(...data.map(d => d.value)), Math.max(...data.map(d => d.value))],
        range: [5, 30]
      })(d.value)}
      padding={2}
      font={'Impact'}
      spiral="rectangular"
      rotate={0}
    >
      {cloudWords =>
        cloudWords.map(w => (
          <text
            key={w.text}
            style={{fill: colors(w.text)}}
            textAnchor={'middle'}
            transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
            fontSize={w.size}
            fontFamily={w.font}
          >
            {w.text}
          </text>
        ))
      }
    </Wordcloud>
  </Stat>
}

function BirthOverYearStats(props: { type: "Birth" | "Death" }) {
  let data = getBirthDeathMonthOverYears(props.type);
  let angleScale = scaleLinear({
    domain: [0, 12],
    range: [0, Math.PI * 2]
  })
  let radiusScale = scaleLinear({
    domain: [0, Math.max(...data)],
    range: [0, radius]
  })

  return <Stat title={`${props.type} per Month`}>
    <Group top={height / 2} left={width / 2}>
      <GridRadial scale={radiusScale}/>
      <GridAngle scale={angleScale} outerRadius={radius}/>
      <LineRadial
        data={data}
        angle={(_, i) => angleScale(i) ?? 0}
        radius={d => radiusScale(d) ?? 0}
        stroke={d3.schemeSet1[4]}
        curve={curveLinearClosed}
      />
    </Group>
  </Stat>
}

export default class Statistics extends Component<any, any> {
  render() {
    return <main id="stats">
      <GenderStats/>
      <ReligionStats/>
      <OccupationStats/>
      <NameStats nameType={"First"}/>
      <NameStats nameType={"Last"}/>
      <BirthOverYearStats type={"Birth"}/>
      <BirthOverYearStats type={"Death"}/>
    </main>
  }
}
