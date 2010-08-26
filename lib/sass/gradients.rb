# Sass helper functions. 
module Sass
  module Script
    class LiteralString < Literal
      def to_s
        @value.to_s
      end
    end
    
    module ExtraFunctions
      # Only works with selector_aware_helpers.rb
      def gradient(*args)
        args.map! {|a| a.to_s.sub(/^["']/, '').sub(/["']$/, '') } 
        args[0] = "'radial'" if args[0] == 'radial'
        Sass::Script::String.new("\"[" + args * ", " + "]\"")
      end
      
      def glyph(name)
        name = name.to_s.sub(/^["']/, '').sub(/["']$/, '')
        Sass::Script::LiteralString.new("ART.Glyphs." + name)
      end
    end
  end
end

Sass::Script::Functions.__send__(:include, Sass::Script::ExtraFunctions)