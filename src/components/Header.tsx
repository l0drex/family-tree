import * as React from "react";
import {Link} from 'react-router-dom';
import {strings} from "../main";

function Header(props) {
  return (
    <header className="px-4 py-2 text-2xl flex flex-row items-center gap-4 bg-green-800 text-white drop-shadow-lg">
      <Link to="/">
        <img src={process.env.PUBLIC_URL + "/logo.svg"} width="40" height="100%" alt={strings.header.imageAlt + " 🌳"}/>
      </Link>
      <span id="title" className="font-bold">{strings.header.title}</span>
      <div className="flex-grow">
        {props.children}
      </div>
      <nav className="flex gap-2">
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
