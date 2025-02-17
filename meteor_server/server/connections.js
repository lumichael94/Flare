var connections = Meteor.bindEnvironment(function () {
  ///TODO: Use the spark ui logs instead, potentially scan using go
  var sparkURL = "http://localhost:8080";
  HTTP.get(sparkURL, function(error, response){
    if(response){
      var $ = cheerio.load(response.content)
      var connections = []
      var nodeArray = $('table.table tr').get().map(function(row) {
        return $(row).find('td').get().map(function(cell) {
          return $(cell).text();
        });
      });
      $(nodeArray).each(function(i,e){
        connections.push({
          ID: e[0].replace(/(\s)/g,""),
          address: e[1],
          state: e[2],
          cores: e[3],
          memory: e[4].replace(/(\s+)/g," ")
        })
      })
      SparkDB.upsert({}, {$set: {connections: connections}})
    }
  })

  exec(confJSON.cassandra.directory+'/bin/nodetool ring',
  {async: true, silent: true}).stdout.on('data', Meteor.bindEnvironment( function(data) {
    var $ = cheerio.load('')
    var connections = []
    $(data.split(/\n+/)).each(function(i,e) {
      var colData = e.split(/\s+/);
      connections.push({
        address: colData[0],
        status: colData[2],
        state: colData[3],
        owns: colData[6],
        token: colData[7]
      })
    })
    CassandraDB.upsert({}, {$set: {connections: connections}})
  }))

  var ipfsPeers = exec('ipfs swarm peers', {async: true, silent: true});
  ipfsPeers.stdout.on('data', Meteor.bindEnvironment( function(data){
    $ = cheerio.load('')
    var connections = []
    $(data.split(/\n+/)).each(function(i,e) {
      connections.push({address: e})
    })
    IPFSDB.upsert({}, {$set: {connections: connections}})
  }))
})
Meteor.startup(function(){setInterval(connections, 5000)})
