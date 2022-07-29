import Article from "./Article";
import Form from "./Form";
import * as React from "react";
import {translationToString} from "../main";

function UploadForm(props) {
  return (
    <Form submit={translationToString({
      en: "Show family tree",
      de: "Stammbaum anzeigen"
    })} onSubmit={props.onSubmit}/>
  );
}

class Uploader extends React.Component<any, any> {
  render() {
    return (
      <>
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
          <UploadForm onSubmit={this.props.onFileSelected}/>
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

          {translationToString({
            en: <p>The source code is available on <a href={"https://github.com/l0drex/family-tree"}>Github</a>.</p>,
            de: <p>Der Quellcode ist auf <a href={"https://github.com/l0drex/family-tree"}>Github</a> verfügbar.</p>
          })}
        </Article>
      </>
    );
  }
}

export default Uploader;
