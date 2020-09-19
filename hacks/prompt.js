// Improve the default prompt with role, state, version and dbname

run('df')
print('')

prompt = function() {
  // set version
  const version = db.version();
  const dbName = db.getName()
  // case mongos
  if (rs.status().info == 'mongos') {
    return rs.status().info + ':[' + version + '] > ';
  }

  // config or replica
  if (rs.status().set) {
    role = rs.status().set;
  } else {
    role = 'config';
    return role + ':[' + version + '] > ';
  }

  const stats = {
    0: 'STARTING UP 1',
    1: 'PRIMARY', 2: 'SECONDARY', 3: 'RECOVERING', 4: 'FATAL ERROR',
    5: 'STARTING UP 2', 6: 'UNKNOWN STATE', 7: 'ARBITER', 8: 'DOWN'
  }
  const stateStr = stats[rs.status().myState]

  return role + ':' + stateStr + ':[' + version + ']'+':' + dbName +'> ';
}
