import * as React from "react";
import {hasData, strings} from "../main";
import {Article, ButtonLike, Details, Kbd, LayoutContext, Main, Title, VanillaLink} from "../App";
import {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {db} from "../backend/db";
import getTestData from "../backend/TestData";

export function Home() {
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="🌳">{strings.header.title}</Title>);
  }, [layoutContext])

  return <Main>
    <Uploader/>
    <NavigationTutorial/>
  </Main>;
}

function Uploader() {
  let root = document.getElementById("root");
  root.classList.remove("sidebar-visible");

  return (
    <Article title={strings.home.uploadArticle.title} emoji="📁">
      <p>
        {strings.home.uploadArticle.content}
      </p>
      <Form submit={strings.home.uploadArticle.openButton}/>
      <Details title={<><span className="emoji">🗒️</span> {strings.home.uploadArticle.detailSummary}</>}>
        <p className="my-2">
          {strings.formatString(strings.home.uploadArticle.detail,
            <VanillaLink href="https://github.com/FamilySearch/gedcomx/blob/master/specifications/json-format-specification.md">
              {strings.linkContent}</VanillaLink>)}
        </p>
      </Details>
    </Article>
  );
}

function NavigationTutorial() {
  return <Article title={strings.home.navigationArticle.title} emoji="🖥">
    <p>
      {strings.formatString(strings.home.navigationArticle.content,
        <Kbd>{strings.ctrl}</Kbd>)}
    </p>
  </Article>
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
