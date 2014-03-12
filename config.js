mongo_hacker_config = {
  verbose_shell:  true,             // additional verbosity
  index_paranoia: false,            // querytime explain
  enhance_api:    true,             // additonal api extensions
  indent:         2,                // number of spaces for indent
  sort_keys:      true,             // sort the keys in documents when displayed
  uuid_type:      'default',        // 'java', 'c#', 'python' or 'default'
  banner_message: 'Mongo-Hacker ',  // banner message
  version:        '0.0.4',          // current mongo-hacker version
  show_banner:     true,            // show mongo-hacker version banner on startup

  // Shell Color Settings
  // Colors available: red, green, yellow, blue, magenta, cyan
  colors: {
    'key':       { color: 'yellow' },
    'number':    { color: 'red' },
    'boolean':   { color: 'blue', bright: true },
    'null':      { color: 'red', bright: true },
    'undefined': { color: 'magenta', bright: true },
    'objectid':  { color: 'green', underline: true },
    'string':    { color: 'green' },
    'binData':   { color: 'green', bright: true },
    'function':  { color: 'magenta' },
    'date':      { color: 'blue' },
    'uuid':      { color: 'cyan' }
  }
}

if (mongo_hacker_config['show_banner']) {
  print(mongo_hacker_config['banner_message'] + mongo_hacker_config['version']);
}

