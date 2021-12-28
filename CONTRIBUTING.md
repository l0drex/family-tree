# Codestyle

When you create a pull request, make sure to follow the following styling guidelines:

## General

Follow the rules of `.editorconfig` (should be automatically applied by your editor):
1. Encode your code in utf-8
2. Indentations should be 2 whitespace
3. End files with a new line
4. Don't end your lines with whitespaces

## JavaScript code style

1. Use semicolons at end of lines
2. Package functionality in functions
3. Provide documentation on every named function
4. Write comments where necessary
5. Use camelCase in all variable and function names
6. Write lambda functions as arrow functions
7. Have fun!

```js
doSomeFunctionality("hello world");

/**
 * Documentation
 * @param {string} param
 * @return {params}
 */
function doSomeFunctionality(param) {
  let parsedParam = parse(param);
  parsedParam.numbers.sort((x, y) => x - y);

  return parsedParam
}
```
