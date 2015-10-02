# elasticsearch-completion [![Build status](https://travis-ci.org/underdogio/elasticsearch-completion.png?branch=master)](https://travis-ci.org/underdogio/elasticsearch-completion)

Low level query completion for Elasticsearch

This was built as part of an internal tool to autocomplete queries for Elasticsearch.

## Getting Started
Install the module with: `npm install elasticsearch-completion`

```js
// Create a completion class
var ElasticsearchCompletion = require('elasticsearch-completion');
var esCompletion = new ElasticsearchCompletion([
    'name',
    'location'
]);

// Supply some queries to complete against
esCompletion.match(''); // ['name:', 'location:', '_exists_:', '_missing_:']
esCompletion.match('na'); // ['name:']
esCompletion.match('name:'); // []
esCompletion.match('_exists_:'); // ['_exists_:name', '_exists_:location']
```

## Documentation
`elasticsearch-completion` exposes `ElasticsearchCompletion` via its `module.exports`.

### `new ElasticsearchCompletion(fields)`
Constructor for a new completion class

- fields `Array` - Names of fields to match against (e.g. `name`, `location`)
    - For example, `['foo', 'bar']` would supply matches agains the fields `foo` and `bar`

#### `esCompletion.match(query)`
Find matching completions for an Elasticsearch query

- query `String` - Query being used in Elasticsearch

**Returns:**

- matches `Array` - Collection of matching completions for the query
    - For example, `na` might complete to `['name:']` and `_ex` might complete to `['_exists_:']`

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via `npm run lint` and test via `npm test`.

## License
Copyright (c) 2015 Underdog.io

Licensed under the MIT license.
