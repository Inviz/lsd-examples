window.prefix = '';
if (location.host.indexOf('github') > -1 || location.host.indexOf('fiddle') > -1 || location.host.indexOf('inviz.ru') > -1) {
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-18508300-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
}