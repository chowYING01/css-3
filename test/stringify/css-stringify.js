
/**
 * Module dependencies.
 */

var stringify = require('../..').stringify;
var parse = require('../..').parse;
var fs = require('fs');
var path = require('path');
var read = fs.readFileSync;
var readdir = fs.readdirSync;
var SourceMapConsumer = require('source-map').SourceMapConsumer;

describe('stringify(obj)', function(){
  readdir('test/stringify/cases').forEach(function(file){
    var compress = ~file.indexOf('.compressed');
    it('should stringify ' + path.basename(file), function(){
      var expect;
      if (compress) {
        expect = read(path.join('test', 'stringify', 'cases', file), 'utf8');
        file = file.replace('.compressed', '');
      }
      var css = read(path.join('test', 'stringify', 'cases', file), 'utf8');
      var ret = stringify(parse(css), { compress: compress });
      ret.trim().should.equal((expect || css).trim());
    });
  });
});

describe('stringify(obj, {sourcemap: true})', function(){
  var file = 'test/stringify/source-map-case.css';
  var src = read(file, 'utf8');
  var stylesheet = parse(src, { source: file, position: true });
  function loc(line, column) {
    return { line: line, column: column, source: file, name: null };
  }

  var locs = {
    tobiSelector: loc(1, 0),
    tobiNameName: loc(2, 2),
    tobiNameValue: loc(2, 2),
    mediaBlock: loc(11, 0),
    mediaOnly: loc(12, 2),
    comment: loc(17, 0),
  };

  it('should generate source maps alongside when using identity compiler', function(){
    var result = stringify(stylesheet, { sourcemap: true });
    result.should.have.property('code');
    result.should.have.property('map');
    var map = new SourceMapConsumer(result.map);
    map.originalPositionFor({ line: 1, column: 0 }).should.eql(locs.tobiSelector);
    map.originalPositionFor({ line: 2, column: 2 }).should.eql(locs.tobiNameName);
    map.originalPositionFor({ line: 2, column: 8 }).should.eql(locs.tobiNameValue);
    map.originalPositionFor({ line: 11, column: 0 }).should.eql(locs.mediaBlock);
    map.originalPositionFor({ line: 12, column: 2 }).should.eql(locs.mediaOnly);
    map.originalPositionFor({ line: 17, column: 0 }).should.eql(locs.comment);
    map.sourceContentFor(file).should.eql(src);
  });

  it('should generate source maps alongside when using compress compiler', function(){
    var result = stringify(stylesheet, { compress: true, sourcemap: true });
    result.should.have.property('code');
    result.should.have.property('map');
    var map = new SourceMapConsumer(result.map);
    map.originalPositionFor({ line: 1, column: 0 }).should.eql(locs.tobiSelector);
    map.originalPositionFor({ line: 1, column: 5 }).should.eql(locs.tobiNameName);
    map.originalPositionFor({ line: 1, column: 10 }).should.eql(locs.tobiNameValue);
    map.originalPositionFor({ line: 1, column: 50 }).should.eql(locs.mediaBlock);
    map.originalPositionFor({ line: 1, column: 64 }).should.eql(locs.mediaOnly);
    map.sourceContentFor(file).should.eql(src);
  });

  it('should apply included source maps', function(){
    var file = 'test/stringify/source-map-apply.css';
    var src = read(file, 'utf8');
    var stylesheet = parse(src, { source: file, position: true });
    var result = stringify(stylesheet, { sourcemap: true });
    result.should.have.property('code');
    result.should.have.property('map');

    var map = new SourceMapConsumer(result.map);
    map.originalPositionFor({ line: 1, column: 0 }).should.eql({
      column: 0,
      line: 1,
      name: null,
      source: 'source-map-apply.scss'
    });

    map.originalPositionFor({ line: 2, column: 2 }).should.eql({
      column: 7,
      line: 1,
      name: null,
      source: 'source-map-apply.scss'
    });
  });
});