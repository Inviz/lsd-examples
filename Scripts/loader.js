window.prefix = '';
if (location.host.indexOf('github') > -1 || location.host.indexOf('fiddle') > -1) {
  window.loader = function(src) {
    src = src.replace(/^.*(lsd|lsd-base|lsd-examples|lsd-widgets|mootools-ext|mootools-speedups|mootools-mobile)\//, 'http://inviz.github.com/$1/').
  	          replace(/^.*(qfocuser|cssparser)\//, 'http://github.com/inviz/$1/raw/master/').
  	          replace(/^.*(..\/..\/..\/Source)\//, 'http://inviz.github.com/lsd/Source/').
  	          replace(/^.*(..\/..\/Source)\//, 'http://inviz.github.com/lsd-examples/Source/').
  	          replace(/^.*(mootools-core|mootools-more)\//, 'http://github.com/mootools/$1/raw/master/').
            	replace(/^.*(mootools-color|art)\//, 'http://github.com/kamicane/$1/raw/master/')
       
    document.write('<scr' + 'ipt src="' + (prefix || '') + src + '"></sc' + 'ript>');
  }

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-18508300-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
}