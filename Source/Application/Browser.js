/*
---
 
script: Browser.js
 
description: Some kind of a browser
 
license: MIT-style license.
 
requires:
- ART.Application
- LSD/ART.Widget.Section
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
- LSD/ART.Widget.Trait.Scrollable
- LSD/ART.Widget.Trait.Hoverable
- Base/Widget.Trait.Shy
- Base/Widget.Trait.Focus
 
provides: [ART.Application.Preferences.Network]
 
...
*/

ART.Application.Browser = new Class({  
	Includes: [
    ART.Application,
	  ART.Widget.Trait.Draggable.Stateful,
	  ART.Widget.Trait.Resizable.Stateful,
	  ART.Widget.Trait.Resizable.Content,
	  ART.Widget.Trait.Fitting,
	  Widget.Trait.Focus.Stateful
	],
	
  expression: "window.fancy#browser[shape=arrow]",
  
	layout: {
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
	},
	
	options: {
	  resizer: {
	    crop: true
	  }
	},
	
	events: {
	  header: {
	    toggler: {
        click: 'mutate'
	    }
	  }
	},

	getHandle: function() {
	  return $(this.footer.handle)
	}

});

