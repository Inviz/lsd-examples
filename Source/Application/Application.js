/*
---
 
script: Application.js
 
description: Basic application
 
license: MIT-style license.
 
requires:
- LSD/ART.Widget.Window
- LSD/ART.Sheet
- LSD/ART.Glyphs
- LSD/ART.Document
- LSD/ART.Shape.Arrow
- LSD/ART.Shape.Ellipse
- LSD/ART.Shape.Flower
- LSD/ART.Shape.Rectangle
- LSD/ART.Shape.Star
- LSD/ART.Layer.Fill
- LSD/ART.Layer.Glyph
- LSD/ART.Layer.Icon
- LSD/ART.Layer.InnerShadow
- LSD/ART.Layer.Shadow
- LSD/ART.Layer.Stroke
- Core/DomReady
 
provides: [ART.Application]
 
...
*/

ART.Application = new Class({
  Extends: ART.Widget.Window
});