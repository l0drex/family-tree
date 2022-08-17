import * as d3 from "d3";
import "./Statistics.css";

import {Component} from "react";
import {GenderTypes, PersonFactTypes} from "../backend/gedcomx-enums";
import {graphModel} from "../backend/ModelGraph";

function renderGenderStats(width, height, radius) {
  let svg = d3.select("#gender svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)

  const data = [GenderTypes.Female, GenderTypes.Male, GenderTypes.Intersex, GenderTypes.Unknown];
  let color = d3.scaleOrdinal()
    .domain(data)
    .range(d3.schemeSet1)

  let pie = d3.pie()
    .value(g => graphModel.persons
      .filter(p => p.getGender().getType() === g)
      .length)

  let data_ready = pie(data);

  svg.selectAll('path').data(data_ready)
    .enter()
    .append('path')
    .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(radius))
    .attr('fill', d => color(d.data))
}

function renderReligionStats(width, height, radius) {
  let svg = d3.select("#religion svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)

  const data = Array.from(new Set(graphModel.persons.map(p => {
    let fact = p.getFactsByType(PersonFactTypes.Religion)[0];
    if (fact === undefined) return undefined;
    return fact.getValue()
  })));
  let color = d3.scaleOrdinal()
    .domain(data)
    .range(d3.schemeTableau10)

  let pie = d3.pie()
    .value(g => graphModel.persons
      .filter(p => {
        let fact = p.getFactsByType(PersonFactTypes.Religion)[0];
        if (fact) return fact.getValue() === g;
        return false;
      })
      .length)

  let data_ready = pie(data);

  svg.selectAll('path').data(data_ready)
    .enter()
    .append('path')
    .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(radius))
    .attr('fill', d => color(d.data))
}

function renderJobStats(width, height, margin) {
  let svg = d3.select("#occupation svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${100},${margin})`)

  let counter: { [key: string]: number } = {};
  graphModel.persons.forEach(p => {
    let fact = p.getFactsByType(PersonFactTypes.Occupation)[0]
    if (fact === undefined) return;
    let occupation = fact.getValue();

    if (occupation in counter) counter[occupation]++;
    else counter[occupation] = 1;
  })
  let data = Object.keys(counter).map(j => {
    return {
      name: j,
      value: counter[j]
    }
  })

  let x = d3.scaleLinear()
    .domain([0, Math.max(...Object.values(counter))])
    .range([0, width]);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")

  let y = d3.scaleBand()
    .range([0, height])
    .domain(Object.keys(counter).sort((a,b) => counter[b] - counter[a]))
    .padding(.3)
  svg.append("g")
    .call(d3.axisLeft(y))

  svg.selectAll("rect")
    .data(data).enter()
    .append("rect")
    .attr("x", x(0))
    .attr("y", d => y(d.name))
    .attr("width", d => x(d.value))
    .attr("height", y.bandwidth())
    .attr("fill", "var(--primary)")
}

export default class Statistics extends Component<any, any> {

  render() {
    return <main id="stats">
      <div id="gender" className={"graph"}>
        <h1>Gender</h1>
        <svg></svg>
      </div>
      <div id="religion" className={"graph"}>
        <h1>Religion</h1>
        <svg></svg>
      </div>
      <div id="occupation" className={"graph"}>
        <h1>Occupation</h1>
        <svg></svg>
      </div>
    </main>
  }

  componentDidMount() {
    const width = 300, height = 300, margin = 40;

    const radius = Math.min(width, height) / 2 - margin;
    renderGenderStats(width, height, radius);
    renderReligionStats(width, height, radius);
    renderJobStats(width, height, margin);
  }
}
