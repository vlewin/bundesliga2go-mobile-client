function ajaxCall(url, key, options) {
  if(options !== undefined) { url = url + options; }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
//  xhr.setRequestHeader('Content-Type', 'application/json');
//  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.send();

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200 || xhr.status == 304) {
        if(options !== undefined) {
          postMessage({ type: "success", json: xhr.responseText, key: key, options: options});
        } else {
          postMessage({ type: "success", json: xhr.responseText, key: key});
        }
      } else {
        postMessage({ type: "error", json: "error", key: key });
      }
    }
  }
}

self.onmessage = function(event) {
  switch (event.data.key) {
  case "matchday":
    ajaxCall(event.data.url, event.data.key, event.data.options);
    break;
  default:
    ajaxCall(event.data.url, event.data.key);
    break;
  }
}

