import * as React from "react";
import './Header.css';
import {Link} from 'react-router-dom';
import {strings} from "../main";
import {parseFile} from "./Form";
import {saveDataAndRedirect} from "./Form";

function Header(props) {
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
      </nav>
    </header>
  );
}

export default Header;
