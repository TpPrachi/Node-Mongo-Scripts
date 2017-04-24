(function(){

  var rest = require('restler');

  rest.post('http://localhost:3020/upload', {
    multipart: true,
    data: {
      'containsHeaders': true,
      'file': rest.file('/home/prachi/Prachi_Workspace/prachi-api/img/test.csv', null, 321567, null, 'text/csv')
    }
  }).on('complete', function(data) {
    console.log('Request for POST csv completed successfully...');
  });

})();
