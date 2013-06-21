// Improve the default prompt with hostname, process type, and version
prompt = function() {
    var serverstatus = db.serverStatus();
    var host = serverstatus.host.split('.')[0];
    var process = serverstatus.process;
    var version = db.serverBuildInfo().version;
    var repl_set = db._adminCommand({"replSetGetStatus": 1}).ok !== 0;
    var rs_state = '';
    if(repl_set) {
        members = rs.status().members;
        for(var i = 0; i<members.length; i++){
            if(members[i].self === true){
                rs_state = '[' + members[i].stateStr + ']';
            }
        };
    }
    var state = isMongos() ? '[mongos]' : rs_state;
    return host + '(' + process + '-' + version + ')' + state + ' ' + db + '> ';
};

