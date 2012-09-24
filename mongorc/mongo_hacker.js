/*
 *
 * Mongo Hacker
 * Loads the hacker modules
 *
 * Tyler J. Brock - 2012
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */
var cont = true;
if (_isWindows()) {
  print("\nSorry! MongoDB Shell Enhancements for Hackers isn't compatible with Windows.\n");
  cont = false;
}

var ver = db.version().split(".");
if ( ver[0] <= parseInt("2") && ver[1] < parseInt("2") ) {
  print("\nSorry! Mongo Shell version 2.2.x and above is required! Please upgrade.\n");
  cont = false;
}

if (cont) {
    ls($HOME + '.mongorc/').forEach(function(file) {
        if (file.substr(-3) == '.js' & file.indexOf('mongo_hacker.js') == -1) {
            load(file);
        }
    });
}