mongo_hacker_config = {
    verbose_shell:  true,      // additional verbosity
    index_paranoia: true,      // querytime explain
    enhance_api:    true,      // additonal api extensions
    indent:         2,         // number of spaces for indent
    uuid_type:      'default', // 'java', 'c#', 'python' or 'default'
    banner_message: 'Mongo-Hacker ', //banner message
    version:        '0.0.3',    // current mongo-hacker version
    show_banner:     true,      // show mongo-hacker version banner on startup

    // Shell Color Settings
    // [<color>, <bold>, <underline>]
    // Colors available: red, green, yellow, blue, magenta, cyan
    colors: {
        'number':     [ 'blue', false, false ],
        'null':       [ 'red', false, false ],
        'undefined':  [ 'magenta', false, false ],
        'objectid':   [ 'green', false, false ],
        'string':     [ 'green', false, false ],
        'function':   [ 'magenta', false, false ],
        'date':       [ 'blue', false, false ],
        'uuid':       [ 'cyan', false, false]
    }
}

if (mongo_hacker_config['show_banner']) {
    print(mongo_hacker_config['banner_message'] + mongo_hacker_config['version']);
}

