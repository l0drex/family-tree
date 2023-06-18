import {useEffect, useState} from "react";
import {strings} from "../main";
import {db} from "../backend/db";
import {useLiveQuery} from "dexie-react-hooks";
import * as GedcomX from "gedcomx-js";
import {Person} from "../backend/gedcomx-extensions";
import "./Form.css";

interface Props {
  onRefocus: (newFocus: GedcomX.Person) => void
}

export default function SearchField(props: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // add keyboard shortcuts
    document.addEventListener("keydown", event => {
      switch (event.key) {
        case "f":
          if (event.ctrlKey) {
            event.preventDefault();
            document.getElementById("input-name").focus()
          }
          break;
        case "Escape":
          document.querySelector<HTMLElement>(":focus").blur();
      }
    });
  }, []);

  async function refocus(event) {
    event.preventDefault();
    let name = document.querySelector<HTMLInputElement>("#input-name").value;
    if (!name) return;

    // find a person that matches the given name
    let person = await db.personWithName(name);

    // if no person was found, throw error
    setHasError(!person);
    if (!person) {
      window.alert(strings.searchField.noPersonFound);
      return;
    }

    console.log(`Assuming the person is ${person.fullName} with id ${person.getId()}`);
    props.onRefocus(person);
  }

  function resetError() {
    let name = document.querySelector<HTMLInputElement>("#input-name").value;
    if (!name) {
      setHasError(false);
    }
  }

  const persons = useLiveQuery(async () => db.persons.toArray()
    .then(persons => persons.map(p => new Person(p))))

  return (
    <form id="name-form" className="name-form search"
          onSubmit={refocus}>
      <label htmlFor="input-name" lang="en" className="sr-only">{strings.searchField.searchLabel}</label>
      <input id="input-name" list="names" type="search" placeholder={strings.searchField.searchHint} spellCheck="false"
             className={hasError ? "error" : ""}/>
      <input className="emoji icon-only" type="submit" value="🔍" onInput={resetError}/>
      {persons && <datalist id="names">
        {persons.map(p =>
          <option value={p.fullName} key={p.id}>{p.fullName}</option>)}
      </datalist>}
    </form>
  );
}
