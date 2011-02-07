/*
---

name: Core

description: The heart of MooTools.

license: MIT-style license.

copyright: Copyright (c) 2006-2010 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
  - Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
  - Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [Core, MooTools, Type, typeOf, instanceOf, Native]

...
*/

(function(){

this.MooTools = {
	version: '1.3.1dev',
	build: '%build%'
};

// typeOf, instanceOf

var typeOf = this.typeOf = function(item){
	if (item == null) return 'null';
	if (item.$family) return item.$family();

	if (item.nodeName){
		if (item.nodeType == 1) return 'element';
		if (item.nodeType == 3) return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
	} else if (typeof item.length == 'number'){
		if (item.callee) return 'arguments';
		if ('item' in item) return 'collection';
	}

	return typeof item;
};

var instanceOf = this.instanceOf = function(item, object){
	if (item == null) return false;
	var constructor = item.$constructor || item.constructor;
	while (constructor){
		if (constructor === object) return true;
		constructor = constructor.parent;
	}
	return item instanceof object;
};

// Function overloading

var Function = this.Function;

var enumerables = true;
for (var i in {toString: 1}) enumerables = null;
if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];

Function.prototype.overloadSetter = function(usePlural){
	var self = this;
	return function(a, b){
		if (a == null) return this;
		if (usePlural || typeof a != 'string'){
			for (var k in a) self.call(this, k, a[k]);
			if (enumerables) for (var i = enumerables.length; i--;){
				k = enumerables[i];
				if (a.hasOwnProperty(k)) self.call(this, k, a[k]);
			}
		} else {
			self.call(this, a, b);
		}
		return this;
	};
};

Function.prototype.overloadGetter = function(usePlural){
	var self = this;
	return function(a){
		var args, result;
		if (usePlural || typeof a != 'string') args = a;
		else if (arguments.length > 1) args = arguments;
		if (args){
			result = {};
			for (var i = 0; i < args.length; i++) result[args[i]] = self.call(this, args[i]);
		} else {
			result = self.call(this, a);
		}
		return result;
	};
};

Function.prototype.extend = function(key, value){
	this[key] = value;
}.overloadSetter();

Function.prototype.implement = function(key, value){
	this.prototype[key] = value;
}.overloadSetter();

// From

var slice = Array.prototype.slice;

Function.from = function(item){
	return (typeOf(item) == 'function') ? item : function(){
		return item;
	};
};

Array.from = function(item){
	if (item == null) return [];
	return (Type.isEnumerable(item) && typeof item != 'string') ? (typeOf(item) == 'array') ? item : slice.call(item) : [item];
};

Number.from = function(item){
	var number = parseFloat(item);
	return isFinite(number) ? number : null;
};

String.from = function(item){
	return item + '';
};

// hide, protect

Function.implement({

	hide: function(){
		this.$hidden = true;
		return this;
	},

	protect: function(){
		this.$protected = true;
		return this;
	}

});

// Type

var Type = this.Type = function(name, object){
	if (name){
		var lower = name.toLowerCase();
		var typeCheck = function(item){
			return (typeOf(item) == lower);
		};

		Type['is' + name] = typeCheck;
		if (object != null){
			object.prototype.$family = (function(){
				return lower;
			}).hide();
			//<1.2compat>
			object.type = typeCheck;
			//</1.2compat>
		}
	}

	if (object == null) return null;

	object.extend(this);
	object.$constructor = Type;
	object.prototype.$constructor = object;

	return object;
};

var toString = Object.prototype.toString;

Type.isEnumerable = function(item){
	return (item != null && typeof item.length == 'number' && toString.call(item) != '[object Function]' );
};

var hooks = {};

var hooksOf = function(object){
	var type = typeOf(object.prototype);
	return hooks[type] || (hooks[type] = []);
};

var implement = function(name, method){
	if (method && method.$hidden) return this;

	var hooks = hooksOf(this);

	for (var i = 0; i < hooks.length; i++){
		var hook = hooks[i];
		if (typeOf(hook) == 'type') implement.call(hook, name, method);
		else hook.call(this, name, method);
	}
	
	var previous = this.prototype[name];
	if (previous == null || !previous.$protected) this.prototype[name] = method;

	if (this[name] == null && typeOf(method) == 'function') extend.call(this, name, function(item){
		return method.apply(item, slice.call(arguments, 1));
	});

	return this;
};

var extend = function(name, method){
	if (method && method.$hidden) return this;
	var previous = this[name];
	if (previous == null || !previous.$protected) this[name] = method;
	return this;
};

Type.implement({

	implement: implement.overloadSetter(),

	extend: extend.overloadSetter(),

	alias: function(name, existing){
		implement.call(this, name, this.prototype[existing]);
	}.overloadSetter(),

	mirror: function(hook){
		hooksOf(this).push(hook);
		return this;
	}

});

new Type('Type', Type);

// Default Types

var force = function(name, object, methods){
	var isType = (object != Object),
		prototype = object.prototype;

	if (isType) object = new Type(name, object);

	for (var i = 0, l = methods.length; i < l; i++){
		var key = methods[i],
			generic = object[key],
			proto = prototype[key];

		if (generic) generic.protect();

		if (isType && proto){
			delete prototype[key];
			prototype[key] = proto.protect();
		}
	}

	if (isType) object.implement(prototype);

	return force;
};

force('String', String, [
	'charAt', 'charCodeAt', 'concat', 'indexOf', 'lastIndexOf', 'match', 'quote', 'replace', 'search',
	'slice', 'split', 'substr', 'substring', 'toLowerCase', 'toUpperCase'
])('Array', Array, [
	'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice',
	'indexOf', 'lastIndexOf', 'filter', 'forEach', 'every', 'map', 'some', 'reduce', 'reduceRight'
])('Number', Number, [
	'toExponential', 'toFixed', 'toLocaleString', 'toPrecision'
])('Function', Function, [
	'apply', 'call', 'bind'
])('RegExp', RegExp, [
	'exec', 'test'
])('Object', Object, [
	'create', 'defineProperty', 'defineProperties', 'keys',
	'getPrototypeOf', 'getOwnPropertyDescriptor', 'getOwnPropertyNames',
	'preventExtensions', 'isExtensible', 'seal', 'isSealed', 'freeze', 'isFrozen'
])('Date', Date, ['now']);

Object.extend = extend.overloadSetter();

Date.extend('now', function(){
	return +(new Date);
});

new Type('Boolean', Boolean);

// fixes NaN returning as Number

Number.prototype.$family = function(){
	return isFinite(this) ? 'number' : 'null';
}.hide();

// Number.random

Number.extend('random', function(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
});

// forEach, each

Object.extend('forEach', function(object, fn, bind){
	for (var key in object){
		if (object.hasOwnProperty(key)) fn.call(bind, object[key], key, object);
	}
});

Object.each = Object.forEach;

Array.implement({

	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) fn.call(bind, this[i], i, this);
		}
	},

	each: function(fn, bind){
		Array.forEach(this, fn, bind);
		return this;
	}

});

// Array & Object cloning, Object merging and appending

var cloneOf = function(item){
	switch (typeOf(item)){
		case 'array': return item.clone();
		case 'object': return Object.clone(item);
		default: return item;
	}
};

Array.implement('clone', function(){
	var i = this.length, clone = new Array(i);
	while (i--) clone[i] = cloneOf(this[i]);
	return clone;
});

var mergeOne = function(source, key, current){
	switch (typeOf(current)){
		case 'object':
			if (typeOf(source[key]) == 'object') Object.merge(source[key], current);
			else source[key] = Object.clone(current);
		break;
		case 'array': source[key] = current.clone(); break;
		default: source[key] = current;
	}
	return source;
};

Object.extend({

	merge: function(source, k, v){
		if (typeOf(k) == 'string') return mergeOne(source, k, v);
		for (var i = 1, l = arguments.length; i < l; i++){
			var object = arguments[i];
			for (var key in object) mergeOne(source, key, object[key]);
		}
		return source;
	},

	clone: function(object){
		var clone = {};
		for (var key in object) clone[key] = cloneOf(object[key]);
		return clone;
	},

	append: function(original){
		for (var i = 1, l = arguments.length; i < l; i++){
			var extended = arguments[i] || {};
			for (var key in extended) original[key] = extended[key];
		}
		return original;
	}

});

// Object-less types

['Object', 'WhiteSpace', 'TextNode', 'Collection', 'Arguments'].each(function(name){
	new Type(name);
});

// Unique ID

var UID = Date.now();

String.extend('uniqueID', function(){
	return (UID++).toString(36);
});

//<1.2compat>

var Hash = this.Hash = new Type('Hash', function(object){
	if (typeOf(object) == 'hash') object = Object.clone(object.getClean());
	for (var key in object) this[key] = object[key];
	return this;
});

Hash.implement({

	forEach: function(fn, bind){
		Object.forEach(this, fn, bind);
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('each', 'forEach');

Object.type = Type.isObject;

var Native = this.Native = function(properties){
	return new Type(properties.name, properties.initialize);
};

Native.type = Type.type;

Native.implement = function(objects, methods){
	for (var i = 0; i < objects.length; i++) objects[i].implement(methods);
	return Native;
};

var arrayType = Array.type;
Array.type = function(item){
	return instanceOf(item, Array) || arrayType(item);
};

this.$A = function(item){
	return Array.from(item).slice();
};

this.$arguments = function(i){
	return function(){
		return arguments[i];
	};
};

this.$chk = function(obj){
	return !!(obj || obj === 0);
};

this.$clear = function(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

this.$defined = function(obj){
	return (obj != null);
};

this.$each = function(iterable, fn, bind){
	var type = typeOf(iterable);
	((type == 'arguments' || type == 'collection' || type == 'array' || type == 'elements') ? Array : Object).each(iterable, fn, bind);
};

this.$empty = function(){};

this.$extend = function(original, extended){
	return Object.append(original, extended);
};

this.$H = function(object){
	return new Hash(object);
};

this.$merge = function(){
	var args = Array.slice(arguments);
	args.unshift({});
	return Object.merge.apply(null, args);
};

this.$lambda = Function.from;
this.$mixin = Object.merge;
this.$random = Number.random;
this.$splat = Array.from;
this.$time = Date.now;

this.$type = function(object){
	var type = typeOf(object);
	if (type == 'elements') return 'array';
	return (type == 'null') ? false : type;
};

this.$unlink = function(object){
	switch (typeOf(object)){
		case 'object': return Object.clone(object);
		case 'array': return Array.clone(object);
		case 'hash': return new Hash(object);
		default: return object;
	}
};

//</1.2compat>

})();

/*
---

name: Core

description: The heart of MooTools.

license: MIT-style license.

copyright: Copyright (c) 2006-2010 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
  - Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
  - Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

extends: Core/Core

...
*/

(function(){

var arrayish = Array.prototype.indexOf;
var stringish = String.prototype.indexOf
//Speedup 1: Avoid typeOf
var cloneOf = function(item){
  if (item && typeof(item) == 'object' && item.indexOf != stringish && !(item.nodeName && item.nodeType)) {
    if (item.indexOf == arrayish) return item.clone();
    else return Object.clone(item);
  }
  return item;
};
Array.implement('clone', function(){
	var i = this.length, clone = new Array(i);
	while (i--) clone[i] = cloneOf(this[i]);
	return clone;
});

//Speedup 2: Avoid typeOf
var mergeOne = function(source, key, current){
  if (current && typeof(current) == 'object' && current.indexOf != stringish && !(current.nodeName && current.nodeType)) {
    if (current.indexOf != arrayish) {
      var target = source[key];
			if (target && typeof(target) == 'object' && current.indexOf != stringish && target.indexOf != arrayish) Object.merge(source[key], current);
			else source[key] = Object.clone(current);
    } else source[key] = current.clone();
  } else source[key] = current;
	return source;
};


Object.extend({

  //Speedup 3: Avoid typeOf
	merge: function(source, k, v){
		if (typeof(k) == 'string' || (k && k.indexOf == stringish)) return mergeOne(source, k, v);
		for (var i = 1, l = arguments.length; i < l; i++){
			var object = arguments[i];
			for (var key in object) mergeOne(source, key, object[key]);
		}
		return source;
	},

	clone: function(object){
		var clone = {};
		for (var key in object) clone[key] = cloneOf(object[key]);
		return clone;
	}
});

})();

/*
---

name: String

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires: Type

provides: String

...
*/

String.implement({

	test: function(regex, params){
		return ((typeOf(regex) == 'regexp') ? regex : new RegExp('' + regex, params)).test(this);
	},

	contains: function(string, separator){
		return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : this.indexOf(string) > -1;
	},

	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return this.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	substitute: function(object, regexp){
		return this.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != null) ? object[name] : '';
		});
	}

});

/*
---

name: Array

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires: Type

provides: Array

...
*/

Array.implement({

	invoke: function(methodName){
		var args = Array.slice(arguments, 1);
		return this.map(function(item){
			return item[methodName].apply(item, args);
		});
	},

	every: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if ((i in this) && !fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},

	clean: function(){
		return this.filter(function(item){
			return item != null;
		});
	},

	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) results[i] = fn.call(bind, this[i], i, this);
		}
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	append: function(array){
		this.push.apply(this, array);
		return this;
	},

	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[Number.random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--;){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = typeOf(this[i]);
			if (type == 'null') continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments' || instanceOf(this[i], Array)) ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	pick: function(){
		for (var i = 0, l = this.length; i < l; i++){
			if (this[i] != null) return this[i];
		}
		return null;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return value.toInt(16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});

//<1.2compat>

Array.alias('extend', 'append');

var $pick = function(){
	return Array.from(arguments).pick();
};

//</1.2compat>

/*
---
name: Color
description: Class to create and manipulate colors. Includes HSB «-» RGB «-» HEX conversions. Supports alpha for each type.
requires: [Core/Type, Core/Array]
provides: Color
...
*/

(function(){

var colors = {
	maroon: '#800000', red: '#ff0000', orange: '#ffA500', yellow: '#ffff00', olive: '#808000',
	purple: '#800080', fuchsia: "#ff00ff", white: '#ffffff', lime: '#00ff00', green: '#008000',
	navy: '#000080', blue: '#0000ff', aqua: '#00ffff', teal: '#008080',
	black: '#000000', silver: '#c0c0c0', gray: '#808080'
};

var Color = this.Color = function(color, type){
	
	if (color.isColor){
		
		this.red = color.red;
		this.green = color.green;
		this.blue = color.blue;
		this.alpha = color.alpha;

	} else {
		
		var namedColor = colors[color];
		if (namedColor){
			color = namedColor;
			type = 'hex';
		}

		switch (typeof color){
			case 'string': if (!type) type = (type = color.match(/^rgb|^hsb/)) ? type[0] : 'hex'; break;
			case 'object': type = type || 'rgb'; color = color.toString(); break;
			case 'number': type = 'hex'; color = color.toString(16); break;
		}

		color = Color['parse' + type.toUpperCase()](color);
		this.red = color[0];
		this.green = color[1];
		this.blue = color[2];
		this.alpha = color[3];
	}
	
	this.isColor = true;

};

var limit = function(number, min, max){
	return Math.min(max, Math.max(min, number));
};

var listMatch = /([-.\d]+)\s*,\s*([-.\d]+)\s*,\s*([-.\d]+)\s*,?\s*([-.\d]*)/;
var hexMatch = /^#?([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{0,2})$/i;

Color.parseRGB = function(color){
	return color.match(listMatch).slice(1).map(function(bit, i){
		return (i < 3) ? Math.round(((bit %= 256) < 0) ? bit + 256 : bit) : limit(((bit === '') ? 1 : Number(bit)), 0, 1);
	});
};
	
Color.parseHEX = function(color){
	if (color.length == 1) color = color + color + color;
	return color.match(hexMatch).slice(1).map(function(bit, i){
		if (i == 3) return (bit) ? parseInt(bit, 16) / 255 : 1;
		return parseInt((bit.length == 1) ? bit + bit : bit, 16);
	});
};
	
Color.parseHSB = function(color){
	var hsb = color.match(listMatch).slice(1).map(function(bit, i){
		if (i === 0) return Math.round(((bit %= 360) < 0) ? (bit + 360) : bit);
		else if (i < 3) return limit(Math.round(bit), 0, 100);
		else return limit(((bit === '') ? 1 : Number(bit)), 0, 1);
	});
	
	var a = hsb[3];
	var br = Math.round(hsb[2] / 100 * 255);
	if (hsb[1] == 0) return [br, br, br, a];
		
	var hue = hsb[0];
	var f = hue % 60;
	var p = Math.round((hsb[2] * (100 - hsb[1])) / 10000 * 255);
	var q = Math.round((hsb[2] * (6000 - hsb[1] * f)) / 600000 * 255);
	var t = Math.round((hsb[2] * (6000 - hsb[1] * (60 - f))) / 600000 * 255);

	switch (Math.floor(hue / 60)){
		case 0: return [br, t, p, a];
		case 1: return [q, br, p, a];
		case 2: return [p, br, t, a];
		case 3: return [p, q, br, a];
		case 4: return [t, p, br, a];
		default: return [br, p, q, a];
	}
};

var toString = function(type, array){
	if (array[3] != 1) type += 'a';
	else array.pop();
	return type + '(' + array.join(', ') + ')';
};

Color.prototype = {

	toHSB: function(array){
		var red = this.red, green = this.green, blue = this.blue, alpha = this.alpha;

		var max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
		var hue = 0, saturation = (max != 0) ? delta / max : 0, brightness = max / 255;
		if (saturation){
			var rr = (max - red) / delta, gr = (max - green) / delta, br = (max - blue) / delta;
			hue = (red == max) ? br - gr : (green == max) ? 2 + rr - br : 4 + gr - rr;
			if ((hue /= 6) < 0) hue++;
		}

		var hsb = [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100), alpha];

		return (array) ? hsb : toString('hsb', hsb);
	},

	toHEX: function(array){

		var a = this.alpha;
		var alpha = ((a = Math.round((a * 255)).toString(16)).length == 1) ? a + a : a;
		
		var hex = [this.red, this.green, this.blue].map(function(bit){
			bit = bit.toString(16);
			return (bit.length == 1) ? '0' + bit : bit;
		});
		
		return (array) ? hex.concat(alpha) : '#' + hex.join('') + ((alpha == 'ff') ? '' : alpha);
	},
	
	toRGB: function(array){
		var rgb = [this.red, this.green, this.blue, this.alpha];
		return (array) ? rgb : toString('rgb', rgb);
	}

};

Color.prototype.toString = Color.prototype.toRGB;

Color.hex = function(hex){
	return new Color(hex, 'hex');
};

if (this.hex == null) this.hex = Color.hex;

Color.hsb = function(h, s, b, a){
	return new Color([h || 0, s || 0, b || 0, (a == null) ? 1 : a], 'hsb');
};

if (this.hsb == null) this.hsb = Color.hsb;

Color.rgb = function(r, g, b, a){
	return new Color([r || 0, g || 0, b || 0, (a == null) ? 1 : a], 'rgb');
};

if (this.rgb == null) this.rgb = Color.rgb;

if (this.Type) new Type('Color', Color);

})();

/*
---

name: Object

description: Object generic methods

license: MIT-style license.

requires: Type

provides: [Object, Hash]

...
*/


Object.extend({

	subset: function(object, keys){
		var results = {};
		for (var i = 0, l = keys.length; i < l; i++){
			var k = keys[i];
			results[k] = object[k];
		}
		return results;
	},

	map: function(object, fn, bind){
		var results = {};
		for (var key in object){
			if (object.hasOwnProperty(key)) results[key] = fn.call(bind, object[key], key, object);
		}
		return results;
	},

	filter: function(object, fn, bind){
		var results = {};
		Object.each(object, function(value, key){
			if (fn.call(bind, value, key, object)) results[key] = value;
		});
		return results;
	},

	every: function(object, fn, bind){
		for (var key in object){
			if (object.hasOwnProperty(key) && !fn.call(bind, object[key], key)) return false;
		}
		return true;
	},

	some: function(object, fn, bind){
		for (var key in object){
			if (object.hasOwnProperty(key) && fn.call(bind, object[key], key)) return true;
		}
		return false;
	},

	keys: function(object){
		var keys = [];
		for (var key in object){
			if (object.hasOwnProperty(key)) keys.push(key);
		}
		return keys;
	},

	values: function(object){
		var values = [];
		for (var key in object){
			if (object.hasOwnProperty(key)) values.push(object[key]);
		}
		return values;
	},

	getLength: function(object){
		return Object.keys(object).length;
	},

	keyOf: function(object, value){
		for (var key in object){
			if (object.hasOwnProperty(key) && object[key] === value) return key;
		}
		return null;
	},

	contains: function(object, value){
		return Object.keyOf(object, value) != null;
	},

	toQueryString: function(object, base){
		var queryString = [];

		Object.each(object, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch (typeOf(value)){
				case 'object': result = Object.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Object.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != null) queryString.push(result);
		});

		return queryString.join('&');
	}

});


//<1.2compat>

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		return Object.keyOf(this, value);
	},

	hasValue: function(value){
		return Object.contains(this, value);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == null) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		return new Hash(Object.map(this, fn, bind));
	},

	filter: function(fn, bind){
		return new Hash(Object.filter(this, fn, bind));
	},

	every: function(fn, bind){
		return Object.every(this, fn, bind);
	},

	some: function(fn, bind){
		return Object.some(this, fn, bind);
	},

	getKeys: function(){
		return Object.keys(this);
	},

	getValues: function(){
		return Object.values(this);
	},

	toQueryString: function(base){
		return Object.toQueryString(this, base);
	}

});

Hash.extend = Object.append;

Hash.alias({indexOf: 'keyOf', contains: 'hasValue'});

//</1.2compat>

/*
---
 
script: Base.js
 
description: Speedy function that checks equality of objects (doing some nasty type assumption)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

extends: Core/Object

*/



Object.equals = function(one, another) {
  if (one == another) return true;
  if ((!one) ^ (!another)) return false;
  if (typeof one == 'undefined') return false;
  
  if ((one instanceof Array) || one.callee) {
    var j = one.length;
    if (j != another.length) return false;
    for (var i = 0; i < j; i++) if (!Object.equals(one[i], another[i])) return false;
    return true;
  } else if (one instanceof Color) {
    return (one.red == another.red) && (one.green == another.green) && (one.blue == another.blue) && (one.alpha == another.alpha)
  } else if (typeof one == 'object') {
    if (one.equals) return one.equals(another)
    for (var i in one) if (!Object.equals(one[i], another[i])) return false;
    return true;
  }
  return false;
};
/*
---

name: Number

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires: Type

provides: Number

...
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('each', 'times');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat(Array.from(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);

/*
---

name: Function

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires: Type

provides: Function

...
*/

Function.extend({

	attempt: function(){
		for (var i = 0, l = arguments.length; i < l; i++){
			try {
				return arguments[i]();
			} catch (e){}
		}
		return null;
	}

});

Function.implement({

	attempt: function(args, bind){
		try {
			return this.apply(bind, Array.from(args));
		} catch (e){}
		
		return null;
	},

	bind: function(bind){
		var self = this,
			args = (arguments.length > 1) ? Array.slice(arguments, 1) : null;
		
		return function(){
			if (!args && !arguments.length) return self.call(bind);
			if (args && arguments.length) return self.apply(bind, args.concat(Array.from(arguments)));
			return self.apply(bind, args || arguments);
		};
	},

	pass: function(args, bind){
		var self = this;
		if (args != null) args = Array.from(args);
		return function(){
			return self.apply(bind, args || arguments);
		};
	},

	delay: function(delay, bind, args){
		return setTimeout(this.pass((args == null ? [] : args), bind), delay);
	},

	periodical: function(periodical, bind, args){
		return setInterval(this.pass((args == null ? [] : args), bind), periodical);
	}

});

//<1.2compat>

delete Function.prototype.bind;

Function.implement({

	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != null) ? Array.from(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return Function.attempt(returns);
			return returns();
		};
	},

	bind: function(bind, args){
		var self = this;
		if (args != null) args = Array.from(args);
		return function(){
			return self.apply(bind, args || arguments);
		};
	},

	bindWithEvent: function(bind, args){
		var self = this;
		if (args != null) args = Array.from(args);
		return function(event){
			return self.apply(bind, (args == null) ? arguments : [event].concat(args));
		};
	},

	run: function(args, bind){
		return this.apply(bind, Array.from(args));
	}

});

var $try = Function.attempt;

//</1.2compat>

/*
---

name: Browser

description: The Browser Object. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: [Array, Function, Number, String]

provides: [Browser, Window, Document]

...
*/

(function(){

var document = this.document;
var window = document.window = this;

var UID = 1;

this.$uid = (window.ActiveXObject) ? function(item){
	return (item.uid || (item.uid = [UID++]))[0];
} : function(item){
	return item.uid || (item.uid = UID++);
};

$uid(window);
$uid(document);

var ua = navigator.userAgent.toLowerCase(),
	platform = navigator.platform.toLowerCase(),
	UA = ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0],
	mode = UA[1] == 'ie' && document.documentMode;

var Browser = this.Browser = {

	extend: Function.prototype.extend,

	name: (UA[1] == 'version') ? UA[3] : UA[1],

	version: mode || parseFloat((UA[1] == 'opera' && UA[4]) ? UA[4] : UA[2]),

	Platform: {
		name: ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['other'])[0]
	},

	Features: {
		xpath: !!(document.evaluate),
		air: !!(window.runtime),
		query: !!(document.querySelector),
		json: !!(window.JSON)
	},

	Plugins: {}

};

Browser[Browser.name] = true;
Browser[Browser.name + parseInt(Browser.version, 10)] = true;
Browser.Platform[Browser.Platform.name] = true;

// Request

Browser.Request = (function(){

	var XMLHTTP = function(){
		return new XMLHttpRequest();
	};

	var MSXML2 = function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	};

	var MSXML = function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	};

	return Function.attempt(function(){
		XMLHTTP();
		return XMLHTTP;
	}, function(){
		MSXML2();
		return MSXML2;
	}, function(){
		MSXML();
		return MSXML;
	});

})();

Browser.Features.xhr = !!(Browser.Request);

// Flash detection

var version = (Function.attempt(function(){
	return navigator.plugins['Shockwave Flash'].description;
}, function(){
	return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
}) || '0 r0').match(/\d+/g);

Browser.Plugins.Flash = {
	version: Number(version[0] || '0.' + version[1]) || 0,
	build: Number(version[2]) || 0
};

// String scripts

Browser.exec = function(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.text = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

String.implement('stripScripts', function(exec){
	var scripts = '';
	var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(all, code){
		scripts += code + '\n';
		return '';
	});
	if (exec === true) Browser.exec(scripts);
	else if (typeOf(exec) == 'function') exec(scripts, text);
	return text;
});

// Window, Document

Browser.extend({
	Document: this.Document,
	Window: this.Window,
	Element: this.Element,
	Event: this.Event
});

this.Window = this.$constructor = new Type('Window', function(){});

this.$family = Function.from('window').hide();

Window.mirror(function(name, method){
	window[name] = method;
});

this.Document = document.$constructor = new Type('Document', function(){});

document.$family = Function.from('document').hide();

Document.mirror(function(name, method){
	document[name] = method;
});

document.html = document.documentElement;
document.head = document.getElementsByTagName('head')[0];

if (document.execCommand) try {
	document.execCommand("BackgroundImageCache", false, true);
} catch (e){}

if (this.attachEvent && !this.addEventListener){
	var unloadEvent = function(){
		this.detachEvent('onunload', unloadEvent);
		document.head = document.html = document.window = null;
	};
	this.attachEvent('onunload', unloadEvent);
}

// IE fails on collections and <select>.options (refers to <select>)
var arrayFrom = Array.from;
try {
	arrayFrom(document.html.childNodes);
} catch(e){
	Array.from = function(item){
		if (typeof item != 'string' && Type.isEnumerable(item) && typeOf(item) != 'array'){
			var i = item.length, array = new Array(i);
			while (i--) array[i] = item[i];
			return array;
		}
		return arrayFrom(item);
	};

	var prototype = Array.prototype,
		slice = prototype.slice;
	['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice'].each(function(name){
		var method = prototype[name];
		Array[name] = function(item){
			return method.apply(Array.from(item), slice.call(arguments, 1));
		};
	});
}

//<1.2compat>

if (Browser.Platform.ios) Browser.Platform.ipod = true;

Browser.Engine = {};

var setEngine = function(name, version){
	Browser.Engine.name = name;
	Browser.Engine[name + version] = true;
	Browser.Engine.version = version;
};

if (Browser.ie){
	Browser.Engine.trident = true;

	switch (Browser.version){
		case 6: setEngine('trident', 4); break;
		case 7: setEngine('trident', 5); break;
		case 8: setEngine('trident', 6);
	}
}

if (Browser.firefox){
	Browser.Engine.gecko = true;

	if (Browser.version >= 3) setEngine('gecko', 19);
	else setEngine('gecko', 18);
}

if (Browser.safari || Browser.chrome){
	Browser.Engine.webkit = true;

	switch (Browser.version){
		case 2: setEngine('webkit', 419); break;
		case 3: setEngine('webkit', 420); break;
		case 4: setEngine('webkit', 525);
	}
}

if (Browser.opera){
	Browser.Engine.presto = true;

	if (Browser.version >= 9.6) setEngine('presto', 960);
	else if (Browser.version >= 9.5) setEngine('presto', 950);
	else setEngine('presto', 925);
}

if (Browser.name == 'unknown'){
	switch ((ua.match(/(?:webkit|khtml|gecko)/) || [])[0]){
		case 'webkit':
		case 'khtml':
			Browser.Engine.webkit = true;
		break;
		case 'gecko':
			Browser.Engine.gecko = true;
	}
}

this.$exec = Browser.exec;

//</1.2compat>

})();

/*
---

name: Event

description: Contains the Event Class, to make the event object cross-browser.

license: MIT-style license.

requires: [Window, Document, Array, Function, String, Object]

provides: Event

...
*/

var Event = new Type('Event', function(event, win){
	if (!win) win = window;
	var doc = win.document;
	event = event || win.event;
	if (event.$extended) return event;
	this.$extended = true;
	var type = event.type,
		target = event.target || event.srcElement,
		page = {},
		client = {};
	while (target && target.nodeType == 3) target = target.parentNode;

	if (type.indexOf('key') != -1){
		var code = event.which || event.keyCode;
		var key = Object.keyOf(Event.Keys, code);
		if (type == 'keydown'){
			var fKey = code - 111;
			if (fKey > 0 && fKey < 13) key = 'f' + fKey;
		}
		if (!key) key = String.fromCharCode(code).toLowerCase();
	} else if ((/click|mouse|menu/i).test(type)){
		doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
		page = {
			x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft,
			y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
		};
		client = {
			x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX,
			y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
		};
		if ((/DOMMouseScroll|mousewheel/).test(type)){
			var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
		}
		var rightClick = (event.which == 3) || (event.button == 2),
			related = null;
		if ((/over|out/).test(type)){
			related = event.relatedTarget || event[(type == 'mouseover' ? 'from' : 'to') + 'Element'];
			var testRelated = function(){
				while (related && related.nodeType == 3) related = related.parentNode;
				return true;
			};
			var hasRelated = (Browser.firefox2) ? testRelated.attempt() : testRelated();
			related = (hasRelated) ? related : null;
		}
	} else if ((/gesture|touch/i).test(type)){
		this.rotation = event.rotation;
		this.scale = event.scale;
		this.targetTouches = event.targetTouches;
		this.changedTouches = event.changedTouches;
		var touches = this.touches = event.touches;
		if (touches && touches[0]){
			var touch = touches[0];
			page = {x: touch.pageX, y: touch.pageY};
			client = {x: touch.clientX, y: touch.clientY};
		}
	}

	return Object.append(this, {
		event: event,
		type: type,

		page: page,
		client: client,
		rightClick: rightClick,

		wheel: wheel,

		relatedTarget: document.id(related),
		target: document.id(target),

		code: code,
		key: key,

		shift: event.shiftKey,
		control: event.ctrlKey,
		alt: event.altKey,
		meta: event.metaKey
	});
});

Event.Keys = {
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
};

//<1.2compat>

Event.Keys = new Hash(Event.Keys);

//</1.2compat>

Event.implement({

	stop: function(){
		return this.stopPropagation().preventDefault();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});

/*
---
 
script: Event.js
 
description: Some additional methods for keypress implementation that sniff key strokes.
 
license: MIT-style license.
 
requires:
- Core/Event
 
provides: [Event.KeyNames]
 
...
*/


Event.Keys = {
	keyOf: function(code) {
		return Event.KeyNames[code];
	}
};



(function() {
	
	//borrowed from google closure
	// TODO check with diferent browsers
	Browser.Features.keydown = (Browser.ie || Browser.chrome || Browser.safari);
	
	Event.KeyNames = {
	  8: 'backspace',
	  9: 'tab',
	  13: 'enter',
	  16: 'shift',
	  17: 'control',
	  18: 'alt',
	  19: 'pause',
	  20: 'caps-lock',
	  27: 'esc',
	  32: 'space',
	  33: 'pg-up',
	  34: 'pg-down',
	  35: 'end',
	  36: 'home',
	  37: 'left',
	  38: 'up',
	  39: 'right',
	  40: 'down',
	  45: 'insert',
	  46: 'delete',
	  48: '0',
	  49: '1',
	  50: '2',
	  51: '3',
	  52: '4',
	  53: '5',
	  54: '6',
	  55: '7',
	  56: '8',
	  57: '9',
	  65: 'a',
	  66: 'b',
	  67: 'c',
	  68: 'd',
	  69: 'e',
	  70: 'f',
	  71: 'g',
	  72: 'h',
	  73: 'i',
	  74: 'j',
	  75: 'k',
	  76: 'l',
	  77: 'm',
	  78: 'n',
	  79: 'o',
	  80: 'p',
	  81: 'q',
	  82: 'r',
	  83: 's',
	  84: 't',
	  85: 'u',
	  86: 'v',
	  87: 'w',
	  88: 'x',
	  89: 'y',
	  90: 'z',
	  93: 'context',
	  107: 'num-plus',
	  109: 'num-minus',
	  112: 'f1',
	  113: 'f2',
	  114: 'f3',
	  115: 'f4',
	  116: 'f5',
	  117: 'f6',
	  118: 'f7',
	  119: 'f8',
	  120: 'f9',
	  121: 'f10',
	  122: 'f11',
	  123: 'f12',
	  187: 'equals',
	  188: ',',
	  190: '.',
	  191: '/',
	  220: '\\',
	  224: 'meta'
	};
	
	Event.Codes = {
	  MAC_ENTER: 3,
	  BACKSPACE: 8,
	  TAB: 9,
	  NUM_CENTER: 12,
	  ENTER: 13,
	  SHIFT: 16,
	  CTRL: 17,
	  ALT: 18,
	  PAUSE: 19,
	  CAPS_LOCK: 20,
	  ESC: 27,
	  SPACE: 32,
	  PAGE_UP: 33,     // also NUM_NORTH_EAST
	  PAGE_DOWN: 34,   // also NUM_SOUTH_EAST
	  END: 35,         // also NUM_SOUTH_WEST
	  HOME: 36,        // also NUM_NORTH_WEST
	  LEFT: 37,        // also NUM_WEST
	  UP: 38,          // also NUM_NORTH
	  RIGHT: 39,       // also NUM_EAST
	  DOWN: 40,        // also NUM_SOUTH
	  PRINT_SCREEN: 44,
	  INSERT: 45,      // also NUM_INSERT
	  DELETE: 46,      // also NUM_DELETE
	  ZERO: 48,
	  ONE: 49,
	  TWO: 50,
	  THREE: 51,
	  FOUR: 52,
	  FIVE: 53,
	  SIX: 54,
	  SEVEN: 55,
	  EIGHT: 56,
	  NINE: 57,
	  QUESTION_MARK: 63, // needs localization
	  A: 65,
	  B: 66,
	  C: 67,
	  D: 68,
	  E: 69,
	  F: 70,
	  G: 71,
	  H: 72,
	  I: 73,
	  J: 74,
	  K: 75,
	  L: 76,
	  M: 77,
	  N: 78,
	  O: 79,
	  P: 80,
	  Q: 81,
	  R: 82,
	  S: 83,
	  T: 84,
	  U: 85,
	  V: 86,
	  W: 87,
	  X: 88,
	  Y: 89,
	  Z: 90,
	  META: 91,
	  CONTEXT_MENU: 93,
	  NUM_ZERO: 96,
	  NUM_ONE: 97,
	  NUM_TWO: 98,
	  NUM_THREE: 99,
	  NUM_FOUR: 100,
	  NUM_FIVE: 101,
	  NUM_SIX: 102,
	  NUM_SEVEN: 103,
	  NUM_EIGHT: 104,
	  NUM_NINE: 105,
	  NUM_MULTIPLY: 106,
	  NUM_PLUS: 107,
	  NUM_MINUS: 109,
	  NUM_PERIOD: 110,
	  NUM_DIVISION: 111,
	  F1: 112,
	  F2: 113,
	  F3: 114,
	  F4: 115,
	  F5: 116,
	  F6: 117,
	  F7: 118,
	  F8: 119,
	  F9: 120,
	  F10: 121,
	  F11: 122,
	  F12: 123,
	  NUMLOCK: 144,
	  SEMICOLON: 186,            
	  DASH: 189,                 
	  EQUALS: 187,               
	  COMMA: 188,                
	  PERIOD: 190,               
	  SLASH: 191,                
	  APOSTROPHE: 192,           
	  SINGLE_QUOTE: 222,         
	  OPEN_SQUARE_BRACKET: 219,  
	  BACKSLASH: 220,            
	  CLOSE_SQUARE_BRACKET: 221, 
	  META_KEY: 224,
	  MAC_FF_META: 224, // Firefox (Gecko) fires this for the meta key instead of 91
	  WIN_IME: 229
	};
	
	Event.implement({
		isTextModifyingKeyEvent:	function(e) {
		  if (this.alt && this.control ||
		      this.meta ||
		      // Function keys don't generate text
		      this.code >= Event.Codes.F1 &&
		      this.code <= Event.Codes.F12) {
		    return false;
		  }
		
		  // The following keys are quite harmless, even in combination with
		  // CTRL, ALT or SHIFT.
		  switch (this.code) {
		    case Event.Codes.ALT:
		    case Event.Codes.SHIFT:
		    case Event.Codes.CTRL:
		    case Event.Codes.PAUSE:
		    case Event.Codes.CAPS_LOCK:
		    case Event.Codes.ESC:
		    case Event.Codes.PAGE_UP:
		    case Event.Codes.PAGE_DOWN:
		    case Event.Codes.HOME:
		    case Event.Codes.END:
		    case Event.Codes.LEFT:
		    case Event.Codes.RIGHT:
		    case Event.Codes.UP:
		    case Event.Codes.DOWN:
		    case Event.Codes.INSERT:
		    case Event.Codes.NUMLOCK:
		    case Event.Codes.CONTEXT_MENU:
		    case Event.Codes.PRINT_SCREEN:
		      return false;
		    default:
		      return true;
		  }
		},
		
		firesKeyPressEvent: function(held) {
			if (!Browser.Features.keydown) {
		    return true;
		  }

		  if (Browser.Platform.mac && this.alt) {
		    return Event.Codes.isCharacterKey(this.code);
		  }

		  // Alt but not AltGr which is represented as Alt+Ctrl.
		  if (this.alt && !this.control) {
		    return false;
		  }

		  // Saves Ctrl or Alt + key for IE7, which won't fire keypress.
		  if (Browser.Engine.trident &&
		      !this.shift &&
		      (held == Event.Codes.CTRL ||
		       held == Event.Codes.ALT)) {
		    return false;
		  }

		  // When Ctrl+<somekey> is held in IE, it only fires a keypress once, but it
		  // continues to fire keydown events as the event repeats.
		  if (Browser.Engine.trient && this.control && held == this.code) {
		    return false;
		  }

		  switch (this.code) {
		    case Event.Codes.ENTER:
		      return true;
		    case Event.Codes.ESC:
		      return !Browser.Engine.webkit;
		  }

		  return this.isCharacterKey();
		},
		
		isCharacterKey: function(code) {
		  if (this.code >= Event.Codes.ZERO &&
		      this.code <= Event.Codes.NINE) {
		    return true;
		  }

		  if (this.code >= Event.Codes.NUM_ZERO &&
		      this.code <= Event.Codes.NUM_MULTIPLY) {
		    return true;
		  }

		  if (this.code >= Event.Codes.A &&
		      this.code <= Event.Codes.Z) {
		    return true;
		  }

		  switch (this.code) {
		    case Event.Codes.SPACE:
		    case Event.Codes.QUESTION_MARK:
		    case Event.Codes.NUM_PLUS:
		    case Event.Codes.NUM_MINUS:
		    case Event.Codes.NUM_PERIOD:
		    case Event.Codes.NUM_DIVISION:
		    case Event.Codes.SEMICOLON:
		    case Event.Codes.DASH:
		    case Event.Codes.EQUALS:
		    case Event.Codes.COMMA:
		    case Event.Codes.PERIOD:
		    case Event.Codes.SLASH:
		    case Event.Codes.APOSTROPHE:
		    case Event.Codes.SINGLE_QUOTE:
		    case Event.Codes.OPEN_SQUARE_BRACKET:
		    case Event.Codes.BACKSLASH:
		    case Event.Codes.CLOSE_SQUARE_BRACKET:
		      return true;
		    default:
		      return false;
		  }
		}
	});
})();
/*
---

name: Browser.Features.Touch

description: Checks whether the used Browser has touch events

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Browser]

provides: Browser.Features.Touch

...
*/

Browser.Features.Touch = (function(){
	try {
		document.createEvent('TouchEvent').initTouchEvent('touchstart');
		return true;
	} catch (exception){}
	
	return false;
})();

// Chrome 5 thinks it is touchy!
// Android doesn't have a touch delay and dispatchEvent does not fire the handler
Browser.Features.iOSTouch = (function(){
	var name = 'cantouch', // Name does not matter
		html = document.html,
		hasTouch = false;

	var handler = function(){
		html.removeEventListener(name, handler, true);
		hasTouch = true;
	};

	try {
		html.addEventListener(name, handler, true);
		var event = document.createEvent('TouchEvent');
		event.initTouchEvent(name);
		html.dispatchEvent(event);
		return hasTouch;
	} catch (exception){}

	handler(); // Remove listener
	return false;
})();

/*
---

name: Class

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires: [Array, String, Function, Number]

provides: Class

...
*/

(function(){

var Class = this.Class = new Type('Class', function(params){
	if (instanceOf(params, Function)) params = {initialize: params};

	var newClass = function(){
		reset(this);
		if (newClass.$prototyping) return this;
		this.$caller = null;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		this.$caller = this.caller = null;
		return value;
	}.extend(this).implement(params);

	newClass.$constructor = Class;
	newClass.prototype.$constructor = newClass;
	newClass.prototype.parent = parent;

	return newClass;
});

var parent = function(){
	if (!this.$caller) throw new Error('The method "parent" cannot be called.');
	var name = this.$caller.$name,
		parent = this.$caller.$owner.parent,
		previous = (parent) ? parent.prototype[name] : null;
	if (!previous) throw new Error('The method "' + name + '" has no parent.');
	return previous.apply(this, arguments);
};

var reset = function(object){
	for (var key in object){
		var value = object[key];
		switch (typeOf(value)){
			case 'object':
				var F = function(){};
				F.prototype = value;
				object[key] = reset(new F);
			break;
			case 'array': object[key] = value.clone(); break;
		}
	}
	return object;
};

var wrap = function(self, key, method){
	if (method.$origin) method = method.$origin;
	var wrapper = function(){
		if (method.$protected && this.$caller == null) throw new Error('The method "' + key + '" cannot be called.');
		var caller = this.caller, current = this.$caller;
		this.caller = current; this.$caller = wrapper;
		var result = method.apply(this, arguments);
		this.$caller = current; this.caller = caller;
		return result;
	}.extend({$owner: self, $origin: method, $name: key});
	return wrapper;
};

var implement = function(key, value, retain){
	if (Class.Mutators.hasOwnProperty(key)){
		value = Class.Mutators[key].call(this, value);
		if (value == null) return this;
	}

	if (typeOf(value) == 'function'){
		if (value.$hidden) return this;
		this.prototype[key] = (retain) ? value : wrap(this, key, value);
	} else {
		Object.merge(this.prototype, key, value);
	}

	return this;
};

var getInstance = function(klass){
	klass.$prototyping = true;
	var proto = new klass;
	delete klass.$prototyping;
	return proto;
};

Class.implement('implement', implement.overloadSetter());

Class.Mutators = {

	Extends: function(parent){
		this.parent = parent;
		this.prototype = getInstance(parent);
	},

	Implements: function(items){
		Array.from(items).each(function(item){
			var instance = new item;
			for (var key in instance) implement.call(this, key, instance[key], true);
		}, this);
	}
};

})();

/*
---

name: Class

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

extends: Core/Class


...
*/

(function(){

var Class = this.Class = new Type('Class', function(params){
	if (instanceOf(params, Function)) params = {initialize: params};

	var newClass = function(){
		reset(this);
		if (newClass.$prototyping) return this;
		this.$caller = null;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		this.$caller = this.caller = null;
		return value;
	}.extend(this).implement(params);

	newClass.$constructor = Class;
	newClass.prototype.$constructor = newClass;
	newClass.prototype.parent = parent;

	return newClass;
});

var parent = function(){
	if (!this.$caller) throw new Error('The method "parent" cannot be called.');
	var name = this.$caller.$name,
		parent = this.$caller.$owner.parent,
		previous = (parent) ? parent.prototype[name] : null;
		if (!previous) console.dir(this.$caller)
	if (!previous) throw new Error('The method "' + name + '" has no parent.');
	return previous.apply(this, arguments);
};


var indexOf = Array.prototype.indexOf;
//Speedup1: Avoid typeOf in reset

// before: 
// switch (typeOf(value)){
//	case 'object':
//	case 'array':

// after:
var reset = function(object){
	for (var key in object){
		var value = object[key];
    if (value && typeof(value) == 'object') {
      if (value.indexOf != indexOf) {
				var F = function(){};
				F.prototype = value;
				object[key] = reset(new F);
      } else object[key] = value.clone();
    }
	}
	return object;
};

var wrap = function(self, key, method){
	if (method.$origin) method = method.$origin;
	var wrapper = function(){
		if (method.$protected && this.$caller == null) throw new Error('The method "' + key + '" cannot be called.');
		var caller = this.caller, current = this.$caller;
		this.caller = current; this.$caller = wrapper;
		var result = method.apply(this, arguments);
		this.$caller = current; this.caller = caller;
		return result;
	}.extend({$owner: self, $origin: method, $name: key});
	return wrapper;
};

//Speedup 2: Avoid typeOf in implement
var apply = Function.prototype.apply
var implement = function(key, value, retain){
	if (Class.Mutators.hasOwnProperty(key)){
		value = Class.Mutators[key].call(this, value);
		if (value == null) return this;
	}

	if (value && value.call && (value.apply == apply)){
		if (value.$hidden) return this;
		this.prototype[key] = (retain) ? value : wrap(this, key, value);
	} else {
		Object.merge(this.prototype, key, value);
	}

	return this;
};

var getInstance = function(klass){
if (!klass) debugger
	klass.$prototyping = true;
	var proto = new klass;
	delete klass.$prototyping;
	return proto;
};

Class.implement('implement', implement.overloadSetter());

Class.Mutators = {

	Extends: function(parent){
		this.parent = parent;
		this.prototype = getInstance(parent);
	},

	Implements: function(items){
		Array.from(items).each(function(item){
			var instance = new item;
			for (var key in instance) implement.call(this, key, instance[key], true);
		}, this);
	}
};

})();

/*
---
 
script: FastArray.js
 
description: Array with fast lookup (based on object)
 
license: MIT-style license.
 
requires:
- Core/Class
 
provides: [FastArray]
 
...
*/

FastArray = function() {
  this.push.apply(this, arguments);
}

FastArray.from = function(ary) {
  var array = new FastArray;
  FastArray.prototype.push.apply(array, ary)
  return array;
}
FastArray.prototype = {
  push: function() {
    Array.each(arguments, function(argument) {
      this[argument] = true;
    }, this);
  },

  contains: function(argument) {
    return this[argument];
  },
  
  concat: function(array) {
    this.push.apply(this, array);
    return this;
  },
  
  each: function(callback, bound) {
    for (var key in this) {
      if (this.hasOwnProperty(key)) callback.call(bound || this, key, this[key]);
    }
  },

  include: function(value) {
    this[value] = true;
  },

  erase: function(value) {
    delete this[value];
  },
  
  join: function(delimeter) {
    var bits = [];
    for (var key in this) if (this.hasOwnProperty(key)) bits.push(key);
    return bits.join(delimeter)
  }
};
/*
---
 
script: Class.Mixin.js
 
description: Classes that can be mixed in and out in runtime.
 
license: MIT-style license.
 
requires:
  - Core/Class

provides: 
  - Class.Mutators.Mixins
  - Class.mixin
  - Class.unmix
 
...
*/

Class.mixin = function(instance, klass) {
  var proto = klass.prototype;
  Object.each(proto, function(value, name) {
    if (typeof value !== 'function') return;
    switch (name) {
      case "parent": case "initialize": case "uninitialize": case "$constructor":
        return;
    }
    value = value.$origin;
    var origin = instance[name], parent, wrap
    if (origin) {
      if (origin.$mixes) return origin.$mixes.push(value);
      parent = origin.$owner;
      wrap = origin;
      origin = origin.$origin;
    }  
    var wrapper = instance[name] = function() {
      var stack = wrapper.$stack;
      if (!stack) stack = wrapper.$stack = wrapper.$mixes.clone()
      var mix = stack.pop();
      wrapper.$owner = {parent: mix ? instance.$constructor : parent}
      if (!mix) mix = origin;
      if (!mix) return;
      var caller = this.caller, current = this.$caller;
      this.caller = current; this.$caller = wrapper;
      var result = (mix || origin).apply(this, arguments);
      this.$caller = current; this.caller = caller;
      delete wrapper.$stack;
      return result;
    }.extend({$mixes: [value], $origin: origin, $name: name});
  });
  if (instance.setOptions && proto.options) instance.setOptions(proto.options) //undoeable now :(
  if (proto.initialize) {
    var parent = instance.parent; instance.parent = function(){};
    proto.initialize.call(instance, instance);
    instance.parent = parent;
  }
}

Class.unmix = function(instance, klass) {
  var proto = klass.prototype;
  Object.each(proto, function(value, key) {
    if (typeof value !== 'function') return;
    var remixed = instance[key]
    if (remixed && remixed.$mixes) {
      if (remixed.$origin) instance[key] = remixed.$origin;
      else delete instance[key];
    }
  })
  if (proto.uninitialize) {
    var parent = instance.parent; instance.parent = function(){};
    proto.uninitialize.call(instance, instance);
    instance.parent = parent;
  }
}

Class.implement('mixin', function(klass) {
  Class.mixin(this, klass)
})

Class.implement('unmix', function(klass) {
  Class.unmix(this, klass)
})
/*
---
name: ART
description: "The heart of ART."
requires: [Core/Class, Color/Color]
provides: [ART, ART.Element, ART.Container, ART.Transform]
...
*/

(function(){

this.ART = new Class;

ART.version = '09.dev';
ART.build = 'DEV';

ART.Element = new Class({

	/* dom */

	inject: function(element){
		if (element.element) element = element.element;
		element.appendChild(this.element);
		return this;
	},

	eject: function(){
		var element = this.element, parent = element.parentNode;
		if (parent) parent.removeChild(element);
		return this;
	},

	/* events */

	subscribe: function(type, fn, bind){
		if (typeof type != 'string'){ // listen type / fn with object
			var subscriptions = [];
			for (var t in type) subscriptions.push(this.subscribe(t, type[t]));
			return function(){ // unsubscribe
				for (var i = 0, l = subscriptions.length; i < l; i++)
					subscriptions[i]();
				return this;
			};
		} else { // listen to one
			var bound = fn.bind(bind || this);
			var element = this.element;
			if (element.addEventListener){
				element.addEventListener(type, bound, false);
				return function(){ // unsubscribe
					element.removeEventListener(type, bound, false);
					return this;
				};
			} else {
				element.attachEvent('on' + type, bound);
				return function(){ // unsubscribe
					element.detachEvent('on' + type, bound);
					return this;
				};
			}
		}
	}

});

ART.Container = new Class({

	grab: function(){
		for (var i = 0; i < arguments.length; i++) arguments[i].inject(this);
		return this;
	}

});

var transformTo = function(xx, yx, xy, yy, x, y){
	if (xx && typeof xx == 'object'){
		yx = xx.yx; yy = xx.yy; y = xx.y;
		xy = xx.xy; x = xx.x; xx = xx.xx;
	}
	this.xx = xx == null ? 1 : xx;
	this.yx = yx || 0;
	this.xy = xy || 0;
	this.yy = yy == null ? 1 : yy;
	this.x = (x == null ? this.x : x) || 0;
	this.y = (y == null ? this.y : y) || 0;
	this._transform();
	return this;
};

ART.Transform = new Class({

	initialize: transformTo,

	_transform: function(){},

	xx: 1, yx: 0, x: 0,
	xy: 0, yy: 1, y: 0,

	transform: function(xx, yx, xy, yy, x, y){
		var m = this;
		if (xx && typeof xx == 'object'){
			yx = xx.yx; yy = xx.yy; y = xx.y;
			xy = xx.xy; x = xx.x; xx = xx.xx;
		}
		if (!x) x = 0;
		if (!y) y = 0;
		return this.transformTo(
			m.xx * xx + m.xy * yx,
			m.yx * xx + m.yy * yx,
			m.xx * xy + m.xy * yy,
			m.yx * xy + m.yy * yy,
			m.xx * x + m.xy * y + m.x,
			m.yx * x + m.yy * y + m.y
		);
	},

	transformTo: transformTo,

	translate: function(x, y){
		return this.transform(1, 0, 0, 1, x, y);
	},

	move: function(x, y){
		this.x += x || 0;
		this.y += y || 0;
		this._transform();
		return this;
	},

	scale: function(x, y){
		if (y == null) y = x;
		return this.transform(x, 0, 0, y, 0, 0);
	},

	rotate: function(deg, x, y){
		if (x == null || y == null){
			x = (this.left || 0) + (this.width || 0) / 2;
			y = (this.top || 0) + (this.height || 0) / 2;
		}

		var rad = deg * Math.PI / 180, sin = Math.sin(rad), cos = Math.cos(rad);

		this.transform(1, 0, 0, 1, x, y);
		var m = this;

		return this.transformTo(
			cos * m.xx - sin * m.yx,
			sin * m.xx + cos * m.yx,
			cos * m.xy - sin * m.yy,
			sin * m.xy + cos * m.yy,
			m.x,
			m.y
		).transform(1, 0, 0, 1, -x, -y);
	},

	moveTo: function(x, y){
		var m = this;
		return this.transformTo(m.xx, m.yx, m.xy, m.yy, x, y);
	},

	rotateTo: function(deg, x, y){
		var m = this;
		var flip = m.yx / m.xx > m.yy / m.xy ? -1 : 1;
		if (m.xx < 0 ? m.xy >= 0 : m.xy < 0) flip = -flip;
		return this.rotate(deg - Math.atan2(flip * m.yx, flip * m.xx) * 180 / Math.PI, x, y);
	},

	scaleTo: function(x, y){
		// Normalize
		var m = this;

		var h = Math.sqrt(m.xx * m.xx + m.yx * m.yx);
		m.xx /= h; m.yx /= h;

		h = Math.sqrt(m.yy * m.yy + m.xy * m.xy);
		m.yy /= h; m.xy /= h;

		return this.scale(x, y);
	},

	resizeTo: function(width, height){
		var w = this.width, h = this.height;
		if (!w || !h) return this;
		return this.scaleTo(width / w, height / h);
	},

	point: function(x, y){
		var m = this;
		return {
			x: m.xx * x + m.xy * y + m.x,
			y: m.yx * x + m.yy * y + m.y
		};
	}

});

Color.detach = function(color){
	color = new Color(color);
	return [Color.rgb(color.red, color.green, color.blue).toString(), color.alpha];
};

})();


/*
---
 
script: ART.Element.js
 
description: Smarter injection methods
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

extends: ART/ART.Element

provides: ART.Element.inserters
 
...
*/

(function() {
  
var inserters = {

  before: function(context, element){
    var parent = element.parentNode;
    if (parent) parent.insertBefore(context, element);
  },

  after: function(context, element){
    var parent = element.parentNode;
    if (parent) parent.insertBefore(context, element.nextSibling);
  },

  bottom: function(context, element){
    element.appendChild(context);
  },

  top: function(context, element){
    element.insertBefore(context, element.firstChild);
  }

};

ART.Element.implement({
  inject: function(element, where){
    if (element.element) element = element.element;
    inserters[where || 'bottom'](this.element, element, true);
    return this;
  }
});

})();
/*
---
name: ART.Path
description: "Class to generate a valid SVG path using method calls."
authors: ["[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: [ART.Path]
requires: [ART, ART.Transform]
...
*/

(function(){

/* private functions */

var parameterCount = {
	l: 2, z: 0,
	h: 1, v: 1,
	c: 6, s: 4,
	q: 4, t: 2,
	a: 7
};

function parse(path){

	if (!path) return [];

	var parts = [], index = -1,
	    bits = path.match(/[a-df-z]|[\-+]?(?:[\d\.]e[\-+]?|[^\s\-+,a-z])+/ig),
	    command, part, paramCount = 0;

	for (var i = 0, l = bits.length; i < l; i++){
		var bit = bits[i];
		if (bit.match(/^[a-z]/i)){
			command = bit;
			parts[++index] = part = [command];
			if (command == 'm') command = 'l';
			else if (command == 'M') command = 'L';
			paramCount = parameterCount[command.toLowerCase()];
		} else {
			if (part.length > paramCount) parts[++index] = part = [command];
			part.push(Number(bit));
		}
	}
	
	return parts;

};

function visitCurve(sx, sy, c1x, c1y, c2x, c2y, ex, ey, lineTo){
	var ax = sx - c1x,    ay = sy - c1y,
		bx = c1x - c2x,   by = c1y - c2y,
		cx = c2x - ex,    cy = c2y - ey,
		dx = ex - sx,     dy = ey - sy;

	// TODO: Faster algorithm without sqrts
	var err = Math.sqrt(ax * ax + ay * ay) +
	          Math.sqrt(bx * bx + by * by) +
	          Math.sqrt(cx * cx + cy * cy) -
	          Math.sqrt(dx * dx + dy * dy);

	if (err <= 0.0001){
		lineTo(sx, sy, ex, ey);
		return;
	}

	// Split curve
	var s1x =   (c1x + c2x) / 2,   s1y = (c1y + c2y) / 2,
	    l1x =   (c1x + sx) / 2,    l1y = (c1y + sy) / 2,
	    l2x =   (l1x + s1x) / 2,   l2y = (l1y + s1y) / 2,
	    r2x =   (ex + c2x) / 2,    r2y = (ey + c2y) / 2,
	    r1x =   (r2x + s1x) / 2,   r1y = (r2y + s1y) / 2,
	    l2r1x = (l2x + r1x) / 2,   l2r1y = (l2y + r1y) / 2;

	// TODO: Manual stack if necessary. Currently recursive without tail optimization.
	visitCurve(sx, sy, l1x, l1y, l2x, l2y, l2r1x, l2r1y, lineTo);
	visitCurve(l2r1x, l2r1y, r1x, r1y, r2x, r2y, ex, ey, lineTo);
};

var circle = Math.PI * 2;

function visitArc(rx, ry, rotation, large, clockwise, x, y, tX, tY, curveTo, arcTo){
	var rad = rotation * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
	x -= tX; y -= tY;
	
	// Ellipse Center
	var cx = cos * x / 2 + sin * y / 2,
		cy = -sin * x / 2 + cos * y / 2,
		rxry = rx * rx * ry * ry,
		rycx = ry * ry * cx * cx,
		rxcy = rx * rx * cy * cy,
		a = rxry - rxcy - rycx;

	if (a < 0){
		a = Math.sqrt(1 - a / rxry);
		rx *= a; ry *= a;
		cx = x / 2; cy = y / 2;
	} else {
		a = Math.sqrt(a / (rxcy + rycx));
		if (large == clockwise) a = -a;
		var cxd = -a * cy * rx / ry,
		    cyd =  a * cx * ry / rx;
		cx = cos * cxd - sin * cyd + x / 2;
		cy = sin * cxd + cos * cyd + y / 2;
	}

	// Rotation + Scale Transform
	var xx =  cos / rx, yx = sin / rx,
	    xy = -sin / ry, yy = cos / ry;

	// Start and End Angle
	var sa = Math.atan2(xy * -cx + yy * -cy, xx * -cx + yx * -cy),
	    ea = Math.atan2(xy * (x - cx) + yy * (y - cy), xx * (x - cx) + yx * (y - cy));

	cx += tX; cy += tY;
	x += tX; y += tY;

	// Circular Arc
	if (rx == ry && arcTo){
		arcTo(
			tX, tY, x, y,
			cx, cy, rx, sa, ea, !clockwise
		);
		return;
	}

	// Inverse Rotation + Scale Transform
	xx = cos * rx; yx = -sin * ry;
	xy = sin * rx; yy =  cos * ry;

	// Bezier Curve Approximation
	var arc = ea - sa;
	if (arc < 0 && clockwise) arc += circle;
	else if (arc > 0 && !clockwise) arc -= circle;

	var n = Math.ceil(Math.abs(arc / (circle / 4))),
	    step = arc / n,
	    k = (4 / 3) * Math.tan(step / 4),
	    a = sa;

	x = Math.cos(a); y = Math.sin(a);

	for (var i = 0; i < n; i++){
		var cp1x = x - k * y, cp1y = y + k * x;

		a += step;
		x = Math.cos(a); y = Math.sin(a);

		var cp2x = x + k * y, cp2y = y - k * x;

		curveTo(
			tX, tY,
			cx + xx * cp1x + yx * cp1y, cy + xy * cp1x + yy * cp1y,
			cx + xx * cp2x + yx * cp2y, cy + xy * cp2x + yy * cp2y,
			(tX = (cx + xx * x + yx * y)), (tY = (cy + xy * x + yy * y))
		);
	}
};

/* Measure bounds */

var left, right, top, bottom;

function lineBounds(sx, sy, x, y){
	left   = Math.min(left,   sx, x);
	right  = Math.max(right,  sx, x);
	top    = Math.min(top,    sy, y);
	bottom = Math.max(bottom, sy, y);
};

function curveBounds(sx, sy, p1x, p1y, p2x, p2y, x, y){
	left   = Math.min(left,   sx, p1x, p2x, x);
	right  = Math.max(right,  sx, p1x, p2x, x);
	top    = Math.min(top,    sy, p1y, p2y, y);
	bottom = Math.max(bottom, sy, p1y, p2y, y);
};

var west = circle / 2, south = west / 2, north = -south, east = 0;

function arcBounds(sx, sy, ex, ey, cx, cy, r, sa, ea, ccw){
	var bbsa = ccw ? ea : sa, bbea = ccw ? sa : ea;
	if (bbea < bbsa) bbea += circle;

	// Bounds
	var bbl = (bbea > west) ? (cx - r) : (ex),
	    bbr = (bbea > circle + east || (bbsa < east && bbea > east)) ? (cx + r) : (ex),
	    bbt = (bbea > circle + north || (bbsa < north && bbea > north)) ? (cy - r) : (ey),
	    bbb = (bbea > circle + south || (bbsa < south && bbea > south)) ? (cy + r) : (ey);

	left   = Math.min(left,   sx, bbl, bbr);
	right  = Math.max(right,  sx, bbl, bbr);
	top    = Math.min(top,    sy, bbt, bbb);
	bottom = Math.max(bottom, sy, bbt, bbb);
};

/* Measure length */

var length, desiredLength, desiredPoint;

function traverseLine(sx, sy, ex, ey){
	var x = ex - sx,
		y = ey - sy,
		l = Math.sqrt(x * x + y * y);
	length += l;
	if (length >= desiredLength){
		var offset = (length - desiredLength) / l,
		    cos = x / l,
		    sin = y / l;
		ex -= x * offset; ey -= y * offset;
		desiredPoint = new ART.Transform(cos, sin, -sin, cos, ex, ey);
		desiredLength = Infinity;
	}
};

function measureLine(sx, sy, ex, ey){
	var x = ex - sx, y = ey - sy;
	length += Math.sqrt(x * x + y * y);
};

/* Utility command factories */

var point = function(c){
	return function(x, y){
		return this.push(c, x, y);
	};
};

var arc = function(c, cc){
	return function(x, y, rx, ry, outer){
		return this.push(c, Math.abs(rx || x), Math.abs(ry || rx || y), 0, outer ? 1 : 0, cc, x, y);
	};
};

var curve = function(t, q, c){
	return function(c1x, c1y, c2x, c2y, ex, ey){
		var args = Array.slice(arguments), l = args.length;
		args.unshift(l < 4 ? t : l < 6 ? q : c);
		return this.push.apply(this, args);
	};
};

/* Path Class */

ART.Path = new Class({
	
	initialize: function(path){
		if (path instanceof ART.Path){ //already a path, copying
			this.path = Array.slice(path.path);
			this.cache = path.cache;
		} else {
			this.path = (path == null) ? [] : parse(path);
			this.cache = { svg: String(path) };
		}
	},
	
	push: function(){ //modifying the current path resets the memoized values.
		this.cache = {};
		this.path.push(Array.slice(arguments));
		return this;
	},
	
	reset: function(){
		this.cache = {};
		this.path = [];
		return this;
	},
	
	/*utility*/
	
	move: point('m'),
	moveTo: point('M'),
	
	line: point('l'),
	lineTo: point('L'),
	
	curve: curve('t', 'q', 'c'),
	curveTo: curve('T', 'Q', 'C'),
	
	arc: arc('a', 1),
	arcTo: arc('A', 1),
	
	counterArc: arc('a', 0),
	counterArcTo: arc('A', 0),
	
	close: function(){
		return this.push('z');
	},
	
	/* visitor */

	visit: function(lineTo, curveTo, arcTo, moveTo, close){
		var reflect = function(sx, sy, ex, ey){
			return [ex * 2 - sx, ey * 2 - sy];
		};
		
		if (!curveTo) curveTo = function(sx, sy, c1x, c1y, c2x, c2y, ex, ey){
			visitCurve(sx, sy, c1x, c1y, c2x, c2y, ex, ey, lineTo);
		};
		
		var X = 0, Y = 0, px = 0, py = 0, r, inX, inY;
		
		var parts = this.path;
		
		for (i = 0; i < parts.length; i++){
			var v = Array.slice(parts[i]), f = v.shift(), l = f.toLowerCase();
			var refX = l == f ? X : 0, refY = l == f ? Y : 0;
			
			if (l != 'm' && l != 'z' && inX == null){
				inX = X; inY = Y;
			}

			switch (l){
				
				case 'm':
					if (moveTo) moveTo(X, Y, X = refX + v[0], Y = refY + v[1]);
					else { X = refX + v[0]; Y = refY + v[1]; }
				break;
				
				case 'l':
					lineTo(X, Y, X = refX + v[0], Y = refY + v[1]);
				break;
				
				case 'c':
					px = refX + v[2]; py = refY + v[3];
					curveTo(X, Y, refX + v[0], refY + v[1], px, py, X = refX + v[4], Y = refY + v[5]);
				break;

				case 's':
					r = reflect(px, py, X, Y);
					px = refX + v[0]; py = refY + v[1];
					curveTo(X, Y, r[0], r[1], px, py, X = refX + v[2], Y = refY + v[3]);
				break;
				
				case 'q':
					px = (refX + v[0]); py = (refY + v[1]);
					curveTo(X, Y, (X + px * 2) / 3, (Y + py * 2) / 3, ((X = refX + v[2]) + px * 2) / 3, ((Y = refY + v[3]) + py * 2) / 3, X, Y);
				break;
				
				case 't':
					r = reflect(px, py, X, Y);
					px = r[0]; py = r[1];
					curveTo(X, Y, (X + px * 2) / 3, (Y + py * 2) / 3, ((X = refX + v[0]) + px * 2) / 3, ((Y = refY + v[1]) + py * 2) / 3, X, Y);
				break;

				case 'a':
					px = refX + v[5]; py = refY + v[6];
					if (!v[0] || !v[1] || (px == X && py == Y)) lineTo(X, Y, px, py);
					else visitArc(v[0], v[1], v[2], v[3], v[4], px, py, X, Y, curveTo, arcTo);
					X = px; Y = py;
				break;

				case 'h':
					lineTo(X, Y, X = refX + v[0], Y);
				break;
				
				case 'v':
					lineTo(X, Y, X, Y = refY + v[0]);
				break;
				
				case 'z':
					if (inX != null){
						if (close){
							close();
							if (moveTo) moveTo(X, Y, X = inX, Y = inY);
							else { X = inX; Y = inY; }
						} else {
							lineTo(X, Y, X = inX, Y = inY);
						}
						inX = null;
					}
				break;
				
			}
			if (l != 's' && l != 'c' && l != 't' && l != 'q'){
				px = X; py = Y;
			}
		}
	},
	
	/* transformation, measurement */
	
	toSVG: function(){
		if (this.cache.svg == null){
			var path = '';
			for (var i = 0, l = this.path.length; i < l; i++) path += this.path[i].join(' ');
			this.cache.svg = path;
		}
		return this.cache.svg;
	},
	
	measure: function(){
		if (this.cache.box == null){
			left = top = Infinity;
			right = bottom = -Infinity;
			this.visit(lineBounds, curveBounds, arcBounds);
			if (left == Infinity)
				this.cache.box = {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
			else
				this.cache.box = {left: left, top: top, right: right, bottom: bottom, width: right - left, height: bottom - top };
		}
		return this.cache.box;
	},

	point: function(lengthToPoint){
		length = 0;
		desiredLength = lengthToPoint;
		desiredPoint = null;
		this.visit(traverseLine);
		return desiredPoint;
	},

	measureLength: function(){
		length = 0;
		this.visit(measureLine);
		return length;
	}

});

ART.Path.prototype.toString = ART.Path.prototype.toSVG;

})();
/*
---
name: ART.VML
description: "VML implementation for ART"
authors: ["[Simo Kinnunen](http://twitter.com/sorccu)", "[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: [ART.VML, ART.VML.Group, ART.VML.Shape, ART.VML.Text]
requires: [ART, ART.Element, ART.Container, ART.Transform, ART.Path]
...
*/

(function(){

var precision = 100, UID = 0;

var defaultBox = { left: 0, top: 0, width: 500, height: 500 };

// VML Base Class

ART.VML = new Class({

	Extends: ART.Element,
	Implements: ART.Container,
	
	initialize: function(width, height){
		this.vml = document.createElement('vml');
		this.element = document.createElement('av:group');
		this.vml.appendChild(this.element);
		this.children = [];
		if (width != null && height != null) this.resize(width, height);
	},
	
	inject: function(element){
		if (element.element) element = element.element;
		element.appendChild(this.vml);
		return this;
	},
	
	resize: function(width, height){
		this.width = width;
		this.height = height;
		
		var style = this.vml.style;
		style.pixelWidth = width;
		style.pixelHeight = height;
		
		style = this.element.style;
		style.width = width;
		style.height = height;
		
		var halfPixel = (0.5 * precision);
		
		this.element.coordorigin = halfPixel + ',' + halfPixel;
		this.element.coordsize = (width * precision) + ',' + (height * precision);

		return this;
	},
	
	toElement: function(){
		return this.vml;
	}
	
});

// VML Initialization

var VMLCSS = 'behavior:url(#default#VML);display:inline-block;position:absolute;left:0px;top:0px;';

var styleSheet, styledTags = {}, styleTag = function(tag){
	if (styleSheet) styledTags[tag] = styleSheet.addRule('av\\:' + tag, VMLCSS);
};

ART.VML.init = function(document){

	var namespaces = document.namespaces;
	if (!namespaces) return false;

	namespaces.add('av', 'urn:schemas-microsoft-com:vml');
	namespaces.add('ao', 'urn:schemas-microsoft-com:office:office');

	styleSheet = document.createStyleSheet();
	styleSheet.addRule('vml', 'display:inline-block;position:relative;overflow:hidden;');
	styleTag('skew');
	styleTag('fill');
	styleTag('stroke');
	styleTag('path');
	styleTag('textpath');
	styleTag('group');

	return true;

};

// VML Element Class

ART.VML.Element = new Class({
	
	Extends: ART.Element,
	
	Implements: ART.Transform,
	
	initialize: function(tag){
		this.uid = String.uniqueID();
		if (!(tag in styledTags)) styleTag(tag);

		var element = this.element = document.createElement('av:' + tag);
		element.setAttribute('id', 'e' + this.uid);
	},
	
	/* dom */
	
	inject: function(container){
		this.eject();
		this.container = container;
		container.children.include(this);
		this._transform();
		this.parent(container);
		
		return this;
	},

	eject: function(){
		if (this.container){
			this.container.children.erase(this);
			this.container = null;
			this.parent();
		}
		return this;
	},

	// visibility
	
	hide: function(){
		this.element.style.display = 'none';
		return this;
	},
	
	show: function(){
		this.element.style.display = '';
		return this;
	},
	
	// interaction
	
	indicate: function(cursor, tooltip){
		if (cursor) this.element.style.cursor = cursor;
		if (tooltip) this.element.title = tooltip;
		return this;
	}

});

// VML Group Class

ART.VML.Group = new Class({
	
	Extends: ART.VML.Element,
	Implements: ART.Container,
	
	initialize: function(width, height){
		this.parent('group');
		this.width = width;
		this.height = height;
		this.children = [];
	},
	
	/* dom */
	
	inject: function(container){
		this.parent(container);
		this._transform();
		return this;
	},
	
	eject: function(){
		this.parent();
		return this;
	},
	
	_transform: function(){
		var element = this.element;
		element.coordorigin = '0,0';
		element.coordsize = '1000,1000';
		element.style.left = 0;
		element.style.top = 0;
		element.style.width = 1000;
		element.style.height = 1000;
		element.style.rotation = 0;
		
		var container = this.container;
		this._activeTransform = container ? new ART.Transform(container._activeTransform).transform(this) : this;
		var children = this.children;
		for (var i = 0, l = children.length; i < l; i++)
			children[i]._transform();
	}

});

// VML Base Shape Class

ART.VML.Base = new Class({

	Extends: ART.VML.Element,
	
	initialize: function(tag){
		this.parent(tag);
		var element = this.element;
		
		var skew = this.skewElement = document.createElement('av:skew');
		skew.on = true;
		element.appendChild(skew);

		var fill = this.fillElement = document.createElement('av:fill');
		fill.on = false;
		element.appendChild(fill);
		
		var stroke = this.strokeElement = document.createElement('av:stroke');
		stroke.on = false;
		element.appendChild(stroke);
	},
	
	/* transform */
	
	_transform: function(){
		var container = this.container;
		
		// Active Transformation Matrix
		var m = container ? new ART.Transform(container._activeTransform).transform(this) : this;
		
		// Box in shape user space
		
		var box = this._boxCoords || this._size || defaultBox;
		
		var originX = box.left || 0,
			originY = box.top || 0,
			width = box.width || 1,
			height = box.height || 1;
				
		// Flipped
	    var flip = m.yx / m.xx > m.yy / m.xy;
		if (m.xx < 0 ? m.xy >= 0 : m.xy < 0) flip = !flip;
		flip = flip ? -1 : 1;
		
		m = new ART.Transform().scale(flip, 1).transform(m);
		
		// Rotation is approximated based on the transform
		var rotation = Math.atan2(-m.xy, m.yy) * 180 / Math.PI;
		
		// Reverse the rotation, leaving the final transform in box space
		var rad = rotation * Math.PI / 180, sin = Math.sin(rad), cos = Math.cos(rad);
		
		var transform = new ART.Transform(
			(m.xx * cos - m.xy * sin),
			(m.yx * cos - m.yy * sin) * flip,
			(m.xy * cos + m.xx * sin) * flip,
			(m.yy * cos + m.yx * sin)
		);

		var rotationTransform = new ART.Transform().rotate(rotation, 0, 0);

		var shapeToBox = new ART.Transform().rotate(-rotation, 0, 0).transform(m).moveTo(0,0);

		// Scale box after reversing rotation
		width *= Math.abs(shapeToBox.xx);
		height *= Math.abs(shapeToBox.yy);
		
		// Place box
		var left = m.x, top = m.y;
		
		// Compensate for offset by center origin rotation
		var vx = -width / 2, vy = -height / 2;
		var point = rotationTransform.point(vx, vy);
		left -= point.x - vx;
		top -= point.y - vy;
		
		// Adjust box position based on offset
		var rsm = new ART.Transform(m).moveTo(0,0);
		point = rsm.point(originX, originY);
		left += point.x;
		top += point.y;
		
		if (flip < 0) left = -left - width;
		
		// Place transformation origin
		var point0 = rsm.point(-originX, -originY);
		var point1 = rotationTransform.point(width, height);
		var point2 = rotationTransform.point(width, 0);
		var point3 = rotationTransform.point(0, height);
		
		var minX = Math.min(0, point1.x, point2.x, point3.x),
		    maxX = Math.max(0, point1.x, point2.x, point3.x),
		    minY = Math.min(0, point1.y, point2.y, point3.y),
		    maxY = Math.max(0, point1.y, point2.y, point3.y);
		
		var transformOriginX = (point0.x - point1.x / 2) / (maxX - minX) * flip,
		    transformOriginY = (point0.y - point1.y / 2) / (maxY - minY);
		
		// Adjust the origin
		point = shapeToBox.point(originX, originY);
		originX = point.x;
		originY = point.y;
		
		// Scale stroke
		var strokeWidth = this._strokeWidth;
		if (strokeWidth){
			// Scale is the hypothenus between the two vectors
			// TODO: Use area calculation instead
			var vx = m.xx + m.xy, vy = m.yy + m.yx;
			strokeWidth *= Math.sqrt(vx * vx + vy * vy) / Math.sqrt(2);
		}
		
		// convert to multiplied precision space
		originX *= precision;
		originY *= precision;
		left *= precision;
		top *= precision;
		width *= precision;
		height *= precision;
		
		// Set box
		var element = this.element;
		element.coordorigin = originX + ',' + originY;
		element.coordsize = width + ',' + height;
		element.style.left = left + 'px';
		element.style.top = top + 'px';
		element.style.width = width;
		element.style.height = height;
		element.style.rotation = rotation.toFixed(8);
		element.style.flip = flip < 0 ? 'x' : '';
		
		// Set transform
		var skew = this.skewElement;
		skew.matrix = [transform.xx.toFixed(4), transform.xy.toFixed(4), transform.yx.toFixed(4), transform.yy.toFixed(4), 0, 0];
		skew.origin = transformOriginX + ',' + transformOriginY;

		// Set stroke
		this.strokeElement.weight = strokeWidth + 'px';
	},
	
	/* styles */

	_createGradient: function(style, stops){
		var fill = this.fillElement;

		// Temporarily eject the fill from the DOM
		this.element.removeChild(fill);

		fill.type = style;
		fill.method = 'none';
		fill.rotate = true;

		var colors = [], color1, color2;

		var addColor = function(offset, color){
			color = Color.detach(color);
			if (color1 == null) color1 = color2 = color;
			else color2 = color;
			colors.push(offset + ' ' + color[0]);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);
		
		fill.color = color1[0];
		fill.color2 = color2[0];
		
		//if (fill.colors) fill.colors.value = colors; else
		fill.colors = colors;

		// Opacity order gets flipped when color stops are specified
		fill.opacity = color2[1];
		fill['ao:opacity2'] = color1[1];

		fill.on = true;
		this.element.appendChild(fill);
		return fill;
	},
	
	_setColor: function(type, color){
		var element = this[type + 'Element'];
		if (color == null){
			element.on = false;
		} else {
			color = Color.detach(color);
			element.color = color[0];
			element.opacity = color[1];
			element.on = true;
		}
	},
	
	fill: function(color){
		if (arguments.length > 1){
			this.fillLinear(arguments);
		} else {
			this._boxCoords = defaultBox;
			var fill = this.fillElement;
			fill.type = 'solid';
			fill.color2 = '';
			fill['ao:opacity2'] = '';
			if (fill.colors) fill.colors.value = '';
			this._setColor('fill', color);
		}
		return this;
	},

	fillRadial: function(stops, focusX, focusY, radiusX, radiusY, centerX, centerY){
		var fill = this._createGradient('gradientradial', stops);
		if (focusX == null) focusX = this.left + this.width * 0.5;
		if (focusY == null) focusY = this.top + this.height * 0.5;
		if (radiusY == null) radiusY = radiusX || (this.height * 0.5);
		if (radiusX == null) radiusX = this.width * 0.5;
		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;
		
		centerX += centerX - focusX;
		centerY += centerY - focusY;
		
		var box = this._boxCoords = {
			left: centerX - radiusX * 2,
			top: centerY - radiusY * 2,
			width: radiusX * 4,
			height: radiusY * 4
		};
		focusX -= box.left;
		focusY -= box.top;
		focusX /= box.width;
		focusY /= box.height;

		fill.focussize = '0 0';
		fill.focusposition = focusX + ',' + focusY;
		fill.focus = '50%';
		
		this._transform();
		
		return this;
	},

	fillLinear: function(stops, x1, y1, x2, y2){
		var fill = this._createGradient('gradient', stops);
		fill.focus = '100%';
		if (arguments.length == 5){
			var w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
			this._boxCoords = {
				left: Math.min(x1, x2),
				top: Math.min(y1, y2),
				width: w < 1 ? h : w,
				height: h < 1 ? w : h
			};
			fill.angle = (360 + Math.atan2((x2 - x1) / h, (y2 - y1) / w) * 180 / Math.PI) % 360;
		} else {
			this._boxCoords = null;
			fill.angle = (x1 == null) ? 0 : (90 + x1) % 360;
		}
		this._transform();
		return this;
	},

	fillImage: function(url, width, height, left, top, color1, color2){
		var fill = this.fillElement;
		if (color1 != null){
			color1 = Color.detach(color1);
			if (color2 != null) color2 = Color.detach(color2);
			fill.type = 'pattern';
			fill.color = color1[0];
			fill.color2 = color2 == null ? color1[0] : color2[0];
			fill.opacity = color2 == null ? 0 : color2[1];
			fill['ao:opacity2'] = color1[1];
		} else {
			fill.type = 'tile';
			fill.color = '';
			fill.color2 = '';
			fill.opacity = 1;
			fill['ao:opacity2'] = 1;
		}
		if (fill.colors) fill.colors.value = '';
		fill.rotate = true;
		fill.src = url;
		
		fill.size = '1,1';
		fill.position = '0,0';
		fill.origin = '0,0';
		fill.aspect = 'ignore'; // ignore, atleast, atmost
		fill.on = true;

		if (!left) left = 0;
		if (!top) top = 0;
		this._boxCoords = width ? { left: left + 0.5, top: top + 0.5, width: width, height: height } : null;
		this._transform();
		return this;
	},

	/* stroke */
	
	stroke: function(color, width, cap, join){
		var stroke = this.strokeElement;
		this._strokeWidth = (width != null) ? width : 1;
		stroke.weight = (width != null) ? width + 'px' : 1;
		stroke.endcap = (cap != null) ? ((cap == 'butt') ? 'flat' : cap) : 'round';
		stroke.joinstyle = (join != null) ? join : 'round';

		this._setColor('stroke', color);
		return this;
	}

});

// VML Shape Class

ART.VML.Shape = new Class({

	Extends: ART.VML.Base,
	
	initialize: function(path, width, height){
		this.parent('shape');

		var p = this.pathElement = document.createElement('av:path');
		p.gradientshapeok = true;
		this.element.appendChild(p);
		
		this.width = width;
		this.height = height;
		
		if (path != null) this.draw(path);
	},
	
	// SVG to VML
	
	draw: function(path, width, height){
		
		if (!(path instanceof ART.Path)) path = new ART.Path(path);
		this._vml = path.toVML(precision);
		this._size = path.measure();
		
		if (width != null) this.width = width;
		if (height != null) this.height = height;
		
		if (!this._boxCoords) this._transform();
		this._redraw(this._prefix, this._suffix);
		
		return this;
	},
	
	// radial gradient workaround

	_redraw: function(prefix, suffix){
		var vml = this._vml || '';

		this._prefix = prefix;
		this._suffix = suffix
		if (prefix){
			vml = [
				prefix, vml, suffix,
				// Don't stroke the path with the extra ellipse, redraw the stroked path separately
				'ns e', vml, 'nf'
			].join(' ');
		}

		this.element.path = vml + 'e';
	},

	fill: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillLinear: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillImage: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillRadial: function(stops, focusX, focusY, radiusX, radiusY, centerX, centerY){
		var fill = this._createGradient('gradientradial', stops);
		if (focusX == null) focusX = (this.left || 0) + (this.width || 0) * 0.5;
		if (focusY == null) focusY = (this.top || 0) + (this.height || 0) * 0.5;
		if (radiusY == null) radiusY = radiusX || (this.height * 0.5) || 0;
		if (radiusX == null) radiusX = (this.width || 0) * 0.5;
		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;

		centerX += centerX - focusX;
		centerY += centerY - focusY;
		
		var cx = Math.round(centerX * precision),
			cy = Math.round(centerY * precision),

			rx = Math.round(radiusX * 2 * precision),
			ry = Math.round(radiusY * 2 * precision),

			arc = ['wa', cx - rx, cy - ry, cx + rx, cy + ry].join(' ');

		this._redraw(
			// Resolve rendering bug
			['m', cx, cy - ry, 'l', cx, cy - ry].join(' '),
			// Draw an ellipse around the path to force an elliptical gradient on any shape
			[
				'm', cx, cy - ry,
				arc, cx, cy - ry, cx, cy + ry, arc, cx, cy + ry, cx, cy - ry,
				arc, cx, cy - ry, cx, cy + ry, arc, cx, cy + ry, cx, cy - ry
			].join(' ')
		);

		this._boxCoords = { left: focusX - 2, top: focusY - 2, width: 4, height: 4 };
		
		fill.focusposition = '0.5,0.5';
		fill.focussize = '0 0';
		fill.focus = '50%';
		
		this._transform();
		
		return this;
	}

});

var fontAnchors = { start: 'left', middle: 'center', end: 'right' };

ART.VML.Text = new Class({

	Extends: ART.VML.Base,

	initialize: function(text, font, alignment, path){
		this.parent('shape');
		
		var p = this.pathElement = document.createElement('av:path');
		p.textpathok = true;
		this.element.appendChild(p);
		
		p = this.textPathElement = document.createElement("av:textpath");
		p.on = true;
		p.style['v-text-align'] = 'left';
		this.element.appendChild(p);
		
		this.draw.apply(this, arguments);
	},
	
	draw: function(text, font, alignment, path){
		var element = this.element,
		    textPath = this.textPathElement,
		    style = textPath.style;
		
		textPath.string = text;
		
		if (font){
			if (typeof font == 'string'){
				style.font = font;
			} else {
				for (var key in font){
					var ckey = key.camelCase ? key.camelCase() : key;
					if (ckey == 'fontFamily') style[ckey] = "'" + font[key] + "'";
					// NOT UNIVERSALLY SUPPORTED OPTIONS
					// else if (ckey == 'kerning') style['v-text-kern'] = !!font[key];
					// else if (ckey == 'rotateGlyphs') style['v-rotate-letters'] = !!font[key];
					// else if (ckey == 'letterSpacing') style['v-text-spacing'] = Number(font[key]) + '';
					else style[ckey] = font[key];
				}
			}
		}
		
		if (alignment) style['v-text-align'] = fontAnchors[alignment] || alignment;
		
		if (path){
			this.currentPath = path = new ART.Path(path);
			this.element.path = path.toVML(precision);
		} else if (!this.currentPath){
			var i = -1, offsetRows = '\n';
			while ((i = text.indexOf('\n', i + 1)) > -1) offsetRows += '\n';
			textPath.string = offsetRows + textPath.string;
			this.element.path = 'm0,0l1,0';
		}
		
		// Measuring the bounding box is currently necessary for gradients etc.
		
		// Clone element because the element is dead once it has been in the DOM
		element = element.cloneNode(true);
		style = element.style;
		
		// Reset coordinates while measuring
		element.coordorigin = '0,0';
		element.coordsize = '10000,10000';
		style.left = '0px';
		style.top = '0px';
		style.width = '10000px';
		style.height = '10000px';
		style.rotation = 0;
		element.removeChild(element.firstChild); // Remove skew
		
		// Inject the clone into the document
		
		var canvas = new ART.VML(1, 1),
		    group = new ART.VML.Group(), // Wrapping it in a group seems to alleviate some client rect weirdness
		    body = element.ownerDocument.body;
		
		canvas.inject(body);
		group.element.appendChild(element);
		group.inject(canvas);
		
		var ebb = element.getBoundingClientRect(),
		    cbb = canvas.toElement().getBoundingClientRect();
		
		canvas.eject();
		
		this.left = ebb.left - cbb.left;
		this.top = ebb.top - cbb.top;
		this.width = ebb.right - ebb.left;
		this.height = ebb.bottom - ebb.top;
		this.right = ebb.right - cbb.left;
		this.bottom = ebb.bottom - cbb.top;
		
		this._transform();

		this._size = { left: this.left, top: this.top, width: this.width, height: this.height};
		return this;
	}

});

// VML Path Extensions

var path, p, round = Math.round;

function moveTo(sx, sy, x, y){
	path.push('m', round(x * p), round(y * p));
};

function lineTo(sx, sy, x, y){
	path.push('l', round(x * p), round(y * p));
};

function curveTo(sx, sy, p1x, p1y, p2x, p2y, x, y){
	path.push('c',
		round(p1x * p), round(p1y * p),
		round(p2x * p), round(p2y * p),
		round(x * p), round(y * p)
	);
};

function arcTo(sx, sy, ex, ey, cx, cy, r, sa, ea, ccw){
	cx *= p;
	cy *= p;
	r *= p;
	path.push(ccw ? 'at' : 'wa',
		round(cx - r), round(cy - r),
		round(cx + r), round(cy + r),
		round(sx * p), round(sy * p),
		round(ex * p), round(ey * p)
	);
};

function close(){
	path.push('x');
};

ART.Path.implement({

	toVML: function(precision){
		if (this.cache.vml == null){
			path = [];
			p = precision;
			this.visit(lineTo, curveTo, arcTo, moveTo, close);
			this.cache.vml = path.join(' ');
		}
		return this.cache.vml;
	}

});

})();
/*
---
name: ART.SVG
description: "SVG implementation for ART"
provides: [ART.SVG, ART.SVG.Group, ART.SVG.Shape, ART.SVG.Image, ART.SVG.Text]
requires: [ART, ART.Element, ART.Container, ART.Transform, ART.Path]
...
*/

(function(){
	
var NS = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink', XML = 'http://www.w3.org/XML/1998/namespace',
    UID = 0,
    createElement = function(tag){
        return document.createElementNS(NS, tag);
    };

var ua = navigator && navigator.userAgent,
    hasBaseline = !(/opera|safari|ie/i).test(ua) || (/chrome/i).test(ua);

// SVG Base Class

ART.SVG = new Class({

	Extends: ART.Element,
	Implements: ART.Container,

	initialize: function(width, height){
		var element = this.element = createElement('svg');
		element.setAttribute('xmlns', NS);
		element.setAttribute('version', 1.1);
		var defs = this.defs = createElement('defs');
		element.appendChild(defs);
		if (width != null && height != null) this.resize(width, height);
	},

	resize: function(width, height){
		var element = this.element;
		element.setAttribute('width', width);
		element.setAttribute('height', height);
		this.width = width;
		this.height = height;
		return this;
	},
	
	toElement: function(){
		return this.element;
	}

});

// SVG Element Class

ART.SVG.Element = new Class({
	
	Extends: ART.Element,
	
	Implements: ART.Transform,

	initialize: function(tag){
		this.uid = String.uniqueID();
		var element = this.element = createElement(tag);
		element.setAttribute('id', 'e' + this.uid);
	},
	
	/* transforms */
	
	_transform: function(){
		var m = this;
		this.element.setAttribute('transform', 'matrix(' + [m.xx, m.yx, m.xy, m.yy, m.x, m.y] + ')');
	},
	
	blend: function(opacity){
		this.element.setAttribute('opacity', opacity);
		return this;
	},
	
	// visibility
	
	hide: function(){
		this.element.setAttribute('display', 'none');
		return this;
	},
	
	show: function(){
		this.element.setAttribute('display', '');
		return this;
	},
	
	// interaction
	
	indicate: function(cursor, tooltip){
		var element = this.element;
		if (cursor) this.element.style.cursor = cursor;
		if (tooltip){
			var title = this.titleElement; 
			if (title){
				title.firstChild.nodeValue = tooltip;
			} else {
				this.titleElement = title = createElement('title');
				title.appendChild(document.createTextNode(tooltip));
				element.insertBefore(title, element.firstChild);
			}
		}
		return this;
	}

});

// SVG Group Class

ART.SVG.Group = new Class({
	
	Extends: ART.SVG.Element,
	Implements: ART.Container,
	
	initialize: function(width, height){
		this.parent('g');
		this.width = width;
		this.height = height;
		this.defs = createElement('defs');
		this.element.appendChild(this.defs);
	}
	
});

// SVG Base Shape Class

ART.SVG.Base = new Class({
	
	Extends: ART.SVG.Element,

	initialize: function(tag){
		this.parent(tag);
		this.fill();
		this.stroke();
	},
	
	/* insertions */
	
	inject: function(container){
		this.eject();
		this.container = container;
		this._injectBrush('fill');
		this._injectBrush('stroke');
		this.parent(container);
		return this;
	},
	
	eject: function(){
		if (this.container){
			this.parent();
			this._ejectBrush('fill');
			this._ejectBrush('stroke');
			this.container = null;
		}
		return this;
	},
	
	_injectBrush: function(type){
		if (!this.container) return;
		var brush = this[type + 'Brush'];
		if (brush) this.container.defs.appendChild(brush);
	},
	
	_ejectBrush: function(type){
		if (!this.container) return;
		var brush = this[type + 'Brush'];
		if (brush) this.container.defs.removeChild(brush);
	},
	
	/* styles */
	
	_createBrush: function(type, tag){
		this._ejectBrush(type);

		var brush = createElement(tag);
		this[type + 'Brush'] = brush;

		var id = type + '-brush-e' + this.uid;
		brush.setAttribute('id', id);

		this._injectBrush(type);

		this.element.setAttribute(type, 'url(#' + id + ')');

		return brush;
	},

	_createGradient: function(type, style, stops){
		var gradient = this._createBrush(type, style);

		var addColor = function(offset, color){
			color = Color.detach(color);
			var stop = createElement('stop');
			stop.setAttribute('offset', offset);
			stop.setAttribute('stop-color', color[0]);
			stop.setAttribute('stop-opacity', color[1]);
			gradient.appendChild(stop);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		// TODO: Sort. Chrome doesn't always enumerate in expected order but requires stops to be specified in order.
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);

		gradient.setAttribute('spreadMethod', 'reflect'); // Closer to the VML gradient


		this.element.removeAttribute('fill-opacity');
		return gradient;
	},
	
	_setColor: function(type, color){
		this._ejectBrush(type);
		this[type + 'Brush'] = null;
		var element = this.element;
		if (color == null){
			element.setAttribute(type, 'none');
			element.removeAttribute(type + '-opacity');
		} else {
			color = Color.detach(color);
			element.setAttribute(type, color[0]);
			element.setAttribute(type + '-opacity', color[1]);
		}
	},

	fill: function(color){
		if (arguments.length > 1) this.fillLinear(arguments);
		else this._setColor('fill', color);
		return this;
	},

	fillRadial: function(stops, focusX, focusY, radiusX, radiusY, centerX, centerY){
		var gradient = this._createGradient('fill', 'radialGradient', stops);

		gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
		

		if (focusX == null) focusX = (this.left || 0) + (this.width || 0) * 0.5;
		if (focusY == null) focusY = (this.top || 0) + (this.height || 0) * 0.5;
		if (radiusY == null) radiusY = radiusX || (this.height * 0.5) || 0;
		if (radiusX == null) radiusX = (this.width || 0) * 0.5;
		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;
		
		var ys = radiusY / radiusX;

		gradient.setAttribute('fx', focusX);
		gradient.setAttribute('fy', focusY / ys);

		gradient.setAttribute('r', radiusX);
		if (ys != 1) gradient.setAttribute('gradientTransform', 'scale(1,' + ys + ')');

		gradient.setAttribute('cx', centerX);
		gradient.setAttribute('cy', centerY / ys);
		
		return this;
	},

	fillLinear: function(stops, x1, y1, x2, y2){
		var gradient = this._createGradient('fill', 'linearGradient', stops);
		
		if (arguments.length == 5){
			gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
		} else {
			var angle = ((x1 == null) ? 270 : x1) * Math.PI / 180;

			var x = Math.cos(angle), y = -Math.sin(angle),
				l = (Math.abs(x) + Math.abs(y)) / 2;

			x *= l; y *= l;

			x1 = 0.5 - x;
			x2 = 0.5 + x;
			y1 = 0.5 - y;
			y2 = 0.5 + y;
		}

		gradient.setAttribute('x1', x1);
		gradient.setAttribute('y1', y1);
		gradient.setAttribute('x2', x2);
		gradient.setAttribute('y2', y2);

		return this;
	},

	fillImage: function(url, width, height, left, top, color1, color2){
		var pattern = this._createBrush('fill', 'pattern');

		var image = createElement('image');
		image.setAttributeNS(XLINK, 'href', url);
		image.setAttribute('width', width);
		image.setAttribute('height', height);
		image.setAttribute('preserveAspectRatio', 'none'); // none, xMidYMid slice, xMidYMid meet

		if (color1 != null){
			color1 = new Color(color1);
			if (color2 == null){
				color2 = new Color(color1);
				color2.alpha = 0;
			} else {
				color2 = new Color(color2);
			}

			var r = (color1.red - color2.red) / (255 * 3),
				g = (color1.green - color2.green) / (255 * 3),
				b = (color1.blue - color2.blue) / (255 * 3),
				a = (color1.alpha - color2.alpha) / 3;
			
			var matrix = [
				r, r, r, 0, color2.red / 255,
				g, g, g, 0, color2.green / 255,
				b, b, b, 0, color2.blue / 255,
				a, a, a, 0, color2.alpha
			];

			var filter = createElement('filter');
			filter.setAttribute('id', 'testfilter' + this.uid);

			var cm = createElement('feColorMatrix');
			cm.setAttribute('type', 'matrix');
			cm.setAttribute('values', matrix.join(' '));

			image.setAttribute('fill', '#000');
			image.setAttribute('filter', 'url(#testfilter' + this.uid + ')');

			filter.appendChild(cm);
			pattern.appendChild(filter);
		}

		pattern.appendChild(image);
		
		pattern.setAttribute('patternUnits', 'userSpaceOnUse');
		pattern.setAttribute('patternContentsUnits', 'userSpaceOnUse');
		
		pattern.setAttribute('x', left || 0);
		pattern.setAttribute('y', top || 0);
		
		pattern.setAttribute('width', width);
		pattern.setAttribute('height', height);

		//pattern.setAttribute('viewBox', '0 0 75 50');
		//pattern.setAttribute('preserveAspectRatio', 'xMidYMid slice');

		return this;
	},

	stroke: function(color, width, cap, join){
		var element = this.element;
		element.setAttribute('stroke-width', (width != null) ? width : 1);
		element.setAttribute('stroke-linecap', (cap != null) ? cap : 'round');
		element.setAttribute('stroke-linejoin', (join != null) ? join : 'round');

		this._setColor('stroke', color);
		return this;
	}
	
});

// SVG Shape Class

ART.SVG.Shape = new Class({
	
	Extends: ART.SVG.Base,
	
	initialize: function(path, width, height){
		this.parent('path');
		this.element.setAttribute('fill-rule', 'evenodd');
		this.width = width;
		this.height = height;
		if (path != null) this.draw(path);
	},
	
	draw: function(path, width, height){
		if (!(path instanceof ART.Path)) path = new ART.Path(path);
		this.element.setAttribute('d', path.toSVG());
		if (width != null) this.width = width;
		if (height != null) this.height = height;
		return this;
	}

});

ART.SVG.Image = new Class({
	
	Extends: ART.SVG.Base,
	
	initialize: function(src, width, height){
		this.parent('image');
		if (arguments.length == 3) this.draw.apply(this, arguments);
	},
	
	draw: function(src, width, height){
		var element = this.element;
		element.setAttributeNS(XLINK, 'href', src);
		element.setAttribute('width', width);
		element.setAttribute('height', height);
		this.width = width;
		this.height = height;
		return this;
	}
	
});

var fontAnchors = { left: 'start', center: 'middle', right: 'end' },
    fontAnchorOffsets = { middle: '50%', end: '100%' };

/* split each continuous line into individual paths */

var splitPaths, splitPath;

function splitMove(sx, sy, x, y){
	if (splitPath.length > 3) splitPaths.push(splitPath);
	splitPath = ['M', x, y];
};

function splitLine(sx, sy, x, y){
	splitPath.push('L', x, y);
};

function splitCurve(sx, sy, p1x, p1y, p2x, p2y, x, y){
	splitPath.push('C', p1x, p1y, p2x, p2y, x, y);
};

ART.SVG.Text = new Class({

	Extends: ART.SVG.Base,

	initialize: function(text, font, alignment, path){
		this.parent('text');
		this.draw.apply(this, arguments);
	},
	
	draw: function(text, font, alignment, path){
		var element = this.element;
	
		if (font){
			if (typeof font == 'string'){
				element.style.font = font;
			} else {
				for (var key in font){
					var ckey = key.camelCase ? key.camelCase() : key;
					// NOT UNIVERSALLY SUPPORTED OPTIONS
					// if (ckey == 'kerning') element.setAttribute('kerning', font[key] ? 'auto' : '0');
					// else if (ckey == 'letterSpacing') element.setAttribute('letter-spacing', Number(font[key]) + 'ex');
					// else if (ckey == 'rotateGlyphs') element.setAttribute('glyph-orientation-horizontal', font[key] ? '270deg' : '');
					// else
					element.style[ckey] = font[key];
				}
				element.style.lineHeight = '0.5em';
			}
		}
		
		if (alignment) element.setAttribute('text-anchor', this.textAnchor = (fontAnchors[alignment] || alignment));

		if (path && typeof path != 'number'){
			this._createPaths(new ART.Path(path));
		} else if (path === false){
			this._ejectPaths();
			this.pathElements = null;
		}
		
		var paths = this.pathElements, child;
		
		while ((child = element.firstChild)){
			element.removeChild(child);
		}
		
		// Note: Gecko will (incorrectly) align gradients for each row, while others applies one for the entire element
		
		var lines = String(text).split(/\r?\n/), l = lines.length,
		    baseline = 'central';
		
		if (paths && l > paths.length) l = paths.length;
		
		if (hasBaseline) element.setAttribute('dominant-baseline', baseline);

		element.setAttributeNS(XML, 'space', 'preserve');
		
		for (var i = 0; i < l; i++){
			var line = lines[i], row, content;
			if (paths){
				row = createElement('textPath');
				row.setAttributeNS(XLINK, 'href', '#' + paths[i].getAttribute('id'));
				row.setAttribute('startOffset', fontAnchorOffsets[this.textAnchor] || 0);
			} else {
				row = createElement('tspan');
				row.setAttribute('x', 0);
				row.setAttribute('y', (i * 1.1 + 0.5) + 'em');
			}
			if (hasBaseline){
				row.setAttribute('dominant-baseline', baseline);
				content = row;
			} else if (paths){
				content = createElement('tspan');
				content.setAttribute('dy', '0.35em');
				row.appendChild(content);
			} else {
				content = row;
				row.setAttribute('y', (i * 1.1 + 0.85) + 'em');
			}
			content.setAttributeNS(XML, 'space', 'preserve');
			content.appendChild(document.createTextNode(line));
			element.appendChild(row);
		}
		
		// Measure
		// TODO: Move to lazy ES5 left/top/width/height/bottom/right property getters
		var bb;
		try { bb = element.getBBox(); } catch (x){ }
		if (!bb || !bb.width) bb = this._whileInDocument(element.getBBox, element);
		
		this.left = bb.x;
		this.top = bb.y;
		this.width = bb.width;
		this.height = bb.height;
		this.right = bb.x + bb.width;
		this.bottom = bb.y + bb.height;
		return this;
	},
	
	// TODO: Unify path injection with gradients and imagefills

	inject: function(container){
		this.parent(container);
		this._injectPaths();
		return this;
	},
	
	eject: function(){
		if (this.container){
			this._ejectPaths();
			this.parent();
			this.container = null;
		}
		return this;
	},
	
	_injectPaths: function(){
		var paths = this.pathElements;
		if (!this.container || !paths) return;
		var defs = this.container.defs;
		for (var i = 0, l = paths.length; i < l; i++)
			defs.appendChild(paths[i]);
	},
	
	_ejectPaths: function(){
		var paths = this.pathElements;
		if (!this.container || !paths) return;
		var defs = this.container.defs;
		for (var i = 0, l = paths; i < l; i++)
			defs.removeChild(paths[i]);
	},
	
	_createPaths: function(path){
		this._ejectPaths();
		var id = 'p' + String.uniqueID() + '-';
		
		splitPaths = []; splitPath = ['M', 0, 0];
		path.visit(splitLine, splitCurve, null, splitMove);
		splitPaths.push(splitPath);
		
		var result = [];
		for (var i = 0, l = splitPaths.length; i < l; i++){
			var p = createElement('path');
			p.setAttribute('d', splitPaths[i].join(' '));
			p.setAttribute('id', id + i);
			result.push(p);
		}
		this.pathElements = result;
		this._injectPaths();
	},
	
	_whileInDocument: function(fn, bind){
		// Temporarily inject into the document
		var element = this.element,
		    container = this.container,
			parent = element.parentNode,
			sibling = element.nextSibling,
			body = element.ownerDocument.body,
			canvas = new ART.SVG(1, 1).inject(body);
		this.inject(canvas);
		var result = fn.call(bind);
		canvas.eject();
		if (container) this.inject(container);
		if (parent) parent.insertBefore(element, sibling);
		return result;
	}

});

})();
/*
---
 
script: ART.SVG.js
 
description: Some extensions (filters, dash, shadow blur)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

extends: ART/ART.SVG

provides: [ART.SVG.prototype.dash, ART.SVG.prototype.strokeLinear, ART.SVG.prototype.fillRadial]
 
...
*/

(function() {
var NS = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink', UID = 0, createElement = function(tag){
  return document.createElementNS(NS, tag);
};
  
ART.SVG.Base.implement({
  dash: function(dash) {
    if (dash) {
      this.dashed = true;
      this.element.setAttribute('stroke-dasharray', dash);
    } else if (this.dashed) {
      this.dashed = false;
      this.element.removeAttribute('stroke-dasharray')
    }
  },
  
  
  inject: function(container){
    this.eject();
    if (container instanceof ART.SVG.Group) container.children.push(this);
    this.parent.apply(this, arguments);
    this.container = container.defs ? container : container.container;
		this._injectBrush('fill');
		this._injectBrush('stroke');
    this._injectFilter('blur');
    return this;
  },
  
  strokeLinear: function(stops, angle){
    var gradient = this._createGradient('stroke', 'linear', stops);

    angle = ((angle == null) ? 270 : angle) * Math.PI / 180;

    var x = Math.cos(angle), y = -Math.sin(angle),
      l = (Math.abs(x) + Math.abs(y)) / 2;

    x *= l; y *= l;

    gradient.setAttribute('x1', 0.5 - x);
    gradient.setAttribute('x2', 0.5 + x);
    gradient.setAttribute('y1', 0.5 - y);
    gradient.setAttribute('y2', 0.5 + y);

    return this;
  },
  
  _writeTransform: function(){
    if (Object.equals(this.transformed, this.transform)) return;
    this.transformed = $unlink(this.transform);
    var transforms = [];
    for (var transform in this.transform) transforms.push(transform + '(' + this.transform[transform].join(',') + ')');
    this.element.setAttribute('transform', transforms.join(' '));
  },

  blur: function(radius){
    if (radius == null) radius = 4;
    if (radius == this.blurred) return;
    this.blurred = radius;
    
    var filter = this._createFilter();
    var blur = createElement('feGaussianBlur');
    blur.setAttribute('stdDeviation', radius * 0.25);
    blur.setAttribute('result', 'blur');
    filter.appendChild(blur);
    //in=SourceGraphic
    //stdDeviation="4" result="blur"
    return this;
  },

  unblur: function() {
    delete this.blurred;
    this._ejectFilter();
  },
  
  _injectFilter: function(type){
    if (!this.container) return;
    var filter = this.filter;
    if (filter) this.container.defs.appendChild(filter);
  },
  
  _ejectFilter: function(type){
    if (!this.container) return;
    var filter = this.filter;
    delete this.filter;
    if (filter) this.container.defs.removeChild(filter);
  },
  
  _createFilter: function(){
    this._ejectFilter();
  
    var filter = this.filter = createElement('filter');
  
    var id = 'filter-e' + this.uid;
    filter.setAttribute('id', id);
  
    this._injectFilter();
  
    this.element.setAttribute('filter', 'url(#' + id + ')');
  
    return filter;
  },
});

})();
/*
---
name: ART.Base
description: "Implements ART, ART.Shape and ART.Group based on the current browser."
provides: [ART.Base, ART.Group, ART.Shape, ART.Text]
requires: [ART.VML, ART.SVG]
...
*/

(function(){
	
var SVG = function(){

	var implementation = document.implementation;
	return (implementation && implementation.hasFeature && implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1"));

};

var VML = function(){

	return ART.VML.init(document);

};

var MODE = SVG() ? 'SVG' : VML() ? 'VML' : null;
if (!MODE) return;

ART.Shape = new Class({Extends: ART[MODE].Shape});
ART.Group = new Class({Extends: ART[MODE].Group});
ART.Text = new Class({Extends: ART[MODE].Text});
ART.implement({Extends: ART[MODE]});

})();

/*
---
 
script: Star.js
 
description: A star with variable number of edges
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
 
provides: 
  - ART.Shape.Star
 
...
*/

ART.Shape.Star = new Class({
  
  Extends: ART.Shape,
  
  properties: {
    size:       [['rays', 'radius']],
    rays:       ['number'],
    radus:      ['length', 'percentage']
  },
  
  draw: function(width, rays, radius, offset){
    if (rays == null) rays = 5;
    var path = new ART.Path;
    var outer = width / 2;
    var angle = Math.PI / rays;
    offset = angle / (offset || 2.1);
    if (radius == null) radius = outer *.582;
    var lx = 0, ly = 0;
    for (var i = 0; i < rays * 2; i++) { 
      var r = i % 2 ? outer : radius; 
      var x = r * Math.cos(i * angle + offset);
      var y = r * Math.sin(i * angle + offset);
      if (i == 0) {
        path.move(x - lx + outer, y - ly + outer)
      } else {
        path.line(x - lx, y - ly);
      }
      lx = x;
      ly = y;
    }
    return this.parent(path.close());
  },

  render: function(context) {
    var radius = context.radius;     
    if (radius && radius.length == 4) radius = [radius[0], radius[2], radius[3], radius[1]]       
    return this.draw(context.size.width, context.style.starRays)
  }

});

(function() {
  var Properties = {
    starRays: ['number'],
    starRadius: ['length', 'percentage']
  }
})();
/*
---
 
script: Ellipse.js
 
description: Draw ellipses and circles without a hassle
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
 
provides: 
  - ART.Shape.Ellipse
 
...
*/

ART.Shape.Ellipse = new Class({
  
  Extends: ART.Shape,
  
  draw: function(width, height){
    var path = new ART.Path;
    var rx = width / 2, ry = height / 2;
    path.move(0, ry).arc(width, 0, rx, ry).arc(-width, 0, rx, ry);
    return this.parent(path);
  },
  
  produce: function(delta) {
    return new ART.Shapes.Ellipse(this.style.width + delta * 2, this.style.height + delta * 2)
  },
  
  render: function(context) {   
    return this.draw(context.size.width, context.size.height)
  }

});
/*
---
 
script: Rectangle.js
 
description: Rectangles with rounded corners
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
 
provides: 
  - ART.Shape.Rectangle
 
...
*/

ART.Shape.Rectangle = new Class({

  Extends: ART.Shape,
  
  draw: function(width, height, radius) {
    var path = new ART.Path;
    if (!radius){

      path.move(0, 0).line(width, 0).line(0, height).line(-width, 0).line(0, -height);

    } else {

      if (typeof radius == 'number') radius = [radius, radius, radius, radius];

      var tl = radius[0], tr = radius[1], br = radius[2], bl = radius[3];

      if (tl < 0) tl = 0;
      if (tr < 0) tr = 0;
      if (bl < 0) bl = 0;
      if (br < 0) br = 0;

      path.move(0, tl);

      if (width < 0) path.move(width, 0);
      if (height < 0) path.move(0, height);

      if (tl > 0) path.arc(tl, -tl);
      path.line(Math.abs(width) - (tr + tl), 0);

      if (tr > 0) path.arc(tr, tr);
      path.line(0, Math.abs(height) - (tr + br));

      if (br > 0) path.arc(-br, br);
      path.line(- Math.abs(width) + (br + bl), 0);

      if (bl > 0) path.arc(-bl, -bl);
      path.line(0, - Math.abs(height) + (bl + tl));
    }
    
    return this.parent(path);
  },
  
  render: function(context) {
    var radius = context.radius;     
    if (radius && radius.length == 4) radius = [radius[0], radius[2], radius[3], radius[1]]       
    return this.draw(context.size.width, context.size.height, radius)
  }
});
/*
---
 
script: Flower.js
 
description: Ever wanted a flower button? Here you go
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
 
provides: 
  - ART.Shape.Flower
 
...
*/

ART.Shape.Flower = new Class({
  
  Extends: ART.Shape,
  
  properties: {
    size:       [['leaves', 'radius']],
    leaves:     ['number'],
    radus:      ['length', 'percentage']
  },
  
  draw: function(width, leaves, radius){
     var path = new ART.Path,
         outside = width / 2,
         cx = width / 2,
         cy = cx,
         inside = outside * (radius || 0.5);
     
    leaves = Math.max(leaves || 0, 5);
    path.move(0, inside);
    var points = ["M", cx, cy + rin, "Q"],
        R;
    for (var i = 1; i < leaves * 2 + 1; i++) {
        R = i % 2 ? rout : rin;
        points = points.concat([+(cx + R * Math.sin(i * Math.PI / n)).toFixed(3), +(cy + R * Math.cos(i * Math.PI / n)).toFixed(3)]);
    }
    points.push("z");
    return this.path(points);
    
    
    return this.parent(path.close());
  },

  getOffset: function(styles, offset) {
    var stroke = (styles.strokeWidth || 0);
    return {
      left: ((styles.width == 'auto') ? Math.max(stroke - offset.left, 0) : stroke),
      top: 0,
      right: ((styles.width == 'auto') ? Math.max(stroke - offset.right, 0) : stroke),
      bottom: stroke
    }
  }

});
/*
---
 
script: Arrow.js
 
description: An arrow shape. Useful for all the chat bubbles and validation errors.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
 
provides: 
  - ART.Shape.Arrow
 
...
*/

ART.Shape.Arrow = new Class({

  Extends: ART.Shape,
  
  properties: {
    arrow: [['width', 'height', 'side', 'position']],
    width: ['length', 'percentage'],
    height: ['length', 'percentage'],
    side: ['top', 'right', 'bottom', 'left'],
    position: ['center', 'length', 'percentage']
  },
  
  draw: function(width, height, radius, aw, ah, as, ap){

    var path = new ART.Path;
    
    if (!radius) radius = 0;

    if (typeof radius == 'number') radius = [radius, radius, radius, radius];

    var tl = radius[0], tr = radius[1], br = radius[2], bl = radius[3];

    if (tl < 0) tl = 0;
    if (tr < 0) tr = 0;
    if (bl < 0) bl = 0;
    if (br < 0) br = 0;
    
    var sides = {
      top: Math.abs(width) - (tr + tl),
      right: Math.abs(height) - (tr + br),
      bottom: Math.abs(width) - (br + bl),
      left: Math.abs(height) - (bl + tl)
    };
    
    switch (as){
      case 'top': path.move(0, ah); break;
      case 'left': path.move(ah, 0); break;
    }

    path.move(0, tl);
    
    if (typeof ap == 'string') ap = ((sides[as] - aw) * (ap.toFloat() / 100));
    if (ap < 0) ap = 0;
    else if (ap > sides[as] - aw) ap = sides[as] - aw;
    var ae = sides[as] - ap - aw, aw2 = aw / 2;

    if (width < 0) path.move(width, 0);
    if (height < 0) path.move(0, height);
    
    // top

    if (tl > 0) path.arc(tl, -tl);
    if (as == 'top') path.line(ap, 0).line(aw2, -ah).line(aw2, ah).line(ae, 0);
    else path.line(sides.top, 0);
    
    // right

    if (tr > 0) path.arc(tr, tr);
    if (as == 'right') path.line(0, ap).line(ah, aw2).line(-ah, aw2).line(0, ae);
    else path.line(0, sides.right);
    
    // bottom

    if (br > 0) path.arc(-br, br);
    if (as == 'bottom') path.line(-ap, 0).line(-aw2, ah).line(-aw2, -ah).line(-ae, 0);
    else path.line(-sides.bottom, 0);
    
    // left

    if (bl > 0) path.arc(-bl, -bl);
    if (as == 'left') path.line(0, -ap).line(-ah, -aw2).line(ah, -aw2).line(0, -ae);
    else path.line(0, -sides.left);

    return this.parent(path);
  },

  getOffset: function(styles) {
    return {
      left: (styles.arrowSide == 'left') ? styles.arrowWidth : 0,
      right: (styles.arrowSide == 'right') ? styles.arrowWidth : 0,
      top: (styles.arrowSide == 'top') ? styles.arrowHeight : 0,
      bottom: (styles.arrowSide == 'bottom') ? styles.arrowHeight : 0
    }
  },
  
  render: function(context) {
    var style = context.style;
    return this.draw(context.size.width, context.size.height, context.radius, style.arrowWidth, style.arrowHeight, style.arrowSide, style.arrowPosition)
  },
  
  invoke: function() {
    
    this.render
  }

});

/*
---
 
script: Glyphs.js
 
description: Glyph library
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART
 
provides: 
  - ART.Glyphs
 
...
*/

ART.Glyphs = {
  
  wrench: 'M11.414,11.415c-0.781,0.78-2.048,0.78-2.829,0L3.17,5.999C3.112,6.002,3.058,6.016,3,6.016c-1.657,0-3-1.347-3-3.008c0-0.464,0.114-0.899,0.302-1.292l1.987,1.988c0.391,0.39,1.023,0.39,1.414,0c0.391-0.391,0.391-1.023,0-1.414L1.715,0.3C2.105,0.113,2.538,0,3,0c1.657,0,3,1.347,3,3.008c0,0.051-0.012,0.099-0.015,0.149l5.429,5.429C12.195,9.368,12.195,10.634,11.414,11.415z M11,9.501c0-0.276-0.224-0.5-0.5-0.5h-1c-0.277,0-0.501,0.224-0.501,0.5v1c0,0.275,0.224,0.5,0.501,0.5h1c0.276,0,0.5-0.225,0.5-0.5V9.501z',
  
  refresh: 'M0,0M5.142,6.504l-2,1.174c1.07,1.899,3.709,2.232,5.203,0.661l1.603,0.688c-2.096,2.846-6.494,2.559-8.234-0.508L0,9.524c0.199-1.665,0.398-3.329,0.597-4.993C2.112,5.189,3.626,5.847,5.142,6.504M6.858,5.51L6.844,5.505l0.013-0.008L6.858,5.51 M5.142,6.491C5.16,6.494,5.16,6.498,5.143,6.503L5.142,6.491 M11.402,7.466L12,2.477l-1.714,1.007C8.549,0.411,4.147,0.131,2.054,2.971L3.655,3.66C5.156,2.089,7.78,2.425,8.857,4.322l-2,1.175L11.402,7.466M12,12z',
  
  search: 'M0,0M11.707,11.707c-0.391,0.391-1.024,0.391-1.415,0L7.759,9.174c-0.791,0.523-1.736,0.832-2.755,0.832C2.24,10.006,0,7.766,0,5.003S2.24,0,5.003,0s5.003,2.24,5.003,5.003c0,1.02-0.309,1.966-0.833,2.755l2.533,2.533C12.098,10.683,12.098,11.315,11.707,11.707z M5.003,2.002c-1.658,0-3.002,1.344-3.002,3.001c0,1.658,1.344,3.002,3.002,3.002c1.657,0,3.001-1.344,3.001-3.002C8.005,3.346,6.66,2.002,5.003,2.002M12,12z',
  
  smallCross: 'M0,0M8.708,4.706L7.414,6l1.294,1.294c0.391,0.391,0.391,1.023,0,1.414s-1.023,0.391-1.414,0L6,7.414L4.706,8.708c-0.391,0.391-1.023,0.391-1.415,0c-0.39-0.391-0.39-1.023,0-1.414L4.586,6L3.292,4.706c-0.39-0.391-0.39-1.024,0-1.415c0.391-0.391,1.024-0.39,1.415,0L6,4.586l1.294-1.294c0.391-0.391,1.023-0.39,1.414,0C9.099,3.683,9.099,4.315,8.708,4.706M12,12z',
  
  smallPlus: 'M0,0M7,3.17V5h1.83c0.552,0,1,0.448,1,1c0,0.553-0.448,1-1,1H7v1.83c0,0.553-0.448,1-1,1.001c-0.552-0.001-1-0.448-1-1V7L3.17,7c-0.552,0-1-0.448-1-1c0-0.553,0.448-1,1-1H5v-1.83c0-0.552,0.448-1,1-1C6.552,2.17,7,2.617,7,3.17M12,12z',
  
  smallMinus: 'M0,0M8.83,5c0.553,0,1,0.448,1,1l0,0c0,0.552-0.447,1-1,1H3.17c-0.552,0-1-0.448-1-1l0,0c0-0.552,0.448-1,1-1H8.83M12,12z',
  
  resize: 'M0,0M8.299,12L12,8.299v1.414L9.713,12H8.299z M4.244,12L12,4.244v1.414L5.658,12H4.244z M0.231,12L12,0.231v1.414L1.646,12H0.231M12,12z',
  
  checkMark: 'M8.277,0.046L6.301,0L2.754,4.224L0.967,2.611L0,3.633l3.464,3.51L8.277,0.046z',
  radio: 'M2.5,0C3.881,0,5,1.119,5,2.5S3.881,5,2.5,5S0,3.881,0,2.5S1.119,0,2.5,0z',
  
  //triangles
  
  triangleUp: "M0,8L4,0L8,8L0,8",
  triangleDown: "M0,0L8,0L4,8L0,0",
  triangleLeft: "M0,4L8,0L8,8L0,4",
  triangleRight: "M0,0L8,4L0,8L0,0",
  triangles: "M0,6L3,0L6,6L0,6M0,10L6,10L3,16L0,10",
  
  plus: "M3,0L6,0L6,3L9,3L9,6L6,6L6,9L3,9L3,6L0,6L0,3L3,3Z",
  minus: "M9,9M0,1.5L9,1.5L9,4.5L0,4.5Z",
  shutdown: "M21.816,3.999c-0.993-0.481-2.189-0.068-2.673,0.927c-0.482,0.995-0.066,2.191,0.927,2.673c3.115,1.516,5.265,4.705,5.263,8.401c-0.01,5.154-4.18,9.324-9.333,9.333c-5.154-0.01-9.324-4.18-9.334-9.333c-0.002-3.698,2.149-6.89,5.267-8.403c0.995-0.482,1.408-1.678,0.927-2.673c-0.482-0.993-1.676-1.409-2.671-0.927C5.737,6.152,2.667,10.72,2.665,16C2.667,23.364,8.634,29.332,16,29.334c7.365-0.002,13.333-5.97,13.334-13.334C29.332,10.722,26.266,6.157,21.816,3.999z M16,13.833c1.104,0,1.999-0.894,1.999-2V2.499C17.999,1.394,17.104,0.5,16,0.5c-1.106,0-2,0.895-2,1.999v9.333C14,12.938,14.894,13.833,16,13.833z"
  
};
/*
---

name: Class.Extras

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires: Class

provides: [Class.Extras, Chain, Events, Options]

...
*/

(function(){

this.Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.append(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

this.Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = removeOn(type);

		/*<1.2compat>*/
		if (fn == $empty) return this;
		/*</1.2compat>*/

		this.$events[type] = (this.$events[type] || []).include(fn);
		if (internal) fn.internal = true;
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = removeOn(type);
		var events = this.$events[type];
		if (!events) return this;
		args = Array.from(args);
		events.each(function(fn){
			if (delay) fn.delay(delay, this, args);
			else fn.apply(this, args);
		}, this);
		return this;
	},
	
	removeEvent: function(type, fn){
		type = removeOn(type);
		var events = this.$events[type];
		if (events && !fn.internal){
			var index =  events.indexOf(fn);
			if (index != -1) delete events[index];
		}
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--;) if (i in fns){
				this.removeEvent(type, fns[i]);
			}
		}
		return this;
	}

});

this.Options = new Class({

	setOptions: function(){
		var options = this.options = Object.merge.apply(null, [{}, this.options].append(arguments));
		if (this.addEvent) for (var option in options){
			if (typeOf(options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, options[option]);
			delete options[option];
		}
		return this;
	}

});

})();

/*
---

name: Class.Extras

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires: Class

extends: Core/Class.Extras
...
*/

//dont use typeOf in loop :)

(function(apply) {
  
  Options.prototype.setOptions = function(){
  	var options = this.options = Object.merge.apply(null, [{}, this.options].append(arguments));
  	if (this.addEvent) for (var option in options){
  	  var value = options[option];
  		if (!value || (value.apply != apply) || !(/^on[A-Z]/).test(option)) continue;
  		this.addEvent(option, options[option]);
  		delete options[option];
  	}
  	return this;
  }

})(Function.prototype.apply);
/*
---
 
script: Observer.js
 
description: A class that tracks updates in input periodically and fires onChange event
 
license: MIT-style license.
 
requires:
- Core/Options
- Core/Events

provides: [Observer]
 
...
*/


Observer = new Class({

	Implements: [Options, Events],

	options: {
		periodical: false,
		delay: 1000
	},

	initialize: function(el, onFired, options){
		this.element = $(el) || $$(el);
		this.addEvent('onFired', onFired);
		this.setOptions(options);
		this.bound = this.changed.bind(this);
		this.resume();
	},

	changed: function() {
		var value = this.element.get('value');
		if (Object.equals(this.value, value)) return;
		this.clear();
		this.value = value;
		this.timeout = this.onFired.delay(this.options.delay, this);
	},

	setValue: function(value) {
		this.value = value;
		this.element.set('value', value);
		return this.clear();
	},

	onFired: function() {
		this.fireEvent('onFired', [this.value, this.element]);
	},

	clear: function() {
		$clear(this.timeout || null);
		return this;
	},

	pause: function(){
		if (this.timer) $clear(this.timer);
		else this.element.removeEvent('keyup', this.bound);
		return this.clear();
	},

	resume: function(){
		this.value = this.element.get('value');
		if (this.options.periodical) this.timer = this.changed.periodical(this.options.periodical, this);
		else this.element.addEvent('keyup', this.bound);
		return this;
	}

});
/*
---

name: Fx

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires: [Chain, Events, Options]

provides: Fx

...
*/

(function(){

var Fx = this.Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		/*
		onStart: nil,
		onCancel: nil,
		onComplete: nil,
		*/
		fps: 60,
		unit: false,
		duration: 500,
		frames: null,
		frameSkip: true,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(now){
		if (this.options.frameSkip){
			var diff = (this.time != null) ? (now - this.time) : 0, frames = diff / this.frameInterval;
			this.time = now;
			this.frame += frames;
		} else {
			this.frame++;
		}
		
		if (this.frame < this.frames){
			var delta = this.transition(this.frame / this.frames);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.frame = this.frames;
			this.set(this.compute(this.from, this.to, 1));
			this.stop();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.isRunning()) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.pass(arguments, this)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.frame = (this.options.frameSkip) ? 0 : -1;
		this.time = null;
		this.transition = this.getTransition();
		var frames = this.options.frames, fps = this.options.fps, duration = this.options.duration;
		this.duration = Fx.Durations[duration] || duration.toInt();
		this.frameInterval = 1000 / fps;
		this.frames = frames || Math.round(this.duration / this.frameInterval);
		this.fireEvent('start', this.subject);
		pushInstance.call(this, fps);
		return this;
	},
	
	stop: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			if (this.frames == this.frame){
				this.fireEvent('complete', this.subject);
				if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
			} else {
				this.fireEvent('stop', this.subject);
			}
		}
		return this;
	},
	
	cancel: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			this.frame = this.frames;
			this.fireEvent('cancel', this.subject).clearChain();
		}
		return this;
	},
	
	pause: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
		}
		return this;
	},
	
	resume: function(){
		if ((this.frame < this.frames) && !this.isRunning()) pushInstance.call(this, this.options.fps);
		return this;
	},
	
	isRunning: function(){
		var list = instances[this.options.fps];
		return list && list.contains(this);
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};

// global timers

var instances = {}, timers = {};

var loop = function(){
	var now = Date.now();
	for (var i = this.length; i--;){
		var instance = this[i];
		if (instance) instance.step(now);
	}
};

var pushInstance = function(fps){
	var list = instances[fps] || (instances[fps] = []);
	list.push(this);
	if (!timers[fps]) timers[fps] = loop.periodical(Math.round(1000 / fps), list);
};

var pullInstance = function(fps){
	var list = instances[fps];
	if (list){
		list.erase(this);
		if (!list.length && timers[fps]){
			delete instances[fps];
			timers[fps] = clearInterval(timers[fps]);
		}
	}
};

})();

/*
---
 
script: Class.Includes.js
 
description: Multiple inheritance in mootools, chained Extend basically.
 
license: MIT-style license.
 
requires:
- Core/Options
- Core/Events
- Core/Class

provides: [Class.Mutators.Includes, Class.include, Class.flatten]
 
...
*/

(function() {
  
  var getInstance = function(klass){
    klass.$prototyping = true;
    var proto = new klass;
    delete klass.$prototyping;
    return proto;
  };
  
  Class.include = function(klass, klasses) {
    return new Class({
      Includes: Array.from(arguments).flatten()
    });
  };
  
  Class.flatten = function(items) {
    return Array.from(items).clean().map(function(item, i) {
      if (item.parent) {
        return [Class.flatten(item.parent), item];
      } else {
        return item;
      }
    }).flatten();
  };

  Class.Mutators.Includes = function(items) {
    items = Array.from(items);
    var instance = this.parent ? this.parent : items.shift();
    Class.flatten(items).each(function(parent){
      var baked = new Class;
      if (instance) {
        baked.parent = instance;
        baked.prototype = getInstance(instance);
      }
      var proto = Object.append({}, parent.prototype);
      delete proto.$caller;
      delete proto.$constructor;
      delete proto.parent;
      delete proto.caller;
      for (var i in proto) {
        var fn = proto[i];
        if (fn && fn.$owner && (fn.$owner != parent) && fn.$owner.parent) delete proto[i];
      }
      baked.implement(proto);
      instance = baked;
    }, this);
    this.parent = instance;
    this.prototype = getInstance(instance);
  };
})();
/*
---
 
script: Class.States.js
 
description: A mutator that adds some basic state definition capabilities.
 
license: MIT-style license.
 
requires:
- Core/Options
- Core/Events
- Core/Class
- Core/Class.Extras
- Class.Mutators.Includes

provides: 
  - Class.Mutators.States
  - Class.Stateful
 
...
*/


Class.Stateful = function(states) {
  var proto = {
    options: {
      states: {}
    },
    setStateTo: function(state, to) {
      return this[this.options.states[state][to ? 'enabler' : 'disabler']]();
    }
  };

  Object.each(states, function(methods, state) {
    var options = Array.link(methods, {
      enabler: Type.isString,
      disabler: Type.isString,
      toggler: Type.isString,
      reflect: function(value){ return value != null; }
    });
    
    //enable reflection by default
    if (options.reflect == null) options.reflect = true;

    proto.options.states[state] = options;

    proto[options.enabler] = function() {
      if (this[state]) return false;
      this[state] = true; 
      if (Class.hasParent(this)) this.parent.apply(this, arguments);

      this.fireEvent(options.enabler, arguments);
      if (this.onStateChange && options.reflect) this.onStateChange(state, true, arguments);
      return true;
    };

    proto[options.disabler] = function() {
      if (!this[state]) return false;
      this[state] = false;

  	  if (Class.hasParent(this)) this.parent.apply(this, arguments);

      this.fireEvent(options.disabler, arguments);
      if (this.onStateChange && options.reflect) this.onStateChange(state, false, arguments);
      return true;
    };

    if (options.toggler) proto[options.toggler] = function() {
      return this[this[state] ? options.disabler : options.enabler].apply(this, arguments);
    };
  });

  return new Class(proto);
};

Class.Mutators.States = function(states) {
  this.implement('Includes', Class.Stateful(states));
};
Class.Mutators.Stateful = function(states) {
  this.implement('Implements', Class.Stateful(states));
};
/*
---
 
script: Class.Macros.js
 
description: A few functions that simplify definition of everyday methods with common logic
 
license: MIT-style license.
 
requires:
- Core/Options
- Core/Events
- Core/Class.Extras

provides: [Macro, Class.hasParent]
 
...
*/

Class.hasParent = function(klass) {
  var caller = klass.$caller;
  return !!(caller.$owner.parent && caller.$owner.parent.prototype[caller.$name]);
};

Macro = {};

/*
Make stackable function what executes it's parent before itself
*/
Macro.onion = function(callback) {
  return function() {
    if (!this.parent.apply(this, arguments)) return;
    return callback.apply(this, arguments) !== false;
  };
};

/*
Make getter-function with cache. Returned function alculates values on first call, after return this[name].
To reset cache use:

  delete this[name];

*/
Macro.getter = function(name, callback) {
  return function() {
    if (!this[name]) this[name] = callback.apply(this, arguments);
    return this[name];
  };
};


/*
Make function that runs it's parent if it exists, and runs itself if does not
*/
Macro.defaults = function(callback) {
  return function() {
    if (Class.hasParent(this)) {
      return this.parent.apply(this, arguments);
    } else {
      return callback.apply(this, arguments);
    }
  };
};

/*
Make function what returns property 'name' of passed argument
*/
Macro.map = function(name) {
  return function(item) {
    return item[name];
  };
};

/*
Make function Macro.map but diference that Macro.proc calls 'name' method
*/
Macro.proc = function(name, args) {
  return function(item) {
    return item[name].apply(item, args || arguments);
  };
};

/*
Make function what call method 'method' of property this[name] with passed arguments
*/
Macro.delegate = function(name, method) {
  return function() {
    if (this[name]) return this[name][method].apply(this[name], arguments);
  };
};
/*
---
 
script: LSD.js
 
description: LSD namespace definition
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Core/Class
  - Core/Events
  - Core/Options
  - Core/Browser
  - Core/Object
  - Ext/Macro
  - Ext/Class.Stateful
  - Ext/Class.mixin
  - Ext/FastArray
 
provides: 
  - LSD
 
...
*/

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

var LSD = new Events;
Object.append(LSD, {
  Module: {},  // must-have stuff for all widgets 
  Trait: {},   // some widgets may use those
  Mixin: {},   // these may be applied in runtime
  
  // Conventions
  Events: {},
  Attributes: {
    Ignore: new FastArray,
    Numeric: new FastArray('tabindex', 'width', 'height')
  },
  Styles: {},
  States: {
    Known: {
      'hidden':   ['hide',    'show'],
      'disabled': ['disable', 'enable'],
      'focused':  ['focus',   'blur']
    },
    Positive: {
      disabled: 'disabled',
      focused: 'focused'
    },
    Negative: {
      enabled: 'disabled',
      blured: 'focused'
    },
    Attributes: new FastArray
  }
});

LSD.start = function() {
  if (LSD.started) return;
  LSD.started = true;
  LSD.fireEvent('before');
  LSD.fireEvent('ready');
};
/*
---
 
script: Position.js
 
description: Easily reposition element by positioning widget absolutely and one of the edges
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

provides: 
  - LSD.Mixin.Position
 
...
*/

LSD.Mixin.Position = new Class({
  behaviour: "[at], [position]",
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.positionAt(this.attributes.at || this.attributes.position);
  },
  
  positionAt: function(position) {
    position.split(/\s+/).each(function(property) {
      this.element.setStyle(property, 0)
    }, this);
    this.element.setStyle('position', 'absolute');
    return true;
  }
  
});
/*
---
 
script: Base.js
 
description: Lightweight base widget class to inherit from.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Options
  - Core/Events
 
provides:
  - LSD.Base
...
*/

LSD.Base = new Class({
  
  Implements: [Options, Events],
  
  initialize: function() {
  },
  
  toElement: function(){
    this.build();
    return this.element;
  },
  
  attach: function() {
    this.toElement().store('widget', this);
    return true;
  },
  
  detach: function() {
    this.toElement().eliminate('widget', this);
    return true;
  },
  
  setState: function(state) {
    if (LSD.States.Attributes[state]) {
      this.setAttribute(state, true)
    } else {
      this.addClass('is-' + state);
    }
    this.addPseudo(state);
  },
  
  unsetState: function(state) {
    if (LSD.States.Attributes[state]) {
      this.removeAttribute(state)
    } else {
      this.removeClass('is-' + state);
    }
    this.removePseudo(state);
  },

  dispose: function() {
    var parent = this.parentNode;
    this.element.dispose();
    delete this.parentNode;
    this.fireEvent('dispose', parent);
  },
  
  setParent: function(widget) {
    this.parentNode = widget;
    this.document = widget.document;
  },
  
  setDocument: function(widget) {
    var element = document.id(widget)
    var isDocument = (widget.nodeType == 9)
    if (isDocument || element.offsetParent) {
      var document = isDocument ? widget : element.ownerDocument.body.retrieve('widget');
      this.document = document;
      this.fireEvent('dominject', element);
      this.dominjected = true;
    }
  },
  
  inject: function(widget) {
    if (this.parentNode) this.dispose();
    this.toElement().inject(widget);
    this.setDocument(widget);
    this.setParent(widget);
    this.fireEvent('inject', arguments);
  },
  
  destroy: function() {
    if (this.parentNode) this.dispose();
    this.detach();
    if (this.element) this.element.destroy();
  },

  onDOMInject: function(callback) {
    if (this.document) callback.call(this, document.id(this.document)) 
    else this.addEvent('dominject', callback.bind(this))
  },
  
  onChange: function() {
    this.fireEvent('change', arguments)
    return true;
  },
  
  build: Macro.onion(function() {
    var attrs = $unlink(this.options.element);
    var tag = attrs.tag;
    delete attrs.tag;
    var classes = ['lsd'];
    if (this.options.tag != tag) classes.push(this.options.tag);
    classes.push(this.classes.join(' '));
    if (this.options.id) classes.push('id-' + this.options.id);
    this.element = new Element(tag, attrs).addClass(classes.join(' '));
    
    if (this.attributes) 
      for (var name in this.attributes) 
        if (name != 'width' && name != 'height') this.element.setAttribute(name, this.attributes[name]);
        
    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    this.redraws = 0;
    this.attach()
  }),
  
  onStateChange: function(state, value, args) {
    var args = Array.from(arguments);
    args.splice(1, 2); //state + args
    this[value ? 'setState' : 'unsetState'].apply(this, args);
    if (this.redraws > 0) this.refresh(true);
    return true;
  },
  
  getSelector: function(){
    var parent = this.parentNode;
    var selector = (parent && parent.getSelector) ? parent.getSelector() + ' ' : '';
    selector += this.options.tag;
    if (this.options.id) selector += '#' + this.options.id;
    for (var klass in this.classes)  if (this.classes.hasOwnProperty(klass))  selector += '.' + klass;
    for (var pseudo in this.pseudos) if (this.pseudos.hasOwnProperty(pseudo)) selector += ':' + pseudo;
    if (this.attributes) for (var name in this.attributes) selector += '[' + name + '=' + this.attributes[name] + ']';
    return selector;
  },
  
  render: Macro.onion(function(){
    if (!this.built) this.build();
    delete this.halted;
    this.redraws++;
    this.repaint.apply(this, arguments);
  }),
  
  repaint: function(style) {
    this.renderStyles(style);
    this.childNodes.each(function(child){
      child.render();
    });
  },

  /*
    Halt marks widget as failed to render.
    
    Possible use cases:
    
    - Dimensions depend on child widgets that are not
      rendered yet
    - Dont let the widget render when it is not in DOM
  */ 
  halt: function() {
    if (this.halted) return false;
    this.halted = true;
    return true;
  },
  
  /*
    Update marks widget as willing to render. That
    can be followed by a call to *render* to trigger
    redrawing mechanism. Otherwise, the widget stay 
    marked and can be rendered together with ascendant 
    widget.
  */
  
  update: function(recursive) {
    if (recursive) {
      this.walk(function(widget) {
        widget.update();
      });
    }
    return this.parent.apply(this, arguments);
  },
  
  /*
    Refresh updates and renders widget (or a widget tree 
    if optional argument is true). It is a reliable way
    to have all elements redrawn, but a costly too.
    
    Should be avoided when possible to let internals 
    handle the rendering and avoid some unnecessary 
    calculations.
  */

  refresh: function(recursive) {
    this.update(recursive);
    return this.render();
  },
  
  $family: function() {
    return "object"
  },
  
  /*
    Wrapper is where content nodes get appended. 
    Defaults to this.element, but can be redefined
    in other Modules or Traits (as seen in Container
    module)
  */
  
  getWrapper: function() {
    return this.toElement();
  }
  
});
/*
---
 
script: Item.js
 
description: Easy way to have a list of children (to select from) or something like that.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Ext/Class.Stateful

provides: 
  - LSD.Trait.Item
  - LSD.Trait.Item.State
  - LSD.Trait.Item.Stateful
 
...
*/

LSD.Trait.Item = new Class({
  options: {
    events: {
      self: {
        setParent: 'setList'
      }
    }
  },
  
  select: Macro.onion(function() {
    this.listWidget.selectItem(this)
  }),
  
  attach: Macro.onion(function() {
    this.value = this.element.get('item') || $uid(this.element);
  }),
  
  getValue: Macro.defaults(function() {
    return this.value;
  }),
  
  setList: function(widget) {
    if (!widget.addItem) 
      if (Element.type(widget))
        for (var parent = widget, widget = null; parent && !widget; widget = parent.retrieve('widget'), parent = parent.parentNode);
      else
        while (!widget.addItem) widget = widget.parentNode;
    if (widget.addItem) return widget.addItem(this)
  }
})

LSD.Trait.Item.State = Class.Stateful({
  selected: ['select', 'unselect']
});
LSD.Trait.Item.Stateful = [
  LSD.Trait.Item.State,
  LSD.Trait.Item
]
/*
---
 
script: Value.js
 
description: Make your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Trait.Value
 
...
*/

LSD.Trait.Value = new Class({

  setValue: function(item) {
    var value = this.value;
    this.value = this.processValue(item);
    if (value != this.value) {
      var result = this.applyValue(this.value);
      this.onChange(this.value);
      return result;
    }
  },
  
  applyValue: function(item) {
    //if (this.element.getProperty('itemprop')) this.element.set('itemvalue', item);
    return this.setContent(item)
  },

  getValue: function() {
    return this.formatValue(this.value);
  },

  formatValue: $arguments(0),
  processValue: $arguments(0),
  
  onChange: function() {
    this.fireEvent('change', arguments)
    return true;
  }
});
/*
---
 
script: Container.js
 
description: A container class that swallows all kind of a content
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
 
provides: [LSD.Container]
 
...
*/

LSD.Container = new Class({
  
  Implements: [Events, Options],
  
  options: {
    data: null,
    request: null,

    element: null,
    iframe: null,
    attributes: null,
    container: null,
    content: null,

    padding: null
  },
  
  initialize: function(element, options) {
    this.element = $(element);
    
    if (!this.element) return
    
    this.set(options)
    return this
  },
  
  toElement: function() {
    return this.element;
  },
  
  set: function() {
    var params = Array.link(arguments, {options: Object.type, content: String.type, fn: Function.type, element: Element.type});
    if (!Hash.getLength(params)) return;
    if (!params.options) params.options = {};
    if (params.fn) this.set(params.fn());
    if (params.element) params.options.element = params.element;
    if (params.element && params.element.get('iframe')) {
      params.iframe = params.element;
      delete params.element
    }
    
    if (params.content) params.options = $merge(params.options, {content: params.content});

    return this.act($merge(this.options, params.options));
  },
  
  load: function() {
    this.set.apply(this, arguments)
    return this.options
  },
  
  act: function(options) {
    //first set static stuff
    var result = this.append(options.element || options.content) || this.build(options.attributes) || this.render(options.content);
    //second do a request if needed
    return this.request(options.request) || this.browse(options.iframe) || result
  },
  
  browse: function(iframe) {
    if (!iframe) return false;
    switch(typeOf(this.options.iframe)) {
      case "string": 
        this.options.iframe = {src: this.options.iframe};
      case "element":
        this.iframe = this.options.iframe;
      default:
        if (!this.iframe) {
          this.iframe = new IFrame($merge({
            styles: {
              border: 0, 
              display: 'block',
              width: "100%",
              height: this.element.scrollHeight
            }
          }, this.options.iframe))
        } else {
          var options = $merge(this.options.iframe) || {}
          if (options.src == this.iframe.src) delete options.src //do not set same src to avoid refreshing
          this.iframe.set(this.options.iframe)
        }
    }
    
    if (this.iframe.getParent() != this.element) this.iframe.inject(this.empty());
    return this.iframe;
  },
  
  append: function(element) {
    if (!$(element)) return false;
    this.element.adopt(element);
    this.update();
    return element;
  },
  
  request: function(options) {  
    if (!options || !options.url) return false;
    this.xhr = new Request($merge({method: "get"}, options));
    this.xhr.addEvent('success', this.recieve.bind(this));
    return this.xhr.send();
  },
  
  render: function(html) {
    if (!String.type(html) || !html.length) return false;
    this.empty().set('html', html);
    return html;
  },
  
  build: function(attributes) {
    if (!Object.type(attributes)) return false;
    return this.element.adopt(new Element(attributes.tag || 'div', attributes));
  },
  
  recieve: function(html) {
    this.render(html);
    this.fireEvent('update', this.element);
  },

  update: function() {
    this.fireEvent('update', this.element);
  },
  
  empty: function() {
    this.element.empty();
    return this.element;
  }
  
});


Moo = {};
Moo.Container = new Class({
  Extends: LSD.Container,
  
  initialize: function(widget, options) {
    this.widget = widget;
    //TODO: Remove the need for this container
    this.container = new Element('div', {'class': 'container'}).inject($(this.widget));
    this.parent(this.container, options);
  },
  
  empty: function() { //skip LSD widgets
    this.element.getChildren().each(function(child) {
      if (!child.retrieve('widget')) child.destroy();
    });
    return this.element;
  },
  
  update: function() {
    this.parent.apply(this, arguments);
    this.widget.fireEvent('contentChanged', arguments)
  }
});
/*
---
 
script: Container.js
 
description: Makes widget use container - wrapper around content setting
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Container

provides:
  - LSD.Module.Container
 
...
*/

LSD.Module.Container = new Class({
  options: {
    container: false,
    
    proxies: {
      container: {
        container: function() {
          return $(this.getContainer()) //creates container, once condition is true
        },
        condition: $lambda(false),      //turned off by default
        priority: -1,                   //lowest priority
        rewrite: false                  //does not rewrite parent
      }
    }
  },
  
  setContent: function(item) {
    if (item.title) item = item.title;
    return this.getContainer().set.apply(this.container, arguments);
  },
  
  getContainer: Macro.getter('container', function() {
    return new Moo.Container(this, this.options.container);
  }),
  
  getWrapper: function() {
    return this.getContainer().toElement()
  }
});
/*
---
 
script: Dimensions.js
 
description: Get and set dimensions of widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

provides: 
  - LSD.Trait.Dimensions
 
...
*/


LSD.Trait.Dimensions = new Class({
  initialize: function() {
    this.size = {};
    this.parent.apply(this, arguments);
  },
  
  render: function() {
    var old = $unlink(this.size);
    if (!this.parent.apply(this, arguments)) return false;
    this.setSize({height: this.getStyle('height'), width: this.getStyle('width')}, old);
    return true;
  },
  
  setSize: function(size) {
    if (!(this.setHeight(size.height, true) + this.setWidth(size.width, true))) return false;
    var element = this.element, padding = this.offset.padding;
    if (size.height && this.style.expressed.height) element.style.height = size.height - padding.top - padding.bottom + 'px'
    if (size.width && this.style.expressed.width) element.style.width = size.width - padding.left - padding.right + 'px';
  },
  
  setHeight: function(value, light) {
    value = Math.min(this.style.current.maxHeight || 1500, Math.max(this.style.current.minHeight || 0, value));
    if (this.size.height == value) return false;
    this.size.height = value;
    if (!light) this.setStyle('height', value);
    return value;
  },
    
  setWidth: function(value, light) {
    value = Math.min(this.style.current.maxWidth || 3500, Math.max(this.style.current.minWidth || 0, value));
    if (this.size.width == value) return false;
    this.size.width = value;
    if (!light) this.setStyle('width', value);
    return value;
  },
  
  getClientHeight: function() {
    var style = this.style.current, height = style.height, offset = this.offset, padding = offset.padding;
    if (!height || (height == "auto")) {
      height = this.element.clientHeight;
      var inner = offset.inner || padding;
      if (height > 0 && inner) height -= inner.top + inner.bottom;
    }
    if (height != 'auto' && padding) height += padding.top + padding.bottom;
    return height;
  },
  
  getClientWidth: function() {
    var style = this.style.current, offset = this.offset, padding = offset.padding, width = style.width;
    if (typeof width != 'number') { //auto, inherit, undefined
      var inside = offset.inside, outside = offset.outside, shape = offset.shape;
      width = this.element.clientWidth;
      if (width > 0) {
        if (shape) width -= shape.left + shape.right;
        if (inside) width -= inside.left + inside.right;
        if (outside) width -= outside.left + outside.right;
      }
    }
    if (style.display != 'block' && padding && inside) width += padding.left + padding.right;
    return width;
  },
  
  getOffsetHeight: function(height) {
    var style = this.style.current, inside = this.offset.inside, bottom = style.borderBottomWidth, top = style.borderTopWidth;
    if (!height) height =  this.getClientHeight();
    if (inside)  height += inside.top + inside.bottom;
    if (top)     height += top;
    if (bottom)  height += bottom;
    return height;
  },
  
  getOffsetWidth: function(width) {
    var style = this.style.current, inside = this.offset.inside, left = style.borderLeftWidth, right = style.borderRightWidth;
    if (!width) width =  this.getClientWidth();
    if (inside) width += inside.left + inside.right;
    if (left)   width += left;
    if (right)  width += right
    return width;
  },
  
  getLayoutHeight: function(height) {
    height = this.getOffsetHeight(height);
    if (this.offset.margin)  height += this.offset.margin.top + this.offset.margin.bottom;
    if (this.offset.outside) height += this.offset.outside.top + this.offset.outside.bottom;
    return height;
  },

  getLayoutWidth: function(width) {
    var width = this.getOffsetWidth(width), offset = this.offset, margin = offset.margin, outside = offset.outside
    if (margin)  width += margin.right + margin.left;
    if (outside) width += outside.right + outside.left;
    return width;
  }
  
});
/*
---
 
script: Node.js
 
description: Super lightweight base class for abstract elements (documents, commands, meta)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  - LSD.Node
  
...
*/

LSD.Node = new Class({
  
  Implements: [Events, Options],  
  
  options: {},

  initialize: function(element, options) {
    this.element = document.id(element);
    this.setOptions(options);
    var attributes = this.options.element;
    if (attributes && element) this.element.set(attributes);
  },
  
  toElement: function() {
    return this.element;
  }
})
/*
---
 
script: Checkbox.js
 
description: Abstract command
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
 
provides: 
  - LSD.Command
  - LSD.Command.Command
 
...
*/

LSD.Command = new Class({
  Stateful: {
    disabled: ['disable', 'enable']
  },
  
  options: {
    id: null
  },
  
  Implements: [Options, Events],
  
  initialize: function(document, options) {
    this.setOptions(options);
    if (document) {
      this.document = document;
      if (!this.document.commands) this.document.commands = {};
      this.document.commands[this.options.id] = this;
    }
  },
  
  click: function() {
    this.fireEvent('click', arguments);
  },
  
  attach: function(widget) {
    var states = this.options.states;
    var events = widget.events._command = {}, self = this;
    Object.each(states, function(state, name) {
      events[state.enabler] = function() {
        self[state.enabler].apply(widget, arguments)
      }
      events[state.disabler] = function() {
        self[state.disabler].apply(widget, arguments)
      }
    });
    if (widget.options.events.command) this.addEvents(widget.options.events.command);
    this.addEvents(events);
  },
  
  detach: function(widget) {
    if (widget.options.events.command) this.removeEvents(widget.options.events.command);
    this.removeEvents(events);
  }
})

LSD.Command.Command = LSD.Command;
/*
---
 
script: Checkbox.js
 
description: Two-state command (can be on and off)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Command
 
provides: 
  - LSD.Command.Checkbox
 
...
*/

/*
  Checkbox commands are useful when you need to track and toggle
  state of some linked object. 
  
  Provide your custom logic hooking on *check* and *uncheck*
  state transitions. Use *checked* property to get the current state.
  
  Examples:
    - Button that toggles visibility of a sidebar
    - Context menu item that shows or hides line numbers in editor
*/

LSD.Command.Checkbox = new Class({
  Extends: LSD.Command,
  
  Stateful: {
    checked: ['check', 'uncheck', 'toggle']
  },

  click: function() {
    this.parent.apply(this, arguments);
    this.toggle();
  }
})
/*
---
 
script: Radio.js
 
description: A command that is linked with others by name (one of many)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Command
 
provides: 
  - LSD.Command.Radio
 
...
*/

/*
  Radio groupping is a way to links commands together to allow
  only one in the group be active at the moment of time.
  
  Activation (*check*ing) of the commands deactivates all 
  other commands in a radiogroup.
  
  Examples: 
    - Tabs on top of a content window
    - List of currently open documents in a context menu that
      shows which of them is the one you edit now and an 
      ability to switch between documents
*/

LSD.Command.Radio = new Class({
  Extends: LSD.Command,
  
  Stateful: {
    checked: ['check', 'uncheck']
  },

  options: {
    radiogroup: false
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    var name = this.options.radiogroup || this.options.name;
    if (name) {
      var groups = this.document.radiogroups;
      if (!groups) groups = this.document.radiogroups = {};
      var group = groups[name];
      if (!group) group = groups[name] = [];
      group.push(this);
      this.group = group;
    }
    this.addEvent('check', function() {
      group.each(function(command) {
        if (command != this) command.uncheck()
      }, this);
    }.bind(this))
  },
  
  click: function() {
    this.parent.apply(this, arguments);
    this.check();
  }
});
/*
---
 
script: Layout.js
 
description: A logic to render (and nest) a few widgets out of the key-value hash
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD

provides: [LSD.Layout]
 
...
*/

LSD.Layout = new Class({
  
  Implements: [Options],
    
  initialize: function(widget, layout, options) {
    if (LSD.Layout.isConvertable(widget)) widget = LSD.Layout.build(widget)
    this.widget = widget;
    this.layout = layout;
    this.setOptions(options);
    this.reset();
  }, 
  
  reset: function() {
    this.render(this.layout, this.widget);
  },
  
  materialize: function(selector, layout, parent) {
    var widget = LSD.Layout.build(selector, parent);
    if (!Element.type(widget)) {
      if (!String.type(layout)) this.render(layout, widget);
      else widget.setContent(layout)
    }
    return widget;
  },
  
  render: function(layout, parent) {
    var widgets = [];
    switch (typeOf(layout)) {
      case "string": 
        widgets.push(this.materialize(layout, {}, parent));
        break;
      case "array": case "elements":
        layout.each(function(widget) {
          widgets.push.apply(widgets, this.render(widget, parent))
        }, this)
        break;
      case "element":
        widgets.push(this.materialize(layout, LSD.Layout.getFromElement(layout), parent));
        break;
      case "object":
        for (var selector in layout) widgets.push(this.materialize(selector, layout[selector], parent));
        break;
    }
    return widgets;
  }
});

(function(cache) {
  LSD.Layout.findTraitByAttributeName = function(name) {
    if (typeof cache[name] == 'undefined') {
      switch (name) {
        case 'tabindex':
          name = 'Focus';
          break;
        case 'at':
          name = 'Position';
          break;
      };
      var base = LSD.Trait;
      for (var bits = name.split('-'), bit, i = 0; (bit = bits[i++]) && (base = base[bit.capitalize()]););
      var klass = cache[name] = base || null;
      if (klass && klass.Stateful) cache[name] = klass.Stateful;
    }
    return cache[name];
  }
})(LSD.Layout.traitByAttribute = {});

LSD.Layout.getFromElement = function(element) {
  var children = element.getChildren();
  if (children.length) return children;
  var text = element.get('text');
  if (text.length) return text;
}

LSD.Layout.Plain = new FastArray('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'span', 'table', 'thead', 'tfoot', 'tbody', 'tr', 'td', 'colgroup')

LSD.Layout.isConvertable = function(element) {
  return Element.type(element) && !LSD.Layout.Plain[element.get('tag')];
}

LSD.Layout.convert = function(element) {
  var options = {
    attributes: {},
    origin: element
  };
  var tag = element.get('tag');
  if (tag != 'div') options.source = tag;
  if (element.id) options.id = element.id;
  for (var i = 0, attribute; attribute = element.attributes[i++];) {
    options.attributes[attribute.name] = ((attribute.value != attribute.name) && attribute.value) || true;
  }
  if (options.attributes && options.attributes.inherit) {
    options.inherit = options.attributes.inherit;
    delete options.attributes.inherit;
  }
  var klass = options.attributes['class'];
  if (klass) {
    klass = klass.replace(/^lsd (?:tag-)?([a-zA-Z0-9-_]+)\s?/, function(m, tag) {
      options.source = tag;
      return '';
    })
    options.classes = klass.split(' ').filter(function(name) {
      var match = /^(is|id)-(.*?)$/.exec(name)
      if (match) {
        switch (match[1]) {
          case "is":
            if (!options.pseudos) options.pseudos = [];
            options.pseudos.push(match[2]);
            break;
          case "id":
            options.id = match[2];
        }
      }
      return !match;
    })
    delete options.attributes['class'];
  }
  return options;
}

LSD.Layout.replace = function(element) {
  var layout = new LSD.Layout(element, element.getChildren());
  if (element.parentNode) {
    layout.widget.inject(element.parentNode);
    if (layout.widget.element.previousSibling != element) $(layout.widget).inject(element, 'after');
    element.dispose();
  }
  return layout.widget;
}

LSD.Layout.parse = function(selector) {
  var parsed = Slick.parse(selector).expressions[0][0]
  var options = {}
  if (parsed.tag != '*') options.source = parsed.tag;
  if (parsed.id) options.id = parsed.id
  if (parsed.attributes) parsed.attributes.each(function(attribute) {
    if (!options.attributes) options.attributes = {};
    options.attributes[attribute.key] = attribute.value || true;
  });
  if (parsed.classes) options.classes = parsed.classes.map(Macro.map('value'));
  if (parsed.pseudos) options.pseudos = parsed.pseudos.map(Macro.map('key'));
  switch (parsed.combinator) {
    case '^':
      options.inherit = 'full';
      break;
    case '>':
      options.inherit = 'partial';
  }
  return options;
}

LSD.Layout.build = function(item, parent, element) {
  var options;
  if (Element.type(item)) {
    if (LSD.Layout.isConvertable(item)) {
      options = LSD.Layout.convert(item);
    } else {
      var result = item.inject(parent);
      if (result && parent.getContainer) $(item).inject(parent.getContainer());
      return result;
    }
  } else options = LSD.Layout.parse(item);
  var mixins = [];
  var tag = options.source || options.tag || 'container'
  if (options.attributes) {
    if ('type' in options.attributes) tag += "-" + options.attributes.type;
    if ('kind' in options.attributes) tag += "-" + options.attributes.kind;
    for (var name in options.attributes) {
      var value = options.attributes[name];
      var bits = name.split('-');
      for (var i = bits.length - 1; i > -1; i--) {
        var obj = {};
        obj[bits[i]] = value;
        if (i == 0) $mixin(options, obj);
        else value = obj;
      }
      var trait = LSD.Layout.findTraitByAttributeName(name);
      if (trait) mixins.push(trait);
    }
  }
  if (options.inherit) {
    var source = parent.options.source;
    if (!source) {
      var bits = [parent.options.tag, parent.getAttribute('type')]
      if (options.inherit == 'full') bits.push(parent.getAttribute('kind'))
      source = bits.filter(function(bit) { return bit }).join('-');
    }
    tag = source + '-' + tag
  }
  
  mixins.unshift(tag);
  
  options.source = tag;
  var widget = LSD.Widget.create(mixins, options);
  widget.build();
  
  if (element !== false && (element || parent)) widget.inject(element || parent, 'bottom', true)
  
  return widget;
};
/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD
- LSD.Layout

provides: [LSD.Module.Layout]
 
...
*/

LSD.Module.Layout = new Class({
  options: {
    layout: {}
  },
  
  initialize: function(options) {
    if (options && LSD.Layout.isConvertable(options)) options = LSD.Layout.convert(options);
    this.parent.apply(this, arguments);
    var origin = options && options.origin;
    var layout = Array.from(this.options.layout.children);
    if (origin && !options.source) {
      var children = origin.getChildren();
      if (!children.length) {
        var text = origin.get('html').trim();
        if (text.length) this.setContent(text)
      } else layout.push.apply(layout, Array.from(children));
    }
    if (layout.length) this.setLayout(layout);
    if (this.options.layout.self) this.applySelector(this.options.layout.self);
  },
  
  applySelector: function(selector) {
    var parsed = Slick.parse(selector).expressions[0][0];
    if (parsed.classes) {
      var klasses = parsed.classes.map(function(klass) { return klass.value })
      this.classes.push.apply(this.classes, klasses);
      klasses.each(this.addClass.bind(this));
    }
    var options = {};
    if (parsed.id) options.id = parsed.id;
    if (parsed.attributes) {
      if (parsed.attributes) parsed.attributes.each(function(attribute) {
        options[attribute.key] = attribute.value || true;
      });
    }  
    if (parsed.attributes || parsed.id) Object.append(this.options, options);
    this.fireEvent('selector', [parsed, selector]);
  },
  
  setLayout: function(layout) {
    this.layout = layout;
    this.tree = this.applyLayout(layout);
    this.fireEvent('layout', [this.tree, this.layout])
  },
  
  applyLayout: function(layout) {
    return new LSD.Layout(this, layout)
  },
  
  buildLayout: function(selector, layout, parent) {
    return LSD.Layout.build(selector, layout, (parent === null) ? null : (parent || this))
  },
  
  buildItem: function() {
    if (!this.options.layout.item) return this.parent.apply(this, arguments);
    return this.buildLayout(this.options.layout.item, null, this)
  }
});
/*
---
 
script: Action.js
 
description: Action is a class that adds some feature to widget by mixing up in runtime
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD
 
provides: 
  - LSD.Action
 
...
*/


LSD.Action = function(options, name) {
  var target, state;
  var self = {
    enable: function() {
      if (self.enabled) return false;
      if (state) target[state.enabler]();
      options.enable.apply(target, arguments);
      if (options.events) target.addEvents(target.events[options.events]);
      if (self.enabled == null) target.addEvents(events);
      self.enabled = true;
      return true;
    },

    disable: function() {
      if (!self.enabled) return false;
      if (state) target[state.disabler]();
      options.disable.apply(target, arguments);
      if (options.events) target.removeEvents(target.events[options.events]);
      if (self.enabled != null) target.removeEvents(events);
      self.enabled = false;
      return true;
    },

    use: function(widget, state) {
      var widgets = Array.from(arguments);
      var state = widgets.pop();
      self[state ? 'enable' : 'disable'].apply(self, widgets);
    },

    watch: function(widget, state) {
      if (!self[state ? 'enable' : 'disable'](widget)) //try enable the action
        options[state ? 'enable' : 'disable'].call(target, widget); //just fire the callback 
    },
    
    inject: function() {
      self.enable();
      if (state) self[state.disabler]();
    },

    attach: function(widget) {
      target = widget;
      state = widget.options.states && widget.options.states[name];
      if (state) {
        events[state.enabler] = options.enable.bind(target);
        events[state.disabler] = options.disabler.bind(target);
      }
      target.addEvents(events);
      if (options.uses) {
        target.use(options.uses, self.use);
      } else if (options.watches) {
        target.watch(options.watches, self.watch);
      } else if (!state || target[name]) target.onDOMInject(self.inject);
    },

    detach: function(widget) {
      target.removeEvents(events);
      if (options.watches) target.unwatch(options.watches, self.watch);
      if (self.enabled) self.disable();
      if (state) {
        self[state.disabler]();
        delete events[state.enabler], events[state.disabler];
      }
      target = state = null;
    }
  }
  var events = {
    enable:  self.enable,
    disable: self.disable,
    detach:  self.disable
  };  
  return self ;
}
/*
---
 
script: Observer.js
 
description: A wrapper around Observer to look for changes in input values
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Ext/Observer
 
provides: 
  - LSD.Trait.Observer
  - Class.Mutators.States
 
...
*/


LSD.Trait.Observer = new Class({
  
  options: {
    observer: {
      periodical: 200,
      delay: 50
    },
    events: {
      _observer: {
        self: {
          focus: function() {
            this.getObserver().resume()
          },
          blur: function() {
            this.getObserver().pause()
          }
        }
      }
    }
  },
  
  getObserver: Macro.getter('observer', function() {
    return new Observer(this.getObservedElement(), this.onChange.bind(this), this.options.observer)
  }),
  
  getObservedElement: Macro.defaults(function() {
    return this.element;
  }),
  
  onChange: function(value) {
    if (value.match(/^\s*$/)) {
      this.empty();
    } else {
      this.fill.apply(this, arguments);
    }
  }
});

LSD.Trait.Observer.State = Class.Stateful({
  'filled': ['fill', 'empty']
});
LSD.Trait.Observer.Stateful = [
  LSD.Trait.Observer.State,
  LSD.Trait.Observer
];
/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD

provides:
  - LSD.Module.DOM

...
*/


(function() {
  
var inserters = {

  before: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element);
  },

  after: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element.nextSibling);
  },

  bottom: function(context, element){
    return element.appendChild(context);
  },

  top: function(context, element){
    return element.insertBefore(context, element.firstChild);
  }

};


LSD.Module.DOM = new Class({
  initialize: function() {
    this.childNodes = [];
    this.nodeType = 1;
    this.parentNode = this.nextSibling = this.previousSibling = null;
    this.parent.apply(this, arguments);
    this.nodeName = this.options.tag//.toUpperCase(); //Make slick happy
    this.tagName = this.options.tag;
  },
  
  //getElementsByTagName: function(tagName) {
  //  var found = [];
  //  var all = tagName == "*";
  //  for (var i = 0, child; child = this.childNodes[i]; i++) {
  //    if (all || tagName == child.tagName) found.push(child);
  //    found.push.apply(found, child.getElementsByTagName(tagName))
  //  }
  //  return found;
  //},
  
  getElements: function(selector) {
    return Slick.search(this, selector)
  },
  
  getElement: function(selector) {
    return Slick.find(this, selector)
  },
  
  contains: function(element) {
    while (element = element.parentNode) if (element == this) return true;
    return false;
  },
  
  getChildren: function() {
    return this.childNodes;
  },

  getRoot: function() {
    var widget = this;
    while (widget.parentNode) widget = widget.parentNode;
    return widget;
  },
  
  getHierarchy: function() {
    var widgets = [this];
    var widget = this;
    while (widget.parentNode) {
      widget = widget.parentNode;
      widgets.unshift(widget)
    }
    return widgets;
  },
  
  setParent: function(widget){
    this.parent.apply(this, arguments);
    this.fireEvent('setParent', [widget, widget.document])
    var siblings = widget.childNodes;
    var length = siblings.length;
    if (length == 1) widget.firstChild = this;
    widget.lastChild = this;
    var previous = siblings[length - 2];
    if (previous) {
      previous.nextSibling = this;
      this.previousSibling = previous;
    }
    widget.dispatchEvent('nodeInserted', this)
  },
  
  /*
    
    %header
      %section#top
      %button
      %button
      %section Title
    
    var header = LSD.document.getElement('header');
    header.top     //=> section#top
    header.buttons //=> [button, button]
    header.section //=> section 
    
    When widget is appended as child the semantic to that widget
    is set. The name of the link is determined by these rules:
    
    - If widget has id, use id
    - Use tag name
      - If the link is not taken, write tag name link
      - If the link is taken, append widget to a pluralized array link
        - When pluralized link is added, original link is not removed
  */
  
  appendChild: function(widget, adoption) {
    if (!adoption && this.canAppendChild && !this.canAppendChild(widget)) return false;
    var options = widget.options, id = options.id, tag = options.tag, tags = tag + 's', kind = widget.attributes['kind']
    widget.identifier = id || tag;
    if (id) {
      if (this[id]) this[id].dispose();
      this[id] = widget;
    } else if (!this[tag]) this[tag] = widget;
    else if (!this[tags]) this[tags] = [widget];
    else if (typeof this[tags] == 'array') this[tags].push(widget);
    else if (!this['_' + tags]) this['_' + tags] = [widget];
    else this['_' + tags].push(widget);
        
    this.childNodes.push(widget);
    if (this.nodeType != 9) widget.setParent(this);
    (adoption || function() {
      this.toElement().appendChild(document.id(widget));
    }).apply(this, arguments);
    
    this.fireEvent('adopt', [widget, id])
    widget.walk(function(node) {
      this.dispatchEvent('nodeInserted', node);
    }.bind(this));
    return true;
  },
  
  insertBefore: function(insertion, element) {
    return this.appendChild(insertion, function() {
      document.id(insertion).inject(document.id(element), 'before')
    });
  },
  
  grab: function(el, where){
    inserters[where || 'bottom'](document.id(el, true), this);
    return this;
  },
  
  setDocument: function(widget) {
    var element = document.id(widget);
    var doc;
    var isDocument = (widget.nodeType == 9);
    var isBody = element.get('tag') == 'body';
    if (isDocument || isBody || element.offsetParent) {
      if (!isDocument) {
        var body = (isBody ? element : element.ownerDocument.body);
        doc = body.retrieve('widget') || new LSD.Document(body);
      } else doc = widget;
      var halted = [];
      //this.render();
      this.walk(function(child) {
        //if (child.halted) halted.push(child);
        child.ownerDocument = child.document = doc;
        child.fireEvent('dominject', element);
        child.dominjected = true;
      });
      //halted.each(function(child) {
      //  child.refresh();
      //})
    }
  },
  
  inject: function(widget, where, quiet) {
    var isElement = 'localName' in widget;
    if (isElement) {
      var instance = widget.retrieve('widget');
      if (instance) {
        widget = instance;
        isElement = false;
      }
    }
    var self = isElement ? this.toElement() : this;
    if (!inserters[where || 'bottom'](self, widget) && !quiet) return false;
    this.fireEvent('inject', arguments);
    if (quiet !== true) this.setDocument(widget);
    return true;
  },
  
  dispose: function() {
    var parent = this.parentNode;
    if (parent) {
      parent.childNodes.erase(this);
      if (parent.firstChild == this) delete parent.firstChild;
      if (parent.lastChild == this) delete parent.lastChild;
    }
    return this.parent.apply(this, arguments);
  },
  
  dispatchEvent: function(type, args){
    args = Array.from(args);
    var node = this;
    type = type.replace(/^on([A-Z])/, function(match, letter) {
      return letter.toLowerCase();
    });
    while (node) {
      var events = node.$events;
      if (events && events[type]) events[type].each(function(fn){
        return fn.apply(node, args);
      }, node);
      node = node.parentNode;
    }
    return this;
  },
  
  walk: function(callback) {
    callback(this);
    this.childNodes.each(function(child) {
      child.walk(callback)
    });
  },
  
  collect: function(callback) {
    var result = [];
    this.walk(function(child) {
      if (!callback || callback(child)) result.push(child);
    });
    return result;
  },
  
  compareDocumentPosition: function(node) {
    var context =  (Element.type(node)) ? this.toElement() : this;
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	}
});

})();
/*
---
 
script: Document.js
 
description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Node
  - LSD.Module.DOM
 
provides:
  - LSD.Document
 
...
*/


/*
  Document is a big disguise proxy class that contains the tree
  of widgets and a link to document element.
  
  It is DOM-compatible (to some degree), so tools that crawl DOM
  tree (we use Slick) can work with the widget tree like it usually
  does with the real DOM so we get selector engine for free.
  
  The class contains a few hacks that allows Slick to initialize.
*/

LSD.Document = new Class({

  Includes: [
    LSD.Node,
    LSD.Module.DOM
  ],
  
  States: {
    built: ['build', 'destroy', false]
  },
  
  options: {
    tag: '#document',
    selector: ':not(.lsd)', //convert unconvered elements
    root: false // topmost widget's parentNode is the document if set to true
  },
  
  initialize: function(options) {
    if (!LSD.document.body) LSD.document = Object.append(this, LSD.document);
    this.parent.apply(this, Element.type(options) ? [options] : [options.origin, options]);
    this.body = this.element.store('widget', this);
    this.document = this.documentElement = this;
    
    this.xml = true;
    this.navigator = {};
    this.attributes = {};
    
    this.childNodes = [];
    this.nodeType = 9;
    this.events = this.options.events;
  },
  
  build: Macro.onion(function() {
    this.element.getChildren(this.options.selector).each(LSD.Layout.replace);
    if (this.stylesheets) this.stylesheets.each(this.addStylesheet.bind(this))
  }),

	attach: $lambda(true),
	detach: $lambda(true),
  
  /*
    Slick.Finder tries to probe document it was given to determine
    capabilities of the engine and possible quirks that will alter
    the desired results. 
    
    We try to emulate XML-tree (simple built-in querying capabilities),
    so all of the traversing work happens inside of Slick except 
    getElementsByTagName which is provided by LSD.Module.DOM.
    
    So the problem is that Slick creates element and tries to 
    append it to the document which is unacceptable (because every node
    in LSD.Document means widget instance, and we dont want that for 
    dummy elements). The solution is to ignore those elements.
  */
  createElement: function(tag) {
    return {
      innerText: '',
      mock: true
    }
  },
  
  appendChild: function(widget) {
    if (widget.mock) return false;
    if (this.options.root) widget.parentNode = this; 
    return this.parent.apply(this, arguments);
  },
  
  removeChild: function(widget) {
    if (widget.mock) return false;
    return this.parent.apply(this, arguments);
  },
  
  getAttribute: function(name) {
    return this.attributes[name]
  },
  
  setAttribute: function(name, value) {
    return this.attributes[name] = value;
  },
  
  id: function(item) {
    if (item.render) return item;
  },
  
  addStylesheet: function(sheet) {
    if (!this.stylesheets) this.stylesheets = [];
    this.stylesheets.include(sheet);
    sheet.attach(this);
  },
  
  removeStylesheet: function(sheet) {
    if (!this.stylesheets) return;
    this.stylesheets.erase(sheet);
    sheet.detach(this);
  }
});

// Properties set here will be picked up by first document
LSD.document = {}; 

// Queue up stylesheets before document is loaded
LSD.Document.addStylesheet = function(sheet) {
  var instance = LSD.document, stylesheets = instance.stylesheets
  if (instance.addStylesheet) return instance.addStylesheet(sheet)
  if (!stylesheets) stylesheets = instance.stylesheets = [];
  instance.stylesheets.push(sheet);
}
/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle

requires:
  - Core/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.3.0.1dev',
	'build': '%build%'
};

/*
---

script: Class.Binds.js

name: Class.Binds

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Class
  - /MooTools.More

provides: [Class.Binds]

...
*/

Class.Mutators.Binds = function(binds){
    return binds;
};

Class.Mutators.initialize = function(initialize){
	return function(){
		Array.from(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};


/*
---

script: Class.Binds.js

description: Removes mutators added by Class.Binds that breaks multiple inheritance

license: MIT-style license

authors:
  - Aaron Newton

extends: More/Class.Binds
...
*/

//empty

delete Class.Mutators.Binds;
delete Class.Mutators.initialize;
/*
---
name : sg-regex-tools
description : A few super-handy tools for messing around with RegExp

authors   : Thomas Aylott
copyright : © 2010 Thomas Aylott
license   : MIT

provides : [combineRegExp]
...
*/
;(function(exports){

exports.combineRegExp = function(regex, group){
	if (regex.source) regex = [regex]
	
	var names = [], i, source = '', this_source
	
	for (i = 0; i < regex.length; ++i){ if (!regex[i]) continue
		this_source = regex[i].source || ''+regex[i]
		if (this_source == '|') source += '|'
		else {
			source += (group?'(':'') + this_source.replace(/\s/g,'') + (group?')':'')
			if (group) names.push(group)
		}
		if (regex[i].names)	names = names.concat(regex[i].names)
	}
	try {
		regex = new RegExp(source,'gm')
	}
	catch (e){
		throw new SyntaxError('Invalid Syntax: ' + source +'; '+ e)
	}
	// [key] → 1
	for (i = -1; i < names.length; ++i) names[names[i]] = i + 1
	// [1] → key
	regex.names = names
	return regex
}

}(typeof exports != 'undefined' ? exports : this))

/*
---
name    : SheetParser.CSS

authors   : Thomas Aylott
copyright : © 2010 Thomas Aylott
license   : MIT

provides : SheetParser.CSS
requires : combineRegExp
...
*/
;(function(exports){
	

/*<depend>*/
var UNDEF = {undefined:1}
if (!exports.SheetParser) exports.SheetParser = {}

/*<CommonJS>*/
var combineRegExp = UNDEF[typeof require]
	?	exports.combineRegExp
	:	require('./sg-regex-tools').combineRegExp
var SheetParser = exports.SheetParser
/*</CommonJS>*/

/*<debug>*/;if (UNDEF[typeof combineRegExp]) throw new Error('Missing required function: "combineRegExp"');/*</debug>*/
/*</depend>*/


var CSS = SheetParser.CSS = {version: '1.0.2 dev'}

CSS.trim = trim
function trim(str){
	// http://blog.stevenlevithan.com/archives/faster-trim-javascript
	var	str = (''+str).replace(/^\s\s*/, ''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
}

CSS.camelCase = function(string){
	return ('' + string).replace(camelCaseSearch, camelCaseReplace)
}
var camelCaseSearch = /-\D/g
function camelCaseReplace(match){
	return match.charAt(1).toUpperCase()
}

CSS.parse = function(cssText){
	var	found
	,	rule
	,	rules = {length:0}
	,	keyIndex = -1
	,	regex = this.parser
	,	names = CSS.parser.names
	,	i,r,l
	,	ruleCount
	
	rules.cssText = cssText = trim(cssText)
	
	// strip comments
	cssText = cssText.replace(CSS.comment, '');
	
	regex.lastIndex = 0
	while ((found = regex.exec(cssText))){
		// avoid an infinite loop on zero-length keys
		if (regex.lastIndex == found.index) ++ regex.lastIndex
		
		// key:value
		if (found[names._key]){
			rules[rules.length ++] = found[names._key]
			rules[found[names._key]] = found[names._value]
			rules[CSS.camelCase(found[names._key])] = found[names._value]
			continue
		}
		
		rules[rules.length++] = rule = {}
		for (i = 0, l = names.length; i < l; ++i){
			if (!(names[i-1] && found[i])) continue
			rule[names[i-1]] = trim(found[i])
		}
	}
	
	var atKey, atRule, atList, atI
	for (i = 0, l = rules.length; i < l; ++i){
		if (!rules[i]) continue
		
		if (rules[i]._style_cssText){
			rules[i].style = CSS.parse(rules[i]._style_cssText)
			delete rules[i]._style_cssText
		}
		
		// _atKey/_atValue
		if (atKey = rules[i]._atKey){
			atKey = CSS.camelCase(atKey)
			atRule = {length:0}
			rules[i][atKey] = atRule
			atRule["_source"] =
			atRule[atKey + "Text"] = rules[i]._atValue
			atList = ('' + rules[i]._atValue).split(/,\s*/)
			for (atI = 0; atI < atList.length; ++atI){
				atRule[atRule.length ++] = atList[atI]
			}
			rules[i].length = 1
			rules[i][0] = atKey
			delete rules[i]._atKey
			delete rules[i]._atValue
		}
		
		if (rules[i].style)
		for (ruleCount = -1, r = -1, rule; rule = rules[i].style[++r];){
			if (typeof rule == 'string') continue
			rules[i][r] = (rules[i].cssRules || (rules[i].cssRules = {}))[++ ruleCount]  = rule
			rules[i].cssRules.length = ruleCount + 1
			rules[i].rules = rules[i].cssRules
		}
	}
	
	return rules
}

var x = combineRegExp
var OR = '|'

;(CSS.at = x(/\s*@([-a-zA-Z0-9]+)\s+(([\w-]+)?[^;{]*)/))
.names=[         '_atKey',           '_atValue', 'name']

CSS.atRule = x([CSS.at, ';'])

;(CSS.keyValue_key = x(/([-a-zA-Z0-9]+)/))
.names=[                '_key']

;(CSS.keyValue_value_end = x(/(?:;|(?=\})|$)/))

;(CSS.notString = x(/[^"']+/))
;(CSS.stringSingle = x(/"(?:[^"]|\\")*"/))
;(CSS.stringDouble = x(/'(?:[^']|\\')*'/))
;(CSS.string = x(['(?:',CSS.stringSingle ,OR, CSS.stringDouble,')']))
;(CSS.propertyValue = x([/[^;}]+/, CSS.keyValue_value_end]))

var rRound = "(?:[^()]|\\((?:[^()]|\\((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*\\))*\\))"

;(CSS.keyValue_value = x(
[
	x(['((?:'
	,	CSS.stringSingle
	,	OR
	,	CSS.stringDouble
	,	OR
	,	"\\("+rRound+"*\\)"
	,	OR
	,	/[^;}()]/ // not a keyValue_value terminator
	,	')*)'
	])
,	CSS.keyValue_value_end
])).names = ['_value']

;(CSS.keyValue = x([CSS.keyValue_key ,/\s*:\s*/, CSS.keyValue_value]))

;(CSS.comment = x(/\/\*\s*((?:[^*]|\*(?!\/))*)\s*\*\//))
.names=[                   'comment']

;(CSS.selector = x(['(',/\s*(\d+%)\s*/,OR,'(?:',/[^{}'"()]|\([^)]*\)|\[[^\]]*\]/,')+',')']))
.names=[    'selectorText','keyText']

var rCurly = "(?:[^{}]|\\{(?:[^{}]|\\{(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*\\})*\\})"
var rCurlyRound = "(?:[^{}()]+|\\{(?:[^{}()]+|\\{(?:[^{}()]+|\\{(?:[^{}()]+|\\{[^{}()]*\\})*\\})*\\})*\\})"

;(CSS.block = x("\\{\\s*((?:"+"\\("+rRound+"*\\)|"+rCurly+")*)\\s*\\}"))
.names=[              '_style_cssText']

CSS.selectorBlock = x([CSS.selector, CSS.block])

CSS.atBlock = x([CSS.at, CSS.block])

CSS.parser = x
(
	[	x(CSS.comment)
	,	OR
	,	x(CSS.atBlock)
	,	OR
	,	x(CSS.atRule)
	,	OR
	,	x(CSS.selectorBlock)
	,	OR
	,	x(CSS.keyValue)
	]
,	'cssText'
);


})(typeof exports != 'undefined' ? exports : this);

/*
---
name    : SheetParser.Value

authors   : Yaroslaff Fedin

license   : MIT

requires : SheetParser.CSS

provides : SheetParser.Value
...
*/


(function(exports) {
  /*<CommonJS>*/
  var combineRegExp = (typeof require == 'undefined')
    ?  exports.combineRegExp
    :  require('./sg-regex-tools').combineRegExp
  var SheetParser = exports.SheetParser
  /*</CommonJS>*/
  
  var Value = SheetParser.Value = {version: '1.0.2 dev'};
  
  Value.translate = function(value) {
    var found, result = [], matched = [], scope = result, func, text;
    var regex = Value.tokenize;
    var names = regex.names;
    while (found = regex.exec(value)) matched.push(found);
    for (var i = 0; found = matched[i++];) {
      if (func = found[names['function']]) {
        var obj = {};
        var translated = obj[found[names['function']]] = Value.translate(found[names._arguments]);
        for (var j = 0, bit; bit = translated[j]; j++) if (bit && bit.length == 1) translated[j] = bit[0];
        scope.push(obj);
      } else if (found[names.comma]) {
        if (!result[0].push) result = [result];
        result.push(scope = []);
      } else if (found[names.whitespace]) {
        var length = scope.length;
        if (length && (scope == result) && !scope[length - 1].push) scope = scope[length - 1] = [scope[length - 1]];
        
      } else if (text = (found[names.dstring] || found[names.sstring])) {
        scope.push(text)
      } else if (text = found[names.token]) {
        if (!text.match(Value.hex)) {
          var match = Value.length.exec(text);
          Value.length.lastIndex = 0;
          if (match) {
            var number = parseFloat(match[1]);
            text = match[2] ? {number: number, unit: match[2]} : number;
          } else if (!text.match(Value.keyword)) return false;
        }
        scope.push(text);
      }
    }
    return result.length == 1 ? result[0] : result;
  }
  
  var x = combineRegExp
  var OR = '|'
  var rRound = "(?:[^()]|\\((?:[^()]|\\((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*\\))*\\))";

  ;(Value.stringDouble = x(/"((?:[^"]|\\")*)"/)).names = ['dstring']
  ;(Value.stringSingle = x(/'((?:[^']|\\')*)'/)).names = ['sstring']
  ;(Value.string = x([Value.stringSingle, OR, Value.stringDouble]))
  ;(Value.keyword = x(/[-a-zA-Z0-9]+/, "keyword"))
  ;(Value.token = x(/[^$,\s\/)]+/, "token"))
  
  ;(Value['function'] = x("([-a-zA-Z0-9]+)\\((" + rRound + "*)\\)"))
  .names = [               'function',       '_arguments']
  
  ;(Value.integer = x(/-?\d+/))
  ;(Value.float = x(/-?\d+\.\d*/))
  ;(Value.number = x(['(', Value.float,  OR, Value.integer, ')']))
  .names = [           'number']

  ;(Value.unit = x(/em|px|pt|%|fr/, 'unit'))
  ;(Value.length = x(['^', Value.number, Value.unit, "?$"]))
  ;(Value.direction = x(/top|left|bottom|right|center/, 'direction'))
  ;(Value.position = x([Value.length, OR, Value.direction]))

  ;(Value.hex = x(/#[0-9a-z]+/, 'hex'))

  ;(Value.comma = x(/\s*,\s*/, 'comma'))
  ;(Value.whitespace = x(/\s+/, 'whitespace'))
  ;(Value.slash = x(/\//, 'slash'))


  Value.tokenize = x
  (
    [ x(Value['function']),
    , OR
    , x(Value.comma)
    , OR
    , x(Value.whitespace)
    , OR
    , x(Value.slash)
    , OR
    , x(Value.string)
    , OR
    , x(Value.token)
    ]
  )
  
})(typeof exports != 'undefined' ? exports : this);
/*
---
name    : Sheet

authors   : Thomas Aylott
copyright : © 2010 Thomas Aylott
license   : MIT

provides : Sheet
requires : SheetParser.CSS
...
*/
;(function(exports){


/*<depend>*/
var UNDEF = {undefined:1}

/*<CommonJS>*/
var SheetParser = UNDEF[typeof require]
	?	exports.SheetParser
	:	require('./SheetParser.CSS').SheetParser

exports.Sheet = Sheet
/*</CommonJS>*/

/*<debug>*/;if (!(!UNDEF[typeof SheetParser] && SheetParser.CSS)) throw new Error('Missing required function: "SheetParser.CSS"');/*</debug>*/
/*</depend>*/


Sheet.version = '1.0.2 dev'

function Sheet(cssText){
	if (this instanceof Sheet) this.initialize(cssText)
	else return Sheet.from(cssText)
}

Sheet.from = function(cssText){
	return new Sheet(cssText)
}

Sheet.prototype = {
	
	parser: SheetParser.CSS,
	
	initialize: function(cssText){
		this.cssText = cssText || ''
		this.style = this.rules = this.cssRules = this.parser.parse(this.cssText)
		var self = this
	},
	
	update: function(){
		var cssText = '',
			i = -1,
			rule,
			rules = this.style || this.rules || this.cssRules
		
		while ((rule = rules[++i])){
			if (typeof rule == 'object'){
				// cssRule
				if (this.update) rule.cssText = this.update.call(rule)
				cssText += rule.cssText = rule.selectorText + '{' + rule.cssText + '}'
			} else {
				// style key/value
				cssText += rule + ':'
				cssText += rules[rule] + ';'
			}
		}
		
		if (rules.selectorText)
			return rules.cssText = rules.selectorText + '{' + cssText + '}'
		return rules.cssText = cssText
	}
	
}

Sheet.prototype.toString = Sheet.prototype.update


}(typeof exports != 'undefined' ? exports : this));

/*
---
name    : SheetParser.Property

authors   : Yaroslaff Fedin

license   : MIT

requires : SheetParser.CSS

provides : SheetParser.Property
...
*/


(function(exports) {
  /*<CommonJS>*/
  var combineRegExp = (typeof require == 'undefined')
    ?  exports.combineRegExp
    :  require('./sg-regex-tools').combineRegExp
  var SheetParser = exports.SheetParser
  /*</CommonJS>*/
  
  var Property = SheetParser.Property = {version: '0.2 dev'};
  
  /*
    Finds optional groups in expressions and builds keyword
    indecies for them. Keyword index is an object that has
    keywords as keys and values as property names.
    
    Index only holds keywords that can be uniquely identified
    as one of the properties in group.
  */
  
  Property.index = function(properties, context) {
    var index = {};
    for (var i = 0, property; property = properties[i]; i++) {
      if (property.push) {
        var group = index[i] = {};
        for (var j = 0, prop; prop = property[j]; j++) {
          var keys = context[prop].keywords;
          if (keys) for (var key in keys) {
            if (group[key] == null) group[key] = prop;
            else group[key] = false;
          }
        }
        for (var keyword in group) if (!group[keyword]) delete group[keyword];
      }
    }
    return index;
  };
  
  /*
    Simple value 
  */

  Property.simple = function(types, keywords) {
    return function(value) {
      if (keywords && keywords[value]) return true;
      if (types) for (var i = 0, type; type = types[i++];) if (Type[type](value)) return true;
      return false;
    }
  };
  
  /*
    Links list of inambigous arguments with corresponding properties keeping
    the order.
  */
  
  Property.shorthand = function(properties, keywords, context) {
    var index, r = 0;
    for (var i = 0, property; property = properties[i++];) if (!property.push) r++;
    return function() {
      var result = [], used = {}, start = 0, group, k = 0, l = arguments.length;
      for (var i = 0, argument; argument = arguments[i]; i++) {
        var property = properties[k];
        if (!property) return false;
        if ((group = (property.push && property))) property = properties[k + 1];
        if (property) {
          if (context[property](argument)) k++
          else property = false
        }
        if (group) {
          if (!property) {
            if (!index) index = Property.index(properties, context)
            if (property = index[k][argument])
              if (used[property]) return false;
              else used[property] = 1;
          }
          if ((property && !used[property]) || (i == l - 1)) {
            if (i - start > group.length) return false;
            for (var j = start; j < (i + +!property); j++) 
              if (!result[j])
                for (var m = 0, optional; optional = group[m++];) {
                  if (!used[optional] && context[optional](arguments[j])) {
                    result[j] = optional;
                    used[optional] = true
                    break;
                  }
                }
            start = i;
            k++;
          }
        }
        if (result[i] == null) result[i] = property;
      }
      if (i < r) return false
      for (var i = 0, j = arguments.length, object = {}; i < j; i++) {
        var value = result[i];
        if (!value) return false;
        object[value] = arguments[i];
      }
      return object;
    };
  }

  /*
    A shorthand that operates on collection of properties. When given values
    are not enough (less than properties in collection), the value sequence
    is repeated until all properties are filled.     
  */

  Property.collection = function(properties, keywords, context) {
    var first = context[properties[0]];
    if (first.type != 'simple') 
      return function(arg) {
        var args = (!arg || !arg.push) ? [Array.prototype.slice.call(arguments)] : arguments;
        var length = args.length;
        var result = {};
        for (var i = 0, property; property = properties[i]; i++) {
          var values = context[property].apply(1, args[i] || args[i % 2] || args[0]);
          if (!values) return false;
          for (var prop in values) result[prop] = values[prop];
        }
        return result;
      }
    else
      return function() {
        var length = arguments.length;
        var result = {};
        for (var i = 0, property; property = properties[i]; i++) {
          var values = arguments[i] || arguments[i % 2] || arguments[0];
          if (!context[property].call(1, values)) return false;
          result[property] = values;
        }
        return result;
      }
  };
  
  /* 
    Multiple value property accepts arrays as arguments
    as well as regular stuff
  */
  
  Property.multiple = function(arg) {
    //if (arg.push)
  }
  
  Property.compile = function(definition, context) {
    var properties, keywords, types;
    for (var i = 0, bit; bit = definition[i++];) {
      if (bit.push) properties = bit;
      else if (bit.indexOf) {
        if (!Type[bit]) {
          if (!keywords) keywords = {};
          keywords[bit] = 1;
        } else types ? types.push(bit) : (types = [bit]);
      } else options = bit;
    }
    var type = properties ? (keywords && keywords.collection ? "collection" : "shorthand") : 'simple'
    var property = Property[type](properties || types, keywords, context);
    if (keywords) property.keywords = keywords;
    if (properties) {
      var props = [];
      for (var i = 0, prop; prop = properties[i++];) prop.push ? props.push.apply(props, prop) : props.push(prop);
      property.properties = props;
    }
    property.type = type;
    return property;
  };
  
  
  var Type = Property.Type = {
    length: function(obj) {
      return typeof obj == 'number' || (!obj.indexOf && ('number' in obj) && obj.unit && (obj.unit != '%'))
    },
  
    color: function(obj) {
      return obj.indexOf ? obj.match(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/) : (obj.isColor || obj.rgba || obj.rgb || obj.hsb)
    },
    
    number: function(obj) {
      return typeof obj == 'number'
    },
    
    integer: function(obj) {
      return obj % 1 == 0 && ((0 + obj).toString() == obj)
    },
  
    keyword: function(keywords) {
      var storage;
      for (var i = 0, keyword; keyword = keywords[i++];) storage[keyword] = 1;
      return function(keyword) {
        return !!storage[keyword]
      }
    },
    
    strings: function(obj) {
      return !!obj.indexOf
    },
    
    url: function(obj) {
      return !obj.indexOf && ("url" in obj);
    },
    
    position: function(obj) {        
      var positions = Type.position.positions;
      if (!positions) positions = Type.position.positions = {left: 1, top: 1, bottom: 1, right: 1, center: 1}
      return positions[obj]
    },
    
    percentage: function(obj) {
      return obj.unit == '%'
    }
  };
  
})(typeof exports != 'undefined' ? exports : this);
/*
---
name    : SheetParser.Styles

authors   : Yaroslaff Fedin

license   : MIT

requires : SheetParser.Property

provides : SheetParser.Styles
...
*/

(function() {
   
var SheetParser = (typeof exports == 'undefined') ? window.SheetParser : exports.SheetParser;
var CSS = SheetParser.Properties = {
  background:           [[['backgroundColor', 'backgroundImage', 'backgroundRepeat', 
                          'backgroundAttachment', 'backgroundPositionX', 'backgroundPositionY']], 'multiple'],
  backgroundColor:      ['color', 'transparent', 'inherit'],
  backgroundImage:      ['url', 'none', 'inherit'],
  backgroundRepeat:     ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'inherit', 'space', 'round'],
  backgroundAttachment: ['fixed', 'scroll', 'inherit', 'local', 'fixed'],
  backgroundPosition:   [['backgroundPositionX', 'backgroundPositionY']],
  backgroundPositionX:  ['percentage', 'center', 'left', 'right', 'length', 'inherit'],
  backgroundPositionY:  ['percentage', 'center', 'top', 'bottom', 'length', 'inherit'],
   
  textShadow:           [['textShadowBlur', 'textShadowOffsetX', 'textShadowOffsetY', 'textShadowColor'], 'multiple'],
  textShadowBlur:       ['length'],
  textShadowOffsetX:    ['length'],
  textShadowOffsetY:    ['length'],
  textShadowColor:      ['color'],
                        
  boxShadow:            [['boxShadowBlur', 'boxShadowOffsetX', 'boxShadowOffsetY', 'boxShadowColor'], 'multiple'],
  boxShadowBlur:        ['length'],
  boxShadowOffsetX:     ['length'],
  boxShadowOffsetY:     ['length'],
  boxShadowColor:       ['color'], 
  
  outline:              ['outlineWidth', 'outlineStyle', 'outlineColor'],
  outlineWidth:         ['length'],
  outlineStyle:         ['dotted', 'dashed', 'solid', 'double', 'groove', 'reidge', 'inset', 'outset'],
  outlineColor:         ['color'],
                        
  font:                 [[
                          ['fontStyle', 'fontVariant', 'fontWeight'], 
                          'fontSize', 
                          ['lineHeight'], 
                          'fontFamily'
                        ]],
  fontStyle:            ['normal', 'italic', 'oblique', 'inherit'],
  fontVariant:          ['normal', 'small-caps', 'inherit'],
  fontWeight:           ['normal', 'number', 'bold', 'inherit'],
  fontFamily:           ['strings', 'inherit'],
  fontSize:             ['length', 'percentage', 'inherit', 
                         'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'],
                        
  color:                ['color'],
  letterSpacing:        ['normal', 'length', 'inherit'],
  textDecoration:       ['none', 'capitalize', 'uppercase', 'lowercase'],
  textAlign:            ['left', 'right', 'center', 'justify'],
  textIdent:            ['length', 'percentage'],                 
  lineHeight:           ['normal', 'length', 'number', 'percentage'],
  
  height:               ['length', 'auto'],
  maxHeight:            ['length', 'auto'],
  minHeight:            ['length', 'auto'],
  width:                ['length', 'auto'],
  maxWidth:             ['length', 'auto'],
  minWidth:             ['length', 'auto'],
                        
  display:              ['inline', 'block', 'list-item', 'run-in', 'inline-block', 'table', 'inline-table', 'none', 
                         'table-row-group', 'table-header-group', 'table-footer-group', 'table-row', 
                         'table-column-group', 'table-column', 'table-cell', 'table-caption'],
  visibility:           ['visible', 'hidden'],
  float:                ['none', 'left', 'right'],
  clear:                ['none', 'left', 'right', 'both', 'inherit'],
  overflow:             ['visible', 'hidden', 'scroll', 'auto'],
  position:             ['static', 'relative', 'absolute', 'fixed'],
  top:                  ['length', 'auto'],
  left:                 ['length', 'auto'],
  right:                ['length', 'auto'],
  bottom:               ['length', 'auto'],
  zIndex:               ['integer'],
  cursor:               ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize', 
                         'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help'],
};

var expanded = ['borderWidth', 'borderColor', 'borderStyle', 'padding', 'margin', 'border'];
for (var side, sides = ['Top', 'Right', 'Bottom', 'Left'], i = 0; side = sides[i++];) {
  CSS['border' + side]           = [['border' + side + 'Width', 'border' + side + 'Style', 'border' + side + 'Color']];
  
  CSS['border' + side + 'Width'] = ['length', 'thin', 'thick', 'medium'];
  CSS['border' + side + 'Style'] = ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'inherit', 'none'];
  CSS['border' + side + 'Color'] = ['color'];
  
  CSS['margin' + side]           = ['length', 'percentage', 'auto'];
  CSS['padding' + side]          = ['length', 'percentage', 'auto'];

  for (var j = 0, prop; prop = expanded[j++];) {
    if (!CSS[prop]) CSS[prop] = [[]];
    CSS[prop][0].push(prop.replace(/^([a-z]*)/, '$1' + side));
    if (i == 4) CSS[prop].push('collection')
  }

  if (i % 2 == 0) 
    for (var j = 1, adj; adj = sides[j+=2];) 
      CSS['borderRadius' + side + adj] = ['length', 'none'];
};

var Styles = SheetParser.Styles = {}
for (var property in CSS) Styles[property] = SheetParser.Property.compile(CSS[property], Styles);

})();
/*
---
name: Slick.Parser
description: Standalone CSS3 Selector parser
provides: Slick.Parser
...
*/

(function(){

var parsed,
	separatorIndex,
	combinatorIndex,
	reversed,
	cache = {},
	reverseCache = {},
	reUnescape = /\\/g;

var parse = function(expression, isReversed){
	if (expression == null) return null;
	if (expression.Slick === true) return expression;
	expression = ('' + expression).replace(/^\s+|\s+$/g, '');
	reversed = !!isReversed;
	var currentCache = (reversed) ? reverseCache : cache;
	if (currentCache[expression]) return currentCache[expression];
	parsed = {Slick: true, expressions: [], raw: expression, reverse: function(){
		return parse(this.raw, true);
	}};
	separatorIndex = -1;
	while (expression != (expression = expression.replace(regexp, parser)));
	parsed.length = parsed.expressions.length;
	return currentCache[expression] = (reversed) ? reverse(parsed) : parsed;
};

var reverseCombinator = function(combinator){
	if (combinator === '!') return ' ';
	else if (combinator === ' ') return '!';
	else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
	else return '!' + combinator;
};

var reverse = function(expression){
	var expressions = expression.expressions;
	for (var i = 0; i < expressions.length; i++){
		var exp = expressions[i];
		var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};

		for (var j = 0; j < exp.length; j++){
			var cexp = exp[j];
			if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
			cexp.combinator = cexp.reverseCombinator;
			delete cexp.reverseCombinator;
		}

		exp.reverse().push(last);
	}
	return expression;
};

var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&");
};

var regexp = new RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
	"(?x)^(?:\
	  \\s* ( , ) \\s*               # Separator          \n\
	| \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
	|      ( \\s+ )                 # CombinatorChildren \n\
	|      ( <unicode>+ | \\* )     # Tag                \n\
	| \\#  ( <unicode>+       )     # ID                 \n\
	| \\.  ( <unicode>+       )     # ClassName          \n\
	|                               # Attribute          \n\
	\\[  \
		\\s* (<unicode1>+)  (?:  \
			\\s* ([*^$!~|]?=)  (?:  \
				\\s* (?:\
					([\"']?)(.*?)\\9 \
				)\
			)  \
		)?  \\s*  \
	\\](?!\\]) \n\
	|   :+ ( <unicode>+ )(?:\
	\\( (?:\
		(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
	) \\)\
	)?\
	)"
*/
	"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|:+(<unicode>+)(?:\\((?:(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
	.replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
	.replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
);

function parser(
	rawMatch,

	separator,
	combinator,
	combinatorChildren,

	tagName,
	id,
	className,

	attributeKey,
	attributeOperator,
	attributeQuote,
	attributeValue,

	pseudoClass,
	pseudoQuote,
	pseudoClassQuotedValue,
	pseudoClassValue
){
	if (separator || separatorIndex === -1){
		parsed.expressions[++separatorIndex] = [];
		combinatorIndex = -1;
		if (separator) return '';
	}

	if (combinator || combinatorChildren || combinatorIndex === -1){
		combinator = combinator || ' ';
		var currentSeparator = parsed.expressions[separatorIndex];
		if (reversed && currentSeparator[combinatorIndex])
			currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
		currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*'};
	}

	var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

	if (tagName){
		currentParsed.tag = tagName.replace(reUnescape, '');

	} else if (id){
		currentParsed.id = id.replace(reUnescape, '');

	} else if (className){
		className = className.replace(reUnescape, '');

		if (!currentParsed.classList) currentParsed.classList = [];
		if (!currentParsed.classes) currentParsed.classes = [];
		currentParsed.classList.push(className);
		currentParsed.classes.push({
			value: className,
			regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
		});

	} else if (pseudoClass){
		pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
		pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

		if (!currentParsed.pseudos) currentParsed.pseudos = [];
		currentParsed.pseudos.push({
			key: pseudoClass.replace(reUnescape, ''),
			value: pseudoClassValue
		});

	} else if (attributeKey){
		attributeKey = attributeKey.replace(reUnescape, '');
		attributeValue = (attributeValue || '').replace(reUnescape, '');

		var test, regexp;

		switch (attributeOperator){
			case '^=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue)            ); break;
			case '$=' : regexp = new RegExp(            escapeRegExp(attributeValue) +'$'       ); break;
			case '~=' : regexp = new RegExp( '(^|\\s)'+ escapeRegExp(attributeValue) +'(\\s|$)' ); break;
			case '|=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue) +'(-|$)'   ); break;
			case  '=' : test = function(value){
				return attributeValue == value;
			}; break;
			case '*=' : test = function(value){
				return value && value.indexOf(attributeValue) > -1;
			}; break;
			case '!=' : test = function(value){
				return attributeValue != value;
			}; break;
			default   : test = function(value){
				return !!value;
			};
		}

		if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function(){
			return false;
		};

		if (!test) test = function(value){
			return value && regexp.test(value);
		};

		if (!currentParsed.attributes) currentParsed.attributes = [];
		currentParsed.attributes.push({
			key: attributeKey,
			operator: attributeOperator,
			value: attributeValue,
			test: test
		});

	}

	return '';
};

// Slick NS

var Slick = (this.Slick || {});

Slick.parse = function(expression){
	return parse(expression);
};

Slick.escapeRegExp = escapeRegExp;

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);

/*
---
name: Slick.Finder
description: The new, superfast css selector engine.
provides: Slick.Finder
requires: Slick.Parser
...
*/

(function(){

var local = {};

// Feature / Bug detection

local.isNativeCode = function(fn){
	return (/\{\s*\[native code\]\s*\}/).test('' + fn);
};

local.isXML = function(document){
	return (!!document.xmlVersion) || (!!document.xml) || (Object.prototype.toString.call(document) === '[object XMLDocument]') ||
	(document.nodeType === 9 && document.documentElement.nodeName !== 'HTML');
};

local.setDocument = function(document){

	// convert elements / window arguments to document. if document cannot be extrapolated, the function returns.

	if (document.nodeType === 9); // document
	else if (document.ownerDocument) document = document.ownerDocument; // node
	else if (document.navigator) document = document.document; // window
	else return;

	// check if it's the old document

	if (this.document === document) return;
	this.document = document;
	var root = this.root = document.documentElement;

	this.isXMLDocument = this.isXML(document);

	this.brokenStarGEBTN
	= this.starSelectsClosedQSA
	= this.idGetsName
	= this.brokenMixedCaseQSA
	= this.brokenGEBCN
	= this.brokenCheckedQSA
	= this.brokenEmptyAttributeQSA
	= this.isHTMLDocument
	= false;

	var starSelectsClosed, starSelectsComments,
		brokenSecondClassNameGEBCN, cachedGetElementsByClassName;

	var selected, id;
	var testNode = document.createElement('div');
	root.appendChild(testNode);

	// on non-HTML documents innerHTML and getElementsById doesnt work properly
	try {
		id = 'slick_getbyid_test';
		testNode.innerHTML = '<a id="'+id+'"></a>';
		this.isHTMLDocument = !!document.getElementById(id);
	} catch(e){};

	if (this.isHTMLDocument){
		
		testNode.style.display = 'none';
		
		// IE returns comment nodes for getElementsByTagName('*') for some documents
		testNode.appendChild(document.createComment(''));
		starSelectsComments = (testNode.getElementsByTagName('*').length > 0);

		// IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
		try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.getElementsByTagName('*');
			starSelectsClosed = (selected && selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch(e){};

		this.brokenStarGEBTN = starSelectsComments || starSelectsClosed;

		// IE 8 returns closed nodes (EG:"</foo>") for querySelectorAll('*') for some documents
		if (testNode.querySelectorAll) try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.querySelectorAll('*');
			this.starSelectsClosedQSA = (selected && selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch(e){};

		// IE returns elements with the name instead of just id for getElementsById for some documents
		try {
			id = 'slick_id_gets_name';
			testNode.innerHTML = '<a name="'+id+'"></a><b id="'+id+'"></b>';
			this.idGetsName = document.getElementById(id) === testNode.firstChild;
		} catch(e){};

		// Safari 3.2 querySelectorAll doesnt work with mixedcase on quirksmode
		try {
			testNode.innerHTML = '<a class="MiXedCaSe"></a>';
			this.brokenMixedCaseQSA = !testNode.querySelectorAll('.MiXedCaSe').length;
		} catch(e){};

		try {
			testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
			testNode.getElementsByClassName('b').length;
			testNode.firstChild.className = 'b';
			cachedGetElementsByClassName = (testNode.getElementsByClassName('b').length != 2);
		} catch(e){};

		// Opera 9.6 getElementsByClassName doesnt detects the class if its not the first one
		try {
			testNode.innerHTML = '<a class="a"></a><a class="f b a"></a>';
			brokenSecondClassNameGEBCN = (testNode.getElementsByClassName('a').length != 2);
		} catch(e){};

		this.brokenGEBCN = cachedGetElementsByClassName || brokenSecondClassNameGEBCN;
		
		// Webkit dont return selected options on querySelectorAll
		try {
			testNode.innerHTML = '<select><option selected="selected">a</option></select>';
			this.brokenCheckedQSA = (testNode.querySelectorAll(':checked').length == 0);
		} catch(e){};
		
		// IE returns incorrect results for attr[*^$]="" selectors on querySelectorAll
		try {
			testNode.innerHTML = '<a class=""></a>';
			this.brokenEmptyAttributeQSA = (testNode.querySelectorAll('[class*=""]').length != 0);
		} catch(e){};
		
	}

	root.removeChild(testNode);
	testNode = null;

	// hasAttribute

	this.hasAttribute = (root && this.isNativeCode(root.hasAttribute)) ? function(node, attribute) {
		return node.hasAttribute(attribute);
	} : function(node, attribute) {
		node = node.getAttributeNode(attribute);
		return !!(node && (node.specified || node.nodeValue));
	};

	// contains
	// FIXME: Add specs: local.contains should be different for xml and html documents?
	this.contains = (root && this.isNativeCode(root.contains)) ? function(context, node){
		return context.contains(node);
	} : (root && root.compareDocumentPosition) ? function(context, node){
		return context === node || !!(context.compareDocumentPosition(node) & 16);
	} : function(context, node){
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	};

	// document order sorting
	// credits to Sizzle (http://sizzlejs.com/)

	this.documentSorter = (root.compareDocumentPosition) ? function(a, b){
		if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0;
		return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
	} : ('sourceIndex' in root) ? function(a, b){
		if (!a.sourceIndex || !b.sourceIndex) return 0;
		return a.sourceIndex - b.sourceIndex;
	} : (document.createRange) ? function(a, b){
		if (!a.ownerDocument || !b.ownerDocument) return 0;
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
	} : null ;

	this.getUID = (this.isHTMLDocument) ? this.getUIDHTML : this.getUIDXML;

};

// Main Method

local.search = function(context, expression, append, first){

	var found = this.found = (first) ? null : (append || []);

	// context checks

	if (!context) return found; // No context
	if (context.navigator) context = context.document; // Convert the node from a window to a document
	else if (!context.nodeType) return found; // Reject misc junk input

	// setup

	var parsed, i;

	var uniques = this.uniques = {};

	if (this.document !== (context.ownerDocument || context)) this.setDocument(context);

	// should sort if there are nodes in append and if you pass multiple expressions.
	// should remove duplicates if append already has items
	var shouldUniques = !!(append && append.length);

	// avoid duplicating items already in the append array
	if (shouldUniques) for (i = found.length; i--;) this.uniques[this.getUID(found[i])] = true;

	// expression checks

	if (typeof expression == 'string'){ // expression is a string

		// Overrides

		for (i = this.overrides.length; i--;){
			var override = this.overrides[i];
			if (override.regexp.test(expression)){
				var result = override.method.call(context, expression, found, first);
				if (result === false) continue;
				if (result === true) return found;
				return result;
			}
		}

		parsed = this.Slick.parse(expression);
		if (!parsed.length) return found;
	} else if (expression == null){ // there is no expression
		return found;
	} else if (expression.Slick){ // expression is a parsed Slick object
		parsed = expression;
	} else if (this.contains(context.documentElement || context, expression)){ // expression is a node
		(found) ? found.push(expression) : found = expression;
		return found;
	} else { // other junk
		return found;
	}

	// cache elements for the nth selectors

	/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

	this.posNTH = {};
	this.posNTHLast = {};
	this.posNTHType = {};
	this.posNTHTypeLast = {};

	/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

	// if append is null and there is only a single selector with one expression use pushArray, else use pushUID
	this.push = (!shouldUniques && (first || (parsed.length == 1 && parsed.expressions[0].length == 1))) ? this.pushArray : this.pushUID;

	if (found == null) found = [];

	// default engine

	var j, m, n;
	var combinator, tag, id, classList, classes, attributes, pseudos;
	var currentItems, currentExpression, currentBit, lastBit, expressions = parsed.expressions;

	search: for (i = 0; (currentExpression = expressions[i]); i++) for (j = 0; (currentBit = currentExpression[j]); j++){

		combinator = 'combinator:' + currentBit.combinator;
		if (!this[combinator]) continue search;

		tag        = (this.isXMLDocument) ? currentBit.tag : currentBit.tag.toUpperCase();
		id         = currentBit.id;
		classList  = currentBit.classList;
		classes    = currentBit.classes;
		attributes = currentBit.attributes;
		pseudos    = currentBit.pseudos;
		lastBit    = (j === (currentExpression.length - 1));

		this.bitUniques = {};

		if (lastBit){
			this.uniques = uniques;
			this.found = found;
		} else {
			this.uniques = {};
			this.found = [];
		}

		if (j === 0){
			this[combinator](context, tag, id, classes, attributes, pseudos, classList);
			if (first && lastBit && found.length) break search;
		} else {
			if (first && lastBit) for (m = 0, n = currentItems.length; m < n; m++){
				this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
				if (found.length) break search;
			} else for (m = 0, n = currentItems.length; m < n; m++) this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
		}

		currentItems = this.found;
	}

	if (shouldUniques || (parsed.expressions.length > 1)) this.sort(found);

	return (first) ? (found[0] || null) : found;
};

// Utils

local.uidx = 1;
local.uidk = 'slick:uniqueid';

local.getUIDXML = function(node){
	var uid = node.getAttribute(this.uidk);
	if (!uid){
		uid = this.uidx++;
		node.setAttribute(this.uidk, uid);
	}
	return uid;
};

local.getUIDHTML = function(node){
	return node.uniqueNumber || (node.uniqueNumber = this.uidx++);
};

// sort based on the setDocument documentSorter method.

local.sort = function(results){
	if (!this.documentSorter) return results;
	results.sort(this.documentSorter);
	return results;
};

/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

local.cacheNTH = {};

local.matchNTH = /^([+-]?\d*)?([a-z]+)?([+-]\d+)?$/;

local.parseNTHArgument = function(argument){
	var parsed = argument.match(this.matchNTH);
	if (!parsed) return false;
	var special = parsed[2] || false;
	var a = parsed[1] || 1;
	if (a == '-') a = -1;
	var b = +parsed[3] || 0;
	parsed =
		(special == 'n')	? {a: a, b: b} :
		(special == 'odd')	? {a: 2, b: 1} :
		(special == 'even')	? {a: 2, b: 0} : {a: 0, b: a};

	return (this.cacheNTH[argument] = parsed);
};

local.createNTHPseudo = function(child, sibling, positions, ofType){
	return function(node, argument){
		var uid = this.getUID(node);
		if (!this[positions][uid]){
			var parent = node.parentNode;
			if (!parent) return false;
			var el = parent[child], count = 1;
			if (ofType){
				var nodeName = node.nodeName;
				do {
					if (el.nodeName !== nodeName) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			} else {
				do {
					if (el.nodeType !== 1) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			}
		}
		argument = argument || 'n';
		var parsed = this.cacheNTH[argument] || this.parseNTHArgument(argument);
		if (!parsed) return false;
		var a = parsed.a, b = parsed.b, pos = this[positions][uid];
		if (a == 0) return b == pos;
		if (a > 0){
			if (pos < b) return false;
		} else {
			if (b < pos) return false;
		}
		return ((pos - b) % a) == 0;
	};
};

/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

local.pushArray = function(node, tag, id, classes, attributes, pseudos){
	if (this.matchSelector(node, tag, id, classes, attributes, pseudos)) this.found.push(node);
};

local.pushUID = function(node, tag, id, classes, attributes, pseudos){
	var uid = this.getUID(node);
	if (!this.uniques[uid] && this.matchSelector(node, tag, id, classes, attributes, pseudos)){
		this.uniques[uid] = true;
		this.found.push(node);
	}
};

local.matchNode = function(node, selector){
	var parsed = this.Slick.parse(selector);
	if (!parsed) return true;

	// simple (single) selectors
	if(parsed.length == 1 && parsed.expressions[0].length == 1){
		var exp = parsed.expressions[0][0];
		return this.matchSelector(node, (this.isXMLDocument) ? exp.tag : exp.tag.toUpperCase(), exp.id, exp.classes, exp.attributes, exp.pseudos);
	}

	var nodes = this.search(this.document, parsed);
	for (var i = 0, item; item = nodes[i++];){
		if (item === node) return true;
	}
	return false;
};

local.matchPseudo = function(node, name, argument){
	var pseudoName = 'pseudo:' + name;
	if (this[pseudoName]) return this[pseudoName](node, argument);
	var attribute = this.getAttribute(node, name);
	return (argument) ? argument == attribute : !!attribute;
};

local.matchSelector = function(node, tag, id, classes, attributes, pseudos){
	if (tag){
		if (tag == '*'){
			if (node.nodeName < '@') return false; // Fix for comment nodes and closed nodes
		} else {
			if (node.nodeName != tag) return false;
		}
	}

	if (id && node.getAttribute('id') != id) return false;

	var i, part, cls;
	if (classes) for (i = classes.length; i--;){
		cls = ('className' in node) ? node.className : node.getAttribute('class');
		if (!(cls && classes[i].regexp.test(cls))) return false;
	}
	if (attributes) for (i = attributes.length; i--;){
		part = attributes[i];
		if (part.operator ? !part.test(this.getAttribute(node, part.key)) : !this.hasAttribute(node, part.key)) return false;
	}
	if (pseudos) for (i = pseudos.length; i--;){
		part = pseudos[i];
		if (!this.matchPseudo(node, part.key, part.value)) return false;
	}
	return true;
};

var combinators = {

	' ': function(node, tag, id, classes, attributes, pseudos, classList){ // all child nodes, any level

		var i, item, children;

		if (this.isHTMLDocument){
			getById: if (id){
				item = this.document.getElementById(id);
				if ((!item && node.all) || (this.idGetsName && item && item.getAttributeNode('id').nodeValue != id)){
					// all[id] returns all the elements with that name or id inside node
					// if theres just one it will return the element, else it will be a collection
					children = node.all[id];
					if (!children) return;
					if (!children[0]) children = [children];
					for (i = 0; item = children[i++];) if (item.getAttributeNode('id').nodeValue == id){
						this.push(item, tag, null, classes, attributes, pseudos);
						break;
					} 
					return;
				}
				if (!item){
					// if the context is in the dom we return, else we will try GEBTN, breaking the getById label
					if (this.contains(this.document.documentElement, node)) return;
					else break getById;
				} else if (this.document !== node && !this.contains(node, item)) return;
				this.push(item, tag, null, classes, attributes, pseudos);
				return;
			}
			getByClass: if (classes && node.getElementsByClassName && !this.brokenGEBCN){
				children = node.getElementsByClassName(classList.join(' '));
				if (!(children && children.length)) break getByClass;
				for (i = 0; item = children[i++];) this.push(item, tag, id, null, attributes, pseudos);
				return;
			}
		}
		getByTag: {
			children = node.getElementsByTagName(tag);
			if (!(children && children.length)) break getByTag;
			if (!this.brokenStarGEBTN) tag = null;
			for (i = 0; item = children[i++];) this.push(item, tag, id, classes, attributes, pseudos);
		}
	},

	'>': function(node, tag, id, classes, attributes, pseudos){ // direct children
		if ((node = node.firstChild)) do {
			if (node.nodeType === 1) this.push(node, tag, id, classes, attributes, pseudos);
		} while ((node = node.nextSibling));
	},

	'+': function(node, tag, id, classes, attributes, pseudos){ // next sibling
		while ((node = node.nextSibling)) if (node.nodeType === 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'^': function(node, tag, id, classes, attributes, pseudos){ // first child
		node = node.firstChild;
		if (node){
			if (node.nodeType === 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'~': function(node, tag, id, classes, attributes, pseudos){ // next siblings
		while ((node = node.nextSibling)){
			if (node.nodeType !== 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	},

	'++': function(node, tag, id, classes, attributes, pseudos){ // next sibling and previous sibling
		this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
	},

	'~~': function(node, tag, id, classes, attributes, pseudos){ // next siblings and previous siblings
		this['combinator:~'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!~'](node, tag, id, classes, attributes, pseudos);
	},

	'!': function(node, tag, id, classes, attributes, pseudos){  // all parent nodes up to document
		while ((node = node.parentNode)) if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!>': function(node, tag, id, classes, attributes, pseudos){ // direct parent (one level)
		node = node.parentNode;
		if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!+': function(node, tag, id, classes, attributes, pseudos){ // previous sibling
		while ((node = node.previousSibling)) if (node.nodeType === 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'!^': function(node, tag, id, classes, attributes, pseudos){ // last child
		node = node.lastChild;
		if (node){
			if (node.nodeType === 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'!~': function(node, tag, id, classes, attributes, pseudos){ // previous siblings
		while ((node = node.previousSibling)){
			if (node.nodeType !== 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	}

};

for (var c in combinators) local['combinator:' + c] = combinators[c];

var pseudos = {

	/*<pseudo-selectors>*/

	'empty': function(node){
		var child = node.firstChild;
		return !(child && child.nodeType == 1) && !(node.innerText || node.textContent || '').length;
	},

	'not': function(node, expression){
		return !this.matchNode(node, expression);
	},

	'contains': function(node, text){
		return (node.innerText || node.textContent || '').indexOf(text) > -1;
	},

	'first-child': function(node){
		while ((node = node.previousSibling)) if (node.nodeType === 1) return false;
		return true;
	},

	'last-child': function(node){
		while ((node = node.nextSibling)) if (node.nodeType === 1) return false;
		return true;
	},

	'only-child': function(node){
		var prev = node;
		while ((prev = prev.previousSibling)) if (prev.nodeType === 1) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeType === 1) return false;
		return true;
	},

	/*<nth-pseudo-selectors>*/

	'nth-child': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTH'),

	'nth-last-child': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHLast'),

	'nth-of-type': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTHType', true),

	'nth-last-of-type': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHTypeLast', true),

	'index': function(node, index){
		return this['pseudo:nth-child'](node, '' + index + 1);
	},

	'even': function(node, argument){
		return this['pseudo:nth-child'](node, '2n');
	},

	'odd': function(node, argument){
		return this['pseudo:nth-child'](node, '2n+1');
	},

	/*</nth-pseudo-selectors>*/

	/*<of-type-pseudo-selectors>*/

	'first-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.previousSibling)) if (node.nodeName === nodeName) return false;
		return true;
	},

	'last-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.nextSibling)) if (node.nodeName === nodeName) return false;
		return true;
	},

	'only-of-type': function(node){
		var prev = node, nodeName = node.nodeName;
		while ((prev = prev.previousSibling)) if (prev.nodeName === nodeName) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeName === nodeName) return false;
		return true;
	},

	/*</of-type-pseudo-selectors>*/

	// custom pseudos

	'enabled': function(node){
		return (node.disabled === false);
	},

	'disabled': function(node){
		return (node.disabled === true);
	},

	'checked': function(node){
		return node.checked || node.selected;
	},

	'focus': function(node){
		return this.isHTMLDocument && this.document.activeElement === node && (node.href || node.type || this.hasAttribute(node, 'tabindex'));
	},

	'root': function(node){
		return (node === this.root);
	},
	
	'selected': function(node){
		return node.selected;
	}

	/*</pseudo-selectors>*/
};

for (var p in pseudos) local['pseudo:' + p] = pseudos[p];

// attributes methods

local.attributeGetters = {

	'class': function(){
		return ('className' in this) ? this.className : this.getAttribute('class');
	},

	'for': function(){
		return ('htmlFor' in this) ? this.htmlFor : this.getAttribute('for');
	},

	'href': function(){
		return ('href' in this) ? this.getAttribute('href', 2) : this.getAttribute('href');
	},

	'style': function(){
		return (this.style) ? this.style.cssText : this.getAttribute('style');
	}

};

local.getAttribute = function(node, name){
	// FIXME: check if getAttribute() will get input elements on a form on this browser
	// getAttribute is faster than getAttributeNode().nodeValue
	var method = this.attributeGetters[name];
	if (method) return method.call(node);
	var attributeNode = node.getAttributeNode(name);
	return attributeNode ? attributeNode.nodeValue : null;
};

// overrides

local.overrides = [];

local.override = function(regexp, method){
	this.overrides.push({regexp: regexp, method: method});
};

/*<overrides>*/

/*<query-selector-override>*/

var reEmptyAttribute = /\[.*[*$^]=(?:["']{2})?\]/;

local.override(/./, function(expression, found, first){ //querySelectorAll override

	if (!this.querySelectorAll || this.nodeType != 9 || !local.isHTMLDocument || local.brokenMixedCaseQSA ||
	(local.brokenCheckedQSA && expression.indexOf(':checked') > -1) ||
	(local.brokenEmptyAttributeQSA && reEmptyAttribute.test(expression)) || Slick.disableQSA) return false;

	var nodes, node;
	try {
		if (first) return this.querySelector(expression) || null;
		else nodes = this.querySelectorAll(expression);
	} catch(error){
		return false;
	}

	var i, hasOthers = !!(found.length);

	if (local.starSelectsClosedQSA) for (i = 0; node = nodes[i++];){
		if (node.nodeName > '@' && (!hasOthers || !local.uniques[local.getUIDHTML(node)])) found.push(node);
	} else for (i = 0; node = nodes[i++];){
		if (!hasOthers || !local.uniques[local.getUIDHTML(node)]) found.push(node);
	}

	if (hasOthers) local.sort(found);

	return true;

});

/*</query-selector-override>*/

/*<tag-override>*/

local.override(/^[\w-]+$|^\*$/, function(expression, found, first){ // tag override
	var tag = expression;
	if (tag == '*' && local.brokenStarGEBTN) return false;

	var nodes = this.getElementsByTagName(tag);

	if (first) return nodes[0] || null;
	var i, node, hasOthers = !!(found.length);

	for (i = 0; node = nodes[i++];){
		if (!hasOthers || !local.uniques[local.getUID(node)]) found.push(node);
	}

	if (hasOthers) local.sort(found);

	return true;
});

/*</tag-override>*/

/*<class-override>*/

local.override(/^\.[\w-]+$/, function(expression, found, first){ // class override
	if (!local.isHTMLDocument || (!this.getElementsByClassName && this.querySelectorAll)) return false;

	var nodes, node, i, hasOthers = !!(found && found.length), className = expression.substring(1);
	if (this.getElementsByClassName && !local.brokenGEBCN){
		nodes = this.getElementsByClassName(className);
		if (first) return nodes[0] || null;
		for (i = 0; node = nodes[i++];){
			if (!hasOthers || !local.uniques[local.getUIDHTML(node)]) found.push(node);
		}
	} else {
		var matchClass = new RegExp('(^|\\s)'+ Slick.escapeRegExp(className) +'(\\s|$)');
		nodes = this.getElementsByTagName('*');
		for (i = 0; node = nodes[i++];){
			className = node.className;
			if (!className || !matchClass.test(className)) continue;
			if (first) return node;
			if (!hasOthers || !local.uniques[local.getUIDHTML(node)]) found.push(node);
		}
	}
	if (hasOthers) local.sort(found);
	return (first) ? null : true;
});

/*</class-override>*/

/*<id-override>*/

local.override(/^#[\w-]+$/, function(expression, found, first){ // ID override
	if (!local.isHTMLDocument || this.nodeType != 9) return false;

	var id = expression.substring(1), el = this.getElementById(id);
	if (!el) return found;
	if (local.idGetsName && el.getAttributeNode('id').nodeValue != id) return false;
	if (first) return el || null;
	var hasOthers = !!(found.length);
	if (!hasOthers || !local.uniques[local.getUIDHTML(el)]) found.push(el);
	if (hasOthers) local.sort(found);
	return true;
});

/*</id-override>*/

/*</overrides>*/

if (typeof document != 'undefined') local.setDocument(document);

// Slick

var Slick = local.Slick = (this.Slick || {});

Slick.version = '0.9dev';

// Slick finder

Slick.search = function(context, expression, append){
	return local.search(context, expression, append);
};

Slick.find = function(context, expression){
	return local.search(context, expression, null, true);
};

// Slick containment checker

Slick.contains = function(container, node){
	local.setDocument(container);
	return local.contains(container, node);
};

// Slick attribute getter

Slick.getAttribute = function(node, name){
	return local.getAttribute(node, name);
};

// Slick matcher

Slick.match = function(node, selector){
	if (!(node && selector)) return false;
	if (!selector || selector === node) return true;
	if (typeof selector != 'string') return false;
	local.setDocument(node);
	return local.matchNode(node, selector);
};

// Slick attribute accessor

Slick.defineAttributeGetter = function(name, fn){
	local.attributeGetters[name] = fn;
	return this;
};

Slick.lookupAttributeGetter = function(name){
	return local.attributeGetters[name];
};

// Slick pseudo accessor

Slick.definePseudo = function(name, fn){
	local['pseudo:' + name] = function(node, argument){
		return fn.call(node, argument);
	};
	return this;
};

Slick.lookupPseudo = function(name){
	var pseudo = local['pseudo:' + name];
	if (pseudo) return function(argument){
		return pseudo.call(this, argument);
	};
	return null;
};

// Slick overrides accessor

Slick.override = function(regexp, fn){
	local.override(regexp, fn);
	return this;
};

Slick.isXML = local.isXML;

Slick.uidOf = function(node){
	return local.getUIDHTML(node);
};

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);

/*
---

name: Element

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires: [Window, Document, Array, String, Function, Number, Slick.Parser, Slick.Finder]

provides: [Element, Elements, $, $$, Iframe, Selectors]

...
*/

var Element = function(tag, props){
	var konstructor = Element.Constructors[tag];
	if (konstructor) return konstructor(props);
	if (typeof tag != 'string') return document.id(tag).set(props);

	if (!props) props = {};

	if (!(/^[\w-]+$/).test(tag)){
		var parsed = Slick.parse(tag).expressions[0][0];
		tag = (parsed.tag == '*') ? 'div' : parsed.tag;
		if (parsed.id && props.id == null) props.id = parsed.id;

		var attributes = parsed.attributes;
		if (attributes) for (var i = 0, l = attributes.length; i < l; i++){
			var attr = attributes[i];
			if (attr.value != null && attr.operator == '=' && props[attr.key] == null)
				props[attr.key] = attr.value;
		}

		if (parsed.classList && props['class'] == null) props['class'] = parsed.classList.join(' ');
	}

	return document.newElement(tag, props);
};

if (Browser.Element) Element.prototype = Browser.Element.prototype;

new Type('Element', Element).mirror(function(name){
	if (Array.prototype[name]) return;

	var obj = {};
	obj[name] = function(){
		var results = [], args = arguments, elements = true;
		for (var i = 0, l = this.length; i < l; i++){
			var element = this[i], result = results[i] = element[name].apply(element, args);
			elements = (elements && typeOf(result) == 'element');
		}
		return (elements) ? new Elements(results) : results;
	};

	Elements.implement(obj);
});

if (!Browser.Element){
	Element.parent = Object;

	Element.Prototype = {'$family': Function.from('element').hide()};

	Element.mirror(function(name, method){
		Element.Prototype[name] = method;
	});
}

Element.Constructors = {};

//<1.2compat>

Element.Constructors = new Hash;

//</1.2compat>

var IFrame = new Type('IFrame', function(){
	var params = Array.link(arguments, {
		properties: Type.isObject,
		iframe: function(obj){
			return (obj != null);
		}
	});

	var props = params.properties || {}, iframe;
	if (params.iframe) iframe = document.id(params.iframe);
	var onload = props.onload || function(){};
	delete props.onload;
	props.id = props.name = [props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + String.uniqueID()].pick();
	iframe = new Element(iframe || 'iframe', props);

	var onLoad = function(){
		onload.call(iframe.contentWindow);
	};

	if (window.frames[props.id]) onLoad();
	else iframe.addListener('load', onLoad);
	return iframe;
});

var Elements = this.Elements = function(nodes){
	if (nodes && nodes.length){
		var uniques = {}, node;
		for (var i = 0; node = nodes[i++];){
			var uid = Slick.uidOf(node);
			if (!uniques[uid]){
				uniques[uid] = true;
				this.push(node);
			}
		}
	}
};

Elements.prototype = {length: 0};
Elements.parent = Array;

new Type('Elements', Elements).implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeOf(filter) == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}.protect(),

	push: function(){
		var length = this.length;
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = document.id(arguments[i]);
			if (item) this[length++] = item;
		}
		return (this.length = length);
	}.protect(),

	unshift: function(){
		var items = [];
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = document.id(arguments[i]);
			if (item) items.push(item);
		}
		return Array.prototype.unshift.apply(this, items);
	}.protect(),

	concat: function(){
		var newElements = new Elements(this);
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = arguments[i];
			if (Type.isEnumerable(item)) newElements.append(item);
			else newElements.push(item);
		}
		return newElements;
	}.protect(),

	append: function(collection){
		for (var i = 0, l = collection.length; i < l; i++) this.push(collection[i]);
		return this;
	}.protect(),

	empty: function(){
		while (this.length) delete this[--this.length];
		return this;
	}.protect()

});

//<1.2compat>

Elements.alias('extend', 'append');

//</1.2compat>

(function(){

// FF, IE
var splice = Array.prototype.splice, object = {'0': 0, '1': 1, length: 2};

splice.call(object, 1, 1);
if (object[1] == 1) Elements.implement('splice', function(){
	var length = this.length;
	splice.apply(this, arguments);
	while (length >= this.length) delete this[length--];
	return this;
}.protect());

Elements.implement(Array.prototype);

Array.mirror(Elements);

/*<ltIE8>*/
var createElementAcceptsHTML;
try {
	var x = document.createElement('<input name=x>');
	createElementAcceptsHTML = (x.name == 'x');
} catch(e){}

var escapeQuotes = function(html){
	return ('' + html).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
};
/*</ltIE8>*/

Document.implement({

	newElement: function(tag, props){
		if (props && props.checked != null) props.defaultChecked = props.checked;
		/*<ltIE8>*/// Fix for readonly name and type properties in IE < 8
		if (createElementAcceptsHTML && props){
			tag = '<' + tag;
			if (props.name) tag += ' name="' + escapeQuotes(props.name) + '"';
			if (props.type) tag += ' type="' + escapeQuotes(props.type) + '"';
			tag += '>';
			delete props.name;
			delete props.type;
		}
		/*</ltIE8>*/
		return this.id(this.createElement(tag)).set(props);
	}

});

})();

Document.implement({

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},

	id: (function(){

		var types = {

			string: function(id, nocash, doc){
				id = Slick.find(doc, '#' + id.replace(/(\W)/g, '\\$1'));
				return (id) ? types.element(id, nocash) : null;
			},

			element: function(el, nocash){
				$uid(el);
				if (!nocash && !el.$family && !(/^(?:object|embed)$/i).test(el.tagName)){
					Object.append(el, Element.Prototype);
				}
				return el;
			},

			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}

		};

		types.textnode = types.whitespace = types.window = types.document = function(zero){
			return zero;
		};

		return function(el, nocash, doc){
			if (el && el.$family && el.uid) return el;
			var type = typeOf(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement('$', function(el, nc){
	return document.id(el, nc, this.document);
});

Window.implement({

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

[Document, Element].invoke('implement', {

	getElements: function(expression){
		return Slick.search(this, expression, new Elements);
	},

	getElement: function(expression){
		return document.id(Slick.find(this, expression));
	}

});

//<1.2compat>

(function(search, find, match){

	this.Selectors = {};
	var pseudos = this.Selectors.Pseudo = new Hash();

	var addSlickPseudos = function(){
		for (var name in pseudos) if (pseudos.hasOwnProperty(name)){
			Slick.definePseudo(name, pseudos[name]);
			delete pseudos[name];
		}
	};

	Slick.search = function(context, expression, append){
		addSlickPseudos();
		return search.call(this, context, expression, append);
	};

	Slick.find = function(context, expression){
		addSlickPseudos();
		return find.call(this, context, expression);
	};

	Slick.match = function(node, selector){
		addSlickPseudos();
		return match.call(this, node, selector);
	};

})(Slick.search, Slick.find, Slick.match);

if (window.$$ == null) Window.implement('$$', function(selector){
	var elements = new Elements;
	if (arguments.length == 1 && typeof selector == 'string') return Slick.search(this.document, selector, elements);
	var args = Array.flatten(arguments);
	for (var i = 0, l = args.length; i < l; i++){
		var item = args[i];
		switch (typeOf(item)){
			case 'element': elements.push(item); break;
			case 'string': Slick.search(this.document, item, elements);
		}
	}
	return elements;
});

//</1.2compat>

if (window.$$ == null) Window.implement('$$', function(selector){
	if (arguments.length == 1){
		if (typeof selector == 'string') return Slick.search(this.document, selector, new Elements);
		else if (Type.isEnumerable(selector)) return new Elements(selector);
	}
	return new Elements(arguments);
});

(function(){

var collected = {}, storage = {};
var formProps = {input: 'checked', option: 'selected', textarea: 'value'};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item){
	if (item.removeEvents) item.removeEvents();
	if (item.clearAttributes) item.clearAttributes();
	var uid = item.uid;
	if (uid != null){
		delete collected[uid];
		delete storage[uid];
	}
	return item;
};

var camels = ['defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly',
	'rowSpan', 'tabIndex', 'useMap'
];
var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readOnly', 'multiple', 'selected',
	'noresize', 'defer'
];
 var attributes = {
	'html': 'innerHTML',
	'class': 'className',
	'for': 'htmlFor',
	'text': (function(){
		var temp = document.createElement('div');
		return (temp.innerText == null) ? 'textContent' : 'innerText';
	})()
};
var readOnly = ['type'];
var expandos = ['value', 'defaultValue'];
var uriAttrs = /^(?:href|src|usemap)$/i;

bools = bools.associate(bools);
camels = camels.associate(camels.map(String.toLowerCase));
readOnly = readOnly.associate(readOnly);

Object.append(attributes, expandos.associate(expandos));

var inserters = {

	before: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
	},

	after: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		element.insertBefore(context, element.firstChild);
	}

};

inserters.inside = inserters.bottom;

//<1.2compat>

Object.each(inserters, function(inserter, where){

	where = where.capitalize();

	var methods = {};

	methods['inject' + where] = function(el){
		inserter(this, document.id(el, true));
		return this;
	};

	methods['grab' + where] = function(el){
		inserter(document.id(el, true), this);
		return this;
	};

	Element.implement(methods);

});

//</1.2compat>

var injectCombinator = function(expression, combinator){
	if (!expression) return combinator;

	expression = Slick.parse(expression);

	var expressions = expression.expressions;
	for (var i = expressions.length; i--;)
		expressions[i][0].combinator = combinator;

	return expression;
};

Element.implement({

	set: function(prop, value){
		var property = Element.Properties[prop];
		(property && property.set) ? property.set.call(this, value) : this.setProperty(prop, value);
	}.overloadSetter(),

	get: function(prop){
		var property = Element.Properties[prop];
		return (property && property.get) ? property.get.apply(this) : this.getProperty(prop);
	}.overloadGetter(),

	erase: function(prop){
		var property = Element.Properties[prop];
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	setProperty: function(attribute, value){
		attribute = camels[attribute] || attribute;
		if (value == null) return this.removeProperty(attribute);
		var key = attributes[attribute];
		(key) ? this[key] = value :
			(bools[attribute]) ? this[attribute] = !!value : this.setAttribute(attribute, '' + value);
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(attribute){
		attribute = camels[attribute] || attribute;
		var key = attributes[attribute] || readOnly[attribute];
		return (key) ? this[key] :
			(bools[attribute]) ? !!this[attribute] :
			(uriAttrs.test(attribute) ? this.getAttribute(attribute, 2) :
			(key = this.getAttributeNode(attribute)) ? key.nodeValue : null) || null;
	},

	getProperties: function(){
		var args = Array.from(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(attribute){
		attribute = camels[attribute] || attribute;
		var key = attributes[attribute];
		(key) ? this[key] = '' :
			(bools[attribute]) ? this[attribute] = false : this.removeAttribute(attribute);
		return this;
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	hasClass: function(className){
		return this.className.clean().contains(className, ' ');
	},

	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},

	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		return this;
	},

	toggleClass: function(className, force){
		if (force == null) force = !this.hasClass(className);
		return (force) ? this.addClass(className) : this.removeClass(className);
	},

	adopt: function(){
		var parent = this, fragment, elements = Array.flatten(arguments), length = elements.length;
		if (length > 1) parent = fragment = document.createDocumentFragment();

		for (var i = 0; i < length; i++){
			var element = document.id(elements[i], true);
			if (element) parent.appendChild(element);
		}

		if (fragment) this.appendChild(fragment);

		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getPrevious: function(expression){
		return document.id(Slick.find(this, injectCombinator(expression, '!~')));
	},

	getAllPrevious: function(expression){
		return Slick.search(this, injectCombinator(expression, '!~'), new Elements);
	},

	getNext: function(expression){
		return document.id(Slick.find(this, injectCombinator(expression, '~')));
	},

	getAllNext: function(expression){
		return Slick.search(this, injectCombinator(expression, '~'), new Elements);
	},

	getFirst: function(expression){
		return document.id(Slick.search(this, injectCombinator(expression, '>'))[0]);
	},

	getLast: function(expression){
		return document.id(Slick.search(this, injectCombinator(expression, '>')).getLast());
	},

	getParent: function(expression){
		return document.id(Slick.find(this, injectCombinator(expression, '!')));
	},

	getParents: function(expression){
		return Slick.search(this, injectCombinator(expression, '!'), new Elements);
	},

	getSiblings: function(expression){
		return Slick.search(this, injectCombinator(expression, '~~'), new Elements);
	},

	getChildren: function(expression){
		return Slick.search(this, injectCombinator(expression, '>'), new Elements);
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id){
		return document.id(Slick.find(this, '#' + ('' + id).replace(/(\W)/g, '\\$1')));
	},

	getSelected: function(){
		this.selectedIndex; // Safari 3.2.1
		return new Elements(Array.from(this.options).filter(function(option){
			return option.selected;
		}));
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea').each(function(el){
			var type = el.type;
			if (!el.name || el.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

			var value = (el.get('tag') == 'select') ? el.getSelected().map(function(opt){
				// IE
				return document.id(opt).get('value');
			}) : ((type == 'radio' || type == 'checkbox') && !el.checked) ? null : el.get('value');

			Array.from(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	},

	destroy: function(){
		var children = clean(this).getElementsByTagName('*');
		Array.each(children, clean);
		Element.dispose(this);
		return null;
	},

	empty: function(){
		Array.from(this.childNodes).each(Element.dispose);
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	match: function(expression){
		return !expression || Slick.match(this, expression);
	}

});

var cleanClone = function(node, element, keepid){
	if (!keepid) node.removeAttribute('id');
	if (Browser.ie){
		node.clearAttributes();
		node.mergeAttributes(element);
		node.removeAttribute('uid');
		if (node.options){
			var no = node.options, eo = element.options;
			for (var i = no.length; i--;) no[i].selected = eo[i].selected;
		}
	}
	var prop = formProps[element.tagName.toLowerCase()];
	if (prop && element[prop]) node[prop] = element[prop];
};

Element.implement('clone', function(contents, keepid){
	contents = contents !== false;
	var clone = this.cloneNode(contents);

	if (contents){
		var ce = clone.getElementsByTagName('*'), te = this.getElementsByTagName('*');
		for (var i = ce.length; i--;) cleanClone(ce[i], te[i], keepid);
	}

	cleanClone(clone, this, keepid);

	if (Browser.ie){
		var co = clone.getElementsByTagName('object'), to = this.getElementsByTagName('object');
		for (var i = co.length; i--;) co[i].outerHTML = to[i].outerHTML;
	}
	return document.id(clone);
});

var contains = {contains: function(element){
	return Slick.contains(this, element);
}};

if (!document.contains) Document.implement(contains);
if (!document.createElement('div').contains) Element.implement(contains);

//<1.2compat>

Element.implement('hasChild', function(element){
	return this !== element && this.contains(element);
});

//</1.2compat>

[Element, Window, Document].invoke('implement', {

	addListener: function(type, fn){
		if (type == 'unload'){
			var old = fn, self = this;
			fn = function(){
				self.removeListener('unload', fn);
				old();
			};
		} else {
			collected[$uid(this)] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, !!arguments[2]);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, !!arguments[2]);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get($uid(this)), prop = storage[property];
		if (dflt != null && prop == null) prop = storage[property] = dflt;
		return prop != null ? prop : null;
	},

	store: function(property, value){
		var storage = get($uid(this));
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get($uid(this));
		delete storage[property];
		return this;
	}

});

// IE purge
if (window.attachEvent && !window.addEventListener) window.addListener('unload', function(){
	Object.each(collected, clean);
	if (window.CollectGarbage) CollectGarbage();
});

})();

Element.Properties = {};

//<1.2compat>

Element.Properties = new Hash;

//</1.2compat>

Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

(function(maxLength){
	if (maxLength != null) Element.Properties.maxlength = Element.Properties.maxLength = {
		get: function(){
			var maxlength = this.getAttribute('maxLength');
			return maxlength == maxLength ? null : maxlength;
		}
	};
})(document.createElement('input').getAttribute('maxLength'));

Element.Properties.html = (function(){

	var tableTest = Function.attempt(function(){
		var table = document.createElement('table');
		table.innerHTML = '<tr><td></td></tr>';
	});

	var wrapper = document.createElement('div');

	var translations = {
		table: [1, '<table>', '</table>'],
		select: [1, '<select>', '</select>'],
		tbody: [2, '<table><tbody>', '</tbody></table>'],
		tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
	};
	translations.thead = translations.tfoot = translations.tbody;

	var html = {
		set: function(){
			var html = Array.flatten(arguments).join('');
			var wrap = (!tableTest && translations[this.get('tag')]);
			if (wrap){
				var first = wrapper;
				first.innerHTML = wrap[1] + html + wrap[2];
				for (var i = wrap[0]; i--;) first = first.firstChild;
				this.empty().adopt(first.childNodes);
			} else {
				this.innerHTML = html;
			}
		}
	};

	html.erase = html.set;

	return html;
})();

/*
---
 
script: Item.js
 
description: Methods to get and set microdata closely to html5 spsec
 
license: MIT-style license.
 
requires:
- Core/Element
 
provides: [Element.prototype.getItems, Element.Properties.item, Element.Microdata]
 
...
*/

[Document, Element].invoke('implement', {
  getItems: function(tokens) {
    var selector = '[itemscope]:not([itemprop])';
    if (tokens) selector += tokens.split(' ').map(function(type) {
      return '[itemtype~=' + type + ']'
    }).join('');
    return this.getElements(selector).each(function(element) {
      return element.get('item');
    }).get('item')
  }
});

(function() {
  var push = function(properties, property, value) {
    var old = properties[property];
    if (old) { //multiple values, convert to array
      if (!old.push) properties[property] = [old];
      properties[property].push(value)
    } else {
      properties[property] = value;
    }
  }

Element.Properties.properties = {
  get: function() {
    var properties = {};
    var property = this.getProperty('itemprop');
    if (property) {
      var value = this.get('itemvalue');
      if (value) push(properties, property, value)
    }
    
    this.getChildren().each(function(child) {
      var values = child.get('properties');
      for (var property in values) push(properties, property, values[property]);
    });
    
    var reference = this.getProperty('itemref');
    if (reference) {
      var selector = reference.split(' ').map(function(id) { return '#' + id}).join(', ');
      $$(selector).each(function(reference) {
        var values = reference.get('properties');
        for (var property in values) push(properties, property, values[property]);
      })
    }
    
    return properties;
  },
  
  set: function(value) {
    this.getChildren().each(function(child) {
      var property = child.getProperty('itemprop');
      if (property) child.set('itemvalue', value[property]);
      else child.set('properties', value)
    });
  }
};

})();

Element.Properties.item = {
  get: function() {
    if (!this.getProperty('itemscope')) return;
    return this.get('properties');
  },
  
  set: function(value) {
    if (!this.getProperty('itemscope')) return;
    return this.set('properties', value);
  }
};

(function() {

var resolve = function(url) {
  if (!url) return '';
  var img = document.createElement('img');
  img.setAttribute('src', url);
  return img.src;
}

Element.Properties.itemvalue = {
  get: function() {
    var property = this.getProperty('itemprop');
    if (!property) return;
    var item = this.get('item');
    if (item) return item;
    switch (this.get('tag')) {
      case 'meta':
        return this.get('content') || '';
      case 'input':
      case 'select':
      case 'textarea':
        return this.get('value');
      case 'audio':
      case 'embed':
      case 'iframe':
      case 'img':
      case 'source':
      case 'video':
        return resolve(this.get('src'));
      case 'a':
      case 'area':
      case 'link':
        return resolve(this.get('href'));
      case 'object':
        return resolve(this.get('data'));
      case 'time':
        var datetime = this.get('datetime');
        if (!(datetime === undefined)) return datetime;
      default:
        return this.getProperty('itemvalue') || this.get('text');
    }        
  },

  set: function(value) {
    var property = this.getProperty('itemprop');
    var scope = this.getProperty('itemscope');
    if (property === undefined) return;
    else if (scope && Object.type(value[scope])) return this.set('item', value[scope]);
    
    switch (this.get('tag')) {
      case 'meta':
        return this.set('content', value);
      case 'audio':
      case 'embed':
      case 'iframe':
      case 'img':
      case 'source':
      case 'video':
        return this.set('src', value);
      case 'a':
      case 'area':
      case 'link':
        return this.set('href', value);
      case 'object':
        return this.set('data', value);
      case 'time':
        var datetime = this.get('datetime');
        if (!(datetime === undefined)) this.set('datetime', value)
      default:
        return this.set('html', value);
    }
  }
}

})();
/*
---
 
script: List.js
 
description: Trait that makes it simple to work with a list of item (and select one of them)
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Core/Element
  - Ext/Element.Properties.item
 
provides: 
  - LSD.Trait.List
 
...
*/


LSD.Trait.List = new Class({  
  options: {
    list: {
      endless: true,
      force: false
    },
    proxies: {
      container: {
        condition: function(widget) {
          return !!widget.setList
        }
      }
    },
    shortcuts: {
      previous: 'previous',
      next: 'next'
    }
  },
  
  list: [],
  items: [],
  
  attach: Macro.onion(function() {  
    var items = this.items.length ? this.items : this.options.list.items;
    if (items) {
      this.setItems(items);
    }
  }),
  
  selectItem: function(item) {
    if (item && !item.render) item = this.findItemByValue(item);
    if (!item && this.options.list.force) return false;
    var selected = this.selectedItem;
    this.setSelectedItem.apply(this, arguments); 
    if ((selected != item) && selected && selected.unselect) selected.unselect();
    item.select();
    return item;
  },
  
  unselectItem: function(item) {
    if (this.selectedItem) {
      if (this.selectedItem.unselect) this.selectedItem.unselect();
      delete this.selectedItem;
    }
  },
  
  setSelectedItem: function(item) {
    this.selectedItem = item;
    this.fireEvent('set', [item, this.getItemIndex()]);
  },
  
  buildItem: Macro.defaults(function(value) {
    return new Element('div', {
      'class': 'lsd option', 
      'html': value.toString(), 
      'events': {
        click: function() {
          this.selectItem(value);
        }.bind(this)
      }
    });
  }),
  
  setItems: function(items) {
    this.items = [];
    this.list = [];
    items.each(this.addItem.bind(this));
    if (this.options.list.force) this.selectItem(items[0]);
    return this;
  },
  
  addItem: function(item) {
    if (item.setList) var data = item.getValue(), widget = item, item = data;
    if (!this.items.contains(item)) {
      this.items.push(item);
      if (widget) {
        widget.listWidget = this;
        this.list.push(widget);
      }
      return true;
    }
    return false;
  },
  
  makeItems: function() {
    var item, i = this.list.length;
    while (item = this.items[i++]) this.makeItem(item);
  },
	
  makeItem: function(item) {
    var widget = this.buildItem.apply(this, arguments);
    widget.item = widget.value = item;
    if (widget.setContent) widget.setContent(item)
    else widget.set('html', item.toString());
    return widget;
  },
  
  getItems: function() {
    return this.items;
  },
  
  hasItems: function() {
    return this.getItems() && (this.getItems().length > 0)
  },
  
  getSelectedItem: function() {
    return this.selectedItem;
  },
  
  getItemIndex: function(item) {
    return this.getItems().indexOf(item || this.selectedItem);
  },
  
  findItemByValue: function(value) {
    for (var i = 0, j = this.list.length; i < j; i++) {
      if (this.list[i].value == value) return this.list[i];
    }
    return null;
  },
  
  getItemValue: function(item) {
    for (var i = 0, j = this.list.length; i < j; i++) {
      if (this.list[i] == item) return this.items[i];
    }
    return null;
  },
  
  getActiveItem: function() {
    var active = (this.chosenItem || this.selectedItem);
    return active ? active.value : null;
  },

  next: function(e) {
    this.makeItems();
    var next = this.getItems()[this.getItemIndex(this.getActiveItem()) + 1];
    if (!next && this.options.list.endless) next = this.getItems()[0];
    if (this.selectItem(next, true, !!e)) {
      if (e && e.stop) e.stop();
      return !!this.fireEvent('next', [next]);
    }
    return false;
  },

  previous: function(e) {
    this.makeItems();
    var previous = this.getItems()[this.getItemIndex(this.getActiveItem()) - 1];
    if (!previous && this.options.list.endless) previous = this.getItems().getLast();
    if (this.selectItem(previous, true)) {
      if (e && e.stop) e.stop();
      return !!this.fireEvent('previous', [previous]);
    }
    return false;
  }
  
});
/*
---
 
script: Choice.js
 
description: Trait that completes List. Allows one item to be chosen and one selected (think navigating to a menu item to select)
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait.List
 
provides: 
  - LSD.Trait.Choice
 
...
*/


LSD.Trait.Choice = new Class({
  
  selectItem: function(item, temp) {
    if (temp !== true) return this.parent.apply(this, arguments)
    if (item && !item.render) item = this.findItemByValue(item);
    if (!item && this.options.list.force) return false;
    
    var chosen = this.chosenItem;
    this.setSelectedItem.apply(this, arguments);
    if (item.choose() && chosen) chosen.forget();
    return item;
  },
  
  forgetChosenItem: function() {
    if (this.chosenItem) this.chosenItem.forget();
    delete this.chosenItem;
  },
  
  setSelectedItem: function(item, temp) {
    if (!temp) return this.parent.apply(this, arguments);
    this.chosenItem = item;
    this.fireEvent('choose', [item, this.getItemIndex()]);
    return item;
  },
  
  selectChosenItem: function() {
    return this.selectItem(this.chosenItem)
  },
  
  getSelectedOptionPosition: function() {
    var height = 0;
    if (!this.selectedItem) return height;
    for (var i = 0, j = this.list.length; i < j; i++) {
      if (this.list[i] == this.selectedItem) break;
      height += this.list[i].getLayoutHeight();
    }
    return height
  }
});
/*
---
 
script: UserSelect.js
 
description: Disable user selection cross-browserly by setting userSelect property
 
license: Public domain (http://unlicense.org).
 
requires:
- Core/Element
 
provides: [Element.Properties.userSelect]
 
...
*/

(function() {
  if (Browser.chrome || Browser.safari)
    var property = Browser.version == 525 ? 'WebkitUserSelect' : 'KhtmlUserSelect';
  else if (Browser.firefox)
    var property = 'MozUserSelect'
  else if (!Browser.ie)
    var property = 'UserSelect';
    
  Element.Properties.userSelect = {
    set: function(value) {
      if (!property) this.unselectable = value ? 'on' : 'off'
      else this.style[property] = value ? 'inherit' : 'none';
    }
  }
})();
/*
---

name: Element.Event

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events.

license: MIT-style license.

requires: [Element, Event]

provides: Element.Event

...
*/

(function(){

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

[Element, Window, Document].invoke('implement', {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		if (!events[type]) events[type] = {keys: [], values: []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type,
			custom = Element.Events[type],
			condition = fn,
			self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event)) return fn.call(this, event);
					return true;
				};
			}
			realType = custom.base || realType;
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new Event(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn, arguments[2]);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var list = events[type];
		var index = list.keys.indexOf(fn);
		if (index == -1) return this;
		var value = list.values[index];
		delete list.keys[index];
		delete list.values[index];
		var custom = Element.Events[type];
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn);
			type = custom.base || type;
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value, arguments[2]) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			attached[events].keys.each(function(fn){
				this.removeEvent(events, fn);
			}, this);
			delete attached[events];
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		args = Array.from(args);

		events[type].keys.each(function(fn){
			if (delay) fn.delay(delay, this, args);
			else fn.apply(this, args);
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var events = from.retrieve('events');
		if (!events) return this;
		if (!type){
			for (var eventType in events) this.cloneEvents(from, eventType);
		} else if (events[type]){
			events[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

// IE9
try {
	if (typeof HTMLElement != 'undefined')
		HTMLElement.prototype.fireEvent = Element.prototype.fireEvent;
} catch(e){}

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	orientationchange: 2, // mobile
	touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
	gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, //form elements
	load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

var check = function(event){
	var related = event.relatedTarget;
	if (related == null) return true;
	if (!related) return false;
	return (related != this && related.prefix != 'xul' && typeOf(this) != 'document' && !this.contains(related));
};

Element.Events = {

	mouseenter: {
		base: 'mouseover',
		condition: check
	},

	mouseleave: {
		base: 'mouseout',
		condition: check
	},

	mousewheel: {
		base: (Browser.firefox) ? 'DOMMouseScroll' : 'mousewheel'
	}

};

//<1.2compat>

Element.Events = new Hash(Element.Events);

//</1.2compat>

})();

/*
---

name: Element.defineCustomEvent

description: Allows to create custom events based on other custom events.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event]

provides: Element.defineCustomEvent

...
*/

(function(){

[Element, Window, Document].invoke('implement', {hasEvent: function(event){
	var events = this.retrieve('events'),
		list = (events && events[event]) ? events[event].values : null;
	if (list){
		for (var i = list.length; i--;) if (i in list){
			return true;
		}
	}
	return false;
}});

var wrap = function(custom, method, extended, name){
	method = custom[method];
	extended = custom[extended];

	return function(fn, customName){
		if (!customName) customName = name;

		if (extended && !this.hasEvent(customName)) extended.call(this, fn, customName);
		if (method) method.call(this, fn, customName);
	};
};

var inherit = function(custom, base, method, name){
	return function(fn, customName){
		base[method].call(this, fn, customName || name);
		custom[method].call(this, fn, customName || name);
	};
};

var events = Element.Events;

Element.defineCustomEvent = function(name, custom){

	var base = events[custom.base];

	custom.onAdd = wrap(custom, 'onAdd', 'onSetup', name);
	custom.onRemove = wrap(custom, 'onRemove', 'onTeardown', name);

	events[name] = base ? Object.append({}, custom, {

		base: base.base,

		condition: function(event){
			return (!base.condition || base.condition.call(this, event)) &&
				(!custom.condition || custom.condition.call(this, event));
		},

		onAdd: inherit(custom, base, 'onAdd', name),
		onRemove: inherit(custom, base, 'onRemove', name)

	}) : custom;

	return this;

};

var loop = function(name){
	var method = 'on' + name.capitalize();
	Element[name + 'CustomEvents'] = function(){
		Object.each(events, function(event, name){
			if (event[method]) event[method].call(event, name);
		});
	};
	return loop;
};

loop('enable')('disable');

})();

/*
---

name: Mouse

description: Maps mouse events to their touch counterparts

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Mouse

...
*/

if (!Browser.Features.Touch) (function(){

var condition = function(event){
	event.targetTouches = [];
	event.changedTouches = event.touches = [{
		pageX: event.page.x, pageY: event.page.y,
		clientX: event.client.x, clientY: event.client.y
	}];

	return true;
};


var mouseup = function(e) {
  var target = e.target;
  while (target != this && (target = target.parentNode));
  this.fireEvent(target ? 'touchend' : 'touchcancel', arguments);
  document.removeEvent('mouseup', this.retrieve('touch:mouseup'));
};

Element.defineCustomEvent('touchstart', {

	base: 'mousedown',

	condition: function() {
	  var bound = this.retrieve('touch:mouseup');
	  if (!bound) {
	    bound = mouseup.bind(this);
	    this.store('touch:mouseup', bound);
	  }
	  document.addEvent('mouseup', bound);
	  return condition.apply(this, arguments);
	}

}).defineCustomEvent('touchmove', {

	base: 'mousemove',

	condition: condition

})

})();

/*
---

name: Touch

description: Provides a custom touch event on mobile devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Touch

...
*/

(function(){

var preventDefault = function(event){
	event.preventDefault();
};

var disabled;

Element.defineCustomEvent('touch', {

	base: 'touchend',

	condition: function(event){
		if (disabled || event.targetTouches.length != 0) return false;

		var touch = event.changedTouches[0],
			target = document.elementFromPoint(touch.clientX, touch.clientY);

		do {
			if (target == this) return true;
		} while ((target = target.parentNode) && target);

		return false;
	},

	onSetup: function(){
		this.addEvent('touchstart', preventDefault);
	},

	onTeardown: function(){
		this.removeEvent('touchstart', preventDefault);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
	}

});

})();

/*
---

name: Click

description: Provides a replacement for click events on mobile devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Touch]

provides: Click

...
*/

if (Browser.Features.iOSTouch) (function(){

var name = 'click';
delete Element.NativeEvents[name];

Element.defineCustomEvent(name, {

	base: 'touch'

});

})();

/*
---
 
script: Touchable.js
 
description: A mousedown event that lasts even when you move your mouse over. 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Mobile/Mouse
  - Mobile/Click
  - Mobile/Touch

 
provides:   
  - LSD.Mixin.Touchable
 
...
*/


LSD.Mixin.Touchable = new Class({
  behaviour: ':touchable',
  
  Stateful: {
    'active': ['activate', 'deactivate']
  },
  
  options: {
    events: {
      enabled: {
        element: {
          'touchstart': 'activate',
          'touchend': 'onClick',
          'touchcancel': 'deactivate'
        }
      }
    }
  },
  
  onClick: function() {
    this.deactivate();
    this.click();
  }
});
/*
---

name: DOMReady

description: Contains the custom event domready.

license: MIT-style license.

requires: [Browser, Element, Element.Event]

provides: [DOMReady, DomReady]

...
*/

(function(window, document){

var ready,
	loaded,
	checks = [],
	shouldPoll,
	timer,
	isFramed = true;

// Thanks to Rich Dougherty <http://www.richdougherty.com/>
try {
	isFramed = window.frameElement != null;
} catch(e){}

var domready = function(){
	clearTimeout(timer);
	if (ready) return;
	Browser.loaded = ready = true;
	document.removeListener('DOMContentLoaded', domready).removeListener('readystatechange', check);
	
	document.fireEvent('domready');
	window.fireEvent('domready');
};

var check = function(){
	for (var i = checks.length; i--;) if (checks[i]()){
		domready();
		return true;
	}

	return false;
};

var poll = function(){
	clearTimeout(timer);
	if (!check()) timer = setTimeout(poll, 10);
};

document.addListener('DOMContentLoaded', domready);

// doScroll technique by Diego Perini http://javascript.nwbox.com/IEContentLoaded/
var testElement = document.createElement('div');
if (testElement.doScroll && !isFramed){
	checks.push(function(){
		try {
			testElement.doScroll();
			return true;
		} catch (e){}

		return false;
	});
	shouldPoll = true;
}

if (document.readyState) checks.push(function(){
	var state = document.readyState;
	return (state == 'loaded' || state == 'complete');
});

if ('onreadystatechange' in document) document.addListener('readystatechange', check);
else shouldPoll = true;

if (shouldPoll) poll();

Element.Events.domready = {
	onAdd: function(fn){
		if (ready) fn.call(this);
	}
};

// Make sure that domready fires before load
Element.Events.load = {
	base: 'load',
	onAdd: function(fn){
		if (loaded && this == window) fn.call(this);
	},
	condition: function(){
		if (this == window){
			domready();
			delete Element.Events.load;
		}
		
		return true;
	}
};

// This is based on the custom load event
window.addEvent('load', function(){
	loaded = true;
});

})(window, document);

/*
---
 
script: Keypress.js
 
description: A wrapper to cross-browser keypress keyboard event implementation.
 
license: MIT-style license.
 
requires:
- Core/Element.Event
- Core/Event
- Event.KeyNames
 
provides: [Element.Events.keypress]
 
...
*/

(function() {
	Element.Events.keypress = {
		base: 'keydown',
		
		onAdd: function(fn) {
			if (!this.retrieve('keypress:listeners')) {
				var events = {
					keypress: function(e) {
						var event = new Event(e)//$extend({}, e);
						event.repeat = (event.code == this.retrieve('keypress:code'));
						event.code = this.retrieve('keypress:code');
						event.key = this.retrieve('keypress:key');
						event.type = 'keypress';
						event.from = 'keypress';
            if (event.repeat) this.fireEvent('keypress', event)
					}.bind(this),
					keyup: function() {
						this.eliminate('keypress:code');
						this.eliminate('keypress:key');
					}
				}
				this.store('keypress:listeners', events);
				for (var type in events) this.addListener(type, events[type]);
			}
		},
		
		onRemove: function() {
			var events = this.retrieve('keypress:listeners');
			for (var type in events) this.removeListener(type, events[type]);
			this.eliminate('keypress:listeners');
		},
		
		condition: function(event) {
		  var key = Event.Keys.keyOf(event.code) || event.key;
		  event.repeat = (key == this.retrieve('keypress:key'));
			this.store('keypress:code', event.code);
		  this.store('keypress:key', key);
			if (!event.firesKeyPressEvent(event.code))   {
				event.type = 'keypress';
				event.from = 'keypress';
				event.key = key;
			  return true;
			}
		}
	};
})();
/*
---
 
script: Accessibility.js
 
description: Basic keyboard shortcuts support for any focused widget 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Element.Event
  - Ext/Element.Events.keypress
 
provides: 
  - Shortcuts
  - LSD.Trait.Accessibility
 
...
*/

(function() {
  var parsed = {};
  var modifiers = ['shift', 'control', 'alt', 'meta'];
  var aliases = {
    'ctrl': 'control',
    'command': Browser.Platform.mac ? 'meta': 'control',
    'cmd': Browser.Platform.mac ? 'meta': 'control'
  };
  var presets = {
    'next': ['right', 'down'],
    'previous': ['left', 'up'],
    'ok': ['enter', 'space'],
    'cancel': ['esc']
  };

  var parse = function(expression){
    if (presets[expression]) expression = presets[expression];
    return $splat(expression).map(function(type) {
      if (!parsed[type]){
        var bits = [], mods = {}, string, event;
        if (type.contains(':')) {
          string = type.split(':');
          event = string[0];
          string = string[1];
        } else {  
          string = type;
          event = 'keypress';
        }
        string.split('+').each(function(part){
          if (aliases[part]) part = aliases[part];
          if (modifiers.contains(part)) mods[part] = true;
          else bits.push(part);
        });

        modifiers.each(function(mod){
          if (mods[mod]) bits.unshift(mod);
        });

        parsed[type] = event + ':' + bits.join('+');
      }
      return parsed[type];
    });
  };
  
  Shortcuts = new Class({
    
    addShortcuts: function(shortcuts, internal) {
      Hash.each(shortcuts, function(fn, shortcut) {
        this.addShortcut(shortcut, fn, internal);
      }, this)
    },

    removeShortcuts: function(shortcuts, internal) {
      Hash.each(shortcuts, function(fn, shortcut) {
        this.removeShortcut(shortcut, fn, internal);
      }, this)
    },
    
    addShortcut: function(shortcut, fn, internal) {
      parse(shortcut).each(function(cut) {
        this.addEvent(cut, fn, internal)
      }, this)
    },
    
    removeShortcut: function(shortcut, fn, internal) {
      parse(shortcut).each(function(cut) {
        this.removeEvent(cut, fn, internal)
      }, this)
    },
    
    getKeyListener: Macro.defaults(function() {
      return this.element;
    }),

    enableShortcuts: function() {
      if (!this.shortcutter) {
        this.shortcutter = function(event) {
          var bits = [event.key];
          modifiers.each(function(mod){
            if (event[mod]) bits.unshift(mod);
          });
          this.fireEvent(event.type + ':' + bits.join('+'), arguments)
        }.bind(this)
      }
      if (this.shortcutting) return;
      this.shortcutting = true;
      this.getKeyListener().addEvent('keypress', this.shortcutter);
    },

    disableShortcuts: function() {
      if (!this.shortcutting) return;
      this.shortcutting = false;
      this.getKeyListener().removeEvent('keypress', this.shortcutter);
    }
  });
  
})();



LSD.Trait.Accessibility = new Class({
  
  Implements: [Shortcuts],
  
  options: {
    events: {
      _accessibility: {
        focus: 'enableShortcuts',
        blur: 'disableShortcuts'
      }
    },
    shortcuts: {}
  },
  
  attach: Macro.onion(function() {
    var shortcuts = this.bindEvents(this.options.shortcuts);
    for (var shortcut in shortcuts) this.addShortcut(shortcut, shortcuts[shortcut]);
  }),
  
  detach: Macro.onion(function() {
    var shortcuts = this.bindEvents(this.options.shortcuts);
    for (var shortcut in shortcuts) this.removeShortcut(shortcut, shortcuts[shortcut]);
  })
});
/*
---

name: Element.Style

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires: Element

provides: Element.Style

...
*/

(function(){

var html = document.html;

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

var hasOpacity = (html.style.opacity != null);
var reAlpha = /alpha\(opacity=([\d.]+)\)/i;

var setOpacity = function(element, opacity){
	if (!element.currentStyle || !element.currentStyle.hasLayout) element.style.zoom = 1;
	if (hasOpacity){
		element.style.opacity = opacity;
	} else {
		opacity = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
		var filter = element.style.filter || element.getComputedStyle('filter') || '';
		element.style.filter = reAlpha.test(filter) ? filter.replace(reAlpha, opacity) : filter + opacity;
	}
};

Element.Properties.opacity = {

	set: function(opacity){
		var visibility = this.style.visibility;
		if (opacity == 0 && visibility != 'hidden') this.style.visibility = 'hidden';
		else if (opacity != 0 && visibility != 'visible') this.style.visibility = 'visible';

		setOpacity(this, opacity);
	},

	get: (hasOpacity) ? function(){
		var opacity = this.style.opacity || this.getComputedStyle('opacity');
		return (opacity == '') ? 1 : opacity;
	} : function(){
		var opacity, filter = (this.style.filter || this.getComputedStyle('filter'));
		if (filter) opacity = filter.match(reAlpha);
		return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
	}

};

var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat';

Element.implement({

	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var defaultView = Element.getDocument(this).defaultView,
			computed = defaultView ? defaultView.getComputedStyle(this, null) : null;
		return (computed) ? computed.getPropertyValue((property == floatName) ? 'float' : property.hyphenate()) : null;
	},

	setOpacity: function(value){
		setOpacity(this, value);
		return this;
	},

	getOpacity: function(){
		return this.get('opacity');
	},

	setStyle: function(property, value){
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = floatName;
		}
		property = property.camelCase();
		if (typeOf(value) != 'string'){
			var map = (Element.Styles[property] || '@').split(' ');
			value = Array.from(value).map(function(val, i){
				if (!map[i]) return '';
				return (typeOf(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		return this;
	},

	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = floatName;
		}
		property = property.camelCase();
		var result = this.style[property];
		if (!result || property == 'zIndex'){
			result = [];
			for (var style in Element.ShortStyles){
				if (property != style) continue;
				for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (Browser.opera || (Browser.ie && isNaN(parseFloat(result)))){
			if ((/^(height|width)$/).test(property)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if (Browser.opera && String(result).indexOf('px') != -1) return result;
			if ((/^border(.+)Width|margin|padding/).test(property)) return '0px';
		}
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = {
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
};

//<1.2compat>

Element.Styles = new Hash(Element.Styles);

//</1.2compat>

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});

})();

/*
---

script: Drag.js

name: Drag

description: The base Drag Class. Can be used to drag and resize Elements using mouse events.

license: MIT-style license

authors:
  - Valerio Proietti
  - Tom Occhinno
  - Jan Kassens

requires:
  - Core/Events
  - Core/Options
  - Core/Element.Event
  - Core/Element.Style
  - /MooTools.More

provides: [Drag]
...

*/

var Drag = new Class({

	Implements: [Events, Options],

	options: {/*
		onBeforeStart: function(thisElement){},
		onStart: function(thisElement, event){},
		onSnap: function(thisElement){},
		onDrag: function(thisElement, event){},
		onCancel: function(thisElement){},
		onComplete: function(thisElement, event){},*/
		snap: 6,
		unit: 'px',
		grid: false,
		style: true,
		limit: false,
		handle: false,
		invert: false,
		preventDefault: false,
		stopPropagation: false,
		modifiers: {x: 'left', y: 'top'}
	},

	initialize: function(){
		var params = Array.link(arguments, {
			'options': Type.isObject, 
			'element': function(obj){
				return obj != null;
			}
		});
		
		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = typeOf(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};

		this.selection = (Browser.ie) ? 'selectstart' : 'mousedown';

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: Function.from(false)
		};
		this.attach();
	},

	attach: function(){
		this.handles.addEvent('mousedown', this.bound.start);
		return this;
	},

	detach: function(){
		this.handles.removeEvent('mousedown', this.bound.start);
		return this;
	},

	start: function(event){
		var options = this.options;
		
		if (event.rightClick) return;
		
		if (options.preventDefault) event.preventDefault();
		if (options.stopPropagation) event.stopPropagation();
		this.mouse.start = event.page;
		
		this.fireEvent('beforeStart', this.element);
		
		var limit = options.limit;
		this.limit = {x: [], y: []};
		for (var z in options.modifiers){
			if (!options.modifiers[z]) continue;
			
			if (options.style) this.value.now[z] = this.element.getStyle(options.modifiers[z]).toInt();
			else this.value.now[z] = this.element[options.modifiers[z]];
			
			if (options.invert) this.value.now[z] *= -1;
			this.mouse.pos[z] = event.page[z] - this.value.now[z];
			
			if (limit && limit[z]){
				var i = 2;
				while (i--){
					var limitZI = limit[z][i];
					if (limitZI || limitZI === 0) this.limit[z][i] = (typeof limitZI == 'function') ? limitZI() : limitZI;
				}
			}
		}
		
		if (typeOf(this.options.grid) == 'number') this.options.grid = {
			x: this.options.grid, 
			y: this.options.grid
		};
		
		var events = {
			mousemove: this.bound.check, 
			mouseup: this.bound.cancel
		};
		events[this.selection] = this.bound.eventStop;
		this.document.addEvents(events);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();
			this.document.addEvents({
				mousemove: this.bound.drag,
				mouseup: this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	drag: function(event){
		var options = this.options;
		
		if (options.preventDefault) event.preventDefault();
		this.mouse.now = event.page;
		
		for (var z in options.modifiers){
			if (!options.modifiers[z]) continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];
			if (options.invert) this.value.now[z] *= -1;
			
			if (options.limit && this.limit[z]){
				if ((this.limit[z][1] || this.limit[z][1] === 0) && (this.value.now[z] > this.limit[z][1])){
					this.value.now[z] = this.limit[z][1];
				} else if ((this.limit[z][0] || this.limit[z][0] === 0) && (this.value.now[z] < this.limit[z][0])){
					this.value.now[z] = this.limit[z][0];
				}
			}
			
			if (options.grid[z]) this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0]||0)) % options.grid[z]);
			if (options.style) {
				this.element.setStyle(options.modifiers[z], this.value.now[z] + options.unit);
			} else {
				this.element[options.modifiers[z]] = this.value.now[z];
			}
		}
		
		this.fireEvent('drag', [this.element, event]);
	},

	cancel: function(event){
		this.document.removeEvents({
			mousemove: this.bound.check,
			mouseup: this.bound.cancel
		});
		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		var events = {
			mousemove: this.bound.drag,
			mouseup: this.bound.stop
		};
		events[this.selection] = this.bound.eventStop;
		this.document.removeEvents(events);
		if (event) this.fireEvent('complete', [this.element, event]);
	}

});

Element.implement({

	makeResizable: function(options){
		var drag = new Drag(this, Object.merge({
			modifiers: {
				x: 'width', 
				y: 'height'
			}
		}, options));
		
		this.store('resizer', drag);
		return drag.addEvent('drag', function(){
			this.fireEvent('resize', drag);
		}.bind(this));
	}

});

/*
---
 
script: Resizable.js
 
description: Resize widget with the mouse freely
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - More/Drag

provides: 
  - LSD.Mixin.Resizable 
...
*/


LSD.Mixin.Resizable = new Class({
  behaviour: '[resizable][resizable!=false]',
  
  options: {
    resizer: {
      modifiers: {
        x: 'width',
        y: 'height'
      },
      snap: false,
      style: false,
      crop: false,
      handle: [],
      container: true,
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      },
    },
    actions: {
      resizable: {
        enable: function(handle, resizable) {
          this.handle = handle;
          this.resized = resizable || this;
          this.onStateChange('resizable', true);
          var resizer = this.resizer;
          if (resizer == this.getResizer(document.id(this.resized))) resizer.attach();
          if (handle) document.id(handle).addEvent('mousedown', this.resizer.bound.start);
          if (this.options.resizer.fit) this.fit(resizable)
        },

        disable: function(handle, content) {
          this.onStateChange('resizable', false);
          if (this.resizer) this.resizer.detach();
          if (handle) document.id(handle).removeEvent('mousedown', this.resizer.bound.start);
          delete this.resized, this.handle;
        },
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    var options = this.options.resizer;
    var rules = (new FastArray).concat(this.getAttribute('resizable').split(/\s+/));
    options.modifiers.x = (!rules.x && rules.y) ? false : 'width';
    options.modifiers.y = (!rules.y && rules.x) ? false : 'height';
    options.fit = !!rules.fit;
  },
  
  uninitialize: function() {
    if (this.handle) this.options.actions.resizable.disable.call(this, this.handle, this.resized);
    delete this.resizer;
  },
   
  getResizer: function(resized) {
    var element = resized
    if (this.resizer) {
      if (this.resizer.element == element) return this.resizer;
      return this.resizer.element = element;
    }
    var resizer = this.resizer = new Drag(element, Object.append(this.options, this.options.resizer));
    resizer.addEvents(this.events.resizer);
    resizer.addEvents({
      'beforeStart': this.onBeforeResize.bind(this),
      'start': this.onResizeStart.bind(this),
      'complete': this.onResizeComplete.bind(this),
      'cancel': this.onResizeComplete.bind(this),
      'drag': this.onResize.bind(this)
    }, true);
    return resizer;
  },
  
  check: function(size) {
    if (!this.resizer) return;
    var width = this.element.offsetWidth - this.offset.inner.left - this.offset.inner.right;
    if (!size) size = {width: this.resized.toElement().width}
    if (size.width < width) {
      if (!$chk(this.limit)) this.limit = this.resized.getStyle('minWidth') || 1
      this.resized.setStyle('minWidth', width);
      $clear(this.delay);
      this.delay = (function() { //reset limit options in one second
        this.resized.setStyle('minWidth', this.limit);
      }).delay(1000, this); 
      size.width = width;
    }
    return size;
  },
  
  onBeforeResize: function() {
    Object.append(this.resized.toElement(), this.resized.size)
  },
  
  onResizeStart: function() {
    this.onStateChange('resized', true);
    var getLiquid = function(child, prop) {
      var value = child.style.current[prop];
      return ((value == 'inherit') || (value == 'auto') || child.style.expressed[prop]) ? value : null
    }
    if (!this.liquid) {
      this.liquid = this.collect(function(c) { return getLiquid(c, 'width')}).include(this.resized);
      if (this.resized != this) {
        var style = this.resized.style.liquid = {};
        var width = getLiquid(this.resized, 'width');
        if (width) style.width = width;
        var height = getLiquid(this.resized, 'height');
        if (height) style.height = height;
      }
    }
  },
  
  onResizeComplete: function() {
    if (this.resized.style.liquid) this.resized.setStyles(this.resized.style.liquid);
    this.onStateChange('resized', false);
    delete this.liquid
  },
  
  onResize: function() {
    var now = this.resizer.value.now;
    var resized = this.resized;
    if (!resized.style.dimensions) {
      resized.style.dimensions = {};
      var width = resized.style.current.width
      if (width == 'auto') resized.style.dimensions.width = 'auto';
      var height = resized.toElement().getStyle('height');
      if (height == 'auto') resized.style.dimensions.height = 'auto';
    }
    if (!now.x) now.x = resized.size.width;
    if (!now.y) now.y = resized.size.height;
    var size = this.check({width: resized.setWidth(now.x) || now.x, height: resized.setHeight(now.y) || now.y});
    resized.setStyles(size);
    if (this.liquid) {
      this.liquid.each(function(child) {
        child.update();
      })
    }
    this.refresh();
  },
  
  fit: function(content) {
    if (!content) content = this.resized;
    var element = content.getWrapper();
    var display = element.getStyle('display');
    if (display != 'inline-block') element.setStyle('display', 'inline-block');
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    element.setStyle('display', display)
    content.setHeight(height);
    content.setWidth(width);
    this.refresh({
      maxWidth: width, maxHeight: height
    });
  },
  
  getScrolled: function() {
    return this.resized.getWrapper();
  }
});
/*
---
 
script: Drag.Limits.js
 
description: A set of function to easily cap Drag's limit
 
license: MIT-style license.
 
requires:
- More/Drag

provides: [Drag.Limits]
 
...
*/

Drag.implement({
  setMaxX: function(x) {
    var limit = this.options.limit;
    limit.x[1] = x//Math.max(x, limit.x[1]);
    limit.x[0] = Math.min(limit.x[0], limit.x[1]);
  },
  
  setMaxY: function(y) {
    var limit = this.options.limit;
    limit.y[1] = y//Math.max(y, limit.y[1]);
    limit.y[0] = Math.min(limit.y[0], limit.y[1]);
  },
  
  setMinX: function(x) {
    var limit = this.options.limit;
    limit.x[0] = x//Math.min(x, limit.x[0]);
    limit.x[1] = Math.max(limit.x[1], limit.x[0]);
  },
  
  setMinY: function(y) {
    var limit = this.options.limit;
    limit.y[0] = y//Math.min(y, limit.y[0]);
    limit.y[1] = Math.max(limit.y[1], limit.y[0]);
  }
});

/*
---
 
script: Draggable.js
 
description: Drag widget around the screen
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD
- More/Drag

provides: [LSD.Mixin.Draggable]
 
...
*/

LSD.Mixin.Draggable = new Class({
  behaviour: '[draggable][draggable!=false]',
  
  options: {
    dragger: {
      modifiers: {
        x: 'left',
        y: 'top'
      },
      snap: 5,
      style: false,
      container: true,
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      },
      handle: []
    },
    actions: {
      draggable: {
        enable: function(handle) {
          if (this.index++ == 0) {
            if (this.dragger) this.dragger.attach();
            else this.getDragger();
            this.onStateChange('draggable', true);
          }
          if (!handle) return;
          this.handles.push(handle);
          document.id(handle).addEvent('mousedown', this.dragger.bound.start);
        },
        
        disable: function(handle) {
          if (!this.dragger) return;
          if (--this.index == 0) {
            this.onStateChange('draggable', false);
            this.dragger.detach();
          }
          if (!handle) return;
          this.handles.erase(handle)
          document.id(handle).removeEvent('mousedown', this.dragger.bound.start);
        }
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.handles = [];
    this.index = 0;
  },
  
  unitialize: function() {
    this.handles.each(this.options.actions.draggable.disable, this);
    this.onStateChange('draggable', false);
    delete this.dragger;
  },
  
  getDragger: Macro.getter('dragger', function() {
    var element = this.element;
    this.onDOMInject(function() {
      var position = element.getPosition();
      element.left = position.x - element.getStyle('margin-left').toInt();
      element.top = position.y - element.getStyle('margin-top').toInt();
    }.create({delay: 50}));
    var dragger = new Drag(element, Object.append(this.options.dragger, this.options.dragger));
    dragger.addEvents(this.events.dragger);
    dragger.addEvents({
      'start': this.onDragStart.bind(this),
      'complete': this.onDragComplete.bind(this),
      'cancel': this.onDragComplete.bind(this),
      'drag': this.onDrag.bind(this)
    }, true);
    return dragger;
  }),
  
  onDragStart: function() {
    this.onStateChange('dragged', true);
  },
  
  onDragComplete: function() {
    this.onStateChange('dragged', false);
  },
  
  onDrag: function() {
    this.setStyles({
      top: this.dragger.value.now.y,
      left: this.dragger.value.now.x
    });
  }
  
});
/*
---

name: Element.Dimensions

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
  - Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
  - Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires: [Element, Element.Style]

provides: [Element.Dimensions]

...
*/

(function(){

var element = document.createElement('div'),
	child = document.createElement('div');
element.style.height = '0';
element.appendChild(child);
var brokenOffsetParent = (child.offsetParent === element);
element = child = null;

var isOffset = function(el){
	return styleString(el, 'position') != 'static' || isBody(el);
};

var isOffsetStatic = function(el){
	return isOffset(el) || (/^(?:table|td|th)$/i).test(el.tagName);
};

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this.parentNode, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: brokenOffsetParent ? function(){
		var element = this;
		if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

		var isOffsetCheck = (styleString(element, 'position') == 'static') ? isOffsetStatic : isOffset;
		while ((element = element.parentNode)){
			if (isOffsetCheck(element)) return element;
		}
		return null;
	} : function(){
		var element = this;
		if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

		try {
			return element.offsetParent;
		} catch(e) {}
		return null;
	},

	getOffsets: function(){
		if (this.getBoundingClientRect && !Browser.Platform.ios){
			var bound = this.getBoundingClientRect(),
				html = document.id(this.getDocument().documentElement),
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toInt() + elemScrolls.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toInt()  + elemScrolls.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;

			if (Browser.firefox){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.safari){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}

			element = element.offsetParent;
		}
		if (Browser.firefox && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
		return position;
	},

	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(),
			scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};
		
		if (relative && (relative = document.id(relative))){
			var relativePosition = relative.getPosition();
			return {x: position.x - relativePosition.x - leftBorder(relative), y: position.y - relativePosition.y - topBorder(relative)};
		}
		return position;
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
			size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


[Document, Window].invoke('implement', {

	getSize: function(){
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this),
			min = this.getSize(),
			body = this.getDocument().body;

		return {x: Math.max(doc.scrollWidth, body.scrollWidth, min.x), y: Math.max(doc.scrollHeight, body.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
};

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
};

function topBorder(element){
	return styleNumber(element, 'border-top-width');
};

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
};

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
};

})();

//aliases
Element.alias({position: 'setPosition'}); //compatability

[Window, Document, Element].invoke('implement', {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});

/*
---

script: Element.Measure.js

name: Element.Measure

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - Core/Element.Dimensions
  - /MooTools.More

provides: [Element.Measure]

...
*/

(function(){

var getStylesList = function(styles, planes){
	var list = [];
	Object.each(planes, function(directions){
		Object.each(directions, function(edge){
			styles.each(function(style){
				if (style == 'border') list.push(style + '-' + edge + '-width');
				else list.push(style + '-' + edge);
			});
		});
	});
	return list;
};

var calculateEdgeSize = function(edge, styles){
	var total = 0;
	Object.each(styles, function(value, style){
		if (style.test(edge)) total += value.toInt();
	});
	return total;
};


Element.implement({

	measure: function(fn){
		var visibility = function(el){
			return !!(!el || el.offsetHeight || el.offsetWidth);
		};
		if (visibility(this)) return fn.apply(this);
		var parent = this.getParent(),
			restorers = [],
			toMeasure = [];
		while (!visibility(parent) && parent != document.body){
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose();
		var result = fn.apply(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return function(){};
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = Object.merge({computeSize: false}, options);
		var dim = {};
		
		var getSize = function(el, options){
			return (options.computeSize) ? el.getComputedSize(options) : el.getSize();
		};
		
		var parent = this.getParent('body');
		
		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		} else {
			dim = {x: 0, y: 0};
		}
		
		return Object.append(dim, (dim.x || dim.x === 0) ?  {
				width: dim.x,
				height: dim.y
			} : {
				x: dim.width,
				y: dim.height
			}
		);
	},

	getComputedSize: function(options){
		//<1.2compat>
		//legacy support for my stupid spelling error
		if (options && options.plains) options.planes = options.plains;
		//</1.2compat>
		
		options = Object.merge({
			styles: ['padding','border'],
			planes: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);

		var styles = {},
			size = {width: 0, height: 0};

		switch (options.mode){
			case 'vertical':
				delete size.width;
				delete options.planes.width;
				break;
			case 'horizontal':
				delete size.height;
				delete options.planes.height;
				break;
		}


		getStylesList(options.styles, options.planes).each(function(style){
			styles[style] = this.getStyle(style).toInt();
		}, this);

		Object.each(options.planes, function(edges, plane){

			var capitalized = plane.capitalize();
			styles[plane] = this.getStyle(plane).toInt();
			size['total' + capitalized] = styles[plane];

			edges.each(function(edge){
				var edgesize = calculateEdgeSize(edge, styles);
				size['computed' + edge.capitalize()] = edgesize;
				size['total' + capitalized] += edgesize;
			});
			
		}, this);
		
		return Object.append(size, styles);
	}

});

})();

/*
---

script: Slider.js

name: Slider

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Element.Dimensions
  - /Class.Binds
  - /Drag
  - /Element.Measure

provides: [Slider]

...
*/

var Slider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob', 'scrolledElement'],

	options: {/*
		onTick: function(intPosition){},
		onChange: function(intStep){},
		onComplete: function(strStep){},*/
		onTick: function(position){
			if (this.options.snap) position = this.toPosition(this.step);
			this.knob.setStyle(this.property, position);
		},
		initialStep: 0,
		snap: false,
		offset: 0,
		range: false,
		wheel: false,
		steps: 100,
		mode: 'horizontal'
	},

	initialize: function(element, knob, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.knob = document.id(knob);
		this.previousChange = this.previousEnd = this.step = -1;
		var offset, limit = {}, modifiers = {'x': false, 'y': false};
		switch (this.options.mode){
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				offset = 'offsetWidth';
		}
		
		this.full = this.element.measure(function(){ 
			this.half = this.knob[offset] / 2; 
			return this.element[offset] - this.knob[offset] + (this.options.offset * 2); 
		}.bind(this));
		
		this.setRange(this.options.range);

		this.knob.setStyle('position', 'relative').setStyle(this.property, this.options.initialStep ? this.toPosition(this.options.initialStep) : - this.options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [- this.options.offset, this.full - this.options.offset];

		var dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.draggedKnob,
			onStart: this.draggedKnob,
			onBeforeStart: (function(){
				this.isDragging = true;
			}).bind(this),
			onCancel: function(){
				this.isDragging = false;
			}.bind(this),
			onComplete: function(){
				this.isDragging = false;
				this.draggedKnob();
				this.end();
			}.bind(this)
		};
		if (this.options.snap){
			dragOptions.grid = Math.ceil(this.stepWidth);
			dragOptions.limit[this.axis][1] = this.full;
		}

		this.drag = new Drag(this.knob, dragOptions);
		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.clickedElement);
		this.element.removeEvent('mousewheel', this.scrolledElement);
		this.drag.detach();
		return this;
	},

	set: function(step){
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = Math.round(step);
		this.checkStep();
		this.fireEvent('tick', this.toPosition(this.step));
		this.end();
		return this;
	},
	
	setRange: function(range, pos){
		this.min = Array.pick([range[0], 0]);
		this.max = Array.pick([range[1], this.options.steps]);
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range);
		this.set(Array.pick([pos, this.step]).floor(this.min).max(this.max));
		return this;
	},

	clickedElement: function(event){
		if (this.isDragging || event.target == this.knob) return;

		var dir = this.range < 0 ? -1 : 1;
		var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
		position = position.limit(-this.options.offset, this.full -this.options.offset);

		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
		this.fireEvent('tick', position);
		this.end();
	},

	scrolledElement: function(event){
		var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
		this.set(mode ? this.step - this.stepSize : this.step + this.stepSize);
		event.stop();
	},

	draggedKnob: function(){
		var dir = this.range < 0 ? -1 : 1;
		var position = this.drag.value.now[this.axis];
		position = position.limit(-this.options.offset, this.full -this.options.offset);
		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
	},

	checkStep: function(){
		if (this.previousChange != this.step){
			this.previousChange = this.step;
			this.fireEvent('change', this.step);
		}
	},

	end: function(){
		if (this.previousEnd !== this.step){
			this.previousEnd = this.step;
			this.fireEvent('complete', this.step + '');
		}
	},

	toStep: function(position){
		var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
	},

	toPosition: function(step){
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
	}

});

/*
---
 
script: Slider.js
 
description: Methods to update slider without reinitializing the thing
 
license: MIT-style license.
 
requires:
- Drag.Limits
- More/Slider

provides: [Slider.prototype.update]
 
...
*/


Slider.implement({
  update: function() {
		var offset = (this.options.mode == 'vertical') ?  'offsetHeight' : 'offsetWidth'
		this.half = this.knob[offset] / 2; 
		this.full =  this.element[offset] - this.knob[offset] + (this.options.offset * 2); 
		
		//this.setRange(this.options.range);

		this.knob.setStyle(this.property, this.toPosition(this.step));
		var X = this.axis.capitalize();
		this.drag['setMin' + X](- this.options.offset)
		this.drag['setMax' + X](this.full - this.options.offset)
  }
})
/*
---
 
script: Slider.js
 
description: Because sometimes slider is the answer
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - More/Slider
  - Ext/Slider.prototype.update
  - Ext/Class.hasParent

provides: 
  - LSD.Trait.Slider
 
...
*/

LSD.Trait.Slider = new Class({
  
  options: {
    actions: {
      slider: {
        enable: function() {
          if (!this.slider) this.getSlider();
          else this.slider.attach();
        },

        disable: function() {
          if (this.slider) this.slider.detach()
        }
      }
    },
    events: {
      parent: {
        resize: 'onParentResize'
      },
      slider: {}
    },
    slider: {},
    value: 0,
    mode: 'horizontal',
  },
  
  onParentResize: function(current, old) {
    if (this.slider) this.slider.update();
  },
  
  getSlider: Macro.getter('slider', function (update) {
    var slider = new Slider(document.id(this.getTrack()), document.id(this.getTrackThumb()), $merge(this.options.slider, {
      mode: this.options.mode
    })).set(parseFloat(this.options.value));
    slider.addEvent('change', this.onSet.bind(this));
    slider.addEvents(this.events.slider)
    return slider;
  }),
  
  onSet: Macro.defaults($lambda(true)),
  
  getTrack: Macro.defaults(function() {
    return this
  }),
  
  getTrackThumb: Macro.defaults(function() {
    return this.thumb;
  }),
  
  increment: function() {
    this.slider.set((this.slider.step || 0) + 10)
  },
  
  decrement: function() {
    this.slider.set((this.slider.step || 0) - 10)
  }
  
});

Slider = new Class({
  Extends: Slider,
  
  initialize: function() {
    Array.from(this.Binds).each(function(name){
      var original = this[name];
      if (original) this[name] = original.bind(this);
    }, this);
    return this.parent.apply(this, arguments);
  }
})
/*
---
 
script: Styles.js
 
description: Set, get and render different kind of styles on widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Element.Style
  - Ext/FastArray
  - Sheet/SheetParser.Styles

provides: 
  - LSD.Module.Styles

...
*/

(function() {
  
var CSS = SheetParser.Styles, Paint = LSD.Styles;
var setStyle = function(element, property, value, type) {
  delete this.style.expressed[property];
  delete this.style.calculated[property];
  if (value === false) {
    if (element && this.element) delete this.element.style[property];
    delete this.style[element ? 'element' : 'paint'][property], this.style.current[property];
    if (type) delete this.style[type][property];
  } else {
    if (element && this.element) this.element.style[property] = (typeof value == 'number') ? value + 'px' : value;
    this.style[element ? 'element' : 'paint'][property] = this.style.current[property] = value;
    if (type) this.style[type][property] = value;
  }
}

LSD.Module.Styles = new Class({
  
  options: {
    styles: {}
  },

  initialize: function() {
    this.style = {
      current: {},    //styles that widget currently has
      found: {},      //styles that were found in stylesheets
      given: {},      //styles that were manually assigned

      changed: {},    //styles that came from stylesheet since last render
      calculated: {}, //styles that are calculated in runtime
      computed: {},   //styles that are already getStyled
      expressed: {},  //styles that are expressed through function
      implied: {},    //styles that are assigned by environment

      element: {},    //styles that are currently assigned to element
      paint: {}       //styles that are currently used to paint
    };
    this.rules = [];
    this.parent.apply(this, arguments);
    Object.append(this.style.current, this.options.styles);
    for (var property in this.style.current) this.setStyle(property, this.style.current[property])
  },

  setStyle: function(property, value) {
    var paint, css;
    if (!(paint = Paint[property]) && !(css = CSS[property])) return false;
    var length = arguments.length;
    if (length > 2) {
      if (arguments[length - 1] in this.style) var type = arguments[--length];
      if (length > 2) value = Array.prototype.splice.call(arguments, 1, length);
    }
    if (value.call) {
      var expression = value;
      value = value.call(this, property);
    }
    var result = (css || paint)[value.push ? 'apply' : 'call'](this, value);
    if (property == 'stroke') console.info(value, result, $t = this, this.element);
    //if (property == 'glyphPosition') alert([property, JSON.stringify(result)])
    if (result === true || result === false) setStyle.call(this, css, property, value, type);
    else for (var prop in result) setStyle.call(this, css, prop, result[prop], type);
    if (expression) {
      this.style.expressed[property] = expression
      this.style.computed[property] = value
    }
    return result;
  },

  setStyles: function(style, type) {
    for (var key in style) this.setStyle(key, style[key], type)
  },

  getStyle: function(property) {
    if (this.style.computed[property]) return this.style.computed[property];
    var value;
    var definition = Paint[property] || CSS[property];
    if (!definition) return;
    if (definition.properties) return definition.properties.map(this.getStyle.bind(this));
    var expression = this.style.expressed[property];    
    if (expression) {
      value = this.style.current[property] = this.calculateStyle(property, expression);
    } else {  
      value = this.style.current[property];
      if (property == 'height') {
        if (typeof value !== 'number') value = this.getClientHeight();
      } else if (property == 'width') {
        if (typeof value !== 'number') value = this.getClientWidth();
      } else {
        if (value == "inherit") value = this.inheritStyle(property);
        if (value == "auto") value = this.calculateStyle(property);
      }
    }
    this.style.computed[property] = value;
    return value;
  },

  getStyles: function(properties) {
    var result = {};
    for (var i = 0, property, args = arguments; property = args[i++];) result[property] = this.getStyle(property);
    return result;
  },
  
  renderStyles: function(style) {
    var style = this.style, 
        current = style.current,
        paint = style.paint, 
        element = style.element,  
        found = style.found,
        implied = style.implied,
        calculated = style.calculated,
        given = Object.append(style.given, given),
        changed = style.changed;
    this.setStyles(given, 'given')
    for (var property in found) if ((property in changed) && !(property in given)) this.setStyle(property, found[property]);
    Object.append(style.current, style.implied);
    for (var property in element)  {
      if (!(property in given) && !(property in found) && !(property in calculated) && !(property in implied)) {
        this.element.style[property] = '';
        delete element[property]
      }
    }
    for (var property in current)  {
      if (!(property in given) && !(property in found) && !(property in calculated) && !(property in implied)) {
        delete current[property];
        delete paint[property];
      }
    }
  },
  
  combineRules: function(rule) {
    var rules = this.rules, style = this.style, found = style.found = {}, implied = style.implied = {}, changed = style.changed;
    for (var j = rules.length, other; other = rules[--j];) {
      var setting = other.style, implying = other.implied, self = (rule == other);
      if (setting) for (var property in setting) if (!(property in found)) {
        if (self) changed[property] = setting[property];
        found[property] = setting[property];
      }
      if (implying) for (var property in implying) if (!(property in implied)) implied[property] = implying[property];
    }
  },
  
  addRule: function(rule) {
    var rules = this.rules;
    if (rules.indexOf(rule) > -1) return
    for (var i = 0, other;  other = rules[i++];) {
      if ((other.specificity > rule.specificity) || ((other.specificity == rule.specificity) && (other.index > rule.index))) break;
    }
    rules.splice(--i, 0, rule);
    this.combineRules(rule);
  },
  
  removeRule: function(rule) {
    var rules = this.rules, index = rules.indexOf(rule)
    if (index == -1) return
    rules.splice(index, 1);
    this.combineRules();
    var style = this.style, found = style.found, changed = style.changed, setting = rule.style;
    if (setting) for (var property in setting) if (!Object.equals(found[property], setting[property])) changed[property] = found[property];
 },
  
  inheritStyle: function(property) {
    var node = this;
    var style = node.style.current[property];
    while ((style == 'inherit' || !style) && (node = node.parentNode)) style = node.style.current[property];
    return style;
  },
  
  calculateStyle: function(property, expression) {
    if (this.style.calculated[property]) return this.style.calculated[property];
    var value;
    if (expression) {
      value = expression.call(this, property);
    } else {
      switch (property) {
        case "height":
          value = this.getClientHeight();
        case "width":
          value = this.inheritStyle(property);
          if (value == "auto") value = this.getClientWidth();
        case "height": case "width":  
          //if dimension size is zero, then the widget is not in DOM yet
          //so we wait until the root widget is injected, and then try to repeat
          if (value == 0 && (this.redraws == 0)) this.halt();
      }
    }
    this.style.calculated[property] = value;
    return value;
  },
  
  update: Macro.onion(function() {
    this.style.calculated = {};
    this.style.computed = {};
  })
});


})();
/*
---

name: Fx.CSS

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires: [Fx, Element.Style]

provides: Fx.CSS

...
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = Array.from(values);
		if (values[1] == null){
			values[1] = values[0];
			values[0] = element.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},

	//parses a value into an array

	parse: function(value){
		value = Function.from(value)();
		value = (typeof value == 'string') ? value.split(' ') : Array.from(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Object.each(Fx.CSS.Parsers, function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if (parsed || parsed === 0) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = Function.from('fx:css:value');
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if (typeOf(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {}, selectorTest = new RegExp('^' + selector.escapeRegExp() + '$');
		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.contains('://') && !href.contains(document.domain)) return;
			var rules = sheet.rules || sheet.cssRules;
			Array.each(rules, function(rule, i){
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorTest.test(selectorText)) return;
				Object.each(Element.Styles, function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = ((/^rgb/).test(value)) ? value.rgbToHex() : value;
				});
			});
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = {

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: Function.from(false),
		compute: function(zero, one){
			return one;
		},
		serve: function(zero){
			return zero;
		}
	}

};

//<1.2compat>

Fx.CSS.Parsers = new Hash(Fx.CSS.Parsers);

//</1.2compat>

/*
---

name: Fx.Tween

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		this.get('tween').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var tween = this.retrieve('tween');
		if (!tween){
			tween = new Fx.Tween(this, {link: 'cancel'});
			this.store('tween', tween);
		}
		return tween;
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(arguments);
		return this;
	},

	fade: function(how){
		var fade = this.get('tween'), o = 'opacity', toggle;
		how = [how, 'toggle'].pick();
		switch (how){
			case 'in': fade.start(o, 1); break;
			case 'out': fade.start(o, 0); break;
			case 'show': fade.set(o, 1); break;
			case 'hide': fade.set(o, 0); break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.get('opacity') == 1);
				fade.start(o, (flag) ? 0 : 1);
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: fade.start(o, arguments);
		}
		if (!toggle) this.eliminate('fade:flag');
		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});

/*
---
 
script: Animation.js
 
description: Animated ways to show/hide widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Core/Fx.Tween
 
provides: 
  - LSD.Trait.Animation
 
...
*/


LSD.Trait.Animation = new Class({
  options: {
    animation: {}
  },
  
  getAnimation: function() {
    if (!this.animation) {
      this.animation = this.getAnimatedElement().set('tween', this.options.animation).get('tween');
      if (this.options.animation.value) this.animation.set(this.options.animation.value);
    }
    return this.animation;
  },
  
  show: function() {
    var parent = this.parent;
    this.getAnimation().start('opacity', 1).chain(function() {
      LSD.Widget.prototype.show.apply(this, arguments);
    }.bind(this))
  },
  
  hide: function(how) {
    var parent = this;
    this.getAnimation().start('opacity', 0).chain(function() {
      LSD.Widget.prototype.hide.apply(this, arguments);
    }.bind(this))
  },
  
  remove: function() {
    return this.getAnimation().start('opacity', 0).chain(this.dispose.bind(this));
  },
  
  dispose: function() {
    return this.getAnimatedElement().dispose()
  },
  
  getAnimatedElement: function() {
    return this.element;
  }
  
});

LSD.Trait.Animation.Instant = new Class({
  show: function() {
    this.getAnimatedElement().setStyle('visibility', 'visible')
  },
  
  hide: function() {
    this.getAnimatedElement().setStyle('visibility', 'hidden')
  },
  
  getAnimatedElement: function() {
    return this.element;
  }
})
/*
---
 
script: BoxShadow.js
 
description: Set box shadow in an accessible way
 
license: Public domain (http://unlicense.org).
 
requires:
- Core/Element
 
provides: [Element.Properties.boxShadow]
 
...
*/
(function() {
  if (Browser.safari)            var property = 'webkitBoxShadow';
  else if (Browser.firefox)      var property = 'MozBoxShadow'
  else                           var property = 'boxShadow';
  if (property) {
    var dummy = document.createElement('div');
    var cc = property.hyphenate();
    if (cc.charAt(0) == 'w') cc = '-' + cc;
    dummy.style.cssText = cc + ': 1px 1px 1px #ccc'
    Browser.Features.boxShadow = !!dummy.style[property];
    delete dummy;
  }  
  Element.Properties.boxShadow = {
    set: function(value) {
      if (!property) return;
      switch ($type(value)) {
        case "number": 
          value = {blur: value};
          break;
        case "array":
          value = {
            color: value[0],
            blur: value[1],
            x: value[2],
            y: value[3]
          }
          break;
        case "boolean":
          if (value) value = {blur: 10};
          else value = false
        case "object":
         if (value.isColor) value = {color: value}
      }
      if (!value) {
        if (!this.retrieve('shadow:value')) return;
        this.eliminate('shadow:value');
        this.style[property] = 'none';
        return;
      }
      this.store('shadow:value', value)
      var color = value.color ? value.color.toString() : 'transparent'
      this.style[property] = (value.x || 0) + 'px ' + (value.y || 0) + 'px ' + (value.blur || 0) + 'px ' + color;
    }
  }
})();
/*
---
 
script: Data.js
 
description: Get/Set javascript controller into element
 
license: MIT-style license.
 
requires:
- Core/Element
 
provides: [Element.Properties.widget]
 
...
*/

Element.Properties.widget = {
  get: function(){
    var widget, element = this;
    while (element && !(widget = element.retrieve('widget'))) element = element.getParent();
    if (widget && (element != this)) this.store('widget', widget);
    return widget;
  },
	
	set: function(options) {
		if (this.retrieve('widget')) {
			return this.retrieve('widget').setOptions(options)
		} else {
			var given = this.retrieve('widget:options') || {};
			for (var i in options) {
				if (given[i] && i.match('^on[A-Z]')) {
					given[i] = (function(a,b) {        // temp solution (that is 1.5 years in production :( )
						return function() {              // wrap two functions in closure instead of overwrite
							a.apply(this, arguments);      // TODO: some way of passing a raw array of callbacks
							b.apply(this, arguments);
						}
					})(given[i], options[i])
				} else {
					var o = {};
					o[i] = options[i];
					$extend(given, o);
				}
			}
			this.store('widget:options', given);
		}
	}
};




/*
---

name: Request

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires: [Object, Element, Chain, Events, Options, Browser]

provides: Request

...
*/

(function(){

var progressSupport = ('onprogress' in new Browser.Request);

var Request = this.Request = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: function(){},
		onLoadstart: function(event, xhr){},
		onProgress: function(event, xhr){},
		onComplete: function(){},
		onCancel: function(){},
		onSuccess: function(responseText, responseXML){},
		onFailure: function(xhr){},
		onException: function(headerName, value){},
		onTimeout: function(){},
		user: '',
		password: '',*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		timeout: 0,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.headers = this.options.headers;
	},

	onStateChange: function(){
		var xhr = this.xhr;
		if (xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		Function.attempt(function(){
			var status = xhr.status;
			this.status = (status == 1223) ? 204 : status;
		}.bind(this));
		xhr.onreadystatechange = function(){};
		clearTimeout(this.timer);
		
		this.response = {text: this.xhr.responseText || '', xml: this.xhr.responseXML};
		if (this.options.isSuccess.call(this, this.status))
			this.success(this.response.text, this.response.xml);
		else
			this.failure();
	},

	isSuccess: function(){
		var status = this.status;
		return (status >= 200 && status < 300);
	},

	isRunning: function(){
		return !!this.running;
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return Browser.exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},
	
	loadstart: function(event){
		this.fireEvent('loadstart', [event, this.xhr]);
	},
	
	progress: function(event){
		this.fireEvent('progress', [event, this.xhr]);
	},
	
	timeout: function(){
		this.fireEvent('timeout', this.xhr);
	},

	setHeader: function(name, value){
		this.headers[name] = value;
		return this;
	},

	getHeader: function(name){
		return Function.attempt(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.pass(arguments, this)); return false;
		}
		return false;
	},
	
	send: function(options){
		if (!this.check(options)) return this;

		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.running = true;

		var type = typeOf(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = Object.append({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		switch (typeOf(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Object.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && ['post', 'put'].contains(method)){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers['Content-type'] = 'application/x-www-form-urlencoded' + encoding;
		}

		if (!url) url = document.location.pathname;
		
		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (this.options.noCache)
			url += (url.contains('?') ? '&' : '?') + String.uniqueID();

		if (data && method == 'get'){
			url += (url.contains('?') ? '&' : '?') + data;
			data = null;
		}

		var xhr = this.xhr;
		if (progressSupport){
			xhr.onloadstart = this.loadstart.bind(this);
			xhr.onprogress = this.progress.bind(this);
		}

		xhr.open(method.toUpperCase(), url, this.options.async, this.options.user, this.options.password);
		if (this.options.user && 'withCredentials' in xhr) xhr.withCredentials = true;
		
		xhr.onreadystatechange = this.onStateChange.bind(this);

		Object.each(this.headers, function(value, key){
			try {
				xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);

		this.fireEvent('request');
		xhr.send(data);
		if (!this.options.async) this.onStateChange();
		if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		var xhr = this.xhr;
		xhr.abort();
		clearTimeout(this.timer);
		xhr.onreadystatechange = xhr.onprogress = xhr.onloadstart = function(){};
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}

});

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(data){
		var object = {
			method: method
		};
		if (data != null) object.data = data;
		return this.send(object);
	};
});

Request.implement(methods);

Element.Properties.send = {

	set: function(options){
		var send = this.get('send').cancel();
		send.setOptions(options);
		return this;
	},

	get: function(){
		var send = this.retrieve('send');
		if (!send){
			send = new Request({
				data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
			});
			this.store('send', send);
		}
		return send;
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});

})();
/*
---
 
script: Sheet.js
 
description: Code to extract style rule definitions from the stylesheet
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - Core/Element
  - Core/Request
  - Sheet/Sheet
  - Sheet/SheetParser.Value
  - Sheet/SheetParser.Property
  - Sheet/SheetParser.Styles
  
provides:
  - LSD.Sheet
 
...
*/

(function() {
  
LSD.Sheet = new Class({
  Extends: LSD.Node,
  
  options: {
    compile: false,
    combine: true //combine rules
  },
  
  initialize: function(element, callback) {
    this.parent.apply(this, arguments);
    this.rules = []
    this.callback = callback;
    if (this.element) this.fetch();
    else if (callback) callback(this);
    LSD.Document.addStylesheet(this);
  },
  
  define: function(selectors, style) {
    LSD.Sheet.Rule.fromSelectors(selectors, style).each(this.addRule.bind(this))
  },
  
  addRule: function(rule) {
    this.rules.push(rule)
  },
  
  fetch: function(href) {
    if (!href && this.element) href = this.element.get('href');
    if (!href) return;
    new Request({
      url: href,
      onSuccess: this.apply.bind(this)
    }).get();
  },
  
  apply: function(sheet) {
    if (typeof sheet == 'string') sheet = this.parse(sheet);
    if (this.options.compile) this.compile(sheet);
    for (var selector in sheet) this.define(selector, sheet[selector]);
    if (this.callback) this.callback(this)
  },
  
  parse: function(text) {
    var sheet = new Sheet(text);
    var rules = sheet.cssRules;
    var CSS = SheetParser.Styles, Paint = LSD.Styles;
    var parsed = {};
    for (var i = 0, rule; rule = rules[i++];) {      
      var selector = LSD.Sheet.convertSelector(rule.selectorText)
      if (!selector.length || LSD.Sheet.isElementSelector(selector)) continue;
      if (!parsed[selector]) parsed[selector] = {};
      var styles = parsed[selector];
      for (var style = rule.style, j = 0, name; name = style[j++];) {
        var property = name.replace('-lsd-', '').camelCase();
        var value = SheetParser.Value.translate(style[name]);
        var definition = Paint[property] || CSS[property];
        if (!definition) continue;
        if (definition.type != 'simple') {
          var result = definition[value.push ? 'apply' : 'call'](this, value);
          if (result === false) value = false;
          else if (result !== true) {
            for (prop in result) styles[prop] = Value.compile(result[prop]);
            continue
          }
        }
        styles[property] = Value.compile(value);
      }
    };
    return parsed;
  },
  
  attach: function(node) {
    this.rules.each(function(rule) {
      rule.attach(node)
    });
    LSD.start();
  },
  
  detach: function(node) {
    this.rules.each(function(rule) {
      rule.detach(node)
    });
  },
  
  /* Compile LSD stylesheet to CSS when possible 
     to speed up setting of regular properties
     
     Will create stylesheet node and apply the css
     unless *lightly* parameter was given. 
     
     Unused now, because we decompile css instead */
  compile: function(lightly) {
    var bits = [];
    this.rules.each(function(rule) {
      if (!rule.implied) return;
      bits.push(rule.getCSSSelector() + " {")
      for (var property in rule.implied) {  
        var value = rule.implied[property];
        if (typeof value == 'number') {
          if (property != 'zIndex') value += 'px';
        } else if (value.map) {
          value = value.map(function(bit) { return bit + 'px'}).join(' ');
        }
        bits.push(property.hyphenate() + ': ' + value + ';')
      }
      bits.push("}")
    })
    var text = bits.join("\n");
    if (lightly) return text;
    
    if (window.createStyleSheet) {
      var style = window.createStyleSheet("");
      style.cssText = text;
    } else {
      var style = new Element('style', {type: 'text/css', media: 'screen'}).adopt(document.newTextNode(text)).inject(document.body);
    }
  }
});

Object.append(LSD.Sheet, {
  isElementSelector: function(selector) {
    return selector.match(/svg|v\\?:|:(?:before|after)|\.container/);
  },
  convertSelector: function(selector) {
    return selector.replace(/\.id-/g , '#').replace(/\.is-/g, ':').replace(/\.lsd#/g, '#').
                    replace(/\.lsd\./g, '').replace(/html\sbody\s/g, '');
  },
  isElementStyle: function(cc) {
    return SheetParser.Styles[cc] && !LSD.Styles[cc] && (cc != 'height' && cc != 'width')
  },
  isRawValue: function(value) {
    return (value.indexOf('hsb') > -1) || (value.indexOf('ART') > -1) || (value.indexOf('LSD') > -1) || 
           (value.charAt(0) == '"') || (value == 'false') || (value == parseInt(value)) || (value == parseFloat(value))
  }
});

LSD.Sheet.Rule = function(selector, style) {
  this.selector = selector;
  this.index = LSD.Sheet.Rule.index ++;
  this.expressions = selector.expressions[0];
  this.specificity = this.getSpecificity();
  for (property in style) {
    var cc = property.camelCase();
    var type = (LSD.Sheet.Rule.separate && LSD.Sheet.isElementStyle(cc)) ? 'implied' : 'style';
    if (!this[type]) this[type] = {}; 
    this[type][cc] = style[property];
  }
}
LSD.Sheet.Rule.index = 0;

LSD.Sheet.Rule.separate = true;

Object.append(LSD.Sheet.Rule.prototype, {  
  attach: function(node) {
    if (!this.watcher) this.watcher = this.watch.bind(this);
    node.watch(this.selector, this.watcher)
  },
  
  detach: function(node) {
    node.unwatch(this.selector, this.watcher);
  },
  
  watch: function(node, state) {
    //console.log(node, state, this.selector.raw, this.style)
    node[state ? 'addRule' : 'removeRule'](this)
  },
  
  getCSSSelector: function() {
    return this.expressions.map(function(parsed){
      var classes = ['', 'lsd'];
      if (parsed.tag) classes.push(parsed.tag);
      if (parsed.id) classes.push('id-' + parsed.id);
      if (parsed.pseudos) {
        parsed.pseudos.each(function(pseudo) {
          classes.push(pseudo.key);
        });
      };
      return classes.join('.');
    }).join(' ');
  },
  
  getSpecificity: function(selector) {
    specificity = 0;
    this.expressions.each(function(chunk){
      if (chunk.tag && chunk.tag != '*') specificity++;
      if (chunk.id) specificity += 100;
      for (var i in chunk.attributes) specificity++;
      specificity += (chunk.pseudos || []).length;
      specificity += (chunk.classes || []).length * 10;
    });
    return specificity;
  }
});

var Value = LSD.Sheet.Value = {
  px: function(value) {
    return value;
  },
  deg: function(value) {
    return value;
  },
  em: function(value) {
    return function() {
      return value * (this.baseline || 16)
    }
  },
  "%": function(value) {
    return function(property) {
      var resolved = Value['%'].resolve(property);
      if (resolved.call) resolved = resolved.call(this);
      return resolved / 100 * value;
    }
  },
  url: function(value) {
    return value
  },
  src: function(value) {
    return value
  },
  rgb: function() {
    return window.rgb.apply(window, arguments)
  },
  rgba: function(value) {
    return window.rgb.apply(window, arguments)
  },
  hsb: function() {
    return window.hsb.apply(window, arguments)
  },
  hex: function(value) {
    return new Color(value)
  },
  calc: function(value) {
    var bits = value.map(function(bit, i) {
      if (bit.call) {
        return "value[" + i + "].call(this, property)"
      } else {
        return bit;
      }
    })
    eval("var compiled = function(property) { return " + bits.join(" ") + "}");
    return compiled
  },
  min: function() {
    return Math.min.apply(Math, arguments)
  },
  max: function() {
    return Math.max.apply(Math, arguments)
  }
};


var resolved = {};
var dimensions = {
  height: /[hH]eight|[tT]op|[bB]ottom|[a-z]Y/,
  width: /[wW]idth|[lL]eft|[rR]ight|[a-z]X/
}
Value['%'].resolve = function(property) {
  var result = resolved[property];
  if (result != null) return result;
  for (var side in dimensions) if (property.match(dimensions[side])) {
    result = function() { if (this.parentNode) return this.parentNode.getStyle(side); return 0;}
    break;
  }
  return (resolved[property] = (result || 1));
};

Value.compiled = {};
Value.compile = function(value, context) {
  if (!value || value.call || typeof value == 'number') return value;
  if (!context) context = Value;
  if (value.push) {
    for (var i = 0, j = value.length, result = [], bit; i < j; bit = value[i++]) result[i] = Value.compile(value[i], context);
    return result;
  }
  if (value.unit)  return Object.append(context[value.unit](value.number), value);
  if (value.charAt) {
    if (context.hex && value.charAt(0) == "#" && value.match(/#[a-z0-9]{3,6}/)) return context.hex(value);
  } else for (var name in value) {
    if (context[name]) {
      return context[name](Value.compile(value[name]), context);
    } else {
      value[name] = Value.compile(value[name]);
    }
    break;
  }
  return value;
}

LSD.Sheet.Rule.fromSelectors = function(selectors, style) { //temp solution, split by comma
  return selectors.split(/\s*,\s*/).map(function(selector){
    return new LSD.Sheet.Rule(Slick.parse(selector), style);
  });
};

var Property = SheetParser.Property;
LSD.Sheet.defineStyleFamily = function(name, properties, layer) {
  if (!layer) layer = name;
  var result = {styles: {}, keys: []};
  var prefix = result.prefix;
  if (prefix === false || layer == name) prefix = name;
  else if (!prefix) prefix = name + layer.capitalize();
  var length = 0;
  for (var property in properties) length++
  var simple = (length == 1);
    console.log(properties)
  Object.each(properties, function(value, property) {
    if (property == layer) {
      if (simple) var style = prefix
      else return;
    } else var style = prefix + property.capitalize()
    result.styles[style] = Property.compile(value, properties);
    result.keys.push(style);
  });
  var shorthand = properties[layer];
  if (shorthand && !simple) {
    var style = (layer == name) ? name : name + layer.capitalize();
    if (length) {
      for (var j = 0, k = 0, l = 0, prop; prop = shorthand[j]; j++) {
        if (!prop.push) { 
          if (properties[prop]) {
            shorthand[j] = prefix + prop.capitalize();
            k++
          }
        } else for (var m = 0, sub; sub = prop[m]; m++) {
          if (properties[sub]) {
            prop[m] = prefix + sub.capitalize();
            l++;
          }
        }
      }
    }
    if (l > 0 && (k > 0 || j == 1)) shorthand = [shorthand];
    result.styles[style] = Property.compile(shorthand, result.styles);
    result.shorthand = style;
  }
  return result;
}

})();

/*
---
 
script: Layer.js
 
description: Adds a piece of SVG that can be drawn with widget styles
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Sheet
  - LSD.Module.Styles
  - Sheet/SheetParser.Styles
 
provides: 
  - LSD.Layer
  - LSD.Layer.Shaped
 
...
*/

(function() {
  
LSD.Layer = function(name, styles, painters) {
  this.name = name;
  this.styles = styles;
  this.painters = painters;
}

LSD.Layer.prototype = {
  render: function(widget, commands) {
    var canvas = widget.getCanvas();
    var shape = commands.shape;
    if (shape == 'none') return;
    if (!shape) shape = widget.getStyle('shape') || 'rectangle';
    var layer = widget.shapes[this.name];
    if (shape.glyph) {
      var glyph = ART.Glyphs[shape.glyph];
      if (!glyph) return;    
      var path = new ART.Path(glyph);
      var box = path.measure();
      if (!layer) layer = new ART.Shape(path, box.width, box.height);
      if (commands.size && !Object.equals(previous ? previous.size : box, commands.size))
        layer.resizeTo(commands.size.width, commands.size.height)
        
    } else if (!shape.indexOf){
      for (var name in shape) {
        var values = Array.from(shape[name]);
        shape = name;
      }
    }
    if (!layer) {
      var path = ART.Shape[shape.capitalize()];
      if (!path) return;
      var layer = new path;
      layer.render(commands)
    } else {
      var previous = layer.commands;
      if (layer.draw && layer.render) layer.render(commands)
    }
    layer.commands = commands;
    widget.shapes[this.name] = layer;
    for (command in commands) {
      var value = commands[command];
      if (layer[command] && command != 'move') {
        if (!value || !previous || !Object.equals(previous[command], value)) layer[command][value && value.push ? 'apply' : 'call'](layer, value);
      }
    }
    var translate = commands.translate = {x: 0, y: 0}
    if (commands.inside) {
      translate.x += commands.inside.left
      translate.y += commands.inside.top;
    };
    //if (commands.outside) {
    //  top += commands.outside.top;
    //  left += commands.outside.left
    //};
    if (commands.move) {
      translate.x += commands.move.x;
      translate.y += commands.move.y;
    }
    if (!previous || !Object.equals(previous.translate, translate)) layer.moveTo(translate.x, translate.y)
  },
  
  draw: function(widget, context, previous) {
    context = Object.append({size: widget.size, style: widget.style.current}, context || {});
    if (context.style.cornerRadiusTopLeft !== null) {
      context.radius = widget.getStyle('cornerRadius')
    }
    var inherited = {}, overwritten = {};
    for (var painter, i = 0; painter = this.painters[i++];) {
      var commands = painter.paint.apply(context, painter.keys.map(function(prop) { return widget.getStyle(prop)}));
      for (var name in commands) {
        var value = commands[name];
        if (Inherit[name]) {;
          inherited[name] = merge(value, context[name])
        } else {
          if (!Accumulate[name]) overwritten[name] = context[name]
          context[name] = (Accumulate[name] || Merge[name]) ? merge(value, context[name]) : value;
        }
      }
      //for (var command in value) this[command](command[value]);
    }    
    this.render(widget, context);
    return Object.append(context, overwritten, inherited);;
  }
}

var merge = function(value, old) {
  if (typeof value == "object") {
    if (value.push) {
      for (var j = 0, k = value.length; j < k; j++) {
        var item = value[j] || 0;
        if (old) old[j] = (old[j] || 0) + item;
        else old = [item]
      }
      return old;
    } else if (!value.indexOf) {
      for (var prop in value) {
        var item = value[prop] || 0;
        if (!old) old = {}
        old[prop] = (old[prop] || 0) + item;
      }
      return old;
    }
  }  
  return value;
}

var Accumulate = LSD.Layer.accumulated = new FastArray('translate', 'radius');
var Inherit = LSD.Layer.inherited = new FastArray('inside', 'outside')
var Merge = LSD.Layer.merged = new FastArray('size')

var Property = SheetParser.Property;
var Styles = LSD.Styles;
var Map = LSD.Layer.Map = {};
var Cache = LSD.Layer.Cache = {};

//LSD.Layer.getProperty = function(property, properties)
 
LSD.Layer.generate = function(name, layers) {
  if (arguments.length > 2) layers = Array.prototype.splice.call(arguments, 1);
  var painters = [];
  var styles = LSD.Layer.prepare(name, layers, function(painter, definition) {
    painters.push(Object.append(painter, definition))
  })
  return new LSD.Layer(name, styles, painters);
};

LSD.Layer.prepare = function(name, layers, callback) {
  var styles = {};
  for (var i = 0, layer; layer = layers[i++];) {
    var definition = LSD.Layer[layer.capitalize()];
    if (!definition || !definition.properties) continue;
    var result = LSD.Sheet.defineStyleFamily(name, Object.clone(definition.properties), layer);
    if (!result) continue;
    if (callback) callback(result, definition);
    if (definition.onCompile) definition.onCompile(name);
    Object.append(styles, result.styles);
  }
  for (var property in styles) {
    Styles[property] = styles[property];
    Map[property] = name;
  }
  return styles;
}

LSD.Layer.get = function(name) {
  var key = name//Array.flatten(arguments).join('');
  if (Cache[key]) return Cache[key];
  else return (Cache[key] = LSD.Layer.generate.apply(LSD.Layer, arguments))
}


})();
/*
---
 
script: Layers.js
 
description: Make widget use layers for all the SVG
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
  - LSD.Module.Styles

provides: 
  - LSD.Trait.Layers
 
...
*/


(function() {

LSD.Trait.Layers = new Class({
  options: {
    layers: {}
  },
  
  initialize: function() {
    this.offset = {};
    this.layers = {};
    this.shapes = {};
    this.parent.apply(this, arguments);
  },
  
  attach: Macro.onion(function() {
    this.style.layers = {};
    for (var name in this.options.layers) this.addLayer(name, this.options.layers[name]);
    //console.log(this.style.layers)
  }),

  addLayer: function(name, value) {
    var slots = this.style.layers;
    var layer = this.layers[name] = LSD.Layer.get(name, Array.from(value));
    for (var i = 0, painter; painter = layer.painters[i++];) {
      for (var group = painter.keys, j = 0, property; property = group[j++];) {
        if (!slots[property]) slots[property] = [];
        slots[property].push(name);
      }
    }
  },
  
  renderLayers: function(dirty) {
    var updated = new FastArray, style = this.style, layers = style.layers, offset = this.offset;
    for (var property in dirty) if (layers[property]) updated.push.apply(updated, layers[property]);
    
    
    
    
    var result = {};
    for (var name in this.layers) {
      if (!updated[name]) continue;
      var layer = this.layers[name];
      var sizes = Object.append({box: this.size}, {size: Object.append({}, this.size)});
      result = layer.draw(this, Object.append(result.inside ? {inside: result.inside, outside: result.outside} : {}, sizes))
    }
    var inside  = offset.inside  = Object.append({left: 0, right: 0, top: 0, bottom: 0}, result.inside);
    var outside = offset.outside = Object.append({left: 0, right: 0, top: 0, bottom: 0}, result.outside);
    offset.shape = /*this.shape.getOffset ? this.shape.getOffset(style.current) : */{left: 0, right: 0, top: 0, bottom: 0};
    
    for (var name in this.shapes) {
      var layer = this.shapes[name];
      if (!layer) continue;
      if (!layer.injected) {
        for (var layers = Object.keys(this.layers), i = layers.indexOf(layer.name), key, next; key = layers[++i];) {
          if ((next = this.layers[key]) && next.injected && next.shape) {
            layer.inject(next.shape, 'before');
            break;
          }
        }
        if (!layer.injected) layer.inject(this.getCanvas());
        layer.injected = true;
      }
    }
  },
  
  repaint: function() {
    var style = this.style, last = style.last, old = style.size, paint = style.paint, changed = style.changed;
    this.parent.apply(this, arguments);
    this.setSize(this.getStyles('height', 'width'));
    var size = this.size;
    if (size && (!old || (old.width != size.width || old.height != size.height))) {
      this.fireEvent('resize', [size, old]);
      changed = paint;
    }
    if (Object.getLength(changed) > 0) this.renderLayers(changed);
    style.changed = {};
    style.last = Object.append({}, paint);
    style.size = Object.append({}, size);
    this.renderOffsets();
  },
  
  renderStyles: function() {
    this.parent.apply(this, arguments);
    var style = this.style, current = style.current;
    Object.append(this.offset, {
      padding: {left: current.paddingLeft || 0, right: current.paddingRight || 0, top: current.paddingTop || 0, bottom: current.paddingBottom || 0},
      margin: {left: current.marginLeft || 0, right: current.marginRight || 0, top: current.marginTop || 0, bottom: current.marginBottom || 0}
    });
  },
  
  renderOffsets: function() {
    var element = this.element,
        current = this.style.current, 
        offset  = this.offset,         // Offset that is provided by:
        inside  = offset.inside,       // layers, inside the widget
        outside = offset.outside,      // layers, outside of the widget
        shape   = offset.shape,        // shape
        padding = offset.padding,      // padding style declarations
        margin  = offset.margin,       // margin style declarations
        inner   = {},                  // all inside offsets above, converted to padding
        outer   = {};                  // all outside offsets above, converted to margin
        
    for (var property in inside) {
      var cc = property.capitalize();
      if (offset.inner) var last = offset.inner[property];
      inner[property] = padding[property] + inside[property] + shape[property] + outside[property];
      if (last != null ? last != inner[property] : inner[property]) element.style['padding' + cc] = inner[property] + 'px';
      if (offset.outer) last = offset.outer[property];
      outer[property] = margin[property] - outside[property];
      if (last != null ? last != outer[property] : outer[property]) element.style['margin' + cc] = outer[property] + 'px';
    }
    if (inside) Object.append(offset, {inner: inner, outer: outer});
  }
});

})();

/*
---
 
script: Shape.js
 
description: Base layer that provides shape
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
  - ART/ART.Shape
 
provides: 
  - LSD.Layer.Shape
 
...
*/

LSD.Layer.Styles = {}
LSD.Layer.Shape = {
  properties: {
    shape:      ['url', 'shape', 'glyph']
  },
  
  paint: function(shape) {
    return {
      shape: shape
    }
  },
  
  onCompile: function(name) {
    for (var shape in ART.Shape) {
      var klass = ART.Shape[shape];
      if (!klass || !klass.prototype || !klass.prototype.properties) continue;
      var result = LSD.Sheet.defineStyleFamily(shape.toLowerCase(), klass.prototype.properties);
      console.log(shape.toLowerCase(), klass.prototype.properties, result)
      if (result) Object.append(LSD.Styles, result.styles);
    }
  }
}

Object.append(SheetParser.Property.Type, {
  shape: function(value) {
    if (value.indexOf) var name = value
    else for (var key in value) { name = key; break};
    return !!ART.Shape[name.capitalize()]
  },
  
  glyph: function(value) {
    return value.glyph
  }
});

LSD.Styles.shape = SheetParser.Property.compile(LSD.Layer.Shape.properties.shape)
/*
---
 
script: Position.js
 
description: Positions layer in the box
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
 
provides: 
  - LSD.Layer.Position
 
...
*/

LSD.Layer.Position = {
  properties: {
    position: [['x', 'y']],
    x:        ['length', 'percentage', 'left', 'right', 'center'],
    y:        ['length', 'percentage', 'top', 'bottom', 'center']
  },
  
  
  paint: function(x, y) {
    if (!x && !y) return;
    return {
      move: LSD.Position.calculate(this.box, this.size, x || 'center', y || 'center')
    }
  }
}

LSD.Position = {};
LSD.Position.calculate = function(box, size, x, y) {
  var position = {x: 0, y: 0};
  
  switch (x) {
    case "left":
      position.x = 0;
    case "right":
      position.x = box.width - size.width;
    case "center":
      position.x = (box.width - size.width) / 2;
  }
  switch (y) {
    case "top":
      position.y = 0;
    case "bottom":
      position.y = box.height - size.height;
    case "center":
      position.y = (box.height- size.height) / 2;
  }
  return position;
}
/*
---
 
script: Color.js
 
description: Fills shape with color
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Color, LSD.Layer.Fill]
 
...
*/

LSD.Layer.Color = {
  properties: {
    color: ['color', 'gradient', 'none']
  },
  
  paint: function(color) {
    if (color) var radial = color['radial-gradient'], gradient = color['gradient'] || color ['linear-gradient'];
    if (gradient) {
      return {fillLinear: [gradient]}
    } else if (!radial) {
      return {fill: (!color || color == 'none') ? null : color} 
    }
  }
};

LSD.Layer.Fill = {
  properties: {
    color: ['color']
  },
  
  prefix: 'fill',
  
  paint: LSD.Layer.Color.paint
};
/*
---
 
script: Stroke.js
 
description: Fills shape with color and strokes with a stroke
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
  - LSD.Layer.Color
 
provides: 
  - LSD.Layer.Stroke
 
...
*/

LSD.Layer.Stroke = {
  
  properties: {
    stroke:    ['width', ['cap', 'join', 'dash'], 'color'], 
    color:     ['gradient', 'color'],
    width:     ['length'],
    cap:       ['butt', 'round', 'square'],
    join:      ['butt', 'round', 'square'],
    dash:      ['tokens']
  },
  
  paint: function(color, width, cap, join, dash) {
    if (!width) width = 0;
    var gradient = color && (color['gradient'] || color['linear-gradient']);
    var result = {    
      dash: dash,
      size: {
        width: width,
        height: width
      },
      move: {
        x: width / 2,
        y: width / 2
      },
      inside: {
        left: width,
        top: width,
        right: width,
        bottom: width
      },
      stroke: [!gradient && color || null, width, cap, join]
    };
    if (this.radius != null) {
      var radius = result.radius = []
          for (var i = 0; i < 4; i++) radius[i] = (this.radius[i] > 0) ? width / 1.5 : 0;
    }
    if (gradient) result.strokeLinear = [gradient]
    return result;
  }
}
/*
---
 
script: Scale.js
 
description: Adds a way to set scale level to the layer
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
 
provides: 
  - LSD.Layer.Scale
 
...
*/

LSD.Layer.Scale = {
  properties: {
    scale: [['x', 'y'], 'collection'],
    x:     ['number', 'percentage'],
    y:     ['number', 'percentage']
  },
  
  paint: function(x, y) {
    if (x != null || y != null) return {
      size: {
        width: - this.size.width * (1 - x),
        height: - this.size.height * (1 - y)
      }
    }
  }
}
/*
---
 
script: Size.js
 
description: Base layer that provides shape
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
 
provides: 
  - LSD.Layer.Size
 
...
*/

LSD.Layer.Size = {
  properties: {
    size:       [['height', 'width'], 'collection'],
    height:     ['length', 'percentage'],
    width:      ['length', 'percentage']
  },
  
  prefix: false,
  
  paint: function(height, width) {
    if (height !== null && width !== null) return {
      size: {
        height: this.size.height ? (height - this.size.height) : height,
        width: this.size.width ? (width - this.size.width) : width
      }
    }
  }
}
/*
---
 
script: Radius.js
 
description: Rounds shapes corners
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
 
provides: 
  - LSD.Layer.Radius
 
...
*/

LSD.Layer.Radius = {
  properties: {
    radius:      [['topLeft', 'bottomLeft', 'topRight', 'bottomRight'], 'collection'],
    topLeft:     ['percentage', 'length'],
    bottomLeft:  ['percentage', 'length'],
    topRight:    ['percentage', 'length'],
    bottomRight: ['percentage', 'length'],
  },
  
  paint: function() {
    return {
      radius: Array.from(arguments).map(function(r) { return r || 0})
    }
  }
}

LSD.Layer.prepare('corner', ['radius'], false);
/*
---
 
script: Offset.js
 
description: Positions layer around the canvas
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Offset]
 
...
*/

LSD.Layer.Offset = {
  properties: {  
    offset:    [['top', 'right', 'bottom', 'left']],
    top:       ['length', 'percentage'],
    left:      ['length', 'percentage'],
    bottom:    ['length', 'percentage'],
    right:     ['length', 'percentage'],
  },

  paint: function(top, right, bottom, left) {
    return {
      move: {
        x: left == null && right != null ? (this.size.width - (right || 0)) : (left || 0), 
        y: top == null && bottom != null ? (this.size.height - (bottom || 0)) : (top || 0)
      }
    }
  }
};
/*
---
 
script: BorderRadius.js
 
description: Set border radius for all the browsers
 
license: Public domain (http://unlicense.org).
 
requires:
- Core/Element
 
provides: [Element.Properties.borderRadius]
 
...
*/


(function() {
  if (Browser.safari || Browser.chrome) 
    var properties = ['webkitBorderTopLeftRadius', 'webkitBorderTopRightRadius', 'webkitBorderBottomRightRadius', 'webkitBorderBottomLeftRadius'];
  else if (Browser.firefox)
    var properties = ['MozBorderRadiusTopleft', 'MozBorderRadiusTopright', 'MozBorderRadiusBottomright', 'MozBorderRadiusBottomleft']
  else
    var properties = ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']
  
  Element.Properties.borderRadius = {

  	set: function(radius){
	    if (radius.each) radius.each(function(value, i) {
	      this.style[properties[i]] = value + 'px';
	    }, this);
  	},

  	get: function(){
	  
    }

  };

})();
/*
---
 
script: Shadow.js
 
description: Drops outer shadow with offsets. Like a box shadow!
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
- Ext/Element.Properties.boxShadow
- Ext/Element.Properties.borderRadius
 
provides: [LSD.Layer.Shadow, LSD.Layer.Shadow.Layer]
 
...
*/

                              //only gecko & webkit nightlies                                       AppleWebKit/534.1+ (KHTML, ... plus means nightly
Browser.Features.SVGFilters = Browser.Engine.name == 'gecko' || (Browser.Engine.webkit && navigator.userAgent.indexOf("+ (KHTML") > -1) 

LSD.Layer.Shadow = {
  
  properties: {
    shadow:    ['blur', ['offsetX', 'offsetY'], 'color'],
    blur:      ['length', 'number'],
    offsetX:   ['length', 'number'],
    offsetY:   ['length', 'number'],
    color:     ['color']
  },
  
  paint: function(color, blur, x, y, stroke, method) {
    //if (!method) {
    //  if (this.method) method = method
    //  if (blur < 4) method = 'onion';
    //  else if (Browser.Features.boxShadow && this.base.name == 'rectangle') method = 'native';
    //  else if (Browser.Features.SVGFilters) method = 'blur';
    //  else method = 'onion'
    //}
    //if (this.method && method != this.method) this.eject();
    //return this.setMethod(method).paint.apply(this, arguments);
  }
}

/*
---
 
script: Shadow.Onion.js
 
description: Draws shadow with layers stack upon each others
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer.Shadow
 
provides: [LSD.Layer.Shadow.Onion]
 
...
*/

LSD.Layer.Shadow.Onion = new Class({
  //Extends: LSD.Layer.Shadow,
  
  paint: function(color, blur, x, y, stroke) {
    var fill = new Color(color);
    fill.base = fill.alpha;
    //var node = this.element.parentNode;
    var layers = Math.max(blur, 1);
    for (var i = 0; i < layers; i++) {
      if (blur == 0) {
        fill.alpha = Math.min(fill.base * 2, 1)
      } else {
        fill.alpha = fill.base / 2 * (i == blur ? .29 : (.2 - blur * 0.017) + Math.sqrt(i / 100));
      }
      var rectangle = this.layers[i];
      if (!rectangle) rectangle = this.layers[i] = LSD.Layer.Shadow.Layer.getInstance(this);
      rectangle.base = this.base;
      rectangle.shadow = this;
      rectangle.produce(stroke / 2 + blur / 2 - i);
      rectangle.fill(fill);
    }
    var length = this.layers.length;
    for (var i = layers; i < length; i++) if (this.layers[i]) LSD.Layer.Shadow.Layer.release(this.layers[i]);
    this.layers.splice(layers, length);
    return {
      move: {
        x: x * 1.5, //multiplying by 1.5 is unreliable. I need a better algorithm altogether
        y: y * 1.5
      },
      outside: {
        left: Math.max(blur - x, 0),
        top: Math.max(blur - y, 0),
        right: Math.max(blur + x, 0),
        bottom: Math.max(blur + y, 0)
      }
    }
  },

  inject: function(node) {
    this.parent.apply(this, arguments);
    this.update.apply(this, arguments);
  },
  
  update: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) if (this.layers[i]) this.layers[i].inject.apply(this.layers[i], arguments);
  },
  
  eject: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (!layer) continue;
      LSD.Layer.Shadow.Layer.release(layer)
      if (layer.shape.element.parentNode) layer.shape.element.parentNode.removeChild(layer.shape.element);
    }
  },

  translate: function(x, y) {
    this.parent.apply(this, arguments);
    for (var i = 0, j = this.layers.length; i < j; i++) 
      if (this.layers[i]) this.layers[i].translate(x + i + j / 2, y + i + j / 2)
  }
});

LSD.Layer.Shadow.Layer = new Class({
  Extends: LSD.Layer,
  
  
  inject: function(container){
    this.eject();
    if (container instanceof ART.SVG.Group) container.children.push(this);
    this.container = container;
    var first = container.element.firstChild;
    if (first) container.element.insertBefore(this.shape.element, first);
    else container.element.appendChild(this.shape.element);
    return this;
  }
});
LSD.Layer.Shadow.Layer.stack = [];
LSD.Layer.Shadow.Layer.getInstance = function() {
  return LSD.Layer.Shadow.Layer.stack.pop() || (new LSD.Layer.Shadow.Layer);
};
LSD.Layer.Shadow.Layer.release = function(layer) {
  var shape = layer.shape;
  if (shape) shape.element.parentNode.removeChild(shape.element);
  LSD.Layer.Shadow.Layer.stack.push(layer);
};

/*
---
 
script: Shadow.Blur.js
 
description: SVG Filter powered shadow
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer.Shadow
 
provides: [LSD.Layer.Shadow.Blur]
 
...
*/

LSD.Layer.Shadow.Blur = new Class({
  //Extends: LSD.Layer.Shadow,

  paint: function(color, blur, x, y, stroke) {
    this.produce(stroke);
    this.shape.fill.apply(this.shape, color ? $splat(color) : null);
    if (blur > 0) this.shape.blur(blur);
    else this.shape.unblur();
    return {
      move: {
        x: x + blur, 
        y: y + blur
      },
      outside: {
        left: Math.max(blur - x, 0),
        top: Math.max(blur - y, 0),
        right: Math.max(blur + x, 0),
        bottom: Math.max(blur + y, 0)
      }
    }
  }
})
/*
---
 
script: InnerShadow.js
 
description: Drops inner shadow 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer.Shadow
 
provides: 
  - LSD.Layer.Shadow.Inset
 
...
*/

LSD.Layer.InnerShadow = new Class({
  //Extends: LSD.Layer.Shadow,
  
  properties: {
    required: ['innerShadowColor'],
    numerical: ['innerShadowBlur', 'innerShadowOffsetX', 'innerShadowOffsetY']
  },

  paint: function(color, blur, x, y) {
    var fill = new Color(color);
    fill.base = fill.alpha;
    var transition = function(p){
      return 1 - Math.sin((1 - p) * Math.PI / 2);
    };
    var offset = Math.max(Math.abs(x), Math.abs(y));
    blur += offset;
    for (var i = 0; i < blur; i++) {
      if (blur == 0) {
        fill.alpha = Math.min(fill.base * 2, 1)
      } else {
        fill.alpha = fill.base * transition((blur - i) / blur)
      }
      var layer = this.layers[i];
      if (!layer) layer = this.layers[i] = LSD.Layer.InnerShadow.Layer.getInstance(this);
      layer.layer = this;
      layer.base = this.base;
      layer.blur = blur
      layer.dy = y - x
      layer.y = Math.max(Math.min(layer.dy, 0) + i, 0);
      layer.dx = x - y;
      layer.x = Math.max(Math.min(layer.dx, 0) + i, 0);
      layer.produce([
        Math.min(((layer.x > 0) ? ((layer.dx - i < 0) ? 1 : 0.5) * - layer.x  - 0.25 : 0), 0),
        Math.min(((layer.y > 0) ? (layer.dy + i < 0 ? 1 : 0.5) * - layer.y  - 0.25: 0), 0)
      ]);
      layer.stroke(fill, 1);
    }
    var length = this.layers.length;
    for (var i = blur; i < length; i++) if (this.layers[i]) LSD.Layer.InnerShadow.Layer.release(this.layers[i]);
    this.layers.splice(blur, length);
  },
  
  translate: function(x, y) {
    this.parent.apply(this, arguments);
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (layer) layer.translate(x + layer.x, y + layer.y);
    }
  },
  
  eject: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (!layer) continue;
      LSD.Layer.InnerShadow.Layer.release(layer)
      if (layer.shape.element.parentNode) layer.shape.element.parentNode.removeChild(layer.shape.element);
    }
  },

  inject: function(node) {
    this.parent.apply(this, arguments);
    this.update.apply(this, arguments);
  },
  
  update: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) if (this.layers[i]) this.layers[i].inject.apply(this.layers[i], arguments);
  }
});
LSD.Layer.InnerShadow.Layer = new Class({
  Extends: LSD.Layer
});
LSD.Layer.InnerShadow.Layer.stack = [];
LSD.Layer.InnerShadow.Layer.getInstance = function() {
  return LSD.Layer.InnerShadow.Layer.stack.pop() || (new LSD.Layer.InnerShadow.Layer);
}
LSD.Layer.InnerShadow.Layer.release = function(layer) {
  layer.element.parentNode.removeChild(layer.element);
  LSD.Layer.InnerShadow.Layer.stack.push(layer);
};

/*
---
 
script: Shadow.Native.js
 
description: CSS powered shadow
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer.Shadow
 
provides: [LSD.Layer.Shadow.Native]
 
...
*/

LSD.Layer.Shadow.Native = new Class({
  //Extends: LSD.Layer,

  paint: function(color, blur, x, y, stroke) {
    var widget = this.base.widget;
    var element = widget.toElement();
    element.set('borderRadius', widget.getStyle('cornerRadius'));
    element.set('boxShadow', {color: color, blur: blur, x: x, y: y})
  },
  
  eject: function() {
    var widget = this.base.widget;
    var element = widget.element;
    element.set('boxShadow', false)
  }
})
/*
---
 
script: Attributes.js
 
description: A mixin that adds support for setting attributes, adding and removing classes and pseudos
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Slick.Parser
 
provides: 
  - LSD.Module.Attributes
 
...
*/

LSD.Module.Attributes = new Class({
  
  initialize: function() {
    var classes = (this.classes || []).concat(this.options.classes || []);
    var pseudos = (this.pseudos || []).concat(this.options.pseudos || []);
    this.classes = new FastArray
    this.pseudos = new FastArray
    this.attributes = {}
    this.parent.apply(this, arguments);
    if (this.options.attributes) for (var name in this.options.attributes) if (!LSD.Attributes.Ignore[name]) this.attributes[name] = this.options.attributes[name]
    pseudos.each(function(value) {
      this.setStateTo(value, true);
    }, this);
    for (var attribute in this.attributes) this.setAttribute(attribute, this.attributes[attribute]);
    classes.each(this.addClass.bind(this));
  },
  
  getAttribute: function(attribute) {
    switch (attribute) {
      case "id": return this.options.id || this.identifier;
      case "class": return this.classes.join(' ');
      default:   return this.attributes[attribute]
    }
  },
  
  removeAttribute: function(attribute) {
    delete this.attributes[attribute];
    if (this.element) this.element.removeProperty(attribute);
  },

  setAttribute: function(attribute, value) {
    if (LSD.Attributes.Ignore[attribute]) return;
    if (LSD.Attributes.Numeric[attribute]) value = value.toInt();
    else {
      var logic = LSD.Attributes.Setter[attribute];
      if (logic) logic.call(this, value)
    }
    if (value === attribute) value = true;
    if (typeof value != 'string') value = value.toString()  //Slick compat
    this.attributes[attribute] = value;
    if (attribute != 'slick:uniqueid')
    if (this.element) this.element.setProperty(attribute, value);
  },

  addPseudo: function(pseudo){
    this.pseudos.include(pseudo);
  },

  removePseudo: function(pseudo){
    this.pseudos.erase(pseudo);
  },

  addClass: function(name) {
    this.classes.include(name);
    if (this.element) this.element.addClass(name);
  },

  removeClass: function(name) {
    this.classes.erase(name);
    if (this.element) this.element.removeClass(name);
  },
  
  getAttributeNode: function(attribute) {
    return {
      nodeName: attribute,
      nodeValue: (attribute in this.options.states) || (attribute in this.pseudos) 
                  ? this.pseudos[attribute] 
                  : this.getAttribute(attribute)
    }
  }
});


LSD.Attributes.Setter = {
  'class': function(value) {
    value.split(' ').each(this.addClass.bind(this));
  },
  'style': function(value) {
    value.split(/\s*;\s*/).each(function(definition) {
      var bits = definition.split(/\s*:\s*/)
      if (!bits[1]) return;
      bits[0] = bits[0].camelCase();
      var integer = bits[1].toInt();
      if (bits[1].indexOf('px') > -1 || (integer == bits[1])) bits[1] = integer
      //this.setStyle.apply(this, bits);
    }, this);
  },
  'disabled': function(value) {
    if (value == false) this.enable()
    else this.disable();
  }
}
/*
---

name: Events.Pseudos

description: Adds the functionallity to add pseudo events

license: MIT-style license

authors:
  - Arian Stolwijk

requires: [Core/Class.Extras, Core/Slick.Parser, More/MooTools.More]
provides: [Events.Pseudos]

...
*/

Events.Pseudos = function(pseudos, addEvent, removeEvent){

	var storeKey = 'monitorEvents:';

	var getStorage = function(object){
				
		return {
			store: object.store ? function(key, value){
				object.store(storeKey + key, value);
			} : function(key, value){
				(object.$monitorEvents || (object.$monitorEvents = {}))[key] = value;
			},
			retrieve: object.retrieve ? function(key, dflt){
				return object.retrieve(storeKey + key, dflt);
			} : function(key, dflt){
				if (!object.$monitorEvents) return dflt;
				return object.$monitorEvents[key] || dflt;
			}
		};
	};

	
	var splitType = function(type){
		if (type.indexOf(':') == -1) return null;
		
		var parsed = Slick.parse(type).expressions[0][0],
			parsedPseudos = parsed.pseudos;
		
		return (pseudos && pseudos[parsedPseudos[0].key]) ? {
			event: parsed.tag,
			value: parsedPseudos[0].value,
			pseudo: parsedPseudos[0].key,
			original: type
		} : null;
	};

	
	return {
		
		addEvent: function(type, fn, internal){
			var split = splitType(type);
			if (!split) return addEvent.call(this, type, fn, internal);
			
			var storage = getStorage(this);
			var events = storage.retrieve(type, []);
					
			var self = this;
			var monitor = function(){
				pseudos[split.pseudo].call(self, split, fn, arguments);
			};
			
			events.include({event: fn, monitor: monitor});
			storage.store(type, events);
			
			return addEvent.call(this, split.event, monitor, internal);
		},
		
		removeEvent: function(type, fn){
			var split = splitType(type);
			if (!split) return removeEvent.call(this, type, fn);

			var storage = getStorage(this);
			var events = storage.retrieve(type);

			if (!events) return this;
			
			events.each(function(monitor, i){
				if (!fn || monitor.event == fn) removeEvent.call(this, split.event, monitor.monitor);
				delete events[i];
			}, this);				

			storage.store(type, events);
			return this;
		}
		
	};
	
};

(function(){

	var pseudos = {
		
		once: function(split, fn, args){
			fn.apply(this, args)
			this.removeEvent(split.original, fn);
		}
		
	};
	
	Events.definePseudo = function(key, fn){
		pseudos[key] = fn;
	};
	
	Events.implement(Events.Pseudos(pseudos, Events.prototype.addEvent, Events.prototype.removeEvent)); 

})();

/*
---

name: Element.Pseudos

description: Adds the functionallity to add pseudo events for Elements

license: MIT-style license

authors:
  - Arian Stolwijk

requires: [Core/Element.Event, Events.Pseudos]
provides: [Element.Pseudos]

...
*/

(function(){

	var keysStoreKey = '$moo:keys-pressed',
		keysKeyupStoreKey = '$moo:keys-keyup';

	var pseudos = {
		
		once: function(split, fn, args){
			fn.apply(this, args);
			this.removeEvent(split.original, fn);
		},
		
		
		keys: function(split, fn, args){
			if (split.event != 'keydown') return;
			
			var event = args[0],
				keys = split.value.split('+'),
				pressed = this.retrieve(keysStoreKey, []);
			
			pressed.include(event.key);
			
			if (keys.every(function(key){
				return pressed.contains(key);
			})) fn.apply(this, args);
			
			this.store(keysStoreKey, pressed);
			
			
			if (!this.retrieve(keysKeyupStoreKey)){
				var keyup = function(){
					this.store(keysStoreKey, []);
				};
				this.store(keysKeyupStoreKey, keyup).addEvent('keyup', keyup);
			}
			
		}
		
	};
	
	Event.definePseudo = function(key, fn){
		pseudos[key] = fn;
	};
	
	Element.implement(Events.Pseudos(pseudos, Element.prototype.addEvent, Element.prototype.removeEvent)); 

})();

/*
---

script: Element.Delegation.js

name: Element.Delegation

description: Extends the Element native object to include the delegate method for more efficient event management.

credits:
  - "Event checking based on the work of Daniel Steigerwald. License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
  - Aaron Newton
  - Daniel Steigerwald

requires: [/MooTools.More, /Element.Pseudos]
provides: [Element.Delegation]

...
*/

Event.definePseudo('relay', function(split, fn, args){
	var event = args[0];
	for (var target = event.target; target && target != this; target = target.parentNode){
		if (Slick.match(target, split.value)){
			var finalTarget = document.id(target);
			if (finalTarget) fn.apply(finalTarget, [event, finalTarget]);
			return;
		}
	}
	
});

/*
---
 
script: Events.js
 
description: A mixin that adds support for declarative events assignment
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Events
  - Core/Element.Event
  - More/Element.Delegation
  - Ext/Element.Properties.widget

provides:
  - LSD.Module.Events

...
*/


LSD.Module.Events = new Class({
	
	addEvents: function(events) {
		return this.setEvents(events, true);
	},
	
	removeEvents: function(events) {
		return this.setEvents(events, false);
	},
	
	setEvents: function(events, state) {
		var convert = LSD.Module.Events.target, method = state ? 'addEvents' : 'removeEvents', old = Events.prototype[method];
		for (var i in events) { 
			if (events[i].call) { //stick to old behaviour when key: function object is passed
				old.call(this, events);
			} else {
				for (name in events) {
					var subset = events[name];
					if (!subset) continue;
					var target = convert(this, name)
					if (!target) continue;
					if (target != this) {
						if (target == true) target = this;
						target[method](subset);
					} else old.call(this, subset);
				}
			};	
			break;
		}
		return events;
	},
	
	bindEvents: function(tree) {
		if (!tree || tree.call) return tree;
		if (!this.$bound) this.$bound = {}
		if (tree.indexOf) {
			var args, self = this
			if (tree.map) {
				var name = tree.shift();
				args = tree;
				tree = name;
			}
			if (!this.$bound[tree]) {
				//if (!this[tree]) throw "Cant find a method to bind " + tree + " on " + this.getSelector();
				//YF: We now allow binding of methods that are not be in class on initialization 
				this.$bound[tree] = function() {
					self[tree].apply(self, args || arguments);
				}
			}
			return this.$bound[tree];
		}
		for (var i in tree) tree[i] = this.bindEvents(tree[i]);
		return tree;
	},
	
	/*
		The module takes events object defined in options
		and binds all functions to the widget.
		
		Ready to use event tree can be accessed via
		*.events* accessor. 
	*/

	attach: Macro.onion(function() {
		if (!this.events) this.events = this.bindEvents(this.options.events);
		this.addEvents(this.events);
	}),

	detach: Macro.onion(function() {
		this.removeEvents(this.events);
	})
});


/*
	Target system re-routes event groups to various objects.	
	
	Combine them for fun and profit.
	
	| Keyword    |  Object that recieves events       |
	|-------------------------------------------------|
	| *self*     | widget itself (no routing)         |
	| *element*  | widget element (when built)        |
	| *parent*   | parent widget                      |
	| *document* | LSD document                       |
	| *window*   | window element                     |
	
	| State      | Condition                          |
	|-------------------------------------------------|
	| *enabled*  | widget is enabled                  |
	| *disabled* | widget is disabled                 |
	| *focused*  | widget is focused                  |
	| *blured*   | widget is blured                   |
	| *target*   | first focusable parent is focused  |
	
	| Extras     | Description                        |
	|-------------------------------------------------|
	| *expected* | Routes events to widgets, selected |
	|            | by selectors (keys of event group).|
	|            | Provided by Expectations module    |
	| _\w        | An event group which name starts   |
	|            | with underscore is auto-applied    |
	               
	               
	
	
	Advanced example:
	
	events: {
	  self: {
	    focus: 'onFocus'
	  },
	  window: {
	    resize: 'onWindowResize'
	  },
	  parent: {
	    element: { //event delegation
	      'click:relay(.button)': 'onButtonClick' 
	    }
	  },
	  expected: { 
	    'button:first-child': { //waits for widgets
	      parent: {}
	    }
	  }
	}
*/

LSD.Module.Events.Targets = {
	self: function() { 
		return this
	},
	element: function() { 
		return this.element
	},
	window: function() {
		return window;
	},
	document: function() {
		return this.document;
	},
	parent: function() {
		var self = this, watchers = this.watchers, group;
		var listeners = {
			inject: function(widget) {
				if (widget instanceof LSD.Widget) widget.addEvents(group);
			},		
			dispose: function(widget) {
				if (widget instanceof LSD.Widget) widget.removeEvents(group);
			}
		};
		return {
			addEvents: function(events) {
			  group = events;
			  self.addEvents(listeners);
			  if (self.parentNode) listeners.inject(self.parentNode);
			},
			
			removeEvents: function(events) {
			  group = events;
			  self.removeEvents(listeners);
			  if (self.parentNode) listeners.dispose(self.parentNode);
			}
		}
	}
};

(function(Events, Known, Positive, Negative) {
	Object.each(Object.append({}, Positive, Negative), function(state, name) {
		var positive = !!Positive[name];
		LSD.Module.Events.Targets[name] = function() {
			var self = this, setting = Known[state], group;
			var add		 = function() { self.addEvents(group);	 }
			var remove = function() { self.removeEvents(group) }
			return {
				addEvents: function(events) {
					group = events;
					if (self[state] ^ !positive) add.call(this)
					self.addEvent(setting[+!positive], add);
					self.addEvent(setting[+!!positive], remove);
				},
				removeEvents: function(events) {
					group = events;
					self.removeEvent(setting[+!positive], add);
					self.removeEvent(setting[+!!positive], remove);
				}
			}
		}
	});
})(LSD.Module.Events, LSD.States.Known, LSD.States.Positive, LSD.States.Negative)

/* 
	
*/

LSD.Module.Events.target = function(self, name) {
	if (name.charAt(0) == "_") return true;
	var target = LSD.Module.Events.Targets[name];
	if (!target) return;
	return target.call(self)
}

/*
	Defines special *on* pseudo class for events used for
	event delegation. The difference between usual event 
	delegation (which is :relay in mootools) and this, is
	that with :on you can use LSD selectors and it fires 
	callbacks in context of widgets.
	
	element.addEvent('mouseover:on(button)', callback)
*/

Event.definePseudo('on', function(split, fn, args){
	var event = args[0];
	var target = event.target;
	while (target) {
		var widget = document.id(event.target).get('widget');
		if (widget && widget.match(split.value)) {
			fn.apply(widget, [event, widget, target]);
			return;				
		}
		target = target.parentNode;
	}
});
/*
---
 
script: Expectations.js
 
description: A trait that allows to wait for related widgets until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Module.Events
  - LSD.Module.Attributes

provides: 
  - LSD.Module.Expectations
 
...
*/

(function() {

var Expectations = LSD.Module.Expectations = new Class({
  options: {
    events: {
      _expectations: {
        nodeInserted: function(widget) {
          var expectations = this.expectations, type = expectations.tag, tag = widget.options.tag;
          if (!type) type = expectations.tag = {};
          var group = type[tag];
          if (!group) group = type[tag] = [];
          group.push(widget);
          group = type['*'];
          if (!group) group = type['*'] = [];
          group.push(widget);
          update.call(this, widget, tag, true);
        },
        nodeRemoved: function(widget) {
          var expectations = this.expectations, type = expectations.tag, tag = widget.options.tag;
          type[tag].erase(this);
          type["*"].erase(this);
          update.call(this, widget, tag, false);
        }
      }
    }
  },
  
  getElementsByTagName: function(tag) {
    var cache = this.expectations.tag;
    return (cache && cache[tag.toLowerCase()]) || [];
  },
  
  initialize: function() {
    this.expectations = {};
    this.parent.apply(this, arguments);
  },
    
  removeClass: function(name) {
    check(this, 'classes', name, false);
    return this.parent.apply(this, arguments);
  },
  
  addClass: function(name) {
    var result = this.parent.apply(this, arguments);
    check(this, 'classes', name, true);
    return result;
  },
  
  removePseudo: function(pseudo) {
    check(this, 'pseudos', pseudo, false);
    return this.parent.apply(this, arguments);
  },
  
  addPseudo: function(pseudo) {
    var result = this.parent.apply(this, arguments);
    check(this, 'pseudos', pseudo, true);
    return result;
  },
  
  setAttribute: function(name) {
    check(this, 'attributes', name, false);
    var result = this.parent.apply(this, arguments);
    check(this, 'attributes', name, true);
    return result;
  },
  
  removeAttribute: function(name) {
    check(this, 'attributes', name, false);
    return this.parent.apply(this, arguments);
  },
  
  match: function(selector) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (selector.tag && (selector.tag != '*') && (this.options.tag != selector.tag)) return false;
    if (selector.id && (this.options.id != selector.id)) return false;
    if (selector.attributes) for (var i = 0, j; j = selector.attributes[i]; i++) 
      if (j.operator ? !j.test(this.attributes[j.key] && this.attributes[j.key].toString()) : !(j.key in this.attributes)) return false;
    if (selector.classes) for (var i = 0, j; j = selector.classes[i]; i++) if (!this.classes[j.value]) return false;
    if (selector.pseudos) {
      var states = this.options.states;
      for (var i = 0, j; j = selector.pseudos[i]; i++) {
        if (this.pseudos[j.key]) continue;
        if (j.key in this.options.states) return false;
        if (!selector.pseudo) selector.pseudo = {Slick: true, expressions: [[{combinator: ' ', tag: '*', pseudos: selector.pseudos}]]};
        if (!Slick.match(this, selector.pseudo)) return false;
        break;
      }
    }
    return true;
  },
  
  expect: function(selector, callback) {
    var combinator = selector.combinator || 'self', expectations = this.expectations[combinator];
    if (!expectations) expectations = this.expectations[combinator] = {};
    if (selector.combinator) {
      var tag = selector.tag, group = expectations[tag];
      if (!group) group = expectations[tag] = [];
      group.push([selector, callback]);
      if (!selector.structure) {
        var separated = separate(selector);
        selector.structure = { Slick: true, expressions: [[separated.structure]] }
        if (separated.state) selector.state = separated.state;
      }
      var state = selector.state;
      if (this.document) this.getElements(selector.structure).each(function(widget) {
        if (state) widget.expect(state, callback);
      });
    } else {
      for (var types = ['pseudos', 'classes', 'attributes'], type, i = 0; type = types[i++];) {
        var values = selector[type];
        if (values) values: for (var j = 0, value; (value = values[j++]) && (value = value.key || value.value);) {
          var kind = expectations[type];
          if (!kind) kind = expectations[type] = {};
          var group = kind[value];
          if (!group) group = kind[value] = [];
          for (var k = group.length, expectation; expectation = group[--k];) if (expectation[0] == selector) continue values;
          group.push([selector, callback]);
        }
      }
      if (this.match(selector)) callback(this, true);
    }
  },
  
  unexpect: function(selector, callback, iterator) {
    if (selector.expressions) selector = selector.expressions[0][0];
    if (selector.combinator) {
      remove(this.expectations[selector.combinator][selector.tag], callback);
      if (!selector.state) return;
      this.getElements(selector.structure).each(function(widget) {
        widget.unexpect(selector.state, callback);
        if (iterator) iterator(widget)
      });
    } else {
      if (iterator) iterator(widget)
      for (var types = ['pseudos', 'classes', 'attributes'], type, i = 0; type = types[i++];) {
        var values = selector[type], self = this.expectations.self;
        if (values) for (var j = 0, value; (value = values[j++]) && (value = value.key || value.value);) {
          remove(self[type][value], callback);
        }
      }
    }
  },
  
  watch: function(selector, callback, depth) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (!depth) depth = 0;
    selector.expressions.each(function(expressions) {
      var expression = expressions[depth];
      if (!expression.watcher) expression.watcher = function(widget, state) {
        if (expressions[depth + 1]) widget[state ? 'watch' : 'unwatch'](selector, callback, depth + 1)
        else callback(widget, state)
      }
      this.expect(expression, expression.watcher);
    }, this);
  },
  
  unwatch: function(selector, callback, depth) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (!depth) depth = 0;
    selector.expressions.each(function(expressions) {
      this.unexpect(expressions[depth], callback, function(widget) {
        if (expressions[depth + 1]) widget.unwatch(selector, callback, depth + 1)
        else callback(widget, false)
      })
    }, this);
  },
  
  use: function() {
    var selectors = Array.flatten(arguments);
    var widgets = []
    var callback = selectors.pop();
    var unresolved = selectors.length;
    selectors.each(function(selector, i) {
      var watcher = function(widget, state) {
        if (state) {
          if (!widgets[i]) {
            widgets[i] = widget;
            unresolved--;
            if (!unresolved) callback.apply(this, widgets.concat(state))
          }
        } else {
          if (widgets[i]) {
            if (!unresolved) callback.apply(this, widgets.concat(state))
            delete widgets[i];
            unresolved++;
          }
        }
      }
      this.watch(selector, watcher)
    }, this)
  }
  
});

var check = function(widget, type, value, state, target) {
  var expectations = widget.expectations
  if (!target) {
    expectations = expectations.self;
    target = widget;
  }
  expectations = expectations && expectations[type] && expectations[type][value];
  if (expectations) for (var i = 0, expectation; expectation = expectations[i++];) {
    var selector = expectation[0];
    if (selector.structure) {
      if (target.match(selector.structure)) target.expect(selector.state, expectation[1])
    } else if (target.match(expectation[0])) expectation[1](target, !!state)
  }
}

var notify = function(widget, type, tag, state, target) {
  check(widget, type, tag, state, target)
  check(widget, type, "*", state, target)
}

var update = function(widget, tag, state) {
  notify(this, ' ', tag, true, widget);
  if (this.previousSibling) {
    notify(this.previousSibling, '!+', widget.options.tag, state, widget);
    notify(this.previousSibling, '++', widget.options.tag, state, widget);
    for (var sibling = this; sibling = sibling.previousSibling;) {
      notify(sibling, '!~', tag, state, widget);
      notify(sibling, '~~', tag, state, widget);
    }
  }
  if (this.nextSibling) {
    notify(this.nextSibling, '+',  tag, state, widget);
    notify(this.nextSibling, '++', tag, state, widget);
    for (var sibling = this; sibling = sibling.nextSibling;) {
      notify(sibling, '~',  tag, state, widget);
      notify(sibling, '~~', tag, state, widget);
    }
  }
  if (widget.parentNode == this) notify(this, '>', widget.options.tag, state, widget);
}

var remove = function(array, callback) {
  if (array) for (var i = array.length; i--;) if (array[i][1] == callback) array.splice(i, 1);
}

var separate = function(selector) {
  if (selector.state || selector.structure) return selector
  var separated = {};
  for (var criteria in selector) {
    switch (criteria) {
      case 'tag': case 'combinator': case 'id':
        var type = 'structure';
        break;
      default:
        var type = 'state';
    }
    var group = separated[type];
    if (!group) group = separated[type] = {};
    group[criteria] = selector[criteria]
  };
  return separated;
}

Expectations.behaviours = {};
Expectations.behave = function(selector, events) {
  Expectations.behaviours[selector] = function(widget, state) {
    var behaviours = widget.expectations.behaviours;
    if (!behaviours) behaviours = widget.expectations.behaviours = {};
    var behaviour = behaviours[selector];
    if (!behaviour) behaviour = behaviours[selector] = widget.bindEvents(events);
    widget[state ? 'addEvents' : 'removeEvents'](behaviour);
  };
}

LSD.addEvent('ready', function() {
  for (selector in Expectations.behaviours) LSD.document.watch(selector, Expectations.behaviours[selector]);
});

LSD.Module.Events.Targets.expected = function() {
  var self = this, Targets = LSD.Module.Events.Targets;
  return {
    addEvents: function(events) {
      Hash.each(events, function(value, key) {
        if (!self.watchers) self.watchers = {};
        self.watchers[key] = function(widget, state) {
          value = Object.append({}, value)
          for (var name in value) {
            if (typeof value[name] == 'object') continue;
            widget.addEvent(name, value[name]);
            delete value[name];
          }
          for (var name in value) {
            target = (Targets[name] || Targets.expected).call(widget);
            target[state ? 'addEvents' : 'removeEvents'](value);
            break;
          }
        };
        self.watch(key, self.watchers[key]);
      });
    },
    removeEvents: function(events) {
      Hash.each(events, function(value, key) {
        self.unwatch(key, self.watchers[key]);
      });
    }
  }
}



})();
/*
---

script: Proxies.js

description: Dont adopt children, pass them to some other widget

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.Expectations

provides: 
  - LSD.Trait.Proxies

...
*/

LSD.Trait.Proxies = new Class({
  
  options: {
    proxies: {}
  },
  
  getProxies: Macro.getter('proxies', function() {
    var options = this.options.proxies;
    var proxies = [];
    for (var name in options) proxies.push(options[name]);
    return proxies.sort(function(a, b) {
      return (b.priority || 0) - (a.priority || 0)
    })
  }),
  
  proxyChild: function(child, proxy) {
    if (typeof proxy == 'string') proxy = this.options.proxies[proxy];
    if (!proxy.condition.call(this, child)) return false;
    var reinject = function(target) {
      if (proxy.rewrite === false) {
        this.appendChild(child, function() {
          target.adopt(child);
        });
      } else {
        child.inject(target);
      }
    };
    var container = proxy.container;
    if (container.call) {
      reinject.call(this, container.call(this));
    } else {
      this.use(container, reinject.bind(this))
    }
    return true;
  },
  
  canAppendChild: function(child) {
    for (var i = 0, proxies = this.getProxies(), proxy; proxy = proxies[i++];) if (this.proxyChild(child, proxy)) return false;
    return true;
  }
  
});
/*
---
 
script: Command.js
 
description: A command getter that watches attributes to redefine command
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Module.Expectations
  - LSD.Command.Command
  - LSD.Command.Radio
  - LSD.Command.Checkbox
  
provides: 
  - LSD.Module.Command
 
...
*/

/*
  Usually widget generate a command on its own. 
  
  The default type is 'command', but there are possible values of 
  'radio' and 'checkbox'.
  
  Type type can be changed via *options.command.type* 
  (equals to 'command-type' attribute).
  
  You can specify a command id in *command* attribute
  to link a widget to already initialized command.
*/

LSD.Module.Command = new Class({
  options: {
    command: {},
    expectations: {
      '[radiogroup]': ['getCommand', true],
      '[command]': ['getCommand', true],
    }
  },

  getCommand: function(force) {
    if (!force && this.command) return this.command;
    if (!this.attributes.command || !this.document.commands) {
      var options = this.options.command || {};
      var type = options.type || 'command', command;
      options = Object.append({id: this.options.id, name: this.attributes.name}, options);
      if (this.attributes.radiogroup) {
        options.radiogroup = this.attributes.radiogroup;
        type = 'radio'
      };
      if (!command) command = new LSD.Command[type.capitalize()](this.document, options);
    } else command = this.document.commands[this.attributes.command];
    command.attach(this);
    if (force && this.command) this.command.detach(this);
    return this.command = command;
  },
  
  click: function() {
    this.fireEvent('click', arguments);
    return this.getCommand().click();
  }
  
});
/*
---
 
script: Actions.js
 
description: Assign functions asyncronously to any widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - LSD.Module.Expectations
 
provides: 
  - LSD.Module.Actions
 
...
*/

LSD.Module.Actions = new Class({
  
  initialize: function() {
    this.actions = {};
    this.parent.apply(this, arguments);
    var actions = this.options.actions;
    for (var name in actions) {
      var action = actions[name];
      if (!action.lazy && action.enable && action.disable) this.addAction(name)
    }
  },
  
  addAction: function() {
    this.getAction.apply(this, arguments).attach(this);
  },
  
  removeAction: function() {
    this.getAction.apply(this, arguments).detach(this);
  },
  
  getAction: function(action) {
    if (action instanceof LSD.Action) return action;
    if (typeof action == 'string') {
      if (this.actions[action]) return this.actions[action];
      action = Object.append(this.options.actions[action], {name: action});
    } 
    return this.actions[action.name] || (this.actions[action.name] = new LSD.Action(action, action.name))
  },

  mixin: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[mixin.capitalize()];
    Class.mixin(this, mixin);
    var options = Object.clone(mixin.prototype.options);
    if (!options) return;
    for (var action in options.actions) this.addAction(action);
    if (options.events) this.addEvents(this.bindEvents(options.events));
  },

  unmix: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[mixin.capitalize()];
    var options = Object.clone(mixin.prototype.options);
    if (options) {
      for (var action in options.actions) this.removeAction(action);
      if (options.events) this.removeEvents(this.bindEvents(options.events));
    };
    Class.unmix(this, mixin);
  }
});

LSD.addEvent('before', function() {
  Object.each(LSD.Mixin, function(mixin, name) {
    var selector = mixin.prototype.behaviour;
    if (!selector) return;
    var watcher = function (widget, state) {
      widget[state ? 'mixin' : 'unmix'](mixin)
    };
    selector.split(/\s*,\s*/).each(function(bit) {
      LSD.Module.Expectations.behaviours[bit] = watcher;
    })
  });
})
/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Base
  - LSD.Module.Layout
  - LSD.Module.Styles
  - LSD.Module.Events
  - LSD.Module.DOM
  - LSD.Module.Expectations
  - LSD.Module.Container
  - LSD.Module.Attributes
  - LSD.Module.Actions
  - LSD.Module.Command

provides: 
  - LSD.Widget
  - LSD.Widget.create
 
...
*/

/*
  LSD.Widget autoloads all of the modules that are defined in Old.Module namespace
  unless LSD.modules array is provided.
  
  So if a new module needs to be included into the base class, then it only needs
  to be *require*d.
*/
  
if (!LSD.modules) {
  LSD.modules = []
  for (var name in LSD.Module) LSD.modules.push(LSD.Module[name]);
}

LSD.Widget = new Class({
  
  States: Object.append({
    'built': ['build', 'destroy', false],
    'attached': ['attach', 'detach', false],
    'dirty': ['update', 'render', false]
  }, Object.subset(LSD.States.Known, ['disabled', 'hidden'])),
  
  Includes: Array.concat(LSD.Base, LSD.modules),
  
  options: {
    element: {
      tag: 'div'
    },
    writable: false
  },
  
  initialize: function(options) {
    this.setOptions(options);
    this.dirty = true;
    this.parent.apply(this, arguments);
    if (this.options.writable && !this.attributes.tabindex && (this.options.focusable !== false)) this.setAttribute('tabindex', 0) 
    this.addPseudo(this.options.writable ? 'read-write' : 'read-only');
  }
});

//Basic widget initialization
LSD.Widget.count = 0;
LSD.Widget.create = function(klasses, a, b, c, d) {
  klasses = $splat(klasses);
  var base = klasses[0].indexOf ? LSD.Widget : klasses.shift();
  var klass = klasses.shift();
  var original = klass;
  if (klass.indexOf('-') > -1) { 
    var bits = klass.split('-');
    while (bits.length > 1) base = base[bits.shift().camelCase().capitalize()];
    klass = bits.join('-');
  }
  klass = klass.camelCase().capitalize();
  if (!base[klass]) {
    original = original.replace(/-(.)/g, function(whole, bit) {
      return '.' + bit.toUpperCase();
    }).capitalize();
    throw 'ClassName LSD.Widget.' + original + ' was not found';
  }
  var widget = base[klass];
  if (klasses.length) {
    klasses = klasses.map(function(name) {
      return name.camelCase ? LSD.Trait[name.camelCase().capitalize()] : name;
    });
    widget = Class.include(widget, klasses)
  }
  LSD.Widget.count++;
  return new widget(a, b, c, d);
};
/*
---
 
script: Element.js
 
description: Lightweight base class for element-based widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget

provides: 
  - LSD.Widget.Element
 
...
*/

LSD.Widget.Element = new Class({

  Extends: LSD.Widget,

  options: {
    element: {
      tag: 'div'
    },
    events: {}
  },
  
  style: {
    current: {}
  },
  
  setStyle: function(property, value) {
    if (!this.parent.apply(this, arguments)) return;
    if (!this.element) return true;
    return !this.element.setStyle(property, value);
  },
  
  getStyle: function(property) {
    switch(property) { 
      case "height":
        return this.element.offsetHeight;
      case "width":
        return this.element.offsetWidth
      default:
        return this.element.getStyle(property)
    }
  },
  
  getLayoutHeight: function() {
    return this.element.offsetHeight
  },
  
  setStyles: function(properties) {
    for (var property in properties) this.setStyle(property, properties[property]);
    return true;
  },
  
  renderStyles: $lambda(false)
});
/*
---
 
script: Container.js
 
description: Container widget to wrap around the content
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD/LSD.Widget.Element

provides: 
  - LSD.Widget.Container
 
...
*/

LSD.Widget.Container = new Class({
  Extends: LSD.Widget.Element,
  
  options: {
    tag: 'container'
  }
});
/*
---
 
script: Label.js
 
description: Supplementary field for any kind of widgets that take focus
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD/LSD.Widget.Element

provides: 
  - LSD.Widget.Label
 
...
*/

LSD.Widget.Label = new Class({
  Extends: LSD.Widget.Element,
  
  options: {
    tag: 'label',
    element: {
      tag: 'label'
    },
    events: {
      element: {
        click: 'focusRelatedWidget'
      }
    },
  },
  
  getInput: function() {
    if (!this.input) this.input = new Element('textarea');
    return this.input;
  },
  
  focusRelatedWidget: function() {
    var parent = this;
    var target = this.attributes['for'];
    if (!target || target.match(/\^s*$/)) return;
    
    while (parent.parentNode && parent.parentNode != this.document) parent = parent.parentNode; //search by id in topmost widget
    var element = parent.getElement("#" + target);
    if (!element) return;
    if (element.retain) element.retain();
    if (element.click) element.click();
  }
});
/*
---
 
script: Widget.Paint.js
 
description: Base class for widgets that use SVG layers in render
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget
  - LSD.Trait.Shape
  - LSD.Trait.Dimensions
  - LSD.Trait.Layers
  - LSD.Layer.Color
  - LSD.Layer.Offset
  - LSD.Layer.Radius
  - LSD.Layer.Shadow.Blur
  - LSD.Layer.Shadow.Inset
  - LSD.Layer.Shadow
  - LSD.Layer.Shadow.Native
  - LSD.Layer.Shadow.Onion
  - LSD.Layer.Shape
  - LSD.Layer.Size
  - LSD.Layer.Scale
  - LSD.Layer.Stroke
  - LSD.Layer.Position
  - LSD/ART.Shape.Arrow
  - LSD/ART.Shape.Ellipse
  - LSD/ART.Shape.Flower
  - LSD/ART.Shape.Rectangle
  - LSD/ART.Shape.Star
  
provides: 
  - LSD.Widget.Paint
 
...
*/

LSD.Widget.Paint = new Class({
  Includes: [
    LSD.Widget,
    LSD.Trait.Dimensions,
    LSD.Trait.Layers
  ],
  
  options: {
    layers: {
      shadow:     ['size', 'radius', 'shape', 'shadow'],
      stroke:     [        'radius', 'stroke', 'shape', 'fill'],
      background: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
      foreground: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
      reflection: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
      icon:       ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position','shadow'],
      glyph:      ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position', 'shadow']
    }
  },
  
  getCanvas: Macro.getter('canvas', function() {
    var art = new ART;
    art.toElement().inject(this.toElement(), 'top');
    return art;
  })
});

/*
  Pre-generate CSS grammar for layers.
  
  It is not required for rendering process itself, because
  this action is taken automatically when the first
  widget gets rendered. Declaring layer css styles upfront
  lets us use it in other parts of the framework
  (e.g. in stylesheets to validate styles)
*/
(function(layers, shapes) {
  for (var layer in layers) LSD.Layer.get(layer, layers[layer]);
})(LSD.Widget.Paint.prototype.options.layers, ART.Shape);
/*
---
 
script: Menu.js
 
description: Menu widget base class
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD/LSD.Widget.Paint

provides: 
  - LSD.Widget.Menu
 
...
*/

LSD.Widget.Menu = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'menu',
    element: {
      tag: 'menu'
    }
  }
});

LSD.Widget.Menu.Command = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'command',
    element: {
      tag: 'command'
    }
  }
});

(function(Command) {
  Command.Command = Command.Checkbox = Command.Radio = Command;
})(LSD.Widget.Menu.Command);
/*
---
 
script: Context.js
 
description: Menu widget to be used as a drop down
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Menu
  - LSD/LSD.Trait.Item
  - LSD/LSD.Trait.Animation

provides:
  - LSD.Widget.Menu.Context
  - LSD.Widget.Menu.Context.Button
  - LSD.Widget.Menu.Context.Command
  - LSD.Widget.Menu.Context.Command.Command
  - LSD.Widget.Menu.Context.Command.Checkbox
  - LSD.Widget.Menu.Context.Command.Radio
 
...
*/
LSD.Widget.Menu.Context = new Class({
  Includes: [
    LSD.Widget.Menu,
    LSD.Trait.Animation
  ],

  options: { 
    attributes: {
      type: 'context'
    },
    
    animation: {
      duration: 200
    }
  }
});

LSD.Widget.Menu.Context.Command = new Class({
  Includes: [
    LSD.Widget.Menu.Command,
    LSD.Trait.Item.Stateful
  ]
});

(function(Context) {
  Context.Button = Context.Option = Context.Radio = Context.Checkbox = Context.Command.Command = Context.Command;
})(LSD.Widget.Menu.Context);

    


/*
---
 
script: Menu.js
 
description: Dropdowns should be easy to use.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Widgets/LSD.Widget.Menu.Context

provides:
  - LSD.Trait.Menu
  - LSD.Trait.Menu.States
  - LSD.Trait.Menu.Stateful
 
...
*/

LSD.Trait.Menu = new Class({      
  options: {
    layout: {
      menu: 'menu[type=context]#menu'
    },
    shortcuts: {
      ok: 'set',
      cancel: 'cancel'
    },
    events: {
      _menu: {
        self: {
          expand: 'makeItems',
          redraw: 'repositionMenu',
          focus: 'repositionMenu',
          blur: 'collapse',
          next: 'expand',
          previous: 'expand',
          cancel: 'collapse'
        }
      }
    },
    proxies: {
      menu: {
        container: 'menu',
        condition: function(widget) {
          return !!widget.setList
        }
      }
    },
    menu: {
      position: 'top',
      width: 'auto'
    }
  },

  cancel: function() {
    this.collapse();
  },

  set: function() {
    this.collapse();
  },
  
  repositionMenu: function() {
    if (!this.menu || this.collapsed) return;
    var top = 0;
    switch (this.options.menu.position) {
      case 'bottom': 
        top = this.getOffsetHeight() + ((this.offset.padding.top || 0) - (this.offset.inside.top || 0)) + 1;
        break;
      case 'center':
        top = - (this.getOffsetHeight() + ((this.offset.padding.top || 0) - (this.offset.inside.top || 0))) / 2;
        break;
      case 'focus':
        top = - this.getSelectedOptionPosition();
        break;
      default:
    }
    this.menu.setStyle('top', top);
    this.menu.setStyle('left', this.offset.outside.left);
    switch (this.options.menu.width) {
      case "adapt": 
        this.menu.setWidth(this.getStyle('width'));
        break;
      case "auto":
        break;
    }
  },
  
  getMenu: Macro.getter('menu', function() {
    return this.buildLayout(this.options.layout.menu);
  }),
  
  expand: Macro.onion(function() {
    if (!this.menu) {
      this.getMenu();
      this.repositionMenu();
      if (this.hasItems()) this.refresh();
    } else {  
      this.repositionMenu();
    }
    if (this.hasItems()) this.menu.show();
    else this.menu.hide();
  }),
  
  collapse: Macro.onion(function() {
    if (this.menu) this.menu.hide();
    //this.repositionMenu();
  }),
  
  getSelectedOptionPosition: $lambda(0)
});

LSD.Trait.Menu.State = Class.Stateful({
  'expanded': ['expand', 'collapse']
});
LSD.Trait.Menu.Stateful = [
  LSD.Trait.Menu.State,
  LSD.Trait.Menu
]
/*
---
 
script: Window.js
 
description: Window for fun and profit
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD/LSD.Widget.Paint
- LSD/LSD.Trait.Animation
 
provides: [LSD.Widget.Window]
 
...
*/

LSD.Widget.Window = new Class({
  
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Animation
  ],
  
  States: {
    'closed': ['close', 'open'],
    'collapsed': ['collapse', 'expand'],
    'minified': ['minify', 'enlarge', 'mutate']
  },
  
  options: {
    tag: 'window'
  }
  
});
/*
---
 
script: Application.js
 
description: A preset for window application with header and titlebar
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Window
 
provides: 
  - LSD.Widget.Window.Application
 
...
*/

LSD.Widget.Window.Application = new Class({
  Extends: LSD.Widget.Window,
  
  options: {
    actions: {
      draggable: {
        watches: "#title"
      },
      resizable: {
        uses: ["#handle", "#content"]
      }
    },
    events: {
      expected: {
        '#buttons': {
          '#close': {
            click: 'close'
          },
          '#minimize': {
            click: 'collapse'
          },
          '#maximizer': {
            click: 'expand'
          }
        },
        header: {
          '#toggler': {
            click: 'mutate'
          }
        }
      },
      self: {
        close: 'hide'
      }
    }
  }
})
/*
---
 
script: Button.js
 
description: A button widget. You click it, it fires the event
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD/LSD.Widget.Paint
  - LSD/LSD.Mixin.Touchable

provides: 
  - LSD.Widget.Button
 
...
*/

LSD.Widget.Button = new Class({

  Extends: LSD.Widget.Paint,

  options: {
    tag: 'button',
    label: ''
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.addPseudo('touchable');
  },
  
  setContent: function(content) {
    this.setState('text');
    return this.parent.apply(this, arguments);
  }

});

/*
---
 
script: Section.js
 
description: SVG-Based content element (like <section> in html5)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD/LSD.Widget.Paint

provides: 
  - LSD.Widget.Section
  - LSD.Widget.Header
  - LSD.Widget.Footer
  - LSD.Widget.Nav
 
...
*/

LSD.Widget.Section = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'section',
    element: {
      tag: 'section'
    }
  }
});

LSD.Widget.Header = new Class({
  Extends: LSD.Widget.Section,
  
  options: {
    tag: 'header',
    element: {
      tag: 'header'
    }
  }
});

LSD.Widget.Footer = new Class({
  Extends: LSD.Widget.Section,

  options: {
    tag: 'footer',
    element: {
      tag: 'footer'
    }
  }
});

LSD.Widget.Nav = new Class({
  Extends: LSD.Widget.Section,

  options: {
    tag: 'nav',
    element: {
      tag: 'nav'
    }
  }
});
/*
---
 
script: Scrollbar.js
 
description: Scrollbars for everything
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD/LSD.Widget.Paint
- LSD.Widget.Section
- LSD.Widget.Button
- LSD/LSD.Trait.Slider

provides: [LSD.Widget.Scrollbar]
 
...
*/

LSD.Widget.Scrollbar = new Class({
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Slider
  ],
  
  options: {
    tag: 'scrollbar',
    events: {
      expected: {
        '#incrementor': {
          click: 'increment'
        },
        '#decrementor': {
          click: 'decrement'
        }
      }
    },
    layout: {
      children: {
        '^track#track': {
          'scrollbar-thumb#thumb': {},
        },
        '^button#decrementor': {},
        '^button#incrementor': {}
      }
    },
    slider: {
      wheel: true
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.setState(this.options.mode);
  },
  
  onParentResize: function(size, old){
    if (!size || $chk(size.height)) size = this.parentNode.size;
    var isVertical = (this.options.mode == 'vertical');
    var other = isVertical ? 'horizontal' : 'vertical';
    var prop = isVertical ? 'height' : 'width';
    var Prop = prop.capitalize();
    var setter = 'set' + Prop;
    var getter = 'getClient' + Prop;
    var value = size[prop];
    if (isNaN(value) || !value) return;
    var invert = this.parentNode[other];
    var scrolled = this.getScrolled();
    $(scrolled).setStyle(prop, size[prop])
    var ratio = size[prop] / $(scrolled)['scroll' + Prop]
    var delta = (!invert || !invert.parentNode ? 0 : invert.getStyle(prop));
    this[setter](size[prop] - delta);
    var offset = 0;
    if (this.track.offset.inner) {
      if (isVertical) {
        offset += this.track.offset.inner.top + this.track.offset.inner.bottom
      } else {
        offset += this.track.offset.inner.left + this.track.offset.inner.right
      }
    }
    var track = size[prop] - this.incrementor[getter]() - this.decrementor[getter]() - delta - ((this.style.current.strokeWidth || 0) * 2) - offset * 2
    this.track[setter](track);
    this.track.thumb[setter](Math.ceil(track * ratio))
    this.refresh(true);
    this.parent.apply(this, arguments);
  },
  
  inject: function(widget) {
    var result = this.parent.apply(this, arguments);
    this.options.actions.slider.enable.call(this);
    return result
  },
  
  onSet: function(value) {
    var prop = (this.options.mode == 'vertical') ? 'height' : 'width';
    var direction = (this.options.mode == 'vertical') ? 'top' : 'left';
    var element = $(this.getScrolled());
    var result = (value / 100) * (element['scroll' + prop.capitalize()] - element['offset' + prop.capitalize()]);
    element['scroll' + direction.capitalize()] = result;
    this.now = value;
  },
  
  getScrolled: Macro.getter('scrolled', function() {
    var parent = this;
    while ((parent = parent.parentNode) && !parent.getScrolled);
    return parent.getScrolled ? parent.getScrolled() : this.parentNode.element;
  }),
  
  getTrack: function() {
    return $(this.track)
  },
  
  getTrackThumb: function() {
    return $(this.track.thumb);
  }
})

LSD.Widget.Scrollbar.Track = new Class({
  Extends: LSD.Widget.Section,
  
  options: {
    tag: 'track'
  }
});

LSD.Widget.Scrollbar.Thumb = new Class({
  Extends: LSD.Widget.Button,
  
  options: {
    tag: 'thumb'
  }
});

LSD.Widget.Scrollbar.Button = LSD.Widget.Button;
/*
---
 
script: Scrollable.js
 
description: For all the scrollbars you always wanted
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Widgets/LSD.Widget.Scrollbar

provides: 
  - LSD.Mixin.Scrollable
 
...
*/

LSD.Mixin.Scrollable = new Class({
  behaviour: '[scrollable][scrollable!=false]',
  
  options: {
    events: {
      self: {
        resize: 'showScrollbars'
      },
      element: {
        mousewheel: 'onMousewheel'
      }
    }
  },
  
  onMousewheel: function(event) {
    var scrollbar = this.vertical || this.horizontal;
    if (scrollbar) scrollbar.track.element.fireEvent('mousewheel', event  );
  },
  
  showScrollbars: function(size) {
    if (!size) size = this.size;
    var scrolled = document.id(this.getScrolled());
    scrolled.setStyles(size)
    scrolled.setStyle('overflow', 'hidden');
    if (size.width < scrolled.scrollWidth) {
      if (this.getHorizontalScrollbar().parentNode != this) this.horizontal.inject(this);
      this.horizontal.slider.set(this.horizontal.now)
    } else if (this.horizontal) this.horizontal.dispose();
    
    if (size.height < scrolled.scrollHeight) {
      if (this.getVerticalScrollbar().parentNode != this) this.vertical.inject(this);
        this.vertical.slider.set(this.vertical.now)
    } else if (this.vertical) this.vertical.dispose();
  },
  
  getVerticalScrollbar: Macro.getter('vertical', function() {
    return this.buildLayout('scrollbar[mode=vertical]', null, null)
  }),
  
  getHorizontalScrollbar: Macro.getter('horizontal', function() {
    return this.buildLayout('scrollbar[mode=horizontal]')
  }),
  
  getScrolled: Macro.defaults(function() {
    return this.getWrapper();
  })
});
/*
---
 
script: Form.js
 
description: A form widgets. Intended to be submitted.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD/LSD.Widget.Paint

provides: [LSD.Widget.Form]
 
...
*/

LSD.Widget.Form = new Class({
  Extends: LSD.Widget.Paint,

  options: {
    tag: 'form',
    element: {
      tag: 'form'
    },
    layers: {},
    events: {
      element: {
        submit: $lambda(false)
      }
    }
  }  
});
/*
---
 
script: Resizable.js
 
description: Document that redraws children when window gets resized.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document
  - LSD.Module.Layout
  - LSD.Module.Events
  - LSD.Module.Attributes
 
provides:
  - LSD.Document.Resizable
 
...
*/

LSD.Document.Resizable = new Class({
	Includes: [
    LSD.Document,
    LSD.Module.Layout,
    LSD.Module.Events,
    LSD.Module.Attributes
	],
	
	options: {
  	events: {
  	  window: {
  	    resize: 'onResize'
  	  }
  	},
  	root: true
  },

	initialize: function() {
	  this.style = {
	    current: {}
	  };
	  this.parent.apply(this, arguments);
	  this.attach();
	  this.onResize();
	},
	
	onResize: function() {
	  Object.append(this.style.current, document.getCoordinates());
	  this.render()
	},
	
	render: function() {
		this.childNodes.each(function(child){
		  child.refresh();
		});
	}
});
/*
---
 
script: Body.js
 
description: Lightweight document body wrapper
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD/LSD.Document.Resizable
  - LSD/LSD.Widget
  - LSD/LSD.Module.Expectations
  
provides:
  - LSD.Widget.Body

...
*/

LSD.Widget.Body = new Class({
  Includes: [LSD.Document.Resizable, LSD.Module.Expectations]
});
/*
---
 
script: QFocuser.js
 
description: class for keyboard navigable AJAX widgets for better usability and accessibility
 
license: MIT-style license.
 
provides: [QFocuser]
 
...
*/

var QFocuser = (function() {

        // current safari doesnt support tabindex for elements, but chrome does. 
        // When Safari nightly version become current, this switch will be removed.
        var supportTabIndexOnRegularElements = (function() {
                var webKitFields = RegExp("( AppleWebKit/)([^ ]+)").exec(navigator.userAgent);
                if (!webKitFields || webKitFields.length < 3) return true; // every other browser support it
                var versionString = webKitFields[2],
                    isNightlyBuild = versionString.indexOf("+") != -1;
                if (isNightlyBuild || (/chrome/i).test(navigator.userAgent)) return true;
        })();

        return (supportTabIndexOnRegularElements ? function(widget, options) {

                var isIE = document.attachEvent && !document.addEventListener,
                        focused,
                        previousFocused,
                        lastState,
                        widgetState,
                        widgetFocusBlurTimer;

                options = (function() {
                        var defaultOptions = {
                                onFocus: function(el, e) { },
                                onBlur: function(el, e) { },
                                onWidgetFocus: function() { },
                                onWidgetBlur: function() { },
                                tabIndex: 0, // add tabindex to your widget to be attainable by tab key
                                doNotShowBrowserFocusDottedBorder: true
                        };
                        for (var option in options) defaultOptions[option] = options[option];
                        return defaultOptions;
                })();

                init();

                // something to make IE happy
                if (isIE) {
                        window.attachEvent('onunload', function() {
                                window.detachEvent('onunload', arguments.callee);
                                widget.clearAttributes();
                        });
                }

                function init() {
                        setTabIndex(widget, options.tabIndex);
                        // IE remembers focus after page reload but don't fire focus
                        if (isIE && widget == widget.ownerDocument.activeElement) widget.blur();
                        toggleEvents(true);
                };

                function hasTabIndex(el) {
                        var attr = el.getAttributeNode('tabindex');
                        return attr && attr.specified;
                };

                function setTabIndex(el, number) {
                        var test = document.createElement('div');
                        test.setAttribute('tabindex', 123);
                        var prop = hasTabIndex(test) ? 'tabindex' : 'tabIndex';
                        (setTabIndex = function(el, number) {
                                el.setAttribute(prop, '' + number);
                                if (options.doNotShowBrowserFocusDottedBorder) hideFocusBorder(el);
                        })(el, number);
                };

                function getTabIndex(el) {
                        return hasTabIndex(el) && el.tabIndex;
                };

                function hideFocusBorder(el) {
                        if (isIE) el.hideFocus = true;
                        else el.style.outline = 0;
                };

                function toggleEvents(register) {
                        var method = register ? isIE ? 'attachEvent' : 'addEventListener' : isIE ? 'detachEvent' : 'removeEventListener';
                        if (isIE) {
                                widget[method]('onfocusin', onFocusBlur);
                                widget[method]('onfocusout', onFocusBlur);
                        }
                        else {
                                widget[method]('focus', onFocusBlur, true);
                                widget[method]('blur', onFocusBlur, true);
                        }
                };

                function onFocusBlur(e) {
                        e = e || widget.ownerDocument.parentWindow.event;
                        var target = e.target || e.srcElement;
                        lastState = { focusin: 'Focus', focus: 'Focus', focusout: 'Blur', blur: 'Blur'}[e.type];
                        // filter bubling focus and blur events, only these which come from elements setted by focus method are accepted                
                        if (target == focused || target == previousFocused) {
                                options['on' + lastState](target, e);
                        }
                        clearTimeout(widgetFocusBlurTimer);
                        widgetFocusBlurTimer = setTimeout(onWidgetFocusBlur, 10);
                };

                function onWidgetFocusBlur() {
                        if (widgetState == lastState) return;
                        widgetState = lastState;
                        options['onWidget' + widgetState]();
                };

                // call this method only for mousedown, in case of mouse is involved (keys are ok)
                function focus(el) {
                        if (focused) {
                                setTabIndex(focused, -1); // to disable tab walking in widget
                                previousFocused = focused;
                        }
                        else setTabIndex(widget, -1);
                        focused = el;
                        setTabIndex(focused, 0);
                        focused.focus();
                };

                // call this method after updating widget content, to be sure that tab will be attainable by tag key
                function refresh() {
                        var setIndex = getTabIndex(widget) == -1,
                                deleteFocused = true,
                                els = widget.getElementsByTagName('*');
                        for (var i = els.length; i--; ) {
                                var idx = getTabIndex(els[i]);
                                if (idx !== false && idx >= 0) setIndex = true;
                                if (els[i] === focused) deleteFocused = false;
                        }
                        if (setIndex) setTabIndex(widget, 0);
                        if (deleteFocused) focused = null;
                };

                function getFocused() {
                        return focused;
                };

                // return element on which you should register key listeners
                function getKeyListener() {
                        return widget;
                };

                function destroy() {
                        toggleEvents();
                };

                return {
                        focus: focus,
                        getFocused: getFocused,
                        getKeyListener: getKeyListener,
                        refresh: refresh,
                        destroy: destroy
                }
        } :

        // version for Safari, it mimics focus blur behaviour
        function(widget, options) {

                var focuser,
                        lastState,
                        widgetState = 'Blur',
                        widgetFocusBlurTimer,
                        focused;

                options = (function() {
                        var defaultOptions = {
                                onFocus: function(el, e) { },
                                onBlur: function(el, e) { },
                                onWidgetFocus: function() { },
                                onWidgetBlur: function() { },
                                tabIndex: 0, // add tabindex to your widget to be attainable by tab key
                                doNotShowBrowserFocusDottedBorder: true
                        };
                        for (var option in options) defaultOptions[option] = options[option];
                        return defaultOptions;
                })();

                init();

                function init() {
                        focuser = widget.ownerDocument.createElement('input');
                        var wrapper = widget.ownerDocument.createElement('span');
                        wrapper.style.cssText = 'position: absolute; overflow: hidden; width: 0; height: 0';
                        wrapper.appendChild(focuser);
                        // it's placed in to widget, to mimics tabindex zero behaviour, where element document order matter 
                        widget.insertBefore(wrapper, widget.firstChild);
                        toggleEvent(true);
                };

                function toggleEvent(register) {
                        var method = register ? 'addEventListener' : 'removeEventListener';
                        focuser[method]('focus', onFocusBlur);
                        focuser[method]('blur', onFocusBlur);
                        window[method]('blur', onWindowBlur);
                        //widget[method]('mousedown', onWidgetMousedown);
                };

                // set active simulation
                function onWidgetMousedown(e) {
                        if (widgetState == 'Blur') {
                                setTimeout(function() {
                                        focuser.focus();
                                }, 1);
                        }
                };

                function onFocusBlur(e) {
                        lastState = e.type.charAt(0).toUpperCase() + e.type.substring(1);
                        if (focused) options['on' + lastState](focused, e);
                        clearTimeout(widgetFocusBlurTimer);
                        widgetFocusBlurTimer = setTimeout(onWidgetFocusBlur, 10);
                };

                function onWidgetFocusBlur() {
                        if (widgetState == lastState) return;
                        widgetState = lastState;
                        options['onWidget' + widgetState]();
                };

                // safari is so stupid.. doesn't fire blur event when another browser tab is switched
                function onWindowBlur() {
                        focuser.blur();
                };

                function focus(el) {
                        setTimeout(function() {
                                focuser.blur();
                                setTimeout(function() {
                                        focused = el;
                                        focuser.focus();
                                }, 1);
                        }, 1);
                };

                function refresh() {
                        var deleteFocused = true,
                                els = widget.getElementsByTagName('*');
                        for (var i = els.length; i--; ) {
                                if (els[i] === focused) deleteFocused = false;
                        }
                        if (deleteFocused) focused = null;
                };

                function getFocused() {
                        return focused;
                };

                function getKeyListener() {
                        return focuser;
                };

                function destroy() {
                        toggleEvents();
                };

                return {
                        focus: focus,
                        getFocused: getFocused,
                        getKeyListener: getKeyListener,
                        refresh: refresh,
                        destroy: destroy
                }

        });

})();
/*
---
 
script: Focus.js
 
description: A trait to make widget take focus like a regular input (even in Safari)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - QFocuser/QFocuser
 
provides:
  - LSD.Mixin.Focus
  - LSD.Mixin.Focus.State
  - LSD.Mixin.Focus.Propagation
 
...
*/
  
LSD.Mixin.Focus = new Class({
  behaviour: '[tabindex][tabindex!=-1]',
  
  options: {
    actions: {
      focus: {
        target: false,
        enable: function() {
          if (this.tabindex != null) {
            this.attributes.tabindex = this.tabindex
            if (this.focuser) this.element.set('tabindex', this.tabindex)
            delete this.tabindex;
          }
          if (this.attributes.tabindex == -1) return;
          this.getFocuser();
          this.addEvents(this.events.focus);
          this.element.addEvents(this.bindEvents({mousedown: 'retain'}));
        },
        
        disable: function() {
          this.blur();
          if (this.options.tabindex == -1) return;
          this.tabindex = this.options.tabindex || 0;
          this.element.set('tabindex', -1)
          this.attributes.tabindex = -1;
          this.removeEvents(this.events.focus);
          this.element.removeEvents(this.bindEvents({mousedown: 'retain'}));
        }
      }
    }
  },
  
  getFocuser: Macro.getter('focuser', function() {
    return new QFocuser(this.toElement(), {
      onWidgetFocus: this.onFocus.bind(this),
      onWidgetBlur: this.onBlur.bind(this),
      tabIndex: this.getAttribute('tabindex')
    })
  }),
  
  focus: function(element) {
    if (element !== false) {
      this.getFocuser().focus(element || this.element);
      this.document.activeElement = this;
    }
    if (this.focused) return;
    this.focused = true;
    this.fireEvent('focus', arguments);
    this.onStateChange('focused', true);
    LSD.Mixin.Focus.Propagation.focus(this);
  },
  
  blur: function(propagated) {
    if (!this.focused) return;
    this.focused = false;
    this.fireEvent('blur', arguments);
    this.onStateChange('focused', false);
    if (!propagated) LSD.Mixin.Focus.Propagation.blur.delay(10, this, this);
  },
  
  retain: function(e) {
    if (e) e.stopPropagation()
    this.focus();
  },
  
  onFocus: Macro.defaults(function() {
    this.focus(false);
    this.document.activeElement = this;
  }),
  
  onBlur: Macro.defaults(function() {
    var active = this.document.activeElement;
    if (active == this) delete this.document.activeElement;
    while (active && (active = active.parentNode)) if (active == this) return;
    this.blur();
  }),
  
  getKeyListener: function() {
    return this.getFocuser().getKeyListener()
  }
});

LSD.Mixin.Focus.Propagation = {
  focus: function(parent) {
    while (parent = parent.parentNode) if (parent.getFocuser) parent.focus(false);
  },
  
  blur: function(parent) {
    var active = parent.document.activeElement;
    var hierarchy = active ? active.getHierarchy() : [];
    while (parent = parent.parentNode) {
      if (active && hierarchy.contains(parent)) break;
      if (parent.options && $defined(parent.options.tabindex) && parent.blur) parent.blur(true);
    }
  }
};
/*
---
 
script: Select.js
 
description: Basic selectbox
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD/LSD.Widget.Paint
- LSD.Widget.Button
- LSD.Widget.Container
- LSD/LSD.Trait.Menu
- LSD/LSD.Trait.List
- LSD/LSD.Trait.Item
- LSD/LSD.Trait.Choice
- LSD/LSD.Trait.Value
- LSD/LSD.Mixin.Focus
- LSD/LSD.Trait.Accessibility
- LSD/LSD.Trait.Proxies

provides: [LSD.Widget.Select, LSD.Widget.Select.Button, LSD.Widget.Select.Option]
 
...
*/

LSD.Widget.Select = new Class({
  
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Menu.Stateful,
    LSD.Trait.List,
    LSD.Trait.Choice,
    LSD.Trait.Value,
    LSD.Trait.Accessibility,
    LSD.Trait.Proxies
  ],
  
  options: {
    tag: 'select',
    layout: {
      item: '^option',
      children: {
        '^button': {}
      }
    },
    events: {
      element: {
        click: 'expand'
      },
      self: {
        set: function(item) {
          this.setValue(item.getValue());
          this.collapse();
        },
        collapse: 'forgetChosenItem'
      },
      _items: {
        element: {
          'mouseover:on(option)': function() {
            if (!this.chosen) this.listWidget.selectItem(this, true)
          },
          'click:on(option)': function(e) {
            if (!this.selected) {
              this.listWidget.selectItem(this);
              e.stop()
            } else this.listWidget.collapse();
            this.forget()
          }
        }
      }
    },
    shortcuts: {
      'ok': 'selectChosenItem'
    },
    menu: {
      position: 'focus',
      width: 'adapt'
    },
    writable: true
  }
});

LSD.Widget.Select.Button = new Class({
  Extends: LSD.Widget.Button
});

LSD.Widget.Select.Option = new Class({
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Value,
    LSD.Trait.Item.Stateful
  ],
  
  States: {
    chosen: ['choose', 'forget']
  },
  
  options: {
    tag: 'option'
  },
  
  getValue: function() {
    if (this.attributes && this.attributes.value) this.value = this.attributes.value;
    return this.parent.apply(this, arguments);
  },
  
  setContent: function() {
    return (this.value = this.parent.apply(this, arguments));
  }
});
/*
---
 
script: Toolbar.js
 
description: Menu widget to be used as a drop down
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Menu
  - LSD.Widget.Button
  - LSD/LSD.Mixin.Focus
  - LSD/LSD.Trait.List

provides:
  - LSD.Widget.Menu.Toolbar

 
...
*/
LSD.Widget.Menu.Toolbar = new Class({
  Includes: [
    LSD.Widget.Menu,
    LSD.Trait.List,
    LSD.Trait.Accessibility
  ],
  
  options: {
    attributes: {
      type: 'toolbar'
    }
  }
});
/*
---
 
script: Toolbar.Menu.js
 
description: Dropdown menu in a toolbar
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Menu.Toolbar
  - LSD/LSD.Trait.Menu.Stateful
  - LSD/LSD.Trait.List
  - LSD/LSD.Trait.Item.Stateful
  - LSD/LSD.Trait.Accessibility
  - LSD/LSD.Trait.Proxies

provides:
  - LSD.Widget.Menu.Toolbar.Menu
  - LSD.Widget.Menu.Toolbar.Menu.Label
 
...
*/
LSD.Widget.Menu.Toolbar.Menu = new Class({
  Includes: [
    LSD.Widget.Button,
    LSD.Trait.Menu.Stateful,
    LSD.Trait.List, //Look ma, list and item at once!
    LSD.Trait.Item.Stateful,
    LSD.Trait.Accessibility,
    LSD.Trait.Proxies
  ],
  
  options: {
    layout: {
      item: 'menu-context-item'
    },
    events: {
      element: {
        //mousedown: 'retain'
      },
      _items: {
        element: {
          'mousemove:on(command)': function() {
            if (!this.chosen) this.listWidget.selectItem(this)
          },
          'click:on(command)': function() {
            if (!this.selected) this.listWidget.selectItem(this)
            this.listWidget.collapse();
          }
        }
      },
      self: {
        click: 'expand',
        expand: 'unselectItem'
      }
    },
    menu: {
      position: 'bottom'
    }
  },
  
  click: function() {
    this.select();
    return this.parent.apply(this, arguments);
  },
  
  render: Macro.onion(function() {
    if (this.attributes.label && this.attributes.label != this.label) {
      this.label = this.attributes.label;
      this.setContent(this.label)
    }
  }),
  
  processValue: function(item) {
    return item.value;
  }
  
});

LSD.Widget.Menu.Toolbar.Menu.Label = new Class({
  Extends: LSD.Widget.Button
});

LSD.Widget.Menu.Toolbar.Menu.Command = LSD.Widget.Menu.Context.Command;
/*
---
 
script: Input.js
 
description: Make it easy to use regular native input for the widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin.Focus

provides: 
  - LSD.Trait.Input
  
...
*/

LSD.Trait.Input = new Class({
  options: {
    input: {},
    events: {
      input: {
        mousedown: 'stopMousedown'
      }
    }
  },
  
  stopMousedown: function(e) {
    e.stopPropagation()
  },
  
  attach: Macro.onion(function() {
    this.getInput().addEvents({
      blur: this.onBlur.bind(this),
      focus: this.onFocus.bind(this)
    }).addEvents(this.events.input);
    this.addEvent('resize', this.setInputSize.bind(this))
  }),
  
  focus: Macro.onion(function() {
    this.document.activeElement = this;
    if (LSD.Mixin.Focus) LSD.Mixin.Focus.Propagation.focus(this);
  }),
  
  blur: Macro.onion(function() {
    if (this.document.activeElement == this) delete this.document.activeElement;
 //   if (LSD.Mixin.Focus) LSD.Mixin.Focus.Propagation.blur.delay(10, this, this);
  }),
  
  onFocus: function() {
    this.document.activeElement = this;
    this.focus();
  },
  
  onBlur: function() {
    if (this.document.activeElement == this) delete this.document.activeElement
    this.blur.delay(10, this);
  },
  
  build: Macro.onion(function() {
    this.getInput().inject(this.element);
  }),
  
  getInput: Macro.getter('input', function() {
    return new Element('input', $extend({'type': 'text'}, this.options.input));
  }),
  
  setInputSize: function(size) {
    var height = size.height - this.input.getStyle('padding-top').toInt() - this.input.getStyle('padding-bottom').toInt();
    if (this.input.style.height != height + 'px') this.input.setStyle('height', height);
    if (this.input.style.lineHeight != height + 'px') this.input.setStyle('line-height', height);
    var width = this.size.width - this.input.getStyle('padding-left').toInt() - this.input.getStyle('padding-right').toInt();
    if (this.style.current.glyph) {
      var glyph = this.layers.glyph.measure().width + (this.style.current.glyphRight || 0) + (this.style.current.glyphLeft || 0);
      width -= glyph;
      this.input.setStyle('margin-left', glyph);
    }
    if (this.canceller) width -= this.canceller.getLayoutWidth();
    if (this.glyph) width -= this.glyph.getLayoutWidth();
    this.input.setStyle('width', width);
    return true;
  },
  
  getObservedElement: function() {
    return this.getInput();
  },
  
  empty: function() {
    this.input.set('value', '')
  }
});
/*
---
 
script: Input.js
 
description: A base class for all kinds of form controls
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD/LSD.Widget.Paint
- LSD/LSD.Trait.Input
- LSD/LSD.Mixin.Focus

provides: [LSD.Widget.Input]
 
...
*/
LSD.Widget.Input = new Class({
  States: {
    'focused': ['focus', 'blur']
  },
  
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Input
  ],
  
  options: {
    tag: 'input',

    attributes: {
      type: 'text'
    },
    
    writable: true,
    focusable: false,    
    events: {
      _input: {
        focus: function() {
          this.input.focus();
        },
        blur: function() {
          this.input.blur();
        }
      }
    }
  },
  
  retain: function() {
    this.focus(false);
    return false;
  },
  
  applyValue: function(item) {
    this.input.set('value', item);
  }
});
/*
---
 
script: Checkbox.js
 
description: Boolean checkbox type of input
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD/LSD.Mixin.Touchable
- LSD/LSD.Mixin.Focus
- LSD/LSD.Trait.Accessibility

provides: [LSD.Widget.Input.Checkbox]
 
...
*/
LSD.Widget.Input.Checkbox = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'input',
    shortcuts: {
      space: 'toggle'
    },
    command: {
      type: 'checkbox'
    },
    events: {
      enabled: {
        element: {
          click: 'click'
        }
      }
    },
    writable: true
  }
});
/*
---
 
script: Range.js
 
description: Range slider input
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD.Widget.Button
- LSD/LSD.Widget.Paint
- LSD/LSD.Trait.Slider
- LSD/LSD.Mixin.Focus
- LSD/LSD.Trait.Accessibility

provides: [LSD.Widget.Input.Range]
 
...
*/

LSD.Widget.Input.Range = new Class({
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Slider,
    LSD.Trait.Accessibility
  ],
  
  options: {
    tag: 'input',
    shortcuts: {
      next: 'increment',
      previous: 'decrement'
    },
    layout: {
      children: {
        '>thumb[shape=arrow]#thumb': {}
      }
    },
    writable: true
  },
  
  initialize: function() {
    //delete this.options.events.focus.element.mousedown;
    this.parent.apply(this, arguments);
    this.addPseudo(this.options.mode);
  },

  onSet: function() {
    this.focus();
  }
});

LSD.Widget.Input.Range.Thumb = new Class({
  Extends: LSD.Widget.Button,
    
  options: {
    tag: 'thumb'
  }
});
/*
---
 
script: Search.js
 
description: Search field with a dropdown
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD.Widget.Container
- LSD.Widget.Button
- LSD/LSD.Trait.Menu
- LSD/LSD.Trait.List
- LSD/LSD.Trait.Choice
- LSD/LSD.Trait.Value
- LSD/LSD.Trait.Observer
- LSD/LSD.Trait.Accessibility
- LSD/LSD.Trait.Proxies

provides: [LSD.Widget.Input.Search]
 
...
*/

LSD.Widget.Input.Search = new Class({
  Includes: [
    LSD.Widget.Input,
    LSD.Trait.Expectations,
    LSD.Trait.Proxies,
    LSD.Trait.Menu.Stateful,
    LSD.Trait.List,
    LSD.Trait.Choice,
    LSD.Trait.Value,
    LSD.Trait.Observer.Stateful
  ],
  
  States: {
    'detailed': ['enrich', 'clean'],
    'uniconed': ['uniconize', 'iconize']
  },
  
  options: {
    tag: 'input',
    layout: {
      item: 'input-option',
      children: {
        '>icon': {},
        '>button': {}
      }
    },
    events: {
      icon: {
        click: 'expand'
      },
      button: {
        click: 'clear'
      },
      self: {
        set: 'setIcon',
        focus: 'expand'
      }
    },
    menu: {
      position: 'bottom'
    }
  },
  
  attach: Macro.onion(function() {
    if (this.hasItems()) {
      this.enrich();
    } else {
      this.clean();
    }
  }),
  
  setInputSize: Macro.onion(function() {
    if (!this.resorted && this.icon.element.parentNode) {
      this.resorted = true;
      $(this.input).inject(this.icon, 'after')
    }
    if (this.button) this.button.refresh();
    this.input.setStyle('width', this.size.width - this.button.getLayoutWidth(this.button.size.width) - this.icon.getLayoutWidth() - 1)
  }),
	
  processValue: function(item) {
    return item.value.title;
  },
  
  clear: function() {
    this.empty();
    this.focus();
  },
  
  applyValue: $lambda(true),
  
  setIcon: function(item) {
    if (item && item.value) item = item.value.icon;
    this.collapse();
    if (!item) {
      this.iconize();
      this.icon.element.setStyle('background-image', '');
    } else {
      this.uniconize();
      this.icon.element.setStyle('background', 'url(' + item + ') no-repeat ' + (this.icon.offset.outside.left + 4) + 'px ' + this.icon.offset.outside.left + 'px');
    }
  }
});

LSD.Widget.Input.Option = LSD.Widget.Input.Search.Option = new Class({
  Extends: LSD.Widget.Container,
    
  States: {
    chosen: ['choose', 'forget']
  },
  
  options: {
    tag: 'option',
    events: {
      element: {
        click: 'select',
        mousemove: 'chooseOnHover'
      }
    }
  },
  
  render: Macro.onion(function() {
    var icon = this.value ? this.value.icon : false;
    if ((this.icon == icon) || !icon) return;
    this.icon = icon;
    this.element.setStyle('background-image', 'url(' + icon + ')');
    this.element.setStyle('background-repeat', 'no-repeat');
    this.element.setStyle('background-position', ((this.offset.outside.left || 0) + 4) + 'px  center');
    this.element.setStyle('padding-left', 15)
  }),
  
  select: function() {
    this.listWidget.selectItem.delay(50, this.listWidget, [this]);
  },
  
  chooseOnHover: function() {
    this.listWidget.selectItem(this, true)
  }
});


LSD.Widget.Input.Icon = LSD.Widget.Input.Search.Icon = new Class({
  
  Includes: [
    LSD.Widget.Button
  ],
  
  options: {
    tag: 'icon'
  }
  
});

LSD.Widget.Input.Search.Button = LSD.Widget.Button;
/*
---
 
script: Radio.js
 
description: A radio button, set of connected widgets that steal checkedness from each other
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD/LSD.Widget.Paint
- LSD/LSD.Mixin.Touchable
- LSD/LSD.Mixin.Focus
- LSD/LSD.Trait.Accessibility

provides: [LSD.Widget.Input.Radio]
 
...
*/

LSD.Widget.Input.Radio = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'input',
    shortcuts: {
      space: 'click'
    },
    command: {
      type: 'radio'
    },
    writable: true
  }
});
/*
---
 
script: List.js
 
description: Menu widget to be used as a list of item
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Menu
- LSD/LSD.Trait.Item
- LSD/LSD.Trait.List
- LSD/LSD.Mixin.Focus
- LSD/LSD.Trait.Accessibility
- LSD/LSD.Trait.Proxies

provides:
- LSD.Widget.Menu.List
- LSD.Widget.Menu.List.Item
 
...
*/
LSD.Widget.Menu.List = new Class({
  Includes: [
    LSD.Widget.Menu,
    LSD.Trait.List,
    LSD.Trait.Accessibility,
    LSD.Trait.Proxies
  ],
  
  options: {
    attributes: {
      type: 'list'
    },
    layout: {
      item: 'menu-list-item'
    },
    events: {
      self: {
        dominject: 'makeItems'
      },
      element: {
        'mousedown:on(option)': function() {
          this.listWidget.selectItem(this)
        }
      }
    }
  }
});
    

LSD.Widget.Menu.List.Option = new Class({
  Includes: [
    LSD.Widget.Paint,
    LSD.Trait.Item.Stateful
  ],
  
  options: {
    tag: 'option'
  }
});

LSD.Widget.Menu.List.Button = LSD.Widget.Menu.List.Li = LSD.Widget.Menu.List.Command = LSD.Widget.Menu.List.Option;
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

/*
---
 
script: Network.js
 
description: Some kind of a network preferences
 
license: Public domain (http://unlicense.org).
 
requires:
  - Widgets/LSD.Widget.Window.Application
  - Widgets/LSD.Widget.Section
  - Widgets/LSD.Widget.Menu.List
  - Widgets/LSD.Widget.Menu.Toolbar
  - Widgets/LSD.Widget.Select
  - Widgets/LSD.Widget.Form
  - Widgets/LSD.Widget.Input.Checkbox
  - Widgets/LSD.Widget.Input.Radio
  - Widgets/LSD.Widget.Input.Range
  - Widgets/LSD.Widget.Button
  - Widgets/LSD.Widget.Container
  - LSD/LSD.Module.Container
  - LSD/LSD.Module.Layout
  - LSD/LSD.Mixin.Draggable
  - LSD/LSD.Mixin.Resizable
  - LSD/LSD.Mixin.Scrollable
  - LSD/LSD.Mixin.Shy
  - LSD/LSD.Mixin.Focus
 
provides: 
  - LSD.Application.Network
 
...
*/

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