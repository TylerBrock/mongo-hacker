/*
 *
 * Prompt improvements
 *
 * Tyler J. Brock - 2012
 *
 * http://tylerbrock.github.com/mongo-hacker
 *
 */


// Improve the default prompt with hostname, process type, and version
prompt = function() {
    var serverstatus = db.serverStatus();
    var host = serverstatus.host.split('.')[0];
    var process = serverstatus.process;
    var version = db.serverBuildInfo().version;
    return host + '(' + process + '-' + version + ') ' + db + '> ';
}
