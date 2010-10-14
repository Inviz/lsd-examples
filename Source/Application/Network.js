/*
---
 
script: Network.js
 
description: Some kind of a network preferences
 
license: MIT-style license.
 
requires:
- ART.Application.Preferences
- LSD/ART.Widget.Section
- LSD/ART.Widget.Menu.List
- LSD/ART.Widget.Menu.Toolbar
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
- LSD/ART.Widget.Trait.Draggable.Stateful
- LSD/ART.Widget.Trait.Resizable.Stateful
- LSD/ART.Widget.Trait.Resizable.Content
- LSD/ART.Widget.Trait.Fitting
- LSD/ART.Widget.Trait.Liquid
- LSD/ART.Widget.Trait.Hoverable
- Base/Widget.Trait.Shy
- Base/Widget.Trait.Focus
 
provides: [ART.Application.Preferences.Network]
 
...
*/


ART.Application.Preferences.Network = new Class({
	Includes: [	  
    ART.Application,
	      Widget.Trait.Focus.    Stateful,
	  ART.Widget.Trait.Draggable.Stateful,
	  ART.Widget.Trait.Resizable.Stateful,
	  ART.Widget.Trait.Resizable.Content,
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
	    'menu[type=toolbar][hoverable][shy][tabindex=-1]#buttons': {
        'button#close': {},
	      'button#minimize:disabled': {},
        'button#maximize:disabled': {}
	    },
	    '#title[container]': {},
  	  'menu[type=toolbar]#toolbar[tabindex=-1]': {
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
  	      'menu-list-networks#networks': {},
	        'menu[type=toolbar][at=bottom][tabindex=-1]#hub': {
      	    'button#remove:disabled': {},
      	    'button#add': {},
      	    'button#configure': {}
	        }
  	    },
  	    //'splitter#resizer': {},
  	    'panel#right': [
  	      {'label[for=appearance]': 'Network name:'},
  	      'input#text',
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
  	    'menu[type=toolbar]#actions': {
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

ART.Widget.Menu.List.Networks = new Class({
  Extends: ART.Widget.Menu.List,  

  layered: {
    shadow:  ['shadow'],
    background:  ['fill', ['backgroundColor']]
  },

  options: {
    layout: {
      item: 'menu-list-item-network'
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
  ]
})

ART.Widget.Menu.List.Item.Network = new Class({
  Extends: ART.Widget.Menu.List.Item,
  
  setContent: function(item) {
    this.parent('<h2>' + item.name + '</h2>' + '<p>' + (item.online ? 'Connected' : 'Not connected') + '</p>');
  }
})
