/*
---
 
script: Network.js
 
description: Some kind of a network preferences
 
license: Public domain (http://unlicense.org).
 
requires:
- LSD.Application.Preferences
- LSD/LSD.Widget.Section
- LSD/LSD.Widget.Menu.List
- LSD/LSD.Widget.Menu.Toolbar
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
- Base/Widget.Trait.Shy
- Base/Widget.Trait.Focus
 
provides: [LSD.Application.Preferences.Network]
 
...
*/


LSD.Application.Preferences.Network = new Class({
	Includes: [	  
    LSD.Application,
	      Widget.Trait.Focus.    Stateful,
	  LSD.Widget.Trait.Draggable.Stateful,
	  LSD.Widget.Trait.Resizable.Stateful,
	  LSD.Widget.Trait.Resizable.Content,
	  LSD.Widget.Trait.Fitting
	],
  
  options: {
  	layout: {
  	  self: "window.fancy#network",
  	  children: {
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
  	  }
  	},
  	resizer: {
      modifiers: {
        y: false
      }
    }
  }
});

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