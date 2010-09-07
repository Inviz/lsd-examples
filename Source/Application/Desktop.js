/*
---
 
script: Desktop.js
 
description: Simple desktop emulation
 
license: MIT-style license.
 
requires:
- Core/Element.Dimensions
- LSD/ART.Widget.Section
- LSD/ART.Widget.Header
- LSD/ART.Widget.Footer
- LSD/ART.Widget.Nav
- LSD/ART.Widget.Menu.Toolbar
- LSD/ART.Widget.Menu.Toolbar.Menu
- LSD/ART.Widget.Menu.Context
- LSD/ART.Widget.Menu.List
- LSD/ART.Widget.List
- LSD/ART.Widget.Select
- LSD/ART.Widget.Form
- LSD/ART.Widget.Panel
- LSD/ART.Widget.Input.Checkbox
- LSD/ART.Widget.Input.Radio
- LSD/ART.Widget.Input.Range
- LSD/ART.Widget.Button
- LSD/ART.Widget.Glyph
- LSD/ART.Widget.Container
- LSD/ART.Widget.Module.Container
- LSD/ART.Widget.Module.Expression
- LSD/ART.Widget.Module.LayoutEvents
- LSD/ART.Widget.Module.Layout
- LSD/ART.Widget.Trait.Draggable
- LSD/ART.Widget.Trait.Resizable
- LSD/ART.Widget.Trait.ResizableContainer
- LSD/ART.Widget.Trait.Fitting
- LSD/ART.Widget.Trait.Liquid
- LSD/ART.Widget.Trait.Hoverable
- LSD/ART.Widget.Trait.Aware
- LSD/ART.Widget.Trait.ProxyChildren
- Base/Widget.Trait.Shy
- ART.Application
 
provides: [ART.Application.Desktop]
 
...
*/

ART.Application.Desktop = new Class({
	Includes: [	  
    ART.Document,
    ART.Widget.Module.Layout,
    Widget.Module.Events
	],
	
	layout: {
	  'header#top': {
  	  'menu-toolbar-commands#commands': {
  	    '^menu#shutdown[title=Demo]': {
  	      '^command#demo-shutdown': 'Shut down'
  	    },
        '^menu.important[label=LSD]': {
          '^command#lsd-view-github': 'View github',
          '^command#lsd-fork': 'Fork'
        },
        '^menu[label=File]': {
          '^command#file-open': 'Open'
        }
  	  },
  	  'menu-toolbar-notification#notification[at=right top]': {
  	    '^item#preferences': {},
  	    '^item#search': {},
  	    '^item-time#time': {}
  	  }
	  },
	  'menu-list-icons#icons': {},
	  'menu[type=toolbar]#dock': {},
	},
	
	events: {
	  window: {
	    resize: 'onResize'
	  }
	},
	
	style: {
	  current: {}
	},
	
	getHandle: function() {
	  return this.content.handle;
	},

	initialize: function() {
	  this.parent.apply(this, arguments);
		if (this.layout) this.setLayout(this.layout);
	  this.onResize();
	  this.attach();
	},
	
	attach: function() {
	  window.addEvents(this.bindEvents(this.events.window));
	},
	
	detach: function() {
	  window.removeEvents(this.bindEvents(this.events.window));
	},
	
	onResize: function() {
	  $extend(this.style.current, document.getCoordinates());
	  this.render()
	},
	
	appendChild: function(widget) {
	  this.parent.apply(this, arguments);
	  widget.parentNode = this;
	},
	
	render: function() {
		this.childNodes.each(function(child){
		  child.refresh();
		});
	}
});

ART.Widget.Menu.Toolbar.Commands = new Class({
  Includes: [
    ART.Widget.Menu.Toolbar
  ],
  
  events: {
    element: {
      mousedown: 'retain'
    },
    self: {
      blur: 'unselectItem'
    }
  },
  
  getItems: function() {
    return this.childNodes;
  }
});

ART.Widget.Menu.Toolbar.Commands.Menu = new Class({
  Includes: [
    ART.Widget.Menu.Toolbar.Menu,
    ART.Widget.Trait.Aware,
    ART.Widget.Trait.ProxyChildren
  ],
  
  options: {
    proxy: {
      target: 'menu'
    }
  },
  
  events: {
    self: {
      unselect: 'collapse',
      select: 'expand'
    }
  }
});
ART.Widget.Menu.Toolbar.Commands.Menu.Command = ART.Widget.Menu.Context.Item;


ART.Widget.Menu.Toolbar.Notification = new Class({
  Extends: ART.Widget.Menu.Toolbar.Commands
})

//ART.Widget.Command = new Class({
//  build: function() {
//    
//  },
//  
//  inject: function(widget) {
//    widget.items.push(this);
//  },
//  
//  setContent: function(value) {
//    this.value = value
//  }
//})

ART.Widget.Menu.Toolbar.Notification.Item = new Class({
  Includes: [
    ART.Widget.Button,
    Widget.Trait.Item.Stateful
  ],
  
  events: {
    self: {
      click: 'select',
      inject: 'setList'
    },
    element: {
      mousemove: 'selectIfFocused'
    }
  },
  
  selectIfFocused: function() {
    if (this.listWidget.focused) this.select();
  }
})

ART.Widget.Menu.Toolbar.Notification.Item.Time = new Class({
  Extends: ART.Widget.Menu.Toolbar.Notification.Item,
  
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
    this.setContent([date.getHours(), date.getMinutes()].join(":"));
  }),
});

ART.Widget.Menu.List.Icons = new Class({
  Extends: ART.Widget.Menu.List,
  
  options: {
    list: {
      item: 'menu-list-item-icon'
    }
  },
  
  items: [
    {
      content_type: 'application/pdf',
      name: 'Presentation.pdf',
      size: 1999133
    },
    {
      content_type: 'image/png',
      name: 'valid_icon.png',
      size: 12309
    }
  ],
  
	buildItem: function(item) {
	  var widget = this.buildLayout(this.options.list.item);
	  widget.value = item;
	  widget.setList(this);
	  widget.setContent(item);
	  this.getContainer().append(widget);   
	  return widget;
	}
});

ART.Widget.Menu.List.Item.Icon = new Class({
  Extends: ART.Widget.Menu.List.Item,
  
  setContent: function(item) {
    this.parent('<h2>' + item.name + '</h2>' + '<p>' + (item.online ? 'Connected' : 'Not connected') + '</p>');
  }
});
