import * as React from "react";
import Header from "./Header";
import {translationToString} from "../main";
import Form from "./Form";
import "./Article.css";

export default function Home() {
  return <>
    <Header/>
    <main>
      <Uploader/>
      <NavigationTutorial/>
    </main>
  </>;
}

function Uploader() {
  let root = document.getElementById("root");
  root.classList.remove("sidebar-visible");

  return (
      <Article title={translationToString({
        en: "File-Upload",
        de: "Datei-Upload"
      })} emoji="📁">
        <p>
          {translationToString({
            en: "Select the file with the button below. " +
              "Then click the green button to view the family tree.",
            de: "Wähle die Datei über den unteren Knopf aus. " +
              "Klicke dann auf den grünen Knopf, um den Stammbaum anzuzeigen."
          })}
        </p>
        <Form submit={translationToString({
          en: "Open family tree",
          de: "Stammbaum öffnen"
        })}/>
        <details>
          <summary><span className="emoji">🗒️</span> {translationToString({
            en: "From where do I get the data?",
            de: "Woher bekomme ich die Daten?"
          })}</summary>
          <p>
            {translationToString({
              en: <>The file must be a valid GedcomX file in json format,
                as described <a
                  href="https://github.com/FamilySearch/gedcomx/blob/master/specifications/json-format-specification.md">here</a></>,
              de: <>Die Datei muss eine gültige GedcomX Datei im json Format sein,
                wie <a
                  href="https://github.com/FamilySearch/gedcomx/blob/master/specifications/json-format-specification.md">hier</a> beschrieben.</>
            })}

          </p>
        </details>
      </Article>
  );
}

function Article(props) {
  return (
    <article lang={props.lang}>
      <h1><span className="emoji">{props.emoji}</span> {props.title}</h1>
      {props.children}
    </article>
  );
}


function NavigationTutorial() {
  return (
    <>
      <Article title={translationToString({
        en: "Usage",
        de: "Bedienung"
      })} emoji="🖥">
        {translationToString({
          en: <p>
            You can move the family tree with your mouse.While pressing <kbd>Ctrl</kbd>, you can zoom in and out
            with your mouse wheel.
            Select a person with your left mouse button to show their information.
            Many people have a circle with "+" or "-" inside them, clicking on those displays their relatives.
          </p>,
          de: <p>
            Man kann den Stammbaum durch Ziehen mit der Maus verschieben. Hält man <kbd>Strg</kbd> gedrückt, kann
            man mit dem Mausrad rein- bzw. rauszoomen.
            Klickt man auf eine Person werden weitere Informationen zu dieser angezeigt.
            An vielen Personen hängen Kreise, in denen "+" oder "-" steht. Klickt man auf diese, werden weitere
            Verwandte ein- oder ausgeblendet.
          </p>
        })}
      </Article>
    </>
  );
}
