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
// Entity Title : Reagent Master
// _id : 585ad6087e588f04245a0d64
var getApp = [];
db.collection("schema").find({}, { entities: 1, title: 1, isActive:1 }).toArray(function (error, apps) {
  _.forEach(apps, function(app) {
    if (app && app.entities) {
      _.forEach(app.entities, function(entity) {
        if (entity._id == '585ad6087e588f04245a0d64') {
          // if (app.isActive) {
            getApp.push(app.title,app.isActive);
          // }
        }
      });
    }
  });
  console.log(getApp);
});
