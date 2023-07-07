[![Build React app](https://github.com/l0drex/family-tree/actions/workflows/build.yml/badge.svg)](https://github.com/l0drex/family-tree/actions/workflows/build.yml)

# About

This project allows displaying family tree data stored in csv tables as graphs on a website.
It uses Cola.js, d3.js and gedcomx-js.
The documentation can be found in the wiki.

Supported languages[^1]: 🇺🇲/🇬🇧[^2] 🇩🇪

<!-- TODO add wiki page on how to add language support and then link it here -->

[^1]: No differentiation yet between country specific differences
[^2]: Default, therefore used while loading and fallback if local language is not supported


# 🌳 Usage

Upload a valid gedcomx-file on the home page. On submit, the family view should open and display the graph:

![grafik](https://user-images.githubusercontent.com/46622675/177526424-7507cbc5-e640-4657-bf1c-2a2d2a459685.png)


# 🚧 GedcomX Support
The following features of GedcomX are not supported:

### Source Description
Due to `gedcomx-js`, the following data can not be stored and therefore not displayed:
- publisher
- author
- created
- modified
- published

### Group
Not supported at all by `gedcomx-js`

### Relationship
Will come in a future release
- facts
