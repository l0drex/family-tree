<?php

$scripts = [
  "https://d3js.org/d3.v4.js",
  "https://marvl.infotech.monash.edu/webcola/cola.min.js",
  "../js/dataLoader.js",
  "../js/generateTree.js"
];

$content = "
<h1>Familienstammbaum</h1>
<svg width='100%' height='800px'>
  <rect id='background' width='100%' height='100%'></rect>
</svg>
";

require_once "template.php";
