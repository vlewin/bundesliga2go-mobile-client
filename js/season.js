$.seasonQueue = function(args) {
  var def = $.Deferred(function(dfd) {
    var worker;
    var failure=0;

    if (window.Worker) {
//    if (!true) {
      console.log("AJAX call through web workers")
    
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
          switch (event.data.key) {
            case "cmd":
              var cmd = JSON.parse(event.data.json).cmd;
              
              if(localStorage.getItem("cmd") === null) {
                console.log("CMD is not set, set CMD to " + cmd); 
                localStorage.setItem("cmd", cmd);
              } else {
                
                if(cmd != localStorage.getItem("cmd")) {
                  console.log("CMD is outdated, new CMD is " + cmd);
                  localStorage.setItem("cmd", cmd);
                } else {
                  console.log("CMD is up-to-date " + cmd);         
                }
              }

              break;

            case "matchday":
              console.log("GET MATCHDAY FROM SERVER");
              console.log(JSON.parse(event.data.json)[0].matchIsFinished) /// get string instead of object ???
              console.log(typeof(JSON.parse(event.data.json)[0].matchIsFinished))
              
              if(event.data.options == "0") { 
                var key = event.data.key + localStorage.getItem("cmd");
              } else {
                var key = event.data.key + event.data.options;
              }
              
              if(JSON.parse(event.data.json)[0].matchIsFinished) {
                console.log("match date is finished");
                localStorage.setItem(key, event.data.json);
              } else {
                console.log("match date is not finished");
                sessionStorage.setItem(key, event.data.json);  
              }

              break;

            default:
              console.log("ERROR: unknown key " + event.data.key)
              break;
          }
          dfd.resolve();
        }
      };

      worker.onerror = function(event) {
        console.log("FAILED")
        dfd.reject(event);
      };

      worker.postMessage(args.args); //Start the worker with supplied args

    } else {
      console.log("AJAX call in main thread")
      if(args.args.key == "matchday") { args.args.url = args.args.url + args.args.options; }
      var request = $.getJSON(args.args.url);

      request.success(function(data) {

        switch (args.args.key) {
          case "cmd":
            console.log(data.cmd)
            var cmd = data.cmd;
          
            if(localStorage.getItem("cmd") === null) {
              console.log("CMD is not set " + cmd);  
              console.log("Typeof " + typeof(cmd) + " value " + cmd)            
              localStorage.setItem("cmd", JSON.stringify(data.cmd));
            } else {
              if(cmd != localStorage.getItem("cmd")) {
                console.log("CMD is outdated, new CMD is " + cmd);
                console.log("Typeof " + typeof(cmd) + " value " + cmd)
                localStorage.setItem("cmd", JSON.stringify(data.cmd));
              }
            }

            break;

          case "matchday":   
            console.log(typeof(data))
              
//            if(args.args.options == "0") {
//              console.log("Matchday is undefined, get current matchday " + args.args.options);
//              var key = args.args.key + localStorage.getItem("cmd");
//              localStorage.setItem(key, JSON.stringify(data));
//            } else {
//              console.log("Matchday is defined, get matchday " + args.args.options);
//              var key = args.args.key + args.args.options;
//              localStorage.setItem(key, JSON.stringify(data));
//            }
            
            if(args.args.options == "0") { 
              var key = args.args.key + localStorage.getItem("cmd");
            } else {
              var key = args.args.key + args.args.options;
            }
            
            if(data[0].matchIsFinished) {
              console.log("match date is finished");
              localStorage.setItem(key, JSON.stringify(data));
            } else {
              console.log("match date is not finished");
              sessionStorage.setItem(key, JSON.stringify(data));  
            }

            break;

          default:
            console.log("ERROR: unknown key " + args.args.key)
            break;
          }

        dfd.resolve();
      });

      request.error(function(data) {
        console.log("AJAX error!")
        dfd.reject();
      });

    }
  });

  return def.promise();
};

function showMatchDay(matchday){
  console.log("show matchday " + matchday);
  if(matchday == 0) { matchday = JSON.parse(localStorage.getItem("cmd")); }
  
  var key = "matchday" + matchday;
  if(key in localStorage) {
    console.log("key in ls")
    var m = JSON.parse(localStorage.getItem(key));  
  } else if(key in sessionStorage) {
    console.log("key in ss")
    var m = JSON.parse(sessionStorage.getItem(key));    
  } else {
    console.log("key not found " + key)
    m = null;
  }
  
  var table = '';
  var cssclass;
  
  
  if(m != null) {
    for(i=0; i<8; i++) {
      i%2==0?  cssclass = 'even' : cssclass = 'odd';
      m[i].pointsTeam1 != '-1'? points1 = m[i].pointsTeam1 : points1 = '--';
      m[i].pointsTeam2 != '-1'? points2 = m[i].pointsTeam2 : points2 = '--';


      table += '<a href="' + m[i].matchID + '">'
      table += '<div class="container_12 ' + cssclass +' ">';
      table += '<div class="grid_1 tleft">&nbsp;</div>';
      table += '<div class="grid_4 tright"><span class="lteamname bold">' + m[i].shortTeam1 + '</span><span class="icon icon-' + m[i].shortTeam1 +'"></span></div>';
      table += '<div class="grid_2 tcenter score">' + points1 + ':' + points2 + '</div>';
      table += '<div class="grid_4 tleft"><span class="icon icon-' + m[i].shortTeam2 +'"></span><span class="rteamname bold">' + m[i].shortTeam2 + '</span></div>';
      table += '<div class="grid_1 tright">&nbsp;</div>';
      table += '</div>'
      table += '</a>';
      
      appendMatchPage(m[i]);
    }
  }

  $('#matchdayNumberId').html(matchday);
  $('#seasonView').html(table);
}

function appendMatchPage(data){
  console.log(data.matchID);
  
  var page = '';
  
  page += '<div id=' + data.matchID + ' data-role="page" data-theme="z">';
  page += '<div data-role="header" data-theme="z">' + data.matchID + '</div>';
  page += '</div>';
  
  $('#seasonPage').after(page);
}


//<div id="tickerPage" data-role="page" data-theme="z">
//  <div data-role="header" data-theme="z">
//    <h1>TICKER PAGE</h1>
//  </div>
//  <div data-role="content">
//    <fieldset id="seasonView" class="container_12" style="padding:4px 10px;"></fieldset>
//  </div>
//</div>


function season(matchday) {
  var key = "matchday" + matchday;
  var synced = false;
  
  if(key in localStorage || key in sessionStorage) { synced = true; }

  if(synced != true) {
    var sworker1 = $.seasonQueue({
      file: 'js/ajax-worker.js', 
      args: { url: "http://foxhall.de:8088/api/cmd", key: "cmd" }
    }); 
    
    var sworker2 = $.seasonQueue({
      file: 'js/ajax-worker.js', 
      args: { url: "http://foxhall.de:8088/api/matchday/", key: "matchday", options: matchday }
    });

    $.when(sworker1, sworker2)
      .done(function(result1){
        console.log("Both workers are done, handle data from workers!");
        showMatchDay(matchday);
        return true;
      })

      .fail(function(data){
        console.info("HANDLE ERRORS!!!!");
        return false;
      });

  } else {
    console.log("Already synced with server " + matchday);
    showMatchDay(matchday);
  }
}

function simulateSwipe(args) {
  var matchday = parseInt($('#matchdayNumberId').html());
  if(args == "right") {
    matchday = matchday+1;
    matchday > 34? matchday = 0 : matchday = matchday;
  } else {
    matchday = matchday-1;
  }
  season(matchday);
}

