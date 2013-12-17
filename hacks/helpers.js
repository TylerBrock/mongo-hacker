function runMatch(cmd, args, regexp) {
    clearRawMongoProgramOutput();
    if (args) {
        run(cmd, args);
    } else {
        run(cmd);
    }
    var output = rawMongoProgramOutput();
    return output.match(regexp);
};

function getEnv(env_var) {
    var env_regex = new RegExp(' ' + env_var + '=(.*)');
    return runMatch('env', '', env_regex)[1];
};

function getVersion() {
    var regexp = /version: (\d).(\d).(\d)/;
    return runMatch('mongo', '--version', regexp).slice(1, 4);
};

function isMongos() {
    return db.isMaster().msg == 'isdbgrid';
};

function getSlowms(){
    if(!isMongos()){
        return db.getProfilingStatus().slowms;
    } else {
        return 100;
    }
};
