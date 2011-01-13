(function(prefix) {
      var sources = [
  "../../mootools-core/Source/Slick/Slick.Parser.js",
  "../../mootools-core/Source/Slick/Slick.Finder.js",
  "../../qfocuser/Source/QFocuser.js",
  "../../cssparser/Source/CSSParser.js",
  "../../mootools-core/Source/Core/Core.js",
  "../../mootools-speedups/Source/Core/Core.Speedups.js",
  "../../mootools-more/Source/Core/More.js",
  "../../mootools-core/Source/Types/Array.js",
  "../../mootools-color/Source/Color.js",
  "../../mootools-core/Source/Types/Number.js",
  "../../mootools-core/Source/Types/String.js",
  "../../mootools-core/Source/Types/Object.js",
  "../../mootools-speedups/Source/Types/Object.js",
  "../../mootools-core/Source/Types/Function.js",
  "../../mootools-core/Source/Class/Class.js",
  "../../mootools-speedups/Source/Core/Class.Speedups.js",
  "../../mootools-more/Source/Class/Class.Binds.js",
  "../../mootools-ext/Source/Core/Class.Binds.Remover.js",
  "../../art/Source/ART.js",
  "../../../Source/ART/ART.Element.js",
  "../../../Source/ART/ART.Glyphs.js",
  "../../art/Source/ART.Path.js",
  "../../art/Source/ART.SVG.js",
  "../../../Source/ART/ART.SVG.js",
  "../../art/Source/ART.VML.js",
  "../../art/Source/ART.Base.js",
  "../../../Source/ART/ART.Shape.js",
  "../../../Source/ART/ART.Shape.Arrow.js",
  "../../../Source/ART/ART.Shape.Star.js",
  "../../../Source/ART/ART.Shape.Flower.js",
  "../../../Source/ART/ART.Shape.Ellipse.js",
  "../../../Source/ART/ART.Shape.Rectangle.js",
  "../../mootools-ext/Source/Core/Class.Mixin.js",
  "../../mootools-core/Source/Class/Class.Extras.js",
  "../../mootools-speedups/Source/Core/Class.Extras.Speedups.js",
  "../../mootools-ext/Source/Utilities/Observer.js",
  "../../mootools-core/Source/Fx/Fx.js",
  "../../mootools-ext/Source/Core/Class.Macros.js",
  "../../mootools-ext/Source/Core/Class.Includes.js",
  "../../mootools-ext/Source/Core/Class.States.js",
  "../../mootools-more/Source/Class/Events.Pseudos.js",
  "../../mootools-ext/Source/Types/FastArray.js",
  "../../mootools-core/Source/Browser/Browser.js",
  "../../mootools-core/Source/Types/Event.js",
  "../../mootools-ext/Source/Types/Event.js",
  "../../mootools-core/Source/Element/Element.js",
  "../../mootools-ext/Source/Element/Properties/BorderRadius.js",
  "../../mootools-ext/Source/Element/Properties/BoxShadow.js",
  "../../mootools-core/Source/Element/Element.Event.js",
  "../../mootools-ext/Source/Element/Events/Keypress.js",
  "../../mootools-core/Source/Utilities/DOMReady.js",
  "../../mootools-more/Source/Element/Element.Pseudos.js",
  "../../mootools-more/Source/Element/Element.Delegation.js",
  "../../mootools-custom-event/Source/Element.defineCustomEvent.js",
  "../../mootools-core/Source/Element/Element.Style.js",
  "../../mootools-core/Source/Element/Element.Dimensions.js",
  "../../mootools-more/Source/Element/Element.Measure.js",
  "../../mootools-more/Source/Drag/Drag.js",
  "../../mootools-more/Source/Drag/Slider.js",
  "../../mootools-ext/Source/Drag/Drag.Limits.js",
  "../../mootools-ext/Source/Drag/Slider.js",
  "../../mootools-core/Source/Fx/Fx.CSS.js",
  "../../mootools-core/Source/Fx/Fx.Tween.js",
  "../../mootools-ext/Source/Element/Properties/Item.js",
  "../../mootools-core/Source/Request/Request.js",
  "../../mootools-ext/Source/Element/Properties/Widget.js",
  "../../mootools-ext/Source/Element/Properties/UserSelect.js",
  "../../../Source/LSD.js",
  "../../../Source/Module/DOM.js",
  "../../../Source/Trait/Dimensions.js",
  "../../../Source/Module/Attributes.js",
  "../../../Source/Mixin/Shy.js",
  "../../../Source/Mixin/Position.js",
  "../../../Source/Base.js",
  "../../../Source/Node.js",
  "../../../Source/Document.js",
  "../../../Source/Sheet.js",
  "../../../Source/Action.js",
  "../../../Source/Mixin/Focus.js",
  "../../../Source/Trait/Input.js",
  "../../../Source/Layout.js",
  "../../../Source/Module/Layout.js",
  "../../../Source/Trait/Shape.js",
  "../../../Source/Command/Command.js",
  "../../../Source/Command/Radio.js",
  "../../../Source/Command/Checkbox.js",
  "../../../Source/Trait/Animation.js",
  "../../../Source/Container.js",
  "../../../Source/Module/Container.js",
  "../../../Source/Trait/Value.js",
  "../../../Source/Expression.js",
  "../../../Source/Module/Styles.js",
  "../../../Source/Layer.js",
  "../../../Source/Layer/Shadow.js",
  "../../../Source/Layer/InnerShadow.js",
  "../../../Source/Layer/Fill.js",
  "../../../Source/Layer/Glyph.js",
  "../../../Source/Layer/GlyphShadow.js",
  "../../../Source/Layer/Stroke.js",
  "../../../Source/Layer/Icon.js",
  "../../../Source/Trait/Layers.js",
  "../../../Source/Trait/Slider.js",
  "../../../Source/Mixin/Draggable.js",
  "../../../Source/Module/Events.js",
  "../../../Source/Document/Resizable.js",
  "../../../Source/Module/Expectations.js",
  "../../../Source/Module/Actions.js",
  "../../../Source/Module/Command.js",
  "../../../Source/Widget.js",
  "../../../Source/Element.js",
  "../../lsd-widgets/Source/Label.js",
  "../../lsd-widgets/Source/Container.js",
  "../../lsd-widgets/Source/Body.js",
  "../../../Source/Trait/Proxies.js",
  "../../../Source/Trait/List.js",
  "../../../Source/Trait/Choice.js",
  "../../../Source/Trait/Item.js",
  "../../../Source/Trait/Accessibility.js",
  "../../../Source/Mixin/Resizable.js",
  "../../../Source/Trait/Observer.js",
  "../../../Source/ART/ART.js",
  "../../../Source/Widget.Paint.js",
  "../../lsd-widgets/Source/Window.js",
  "../../lsd-widgets/Source/Window/Application.js",
  "../../lsd-widgets/Source/Section.js",
  "../../lsd-widgets/Source/Footer.js",
  "../../lsd-widgets/Source/Header.js",
  "../../lsd-widgets/Source/Nav.js",
  "../../lsd-widgets/Source/Form.js",
  "../../lsd-widgets/Source/Menu.js",
  "../../lsd-widgets/Source/Menu/Context.js",
  "../../../Source/Trait/Menu.js",
  "../../lsd-widgets/Source/Menu/List.js",
  "../../lsd-widgets/Source/Panel.js",
  "../../lsd-widgets/Source/Input.js",
  "../../mootools-mobile/Source/Browser/Features.Touch.js",
  "../../mootools-mobile/Source/Touch/Touch.js",
  "../../mootools-mobile/Source/Touch/Click.js",
  "../../mootools-mobile/Source/Desktop/Mouse.js",
  "../../../Source/Mixin/Touchable.js",
  "../../lsd-widgets/Source/Input/Checkbox.js",
  "../../lsd-widgets/Source/Button.js",
  "../../lsd-widgets/Source/Input/Range.js",
  "../../lsd-widgets/Source/Select.js",
  "../../lsd-widgets/Source/Menu/Toolbar.js",
  "../../lsd-widgets/Source/Menu/Toolbar.Menu.js",
  "../../lsd-widgets/Source/Input/Search.js",
  "../../lsd-widgets/Source/Scrollbar.js",
  "../../../Source/Mixin/Scrollable.js",
  "../../lsd-widgets/Source/Input/Radio.js",
  "../../lsd-widgets/Source/Glyph.js",
  "../Source/Application/Desktop.js",
  "../Source/Application/Network.js"
];
      for (var i = 0, j = sources.length; i < j; i++) document.write('<scr' + 'ipt src="' + (prefix || '') + sources[i] + '"></script>');
    })(window.prefix);
