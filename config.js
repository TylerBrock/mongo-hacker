mongo_hacker_config = {
    verbose_shell:  true, // additional verbosity
    index_paranoia: true, // querytime explain
    enhance_api:    true, // additonal api extensions
    indent:         2,    // number of spaces for indent

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
