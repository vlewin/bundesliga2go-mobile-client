var tDebug = true;

$.tickerQueue = function(args) {
  console.log("tickerQueue")
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
          if(tDebug) console.log(event.data);
          
		  switch (event.data.key) {
            case "maxGoalID":
              if(tDebug) console.log("MaxGoalID");
              break;

            case "matchesInProgress":
              if(tDebug) console.log("matchesInProgress");
              break;

            default:
              if(tDebug) console.log("ERROR: unknown key " + event.data.key)
              break;
          }
          dfd.resolve(event.data.json);
        }
      };

      worker.onerror = function(event) {
        if(tDebug) console.log("FAILED")
        dfd.reject(event);
      };

      worker.postMessage(args.args); 

    } else {
      if(tDebug) console.log("AJAX call in main thread")
   
      var request = $.getJSON("http://foxhall.de:8088/api/goalssince");
   
      request.success(function(data) {
        if(tDebug) console.log("Request 200");  
        dfd.resolve(data);
      });

      request.error(function(data) {
        if(tDebug) console.log("AJAX error!")
        dfd.reject(data);
      });

    }
  });

  return def.promise();
};

function updateMatchData(data){
  var goal = JSON.parse(data);
  var matchID = 0;
  var teamID;
  for(key in goal) {
  	matchID = key;
  	for(var i=0; i<goal[key].length; i++) {
  	  state = parseInt($('#' + goal[key][i].goalForTeamID).html());
  	  
  	  if(state == "--") {
  	  	$('#'+goal[key][i].goalForTeamID).html('1').css({'color':'#000', 'text-shadow':'0px 1px #ddd'});
  	  } else {
  	  	$('#'+goal[key][i].goalForTeamID).html(state+1).css({'color':'#000', 'text-shadow':'0px 1px #ddd'});
  	  }
  	}
  }
  
  $('#'+matchID).css({'background-color':'red'});
  
}

function showRunningMatches(matches){
  var html = '';
  var matches = JSON.parse(matches);
  var date = "sss"

    for(match in matches) {
   	  matches[match].pointsTeam1 != '-1'? points1 = matches[match].pointsTeam1 : points1 = '--';
   	  matches[match].pointsTeam2 != '-1'? points2 = matches[match].pointsTeam2 : points2 = '--';
   	

      html += '<div id="' + matches[match].matchID + '" class="container_12 match">';
      html += '<div class="grid_4">' +
      		    '<span class="lteamname bold">' + matches[match].shortTeam1 + '</span>' +
                '<span class="icon icon-' + matches[match].shortTeam1 +'"></span>' + 
               '</div>';

      html += '<div class="grid_4 tcenter score">' + 
      			'<span id="' + + matches[match].idTeam1 + '">' + points1 + '</span>:' + 
      			'<span id="' + matches[match].idTeam2 + '">' + points2 + '</span>' +
      		  '</div>';
     
      html += '<div class="grid_4 tright">' + 
      		    '<span class="icon icon-' + matches[match].shortTeam2 +'"></span>' +
              	'<span class="rteamname bold">' + matches[match].shortTeam2 + '</span>' +
              '</div>';
      html += '</div>'
    }

  $('#matchesTest').html(html);
}

function liveticker() {
   
  var tworker1 = $.tickerQueue({
    file: 'js/ajax-worker.js',
    args: { url: "http://foxhall.de:8088/api/maxgoalid", key: "maxGoalID" }
  });

  var tworker2 = $.tickerQueue({
    file: 'js/ajax-worker.js',
    args: { url: "  http://foxhall.de:8088/api/matchday/13", key: "matchesInProgress" }    
  });
  
  var tworker3 = $.tickerQueue({
    file: 'js/ajax-worker.js',
    args: { url: "http://foxhall.de:8088/api/goalssince/7912", key: "matchesInProgress" }
  });
  

  $.when(tworker1, tworker2, tworker3)
    .done(function(data1, matches, goals){
     showRunningMatches(matches);
     updateMatchData(goals);
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


