var mongoskin = require('mongoskin');
var json2xls = require('json2xls');
var _ = require('lodash');
var fs = require('fs');
var q = require('q')
var db = mongoskin.db('mongodb://mda-staging:B3p3rf3cta_x2y@52.24.57.147:27017/mda-staging', {
// var db = mongoskin.db('mongodb://localhost:27017/mda-staging-11jan', {
  native_parser: true,
  'auto_reconnect': true,
  'poolSize': 1000,
  socketOptions: {
    keepAlive: 500,
    connectTimeoutMS: 50000,
    socketTimeoutMS: 0
  }
});

var result = [];
var ObjResult = {};

function getApp() {
  var deferred = q.defer();
  db.collection("schema").find({}).toArray(function (error, apps) {
    deferred.resolve(apps)
  });
  return deferred.promise;
}

function getUsers() {
  var deferred = q.defer();
  db.collection("users").find({isActive: true},{isActive:1,roles:1,username:1}).toArray(function (error, users) {
    deferred.resolve(users)
  });
  return deferred.promise;
}


getApp().then(function(apps) {
  getUsers().then(function(users){
    _.forEach(apps, function(app) {
      _.forEach(app.workflowreview, function(review) {
        ObjResult['App Title'] = app.title;
        ObjResult['Roles'] = '';

        ObjResult['Roles'] = (review.roles.join(", "));
        ObjResult['Roles Count'] = review.roles.length;

        var getActualAllUsers =  [];
        _.forEach(users, function(u) {
          _.forEach(u.roles, function(role) {
            _.forEach(review.roles, function(rRole) {
              if (rRole == role.title) {
                getActualAllUsers.push(u.username);
              }
            })
          });
        });
        //console.log("getUsers :: " + getUsers.length);
        getActualAllUsers = _.uniqBy(getActualAllUsers);
        //console.log("After getUsers :: " + getUsers.length);
        ObjResult['Users Actual Count'] = getActualAllUsers.length;


        if (review.userSelectionType == "0") {
          ObjResult['User Seleaction Type'] = 'All Users';

          var getAllUsers =  [];
          _.forEach(users, function(u) {
            _.forEach(u.roles, function(role) {
              _.forEach(review.roles, function(rRole) {
                if (rRole == role.title) {
                  getAllUsers.push(u.username);
                }
              })
            });
          });

          getAllUsers = _.uniqBy(getAllUsers);
          ObjResult['Users Count'] = getAllUsers.length;
        }else if (review.userSelectionType == "1") {
          ObjResult['User Seleaction Type'] = 'Multiple Selection';
          var getUsers = [];
          _.forEach(review.user, function(user) {
            var displayUser = user.firstname + ' ' + user.lastname + ' (' + user.username + ')';
            getUsers.push(displayUser);
          });
          getUsers = _.uniqBy(getUsers);
          ObjResult['Users Count'] = getUsers.length;
        }else {
          var elseUser = [];
          _.forEach(review.user, function(user) {
            var displayUser = user.firstname + ' ' + user.lastname + ' (' + user.username + ')';
            elseUser.push(displayUser);
          });
          ObjResult['Users Count'] = elseUser.length;
        }

        if (ObjResult['Users Actual Count'] == ObjResult['Users Count']) {
          ObjResult['Status Comparison'] = 'Yes';
        }else {
          ObjResult['Status Comparison'] = 'No';
        }

        //https://json-csv.com/ -- Convert Json toCSV/Excel
        console.log(ObjResult);
      });
    });

    // var xls = json2xls(result);
    // fs.writeFileSync('appName.xlsx', xls, 'binary');
    // console.log("Created Successfully");
  });
});
