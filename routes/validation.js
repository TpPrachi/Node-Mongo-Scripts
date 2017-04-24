var mongoskin = require('mongoskin');
var json2xls = require('json2xls');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs'); //mda-staging-test-23feb   --web_02Feb2017
//{ mongoskin.db('mongodb://127.0.0.1:27017/mda-staging-test-23feb', {
var db = mongoskin.db('mongodb://127.0.0.1:27017/mda-staging-11jan', {
// var db = mongoskin.db('mongodb://mda-preval:B3p3rf3cta_x2y@52.24.57.147:27017/mda-preval', {
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
setTimeout(function(){
  db.collection('types').find({"title": 'Textbox'}).toArray(function (error, types) {
    console.log("-------------");
    console.log(types);
    getType = types[0];
  });
}, 2000)


function getDateFormat(formatId) {
  var allowItems = _.reduce(getType.formats, function(o, obj){
    if(obj.title === 'Date'){
      o.push(obj.metadata[0].allowItems)
    }
    return o;
  }, [])[0];
  var dateFormt = _.reduce(allowItems, function(o, item){
    if(item._id === formatId){
      o.push(item);
    }
    return o;
  }, [])[0];
  if(dateFormt){
    if(dateFormt['title'] === 'DD/MM/YYYY'){
      return 'dd/MM/yyyy';
    } else if(dateFormt['title'] === 'MM/DD/YYYY'){
      return 'MM/dd/yyyy';
    } else if(dateFormt['title'] === 'YYYY/MM/DD'){
      return 'yyyy/MM/dd';
    } else if(dateFormt['title'] === 'MM/DD/YY'){
      return 'MM/dd/yy';
    } else if(dateFormt['title'] === 'DD/MMM/YY'){
      return 'dd/MMM/yy';
    } else if(dateFormt['title'] === 'MONTH/DD/YYYY'){
      return 'MMMM/dd/yyyy';
    } else if(dateFormt['title'] === 'DD/MMM/YYYY'){
      return 'dd/MMM/yyyy';
    }
    return '';
  } else {
    return '';
  }
}

function getTimeFormat(formatId) {
  var allowItems = _.reduce(getType.formats, function(o, obj){
    if(obj.title === 'Time'){
      o.push(obj.metadata[0].allowItems)
    }
    return o;
  }, [])[0];
  var timeFormt = _.reduce(allowItems, function(o, item){
    if(item._id === formatId){
      o.push(item);
    }
    return o;
  }, [])[0];

  var returnValue = [];
  if(timeFormt){
    if(timeFormt['title'] === 'HH:MM'){
      returnValue[0] = false;
      returnValue[1] = false;
    } else if(timeFormt['title'] === 'HH:MM AM/PM'){
      returnValue[0] = true;
      returnValue[1] = false;
    } else if(timeFormt['title'] === 'HH:MM:SS'){
      returnValue[0] = false;
      returnValue[1] = true;
    } else if(timeFormt['title'] === 'HH:MM:SS AM/PM'){
      returnValue[0] = true;
      returnValue[1] = true;
    }
  }
  return returnValue;
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

function flateData() {
  db.bind('procedures');

  db.collection('procedures').find({}).toArray(function (err, items) {
    items.forEach(function (data, id) {
      //print(data);
      if (data.questions.length > 0) {
        data.questions.forEach(function (ques, id) {

          var ObjResult = {};
          var datetime = ques.type.format.metadata.datetime;
          ObjResult['Procedure Name'] = data.title;
          ObjResult['Question Name'] = ques.title;

          ObjResult['Condition'] = "";
          ObjResult['Value/Length'] = "";
          ObjResult['Minimum'] = "";
          ObjResult['Maximum'] = "";
          ObjResult['Validation Message For Condition'] = "";

          ObjResult['Validation Set'] = "";
          ObjResult['Minimum Number of Checkbox to be Checked'] = "";
          ObjResult['Maximum Number of Checkbox to be Checked'] = "";
          ObjResult['Validation Message For Set'] = "";

          ObjResult['Regular Expression'] = "";
          ObjResult['Validation Message For Regular Expression'] = "";
          if (ques.hasOwnProperty('type')) {
            //ObjResult['QuestionType'] = ques['type']['title'];
            //ObjResult['QuestionFormat']=ques['type']['format']['title'];
          }
          if (ques.hasOwnProperty('validation')) {

            //for Existing set
            //Get Validation Message while Question have selected validation set
            if (ques.validation.hasOwnProperty('validationSet')) {
              if (ques.validation.validationSet.hasOwnProperty('existingSet')) {
                if (ques['type']['title'] == "Dropdown") {
                  ObjResult['Validation Set'] = ques.validation.validationSet.existingSet.title;
                }else if (ques['type']['title'] == "Checkbox") {

                  ObjResult['Validation Set'] = ques.validation.validationSet.existingSet.title;

                  if (ques.validation.validationSet.minimum) {
                    ObjResult['Minimum Number of Checkbox to be Checked'] = ques.validation.validationSet.minimum;
                  }else {
                    ObjResult['Minimum Number of Checkbox to be Checked'] = "";
                  }

                  if (ques.validation.validationSet.maximum) {
                    ObjResult['Maximum Number of Checkbox to be Checked'] = ques.validation.validationSet.maximum;
                  }else {
                    ObjResult['Maximum Number of Checkbox to be Checked'] = "";
                  }

                  if (ques.validation.validationSet.validationMessage) {
                    ObjResult['Validation Message For Set'] = ques.validation.validationSet.validationMessage;
                  }else {
                    ObjResult['Validation Message For Set'] = "";
                  }
                }else {
                  ObjResult['Validation Set'] = ques.validation.validationSet.existingSet.title;
                  ObjResult['Validation Message For Set'] = ques.validation.validationSet.validationMessage;
                }
              }else {
                ObjResult['Validation Set'] = null;
                ObjResult['Validation Message For Set'] = null;
              }
            }

            if (ques.validation.hasOwnProperty('condition')) {
              if (ques.validation.condition.hasOwnProperty('conditionTitle')) {

                ObjResult['Condition'] = getStringEquivalent(ques.validation.condition.conditionTitle);

                if(ques.type && ques.type.title == "Textbox" && ques.type.format.title == "Time"){

                  var getTimeFormatTest = getTimeFormat(datetime);

                  if (ques.validation.condition.currenttime == '1') {
                    ObjResult['Value/Length'] = 'Current Time';
                  }else {
                    if (ques.validation.condition.value) {
                      if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == true) {
                        ObjResult['Value/Length'] = moment(moment.utc(ques.validation.condition.value).toDate()).format('HH:mm:ss A');
                      }else if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == false) {
                        ObjResult['Value/Length'] = moment(moment.utc(ques.validation.condition.value).toDate()).format('HH:mm A');
                      }else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == true) {
                        ObjResult['Value/Length'] = moment(moment.utc(ques.validation.condition.value).toDate()).format('HH:mm:ss');
                      }else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == false) {
                        ObjResult['Value/Length'] = moment(moment.utc(ques.validation.condition.value).toDate()).format('HH:mm');
                      }else {
                        ObjResult['Value/Length'] = moment(moment.utc(ques.validation.condition.value).toDate()).format('HH:mm A');
                      }
                    }else {
                      ObjResult['Value/Length'] = "";
                    }

                    if (ques.validation.condition.minimum) {
                      if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == true) {
                        ObjResult['Minimum'] = moment(moment.utc(ques.validation.condition.minimum).toDate()).format('HH:mm:ss A');
                      }else if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == false) {
                        ObjResult['Minimum'] = moment(moment.utc(ques.validation.condition.minimum).toDate()).format('HH:mm A');
                      }else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == true) {
                        ObjResult['Minimum'] = moment(moment.utc(ques.validation.condition.minimum).toDate()).format('HH:mm:ss');
                      }else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == false) {
                        ObjResult['Minimum'] = moment(moment.utc(ques.validation.condition.minimum).toDate()).format('HH:mm');
                      }else {
                        ObjResult['Minimum'] = moment(moment.utc(ques.validation.condition.minimum).toDate()).format('HH:mm A');
                      }
                    }else {
                      ObjResult['Minimum'] = "";
                    }

                    if (ques.validation.condition.maximum) {
                      if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == true) {
                        ObjResult['Maximum'] = moment(moment.utc(ques.validation.condition.maximum).toDate()).format('HH:mm:ss A');
                      }else if (getTimeFormatTest[0] == true && getTimeFormatTest[1] == false) {
                        ObjResult['Maximum'] = moment(moment.utc(ques.validation.condition.maximum).toDate()).format('HH:mm A');
                      }else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == true) {
                        ObjResult['Maximum'] = moment(moment.utc(ques.validation.condition.maximum).toDate()).format('HH:mm:ss');
                      }else if (getTimeFormatTest[0] == false && getTimeFormatTest[1] == false) {
                        ObjResult['Maximum'] = moment(moment.utc(ques.validation.condition.maximum).toDate()).format('HH:mm');
                      }else {
                        ObjResult['Maximum'] = moment(moment.utc(ques.validation.condition.maximum).toDate()).format('HH:mm A');
                      }
                    }else {
                      ObjResult['Maximum'] = "";
                    }
                  }

                }else if (ques.type && ques.type.title == "Textbox" && ques.type.format.title == "Date") {
                  var getDateFormatTest = (getDateFormat(datetime)).toUpperCase();

                  if (ques.validation.condition.today == '1') {
                    ObjResult['Value/Length'] = 'Today';
                  }else {

                    if (ques.validation.condition.value) {
                      ObjResult['Value/Length'] = moment(moment.utc(ques.validation.condition.value).toDate()).format(getDateFormatTest);
                    }else {
                      ObjResult['Value/Length'] = "";
                    }
                    if (ques.validation.condition.maximumDate) {
                      ObjResult['Maximum'] = moment(moment.utc(ques.validation.condition.maximumDate).toDate()).format(getDateFormatTest);
                    }else {
                      ObjResult['Maximum'] = "";
                    }

                    if (ques.validation.condition.minimumDate) {
                      ObjResult['Minimum'] = moment(moment.utc(ques.validation.condition.minimumDate).toDate()).format(getDateFormatTest);
                    }else {
                      ObjResult['Minimum'] = "";
                    }

                  }

                }else {

                  if (ques.validation.condition.value) {
                    ObjResult['Value/Length'] = ques.validation.condition.value;
                  }else {
                    ObjResult['Value/Length'] = "";
                  }
                  if (ques.validation.condition.minimum) {
                    ObjResult['Minimum'] = ques.validation.condition.minimum;
                  }else {
                    ObjResult['Minimum'] = "";
                  }

                  if (ques.validation.condition.maximum) {
                    ObjResult['Maximum'] = ques.validation.condition.maximum;
                  }else {
                    ObjResult['Maximum'] = "";
                  }
                }

                if (ques.validation.condition.validationMessage) {
                  ObjResult['Validation Message For Condition'] = ques.validation.condition.validationMessage;
                }else {
                  ObjResult['Validation Message For Condition'] = "";
                }

              } else {
                ObjResult['Condition'] = null;
              }

            } else {
              ObjResult['Regular Expression'] = null;
              ObjResult['Validation Message For Regular Expression'] = null;
            }

            if (ques.validation.hasOwnProperty('regularExpression')) {
              ObjResult['Regular Expression'] = getStringEquivalent(ques.validation.regularExpression.regEx);
              ObjResult['Validation Message For Regular Expression'] = ques.validation.regularExpression.validationMessage;
            } else {
              ObjResult['Regular Expression'] = null;
              ObjResult['Validation Message For Regular Expression'] = null;
            }
          }

          result.push(ObjResult);
        });
        // console.log(items.questions);
      }
    });
    //console.log(result);

    var xls = json2xls(result);

    fs.writeFileSync('data.xlsx', xls, 'binary');
    //    downloadCSV();
  });


}

setTimeout(function(){
flateData();

}, 3000)


//console.log(result);


function getFormCount() {
  db.bind('procedures');
  db.collection('schema').find({}, {
    _id: true,
    title: true
  }).forEach(function (s) {
    db.bind('' + s._id);
    var arr = [];
    var tt = db.collection('' + s._id).find({}).toArray(function(err, result){
      if(result.length > 0){
        console.log(s.title + ' :: ' + result.length)
      }
    });
  })
}
