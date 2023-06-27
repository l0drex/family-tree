import * as React from "react";
import {hasData, strings} from "../main";
import {useEffect, useState} from "react";
import {db} from "../backend/db";
import getTestData from "../backend/TestData";
import {Link, useNavigate} from "react-router-dom";
import {ButtonLike} from "../App";

function Form(props) {
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

  function loadTestData(e) {
    e.preventDefault();
    saveDataAndRedirect(getTestData(), navigate);
  }

  return (
    <form id="upload-form" encType="multipart/form-data" onSubmit={event => {
      event.preventDefault();
      parseFile(input.current.files[0]).then(t => JSON.parse(t)).then(data => saveDataAndRedirect(data, navigate));
    }} className="my-4">
      <input type="file" id="gedcom-file" accept="application/json" hidden
             onChange={() => parseFile(input.current.files[0])
               .then(t => JSON.parse(t))
               .then(d => saveDataAndRedirect(d, navigate))}
             ref={input}/>

      <div className="flex justify-around flex-wrap gap-2">
        <ButtonLike>
          <button onClick={loadTestData} className="px-4 py-2">{strings.home.uploadArticle.tryItOut}</button>
        </ButtonLike>
        {dataExists && <ButtonLike><Link to="/persons" className="block px-4 py-2">
          {strings.form.continueSession}
        </Link></ButtonLike>}
        <ButtonLike primary={true}>
          <input type="submit" value={props.submit} className={`px-4 py-2`} onClick={e => {
            e.preventDefault();
            input.current?.click();
          }}/>
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
