var mongoskin = require('mongoskin');
var json2xls = require('json2xls');var _ = require('lodash');
var fs = require('fs');
var q = require('q')
var db = mongoskin.db('mongodb://mda-preval:B3p3rf3cta_x2y@52.24.57.147/mda-preval', {
  //  var db = mongoskin.db('mongodb://localhost:27017/mda-staging-11jan', {
  native_parser: true,
  'auto_reconnect': true,
  'poolSize': 1000,
  socketOptions: {
    keepAlive: 500,
    connectTimeoutMS: 50000,
    socketTimeoutMS: 0
  }
});

function getApp() {
  var deferred = q.defer();
  db.collection("schema").find({isActive:true},{title:1, isActive:1, workflowreview:1}).toArray(function (error, apps) {
    deferred.resolve(apps)
  });
  return deferred.promise;
}

var result = [];
var ObjResult = {};

getApp().then(function(apps) {
  _.forEach(apps, function(app) {
    _.forEach(app.workflowreview, function(review) {
      ObjResult['App Title'] = app.title;
      ObjResult['Roles'] = (review.roles.join(", "));
      console.log(ObjResult);
    });
  });
});
