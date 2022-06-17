import {Component} from "react";
import {translationToString} from "../main";
import {graphModel} from "../backend/ModelGraph";

class SearchField extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false
    }
  }

  render() {
    return (
      <form id="name-form" className="name-form search"
            onSubmit={this.refocus.bind(this)}>
        <label htmlFor="input-name" lang="en" className="sr-only">{translationToString({
          en: "Name:",
          de: "Name:"
        })}</label>
        <input id="input-name" list="names" type="search" placeholder={translationToString({
          en: "Name",
          de: "Name"
        })} spellCheck="false" className={this.state.hasError ? "error" : ""}
               defaultValue={this.props.person.getFullName()}/>
        <input className="emoji" type="submit" value="🔍" onInput={this.resetError}/>
        <datalist id="names">
          {
            graphModel.persons.map(p =>
              <option value={p.data.getFullName()} key={p.data.id}>{p.data.getFullName()}</option>
            )
          }
        </datalist>
      </form>
    );
  }

  componentDidMount() {
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
  }

  refocus(event) {
    event.preventDefault();
    let name = document.querySelector<HTMLInputElement>("#input-name").value;
    if (name) {
      // find a person that matches the given name
      let person = graphModel.findByName(name.toLowerCase());

      // if no person was found, throw error
      this.setState({hasError: !person});
      if (!person) {
        window.alert(translationToString({
          en: "No person with that name found!",
          de: "Es konnte keine Person mit diesem Namen gefunden werden!"
        }));
        return;
      }

      console.log(`Assuming the person is ${person.data.getFullName()} with id ${person.data.id}`);
      this.props.onRefocus(person);
    }
  }

  resetError() {
    let name = document.querySelector<HTMLInputElement>("#input-name").value;
    if (!name) {
      this.setState({hasError: false});
    }
  }
}

export default SearchField;
