<?php
if (!isset($title))
  $title = "Template";
if (!isset($description))
  $description = "Template page";

if (!isset($styles))
  $styles = [];
$styles = array_merge([
  "css/normalize.css",
  "css/main.css",
], $styles);

if (!isset($scripts))
  $scripts = [];
$scripts = array_merge([
  "js/vendor/modernizr-3.11.2.min.js",
  "js/plugins.js",
  "js/main.js"
], $scripts);

if (!isset($content))
  $content = "Example Page";
?>

<!doctype html>
<html class="no-js" lang="de">

<head>
  <meta charset="utf-8">
  <title><?php print $title ?></title>
  <meta name="description" content=<?php print $description?>>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <link rel="manifest" href="site.webmanifest">
  <link rel="apple-touch-icon" href="img/icon.png">
  <link rel="icon" type="image/x-icon" href="img/favicon.ico">

  <?php
  foreach ($styles as $style) {
    print "<link rel=stylesheet href=$style>";
  }
  ?>

  <meta name="theme-color" content="#fafafa">
</head>

<body>
  <?php print $content ?>

  <?php
  foreach ($scripts as $script) {
    print "<script src=$script></script>";
  }
  ?>
</body>
</html>
