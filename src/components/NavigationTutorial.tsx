import Article from "./Article";
import {translationToString} from "../main";

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
            Man kann den Stammbaum durch Ziehen mit der Maus verschieben.Hält man <kbd>Strg</kbd> gedrückt, kann
            man mit dem
            Mausrad rein- bzw. rauszoomen.
            Klickt man auf eine Person werden weitere Informationen zu dieser angezeigt.
            An vielen Personen hängen Kreise, in denen "+" oder "-" steht. Klickt man auf diese, werden weitere
            Verwandte
            ein- oder ausgeblendet.
          </p>
        })}
      </Article>
    </>
  );
}

export default NavigationTutorial;
