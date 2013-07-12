/*
 *
 * Mongo-Hacker
 * MongoDB Shell Enhancements for Hackers
 *
 * Tyler J. Brock - 2013
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */

if (_isWindows()) {
    print("\nSorry! MongoDB Shell Enhancements for Hackers isn't compatible with Windows.\n");
}

if (typeof db !== 'undefined') {
    var current_version = parseFloat(db.serverBuildInfo().version).toFixed(2)

    if (current_version < 2.2) {
        print("Sorry! MongoDB Shell Enhancements for Hackers is only compatible with Mongo 2.2+\n");
    }
}

