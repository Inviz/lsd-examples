/*
---
 
script: Network.js
 
description: Some kind of a network preferences
 
license: MIT-style license.
 
requires:
- ART.Application.Preferences
- LSD/ART.Widget.Section
- LSD/ART.Widget.Toolbar
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
- LSD/ART.Widget.Toolbar
- LSD/ART.Widget.Module.Container
- LSD/ART.Widget.Module.Expression
- LSD/ART.Widget.Module.LayoutEvents
- LSD/ART.Widget.Module.Layout
- LSD/ART.Widget.Trait.Draggable
- LSD/ART.Widget.Trait.Resizable
- LSD/ART.Widget.Trait.ResizableContainer
- LSD/ART.Widget.Trait.Fitting
- LSD/ART.Widget.Trait.Liquid
- Base/Widget.Trait.Shy
 
provides: [ART.Application.Preferences.Network]
 
...
*/


ART.Application.Preferences.Network = new Class({
	Includes: [	  
    ART.Application,
	  ART.Widget.Trait.Draggable,
	  ART.Widget.Trait.Resizable,
	  ART.Widget.Trait.ResizableContainer,
	  ART.Widget.Trait.Fitting
	],

  States: {
    'minified': ['minify', 'enlarge', 'mutate']
  },
  
  options: {
    resizer: {
      modifiers: {
        y: false
      }
    }
  },
  
  expression: "window.fancy#network",
  
	events: {
	  header: {
	    toggler: {
        click: 'mutate'
	    }
	  }
	},
	
	layout: {
	  'section#header': {
      'button#toggler[shy]': {},
	    '#buttons[hoverable][shy]': {
        'button#close': {},
	      'button#minimize:disabled': {},
        'button#maximize:disabled': {}
	    },
	    '#title[container]': {},
  	  '#toolbar': {
        'input[type=search]#search': {},
  	    'button#back.left': {},
  	    'button#forward.right:disabled': {},
  	    'button#index': 'Show All'
  	  }
	  },
	  'section#content[container]': {
  	  'glyph#handle[name=drag-handle][at=bottom right]': {},
	    'form.two-column#networking': {
	      '#legend': [
  	      {'label[for=location]': 'Location:'},
  	      'select#location'
  	    ],
  	    'panel#left': {
  	      'list-networks#networks[height="parent - hub - 1"]': {},
	        'toolbar[at=bottom]#hub': {
      	    'button#remove:disabled': {},
      	    'button#add': {},
      	    'button#configure': {}
	        }
  	    },
  	    //'splitter#resizer': {},
  	    'panel#right[width="parent - left - 50"]': [
  	      {'label[for=appearance]': 'Network name:'},
  	      'input#text[width="parent - 150"]',
  	      {'label[for=appearance]': 'Slider:'},
    	    'input[type=range]#count',
  	      {'label[for=appearance]': 'Active?'},
  	      'input[type=checkbox]#activator',
  	      {'label[for=appearance]': 'Choose one:'},
  	      {'.field.options': [
  	        {'.line': [
    	        'input[type=radio][name=choice]#apple-pies',
    	        {'label[for=previous]': 'Apple pies'}
  	        ]},
  	        {'.line': [
    	        'input[type=radio][name=choice]#instant-coffee',
    	        {'label[for=previous]': 'Instant coffee'}
  	        ]}
  	      ]},
  	    ],
  	    '#actions': {
    	    'button#assist': 'Assist me...',
    	    'button#revert:disabled': 'Revert',
    	    'button#apply:disabled': 'Apply'
  	    }
  	  }
	  }
	},
	
	
	getHandle: function() {
	  return this.content.handle;
	}
});

ART.Widget.List.Networks = new Class({
  Extends: ART.Widget.List,
  
  options: {
    list: {
      item: 'list-item-network'
    }
  },
  
  items: [
    {
      online: true,
      name: 'Parallels adapter'
    },
    {
      online: false,
      name: 'Ethernet'
    }
  ],
  
	buildItem: function(item) {
	  var widget = this.buildLayout(this.options.list.item);
	  widget.value = item;
	  widget.listWidget = this;
	  widget.setContent(item);
	  this.getContainer().append(widget); 
	  return widget;
	},
})

ART.Widget.List.Item.Network = new Class({
  Extends: ART.Widget.List.Item,
  
  setContent: function(item) {
    this.parent('<h2>' + item.name + '</h2>' + '<p>' + (item.online ? 'Connected' : 'Not connected') + '</p>');
  }
})
