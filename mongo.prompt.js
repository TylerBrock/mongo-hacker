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