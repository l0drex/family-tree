import './Form.css';
import './FormInput.css';
import {Component} from "react";
import * as React from "react";
import {translationToString} from "../main";

class Form extends Component<any, any> {
  public input: React.RefObject<HTMLInputElement>;

  constructor(props) {
    super(props);
    this.state = {
      focused: false,
      file: ""
    }
    this.input = React.createRef();
  }

  render() {
    return (
      <form id="upload-form" encType="multipart/form-data" onSubmit={this.onSubmit.bind(this)}>
        <div className="card-wrapper">
          <div
            className={"card"
              + (this.state.focused ? " focused" : "")
              + (this.state.file !== "" ? " file-selected" : "")}
            onDragEnter={this.checkDropAllowed.bind(this)} onDragOver={this.checkDropAllowed.bind(this)}
            onDrop={this.onDrop.bind(this)}
            onDragLeave={this.removeFocus.bind(this)} onDragEnd={this.removeFocus.bind(this)}>
            <label htmlFor="gedcom-file">{translationToString({
              en: "Gedcom File",
              de: "Gedcom Datei"
            })}</label>
            <br/>
            <input type="file" id="gedcom-file" accept="application/json" onChange={(e) =>
              this.setState({file: e.target.files[0].name})} ref={this.input}/>
          </div>
        </div>

        <input type="submit" value={this.props.submit}/>
      </form>
    );
  }

  checkDropAllowed(e) {
    e.preventDefault();
    if (e.dataTransfer.items[0].type === "application/json") {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.dropEffect = "copy";
      this.setState({
        focused: true
      });
      return;
    }

    // block any other drop
    e.dataTransfer.effectAllowed = "none";
    e.dataTransfer.dropEffect = "none";
  }

  onDrop(e) {
    e.preventDefault();
    this.setState({
      focused: false,
      file: e.dataTransfer.files[0].name
    });
    document.querySelector<HTMLInputElement>("#gedcom-file").files = e.dataTransfer.files;
  }

  removeFocus() {
    this.setState({
      focused: false
    })
  }

  onSubmit(event) {
    event.preventDefault();

    // load data from the file
    let gedcomFile = this.input.current.files[0];

    if (!gedcomFile) {
      throw new Error(translationToString({
        en: "No gedcom file selected",
        de: "Keine Datei ausgewählt"
      }))
    }

    let readerGedcom = new FileReader();
    readerGedcom.onload = (file) => {
      if (typeof file.target.result === "string") {
        sessionStorage.setItem("familyData", file.target.result);
        this.props.onSubmit(file.target.result);
      } else {
        throw new Error(translationToString({
          en: "The graph could not be loaded.",
          de: "Der Graph konnte nicht geladen werden."
        }))
      }
    }
    readerGedcom.readAsText(gedcomFile);
  }
}

export default Form;
