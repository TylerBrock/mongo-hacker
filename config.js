mongo_hacker_config = {
    verbose_shell:  true,      // additional verbosity
    index_paranoia: true,      // querytime explain
    enhance_api:    true,      // additonal api extensions
    indent:         2,         // number of spaces for indent
    uuid_type:      'default', // 'java', 'c#', 'python' or 'default'
    banner_message: 'Shell Enhanced by MongoHacker Ver. ' //banner message to show on mongo shell load
    version:        '0.0.3',    // current mongo-hacker version
    show_banner:     true,      // show mongo-hacker version banner on startup

    // Shell Color Settings
    // [<color>, <bold>, <underline>]
    colors: {
        'number':     [ 'blue', false, false ],
        'null':       [ 'red', false, false ],
        'undefined':  [ 'magenta', false, false ],
        'objectid':   [ 'green', false, false ],
        'string':     [ 'green', false, false ],
        'function':   [ 'magenta', false, false ],
        'date':       [ 'blue', false, false ]
    }
}

if (mongo_hacker_config['show_banner']) {
    print(mongo_hacker_config['banner_message'] + mongo_hacker_config['version']);
}

