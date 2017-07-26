var mongoskin = require('mongoskin');
var json2xls = require('json2xls'); var _ = require('lodash');
var fs = require('fs');
var q = require('q')
var _ = require('lodash');
var moment = require('moment');
var db = mongoskin.db('mongodb://mda-preval:B3p3rf3cta_x2y@52.24.57.147/mda-preval', {
  native_parser: true,
  'auto_reconnect': true,
  'poolSize': 1000,
  socketOptions: {
    keepAlive: 500,
    connectTimeoutMS: 50000,
    socketTimeoutMS: 0
  }
});

db.collection("users").find({}, {'username':1,'firstname':1,'lastname':1,'roles':1,'displayroles':1}).toArray(function (error, users) {
  var userObj = {};
  _.forEach(users, function(user) {
    var roles="";
    if (user && user.roles) {
      user.roles.forEach(function(role){
        roles=roles+role.title+",";
      });
    }
    userObj['Username']=user.username;
    userObj['Roles']=roles;
    console.log(userObj);
  });
});
