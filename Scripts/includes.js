(function(prefix) {
      var sources = [
  "../../mootools-core/Source/Core/Core.js",
  "../../mootools-speedups/Source/Core/Core.Speedups.js",
  "../../mootools-core/Source/Types/Object.js",
  "../../mootools-speedups/Source/Types/Object.js",
  "../../mootools-core/Source/Types/Array.js",
  "../../mootools-color/Source/Color.js",
  "../../mootools-more/Source/Core/More.js",
  "../../mootools-core/Source/Types/Number.js",
  "../../mootools-core/Source/Types/Function.js",
  "../../mootools-core/Source/Types/String.js",
  "../../mootools-core/Source/Browser/Browser.js",
  "../../mootools-core/Source/Types/Event.js",
  "../../mootools-ext/Source/Types/Event.js",
  "../../mootools-mobile/Source/Browser/Features.Touch.js",
  "../../mootools-core/Source/Class/Class.js",
  "../../mootools-speedups/Source/Core/Class.Speedups.js",
  "../../mootools-more/Source/Class/Class.Binds.js",
  "../../mootools-ext/Source/Core/Class.Binds.Remover.js",
  "../../mootools-core/Source/Class/Class.Extras.js",
  "../../mootools-speedups/Source/Core/Class.Extras.Speedups.js",
  "../../mootools-ext/Source/Core/Class.Includes.js",
  "../../mootools-ext/Source/Core/Class.States.js",
  "../../mootools-ext/Source/Utilities/Observer.js",
  "../../mootools-ext/Source/Core/Class.Macros.js",
  "../../mootools-core/Source/Fx/Fx.js",
  "../../mootools-ext/Source/Core/Class.Mixin.js",
  "../../mootools-ext/Source/Types/FastArray.js",
  "../../../Source/LSD.js",
  "../../../Source/Mixin/Position.js",
  "../../../Source/Container.js",
  "../../../Source/Module/Container.js",
  "../../../Source/Trait/Observer.js",
  "../../../Source/Layout.js",
  "../../../Source/Module/Layout.js",
  "../../../Source/Trait/Dimensions.js",
  "../../../Source/Action.js",
  "../../../Source/Expression.js",
  "../../../Source/Node.js",
  "../../../Source/Trait/Item.js",
  "../../../Source/Trait/Value.js",
  "../../../Source/Trait/Shape.js",
  "../../../Source/Base.js",
  "../../../Source/Module/DOM.js",
  "../../../Source/Document.js",
  "../../../Source/Command/Command.js",
  "../../../Source/Command/Radio.js",
  "../../../Source/Command/Checkbox.js",
  "../../art/Source/ART.js",
  "../../../Source/ART/ART.Element.js",
  "../../../Source/ART/ART.Glyphs.js",
  "../../art/Source/ART.Path.js",
  "../../art/Source/ART.SVG.js",
  "../../../Source/ART/ART.SVG.js",
  "../../art/Source/ART.VML.js",
  "../../art/Source/ART.Base.js",
  "../../../Source/ART/ART.Shape.Arrow.js",
  "../../../Source/ART/ART.Shape.Rectangle.js",
  "../../../Source/ART/ART.Shape.Flower.js",
  "../../../Source/ART/ART.Shape.Ellipse.js",
  "../../mootools-core/Source/Slick/Slick.Parser.js",
  "../../../Source/Module/Attributes.js",
  "../../mootools-more/Source/Class/Events.Pseudos.js",
  "../../mootools-core/Source/Slick/Slick.Finder.js",
  "../../mootools-core/Source/Element/Element.js",
  "../../mootools-ext/Source/Element/Properties/UserSelect.js",
  "../../mootools-core/Source/Element/Element.Style.js",
  "../../mootools-core/Source/Element/Element.Dimensions.js",
  "../../mootools-more/Source/Element/Element.Measure.js",
  "../../mootools-core/Source/Fx/Fx.CSS.js",
  "../../mootools-core/Source/Fx/Fx.Tween.js",
  "../../../Source/Trait/Animation.js",
  "../../mootools-core/Source/Element/Element.Event.js",
  "../../mootools-custom-event/Source/Element.defineCustomEvent.js",
  "../../mootools-mobile/Source/Desktop/Mouse.js",
  "../../mootools-mobile/Source/Touch/Touch.js",
  "../../mootools-mobile/Source/Touch/Click.js",
  "../../../Source/Mixin/Touchable.js",
  "../../mootools-more/Source/Drag/Drag.js",
  "../../mootools-more/Source/Drag/Slider.js",
  "../../mootools-ext/Source/Drag/Drag.Limits.js",
  "../../mootools-ext/Source/Drag/Slider.js",
  "../../../Source/Trait/Slider.js",
  "../../../Source/Mixin/Resizable.js",
  "../../../Source/Mixin/Draggable.js",
  "../../mootools-core/Source/Utilities/DOMReady.js",
  "../../mootools-ext/Source/Element/Events/Keypress.js",
  "../../../Source/Trait/Accessibility.js",
  "../../mootools-more/Source/Element/Element.Pseudos.js",
  "../../mootools-more/Source/Element/Element.Delegation.js",
  "../../mootools-ext/Source/Element/Properties/BoxShadow.js",
  "../../mootools-ext/Source/Element/Properties/Widget.js",
  "../../../Source/Module/Events.js",
  "../../../Source/Module/Expectations.js",
  "../../../Source/Module/Actions.js",
  "../../../Source/Module/Command.js",
  "../../../Source/Trait/Proxies.js",
  "../../../Source/Document/Resizable.js",
  "../../mootools-ext/Source/Element/Properties/Item.js",
  "../../../Source/Trait/List.js",
  "../../../Source/Trait/Choice.js",
  "../../mootools-ext/Source/Element/Properties/BorderRadius.js",
  "../../mootools-core/Source/Request/Request.js",
  "../../Sheet.js/Source/sg-regex-tools.js",
  "../../Sheet.js/Source/SheetParser.CSS.js",
  "../../Sheet.js/Source/SheetParser.Value.js",
  "../../Sheet.js/Source/Sheet.js",
  "../../Sheet.js/Source/SheetParser.Property.js",
  "../../Sheet.js/Source/SheetParser.Styles.js",
  "../../../Source/Sheet.js",
  "../../../Source/Module/Styles.js",
  "../../../Source/Widget.js",
  "../../../Source/Element.js",
  "../../lsd-widgets/Source/Container.js",
  "../../lsd-widgets/Source/Label.js",
  "../../lsd-widgets/Source/Body.js",
  "../../../Source/Layer.js",
  "../../../Source/Layer/Shape.js",
  "../../../Source/Layer/Position.js",
  "../../../Source/Layer/Shadow.js",
  "../../../Source/Layer/Shadow.Onion.js",
  "../../../Source/Layer/Shadow.Blur.js",
  "../../../Source/Layer/Shadow.Inset.js",
  "../../../Source/Layer/Shadow.Native.js",
  "../../../Source/Layer/Radius.js",
  "../../../Source/Layer/Scale.js",
  "../../../Source/Layer/Color.js",
  "../../../Source/Layer/Stroke.js",
  "../../../Source/Trait/Layers.js",
  "../../../Source/Layer/Offset.js",
  "../../../Source/Layer/Size.js",
  "../../../Source/Widget.Paint.js",
  "../../lsd-widgets/Source/Menu.js",
  "../../lsd-widgets/Source/Menu/Context.js",
  "../../../Source/Trait/Menu.js",
  "../../lsd-widgets/Source/Window.js",
  "../../lsd-widgets/Source/Window/Application.js",
  "../../lsd-widgets/Source/Button.js",
  "../../lsd-widgets/Source/Section.js",
  "../../lsd-widgets/Source/Scrollbar.js",
  "../../../Source/Mixin/Scrollable.js",
  "../../lsd-widgets/Source/Form.js",
  "../../qfocuser/Source/QFocuser.js",
  "../../../Source/Mixin/Focus.js",
  "../../lsd-widgets/Source/Menu/List.js",
  "../../lsd-widgets/Source/Select.js",
  "../../lsd-widgets/Source/Menu/Toolbar.js",
  "../../lsd-widgets/Source/Menu/Toolbar.Menu.js",
  "../../../Source/Trait/Input.js",
  "../../lsd-widgets/Source/Input.js",
  "../../lsd-widgets/Source/Input/Search.js",
  "../../lsd-widgets/Source/Input/Radio.js",
  "../../lsd-widgets/Source/Input/Checkbox.js",
  "../../lsd-widgets/Source/Input/Range.js",
  "../Source/Application/Desktop.js",
  "../Source/Application/Network.js"
];
      for (var i = 0, j = sources.length; i < j; i++) document.write('<scr' + 'ipt src="' + (prefix || '') + sources[i] + '"></script>');
    })(window.prefix);
