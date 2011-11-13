var tDebug = true;

$.tickerQueue = function(args) {
  var def = $.Deferred(function(dfd) {
    var worker;
    var failure=0;

    if (window.Worker) {
      if(tDebug) console.log("AJAX call through web workers")

      var worker = new Worker("js/ajax-worker.js");

      worker.onmessage = function(event) {
        if(event.data.type == "error") {
          if(failure < 2) {
            worker.postMessage(args.args);
            failure++;
          } else {
            dfd.reject(event);
          }
        } else {
          if(tDebug) console.log("Event data " + event.data);
          switch (event.data.key) {
            case "maxGoalID":
              if(tDebug) console.log("MaxGoalID");
              break;

            case "matchday":
              if(tDebug) console.log("MaxGoalID");
              break;

            default:
              if(tDebug) console.log("ERROR: unknown key " + event.data.key)
              break;
          }
          dfd.resolve();
        }
      };

      worker.onerror = function(event) {
        if(tDebug) console.log("FAILED")
        dfd.reject(event);
      };

      worker.postMessage(args.args); 

    } else {
      if(tDebug) console.log("AJAX call in main thread")
   
      var request = $.getJSON(args.args.url);
   
      request.success(function(data) {
        if(tDebug) console.log("Request 200");  
        dfd.resolve();
      });

      request.error(function(data) {
        if(tDebug) console.log("AJAX error!")
        dfd.reject();
      });

    }
  });

  return def.promise();
};

function show(){
  var html = "TEXT"
  $('#tickerView').html(html);
}


function liveticker() {
   
  var tworker1 = $.seasonQueue({
    file: 'js/ajax-worker.js',
    args: { url: "http://foxhall.de:8088/api/maxgoalid", key: "maxGoalID" }
  });

  var tworker2 = $.seasonQueue({
    file: 'js/ajax-worker.js',
    args: { url: "http://foxhall.de:8088/api/matches/inprogress/", key: "matchesInProgress" }
  });

  $.when(tworker1, tworker2)
    .done(function(result1){
     if(tDebug) console.log("Both workers are done, handle data from workers!");
     show();
     return true;
   })

   .fail(function(data){
     console.info("HANDLE ERRORS!!!!");
     return false;
    });
}

// 1. Get matches in progress and save in sessionStorage
// 2. Get MaxGoalID from http://foxhall.de:8088/api/maxgoalid and save in localStorage
// 3. Start listening for incoming goals (WebSocket) --- Fallback AJAX!!!
//
// Fallback: If none, show upcoming matches


//function showResult(data) {
//  
//  var request = $.getJSON("http://foxhall.de:8088/getGoalsSinceGoalID");
//  
//  $('#tickerView').html(data);
//  if(tDebug) console.log(data);
//}
//
//function getMatchesInProgress() {
//  
//}
//
//function wscheck() {
//  var ws = false;
//  if ("WebSocket" in window) {
//      ws = true;
//  }
//  return ws;
//}
//
//function connect(){
//  try{
//	  var socket;
//	  var host = "ws://foxhall.de:4040";
//    var socket = new WebSocket(host);
//    
//    socket.onopen = function() {
//      if(tDebug) console.log("INFO: socket opened!");
//    }
//
//    socket.onmessage = function(msg) {
//      showResult(msg.data);
//    }
//
//    socket.onclose = function() {
//      if(tDebug) console.log("INFO: socket closed!")
//    }			
//
//  } catch(exception) { 		 
//    if(tDebug) console.log("ERROR: " + exception);
//  }
//}
//
//function ticker() {
//  $.when(wscheck(), connect())
//    .done(function(result){
//      if(tDebug) console.log("WebSocket in window " + result);
//      return true;
//    })
//    
//    .fail(function(data){
//      console.info("HANDLE ERRORS!!!!");
//      return false;
//     });
//}


