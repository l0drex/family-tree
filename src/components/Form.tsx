import * as React from "react";
import {hasData, strings} from "../main";
import {useEffect, useState} from "react";
import {db} from "../backend/db";
import getTestData from "../backend/TestData";
import {Link, useNavigate} from "react-router-dom";
import {ButtonLike} from "../App";

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
    }} className="my-4">
      <div className={"rounded-2xl max-w-fit mx-auto my-4 px-4 py-2 text-center"
          + (focused ? " shadow-lg shadow-green-700" : "")
          + (file !== "" ? " bg-green-400 dark:bg-green-800" : " bg-white dark:bg-neutral-600")}
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

      <div className="flex justify-around">
        <ButtonLike>
          <button onClick={loadTestData}>{strings.home.uploadArticle.tryItOut}</button>
        </ButtonLike>
        {dataExists && <ButtonLike><Link to="/persons">
          {strings.form.continueSession}
        </Link></ButtonLike>}
        <ButtonLike enabled={!!file}>
          <input type="submit" value={props.submit}/>
        </ButtonLike>
      </div>
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
