// Begin PS Hack
// Copyright (c) 2016 Andrew Young
// SPDX-License-Identifier: MIT

function printTableRow(row, columnWidths) {
    var pad = function(x, i) {
        return x.pad(i).slice(-i).toString();
    };
    var line = "";
    for(c in columnWidths) {
        line = line + pad(row[c], columnWidths[c]) + " ";
    }
    print(line);
}

function printTable(headers, rows) {
    // printTable(headers: Array[String], rows: Array[Array[String]])

    // Find column widths
    
    var columnWidths = [];

    for(c in headers) {
        columnWidths[c] = headers[c].length;
    }

    for(r in rows) {
        var row = rows[r];
        for (c in headers) {
            row[c] = row[c].toString();
            columnWidths[c] = Math.max(columnWidths[c], row[c].length);
        }
    }

    // Print Table
    var hr = function(l) {
        return new Array(l + 1).join("-");
    };
    var hrs = [];
    for(c in columnWidths) {
        hrs.push(hr(columnWidths[c]));
    }
    printTableRow(headers, columnWidths);
    printTableRow(hrs, columnWidths);
    rows.forEach(function(row) { printTableRow(row, columnWidths); });
    
}

function getConnections() {
    return db.currentOp(true).inprog.filter(function(x) { return x.connectionId; } );
}

shellHelper.ps = function() {
    var headers = [
        "Connection",
        "ID",
        "Client",
        "S",
        "Active",
        "Time",
        "WaitLock",
        "Operation",
        "Plan",
        "Namespace"
    ];


    var rows = [];
    
    var connections = getConnections();

    connections.forEach(function(op) {
        var connectionId = op.connectionId;
        var opId = op.opid || "";
        var client = op.client || op.client_s || "";
        var isMongos = op.client_s ? "S" : "";
        var active = op.active ? "Active" : "Idle";
        var time = op.secs_running || "";
        var waitingForLock = op.waitingForLock ? "Yes" : "No";
        var opName = op.op || "";
        var plan = op.planSummary || "";
        var ns = op.ns || "";
        
        rows.push([
            connectionId,
            opId,
            client,
            isMongos,
            active,
            time,
            waitingForLock,
            opName,
            plan,
            ns
        ]);
    });

    printTable(headers, rows);
    
};

shellHelper.kill = function(opId) {
    return db.killOp(opId);
}

// End PS Hack
