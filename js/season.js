$.seasonQueue = function(args) {
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
          } else {
            dfd.reject(event);
          }
        } else {
          switch (event.data.key) {
            case "cmd":
              if(localStorage.getItem("cmd") === null) {
                localStorage.setItem("cmd", JSON.parse(event.data.json).cmd);
              } else {
                if(JSON.parse(event.data.json).cmd != localStorage.getItem("cmd")) {
                  localStorage.setItem("cmd", JSON.parse(event.data.json).cmd);
                }
              }

              break;

            case "matchday":
              if(event.data.options == "0") {
                var key = event.data.key + localStorage.getItem("cmd");
                localStorage.setItem(key, event.data.json);
              } else {
                var key = event.data.key + event.data.options;
                localStorage.setItem(key, event.data.json);
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
      if(args.args.key == "matchday") { args.args.url = args.args.url + args.args.options; }
      var request = $.getJSON(args.args.url);

      request.success(function(data) {

        switch (args.args.key) {
          case "cmd":
            if(localStorage.getItem("cmd") === null) {
              localStorage.setItem("cmd", JSON.parse(data).cmd);
            } else {
              if(data.cmd != localStorage.getItem("cmd")) {
                localStorage.setItem("cmd", data.cmd);
              }
            }

            break;

          case "matchday":
            if(args.args.options == "0") {
              var key = args.args.key + localStorage.getItem("cmd");
              localStorage.setItem(key, JSON.stringify(data));
            } else {
              var key = args.args.key + args.args.options;
              localStorage.setItem(key, JSON.stringify(data));
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
  var m = JSON.parse(localStorage.getItem("matchday" + matchday));
  var table = '', cssclass;

  if(m !== null) {
    for(i=0; i<8; i++) {
      i%2==0?  cssclass = 'even' : cssclass = 'odd';
      m[i].pointsTeam1 != '-1'? points1 = m[i].pointsTeam1 : points1 = '--';
      m[i].pointsTeam2 != '-1'? points2 = m[i].pointsTeam2 : points2 = '--';

      table += '<div class="container_12 ' + cssclass +' ">';
      table += '<div class="grid_1 tleft">&nbsp;</div>';
      table += '<div class="grid_4 tright"><span class="lteamname bold">' + m[i].shortTeam1 + '</span><span class="icon icon-' + m[i].shortTeam1 +'"></span></div>';
      table += '<div class="grid_2 tcenter score">' + points1 + ':' + points2 + '</div>';
      table += '<div class="grid_4 tleft"><span class="icon icon-' + m[i].shortTeam2 +'"></span><span class="rteamname bold">' + m[i].shortTeam2 + '</span></div>';
      table += '<div class="grid_1 tright">&nbsp;</div>';
      table += '</div>'
    }
  }

  $('#matchdayNumberId').html(matchday);
  $('#seasonView').html(table);
}

function season(matchday) {
//  matchday = 13;

  if(localStorage.getItem("matchday" + matchday) === null) {
    matchday !== undefined && matchday !=0? matchday : matchday = localStorage.getItem("cmd");

    var sworker1 = $.seasonQueue({file: 'js/ajax-worker.js', args: { url: "http://foxhall.de:8088/api/cmd", key: "cmd" }}); //???? CURRENT MATCHDAY ???
    var sworker2 = $.seasonQueue({file: 'js/ajax-worker.js', args: { url: "http://foxhall.de:8088/api/matchday/", key: "matchday", options: matchday }}); //???? CURRENT MATCHDAY ???

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

