function showResult(data) {
  $('#tickerView').html(data);
  console.log(data);
}

function wscheck() {
  var ws = false;
  if ("WebSocket" in window) {
      ws = true;
  }
  return ws;
}

function connect(){
  try{
	  var socket;
	  var host = "ws://foxhall.de:4040";
    var socket = new WebSocket(host);
    
    socket.onopen = function() {
      console.log("INFO: socket opened!");
    }

    socket.onmessage = function(msg) {
      showResult(msg.data);
    }

    socket.onclose = function() {
      console.log("INFO: socket closed!")
    }			

  } catch(exception) { 		 
    console.log("ERROR: " + exception);
  }
}

function ticker() {
  $.when(wscheck(), connect())
    .done(function(result){
      console.log("WebSocket in window " + result);
      return true;
    })
    
    .fail(function(data){
      console.info("HANDLE ERRORS!!!!");
      return false;
     });
}