import './Article.css';

function Article(props) {
    return (
        <article lang={props.lang}>
            <h1><span className="emoji">{props.emoji}</span> {props.title}</h1>
            {props.children}
        </article>
    );
}

export default Article;
