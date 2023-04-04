import {useEffect, useState} from "react";
import {strings} from "../main";
import {graphModel} from "../backend/ModelGraph";
import {Person} from "gedcomx-js";

interface Props {
  onRefocus: (newFocus: Person) => void
}

function SearchField(props: Props) {
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

  function refocus(event) {
    event.preventDefault();
    let name = document.querySelector<HTMLInputElement>("#input-name").value;
    if (name) {
      // find a person that matches the given name
      let person = graphModel.getPersonByName(name.toLowerCase());

      // if no person was found, throw error
      setHasError(!person);
      if (!person) {
        window.alert(strings.searchField.noPersonFound);
        return;
      }

      console.log(`Assuming the person is ${person.getFullName()} with id ${person.getId()}`);
      props.onRefocus(person);
    }
  }

  function resetError() {
    let name = document.querySelector<HTMLInputElement>("#input-name").value;
    if (!name) {
      setHasError(false);
    }
  }

  return (
    <form id="name-form" className="name-form search"
          onSubmit={refocus}>
      <label htmlFor="input-name" lang="en" className="sr-only">{strings.searchField.searchLabel}</label>
      <input id="input-name" list="names" type="search" placeholder={strings.searchField.searchHint} spellCheck="false" className={hasError ? "error" : ""}/>
      <input className="emoji icon-only" type="submit" value="🔍" onInput={resetError}/>
      <datalist id="names">
        {
          graphModel.persons.map(p =>
            <option value={p.getFullName()} key={p.getId()}>{p.getFullName()}</option>
          )
        }
      </datalist>
    </form>
  );
}

export default SearchField;
