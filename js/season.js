var sDebug = false;

$.seasonQueue = function(args) {
  var def = $.Deferred(function(dfd) {
    var worker;
    var failure=0;

    if (window.Worker) {
      if(sDebug) console.log("AJAX call through web workers")
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
                if(sDebug) console.log("CMD is not set, set CMD to " + cmd);
                localStorage.setItem("cmd", cmd);
              } else {

                if(cmd != localStorage.getItem("cmd")) {
                  if(sDebug) console.log("CMD is outdated, new CMD is " + cmd);
                  localStorage.setItem("cmd", cmd);
                } else {
                  if(sDebug) console.log("CMD is up-to-date " + cmd);
                }
              }

              break;

            case "matchday":
              if(sDebug) console.log("GET MATCHDAY FROM SERVER");
              if(sDebug) console.log(JSON.parse(event.data.json)[0].matchIsFinished) /// get string instead of object ???
              if(sDebug) console.log(typeof(JSON.parse(event.data.json)[0].matchIsFinished))

              if(event.data.options == "0") {
                var key = event.data.key + localStorage.getItem("cmd");
              } else {
                var key = event.data.key + event.data.options;
              }

              if(JSON.parse(event.data.json)[0].matchIsFinished) {
                if(sDebug) console.log("match date is finished");
                localStorage.setItem(key, event.data.json);
              } else {
                if(sDebug) console.log("match date is not finished");
                sessionStorage.setItem(key, event.data.json);
              }

              break;

            default:
              if(sDebug) console.log("ERROR: unknown key " + event.data.key)
              break;
          }
          dfd.resolve();
        }
      };

      worker.onerror = function(event) {
        if(sDebug) console.log("FAILED")
        dfd.reject(event);
      };

      worker.postMessage(args.args); //Start the worker with supplied args

    } else {
      if(sDebug) console.log("AJAX call in main thread")
      if(args.args.key == "matchday") { args.args.url = args.args.url + args.args.options; }
      var request = $.getJSON(args.args.url);

      request.success(function(data) {

        switch (args.args.key) {
          case "cmd":
            if(sDebug) console.log(data.cmd)
            var cmd = data.cmd;

            if(localStorage.getItem("cmd") === null) {
              if(sDebug) console.log("CMD is not set " + cmd);
              if(sDebug) console.log("Typeof " + typeof(cmd) + " value " + cmd)
              localStorage.setItem("cmd", JSON.stringify(data.cmd));
            } else {
              if(cmd != localStorage.getItem("cmd")) {
                if(sDebug) console.log("CMD is outdated, new CMD is " + cmd);
                if(sDebug) console.log("Typeof " + typeof(cmd) + " value " + cmd)
                localStorage.setItem("cmd", JSON.stringify(data.cmd));
              }
            }

            break;

          case "matchday":
            if(sDebug) console.log(typeof(data))

            if(args.args.options == "0") {
              var key = args.args.key + localStorage.getItem("cmd");
            } else {
              var key = args.args.key + args.args.options;
            }

            if(data[0].matchIsFinished) {
              if(sDebug) console.log("match date is finished");
              localStorage.setItem(key, JSON.stringify(data));
            } else {
              if(sDebug) console.log("match date is not finished");
              sessionStorage.setItem(key, JSON.stringify(data));
            }

            break;

          default:
            if(sDebug) console.log("ERROR: unknown key " + args.args.key)
            break;
          }

        dfd.resolve();
      });

      request.error(function(data) {
        if(sDebug) console.log("AJAX error!")
        dfd.reject();
      });

    }
  });

  return def.promise();
};

function showMatchDay(matchday){
  if(sDebug) console.log("show matchday " + matchday);

  if(matchday == 0) { matchday = JSON.parse(localStorage.getItem("cmd")); }

//  matchday = 10;
  var key = "matchday" + matchday;
  var storage;

  if(key in localStorage) {
    if(sDebug) console.log("key in ls")
    var m = JSON.parse(localStorage.getItem(key));
    storage = "local";

  } else if(key in sessionStorage) {
    if(sDebug) console.log("key in ss")
    var m = JSON.parse(sessionStorage.getItem(key));
    storage = "session";
  } else {
    if(sDebug) console.log("key not found " + key)
    m = null;
  }

  var html = '';
  var date, finished = false;
  var cssclass;

  if(m != null) {
    for(i=0; i<8; i++) {
      m[i].matchIsFinished? finished = true : date = m[i].matchDateTime;

//      i%2==0?  cssclass = 'even' : cssclass = 'odd';
      m[i].pointsTeam1 != '-1'? points1 = m[i].pointsTeam1 : points1 = '--';
      m[i].pointsTeam2 != '-1'? points2 = m[i].pointsTeam2 : points2 = '--';

      html += '<a href="#" data-key="' + key + '" data-position="' + i + '" data-storage="' + storage + '">';
      html += '<div class="container_12 match">';
      html += '<div class="grid_4"><span class="lteamname bold">' + m[i].shortTeam1 +
              '</span><span class="icon icon-' + m[i].shortTeam1 +'"></span></div>';

      if(finished) {
        html += '<div class="grid_4 tcenter score">' + points1 + ':' + points2 + '</div>';
      } else {
        html += '<div class="grid_4 tcenter date">' + date + '</div>';
      }

      html += '<div class="grid_4 tright"><span class="icon icon-' + m[i].shortTeam2 +'">' +
              '</span><span class="rteamname bold">' + m[i].shortTeam2 + '</span></div>';
      html += '</div>'
      html += '</a>';
    }
  }

  $('#matchdayNumberId').html(matchday);
  $('#seasonView').html(html);
}

$('#seasonView a').live('click', function(){
  var key = $(this).data('key');
  var position = $(this).data('position');
  var storage = $(this).data('storage');

  if(storage == "local") {
    var data = JSON.parse(localStorage.getItem(key))[position];
  } else {
    var data = JSON.parse(sessionStorage.getItem(key))[position];
  }

  data.pointsTeam1 != '-1'? points1 = data.pointsTeam1 : points1 = '--';
  data.pointsTeam2 != '-1'? points2 = data.pointsTeam2 : points2 = '--';

  if(sDebug) console.log(data)



  var html = '';
  html += '<fieldset class="container_12 matchinfo">';

  html += '<div class="grid_1 tleft">&nbsp;</div>';
  html += '<div class="grid_4 tright"><span class="lteamname bold">' + data.shortTeam1 + '</span><span class="icon icon-' + data.shortTeam1 +'"></span></div>';
  html += '<div class="grid_2 tcenter score">' + points1 + ':' + points2 + '</div>';
  html += '<div class="grid_4 tleft"><span class="icon icon-' + data.shortTeam2 +'"></span><span class="rteamname bold">' + data.shortTeam2 + '</span></div>';
  html += '<div class="grid_1 tright">&nbsp;</div>';

  html += '<div class="grid_12">&nbsp;</div>';

  for(i in data.goals) {
    if(data.goals[i].goalForTeamID == data.idTeam1) {
      html += '<div class="grid_5 row tright">' +
                '<span class="scorer">' + data.goals[i].goalGetterName + '</span>' +
              '</div>';
      html += '<div class="grid_2 row tcenter">' + data.goals[i].goalMatchMinute + '"</div>';
      html += '<div class="grid_5 row empty">-</div>';
    } else {
      html += '<div class="grid_5 row empty">-</div>';
      html += '<div class="grid_2 row tcenter">' + data.goals[i].goalMatchMinute + '"</div>';
      html += '<div class="grid_5 row tleft">' +
                '<span class="scorer"><span></span>' + data.goals[i].goalGetterName + '</span>' +
              '</div>';
    }
  }

  html += '</fieldset>';

  html += '<fieldset class="container_12 matchinfo">';
  html += '<div class="grid_12 tleft">Spieldatum: ' + data.matchDateTime + '</div>';
  html += '</fieldset>';

  $("#matchView").html(html);
  $.mobile.changePage($("#matchPage"));
});

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
        if(sDebug) console.log("Both workers are done, handle data from workers!");
        showMatchDay(matchday);
        return true;
      })

      .fail(function(data){
        if(sDebug) console.log("HANDLE ERRORS!!!!");
        return false;
      });

  } else {
    if(sDebug) console.log("Already synced with server " + matchday);
    showMatchDay(matchday);
  }
}

function simulateSwipe(args) {
  var matchday = parseInt($('#matchdayNumberId').html());
  if(args == "left") {
    matchday = matchday+1;
    matchday > 34? matchday = 0 : matchday = matchday;
  } else {
    matchday = matchday-1;
  }
  season(matchday);
}

