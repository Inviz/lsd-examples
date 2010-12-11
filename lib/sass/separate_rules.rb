module Sass::Tree
  class RuleNode
    def _to_s(tabs)
      tabs = tabs + self.tabs

      rule_separator = style == :compressed ? ',' : ', '
      line_separator =
        case style
          when :nested, :expanded; "\n"
          when :compressed; ""
          else; " "
        end
      rule_indent = '  ' * (tabs - 1)
      per_rule_indent, total_indent = [:nested, :expanded].include?(style) ? [rule_indent, ''] : ['', rule_indent]

      total_rule = total_indent + resolved_rules.members.
        map {|seq| seq.to_a.join}.
        join(rule_separator).split("\n").map do |line|
        per_rule_indent + line.strip
      end.join(line_separator)

      to_return = ''
      old_spaces = '  ' * (tabs - 1)
      spaces = '  ' * tabs
      if style != :compressed
        if @options[:debug_info]
          to_return << debug_info_rule.to_s(tabs) << "\n"
        elsif @options[:line_comments]
          to_return << "#{old_spaces}/* line #{line}"

          if filename
            relative_filename = if @options[:css_filename]
              begin
                Pathname.new(filename).relative_path_from(
                  Pathname.new(File.dirname(@options[:css_filename]))).to_s
              rescue ArgumentError
                nil
              end
            end
            relative_filename ||= filename
            to_return << ", #{relative_filename}"
          end

          to_return << " */\n"
        end
      end

      total_rule = total_rule.split(rule_separator).map do |rule|
        #cssed
        prefix = false;
        rule = rule.split(' ').map do |bit|
          if (bit.index(':element')) 
            bit.gsub!(':element', '')
          else
            if bit.index('#')
              prefix = true#increase specificity
              bit = '.lsd' + bit if bit[0, 1] == '#'
              bit.gsub!('#', '.id-') #id
            end
            bit.gsub!(/:([a-z]+)/) do |state, match| #pseudo
              state = state[1 .. state.size]
              if %[before after].include?(state)
                state
              else
                '.is-' + state
              end
            end
            bit.gsub(/^([a-z0-9*]+)/) do |tag|
              if %[vml svg h1 h2 h3 p ul ol li dl dt dd
                  header footer section nav menu command aside 
                  label fieldset form].include?(tag)
                tag
              else
                ".lsd.#{tag}"
              end
            end
          end
        end.join(' ')
        rule = "html > body " + rule  if prefix
        rule
      end.join(rule_separator)
      
      to_return << format_rule(total_rule)
      
      to_return
    end
    
    def format_rule(rule)
      if style == :compact
        properties = children.map { |a| a.to_s(1) }.join(' ')
        "#{rule} { #{properties} }#{"\n" if group_end}"
      elsif style == :compressed
        properties = children.map { |a| a.to_s(1) }.join(';')
        "#{rule}{#{properties}}"
      else
        properties = children.map { |a| a.to_s(tabs + 1) }.join("\n")
        end_props = (style == :expanded ? "\n" + old_spaces : ' ')
        "#{rule} {\n#{properties}#{end_props}}#{"\n" if group_end}"
      end
    end
  end
end