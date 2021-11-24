<?php
$title = "Stammbaum";
$description = "Erkunde deinen Stammbaum";

$scripts = [
  "https://d3js.org/d3.v4.js",
  "https://marvl.infotech.monash.edu/webcola/cola.min.js",
  "js/dataLoader.js",
  "js/generateTree.js"
];

$styles = [
  "css/svg.css"
];

$content = "
<svg id='family-tree'>
  <rect id='background' width='100%' height='100%'></rect>
</svg>
";

require_once "template.php";
