/* 
 *
 * Mongo Hacker
 * MongoDB Shell Enhancements for Hackers 
 *
 * Tyler J. Brock - 2013
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */

if (_isWindows()) {
    print("\nSorry! MongoDB Shell Enhancements for Hackers isn't compatible with Windows.\n");
    quit();
}

var homeDir = function () {
    clearRawMongoProgramOutput();
    run("printenv", "HOME");
    return rawMongoProgramOutput().match(/\S+\| (.*)/)[1];
}();

function setIndexParanoia( value ) {
    if( value === undefined ) value = true;
    _indexParanoia = value;
}

load(homeDir + "/.mongo.rc/rendering.js");
load(homeDir + "/.mongo.rc/settings.js");

var loadPlugins = function(scanMsg, scanDir, fileTemplate, loggingMsg) {
    print(scanMsg);
    ls(scanDir).forEach(function (file){
        if (file.match(fileTemplate)) {
            print(loggingMsg(file));
            load(file);
        }
    });
};

var systemPluginsDir = homeDir + "/.mongo.rc/";
loadPlugins("Scanning directory '" + systemPluginsDir + "' for system plugins...",
    systemPluginsDir, /\/mongo\.[^/]+\.js$/, function (file) { return "Loading system plug-in '"  + file + "'...";});

loadPlugins("Scanning files '" + homeDir + "/.mongorc.*.js' for user defined plugins...",
    homeDir, /\/.mongorc\.[^/]+\.js$/, function (file) { return "Loading user defined plug-in '"  + file + "'...";});
