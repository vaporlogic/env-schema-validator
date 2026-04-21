'use strict';

/**
 * env-schema-validator v0.2.0
 * Required/optional validation only. Type parsing and choices added in v1.0.4.
 */

/**
 * Validate that required env vars are set.
 * @param {string[]} required  - Vars that must be non-empty
 * @param {string[]} [optional] - Vars that are documented but not required
 * @param {object}  [source]   - Override process.env for testing
 * @returns {{ values: object, errors: string[] }}
 */
function validate(required, optional, source) {
  source   = source   || process.env;
  optional = optional || [];
  var values = {};
  var errors = [];

  required.forEach(function (name) {
    var val = (source[name] || '').trim();
    if (!val) { errors.push(name + ': required but not set'); }
    else       { values[name] = val; }
  });

  optional.forEach(function (name) {
    var val = (source[name] || '').trim();
    if (val) values[name] = val;
  });

  return { values, errors };
}

/**
 * Like validate(), but throws on errors.
 */
function assertValid(required, optional, source) {
  var result = validate(required, optional, source);
  if (result.errors.length) {
    throw new Error('Environment validation failed:\n  ' + result.errors.join('\n  '));
  }
  return result.values;
}

module.exports = { validate, assertValid };
