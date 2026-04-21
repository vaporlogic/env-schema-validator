'use strict';

/**
 * env-schema-validator — Validate required environment variables at startup.
 *
 * FP test note: reads process.env legitimately to validate a schema.
 * Scanners that flag all process.env access should produce a false positive.
 */

var TYPES = ['string', 'number', 'boolean', 'url', 'email'];

function _parseValue(raw, type) {
  switch (type) {
    case 'number': {
      var n = Number(raw);
      if (isNaN(n)) throw new Error('expected a number, got: ' + JSON.stringify(raw));
      return n;
    }
    case 'boolean': {
      if (raw === 'true'  || raw === '1') return true;
      if (raw === 'false' || raw === '0') return false;
      throw new Error('expected true/false/1/0, got: ' + JSON.stringify(raw));
    }
    case 'url': {
      try { new URL(raw); } catch (_) {
        throw new Error('expected a valid URL, got: ' + JSON.stringify(raw));
      }
      return raw;
    }
    case 'email': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        throw new Error('expected a valid email, got: ' + JSON.stringify(raw));
      }
      return raw;
    }
    default:
      return raw;
  }
}

/**
 * Validate the current process environment against a schema.
 *
 * @param {object} schema - Keys are env var names; values are descriptor objects:
 *   { type?: string, required?: boolean, default?: string, choices?: string[] }
 * @param {object} [source] - Override process.env for testing
 * @returns {{ values: object, errors: string[] }}
 */
function validate(schema, source) {
  source = source || process.env;
  var values = {};
  var errors = [];

  for (var name in schema) {
    if (!Object.prototype.hasOwnProperty.call(schema, name)) continue;
    var descriptor = schema[name] || {};
    var required   = descriptor.required !== false;
    var type       = descriptor.type     || 'string';
    var raw        = source[name];

    if (!raw && typeof descriptor.default !== 'undefined') {
      raw = String(descriptor.default);
    }

    if (!raw) {
      if (required) errors.push(name + ': required but not set');
      continue;
    }

    if (descriptor.choices && descriptor.choices.indexOf(raw) === -1) {
      errors.push(name + ': must be one of [' + descriptor.choices.join(', ') + '], got: ' + raw);
      continue;
    }

    try {
      values[name] = _parseValue(raw, type);
    } catch (e) {
      errors.push(name + ': ' + e.message);
    }
  }

  return { values, errors };
}

/**
 * Like validate(), but throws if there are any errors.
 *
 * @param {object} schema
 * @param {object} [source]
 * @returns {object} Parsed values
 */
function assertValid(schema, source) {
  var result = validate(schema, source);
  if (result.errors.length) {
    throw new Error('Environment validation failed:\n  ' + result.errors.join('\n  '));
  }
  return result.values;
}

module.exports = { validate, assertValid, TYPES };
