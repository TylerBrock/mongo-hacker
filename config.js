/*
 *
 * Mongo-Hacker
 * MongoDB Shell Enhancements for Hackers
 *
 * Tyler J. Brock - 2013 - 2019
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */

mongo_hacker_config = {
  verbose_shell:  true,             // additional verbosity
  index_paranoia: false,            // querytime explain
  enhance_api:    true,             // additonal api extensions
  indent:         2,                // number of spaces for indent
  sort_keys:      false,            // sort the keys in documents when displayed
  javascript_keys:false,            // output is formatted with JavaScript style keys
  uuid_type:      'default',        // 'java', 'c#', 'python' or 'default'
  banner_message: 'Mongo-Hacker ',  // banner message
  version:        '0.1.1',          // current mongo-hacker version
  show_banner:     true,            // show mongo-hacker version banner on startup
  use_color:       true,            // use color highlighting if possible
  force_color:     false,           // force color even if Mongo Hacker thinks it won't work
  windows_warning: true,            // show warning banner regarding color support for Windows
  count_deltas:    false,           // "count documents" shows deltas with previous counts
  column_separator:  '→',           // separator used when printing padded/aligned columns
  value_separator:   '/',           // separator used when merging padded/aligned values
  dbref: {
    extended_info: true,            // enable more informations on DBRef
    plain:         false,           // print DBRef as plain JSON object
    db_if_differs: false            // include $db only if is different than current one
  },

  // Shell Color Settings
  // Colors available: red, green, yellow, blue, magenta, cyan
  colors: {
    'key':       { color: 'gray' },
    'number':    { color: 'red' },
    'boolean':   { color: 'blue', bright: true },
    'null':      { color: 'red', bright: true },
    'undefined': { color: 'magenta', bright: true },
    'objectid':  { color: 'yellow', underline: true },
    'string':    { color: 'green' },
    'binData':   { color: 'green', bright: true },
    'function':  { color: 'magenta' },
    'date':      { color: 'blue' },
    'uuid':      { color: 'cyan' },
    'databaseNames':   { color: 'green', bright: true },
    'collectionNames': { color: 'blue',  bright: true }
  }
}

if (mongo_hacker_config['show_banner']) {
  print(mongo_hacker_config['banner_message'] + mongo_hacker_config['version']);
}
