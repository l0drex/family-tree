# About

This project allows displaying family tree data stored in csv tables as graphs on a website.
It uses Cola.js and d3.js.
Documentation is stored in the doc directory.

# 🚀 Roadmap

- [x] Load data, show graph
- [x] Dynamic expanding of the graph
- [x] Group partners (not sure if that's a good idea, therefore disabled right now)
- [ ] Improve support for touchscreens
- [ ] Dynamic node sizing
- [ ] Don't draw etc-nodes if there is nothing more to show
- [ ] Track generation (allows marking people without any dates as dead)
- [ ] Store data in a database
- [ ] Allow data editing
- [ ] Provide example data (vocabulary in different languages, tv shows, royal families, ...)

# 🌳 Usage

The family data is represented in two tables:
- one for all the people
- one for all the partnerships

Each family has two partners. People can have parents, stored in the `child_of` attribute.
The tables are stored as csv files in _./resources_.
Write the names of these files in the call of `load_csv()` in _/js/generateTree.js_.

# 🎨 Alternative design

On the branch _straight_lines_, every link is drawn straight only using 90° angles. Instead of the rings, partnerships are only indicated by to connection of nodes.


---
### 💡 Inspiration

This project was build using d3 and web cola. During development, I took inspiration from the following examples:

- https://marvl.infotech.monash.edu/webcola/examples/onlinebrowse.html
- https://marvl.infotech.monash.edu/webcola/examples/downwardedges.html
- https://marvl.infotech.monash.edu/webcola/examples/smallgroups.html
