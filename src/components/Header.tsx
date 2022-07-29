import './Header.css';
import {Link} from 'react-router-dom';
import {translationToString} from "../main";

function Header() {
  return (
    <header>
      <Link to="/" onClick={removeData}>
        <img src={process.env.PUBLIC_URL + "/logo.svg"} width="40" height="100%" alt={translationToString({
          en: "A smiling tree.",
          de: "Ein lächelnder Baum."
        }) + " 🌳"}/>
      </Link>
      <span id="title">{translationToString({
        en: "Family tree",
        de: "Stammbaum"
      })}</span>
    </header>
  );
}

function removeData() {
  window.sessionStorage.removeItem("familyData")
}

export default Header;
