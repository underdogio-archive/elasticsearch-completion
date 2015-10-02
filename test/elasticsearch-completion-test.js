// Load in dependencies
var assert = require('assert');
var elasticsearchCompletion = require('../');

// Start our tests
describe('elasticsearch-completion', function () {
  it('returns awesome', function () {
    assert.strictEqual(elasticsearchCompletion(), 'awesome');
  });
});
