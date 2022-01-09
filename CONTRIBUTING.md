# Translations and localization

In short, use the `lang` attribute in HTML files and `localizeToString({en: "...", de: "..."})` in JavaScript.
More details are available in the [wiki](https://github.com/l0drex/family-tree/wiki/Localization).


# Writing code

## Code-style

When you create a pull request, make sure to follow the following styling guidelines:

### General

Follow the rules of `.editorconfig` (should be automatically applied by your editor):
1. Encode your code in utf-8
2. Indentations should be 2 whitespace
3. End files with a new line
4. Don't end your lines with whitespaces

### JavaScript code style

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


# Things to be aware of

Any emojis must be in a parent whose class is `emoji`. This is due to Microsoft Edge, where any font whose weight is above 500 will use monochromatic emojis rather than colorful ones.