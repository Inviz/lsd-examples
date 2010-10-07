/*
---
 
script: Preferences.js
 
description: Basic form and everything
 
license: MIT-style license.
 
requires:
- ART.Application
- LSD/ART.Widget.Section
- LSD/ART.Widget.Select
- LSD/ART.Widget.Form
- LSD/ART.Widget.Panel
- LSD/ART.Widget.Input.Checkbox
- LSD/ART.Widget.Input.Range
- LSD/ART.Widget.Input.Search
- LSD/ART.Widget.Button
- LSD/ART.Widget.Glyph
- LSD/ART.Widget.Container
- LSD/ART.Widget.Label
- LSD/ART.Widget.Module.Container
- LSD/ART.Widget.Module.Expression
- LSD/ART.Widget.Module.LayoutEvents
- LSD/ART.Widget.Module.Layout
- LSD/ART.Widget.Trait.Draggable
- LSD/ART.Widget.Trait.Fitting
- LSD/ART.Widget.Trait.Hoverable
- Base/Widget.Trait.Shy
- Base/Widget.Trait.Focus
 
provides: [ART.Application.Preferences]
 
...
*/

ART.Application.Preferences = new Class({
	Includes: [
    ART.Application,
	  ART.Widget.Trait.Draggable,
	  ART.Widget.Trait.Fitting,
	  Widget.Trait.Focus.Stateful
	],

  States: {
    'minified': ['minify', 'enlarge', 'mutate']
  },
  
  expression: "window.fancy#preferences",
  
	layout: {
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
	},

	events: {
	  header: {
	    toggler: {
        click: 'mutate'
	    }
	  }
	}
});
