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

// Improve the default prompt with hostname, process type, and version
prompt = function() {
    var serverstatus = db.serverStatus();
    var host = serverstatus.host.split('.')[0];
    var process = serverstatus.process;
    var version = db.serverBuildInfo().version;
    var repl_set = db.runCommand({"replSetGetStatus": 1}).ok !== 0;
    var rs_state = '';
    if(repl_set) {
        rs_state = db.isMaster().ismaster ? '[primary]' : '[secondary]';
    }
    var mongos = db.isMaster().msg == 'isdbgrid';
    var state = mongos ? '' : rs_state;
    return host + '(' + process + '-' + version + ')' + state + ' ' + db + '> ';
};

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

var systemPluginsDir = homeDir + "/.mongo.rc/";
print("Scanning directory '" + systemPluginsDir + "' for system plugins...");

ls(systemPluginsDir).forEach(function (file){
    if (file.match(/\/mongo\.[^/]+\.js/)) {
        print("Loading plug-in file '"  + file + "'...");
        load(file);
    }
});

print("Scanning files '" + homeDir + "/.mongorc.*.js' for user defined plugins...");
ls(homeDir).forEach(function (file){
    if (file.match(/\/.mongorc\.[^/]+\.js/)) {
        print("Loading user defined plug-in '"  + file + "'...");
        load(file);
    }
});
