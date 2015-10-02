// Load in dependencies
var assert = require('assert');
var parse = require('lucene-query-parser').parse;
var ElasticsearchCompletion = require('../');

// Start our tests
describe('An instance of ElasticsearchCompletion', function () {
  before(function createCompletion () {
    this.esCompletion = new ElasticsearchCompletion([
      'name',
      'location'
    ]);
  });

  describe('completing an empty string', function () {
    it('returns all possible field completions including special ones', function () {
      var matches = this.esCompletion.match('');
      assert.deepEqual(matches, [
        'name:',
        'location:',
        '_exists_:',
        '_missing_:'
      ]);
    });
  });

  describe('completing a query with a partial field', function () {
    describe('for a special field (e.g. `_exists_`, `_missing_`)', function () {
      it('returns the query with matching field completions', function () {
        var matches = this.esCompletion.match('_ex');
        assert.deepEqual(matches, [
          '_exists_:'
        ]);
      });
    });

    describe('for a normal field', function () {
      it('returns the query with matching field completions', function () {
        var matches = this.esCompletion.match('na');
        assert.deepEqual(matches, [
          'name:'
        ]);
      });
    });

    describe('for no matching fields', function () {
      it('returns no matches', function () {
        var matches = this.esCompletion.match('notafield');
        assert.deepEqual(matches, []);
      });
    });
  });

  describe('completing a query with a field and a colon', function () {
    describe('for a special field (e.g. `_exists_`, `_missing_`)', function () {
      it('returns the query with matching term completions', function () {
        var matches = this.esCompletion.match('_missing_:');
        assert.deepEqual(matches, [
          '_missing_:name',
          '_missing_:location'
        ]);
      });
    });

    describe('for a normal field', function () {
      // TODO: This should become matching hints
      it('returns no matches', function () {
        var matches = this.esCompletion.match('name:');
        assert.deepEqual(matches, []);
      });
    });

    describe('for no matching fields', function () {
      it('returns no matches', function () {
        var matches = this.esCompletion.match('doesnotexist:');
        assert.deepEqual(matches, []);
      });
    });
  });

  describe('completing a query with a field, colon, and partial term', function () {
    describe('for a special field (e.g. `_exists_`, `_missing_`)', function () {
      it('returns the query with matching fields as term completions', function () {
        var matches = this.esCompletion.match('_exists_:n');
        assert.deepEqual(matches, [
          '_exists_:name'
        ]);
      });
    });

    describe('for a normal field', function () {
      // TODO: This should become matching hints
      it('returns no matches', function () {
        var matches = this.esCompletion.match('name:to');
        assert.deepEqual(matches, []);
      });
    });

    describe('for no matching fields', function () {
      it('returns no matches', function () {
        var matches = this.esCompletion.match('unknown:wa');
        assert.deepEqual(matches, []);
      });
    });
  });

  describe('completing a query with trailing whitespace', function () {
    it('returns all possible field completions including special ones', function () {
      var matches = this.esCompletion.match('_exists_:name ');
      assert.deepEqual(matches, [
        '_exists_:name name:',
        '_exists_:name location:',
        '_exists_:name _exists_:',
        '_exists_:name _missing_:'
      ]);
    });
  });
});

// Inner unit tests
describe('A query with 1 explicit ANDs', function () {
  describe('when parsed via ElasticsearchCompletion.getRightmostResult', function () {
    it('returns the rightmost result', function () {
      var results = parse('foo:bar AND fuu:baz');
      assert.deepEqual(ElasticsearchCompletion._getRightmostResult(results), {
        field: 'fuu',
        term: 'baz'
      });
    });
  });
});

describe('A query with 2 explicit ANDs', function () {
  describe('when parsed via ElasticsearchCompletion.getRightmostResult', function () {
    it('returns the rightmost result', function () {
      var results = parse('foo:bar AND fuu:baz AND aaa:bbb');
      assert.deepEqual(ElasticsearchCompletion._getRightmostResult(results), {
        field: 'aaa',
        term: 'bbb'
      });
    });
  });
});

describe('A query with 1 implicit ANDs', function () {
  describe('when parsed via ElasticsearchCompletion.getRightmostResult', function () {
    it('returns the rightmost result', function () {
      var results = parse('foo:bar fuu:baz');
      assert.deepEqual(ElasticsearchCompletion._getRightmostResult(results), {
        field: 'fuu',
        term: 'baz'
      });
    });
  });
});

describe('A query with 2 implicit ANDs', function () {
  describe('when parsed via ElasticsearchCompletion.getRightmostResult', function () {
    it('returns the rightmost result', function () {
      var results = parse('foo:bar fuu:baz aaa:bbb');
      assert.deepEqual(ElasticsearchCompletion._getRightmostResult(results), {
        field: 'aaa',
        term: 'bbb'
      });
    });
  });
});

describe('A query with 2 fields with no terms', function () {
  describe('when parsed via ElasticsearchCompletion.getRightmostResult', function () {
    it('returns the rightmost result', function () {
      var results = parse('foo AND fuu');
      assert.deepEqual(ElasticsearchCompletion._getRightmostResult(results), {
        field: ElasticsearchCompletion.IMPLICIT,
        term: 'fuu'
      });
    });
  });
});

describe('A query with 3 fields with no terms', function () {
  describe('when parsed via ElasticsearchCompletion.getRightmostResult', function () {
    it('returns the rightmost result', function () {
      var results = parse('foo AND fuu AND aaa');
      assert.deepEqual(ElasticsearchCompletion._getRightmostResult(results), {
        field: ElasticsearchCompletion.IMPLICIT,
        term: 'aaa'
      });
    });
  });
});
