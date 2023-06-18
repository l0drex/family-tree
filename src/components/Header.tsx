import * as React from "react";
import './Header.css';
import {Link} from 'react-router-dom';
import {strings} from "../main";

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
        <Link to="/persons">🌳</Link>
        <Link to="/stats">📊</Link>
        <Link to="/sources">📚</Link>
        <Link to="/documents">📄</Link>
        <Link to="/agents">👤</Link>
      </nav>
    </header>
  );
}

export default Header;
