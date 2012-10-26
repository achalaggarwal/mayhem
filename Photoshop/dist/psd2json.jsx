/*jslint adsafe: false, bitwise: true, browser: true, cap: false, css: false,
  debug: false, devel: true, eqeqeq: true, es5: false, evil: false,
  forin: false, fragment: false, immed: true, laxbreak: false, newcap: true,
  nomen: false, on: false, onevar: true, passfail: false, plusplus: true,
  regexp: false, rhino: true, safe: false, strict: false, sub: false,
  undef: true, white: false, widget: false, windows: false */
/*global exports: false */
"use strict";

/*

 JS Beautifier
---------------


  Written by Einar Lielmanis, <einar@jsbeautifier.org>
      http://jsbeautifier.org/

  Originally converted to javascript by Vital, <vital76@gmail.com>

  You are free to use this in any way you want, in case you find this useful or working for you.

  Usage:
    js_beautify(js_source_text);
    js_beautify(js_source_text, options);

  The options are:
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    preserve_newlines (default true) — whether existing line breaks should be preserved,
    indent_level (default 0)         — initial indentation level, you probably won't need this ever,

    space_after_anon_function (default false) — if true, then space is added between "function ()"
            (jslint is happy about this); if false, then the common "function()" output is used.
    braces_on_own_line (default false) - ANSI / Allman brace style, each opening/closing brace gets its own line.

    e.g

    js_beautify(js_source_text, {indent_size: 1, indent_char: '\t'});


*/



function js_beautify(js_source_text, options) {

  options = options ? options : {};

  var input,
    output,
    token_text,
    last_type,
    last_text,
    last_last_text,
    last_word,
    flags,
    flag_store,
    indent_string,
    whitespace,
    wordchar,
    punct,
    parser_pos,
    line_starters,
    digits,
    prefix,
    token_type,
    do_block_just_closed,
    wanted_newline,
    just_added_newline = false,
    n_newlines,
    opt_braces_on_own_line = options.braces_on_own_line ? options.braces_on_own_line : false,
    opt_indent_size = options.indent_size ? options.indent_size : 4,
    opt_indent_char = options.indent_char ? options.indent_char : ' ',
    opt_preserve_newlines = typeof options.preserve_newlines === 'undefined' ? true : options.preserve_newlines,
    opt_indent_level = options.indent_level ? options.indent_level : 0, // starting indentation
    opt_space_after_anon_function = options.space_after_anon_function === 'undefined' ? false : options.space_after_anon_function,
    opt_keep_array_indentation = typeof options.keep_array_indentation === 'undefined' ? false : options.keep_array_indentation,
    input_length = js_source_text.length,
    space_before = true,
    space_after = true,
    t,
    i,
    lines;


  function trim_output() {
    while (output.length && (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string)) {
      output.pop();
    }
  }


  function is_array(mode) {
    return mode === '[EXPRESSION]' || mode === '[INDENTED-EXPRESSION]';
  }


  function print_newline(ignore_repeated) {
    flags.eat_next_space = false;
    if (opt_keep_array_indentation && is_array(flags.mode)) {
      return;
    }

    ignore_repeated = typeof ignore_repeated === 'undefined' ? true : ignore_repeated;

    flags.if_line = false;
    trim_output();

    if (!output.length) {
      return; // no newline on start of file
    }

    if (output[output.length - 1] !== "\n" || !ignore_repeated) {
      just_added_newline = true;
      output.push("\n");
    }

    for (var i = 0; i < flags.indentation_level; i += 1) {
      output.push(indent_string);
    }

    if (flags.var_line && flags.var_line_reindented) {
      if (opt_indent_char === ' ') {
        output.push('    '); // var_line always pushes 4 spaces, so that the variables would be one under another
      }
      else {
        output.push(indent_string); // skip space-stuffing, if indenting with a tab
      }
    }
  }


  function print_single_space() {
    var last_output = ' ';

    if (flags.eat_next_space) {
      flags.eat_next_space = false;
      return;
    }

    if (output.length) {
      last_output = output[output.length - 1];
    }

    if (last_output !== ' ' && last_output !== '\n' && last_output !== indent_string) { // prevent occassional duplicate space
      output.push(' ');
    }
  }


  function print_token() {
    just_added_newline = false;
    flags.eat_next_space = false;
    output.push(token_text);
  }


  function indent() {
    flags.indentation_level += 1;
  }


  function remove_indent() {
    if (output.length && output[output.length - 1] === indent_string) {
      output.pop();
    }
  }


  function set_mode(mode) {
    if (flags) {
      flag_store.push(flags);
    }

    flags = {
      previous_mode: flags ? flags.mode : 'BLOCK',
      mode: mode,
      var_line: false,
      var_line_tainted: false,
      var_line_reindented: false,
      in_html_comment: false,
      if_line: false,
      in_case: false,
      eat_next_space: false,
      indentation_baseline: -1,
      indentation_level: (flags ? flags.indentation_level + ((flags.var_line && flags.var_line_reindented) ? 1 : 0) : opt_indent_level)
    };
  }


  function is_expression(mode) {
    return mode === '[EXPRESSION]' || mode === '[INDENTED-EXPRESSION]' || mode === '(EXPRESSION)';
  }


  function restore_mode() {
    do_block_just_closed = flags.mode === 'DO_BLOCK';
    if (flag_store.length > 0) {
      flags = flag_store.pop();
    }
  }


  function in_array(what, arr) {
    for (var i = 0; i < arr.length; i += 1) {
      if (arr[i] === what) {
        return true;
      }
    }
    return false;
  }


  // Walk backwards from the colon to find a '?' (colon is part of a ternary op)
  // or a '{' (colon is part of a class literal).  Along the way, keep track of
  // the blocks and expressions we pass so we only trigger on those chars in our
  // own level, and keep track of the colons so we only trigger on the matching '?'.

  function is_ternary_op() {
    var level = 0,
      colon_count = 0,
      i;

    for (i = output.length - 1; i >= 0; i -= 1) {
      switch (output[i]) {
      case ':':
        if (level === 0) {
          colon_count += 1;
        }
        break;

      case '?':
        if (level === 0) {
          if (colon_count === 0) {
            return true;
          } else {
            colon_count -= 1;
          }
        }
        break;

      case '{':
        if (level === 0) {
          return false;
        }
        level -= 1;
        break;

      case '(':
      case '[':
        level -= 1;
        break;

      case ')':
      case ']':
      case '}':
        level += 1;
        break;
      }
    }
  }


  function get_next_token() {
    var c,
      keep_whitespace = opt_keep_array_indentation && is_array(flags.mode),
      whitespace_count = 0,
      i,
      sign,
      t,
      comment,
      inline_comment,
      sep,
      esc,
      resulting_string,
      in_char_class,
      sharp;

    n_newlines = 0;

    if (parser_pos >= input_length) {
      return ['', 'TK_EOF'];
    }

    wanted_newline = false;

    c = input.charAt(parser_pos);
    parser_pos += 1;

    if (keep_whitespace) {
      //
      // slight mess to allow nice preservation of array indentation and reindent that correctly
      // first time when we get to the arrays:
      // var a = [
      // ....'something'
      // we make note of whitespace_count = 4 into flags.indentation_baseline
      // so we know that 4 whitespaces in original source match indent_level of reindented source
      //
      // and afterwards, when we get to
      //    'something,
      // .......'something else'
      // we know that this should be indented to indent_level + (7 - indentation_baseline) spaces
      //

      while (in_array(c, whitespace)) {
        if (c === "\n") {
          trim_output();
          output.push("\n");
          just_added_newline = true;
          whitespace_count = 0;
        }
        else {
          if (c === '\t') {
            whitespace_count += 4;
          }
          else {
            whitespace_count += 1;
          }
        }

        if (parser_pos >= input_length) {
          return ['', 'TK_EOF'];
        }

        c = input.charAt(parser_pos);
        parser_pos += 1;
      }

      if (flags.indentation_baseline === -1) {
        flags.indentation_baseline = whitespace_count;
      }

      if (just_added_newline) {
        for (i = 0; i < flags.indentation_level + 1; i += 1) {
          output.push(indent_string);
        }

        if (flags.indentation_baseline !== -1) {
          for (i = 0; i < whitespace_count - flags.indentation_baseline; i += 1) {
            output.push(' ');
          }
        }
      }

    }
    else {
      while (in_array(c, whitespace)) {
        if (c === "\n") {
          n_newlines += 1;
        }

        if (parser_pos >= input_length) {
          return ['', 'TK_EOF'];
        }

        c = input.charAt(parser_pos);
        parser_pos += 1;
      }

      if (opt_preserve_newlines) {
        if (n_newlines > 1) {
          for (i = 0; i < n_newlines; i += 1) {
            print_newline(i === 0);
            just_added_newline = true;
          }
        }
      }
      wanted_newline = n_newlines > 0;
    }

    if (in_array(c, wordchar)) {
      if (parser_pos < input_length) {
        while (in_array(input.charAt(parser_pos), wordchar)) {
          c += input.charAt(parser_pos);
          parser_pos += 1;

          if (parser_pos === input_length) {
            break;
          }
        }
      }

      // small and surprisingly unugly hack for 1E-10 representation
      if (parser_pos !== input_length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {

        sign = input.charAt(parser_pos);
        parser_pos += 1;

        t = get_next_token(parser_pos);
        c += sign + t[0];

        return [c, 'TK_WORD'];
      }

      if (c === 'in') { // hack for 'in' operator
        return [c, 'TK_OPERATOR'];
      }

      if (wanted_newline && last_type !== 'TK_OPERATOR' && !flags.if_line && (opt_preserve_newlines || last_text !== 'var')) {
        print_newline();
      }

      return [c, 'TK_WORD'];
    }

    if (c === '(' || c === '[') {
      return [c, 'TK_START_EXPR'];
    }

    if (c === ')' || c === ']') {
      return [c, 'TK_END_EXPR'];
    }

    if (c === '{') {
      return [c, 'TK_START_BLOCK'];
    }

    if (c === '}') {
      return [c, 'TK_END_BLOCK'];
    }

    if (c === ';') {
      return [c, 'TK_SEMICOLON'];
    }

    if (c === '/') {
      // peek for comment /* ... */
      inline_comment = true;
      comment = '';

      if (input.charAt(parser_pos) === '*') {
        parser_pos += 1;
        if (parser_pos < input_length) {
          while (!(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/') && parser_pos < input_length) {
            c = input.charAt(parser_pos);
            comment += c;

            if (c === '\x0d' || c === '\x0a') {
              inline_comment = false;
            }

            parser_pos += 1;

            if (parser_pos >= input_length) {
              break;
            }
          }
        }

        parser_pos += 2;

        if (inline_comment) {
          return ['/*' + comment + '*/', 'TK_INLINE_COMMENT'];
        }
        else {
          return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
        }
      }
      // peek for comment // ...
      if (input.charAt(parser_pos) === '/') {
        comment = c;
        while (input.charAt(parser_pos) !== "\x0d" && input.charAt(parser_pos) !== "\x0a") {
          comment += input.charAt(parser_pos);
          parser_pos += 1;

          if (parser_pos >= input_length) {
            break;
          }
        }

        parser_pos += 1;

        if (wanted_newline) {
          print_newline();
        }

        return [comment, 'TK_COMMENT'];
      }
    }

    if (c === "'" || // string
      c === '"' || // string
      (c === '/' && ((last_type === 'TK_WORD' && in_array(last_text, ['return', 'do'])) || (last_type === 'TK_START_EXPR' || last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_OPERATOR' || last_type === 'TK_EQUALS' || last_type === 'TK_EOF' || last_type === 'TK_SEMICOLON'))))
    { // regexp

      sep = c;
      esc = false;
      resulting_string = c;

      if (parser_pos < input_length) {
        if (sep === '/') {
          // handle regexp separately...
          in_char_class = false;

          while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
            resulting_string += input.charAt(parser_pos);

            if (!esc) {
              esc = input.charAt(parser_pos) === '\\';

              if (input.charAt(parser_pos) === '[') {
                in_char_class = true;
              }
              else if (input.charAt(parser_pos) === ']') {
                in_char_class = false;
              }
            }
            else {
              esc = false;
            }

            parser_pos += 1;

            if (parser_pos >= input_length) {
              // incomplete string/rexp when end-of-file reached.
              // bail out with what had been received so far.
              return [resulting_string, 'TK_STRING'];
            }
          }
        }
        else {
          // and handle string also separately
          while (esc || input.charAt(parser_pos) !== sep) {
            resulting_string += input.charAt(parser_pos);

            if (!esc) {
              esc = input.charAt(parser_pos) === '\\';
            }
            else {
              esc = false;
            }

            parser_pos += 1;

            if (parser_pos >= input_length) {
              // incomplete string/rexp when end-of-file reached.
              // bail out with what had been received so far.
              return [resulting_string, 'TK_STRING'];
            }
          }
        }
      }

      parser_pos += 1;
      resulting_string += sep;

      if (sep === '/') {
        // regexps may have modifiers /regexp/MOD , so fetch those, too
        while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
          resulting_string += input.charAt(parser_pos);
          parser_pos += 1;
        }
      }

      return [resulting_string, 'TK_STRING'];
    }

    if (c === '#') {
      // Spidermonkey-specific sharp variables for circular references
      // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
      // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
      sharp = '#';

      if (parser_pos < input_length && in_array(input.charAt(parser_pos), digits)) {
        do {
          c = input.charAt(parser_pos);
          sharp += c;
          parser_pos += 1;
        } while (parser_pos < input_length && c !== '#' && c !== '=');

        if (c === '#') {
          //
        }
        else if (input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
          sharp += '[]';
          parser_pos += 2;
        }
        else if (input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
          sharp += '{}';
          parser_pos += 2;
        }

        return [sharp, 'TK_WORD'];
      }
    }

    if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
      parser_pos += 3;
      flags.in_html_comment = true;
      return ['<!--', 'TK_COMMENT'];
    }

    if (c === '-' && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
      flags.in_html_comment = false;
      parser_pos += 2;

      if (wanted_newline) {
        print_newline();
      }

      return ['-->', 'TK_COMMENT'];
    }

    if (in_array(c, punct)) {
      while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
        c += input.charAt(parser_pos);
        parser_pos += 1;
        if (parser_pos >= input_length) {
          break;
        }
      }

      if (c === '=') {
        return [c, 'TK_EQUALS'];
      } else {
        return [c, 'TK_OPERATOR'];
      }
    }

    return [c, 'TK_UNKNOWN'];
  }
  // END get_next_token()


  //----------------------------------


  indent_string = '';

  while (opt_indent_size > 0) {
    indent_string += opt_indent_char;
    opt_indent_size -= 1;
  }

  input = js_source_text;
  last_word = ''; // last 'TK_WORD' passed
  last_type = 'TK_START_EXPR'; // last token type
  last_text = ''; // last token text
  last_last_text = ''; // pre-last token text
  output = [];

  do_block_just_closed = false;

  whitespace = "\n\r\t ".split('');
  wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
  digits = '0123456789'.split('');
  punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::'.split(' ');

  // words which should always start on new line.
  line_starters = 'continue,try,throw,return,var,if,switch,case,default,for,while,break,function'.split(',');

  // states showing if we are currently in expression (i.e. "if" case) - 'EXPRESSION', or in usual block (like, procedure), 'BLOCK'.
  // some formatting depends on that.
  flag_store = [];
  set_mode('BLOCK');

  parser_pos = 0;
  while (true) {
    t = get_next_token(parser_pos);
    token_text = t[0];
    token_type = t[1];
    if (token_type === 'TK_EOF') {
      break;
    }

    switch (token_type) {

      case 'TK_START_EXPR':
        if (token_text === '[') {

          if (last_type === 'TK_WORD' || last_text === ')') {
            // this is array index specifier, break immediately
            // a[x], fn()[x]
            if (in_array(last_text, line_starters)) {
              print_single_space();
            }

            set_mode('(EXPRESSION)');
            print_token();
            break;
          }

          if (flags.mode === '[EXPRESSION]' || flags.mode === '[INDENTED-EXPRESSION]') {
            if (last_last_text === ']' && last_text === ',') {
              // ], [ goes to new line
              if (flags.mode === '[EXPRESSION]') {
                flags.mode = '[INDENTED-EXPRESSION]';

                if (!opt_keep_array_indentation) {
                  indent();
                }
              }

              set_mode('[EXPRESSION]');

              if (!opt_keep_array_indentation) {
                print_newline();
              }
            }
            else if (last_text === '[') {
              if (flags.mode === '[EXPRESSION]') {
                flags.mode = '[INDENTED-EXPRESSION]';
                if (!opt_keep_array_indentation) {
                  indent();
                }
              }
              set_mode('[EXPRESSION]');

              if (!opt_keep_array_indentation) {
                print_newline();
              }
            }
            else {
              set_mode('[EXPRESSION]');
            }
          }
          else {
            set_mode('[EXPRESSION]');
          }
        }
        else {
          set_mode('(EXPRESSION)');
        }

        if (last_text === ';' || last_type === 'TK_START_BLOCK') {
          print_newline();
        }
        else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || last_text === '.') {
          // do nothing on (( and )( and ][ and ]( and .(
        }
        else if (last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
          print_single_space();
        }
        else if (last_word === 'function') {
          // function() vs function ()
          if (opt_space_after_anon_function) {
            print_single_space();
          }
        }
        else if (in_array(last_text, line_starters) || last_text === 'catch') {
          print_single_space();
        }

        print_token();
        break;

      case 'TK_END_EXPR':
        if (token_text === ']') {
          if (opt_keep_array_indentation) {
            if (last_text === '}') {
              // trim_output();
              // print_newline(true);
              remove_indent();
              print_token();
              restore_mode();
              break;
            }
          }
          else {
            if (flags.mode === '[INDENTED-EXPRESSION]') {
              if (last_text === ']') {
                restore_mode();
                print_newline();
                print_token();
                break;
              }
            }
          }
        }
        restore_mode();
        print_token();
        break;

      case 'TK_START_BLOCK':
        if (last_word === 'do') {
          set_mode('DO_BLOCK');
        }
        else {
          set_mode('BLOCK');
        }

        if (opt_braces_on_own_line) {
          if (last_type !== 'TK_OPERATOR') {
            if (last_text === 'return') {
              print_single_space();
            }
            else {
              print_newline(true);
            }
          }

          print_token();
          indent();
        }
        else {
          if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
            if (last_type === 'TK_START_BLOCK') {
              print_newline();
            }
            else {
              print_single_space();
            }
          }
          else {
            // if TK_OPERATOR or TK_START_EXPR
            if (is_array(flags.previous_mode) && last_text === ',') {
              print_newline(); // [a, b, c, {
            }
          }
          indent();
          print_token();
        }

        break;

      case 'TK_END_BLOCK':
        restore_mode();

        if (opt_braces_on_own_line) {
          print_newline();
          print_token();
        }
        else {
          if (last_type === 'TK_START_BLOCK') {
            // nothing
            if (just_added_newline) {
              remove_indent();
            }
            else {
              // {}
              trim_output();
            }
          }
          else {
            print_newline();
          }

          print_token();
        }
        break;

      case 'TK_WORD':
        // no, it's not you. even I have problems understanding how this works
        // and what does what.
        if (do_block_just_closed) {
          // do {} ## while ()
          print_single_space();
          print_token();
          print_single_space();
          do_block_just_closed = false;
          break;
        }

        if (token_text === 'function') {
          if ((just_added_newline || last_text === ';') && last_text !== '{') {
            // make sure there is a nice clean space of at least one blank line
            // before a new function definition
            n_newlines = just_added_newline ? n_newlines : 0;

            for (i = 0; i < 2 - n_newlines; i += 1) {
              print_newline(false);
            }
          }
        }

        if (token_text === 'case' || token_text === 'default') {
          if (last_text === ':') {
            // switch cases following one another
            remove_indent();
          }
          else {
            // case statement starts in the same line where switch
            flags.indentation_level -= 1;
            print_newline();
            flags.indentation_level += 1;
          }

          print_token();
          flags.in_case = true;
          break;
        }

        prefix = 'NONE';

        if (last_type === 'TK_END_BLOCK') {
          if (!in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
            prefix = 'NEWLINE';
          }
          else {
            if (opt_braces_on_own_line) {
              prefix = 'NEWLINE';
            }
            else {
              prefix = 'SPACE';
              print_single_space();
            }
          }
        }
        else if (last_type === 'TK_SEMICOLON' && (flags.mode === 'BLOCK' || flags.mode === 'DO_BLOCK')) {
          prefix = 'NEWLINE';
        }
        else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
          prefix = 'SPACE';
        }
        else if (last_type === 'TK_STRING') {
          prefix = 'NEWLINE';
        }
        else if (last_type === 'TK_WORD') {
          prefix = 'SPACE';
        }
        else if (last_type === 'TK_START_BLOCK') {
          prefix = 'NEWLINE';
        }
        else if (last_type === 'TK_END_EXPR') {
          print_single_space();
          prefix = 'NEWLINE';
        }

        if (last_type !== 'TK_END_BLOCK' && in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
          print_newline();
        }
        else if (in_array(token_text, line_starters) || prefix === 'NEWLINE') {
          if (last_text === 'else') {
            // no need to force newline on else break
            print_single_space();
          }
          else if ((last_type === 'TK_START_EXPR' || last_text === '=' || last_text === ',') && token_text === 'function') {
            // no need to force newline on 'function': (function
            // DONOTHING
          }
          else if (last_text === 'return' || last_text === 'throw') {
            // no newline between 'return nnn'
            print_single_space();
          }
          else if (last_type !== 'TK_END_EXPR') {
            if ((last_type !== 'TK_START_EXPR' || token_text !== 'var') && last_text !== ':') {
              // no need to force newline on 'var': for (var x = 0...)
              if (token_text === 'if' && last_word === 'else' && last_text !== '{') {
                // no newline for } else if {
                print_single_space();
              }
              else {
                print_newline();
              }
            }
          }
          else {
            if (in_array(token_text, line_starters) && last_text !== ')') {
              print_newline();
            }
          }
        }
        else if (is_array(flags.mode) && last_text === ',' && last_last_text === '}') {
          print_newline(); // }, in lists get a newline treatment
        }
        else if (prefix === 'SPACE') {
          print_single_space();
        }

        print_token();
        last_word = token_text;

        if (token_text === 'var') {
          flags.var_line = true;
          flags.var_line_reindented = false;
          flags.var_line_tainted = false;
        }

        if (token_text === 'if' || token_text === 'else') {
          flags.if_line = true;
        }

        break;

      case 'TK_SEMICOLON':
        print_token();
        flags.var_line = false;
        flags.var_line_reindented = false;
        break;

      case 'TK_STRING':
        if (last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_SEMICOLON') {
          print_newline();
        }
        else if (last_type === 'TK_WORD') {
          print_single_space();
        }

        print_token();
        break;

      case 'TK_EQUALS':
        if (flags.var_line) {
          // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
          flags.var_line_tainted = true;
        }

        print_single_space();
        print_token();
        print_single_space();
        break;

      case 'TK_OPERATOR':
        space_before = true;
        space_after = true;

        if (flags.var_line && token_text === ',' && (is_expression(flags.mode))) {
          // do not break on comma, for(var a = 1, b = 2)
          flags.var_line_tainted = false;
        }

        if (flags.var_line) {
          if (token_text === ',') {
            if (flags.var_line_tainted) {
              print_token();
              flags.var_line_reindented = true;
              flags.var_line_tainted = false;
              print_newline();
              break;
            }
            else {
              flags.var_line_tainted = false;
            }
            // } else if (token_text === ':') {
            // hmm, when does this happen? tests don't catch this
            // flags.var_line = false;
          }
        }

        if (last_text === 'return' || last_text === 'throw') {
          // "return" had a special handling in TK_WORD. Now we need to return the favor
          print_single_space();
          print_token();
          break;
        }

        if (token_text === ':' && flags.in_case) {
          print_token(); // colon really asks for separate treatment
          print_newline();
          flags.in_case = false;
          break;
        }

        if (token_text === '::') {
          // no spaces around exotic namespacing syntax operator
          print_token();
          break;
        }

        if (token_text === ',') {
          if (flags.var_line) {
            if (flags.var_line_tainted) {
              print_token();
              print_newline();
              flags.var_line_tainted = false;
            }
            else {
              print_token();
              print_single_space();
            }
          }
          else if (last_type === 'TK_END_BLOCK' && flags.mode !== "(EXPRESSION)") {
            print_token();
            if (flags.mode === 'OBJECT' && last_text === '}') {
              print_newline();
            } else {
              print_single_space();
            }
          }
          else {
            if (flags.mode === 'OBJECT') {
              print_token();
              print_newline();
            }
            else {
              // EXPR or DO_BLOCK
              print_token();
              print_single_space();
            }
          }
          break;
          // } else if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS']) || in_array(last_text, line_starters) || in_array(last_text, ['==', '!=', '+=', '-=', '*=', '/=', '+', '-'])))) {
        }
        else if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(last_text, line_starters)))) {
          // unary operators (and binary +/- pretending to be unary) special cases
          space_before = false;
          space_after = false;

          if (last_text === ';' && is_expression(flags.mode)) {
            // for (;; ++i)
            //        ^^^
            space_before = true;
          }

          if (last_type === 'TK_WORD' && in_array(last_text, line_starters)) {
            space_before = true;
          }

          if (flags.mode === 'BLOCK' && (last_text === '{' || last_text === ';')) {
            // { foo; --i }
            // foo(); --bar;
            print_newline();
          }
        }
        else if (token_text === '.') {
          // decimal digits or object.property
          space_before = false;

        }
        else if (token_text === ':') {
          if (!is_ternary_op()) {
            flags.mode = 'OBJECT';
            space_before = false;
          }
        }

        if (space_before) {
          print_single_space();
        }

        print_token();

        if (space_after) {
          print_single_space();
        }

        if (token_text === '!') {
          // flags.eat_next_space = true;
        }

        break;

      case 'TK_BLOCK_COMMENT':
        lines = token_text.split(/\x0a|\x0d\x0a/);

        if (/^\/\*\*/.test(token_text)) {
          // javadoc: reformat and reindent
          print_newline();
          output.push(lines[0]);

          for (i = 1; i < lines.length; i += 1) {
            print_newline();
            output.push(' ');
            output.push(lines[i].replace(/^\s\s*|\s\s*$/, ''));
          }
        }
        else {
          // simple block comment: leave intact
          if (lines.length > 1) {
            // multiline comment block starts with a new line
            print_newline();
            trim_output();
          }
          else {
            // single-line /* comment */ stays where it is
            print_single_space();
          }

          for (i = 0; i < lines.length; i += 1) {
            output.push(lines[i]);
            output.push('\n');
          }
        }

        print_newline();
        break;

      case 'TK_INLINE_COMMENT':
        print_single_space();
        print_token();
        if (is_expression(flags.mode)) {
          print_single_space();
        } else {
          print_newline();
        }
        break;

      case 'TK_COMMENT':
        // print_newline();
        if (wanted_newline) {
          print_newline();
        } else {
          print_single_space();
        }
        print_token();
        print_newline();
        break;

      case 'TK_UNKNOWN':
        print_token();
        break;
    }

    last_last_text = last_text;
    last_type = token_type;
    last_text = token_text;
  }

  return output.join('').replace(/[\n ]+$/, '');
}

/*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

/*global setTimeout: false, console: false */(function(){var a={},b=this,c=b.async;typeof module!="undefined"&&module.exports?module.exports=a:b.async=a,a.noConflict=function(){return b.async=c,a};var d=function(a,b){if(a.forEach)return a.forEach(b);for(var c=0;c<a.length;c+=1)b(a[c],c,a)},e=function(a,b){if(a.map)return a.map(b);var c=[];return d(a,function(a,d,e){c.push(b(a,d,e))}),c},f=function(a,b,c){return a.reduce?a.reduce(b,c):(d(a,function(a,d,e){c=b(c,a,d,e)}),c)},g=function(a){if(Object.keys)return Object.keys(a);var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b};typeof process=="undefined"||!process.nextTick?a.nextTick=function(a){setTimeout(a,0)}:a.nextTick=process.nextTick,a.forEach=function(a,b,c){c=c||function(){};if(!a.length)return c();var e=0;d(a,function(d){b(d,function(b){b?(c(b),c=function(){}):(e+=1,e===a.length&&c(null))})})},a.forEachSeries=function(a,b,c){c=c||function(){};if(!a.length)return c();var d=0,e=function(){b(a[d],function(b){b?(c(b),c=function(){}):(d+=1,d===a.length?c(null):e())})};e()},a.forEachLimit=function(a,b,c,d){d=d||function(){};if(!a.length||b<=0)return d();var e=0,f=0,g=0;(function h(){if(e===a.length)return d();while(g<b&&f<a.length)f+=1,g+=1,c(a[f-1],function(b){b?(d(b),d=function(){}):(e+=1,g-=1,e===a.length?d():h())})})()};var h=function(b){return function(){var c=Array.prototype.slice.call(arguments);return b.apply(null,[a.forEach].concat(c))}},i=function(b){return function(){var c=Array.prototype.slice.call(arguments);return b.apply(null,[a.forEachSeries].concat(c))}},j=function(a,b,c,d){var f=[];b=e(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b){c(a.value,function(c,d){f[a.index]=d,b(c)})},function(a){d(a,f)})};a.map=h(j),a.mapSeries=i(j),a.reduce=function(b,c,d,e){a.forEachSeries(b,function(a,b){d(c,a,function(a,d){c=d,b(a)})},function(a){e(a,c)})},a.inject=a.reduce,a.foldl=a.reduce,a.reduceRight=function(b,c,d,f){var g=e(b,function(a){return a}).reverse();a.reduce(g,c,d,f)},a.foldr=a.reduceRight;var k=function(a,b,c,d){var f=[];b=e(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b){c(a.value,function(c){c&&f.push(a),b()})},function(a){d(e(f.sort(function(a,b){return a.index-b.index}),function(a){return a.value}))})};a.filter=h(k),a.filterSeries=i(k),a.select=a.filter,a.selectSeries=a.filterSeries;var l=function(a,b,c,d){var f=[];b=e(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b){c(a.value,function(c){c||f.push(a),b()})},function(a){d(e(f.sort(function(a,b){return a.index-b.index}),function(a){return a.value}))})};a.reject=h(l),a.rejectSeries=i(l);var m=function(a,b,c,d){a(b,function(a,b){c(a,function(c){c?(d(a),d=function(){}):b()})},function(a){d()})};a.detect=h(m),a.detectSeries=i(m),a.some=function(b,c,d){a.forEach(b,function(a,b){c(a,function(a){a&&(d(!0),d=function(){}),b()})},function(a){d(!1)})},a.any=a.some,a.every=function(b,c,d){a.forEach(b,function(a,b){c(a,function(a){a||(d(!1),d=function(){}),b()})},function(a){d(!0)})},a.all=a.every,a.sortBy=function(b,c,d){a.map(b,function(a,b){c(a,function(c,d){c?b(c):b(null,{value:a,criteria:d})})},function(a,b){if(a)return d(a);var c=function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0};d(null,e(b.sort(c),function(a){return a.value}))})},a.auto=function(a,b){b=b||function(){};var c=g(a);if(!c.length)return b(null);var e={},h=[],i=function(a){h.unshift(a)},j=function(a){for(var b=0;b<h.length;b+=1)if(h[b]===a){h.splice(b,1);return}},k=function(){d(h.slice(0),function(a){a()})};i(function(){g(e).length===c.length&&(b(null,e),b=function(){})}),d(c,function(c){var d=a[c]instanceof Function?[a[c]]:a[c],g=function(a){if(a)b(a),b=function(){};else{var d=Array.prototype.slice.call(arguments,1);d.length<=1&&(d=d[0]),e[c]=d,k()}},h=d.slice(0,Math.abs(d.length-1))||[],l=function(){return f(h,function(a,b){return a&&e.hasOwnProperty(b)},!0)&&!e.hasOwnProperty(c)};if(l())d[d.length-1](g,e);else{var m=function(){l()&&(j(m),d[d.length-1](g,e))};i(m)}})},a.waterfall=function(b,c){c=c||function(){};if(!b.length)return c();var d=function(b){return function(e){if(e)c(e),c=function(){};else{var f=Array.prototype.slice.call(arguments,1),g=b.next();g?f.push(d(g)):f.push(c),a.nextTick(function(){b.apply(null,f)})}}};d(a.iterator(b))()},a.parallel=function(b,c){c=c||function(){};if(b.constructor===Array)a.map(b,function(a,b){a&&a(function(a){var c=Array.prototype.slice.call(arguments,1);c.length<=1&&(c=c[0]),b.call(null,a,c)})},c);else{var d={};a.forEach(g(b),function(a,c){b[a](function(b){var e=Array.prototype.slice.call(arguments,1);e.length<=1&&(e=e[0]),d[a]=e,c(b)})},function(a){c(a,d)})}},a.series=function(b,c){c=c||function(){};if(b.constructor===Array)a.mapSeries(b,function(a,b){a&&a(function(a){var c=Array.prototype.slice.call(arguments,1);c.length<=1&&(c=c[0]),b.call(null,a,c)})},c);else{var d={};a.forEachSeries(g(b),function(a,c){b[a](function(b){var e=Array.prototype.slice.call(arguments,1);e.length<=1&&(e=e[0]),d[a]=e,c(b)})},function(a){c(a,d)})}},a.iterator=function(a){var b=function(c){var d=function(){return a.length&&a[c].apply(null,arguments),d.next()};return d.next=function(){return c<a.length-1?b(c+1):null},d};return b(0)},a.apply=function(a){var b=Array.prototype.slice.call(arguments,1);return function(){return a.apply(null,b.concat(Array.prototype.slice.call(arguments)))}};var n=function(a,b,c,d){var e=[];a(b,function(a,b){c(a,function(a,c){e=e.concat(c||[]),b(a)})},function(a){d(a,e)})};a.concat=h(n),a.concatSeries=i(n),a.whilst=function(b,c,d){b()?c(function(e){if(e)return d(e);a.whilst(b,c,d)}):d()},a.until=function(b,c,d){b()?d():c(function(e){if(e)return d(e);a.until(b,c,d)})},a.queue=function(b,c){var e=0,f={tasks:[],concurrency:c,saturated:null,empty:null,drain:null,push:function(b,e){b.constructor!==Array&&(b=[b]),d(b,function(b){f.tasks.push({data:b,callback:typeof e=="function"?e:null}),f.saturated&&f.tasks.length==c&&f.saturated(),a.nextTick(f.process)})},process:function(){if(e<f.concurrency&&f.tasks.length){var a=f.tasks.shift();f.empty&&f.tasks.length==0&&f.empty(),e+=1,b(a.data,function(){e-=1,a.callback&&a.callback.apply(a,arguments),f.drain&&f.tasks.length+e==0&&f.drain(),f.process()})}},length:function(){return f.tasks.length},running:function(){return e}};return f};var o=function(a){return function(b){var c=Array.prototype.slice.call(arguments,1);b.apply(null,c.concat([function(b){var c=Array.prototype.slice.call(arguments,1);typeof console!="undefined"&&(b?console.error&&console.error(b):console[a]&&d(c,function(b){console[a](b)}))}]))}};a.log=o("log"),a.dir=o("dir"),a.memoize=function(a,b){var c={},d={};b=b||function(a){return a};var e=function(){var e=Array.prototype.slice.call(arguments),f=e.pop(),g=b.apply(null,e);g in c?f.apply(null,c[g]):g in d?d[g].push(f):(d[g]=[f],a.apply(null,e.concat([function(){c[g]=arguments;var a=d[g];delete d[g];for(var b=0,e=a.length;b<e;b++)a[b].apply(null,arguments)}])))};return e.unmemoized=a,e},a.unmemoize=function(a){return function(){return(a.unmemoized||a).apply(null,arguments)}}})();

/*! PSPlugin - v0.1.0 - 2012-10-26
* Copyright (c) 2012 Team Mayhem (though mostly Gaurav ;); */

var PSD2JSON = (function () {
    function PSD2JSON(options, app, preferences) {
        this.options = options;
        this.app = app;
        this.preferences = preferences;
        this.sourceFile = options.source;
        this.exportDir = options.target;
        this.jsonCache = options.jsonCache;
        this.app.open(new File(this.sourceFile));
        this.originalRulerUnits = this.preferences.rulerUnits;
        this.doc = this.app.activeDocument;
        this.mainDoc = this.doc;
        this.doc = this.mainDoc.duplicate();
        this.folder = new Folder(this.exportDir);
        if(!this.folder.exists) {
            this.folder.create();
        }
    }
    PSD2JSON.prototype.process = function () {
        this.preferences.rulerUnits = Units.PIXELS;
        var dimensions = {
            top: 0,
            left: 0,
            width: parseInt(this.doc.width),
            height: parseInt(this.doc.height)
        };
        this.cleanUpLayers(this.doc.layers);
        var traversed = this.traverse(this.doc.layers);
        traversed = {
            dimensions: dimensions,
            objects: traversed
        };
        this.preferences.rulerUnits = this.originalRulerUnits;
        var file = new File(this.jsonCache);
        file.open('w');
        file.writeln(js_beautify(JSON.stringify(traversed), {
            indent_size: 2,
            indent_char: ' '
        }));
        file.close();
    };
    PSD2JSON.prototype.guessControl = function (name) {
        name = name.toLowerCase();
        if(name.indexOf('label') != -1) {
            return "Label";
        } else {
            if(name.indexOf('textfield') != -1) {
                return "TextField";
            } else {
                if(name.indexOf('button') != -1) {
                    return "Button";
                } else {
                    if(name.indexOf('background') != -1) {
                        return "Background";
                    } else {
                        if(name.indexOf('switch') != -1) {
                            return "Switch";
                        } else {
                            if(name.indexOf('bar') != -1) {
                                return "NavigationBar";
                            } else {
                                if(name.indexOf('image') != -1) {
                                    return "Image";
                                } else {
                                    return null;
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    PSD2JSON.prototype.isControl = function (name) {
        var guessedName = this.guessControl(name);
        return this.isControlWithText(name) || guessedName == 'Switch';
    };
    PSD2JSON.prototype.isControlWithText = function (name) {
        var guessedName = this.guessControl(name);
        return guessedName == 'Button' || guessedName == 'Switch' || guessedName == 'NavigationBar' || guessedName == 'TextField' || guessedName == 'Label' || guessedName == 'Image' || guessedName == 'Background';
    };
    PSD2JSON.prototype.removeControlLayers = function (layer, helperLayer, helperDoc) {
        var _layer;
        var _remove = [];
        var _properties = null;

        for(var i = 0; i < helperLayer.layers.length; i++) {
            _layer = helperLayer.layers[i];
            if(_layer.kind == LayerKind.TEXT) {
                _remove.push(_layer);
                _properties = this.render(layer.layers[i]);
            } else {
                if(_layer.typename == "LayerSet" && _layer.bounds[0] > 0) {
                    _remove.push(_layer);
                }
            }
        }
        this.app.activeDocument = helperDoc;
        for(var i = 0; i < _remove.length; i++) {
            _remove[i].remove();
        }
        return _properties;
    };
    PSD2JSON.prototype.removeSiblings = function (layer, parent) {
        var _layer;
        for(var i = 0; i < parent.layers.length; i++) {
            _layer = parent.layers[i];
            if(_layer.typename == "LayerSet" && _layer.name != layer.name) {
                this.removeSiblings(layer, _layer);
            } else {
                if(_layer.name != layer.name) {
                    _layer.visible = false;
                } else {
                    _layer.visible = true;
                }
            }
        }
        return true;
    };
    PSD2JSON.prototype.trimLayer = function (layer, doc) {
        doc.crop(layer.bounds);
        var desc = new ActionDescriptor();
        desc.putEnumerated(sTID("trimBasedOn"), sTID("trimBasedOn"), cTID("Trns"));
        desc.putBoolean(cTID("Left"), true);
        desc.putBoolean(cTID("Top "), true);
        desc.putBoolean(cTID("Rght"), false);
        desc.putBoolean(cTID("Btom"), false);
        try  {
            executeAction(sTID("trim"), desc, DialogModes.NO);
        } catch (e) {
        }
        desc.putBoolean(cTID("Left"), false);
        desc.putBoolean(cTID("Top "), false);
        desc.putBoolean(cTID("Rght"), true);
        desc.putBoolean(cTID("Btom"), true);
        try  {
            executeAction(sTID("trim"), desc, DialogModes.NO);
        } catch (e) {
        }
    };
    PSD2JSON.prototype.saveLayerAndClose = function (layer, doc, name) {
        name = name + ".png";
        layer.path = this.folder.fullName + "/" + name;
        var saveOptions = new PNGSaveOptions();
        saveOptions.interlaced = false;
        doc.saveAs(new File(layer.path), saveOptions, true, Extension.LOWERCASE);
        doc.close(SaveOptions.DONOTSAVECHANGES);
        return name;
    };
    PSD2JSON.prototype.render = function (layer, guessedName) {
        var isVisible = true;
        if(isVisible) {
            this.app.activeDocument = this.doc;
            layer.visible = true;
            this.app.activeDocument.activeLayer = layer;
            var outLayer = {
                type: guessedName,
                layer_name: layer.name.replace(/\W+/g, '-'),
                dimensions: {
                    left: layer.bounds[0].value,
                    top: layer.bounds[1].value,
                    width: layer.bounds[2].value - layer.bounds[0].value,
                    height: layer.bounds[3].value - layer.bounds[1].value
                }
            };
            if(layer.kind == LayerKind.TEXT) {
                var ranges = [];
                var range;
                var maxLineHeight = 0;
                var maxFontSize = 0;
                var ti = layer.textItem;
                var info = [];
                var ref = new ActionReference();
                ref.putEnumerated(sTID("layer"), cTID("Ordn"), cTID("Trgt"));
                var desc = executeActionGet(ref);
                var list = desc.getObjectValue(cTID("Txt "));
                var tsr = list.getList(cTID("Txtt"));
                var tsr0 = tsr.getObjectValue(0);
                var textStyle = null;
                var color = null;
                var autoLeading = null;
                var size = null;
                var leading = null;
                var text = null;
                var font = null;
                var red = null;
                var blue = null;
                var green = null;
                try  {
                    textStyle = tsr0.getObjectValue(cTID("TxtS"));
                } catch (ex) {
                }
                try  {
                    color = textStyle.getObjectValue(cTID("Clr "));
                } catch (ex) {
                }
                try  {
                    autoLeading = textStyle.getBoolean(sTID("autoLeading"));
                } catch (ex) {
                }
                try  {
                    size = parseInt(textStyle.getUnitDoubleValue(cTID("Sz  ", pts)));
                } catch (ex) {
                }
                try  {
                    leading = autoLeading ? false : textStyle.getUnitDoubleValue(cTID("Ldng"));
                } catch (ex) {
                }
                try  {
                    text = ti.contents;
                } catch (ex) {
                }
                try  {
                    font = textStyle.getString(cTID("FntN"));
                } catch (ex) {
                }
                try  {
                    red = color.getInteger(cTID("Rd  "));
                } catch (ex) {
                }
                try  {
                    blue = color.getInteger(cTID("Bl  "));
                } catch (ex) {
                }
                try  {
                    green = color.getInteger(cTID("Grn "));
                } catch (ex) {
                }
                var details = {
                    red: red || 0,
                    blue: blue || 0,
                    green: green || 0,
                    size: size,
                    text: text,
                    font: font || 'Helvetica'
                };
                if(size > maxFontSize) {
                    maxFontSize = size;
                }
                if(!autoLeading) {
                    if(leading > maxLineHeight) {
                        maxLineHeight = leading;
                    }
                }
                if(maxLineHeight > outLayer.dimensions.height) {
                    outLayer.dimensions.top += (outLayer.dimensions.height - maxLineHeight) / 2;
                    outLayer.dimensions.line_height = maxLineHeight;
                    outLayer.dimensions.height = maxLineHeight;
                } else {
                    if(outLayer.dimensions.height <= maxFontSize + maxFontSize / 3) {
                        outLayer.dimensions.line_height = outLayer.dimensions.height;
                    }
                }
                outLayer.details = details;
            } else {
                var helperDoc = this.doc.duplicate();
                var helperLayer = helperDoc.activeLayer;

                this.removeSiblings(helperLayer, helperDoc);
                if(guessedName == 'Button' || guessedName == 'TextField' || guessedName == 'NavigationBar' || guessedName == 'Label') {
                    outLayer.text = this.removeControlLayers(layer, helperLayer, helperDoc);
                }
                this.trimLayer(helperLayer, helperDoc);
                if(outLayer.text && outLayer.text.dimensions) {
                    outLayer.text.dimensions.left -= outLayer.dimensions.left;
                    outLayer.text.dimensions.top -= outLayer.dimensions.top;
                }
                outLayer.dimensions.left += outLayer.dimensions.width - helperDoc.width.value;
                outLayer.dimensions.top += outLayer.dimensions.height - helperDoc.height.value;
                outLayer.dimensions.width = helperDoc.width.value;
                outLayer.dimensions.height = helperDoc.height.value;
                outLayer.image = this.saveLayerAndClose(helperLayer, helperDoc, outLayer.layer_name);
            }
            if(outLayer.dimensions.left < 0) {
                outLayer.dimensions.left = 0;
            }
            if(outLayer.dimensions.top < 0) {
                outLayer.dimensions.top = 0;
            }
            layer.visible = false;
            return outLayer;
        }
    };
    PSD2JSON.prototype.cleanUpLayers = function (layers) {
        var _layer;
        var _mergeLayers = [];
        var _guessedName;

        for(var i = 0; i < layers.length; i++) {
            _layer = layers[i];
            _layer.name = _layer.name + ("-" + Math.random()).replace('0.', '');
            _guessedName = this.guessControl(_layer.name);
            if(_layer.typename == "LayerSet") {
                this.cleanUpLayers(_layer.layers);
            } else {
                var controlName = this.guessControl(_layer.name);
                if(!controlName && _layer.kind != LayerKind.TEXT) {
                    _mergeLayers.push(_layer);
                }
            }
        }
        if(_mergeLayers.length > 0) {
            var newLayer = layers.parent.layerSets.add();
            newLayer.name = _mergeLayers[0].name;
            if(newLayer.parent.layers.length > 1) {
                newLayer.move(newLayer.parent.layers[newLayer.parent.layers.length - 1], ElementPlacement.PLACEAFTER);
            }
            for(var i = 0; i < _mergeLayers.length; i++) {
                _layer = _mergeLayers[_mergeLayers.length - 1 - i];
                _layer.move(newLayer, ElementPlacement.INSIDE);
            }
            newLayer.merge();
        }
    };
    PSD2JSON.prototype.traverse = function (layers) {
        var layer;
        var parsed = [];
        var name;
        var guessedName;

        for(var i = 0; i < layers.length; i++) {
            layer = layers[i];
            name = layer.name.replace(/\W+/g, '-');
            guessedName = this.guessControl(name);
            if(layer.typename == "LayerSet" && !this.isControl(name)) {
                if(!parsed['objects']) {
                    parsed['objects'] = [];
                }
                var x = {
                };
                var a = this.traverse(layer.layers);
                if(a.length == 1) {
                    parsed = parsed.concat(a);
                } else {
                    x['objects'] = a;
                    parsed = parsed.concat(x);
                }
            } else {
                var a = this.render(layer, guessedName);
                parsed = parsed.concat(a);
            }
        }
        return parsed.reverse();
    };
    return PSD2JSON;
})();

function cTID(s) {
    return app.charIDToTypeID(s);
}
function sTID(s) {
    return app.stringIDToTypeID(s);
}
function main(options) {
    var exporter = new PSD2JSON(options, app, preferences);
    exporter.process();
    return true;
}
function parsePreferences() {
    var b = new File("~/psd2json.json");
    b.open('r');
    var str = "";
    while(!b.eof) {
        str += b.readln();
    }
    b.close();
    return JSON.parse(str);
}
main(parsePreferences());
