import './Form.css';
import './FormInput.css';
import * as React from "react";
import {translationToString} from "../main";
import {useState} from "react";

function Form(props) {
  const [focused, setFocused] = useState(false);
  const [file, setFile] = useState("");

  let input = React.createRef<HTMLInputElement>();

  function checkDropAllowed(e) {
    e.preventDefault();
    if (e.dataTransfer.items[0].type === "application/json") {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.dropEffect = "copy";
      setFocused(true);
      return;
    }

    // block any other drop
    e.dataTransfer.effectAllowed = "none";
    e.dataTransfer.dropEffect = "none";
  }

  function onDrop(e) {
    e.preventDefault();
    setFocused(false);
    setFile(e.dataTransfer.files[0].name);
    document.querySelector<HTMLInputElement>("#gedcom-file").files = e.dataTransfer.files;
  }

  function removeFocus() {
    setFocused(false);
  }

  return (
    <form id="upload-form" encType="multipart/form-data" onSubmit={event => {
      event.preventDefault();
      parseFile(input.current.files[0]).then(props.onSubmit);
    }}>
      <div className="card-wrapper">
        <div
          className={"card"
            + (focused ? " focused" : "")
            + (file !== "" ? " file-selected" : "")}
          onDragEnter={checkDropAllowed} onDragOver={checkDropAllowed}
          onDrop={onDrop}
          onDragLeave={removeFocus} onDragEnd={removeFocus}>
          <label htmlFor="gedcom-file">{translationToString({
            en: "Gedcom File",
            de: "Gedcom Datei"
          })}</label>
          <br/>
          <input type="file" id="gedcom-file" accept="application/json" onChange={(e) =>
          setFile(e.target.files[0].name)} ref={input}/>
        </div>
      </div>

      {localStorage.getItem("familyData") && <a className="button" href="/family-tree/view">{translationToString({
        en: "Continue with last session",
        de: "Mit letzter Sitzung fortfahren"
      })}</a>}
      <input className={file === "" ? "inactive" : ""} type="submit" value={props.submit}/>
    </form>
  );
}

async function parseFile(gedcomFile) {
  if (!gedcomFile) {
    throw new Error(translationToString({
      en: "No gedcom file selected",
      de: "Keine Datei ausgewählt"
    }))
  }

  let readerGedcom = new FileReader();
  readerGedcom.onload = (file) => {
    if (typeof file.target.result === "string") {
      localStorage.setItem("familyData", file.target.result);
      return file.target.result;
    } else {
      throw new Error(translationToString({
        en: "The graph could not be loaded.",
        de: "Der Graph konnte nicht geladen werden."
      }))
    }
  }
  readerGedcom.readAsText(gedcomFile);
}

export default Form;
