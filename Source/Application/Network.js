/*
---
 
script: Network.js
 
description: Some kind of a network preferences
 
license: Public domain (http://unlicense.org).
 
requires:
  - Widgets/LSD.Widget.Window.Application
  - Widgets/LSD.Widget.Section
  - Widgets/LSD.Widget.Menu.List
  - Widgets/LSD.Widget.Menu.Toolbar
  - Widgets/LSD.Widget.Select
  - Widgets/LSD.Widget.Form
  - Widgets/LSD.Widget.Input.Checkbox
  - Widgets/LSD.Widget.Input.Radio
  - Widgets/LSD.Widget.Input.Range
  - Widgets/LSD.Widget.Button
  - Widgets/LSD.Widget.Container
  - LSD/LSD.Module.Container
  - LSD/LSD.Module.Layout
  - LSD/LSD.Mixin.Draggable
  - LSD/LSD.Mixin.Resizable
  - LSD/LSD.Mixin.Scrollable
  - LSD/LSD.Mixin.Shy
  - LSD/LSD.Mixin.Focus
 
provides: 
  - LSD.Application.Network
 
...
*/

LSD.Widget.Menu.List.Networks = new Class({
  Extends: LSD.Widget.Menu.List,  
  
  options: {
    layers: {
      shadow:  ['shadow'],
      background:  [LSD.Layer.Fill.Background]
    },
    layout: {
      item: 'menu-list-networks-item'
    }
  }
})

LSD.Widget.Menu.List.Networks.Option = new Class({
  Extends: LSD.Widget.Menu.List.Option,
  
  options: {
    attributes: {
      itemscope: 'true'
    }
  },
  
  setContent: function(item) {
    this.parent('<h2 itemprop="title">' + item.name + '</h2>' + '<p itemprop="status">' + (item.online ? 'Connected' : 'Not connected') + '</p>');
  }
});

LSD.Widget.Menu.List.Networks.Button = LSD.Widget.Menu.List.Networks.Li = LSD.Widget.Menu.List.Networks.Command = LSD.Widget.Menu.List.Networks.Option