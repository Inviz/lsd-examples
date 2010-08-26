gem 'haml-edge'
require 'sass'


module Sass::Tree
  CSS_PROPERTIES = %w[
    margin margin-top margin-right margin-bottom margin-left
    padding padding-top padding-right padding-bottom padding-left
    top left
    border border-top border-right border-bottom border-left
    border-top-width border-right-width border-bottom-width border-left-width
    border-top-style border-right-style border-bottom-style border-left-style
    border-top-color border-right-color border-bottom-color border-left-color
    position z-index float clear display cursor visibility _display zoom box-shadow text-shadow opacity
    color font-family line-height font-size font letter-spacing
    text-align vertical-align
    height width content background outline
    ]
  class PropNode
    def cssize!(extends, parent)
      self.resolved_name = "#{parent.resolved_name}-#{resolved_name}" if parent
      self.resolved_name = "-art-#{self.resolved_name}" unless CSS_PROPERTIES.include?(self.resolved_name)
      self.tabs = parent.tabs + (parent.resolved_value.empty? ? 0 : 1) if parent && style == :nested
      self.children = children.map {|c| c.cssize(extends, self)}.flatten
    end
  end
end