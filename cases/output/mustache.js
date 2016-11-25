/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

var Mustache = function mustacheFactory () {
//> Mustache: undefined; 1/1
  var mustache = {};
//> mustache: undefined; 1/1
  var objectToString = Object.prototype.toString;
//> objectToString: undefined; 1/1
//> Object: { "prototype": Object, "getPrototypeOf": (o: any) => any, "getOwnPropertyDescriptor": (o: any, p: string) => PropertyDescriptor, "getOwnPropertyNames": (o: any) => Array<, string>, "create": (o: any, properties: PropertyDescriptorMap) => any, "defineProperty": (o: any, p: string, attributes: PropertyDescriptor) => any, "defineProperties": (o: any, properties: PropertyDescriptorMap) => any, "seal": (o: any) => any, "freeze": (o: any) => any, "preventExtensions": (o: any) => any, "isSealed": (o: any) => boolean, "isFrozen": (o: any) => boolean, "isExtensible": (o: any) => boolean, "keys": (o: any) => Array<, string> } & new (value?: any) => Object & () => any & (value: any) => any; 1/1
//> Object.prototype: { "constructor": Function, "toString": () => string, "toLocaleString": () => string, "valueOf": () => Object, "hasOwnProperty": (v: string) => boolean, "isPrototypeOf": (v: Object) => boolean, "propertyIsEnumerable": (v: string) => boolean }; 1/1
//> Object.prototype.toString: () => string; 1/1
  var isArray = Array.isArray || function isArrayPolyfill (object) {
//> isArray: undefined; 1/1
//> Array: { "isArray": (arg: any) => any, "prototype": Array<, any> } & new (arrayLength: number) => Array<, any> & new (...items: Array<, any>) => Array<, any> & (arrayLength: number) => Array<, any> & (...items: Array<, any>) => Array<, any>; 1/1
//> Array.isArray: (arg: any) => any; 1/1
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
//> regExpTest: undefined; 1/1
//> RegExp: { "prototype": RegExp, "$1": string, "$2": string, "$3": string, "$4": string, "$5": string, "$6": string, "$7": string, "$8": string, "$9": string, "lastMatch": string } & new (pattern: RegExp) => RegExp & new (pattern: string, flags?: string) => RegExp & (pattern: RegExp) => RegExp & (pattern: string, flags?: string) => RegExp; 1/1
//> RegExp.prototype: { "exec": (string: string) => { "index": number, "input": string }, "test": (string: string) => boolean, "source": string, "global": boolean, "ignoreCase": boolean, "multiline": boolean, "lastIndex": number, "compile": () => any }; 1/1
//> RegExp.prototype.test: (string: string) => boolean; 1/1
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
//> nonSpaceRe: undefined; 1/1
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
//> entityMap: undefined; 1/1
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
//> whiteRe: undefined; 1/1
  var spaceRe = /\s+/;
//> spaceRe: undefined; 1/1
  var equalsRe = /\s*=/;
//> equalsRe: undefined; 1/1
  var curlyRe = /\s*\}/;
//> curlyRe: undefined; 1/1
  var tagRe = /#|\^|\/|>|\{|&|=|!/;
//> tagRe: undefined; 1/1

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

//> Scanner: Scanner~(string: any) => any; 1/1
//> Scanner.prototype: any; 1/1
//> Scanner.prototype.eos: any; 1/1
  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

//> Scanner: Scanner~(string: any) => any & { "prototype": { "eos": eos~() => any } }; 1/1
//> Scanner.prototype: { "eos": eos~() => any }; 1/1
//> Scanner.prototype.scan: any; 1/1
  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

//> Scanner: Scanner~(string: any) => any & { "prototype": { "scan": scan~(re: any) => any, "eos": eos~() => any } }; 1/1
//> Scanner.prototype: { "scan": scan~(re: any) => any, "eos": eos~() => any }; 1/1
//> Scanner.prototype.scanUntil: any; 1/1
  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
//> this: { "lookup": lookup~(name: any) => any, "push": push~(view: any) => any }; 1/1
//> this.view: any; 1/1
//> view: { "title": "b" }; 1/1
    this.cache = { '.': this.view };
//> this: { "view": { "title": "b" }, "lookup": lookup~(name: any) => any, "push": push~(view: any) => any }; 1/1
//> this.cache: any; 1/1
//> this: { "view": { "title": "b" }, "lookup": lookup~(name: any) => any, "push": push~(view: any) => any }; 1/1
//> this.view: { "title": "b" }; 1/1
    this.parent = parentContext;
//> this: { "view": { "title": "b" }, "lookup": lookup~(name: any) => any, "push": push~(view: any) => any }; 1/1
//> this.parent: any; 1/1
//> parentContext: undefined; 1/1
  }

//> Context: Context~(view: any, parentContext: any) => any; 1/1
//> Context.prototype: any; 1/1
//> Context.prototype.push: any; 1/1
  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

//> Context: Context~(view: any, parentContext: any) => any & { "prototype": { "push": push~(view: any) => any } }; 1/1
//> Context.prototype: { "push": push~(view: any) => any }; 1/1
//> Context.prototype.lookup: any; 1/1
  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
//> this: { "rawValue": rawValue~(token: any) => any, "escapedValue": escapedValue~(token: any, context: any) => any, "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> this.cache: any; 1/1
  }

//> Writer: Writer~() => any; 1/1
//> Writer.prototype: any; 1/1
//> Writer.prototype.clearCache: any; 1/1
  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

//> Writer: Writer~() => any & { "prototype": { "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.parse: any; 1/1
  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
//> cache: undefined; 1/1
//> this: undefined; 1/1
//> this.cache: never; 1/1
    var tokens = cache[template];
//> tokens: undefined; 1/1
//> cache: never; 1/1
//> template: "My name is {{name"; 1/1
//> cache[template]: never; 1/1

    if (tokens == null)
//> tokens: never; 1/1
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
//> tokens: never; 1/1
  };

//> Writer: Writer~() => any & { "prototype": { "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.render: any; 1/1
  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
//> tokens: undefined; 1/1
//> this: undefined; 1/1
//> this.parse: never; 1/1
//> template: "a {{title}} c"; 1/1
    var context = (view instanceof Context) ? view : new Context(view);
//> context: undefined; 1/1
//> view: { "title": "b" }; 1/1
//> Context: Context~(view: any, parentContext: any) => any & { "prototype": { "lookup": lookup~(name: any) => any, "push": push~(view: any) => any } }; 1/1
//> view: { "title": "b" }; 1/1
//> Context: Context~(view: any, parentContext: any) => any & { "prototype": { "lookup": lookup~(name: any) => any, "push": push~(view: any) => any } }; 1/1
//> view: { "title": "b" }; 1/1
    return this.renderTokens(tokens, context, partials, template);
//> this: { "parent": undefined, "view": { "title": "b" }, "lookup": lookup~(name: any) => any, "push": push~(view: any) => any }; 1/1
//> this.renderTokens: any; 1/1
//> tokens: never; 1/1
//> context: { "title": "b" } | { "parent": undefined, "view": { "title": "b" }, "lookup": lookup~(name: any) => any, "push": push~(view: any) => any }; 1/1
//> partials: undefined; 1/1
//> template: "a {{title}} c"; 1/1
  };

//> Writer: Writer~() => any & { "prototype": { "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.renderTokens: any; 1/1
  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

//> Writer: Writer~() => any & { "prototype": { "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.renderSection: any; 1/1
  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

//> Writer: Writer~() => any & { "prototype": { "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.renderInverted: any; 1/1
  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

//> Writer: Writer~() => any & { "prototype": { "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.renderPartial: any; 1/1
  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

//> Writer: Writer~() => any & { "prototype": { "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.unescapedValue: any; 1/1
  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

//> Writer: Writer~() => any & { "prototype": { "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.escapedValue: any; 1/1
  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

//> Writer: Writer~() => any & { "prototype": { "escapedValue": escapedValue~(token: any, context: any) => any, "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1
//> Writer.prototype: { "escapedValue": escapedValue~(token: any, context: any) => any, "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> Writer.prototype.rawValue: any; 1/1
  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

//> mustache: {  }; 1/1
//> mustache.name: any; 1/1
  mustache.name = 'mustache.js';
  mustache.version = '2.2.1';
//> mustache: { "name": "mustache.js" }; 1/1
//> mustache.version: any; 1/1
  mustache.tags = [ '{{', '}}' ];
//> mustache: { "version": "2.2.1", "name": "mustache.js" }; 1/1
//> mustache.tags: any; 1/1

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();
//> defaultWriter: undefined; 1/1
//> Writer: Writer~() => any & { "prototype": { "rawValue": rawValue~(token: any) => any, "escapedValue": escapedValue~(token: any, context: any) => any, "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any } }; 1/1

//> mustache: { "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> mustache.clearCache: any; 1/1
  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

//> mustache: { "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> mustache.parse: any; 1/1
  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
//> defaultWriter: { "rawValue": rawValue~(token: any) => any, "escapedValue": escapedValue~(token: any, context: any) => any, "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> defaultWriter.parse: parse~(template: any, tags: any) => any; 1/1
//> template: "My name is {{name"; 1/1
//> tags: undefined; 1/1
  };

//> mustache: { "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> mustache.render: any; 1/1
  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
//> template: "a {{title}} c"; 1/1
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
//> defaultWriter: { "rawValue": rawValue~(token: any) => any, "escapedValue": escapedValue~(token: any, context: any) => any, "unescapedValue": unescapedValue~(token: any, context: any) => any, "renderPartial": renderPartial~(token: any, context: any, partials: any) => any, "renderInverted": renderInverted~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderSection": renderSection~(token: any, context: any, partials: any, originalTemplate: any) => any, "renderTokens": renderTokens~(tokens: any, context: any, partials: any, originalTemplate: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any }; 1/1
//> defaultWriter.render: render~(template: any, view: any, partials: any) => any; 1/1
//> template: "a {{title}} c"; 1/1
//> view: { "title": "b" }; 1/1
//> partials: undefined; 1/1
  };

//> mustache: { "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> mustache.to_html: any; 1/1
  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

//> mustache: { "to_html": to_html~(template: any, view: any, partials: any, send: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> mustache.escape: any; 1/1
  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;
//> escapeHtml: escapeHtml~(string: any) => any; 1/1

  // Export these mainly for testing, but also for advanced usage.
  // mustache.Scanner = Scanner;
  // mustache.Context = Context;
  // mustache.Writer = Writer;
  return mustache;
//> mustache: { "escape": escapeHtml~(string: any) => any, "to_html": to_html~(template: any, view: any, partials: any, send: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
}();

var x = Mustache.parse('My name is {{name');
//> x: undefined; 1/1
//> Mustache: { "escape": escapeHtml~(string: any) => any, "to_html": to_html~(template: any, view: any, partials: any, send: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> Mustache.parse: parse~(template: any, tags: any) => any; 1/1
var y = Mustache.render("a {{title}} c", { title: "b" });
//> y: undefined; 1/1
//> Mustache: { "escape": escapeHtml~(string: any) => any, "to_html": to_html~(template: any, view: any, partials: any, send: any) => any, "render": render~(template: any, view: any, partials: any) => any, "parse": parse~(template: any, tags: any) => any, "clearCache": clearCache~() => any, "tags": Array<, "{{" | "}}">, "version": "2.2.1", "name": "mustache.js" }; 1/1
//> Mustache.render: render~(template: any, view: any, partials: any) => any; 1/1
//> title: never; 1/1
x;
//> x: never; 1/1
y;
//> y: any; 1/1