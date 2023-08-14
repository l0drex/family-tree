import { GDate, getOffset, simpleToJsDate } from "../gedcomx/gedcomx-js-extensions";
import { DateTimeInput, Input } from "./GeneralComponents";
import { useState } from "react";
import { strings } from "../main";
import GedcomXDate, { DateType, Range, Recurring } from "gedcomx-date";
import { DateTime } from "luxon";

export default function DateForm({date}: {date?: GDate}) {
  let parsedDate = undefined;
  try {
    parsedDate = GedcomXDate(date?.formal);
  } catch (e) {}
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

  return <>
    <Input label={strings.gedcomX.date.form.original} name={"original"} type={"text"} defaultValue={date?.original}/>
    <label htmlFor="mode">{strings.gedcomX.date.form.mode.label}</label>
    <select id="mode" name={"mode"} onChange={e => setType(e.target.value as DateType)}
    className={"bg-white rounded-full px-4"} value={type}>
      <option value="single">{strings.gedcomX.date.form.mode.single}</option>
      <option value="range">{strings.gedcomX.date.form.mode.range}</option>
      <option value="recurring">{strings.gedcomX.date.form.mode.recurring}</option>
    </select>
    <Input label={strings.gedcomX.date.form.approximate} name={"approximate"} type="checkbox" checked={parsedDate?.isApproximate()} />
    <DateTimeInput namePrefix={"start"} label={type === "single"
      ? strings.gedcomX.date.form.date
      : strings.gedcomX.date.form.startDate} defaultValue={start} />
    {type !== "single" && <DateTimeInput namePrefix="end" label={strings.gedcomX.date.form.endDate} defaultValue={end} />}
    {type === "recurring" && <Input type={"number"} name={"count"} label={strings.gedcomX.date.form.repetitions} defaultValue={`${repetitions}`} integer/>}
  </>;
}
