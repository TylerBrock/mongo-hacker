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

function maxLength(listOfNames) {
    return listOfNames.reduce(function(maxLength, name) {
        return (name.length > maxLength) ? name.length : maxLength ;
    }, 0);
};

function mergePaddedValues(leftHandValues, rightHandValues) {
    assert(leftHandValues.length == rightHandValues.length);

    maxLeftHandValueLength = maxLength(leftHandValues);
    maxRightHandValueLength = maxLength(rightHandValues);

    valueSeparator = mongo_hacker_config['value_separator'];

    var combinedValues = []

    for (i = 0; i < leftHandValues.length; i++) {
        combinedValues[i] = (
            leftHandValues[i].pad(maxLeftHandValueLength)
            + " " + valueSeparator + " "
            + rightHandValues[i].pad(maxRightHandValueLength)
        );
    }

    return combinedValues;
}

function printPaddedColumns(keys, values, color) {
    assert(keys.length == values.length);

    maxKeyLength   = maxLength(keys);
    maxValueLength = maxLength(values);

    columnSeparator = mongo_hacker_config['column_separator'];

    if (typeof color === 'undefined') {
        color = { color: 'green', bright: true }
    }

    for (i = 0; i < keys.length; i++) {
        print(
            colorize(keys[i].pad(maxKeyLength, true), color)
            + " " + columnSeparator + " "
            + values[i].pad(maxValueLength)
        );
    }
};
