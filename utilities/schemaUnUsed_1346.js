var mongoskin = require('mongoskin');
var json2xls = require('json2xls');
var _ = require('lodash');
var fs = require('fs');
var q = require('q')
var db = mongoskin.db('mongodb://mda-preval:B3p3rf3cta_x2y@52.24.57.147:27017/mda-preval', {
  native_parser: true,
  'auto_reconnect': true,
  'poolSize': 1000,
  socketOptions: {
    keepAlive: 500,
    connectTimeoutMS: 50000,
    socketTimeoutMS: 0
  }
});


function test() {
  var deferred = q.defer();
  db.collection('schema').find({isActive:true},{ title:1, _id:1}).toArray(function (error, schema) {
    deferred.resolve(schema)
  });
  return deferred.promise;
}

function getMaster() {
  var deferred = q.defer();
  db.collection('masterqcsettings').find({isActive:true},{ title:1, _id:1,schema:1}).toArray(function (error, master) {
    deferred.resolve(master)
  });
  return deferred.promise;
}

test().then(function(schema) {
  var result = [];
  getMaster().then(function(master) {
    schema.forEach(function(s) {
      var check = true;
      master.forEach(function(m) {
        m.schema.forEach(function(masterSchema) {
          if (masterSchema._id == s._id) {
            //console.log("TRUE");
            check = false;
          }
        });
      });
      if (check) {
        //console.log("TRUE")
        var ObjResult = {};
        ObjResult['App Title'] = s.title;
        result.push(ObjResult);
      }
    });
    //console.log(result);
    var xls = json2xls(result);
    fs.writeFileSync('app.xlsx', xls, 'binary');
    console.log("Created Successfully");
  });

});
