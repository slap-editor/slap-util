var _ = require('lodash');
var path = require('path');
var winston = require('winston');
var fs = require('fs');

var packageName = require('../package').name;

function logger (opts) {
  if (!opts) opts = {};
  logger.stream = opts.stream || opts.file
    ? fs.createWriteStream(opts.file, {flags: 'a'})
    : null; // no place to log, so throw away
  var winstonLogger = new winston.Logger({
    exitOnError: false,
    transports: !logger.stream ? [] : [
      new winston.transports.File({
        stream: logger.stream,
        level: opts.level || 'info',
        handleExceptions: true,
        json: false,
        prettyPrint: true,
        colorize: true
      })
    ]
  });

  var levels = winston.config.npm.levels;
  if (!(opts.level in levels) || levels[opts.level] > levels.debug) {
    console._error = console.error;
    console.error = function () {
      (logger.stream || _.noop).write([].join.call(arguments, ' ') + '\n');
    };
  } else {
    require('longjohn');
    require('bluebird').longStackTraces();
  }

  winstonLogger.extend(logger);
  logger._opts = opts;
}

logger();

module.exports = logger;
