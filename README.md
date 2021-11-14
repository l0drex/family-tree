# About

This project allows displaying family tree data stored in csv tables as graphs on a website.
It uses Cola.js and d3.js.
Documentation is stored in the doc directory.

# Roadmap

- [x] Load data
- [x] Show graph
- [x] Draw arrows
- [ ] Dynamic node sizing
- [x] Group partners
- [x] Hide most of the nodes on start up
- [x] Show detailed information when clicking on the node
- [x] Add an automatic dark mode

# Usage

The family data is represented in two tables:
- one for all the people
- one for all the partnerships

Each family has two partners. People can have parents, stored in the `child_of` attribute.
The tables are stored as csv files in _./resources_.
Write the names of these files in the call of `load_csv()` in _/js/generateTree.js_.

# Alternative design

On the branch _straight_lines_, every link is drawn straight only using 90° angles. Instead of the rings, partnerships are only indicated by to connection of nodes.
