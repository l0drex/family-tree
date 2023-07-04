import * as React from "react";
import {hasData, strings} from "../main";
import {Article, ButtonLike, Details, Kbd, P, Title, VanillaLink} from "./GeneralComponents";
import {LayoutContext, Main} from "../App";
import {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {db} from "../backend/db";
import getTestData from "../backend/TestData";

export function Home() {
  return <Main>
    <div className="flex flex-col h-full justify-center">
      <h1 className="font-bold text-5xl sm:text-6xl text-center bg-gradient-to-r from-green-900 dark:from-green-600 to-green-600 dark:to-green-300 w-fit mx-auto bg-clip-text text-transparent">Stammbaum</h1>
      <span className="text-xl sm:text-2xl text-center text-neutral-500 block mt-4">Free, private, Open Source</span>

      <Form submit={strings.home.uploadArticle.openButton}/>
    </div>
  </Main>;
}

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
      parseFile(input.current.files[0])
        .then(t => JSON.parse(t))
        .then(data => saveDataAndRedirect(data, navigate));
    }} className="mt-20 flex flex-col gap-4 items-center">
      <input type="file" id="gedcom-file" accept="application/json" hidden
             onChange={() => parseFile(input.current.files[0])
               .then(t => JSON.parse(t))
               .then(d => saveDataAndRedirect(d, navigate))}
             ref={input}/>

      <ButtonLike primary className="mb-4">
        <button onClick={loadTestData} className="px-8 py-4 text-xl min-w-max w-64">{strings.home.uploadArticle.tryItOut}</button>
      </ButtonLike>
      {dataExists && <ButtonLike><Link to="/persons" className="block px-4 py-2 min-w-max w-48 text-center">
        {strings.form.continueSession}
      </Link></ButtonLike>}
      <ButtonLike>
        <input type="submit" value={props.submit} className={`px-4 py-2 min-w-max w-48 text-center`} onClick={e => {
          e.preventDefault();
          input.current?.click();
        }}/>
      </ButtonLike>
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

export function Imprint() {
  return <Main>
    <Article title={strings.imprint.privacyArticle.title} emoji="🔐">
      <p>
        {strings.formatString(strings.imprint.privacyArticle.content,
          <VanillaLink href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement">
            {strings.linkContent}
          </VanillaLink>)}
      </p>
    </Article>
    <Article title={strings.imprint.imprintArticle.title} emoji="📇">
      <p>
        <address>
          Hoffmann, Lorenz <br/>
          Robert-Sterl Str 5c <br/>
          01219 Dresden <br/>
          <VanillaLink href="mailto:hoffmann_lorenz@protonmail.com">hoffmann_lorenz@protonmail.com</VanillaLink>
        </address>
      </p>
    </Article>
  </Main>
}
