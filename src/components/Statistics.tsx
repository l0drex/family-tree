import * as React from "react";
import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {baseUri, Confidence, GenderTypes} from "../gedcomx/types";
import {LineRadial, Pie} from "@visx/shape";
import {scaleLinear, scaleLog, scaleOrdinal} from "@visx/scale";
import {
  getBirthDeathMonthOverYears,
  getBirthPlace,
  getConfidence,
  getGenderPerGeneration,
  getLifeExpectancyOverYears,
  getMarriageAge,
  getNames,
  getOccupations,
  getReligionPerYear
} from "../backend/StatisticsProvider";
import * as d3 from "d3";
import {curveLinearClosed} from "d3";
import {NaturalEarth} from "@visx/geo";
import {GridPolar} from "@visx/grid";
import {Group} from "@visx/group";
import {Wordcloud} from "@visx/wordcloud";
import {
  AreaSeries,
  AreaStack,
  Axis,
  BarSeries,
  BarStack,
  GlyphSeries,
  Grid,
  Tooltip,
  XYChart,
  lightTheme,
  darkTheme
} from "@visx/xychart";
import {ViolinPlot} from "@visx/stats";
import {AxisLeft} from "@visx/axis";
import {hasData, strings} from "../main";
import {Legend} from "@visx/visx";
import {useLiveQuery} from "dexie-react-hooks";
import NoData from "./NoData";
import {LayoutContext, Main} from "../App";
import {Title, Loading} from "./GeneralComponents";
import emojis from "../backend/emojies.json";

const width = 200, height = 200;
const radius = Math.min(width, height) / 2;

function Stat(props: { title: string, legend?: ReactNode, landscape?: boolean, children }) {
  return <article
    className={`bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl p-4 ${props.landscape ? "col-span-2" : ""}`}>
    <h1 className="font-bold text-lg text-center mb-4">{props.title}</h1>
    <div className="mx-auto w-fit">
      {props.children}
    </div>
    {props.legend}
  </article>
}

function GenderStats() {
  const data = useLiveQuery(getGenderPerGeneration);
  const isDark = useContext(ThemeContext);

  if (!data) return <Stat title={strings.gedcomX.person.gender}>
    <Loading text={strings.statistics.loading}/>
  </Stat>

  if (data.length === 0) return <Stat title={strings.gedcomX.person.gender}>
    {strings.errors.noData}
  </Stat>

  let sorted = [GenderTypes.Female, GenderTypes.Male, GenderTypes.Intersex, GenderTypes.Unknown];
  let keys = Array.from(new Set(data.map(d => Object.keys(d.gender)).flat()))
    .sort((a, b) => sorted.indexOf(a as GenderTypes) - sorted.indexOf(b as GenderTypes));

  let legend = <Legend.LegendOrdinal scale={scaleOrdinal({
    domain: keys.map(k => strings.gedcomX.person.genderTypes[k.substring(baseUri.length)]),
    range: d3.schemeSet1.map(c => c.toString())
  })} direction={"row"} className={"flex-wrap"}/>

  return <Stat title={strings.gedcomX.person.gender} legend={legend}>
    <XYChart height={height} width={width}
             xScale={{type: "linear"}} yScale={{type: "band", padding: 0.2, reverse: true}}
             margin={{top: 0, left: 45, bottom: 0, right: 0}} theme={isDark ? darkTheme : lightTheme}>
      <BarStack offset="silhouette">
        {keys.map(key => <BarSeries
          data={data} dataKey={key} key={key}
          xAccessor={d => d.gender[key]} yAccessor={d => d.generation}
          colorAccessor={() => d3.schemeSet1[keys.indexOf(key)]}
        />)}
      </BarStack>
      <Axis orientation="left" label={strings.gedcomX.person.factTypes.GenerationNumber} hideAxisLine={true}
            hideTicks={true}/>
    </XYChart>
  </Stat>
}

function ReligionStats() {
  const isDark = useContext(ThemeContext);
  let data = useLiveQuery(getReligionPerYear);
  if (!data) return <Stat title={strings.gedcomX.person.factTypes.Religion} landscape>
    <Loading text={strings.statistics.loading}/>
  </Stat>
  if (data.length === 0) return <Stat title={strings.gedcomX.person.factTypes.Religion} landscape>
    {strings.errors.noData}
  </Stat>

  let keysUnfiltered = Array.from(new Set(data.map(d => Object.keys(d.religion)).flat()));
  let keys = keysUnfiltered.filter(r => r !== "");

  return <Stat title={strings.gedcomX.person.factTypes.Religion} landscape>
    <XYChart height={height} width={width * 2}
             xScale={{type: "time"}} yScale={{type: "linear"}}
             margin={{top: 1, left: 15, right: 0, bottom: 25}} theme={isDark ? darkTheme : lightTheme}>
      <AreaStack order="ascending">
        {keys.map(key =>
          <AreaSeries
            data={data} key={key} dataKey={key}
            xAccessor={d => d.birthDecade} yAccessor={d => d.religion[key]}/>
        )}
      </AreaStack>
      <Axis orientation="bottom"/>
      <Tooltip renderTooltip={({tooltipData}) =>
        tooltipData.nearestDatum.distance < 10 ?
          tooltipData.nearestDatum.key + ": "
          + (tooltipData.nearestDatum.datum as { religion }).religion[tooltipData.nearestDatum.key] : null
      }/>
    </XYChart>
  </Stat>
}

// todo make these usable

// eslint-disable-next-line
function OccupationStats() {
  let data = useLiveQuery(getOccupations);
  let colorScale = scaleOrdinal({
    domain: data.map(d => d.value),
    range: d3.schemeSet3.map(c => c.toString())
  });

  return <Stat title={strings.gedcomX.person.factTypes.Occupation}>
    <svg width={width} height={height}>
      <Pie
        data={data}
        outerRadius={radius}
        top={height / 2}
        left={width / 2}
        pieValue={d => d.count}
        fill={d => colorScale(d.data.value)}
      />
    </svg>
  </Stat>;
}

// eslint-disable-next-line
function LocationStats() {
  let data = useLiveQuery(getBirthPlace);

  return <Stat title={strings.gedcomX.person.factTypes.Heimat}>
    <NaturalEarth
      data={data}
      center={[530, -50]}
    />
  </Stat>
}

function NameStats(props: { nameType: "First" | "Last" }) {
  let data = useLiveQuery(async () => getNames(props.nameType), [props.nameType]);
  const title = props.nameType === "First" ? strings.gedcomX.person.firstName : strings.gedcomX.person.namePartTypes.Surname;

  if (!data) return <Stat title={title}>
    <Loading text={strings.statistics.loading}/>
  </Stat>
  if (data.length === 0) return <Stat title={title}>
    {strings.errors.noData}
  </Stat>

  const colors = scaleOrdinal({
    domain: data.map(d => d.value),
    range: d3.schemeSet2.map(c => c.toString())
  });

  return <Stat title={title}>
    <Wordcloud
      height={height}
      width={width}
      words={data.map(d => {
        return {text: d.value.toString(), value: d.count}
      })}
      fontSize={d => scaleLog({
        domain: [Math.min(...data.map(d => d.count)), Math.max(...data.map(d => d.count))],
        range: [5, 30]
      })(d.value)}
      padding={2}
      font={'Impact'}
      spiral="rectangular"
      rotate={0}>
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
  let data = useLiveQuery(async () => getBirthDeathMonthOverYears(props.type), [props.type]);
  const isDark = useContext(ThemeContext);
  const title = props.type === "Birth" ? strings.statistics.birth_month : strings.statistics.death_month;

  if (!data) return <Stat title={title}>
    <Loading text={strings.statistics.loading}/>
  </Stat>
  if (data.length === 0) return <Stat title={title}>
    {strings.errors.noData}
  </Stat>

  let angleScale = scaleLinear({
    domain: [0, 12],
    range: [0, Math.PI * 2]
  })
  let radiusScale = scaleLinear({
    domain: [0, Math.max(...data)],
    range: [0, radius]
  })

  const strokeColor = isDark ? "#868686" : "#afafaf";

  return <Stat title={title}>
    <svg height={height} width={width}>
      <Group top={height / 2} left={width / 2}>
        <GridPolar scaleAngle={angleScale} scaleRadial={radiusScale} outerRadius={radius}
                   lineStyleRadial={{stroke: strokeColor}} lineStyleAngle={{stroke: strokeColor}}/>
        <LineRadial
          data={data}
          angle={(_, i) => angleScale(i) ?? 0}
          radius={d => radiusScale(d) ?? 0}
          stroke={d3.schemeSet1[4]}
          strokeWidth={2}
          curve={curveLinearClosed}
        />
      </Group>
    </svg>
  </Stat>
}

function LifeExpectancy() {
  const isDark = useContext(ThemeContext);
  let data = useLiveQuery(getLifeExpectancyOverYears);
  if (!data) return <Stat title={strings.statistics.lifeExpectancy} landscape>
    <Loading text={strings.statistics.loading}/>
  </Stat>
  if (data.length === 0) return <Stat title={strings.statistics.lifeExpectancy} landscape>
    {strings.errors.noData}
  </Stat>

  return <Stat title={strings.statistics.lifeExpectancy} landscape>
    <XYChart height={height} width={width * 2 + 60} xScale={{type: "time"}} yScale={{type: "linear"}}
             margin={{top: 5, left: 30, bottom: 25, right: 5}} theme={isDark ? darkTheme : lightTheme}>
      <Grid/>
      <GlyphSeries data={data} dataKey={"Line 1"} xAccessor={d => d.birth} yAccessor={d => d.age}/>
      <Tooltip renderTooltip={({tooltipData}) =>
        (tooltipData.nearestDatum.datum as { name }).name}/>
      <Axis orientation={"bottom"}/>
      <Axis orientation={"left"}/>
    </XYChart>
  </Stat>
}

function MarriageAge() {
  const isDark = useContext(ThemeContext);
  let data = useLiveQuery(getMarriageAge);
  if (!data) return <Stat title={strings.statistics.marriageAge}>
    <Loading text={strings.statistics.loading}/>
  </Stat>
  if (data.length === 0) return <Stat title={strings.statistics.marriageAge}>
    {strings.errors.noData}
  </Stat>

  let yScale = scaleLinear({
    domain: [Math.min(...data.map(d => Number(d.value))), Math.max(...data.map(d => Number(d.value)))],
    range: [height, 0]
  })

  console.debug(lightTheme.axisStyles.y.left.tickLabel);

  return <Stat title={strings.statistics.marriageAge}>
    <svg height={height} width={width}>
      <ViolinPlot valueScale={yScale} data={data} fill={"#6ca5e5"} width={width}/>
      <AxisLeft
        scale={yScale} left={25}
        stroke={isDark ? darkTheme.axisStyles.y.left.axisLine.stroke : lightTheme.axisStyles.y.left.axisLine.stroke}
        tickStroke={isDark ? darkTheme.axisStyles.y.left.tickLine.stroke : lightTheme.axisStyles.y.left.tickLine.stroke}
        tickLabelProps={{
          style: isDark ? darkTheme.axisStyles.y.left.tickLabel.style : lightTheme.axisStyles.y.left.tickLabel.style,
          fill: isDark ? darkTheme.axisStyles.y.left.tickLabel.fill : lightTheme.axisStyles.y.left.tickLabel.fill,
        }}
      />
    </svg>
  </Stat>
}

function ConfidenceStats() {
  let data = useLiveQuery(getConfidence);
  if (!data) return <Stat title={strings.gedcomX.conclusion.confidence}>
    <Loading text={strings.statistics.loading}/>
  </Stat>
  if (data.length === 0) return <Stat title={strings.gedcomX.conclusion.confidence}>
    {strings.errors.noData}
  </Stat>

  console.debug(data);

  let colorScale = scaleOrdinal({
    domain: [Confidence.Low, Confidence.Medium, Confidence.High],
    range: d3.schemeRdYlGn[3].map(c => c.toString())
  });

  return <Stat title={strings.gedcomX.conclusion.confidence}>
    <svg width={width} height={height}>
      <Pie
        data={data}
        outerRadius={radius}
        top={height / 2}
        left={width / 2}
        pieValue={d => d.count}
        fill={d => d.data.value === "null" || d.data.value === "undefined" ? "none" : colorScale(d.data.value as Confidence)}
        stroke={"var(--background)"}
        strokeWidth={".2rem"}
      />
    </svg>
  </Stat>
}

const ThemeContext = createContext(false);

export default function Statistics() {
  const [dataExists, setDataExists] = useState(false);
  const layoutContext = useContext(LayoutContext);
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const [isDark, toggleDark] = useState(darkQuery.matches);
  darkQuery.addEventListener("change", e => toggleDark(e.matches));

  useEffect(() => {
    hasData().then(value => setDataExists(value));
  });

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.stats}>
      {strings.statistics.title}
    </Title>);
    layoutContext.setRightTitle("");
  }, [layoutContext]);

  return <>
      <Main skipCleanup>
        {dataExists ?
          <ThemeContext.Provider value={isDark}>
            <div className="grid grid-flow-dense gap-4 justify-stretch sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <ConfidenceStats/>
              <GenderStats/>
              <ReligionStats/>
              <NameStats nameType={"First"}/>
              <NameStats nameType={"Last"}/>
              <BirthOverYearStats type={"Birth"}/>
              <BirthOverYearStats type={"Death"}/>
              <LifeExpectancy/>
              <MarriageAge/>
            </div>
          </ThemeContext.Provider> : <NoData/>}
      </Main>
  </>
}
