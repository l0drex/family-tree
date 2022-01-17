# About

This project allows displaying family tree data stored in csv tables as graphs on a website.
It uses Cola.js and d3.js.
The documentation can be found in the wiki.

Supported languages: 🇺🇲/🇬🇧¹² 🇩🇪

<!-- TODO add wiki page on how to add language support and then link it here -->

---
1. Default, therefore used while loading and fallback if local language is not supported
2. No differentiation yet between country specific differences


# 🌳 Usage

The family data is represented in two csv-tables that the user can upload on the page:
- one for all the people:

 > ⚠️ The ID `0` is reserved️ for the unknown person. It can be used in families with unknown partners️

| ID  | full_name  | born  | named | gender | child_of | birthday   | place_of_birth | day_of_death | age | profession             | religion                 |
|-----|------------|-------|-------|--------|----------|------------|----------------|--------------|-----|------------------------|--------------------------|
| 0   | unknown    |       |       |        |          |            |                |              |     |                        |                          |
| 1   | John Doe   | Smith |       | male   |          | 01.09.1919 | Dirmingcan     | 10.10.2010   | 91  | professional describer | flying spaghetti monster |
| 2   | Miriam Doe |       |       | female |          | 02.02.1902 | Ohoho          | 03.03.2003   | 101 | example giver          | -                        |
| 3   | Kim Doe    |       |       | divers | 1        | 01.02.2001 |                |              | 20  |                        |                          |

- one for all the families:

| ID  | partner1 | partner2 |
|-----|----------|----------|
| 0   | 1        | 2        |


---
### 💡 Inspiration

This project was build using d3 and web cola. During development, I took inspiration from the following examples:

- https://marvl.infotech.monash.edu/webcola/examples/onlinebrowse.html
- https://marvl.infotech.monash.edu/webcola/examples/downwardedges.html
- https://marvl.infotech.monash.edu/webcola/examples/smallgroups.html
