import * as React from "react";
import './Header.css';
import {Link} from 'react-router-dom';
import {strings} from "../main";
import {parseFile} from "./Form";
import {saveDataAndRedirect} from "./Form";

function Header(props) {
  let fileInput = React.createRef<HTMLInputElement>();

  return (
    <header>
      <Link to="/">
        <img src={process.env.PUBLIC_URL + "/logo.svg"} width="40" height="100%" alt={strings.header.imageAlt + " 🌳"}/>
      </Link>
      <span id="title">{strings.header.title}</span>
      <div>
        {props.children}
      </div>
      <nav>
        <a href="/family-tree/view">🌳</a>
        <a href="/family-tree/stats">📊</a>
        <form id="open-file">
          <input type="file" hidden ref={fileInput} accept="application/json"
                 onChange={() => parseFile(fileInput.current.files[0]).then(saveDataAndRedirect)}/>
          <button className="icon-only" onClick={e => {
            e.preventDefault();
            fileInput.current.click();
          }}>📁
          </button>
        </form>
      </nav>
    </header>
  );
}

export default Header;
