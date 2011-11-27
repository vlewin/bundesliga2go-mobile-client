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
   
      var request = $.getJSON("http://foxhall.de:8088/api/matches/inprogress/");
   
      request.success(function(data) {
        if(tDebug) console.log("Request 200");  
        console.log(data)
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
  console.log(data);
//  var goal = JSON.parse(data);
  var matchID = 0;
  var teamID;
  var timeout = 60000;
  
  
  for(var i=0; i<data.length; i++) {
//    console.log("DATA");
//    console.log(parseInt($('#' + data[i].goalForTeamID).html()));
//    console.log(data[i].goalMatchID);
    matchID = data[i].goalMatchID;
    $('#'+matchID).css({'background-color':'red'});
    console.log(matchID)
    
    score = $('#'+data[i].goalForTeamID).html();
    teamID = data[i].goalForTeamID;
    if(score == "--") {
      $('#'+teamID).html('1');
      $('#'+matchID + ' div.tcenter').css({
        'font-size':'22px',
        'font-weight':'bold'
      });
    } else {
      $('#'+teamID).html(parseInt(score) + 1);
      $('#'+matchID + ' div.tcenter').css({
        'font-size':'22px',
        'font-weight':'bold'
      });
      
      //TODO: set timout to 60 seconds
      timer = setInterval(function() { 
        console.log("RESET");
        $('#'+matchID).css({'background-color':'#474747'});
        $('#'+matchID + ' div.tcenter').css({
          'font-size':'14px',
          'font-weight':'normal'
        });
       clearInterval(timer); //BUG: find out how to clear interval!!!
      }, 10000);
    }
  }

  $('#'+matchID).css({'background-color':'red'});
}

function connect(){
  console.log("Try to connect to WS")
  try{
	var socket;
    var host = "ws://foxhall.de:4040";
	  
	if ('MozWebSocket' in window) {
      var socket = new MozWebSocket(host);
    } else if('WebSocket' in window) {
      var socket = new WebSocket(host);
    }  else {
      $('#tickerView').html("<p class='tCenter'>Neither WebSocket nor MozWebSocket is supported!</p>").css('background', 'red');    
      console.log("Neither WebSocket nor MozWebSocket is supported!");
    }
    
    socket.onopen = function() {
      if(tDebug) console.log("INFO: socket opened!");
      $('#tickerPage h1').css('background', 'green');
      return true;
    }

    socket.onmessage = function(msg) {
              
      if(typeof(data) == "string") {
        console.log("STRING: " + typeof(msg.data));
      } else {
        console.log("OBJECT: " + typeof(msg.data));
        data = JSON.parse(msg.data);
        updateMatchData(data);
//        socket.close();
      }
    }

    socket.onclose = function() {
      if(tDebug) console.error("INFO: socket closed!")
      //$('#tickerPage h1').css('background', 'red');
      
      
      //TODO: RECONNECT IN 15 SECONDS
      //TODO: STORE AND INCREASE RECONNECTION ATTEMPTS in SESSION STORAGE
      //TODO: DO NOT TRY AGAIN IF RECONNECT FAILS SEVERAL TIMES {3}
      var numberOfAttempts, message;
      console.log(sessionStorage.getItem("numberOfAttempts"));
      if("numberOfAttempts" in sessionStorage) {
      	numberOfAttempts = parseInt(sessionStorage.getItem("numberOfAttempts"));
      	sessionStorage.setItem("numberOfAttempts", parseInt(numberOfAttempts+1));
      } else {
      	sessionStorage.setItem("numberOfAttempts", 1);
      }
      
      if(numberOfAttempts <= 3) {
      	console.log("try again!");
      	
	    var TIMEOUT = 10;
	    message = "<p class='tCenter'>FEHLER: Keine Verbindung zum WebSocket Server!</p>";
	    message += "<p class='tCenter'>Wiederverbindung in " + (TIMEOUT * numberOfAttempts) + " Sekunden Versuch: " + numberOfAttempts;
	    timer = setInterval(function() { 
	      clearInterval(timer);
	      //location.reload(true);
	      liveticker();
	    }, (TIMEOUT * 1000 * numberOfAttempts)); 
	    $('#tickerView').html(message).css('background', 'red');
	   } else {
	   	 message = "<p class='tCenter'>Leider sind alle Versuche die Verbindung zum LiveTicker Server herzustellen gescheitert!</p>"
	   	 sessionStorage.setItem("numberOfAttempts", 0);
	   	 $('#tickerView').html(message).css('background', 'red');
	   	 
	   }
    }

  } catch(exception) { 		 
    if(tDebug) console.log("ERROR: " + exception);
  }
}


function showMatchesInProgress(matches){
  var html = '';
  if(typeof(matches) == "string") {
    var matches = JSON.parse(matches);
  }
  console.log(matches)
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

  $('#tickerView').html(html);
}



function updateTickerView(matchID) {
   
}

function liveticker() {
  var inprogress = $.tickerQueue({
    file: 'js/ajax-worker.js',
    args: { url: "http://foxhall.de:8088/api/matches/inprogress/", key: "matchesInProgress" }
  });
  

  $.when(inprogress)  
    .done(function(matches){
      if(matches) {
        if(connect()) {
       	  showMatchesInProgress(matches);
        }
      } else {
        $('#tickerView').html("Zur Zeit laufen keine Spiele!").css('background', '#333');
      }
     return true;
   })

   .fail(function(data){
     console.info("HANDLE ERRORS!!!!");
     return false;
    });
}

