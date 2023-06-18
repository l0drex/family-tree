import './Form.css';
import * as React from "react";
import {hasData, strings} from "../main";
import {useEffect, useState} from "react";
import {db} from "../backend/db";
import getTestData from "../backend/TestData";
import {Link, useNavigate} from "react-router-dom";

function Form(props) {
  const [focused, setFocused] = useState(false);
  const [file, setFile] = useState("");
  const [dataExists, setDataExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let familyData = localStorage.getItem("familyData");
    if (familyData) {
      db.load(JSON.parse(familyData)).then(() => setDataExists(true));
      localStorage.removeItem("familyData");
    } else hasData().then(setDataExists);
  }, [])

  let input = React.createRef<HTMLInputElement>();

  function checkDropAllowed(e) {
    e.preventDefault();
    if (e.dataTransfer.items[0] && e.dataTransfer.items[0].type === "application/json") {
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

  function loadTestData(e) {
    e.preventDefault();
    saveDataAndRedirect(getTestData(), navigate);
  }

  return (
    <form id="upload-form" encType="multipart/form-data" onSubmit={event => {
      event.preventDefault();
      parseFile(input.current.files[0]).then(t => JSON.parse(t)).then(data => saveDataAndRedirect(data, navigate));
    }}>
      <div className="card-wrapper">
        <div
          className={"card"
            + (focused ? " focused" : "")
            + (file !== "" ? " file-selected" : "")}
          onDragEnter={checkDropAllowed} onDragOver={checkDropAllowed}
          onDrop={onDrop}
          onDragLeave={removeFocus} onDragEnd={removeFocus}>
          <label htmlFor="gedcom-file">
            {strings.form.fileInputLabel}
          </label>
          <br/>
          <input type="file" id="gedcom-file" accept="application/json" onChange={(e) =>
            setFile(e.target.files[0].name)} ref={input}/>
        </div>
      </div>

      <button onClick={loadTestData}>{strings.home.uploadArticle.tryItOut}</button>
      {dataExists && <Link className="button" to="/persons">
        {strings.form.continueSession}
      </Link>}
      <input className={file === "" ? "inactive" : ""} type="submit" value={props.submit}/>
    </form>
  );
}

export async function parseFile(gedcomFile) {
  if (!gedcomFile) {
    return Promise.reject(new Error(strings.form.noFileError));
  }

  return new Promise<string>((resolve, reject) => {
    let readerGedcom = new FileReader();
    readerGedcom.onload = (file) => {
      if (typeof file.target.result === "string") {
        resolve(file.target.result);
      } else {
        reject(new Error(strings.form.graphLoadingError))
      }
    }
    readerGedcom.readAsText(gedcomFile);
  });
}

export function saveDataAndRedirect(data: object, navigate: (url: string) => void) {
  if (typeof data !== "object") throw new Error("Data type is invalid!")

  db.load(data).then(() => navigate("/persons"));
}

export default Form;
