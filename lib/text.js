exports._lineRegExp = /\r\n|\r|\n/;

exports.splitLines = function (text) {
  var lines = [];
  var match, line;
  while (match = exports._lineRegExp.exec(text)) {
    line = text.slice(0, match.index) + match[0];
    text = text.slice(line.length);
    lines.push(line);
  }
  lines.push(text);
  return lines;
};
exports.regExpIndexOf = function(str, regex, index) {
  index = index || 0;
  var offset = str.slice(index).search(regex);
  return (offset >= 0) ? (index + offset) : offset;
};
exports.regExpLastIndexOf = function (str, regex, index) {
  if (index === 0 || index) str = str.slice(0, Math.max(0, index));
  var i;
  var offset = -1;
  while ((i = str.search(regex)) !== -1) {
    offset += i + 1;
    str = str.slice(i + 1);
  }
  return offset;
};
