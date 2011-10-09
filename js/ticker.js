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
          console.log(event.data);
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
              localStorage.setItem("cmd", data.cmd);
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

function inprogress() {

}


function ticker() {
  var tworker1 = $.seasonQueue({file: 'js/ajax-worker.js', args: { url: "http://foxhall.de:8088/api/matches/inprogress", key: "inprogress" }});

  $.when(tworker1)
    .done(function(result1){
       console.log("Both workers are done, handle data from workers!");
       return true;
    })

    .fail(function(data){
      console.info("HANDLE ERRORS!!!!");
      return false;
    });
}



//function getCurrentMatches(){
//  console.log("get running matches and periodically look for updates");
//  return true;
//}

//function getCommendMatches(){
//  console.log("get running matches and periodically look for updates");
//  return true;
//}

//function showResult(){
//  return true;
//}

//function ticker() {
//  $.when(getCurrentMatches(), getCommendMatches())
//    .then(showResult)
//    .fail(function(){
//      console.error( 'one or more requests failed.' );
//  });
//}

