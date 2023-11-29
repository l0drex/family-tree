import { GDate, getOffset, simpleToJsDate } from "../gedcomx/gedcomx-js-extensions";
import { DateTimeInput, Input, Search, Select } from "./GeneralComponents";
import { useState } from "react";
import { strings } from "../main";
import GedcomXDate, { DateType, Range, Recurring } from "gedcomx-date";
import { DateTime } from "luxon";
import { PlaceReference } from "gedcomx-js";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../backend/db";
import { baseUri } from "../gedcomx/types";
import * as GedcomX from "gedcomx-js";

export default function DateForm({date}: { date?: GDate }) {
  let parsedDate = undefined;
  try {
    parsedDate = GedcomXDate(date?.formal);
  } catch (e) {
  }
  const [type, setType] = useState(parsedDate?.getType() ?? "single");

  let start: DateTime = undefined;
  let end: DateTime = undefined;
  let repetitions = 0;
  switch (parsedDate?.getType()) {
    case "single":
      start = date.toDateObject().setZone("UTC" + getOffset(parsedDate));
      break;
    case "recurring":
      repetitions = (parsedDate as Recurring).getCount();
    // intentionally no break
    // noinspection FallThroughInSwitchStatementJS
    case "range":
      start = simpleToJsDate((parsedDate as Range)?.getStart())?.setZone("UTC" + getOffset(parsedDate?.getStart()));
      end = simpleToJsDate((parsedDate as Range)?.getEnd())?.setZone("UTC" + getOffset(parsedDate?.getEnd()));
      break;
  }

  const options = ["single", "range", "recurring"]
    .map(k => ({
      value: k,
      text: strings.gedcomX.date.form[k]
    }))

  return <>
    <Input label={strings.gedcomX.date.form.original} name={"original"} type={"text"} defaultValue={date?.original}/>

    <Select name={"mode"} label={strings.gedcomX.date.form.mode.label} options={options} defaultValue={type}
            onChange={e => setType(e.target.value as DateType)}/>
    <Input label={strings.gedcomX.date.form.approximate} name={"approximate"} type="checkbox"
           defaultChecked={parsedDate?.isApproximate()}/>
    <DateTimeInput namePrefix={"start"} label={type === "single"
      ? strings.gedcomX.date.form.date
      : strings.gedcomX.date.form.startDate} defaultValue={start}/>
    {type !== "single" &&
      <DateTimeInput namePrefix="end" label={strings.gedcomX.date.form.endDate} defaultValue={end}/>}
    {type === "recurring" && <Input type={"number"} name={"count"} label={strings.gedcomX.date.form.repetitions}
                                    defaultValue={`${repetitions}`} integer/>}
  </>;
}

export function PlaceForm({place}: { place: PlaceReference }) {
  const places = useLiveQuery(async () => db.places.toArray()
    .then(p => p.map(d => ({
      display: d.names[0].value ?? d.id,
      value: "#" + d.id
    }))));

  return <>
    <Input type="text" label={strings.gedcomX.date.form.original} name="original" defaultValue={place?.original}/>
    <Search name={"description"} label={strings.gedcomX.place.description} values={places}
            defaultValue={place?.description}/>
  </>
}

export function QualifierForm({qualifier, types}: { qualifier?: GedcomX.Qualifier, types: { [key: string]: string } }) {
  const options = Object.keys(types)
    .map((t, i) => ({
      value: baseUri + t,
      text: types[t]
    }))

  return <>
    <Select name={"name"} label={strings.gedcomX.qualifier.name} options={options} defaultValue={qualifier?.getName()}/>
    <Input type="text" name="value" label={strings.gedcomX.qualifier.value} defaultValue={qualifier?.getValue()} />
  </>
}
