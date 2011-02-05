/*
---
 
script: Desktop.js
 
description: Simple desktop emulation
 
license: Public domain (http://unlicense.org).
 
requires:
  - Core/Element.Dimensions
  - Widgets/LSD.Widget.Body
  - Widgets/LSD.Widget.Section
  - Widgets/LSD.Widget.Menu
  - Widgets/LSD.Widget.Menu.Toolbar
  - Widgets/LSD.Widget.Menu.Toolbar.Menu
  - Widgets/LSD.Widget.Menu.Context
  - Widgets/LSD.Widget.Menu.List
  - Widgets/LSD.Widget.Select
  - Widgets/LSD.Widget.Form
  - Widgets/LSD.Widget.Label
  - Widgets/LSD.Widget.Input.Search
  - Widgets/LSD.Widget.Input.Checkbox
  - Widgets/LSD.Widget.Input.Radio
  - Widgets/LSD.Widget.Input.Range
  - Widgets/LSD.Widget.Button
  - Widgets/LSD.Widget.Container
  - Widgets/LSD.Widget.Window
  - Widgets/LSD.Widget.Window.Application
  - LSD/ART.Shape.Arrow
  - LSD/ART.Shape.Ellipse
  - LSD/ART.Shape.Flower
  - LSD/ART.Shape.Rectangle
  - LSD/ART.Shape.Star
  - LSD/LSD.Module.Container
  - LSD/LSD.Module.Layout
  - LSD/LSD.Mixin.Draggable
  - LSD/LSD.Mixin.Resizable
  - LSD/LSD.Mixin.Shy
  - LSD/LSD.Mixin.Position
  - LSD/LSD.Sheet
  - LSD/ART.Glyphs
  - LSD/LSD.Document
  - Ext/Element.Properties.userSelect
  - Core/DOMReady
 
provides:
  - LSD.Application.Desktop
 
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

LSD.Mixin.Autoselect = new Class({
  behaviour: 'menu.autoselect',
  
  options: {
    events: {
      self: {
        blur: 'unselectItem'
      },
      focused: {
        element: {
          'mouseover:on(button)': function() {
            if (!this.selected) this.select();
          }
        }
      }
    }
  }
})

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
  Extends: LSD.Widget.Menu.Toolbar.Commands,
  
  options: {
    events: {
      self: {
        blur: function() {
          if (this.selectedItem) this.selectedItem.unselect();
        }
      }
    }
  }
});

LSD.Widget.Menu.Toolbar.Notification.Command = new Class({
  Includes: [
    LSD.Widget.Button,
    LSD.Trait.Item.Stateful
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
