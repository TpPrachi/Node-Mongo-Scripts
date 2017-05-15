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

var result = [];
var getType = {};
var data="";
function test() {
  var deferred = q.defer();
  db.collection('types').find({"title": 'Textbox'}, {}).toArray(function (error, types) {
    getType = types[0];
    deferred.resolve(getType)
  });
  return deferred.promise;
}
function tp(){
  var deferred = q.defer();
  db.collection('schema').find({}, { procedures: 1, title: 1 }).toArray(function (error, schema) {
    deferred.resolve(schema)
  });
  return deferred.promise;
};

test().then(function (getType) {


  var schema = db.collection("schema")
  .find({}, { procedures: 1, title: 1 });

  tp().then(function(schema){
    _.forEach(schema, function(s){

      _.forEach(s.procedures, function(p){

        _.forEach(p.questions, function(q){

          if (q.criteria) {
            _.forEach(q.criteria, function(c, i){
              var ObjResult = {};
              data = "";
              parser(c,q);
              ObjResult['Schema Title'] = s.title;
              ObjResult['Procedure Title'] = p.title;
              ObjResult['Question Title'] = q.title;
              ObjResult['Acceptance Criteria'] = data;
              result.push(ObjResult);
            });
          }
        });
      });

    });
    var xls = json2xls(result);
    fs.writeFileSync('mda-preval.xlsx', xls, 'binary');
    console.log("Created Successfully");
  });


});

function getDateFormat(formatId) {
  var allowItems = _.reduce(getType.formats, function (o, obj) {
    if (obj.title === 'Date') {
      o.push(obj.metadata[0].allowItems)
    }
    return o;
  }, [])[0];
  var dateFormt = _.reduce(allowItems, function (o, item) {
    if (item._id === formatId) {
      o.push(item);
    }
    return o;
  }, [])[0];
  if (dateFormt) {
    if (dateFormt['title'] === 'DD/MM/YYYY') {
      return 'dd/MM/yyyy';
    } else if (dateFormt['title'] === 'MM/DD/YYYY') {
      return 'MM/dd/yyyy';
    } else if (dateFormt['title'] === 'YYYY/MM/DD') {
      return 'yyyy/MM/dd';
    } else if (dateFormt['title'] === 'MM/DD/YY') {
      return 'MM/dd/yy';
    } else if (dateFormt['title'] === 'DD/MMM/YY') {
      return 'dd/MMM/yy';
    } else if (dateFormt['title'] === 'MONTH/DD/YYYY') {
      return 'MMMM/dd/yyyy';
    } else if (dateFormt['title'] === 'DD/MMM/YYYY') {
      return 'dd/MMM/yyyy';
    }
    return '';
  } else {
    return '';
  }
}

function getTimeFormat(formatId) {
  var allowItems = _.reduce(getType.formats, function (o, obj) {
    if (obj.title === 'Time') {
      o.push(obj.metadata[0].allowItems)
    }
    return o;
  }, [])[0];
  var timeFormt = _.reduce(allowItems, function (o, item) {
    if (item._id === formatId) {
      o.push(item);
    }
    return o;
  }, [])[0];

  var returnValue = [];
  if (timeFormt) {
    if (timeFormt['title'] === 'HH:MM') {
      returnValue[0] = false;
      returnValue[1] = false;
    } else if (timeFormt['title'] === 'HH:MM AM/PM') {
      returnValue[0] = true;
      returnValue[1] = false;
    } else if (timeFormt['title'] === 'HH:MM:SS') {
      returnValue[0] = false;
      returnValue[1] = true;
    } else if (timeFormt['title'] === 'HH:MM:SS AM/PM') {
      returnValue[0] = true;
      returnValue[1] = true;
    }
  }
  return returnValue;
}

function parser(criteria, question) {
  var obj = {};
  _.forEach(criteria, function (condition, index) {
    // Go for build advance acceptance criteria statement
    if (index == "condition") {
      if (_.isUndefined(condition.conditions) && condition.length > 0) {
        data = data + "Advance Acceptnace Criteria \n";
        // Loop through all conditions provided for Advance acceptance criteria
        _.forEach(condition, function (obj, i) {
          if (_.isUndefined(obj.conditions)) {
            if (i != 0) {
              data = data + " " + obj.bool;
            }
            data = data + " " + obj.leftOperand.title;
            data = data + " " + obj.comparison;
            data = data + " " + obj.rightOperand;
            data = data + "\n";
          } else {
            if (i == 0) {
              data = data + "(";
            }
            if (!_.isUndefined(obj.bool)) {
              data = data + "\n" + obj.bool + "\n" + "(";
            }
            data = "" + timepass(obj.conditions);
            data = data + ")";
          }

        });
      }
    }
    // Go for build Standard acceptance criteria statement
    if (index == "criteria") {
      data = data + "\nStandard Acceptance Criteria \n";
      data = data + " " + question.title;
      data = data + " " + getStringEquivalent(condition.condition);
      //Value as per format

      var getTimeFormatTest = getTimeFormat(question.type.format.metadata.datetime);
      var getDateFormatTest = (getDateFormat(question.type.format.metadata.datetime)).toUpperCase();

      if (question.type.format.title == 'Date') {
        if (condition.today == '1') {
          data = data + " " + 'Today';
        }else {
          if (condition.condition == '>= && <=' || condition.condition == '!(>= && <=)') {
            data = data + " " + moment(moment.utc(condition.minimumDate).toDate()).format(getDateFormatTest)  + ' to ' + moment(moment.utc(condition.maximumDate).toDate()).format(getDateFormatTest);
          }else {
            data = data + " " + moment(moment.utc(condition.date).toDate()).format(getDateFormatTest);
          }
        }
      }else if (question.type.format.title == 'Time') {
        if (condition.condition == '>= && <=' || condition.condition == '!(>= && <=)') {
          if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == true) {
            data = data + " " + moment(moment.utc(condition.minimum).toDate()).format('HH:mm:ss A') + ' to ' + moment(moment.utc(condition.maximum).toDate()).format('HH:mm:ss A');
          } else if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == false) {
            data = data + " " + moment(moment.utc(condition.minimum).toDate()).format('HH:mm A') + ' to ' + moment(moment.utc(condition.maximum).toDate()).format('HH:mm A');
          } else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == true) {
            data = data + " " + moment(moment.utc(condition.minimum).toDate()).format('HH:mm:ss') + ' to ' + moment(moment.utc(condition.maximum).toDate()).format('HH:mm:ss');
          } else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == false) {
            data = data + " " + moment(moment.utc(condition.minimum).toDate()).format('HH:mm') + ' to ' + moment(moment.utc(condition.maximum).toDate()).format('HH:mm');
          } else {
            data = data + " " + moment(moment.utc(condition.minimum).toDate()).format('HH:mm A') + ' to ' + moment(moment.utc(condition.maximum).toDate()).format('HH:mm A');
          }
        }else {
          if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == true) {
            data = data + " " + moment(moment.utc(condition.time).toDate()).format('HH:mm:ss A');
          } else if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == false) {
            data = data + " " + moment(moment.utc(condition.time).toDate()).format('HH:mm A');
          } else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == true) {
            data = data + " " + moment(moment.utc(condition.time).toDate()).format('HH:mm:ss');
          } else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == false) {
            data = data + " " + moment(moment.utc(condition.time).toDate()).format('HH:mm');
          } else {
            data = data + " " + moment(moment.utc(condition.time).toDate()).format('HH:mm A');
          }
        }
      }else {
        if (condition.condition == '>= && <=' || condition.condition == '!(>= && <=)') {
          data = data + " " + condition.minimum + ' to ' + condition.maximum;
        }else {
          data = data + " " + condition.value;
        }
      }
      //Value as per format
    }
  });
}

function timepass(criteria) {
  _.forEach(criteria, function (condition, i) {
    if (_.isUndefined(condition.conditions)) {
      if (i != 0) {
        data = data + " " + condition.bool;
      }
      data = data + " " + condition.leftOperand.title;
      data = data + " " + condition.comparison;
      data = data + " " + condition.rightOperand;

    } else {
      if (i == 0) {
        data = data + "(";
      }
      if (!_.isUndefined(condition.bool)) {
        data = data + "\n" + condition.bool + "\n" + " (";
      }
      data = "" + timepass(condition.conditions);
      data = data + ")";
    }
  });
  return data;
}

function getStringEquivalent(value){
  switch (value) {
    case '>':
    return 'Greater than'
    case '<':
    return 'Less than'
    case '>=':
    return 'Greater than or equal to'
    case '<=':
    return 'Less than or equal to'
    case '&&':
    return 'AND'
    case '||':
    return 'OR'
    case '=':
    return 'Equal to'
    case '!=':
    return 'Not equal to'
    case '>= && <=':
    return 'Between'
    case '!(>= && <=)':
    return 'Not between'
    case "^[a-z]+[a-z0-9._]+@[a-z]+\\.[a-z.]{2,5}$":
    return 'Email'
    case "^([0-9]{10})$":
    return 'Contact Number'
    case "^http(s)?:\\/\\/(www\\.)?[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$":
    return 'URL'
    case "^[0-9]{5}(-[0-9]{4})?$":
    return 'Zip Code'
    case "^[a-z]+[a-z0-9._]+@[a-z]+\\.[a-z.]{2,5}$":
    default:
    return value;
  }
}
