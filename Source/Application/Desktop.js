/*
---
 
script: Desktop.js
 
description: Simple desktop emulation
 
license: Public domain (http://unlicense.org).
 
requires:
- Core/Element.Dimensions
- LSD/LSD.Widget.Body
- LSD/LSD.Widget.Section
- LSD/LSD.Widget.Header
- LSD/LSD.Widget.Footer
- LSD/LSD.Widget.Nav
- LSD/LSD.Widget.Menu
- LSD/LSD.Widget.Menu.Toolbar
- LSD/LSD.Widget.Menu.Toolbar.Menu
- LSD/LSD.Widget.Menu.Context
- LSD/LSD.Widget.Menu.List
- LSD/LSD.Widget.Select
- LSD/LSD.Widget.Form
- LSD/LSD.Widget.Panel
- LSD/LSD.Widget.Input.Checkbox
- LSD/LSD.Widget.Input.Radio
- LSD/LSD.Widget.Input.Range
- LSD/LSD.Widget.Button
- LSD/LSD.Widget.Glyph
- LSD/LSD.Widget.Container
- LSD/LSD.Widget.Module.Container
- LSD/LSD.Widget.Module.Layout
- LSD/LSD.Widget.Trait.Draggable.Stateful
- LSD/LSD.Widget.Trait.Resizable.Stateful
- LSD/LSD.Widget.Trait.Resizable.Content
- LSD/LSD.Widget.Trait.Fitting
- LSD/LSD.Widget.Trait.Hoverable
- LSD/LSD.Widget.Trait.Proxies
- LSD/LSD.Widget.Trait.Position
- Base/Widget.Trait.Shy
- LSD.Application
- Ext/Element.Properties.userSelect
 
provides: [LSD.Application.Desktop]
 
...
*/

LSD.Widget.Body.Desktop = new Class({
	Extends: LSD.Widget.Body,
	
	options: {
  	element: {
  	  userSelect: false
  	}
  }
});

LSD.Widget.Module.Behaviours.define('.autoselect', {
  self: {
    blur: 'unselectItem'
  },
  focused: {
    element: {
      'mouseover:on(button:not(:selected))': function() {
        this.select();
      }
    }
  }
});

LSD.Widget.Menu.Toolbar.Commands = new Class({
  Includes: [
    LSD.Widget.Menu.Toolbar
  ],
  
  getItems: function() {
    return this.childNodes;
  }
});

LSD.Widget.Menu.Toolbar.Commands.Menu = new Class({
  Extends: LSD.Widget.Menu.Toolbar.Menu,
    
  options: {
    events: {
      self: {
        unselect: 'collapse',
        select: 'expand'
      }
    }
  }
});

LSD.Widget.Menu.Toolbar.Commands.Menu.Command = LSD.Widget.Menu.Toolbar.Menu.Command;

LSD.Widget.Menu.Toolbar.Notification = new Class({
  Extends: LSD.Widget.Menu.Toolbar.Commands
});

LSD.Widget.Menu.Toolbar.Notification.Command = new Class({
  Includes: [
    LSD.Widget.Button,
    Widget.Trait.Item.Stateful
  ]
})

LSD.Widget.Menu.Toolbar.Notification.Command.Time = new Class({
  Extends: LSD.Widget.Menu.Toolbar.Notification.Command,
  
  attach: Macro.onion(function() {
    this.timer = (function() {
      this.refresh();
      this.timer = this.refresh.periodical(60 * 1000, this);
    }).delay((60 - (new Date).getSeconds()) * 1000, this);
  }),
  
  detach: Macro.onion(function() {
    $clear(this.timer)
  }),
  
  render: Macro.onion(function() {
    var date = (new Date);
    var bits = [date.getHours(), date.getMinutes()].map(function(bit) {
      return (bit < 10) ? '0' + bit : bit;
    })
    this.setContent(bits.join(":"));
  }),
});

LSD.Widget.Menu.List.Icons = new Class({
  Extends: LSD.Widget.Menu.List,
  
  options: {
    layout: {
      item: '>item[type=icon]'
    }
  }/*,
  
  items: [
    //{
    //  content_type: 'application/pdf',
    //  name: 'Presentation.pdf',
    //  size: 1999133
    //},
    //{
    //  content_type: 'image/png',
    //  name: 'valid_icon.png',
    //  size: 12309
    //}
  ]*/
});

LSD.Widget.Menu.List.Option.Icon = new Class({
  Extends: LSD.Widget.Menu.List.Option,
  
  setContent: function(item) {
    this.parent('<h2>' + item.name + '</h2>' + '<p>' + (item.online ? 'Connected' : 'Not connected') + '</p>');
  }
});

LSD.Widget.Menu.Toolbar.Dock = LSD.Widget.Menu.Toolbar
