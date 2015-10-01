// Deals with blessed-style {bold}tags{/bold}

var _ = require('lodash');
var blessed = require('blessed');

function Markup (style) {
  var self = this;
  self.style = style || '';
  self.contents = [];
  [].slice.call(arguments, 1).forEach(function (arg) { self.push(arg); });
}

Markup.TAG_RE = /\{(\/?)([\w\-,;!#]*)\}/;
Markup.TAG_RE_G = new RegExp(Markup.TAG_RE.source, 'g');
Markup.CLOSE_ALL_TAGS = '{/}';
Markup.parse = function (text) {
  if (text instanceof Markup) return text;
  var result = new Markup();
  var match, stack = [result];
  while (match = text.match(Markup.TAG_RE)) {
    var tag = match[0];
    var parent = _.last(stack);
    if (match.index) parent.push(text.slice(0, match.index));
    if (!match[1]) { // open tag
      var replace = {open: '{', close: '}'}[match[2]];
      if (replace) {
        parent.push(replace);
      } else {
        var child = new Markup(match[0]);
        var lastChild = _.last(parent.contents);
        parent.push(child);
        stack.push(lastChild === _.last(parent.contents) ? lastChild : child);
      }
    } else { // close tag
      var closed;
      if (match[0] === Markup.CLOSE_ALL_TAGS) closed = stack.splice(1, Infinity);
      else if (parent.style === '{'+match[2]+'}') closed = [stack.pop()];
      else throw new Error("invalid close tag");

      // bit of cleanup
      var lastItem = _.last(stack);
      closed.some(function (item) {
        if (!item.contents.length) {
          lastItem.contents.pop();
          return true;
        }
        lastItem = item;
      });
    }
    text = text.slice(match.index + tag.length);
  }
  if (stack.length !== 1) throw new Error("mismatched tag");
  if (text) result.push(text);
  return result.clean();
};
Markup._closeTags = function (tags) {
  return (tags
    .replace(Markup.TAG_RE_G, '{/$2}', 'g') // 'g' flag ignored :(
    .match(Markup.TAG_RE_G) || [])
    .reverse()
    .join('');
};
Markup.getTaglessLength = function (val) {
  if (val instanceof Markup) return val.contents.reduce(function (total, item) {
    return total + Markup.getTaglessLength(item);
  }, 0);
  return val.length;
};

Markup.prototype.clean = function () {
  if (!this.style && this.contents.length === 1) {
    var child = this.contents[0];
    if (child instanceof Markup) return child;
  }
  return this;
};
Markup.prototype.tag = function (style, start, end) {
  if (typeof start !== 'number') start = 0;
  if (typeof end !== 'number') end = Infinity;

  if (!style) return this;
  return this.slice(0, start).push(
    new Markup(style, this.slice(start, end)),
    this.slice(end));
};
Markup.prototype.slice = function (start, end) {
  if (typeof start !== 'number') start = 0;
  if (typeof end !== 'number') end = Infinity;

  var i = 0;
  var markup = new Markup(this.style);
  this.contents.some(function (item) {
    var nextI = i + Markup.getTaglessLength(item);
    if (start < nextI && end >= i) {
      markup.push(item.slice(Math.max(0, start - i), Math.max(0, end - i)));
    }
    if (nextI >= end) return true;
    i = nextI;
  });
  return markup;
};
Markup.prototype.push = function () {
  var self = this;
  var contents = self.contents;

  // unoptimized version of the following:
  //contents.push.apply(contents, arguments);

  var lastItem = _.last(contents);
  [].forEach.call(arguments, function (item) {
    if (!item) return;
    if (item instanceof Markup) {
      if (!item.style || item.style === self.style) {
        self.push.apply(self, item.contents);
        lastItem = _.last(contents);
        return;
      }
      if (lastItem instanceof Markup && item.style === lastItem.style) {
        return lastItem.push.apply(lastItem, item.contents);
      }
    }
    if (typeof item === 'string' && typeof lastItem === 'string') {
      return contents[contents.length - 1] += item;
    }
    contents.push(item);
    lastItem = item;
  });

  return self.clean();
};
Markup.prototype.toString = function () {
  return this.style + this.contents.map(function (item) {
    return typeof item === 'string' ? blessed.escape(item) : item;
  }).join('') + Markup._closeTags(this.style);
};
Object.defineProperty(Markup.prototype, 'length', {get: function () {
  return this.toString().length;
}});

function markup (text, style, start, end) {
  return Markup.parse(text).tag(style, start, end);
}
markup.parse = Markup.parse;
markup.Markup = Markup;

module.exports = markup;
