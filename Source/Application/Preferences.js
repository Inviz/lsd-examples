/*
---
 
script: Preferences.js
 
description: Basic form and everything
 
license: Public domain (http://unlicense.org).
 
requires:
- LSD.Application
- LSD/LSD.Widget.Section
- LSD/LSD.Widget.Select
- LSD/LSD.Widget.Form
- LSD/LSD.Widget.Panel
- LSD/LSD.Widget.Input.Checkbox
- LSD/LSD.Widget.Input.Range
- LSD/LSD.Widget.Input.Search
- LSD/LSD.Widget.Button
- LSD/LSD.Widget.Glyph
- LSD/LSD.Widget.Container
- LSD/LSD.Widget.Label
- LSD/LSD.Widget.Module.Container
- LSD/LSD.Widget.Module.Layout
- LSD/LSD.Widget.Trait.Draggable.Stateful
- LSD/LSD.Widget.Trait.Fitting
- LSD/LSD.Widget.Trait.Hoverable.Stateful
- Base/Widget.Trait.Shy
- Base/Widget.Trait.Focus
 
provides: [LSD.Application.Preferences]
 
...
*/

LSD.Application.Preferences = new Class({
	Includes: [
    LSD.Application,
	  LSD.Widget.Trait.Draggable.Stateful,
	  LSD.Widget.Trait.Fitting,
	  Widget.Trait.Focus.Stateful
	],
  
  options: {
    layout: {
      self: "window.fancy#preferences",
    	children: {
    	  'section#header': {
          'button#toggler[shy]': {},
    	    'menu[type=toolbar][hoverable][shy][tabindex=-1]#buttons': {
            'button#close': {},
    	      'button#minimize': {},
            'button#maximize:disabled': {}
    	    },
    	    '#title[container]': {},
      	  'menu[type=toolbar][tabindex=-1]#toolbar': {
            'input[type=search]#search': {},
      	    'button#back.left': {},
      	    'button#forward.right:disabled': {},
      	    'button#index': 'Show All'
      	  }
    	  },
    	  'section#content[container]': {
    	    'form.two-column#appearance': {
      	    'section#first': [
      	      {'label[for=appearance]': 'Text input:'},
      	      'input#appearance',
      	      {'label[for=appearance]': 'Slider:'},
        	    'input[type=range]#count'
      	    ],
      	    'section#second': [
      	      {'label[for=appearance]': 'Text input:'},
      	      'input#appearance'
      	    ],
      	    'section#third.last': [
      	      {'label[for=selectbox]': 'Selectbox:'},
      	      'select#selectbox'
      	    ]
    	    }
    	  }
    	}
    }
  }
});
