// Load in our dependencies
var parse = require('lucene-query-parser').parse;

/*
  Constructor for ElasticsearchCompletion
  @param {Array} fields - Collection of names of fields to complete with
  @param {String} fields.* - Name of field to complete with (e.g. `name`, `location`)
*/
function ElasticsearchCompletion(fields, options) {
  // Save fields for later
  this.fields = fields;

  // Pre-emptively create other field info
  this.allFields = fields.concat(ElasticsearchCompletion._magicFields);
  // `foo:`, `_exists_:`, `_missing_:`
  this.allFieldsWithColons = this.allFields.map(function addColon (field) {
    return field + ':';
  });
}
ElasticsearchCompletion.IMPLICIT = '<implicit>';

// Internal class method for finding the rightmost result from our parser results
ElasticsearchCompletion._getRightmostResult = function (results) {
  // Example parse results from `lucene-query-parser`
  // `foo` -> `{left: {field: <implicit>, term: foo}}`
  // `foo:bar` -> `{left: {field: foo, term: bar}}`
  // `foo:bar AND fuu:baz` -> `{left: {field: foo, term: bar}, operator: AND, right: {field: fuu, term: baz}}`
  // `foo:bar AND fuu:baz AND aaa:bbb` ->
  //    `{left: {field: foo, term: bar}, operator: AND, right:
  //        {left: {field: fuu, term: baz}, operator: AND, right: {field: aaa, term: bbb}}}`

  // If there is at least 1 operator
  if (results.right) {
    // If there are at least 2 operators, recurse on the rightmost operator's set
    if (results.right.left) {
      return ElasticsearchCompletion._getRightmostResult(results.right);
    // Otherwise, return the right evaluation
    } else {
      return results.right;
    }
  // Otherwise, return the only result
  } else {
    return results.left;
  }
};

// Define constants for special fields
ElasticsearchCompletion._magicFields = [
  '_exists_',
  '_missing_'
];

ElasticsearchCompletion.prototype = {
  // Method to result matches for a query string
  match: function (query) {
    // Define helper functions
    function addToQuery(str) {
      return query + str;
    }

    // If the string is empty or the rightmost character is whitespace, then provide default prompts
    //   e.g. "Search: `<empty>`" or "Search: `hello:world `"
    var results, rightmostResult;
    if (!query || query[query.length - 1] === ' ') {
      // `foo:bar` -> `foo:bar foo:`, `foo:bar _exists_:`
      return this.allFieldsWithColons.map(addToQuery);
    // Otherwise, if the final character is a colon
    } else if (query[query.length - 1] === ':') {
      // Attempt to parse the query without the colon
      // DEV: `lucene-query-parser` has issues with parsing on colons
      results = parse(query.slice(0, -1));

      // Find the rightmost result
      rightmostResult = ElasticsearchCompletion._getRightmostResult(results);

      // If the left hand side is an operator on a field name (e.g. `_exists_`, `_missing_`), exit with fields
      // DEV: `_exists__:` -> `_exists_` = {field: <implicit>, term: _exists_}}
      //   e.g. `_exists_:` -> `_exists_:foo`
      if (ElasticsearchCompletion._magicFields.indexOf(rightmostResult.term) !== -1) {
        return this.fields.map(addToQuery);
      // Otherwise, exit with nothing
      } else {
        return [];
      }
    // Otherwise (we have an incomplete field or incomplete term)
    } else {
      // Parse the query
      results = parse(query);

      // Find the rightmost result
      rightmostResult = ElasticsearchCompletion._getRightmostResult(results);

      // If our field is incomplete (i.e. no colon yet), then auto-suggest based on the field name
      //   `f` ({field: <implicit>, term: f}) -> `foo`
      var matchingFields;
      if (rightmostResult.field === ElasticsearchCompletion.IMPLICIT) {
        // Find fields that match (e.g. `f` against `[foo, bar]` -> `oo`), so we can concatenate properly
        matchingFields = this.matcher(rightmostResult.term, this.allFields);

        // Return the matching field pieces as part of the query
        return matchingFields.map(function addColonAndQuery (match) {
          return addToQuery(match + ':');
        });
      // Otherwise (there is a completed field)
      } else {
        // If the field is an operator on a field name (e.g. `_exists_`, `_missing_`),
        //   match the "term" against field names
        if (ElasticsearchCompletion._magicFields.indexOf(rightmostResult.field) !== -1) {
          matchingFields = this.matcher(rightmostResult.term, this.fields);
          return matchingFields.map(addToQuery);
        // Otherwise, return nothing
        } else {
          return [];
        }
      }
    }
  },
  matcher: function (targetStr, possibleMatches) {
    // For each of our possible matches
    var matches = [];
    var i = 0;
    var len = possibleMatches.length;
    for (; i < len; i++) {
      // If the possible match is shorter than the target itself, skip it
      var possibleMatch = possibleMatches[i];
      if (possibleMatch.length < targetStr.length) {
        continue;
      // Otherwise, if the possible match is the starting string of the target, save the remaining matching piece
      } else if (possibleMatch.slice(0, targetStr.length) === targetStr) {
        matches.push(possibleMatch.slice(targetStr.length));
      }
    }

    // Return our matching results
    return matches;
  }
};

// Expose our class
module.exports = ElasticsearchCompletion;
