<?php

$scripts = [
  "../js/dataLoader.js",
  "../js/generateTree.js"
];

$content = "
<h1>Familienstammbaum</h1>
<svg width='1900' height='970'>
  <rect id='background' width='100%' height='100%'></rect>
</svg>
";

require_once "template.html";
