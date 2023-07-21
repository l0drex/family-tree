[![Build React app](https://github.com/l0drex/family-tree/actions/workflows/build.yml/badge.svg)](https://github.com/l0drex/family-tree/actions/workflows/build.yml)

# 🌳 About

This is a web application to display family tree data locally in your browser.
Just select a GedcomX json file and off you go!
There is also a demo button to load some randomly generated example data to explore all features.
Try it out over here on [GitHub Pages](https://l0drex.github.io/family-tree/)!.

To create a simple GedcomX file, you can create a spreadsheet
and convert that with my [GedcomX converter](https://github.com/l0drex/csv_to_gedcomx).
Note that you have to follow a specific format described on that page.

Supported languages[^1]: 🇺🇲/🇬🇧[^2] 🇩🇪
(See [Adding new languages](https://github.com/l0drex/family-tree/wiki/Localization) if you want to help translating.)

[^1]: No differentiation yet between country specific differences
[^2]: Default, therefore used while loading and fallback if local language is not supported

# 🚧 GedcomX Support
The following features of GedcomX are not supported:

## NameParts
Names and their name forms are displayed, but not their name parts nor the name part qualifiers.

## Source Description
Due to `gedcomx-js`, the following data can not be stored and therefore not displayed:
- publisher
- author
- created
- modified
- published

### Source Reference
- qualifiers

## Group
Not supported at all by `gedcomx-js`

## Relationship
Will come in a future release
- facts

## Dates

Only simple dates are supported.
