var iDebug = false;

$.indexQueue = function(args) {
  var def = $.Deferred(function(dfd) {
    var worker;
    var failure=0;

    if (window.Worker) {
      var worker = new Worker("js/ajax-worker.js");

      worker.onmessage = function(event) {
        if(event.data.type == "error") {
          if(failure < 2) {
            worker.postMessage(args.args);
            failure++;
            if(iDebug) console.log("Worker returns: " + event.data.type + ' and failure is ' + failure);
          } else {
            if(iDebug) console.log("Do not try again");
            dfd.reject(event);
          }
        } else {
          localStorage.setItem(event.data.key, event.data.json);
          sessionStorage.setItem("tableSynced", "true");
          dfd.resolve(event.json);
        }
      };

      worker.onerror = function(event) {
        if(iDebug) console.log("FAILED");
        dfd.reject(event);
      };

      worker.postMessage(args.args); //Start the worker with supplied args

    } else {
      if(iDebug) console.log("ERROR: WEB WORKERS ARE NOT SUPPORTED!");
      
      var request = $.getJSON(args.args.url);
      request.success(function(data) {
        if(iDebug) console.log("AJAX call succeeded!");
        localStorage.setItem(args.args.key, JSON.stringify(data));
        sessionStorage.setItem("tableSynced", "true");
        dfd.resolve(data);
      })

      request.error(function(data) {
        if(iDebug) console.log("AJAX call failed " + args.args.url + args.args.key);
        dfd.reject(event);
      })
    }
  });

  return def.promise();
};

function showScoresTable(){
  if(iDebug) console.log("show table")
  var scores = JSON.parse(localStorage.getItem("scores"));
  var teams = JSON.parse(localStorage.getItem("teams"));

  var table = '';
  for(i=0; i<18; i++) {
    table += '<a href="#favoritesPage" data-rel="dialog" data-transition="pop" class="addFavorite">';

    if(i<3) {
      table += '<div class="grid_1 tcenter"><span class="number best">' + (i+1) + '</span></div>';
    } else {
      table += '<div class="grid_1 tcenter"><span class="number">' + (i+1) +'</span></div>';
    }
    table += '<div class="grid_3 tleft bold">' +
                '<span class="icon icon-' + teams[scores[i].id].teamShortcut +'"></span>' +
                '<span class="team">' + teams[scores[i].id].teamShortcut + '</span>' +
             '</div>';

    table += '<div class="grid_2 tcenter">' + scores[i].played + '</div>';
    table += '<div class="grid_2 tcenter">' + scores[i].won + '</div>';
    table += '<div class="grid_2 tcenter">' + scores[i].lost + '</div>';
    table += '<div class="grid_2 tcenter bold">' + scores[i].points + '</div>';
//    table += '<div class="grid_2 tcenter relative bold">' + scores[i].points + '<span class="fav">&nbsp;</span></div>';
    table += '</a>';

    var tmp = i+1;
    if(tmp%5==0) { table += '<div class="grid_12 undeline"></div>' };
  }



  $('#indexView').html(table);
}

function index() {
  if(iDebug) console.log(sessionStorage.getItem("tableSynced"));
  if(sessionStorage.getItem("tableSynced") != "true") {
    if(iDebug) console.log("Not synced yet, get data from server!");
    
    var iworker1 = $.indexQueue({file: 'js/ajax-worker.js', args: { url: "http://foxhall.de:8088/api/teams", key: "teams" }});
    var iworker2 = $.indexQueue({file: 'js/ajax-worker.js', args: { url: "http://foxhall.de:8088/api/table", key: "scores" }});

    $.when(iworker1, iworker2)
      .done(function(result1, result2){
        if(iDebug) console.log("Both workers are done, handle data from workers!");
        showScoresTable();
        return true;
      })

      .fail(function(data){
        if(iDebug) console.log("HANDLE ERRORS!!!!");
        return false;
      });

  } else {
    if(iDebug) console.log("Already synced with server!");
    showScoresTable();
  }
}

$('#addFavorite').click(function() {

});

