/*
---
 
script: Application.js
 
description: Basic application
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD/LSD.Widget.Window
  - LSD/LSD.Sheet
  - LSD/ART.Glyphs
  - LSD/LSD.Document
  - LSD/ART.Shape.Arrow
  - LSD/ART.Shape.Ellipse
  - LSD/ART.Shape.Flower
  - LSD/ART.Shape.Rectangle
  - LSD/ART.Shape.Star
  - LSD/LSD.Layer.Fill
  - LSD/LSD.Layer.Glyph
  - LSD/LSD.Layer.GlyphShadow
  - LSD/LSD.Layer.Icon
  - LSD/LSD.Layer.InnerShadow
  - LSD/LSD.Layer.Shadow
  - LSD/LSD.Layer.Stroke
  - Core/DOMReady
 
provides: [LSD.Application]
 
...
*/

LSD.Application = new Class({
  Extends: LSD.Widget.Window
});