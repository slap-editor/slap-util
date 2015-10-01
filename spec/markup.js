#!/usr/bin/env node
/*global require, global*/

var test = require('tape');
var util = require('../.');
var Markup = util.markup.Markup;

test("util.markup", function (t) {
  var horray = "This text is untagged. {bold}This text is {underline}tagged,{/} but not this text. Horray {blue-fg}testing{/blue-fg}!";
  var whitespace = "{blue-fg}─╴{/blue-fg}{blue-fg}\\n{/blue-fg}";

  t.test("should return a Markup object", function (st) {
    st.plan(1);
    st.ok(util.markup(horray) instanceof Markup);
  });
  t.test(".parse", function (st) {
    st.test("should return a Markup object", function (sst) {
      sst.plan(1);
      sst.ok(util.markup.parse(horray) instanceof Markup);
    });
    st.test("should parse these strings correctly", function (sst) {
      var strings = [
        horray,
        whitespace
      ];
      strings.forEach(function (string) {
        var markedUp = util.markup.parse(string).toString();
        // The following is what we are doing essentially, but won't suffice
        // because it will replace "{/}" === Markup.CLOSE_ALL_TAGS with actual
        // closing tags
        //sst.equal(markedUp, string);

        var match, submatch, closeOpen;
        while (match = string.match(Markup.TAG_RE)) {
          var tag = match[0];

          sst.equal(string.slice(0, match.index), markedUp.slice(0, match.index));
          string = string.slice(match.index);
          markedUp = markedUp.slice(match.index);

          if (tag === Markup.CLOSE_ALL_TAGS) {
            while (submatch = markedUp.match(Markup.TAG_RE)) {
              if (!submatch[1] || submatch.index) break;
              markedUp = markedUp.slice(submatch[0].length);
            }
          } else {
            closeOpen = false;
            if (match[1]) {
              submatch = string.slice(tag.length).match(Markup.TAG_RE);
              if (submatch && !submatch.index && !submatch[1] && submatch[2] === match[2]) {
                closeOpen = true;
                string = string.slice(submatch[0].length);
              }
            }
            if (!closeOpen) {
              sst.equal(markedUp.indexOf(tag), 0);
              markedUp = markedUp.slice(tag.length);
            }
          }
          string = string.slice(tag.length);
        }
        sst.equal(markedUp, string);
      });
      sst.end();
    });
  });
  t.skip("Markup", function (st) {
    st.skip("#push", function (sst) {});
    st.skip("#slice", function (sst) {});
  });
});
