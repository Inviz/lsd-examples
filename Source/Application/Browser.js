/*
---
 
script: Browser.js
 
description: Some kind of a browser
 
license: Public domain (http://unlicense.org).
 
requires:
- LSD.Application
- LSD/LSD.Widget.Section
- LSD/LSD.Widget.Button
- LSD/LSD.Widget.Glyph
- LSD/LSD.Widget.Container
- LSD/LSD.Widget.Module.Container
- LSD/LSD.Widget.Module.Layout
- LSD/LSD.Widget.Trait.Draggable.Stateful
- LSD/LSD.Widget.Trait.Resizable.Stateful
- LSD/LSD.Widget.Trait.Resizable.Content
- LSD/LSD.Widget.Trait.Fitting
- LSD/LSD.Widget.Trait.Scrollable
- LSD/LSD.Widget.Trait.Hoverable
- Base/Widget.Trait.Shy
- Base/Widget.Trait.Focus
 
provides: [LSD.Application.Preferences.Network]
 
...
*/

LSD.Application.Browser = new Class({  
	Includes: [
    LSD.Application,
	  LSD.Widget.Trait.Draggable.Stateful,
	  LSD.Widget.Trait.Resizable.Stateful,
	  LSD.Widget.Trait.Resizable.Content,
	  LSD.Widget.Trait.Fitting,
	  Widget.Trait.Focus.Stateful
	],
	
	options: {
	  layout: {
  	  self: "window.fancy#browser[shape=arrow]",
  	  children: {
    	  'section#header': {
          'button#toggler[shy]': {},
    	    'menu[type=toolbar][hoverable][shy][tabindex=-1]#buttons': {
            'button#close': {},
    	      'button#minimize': {},
            'button#maximize': {}
    	    },
    	    '#title[container]': {},
      	  'menu[type=toolbar]#toolbar[tabindex=-1]': {
      	    'button#back[shape=arrow]': {},
      	    'button#forward:disabled': {},
      	    'button#search': {},
      	    'button#wrench': {},
      	    'button#reload': {},
      	    'button#bookmark[shape=star]': {}
      	  }
    	  },
    	  'section#content[container][scrollable]': {},
    	  'section#footer.flexible[shape=arrow]': {
    			'#status[container]': {},
    	    'glyph[name=drag-handle]#handle': {}
    	  }
  	  }
  	},
	  events: {
  	  header: {
  	    toggler: {
          click: 'mutate'
  	    }
  	  }
  	}
	}

});

