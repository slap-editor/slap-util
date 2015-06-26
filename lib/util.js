var _ = require('lodash');
var traverse = require('traverse');
var path = require('path');
var Promise = require('bluebird');

var boolStrings = {true: true, false: false};

module.exports = _.merge({
  text: require('./text'),
  markup: require('./markup'),
  logger: require('./logger'),

  mod: function (n, m) { return ((n % m) + m) % m; },

  typeOf: function (val) {
    return (val.__proto__.constructor.toString().match(/\w+\s+(\w+)/) || [])[1];
  },

  callBase: function (self, BaseClass, name, arg1, arg2, etc) {
    return (typeof self[name] === 'function'
      ? self[name]
      : BaseClass.prototype[name]).apply(self, [].slice.call(arguments, 3));
  },

  getterSetter: function (name, getter, setter) {
    getter = getter || _.identity;
    setter = setter || _.identity;
    return function () {
      if (arguments.length) {
        var newVal = setter.apply(this, arguments);
        this.data[name] = newVal;
        this.emit && this.emit(name, getter.call(this, newVal));
        return this;
      } else {
        return getter.call(this, this.data[name]);
      }
    };
  },

  parseOpts: function (opts) {
    return traverse(opts).map(function (opt) {
      if (opt && typeof opt === 'string') {
        if (opt in boolStrings) return boolStrings[opt];

        var number = Number(opt);
        if (number === number) return number; // if (!isNaN(number))
      }
      return opt;
    });
  },

  resolvePath: function (givenPath) {
    if (!givenPath) givenPath = '';
    if (givenPath[0] === '~') {
      givenPath = path.join(process.platform !== 'win32'
        ? process.env.HOME
        : process.env.USERPROFILE
      , givenPath.slice(1));
    }
    return path.resolve.apply(null, [].slice.call(arguments, 1).concat([givenPath]));
  }
}, require('util'));
