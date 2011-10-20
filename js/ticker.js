function getCurrentMatches(){
  console.log("get running matches and periodically look for updates");
  return true;
}

function getCommendMatches(){
  console.log("get running matches and periodically look for updates");
  return true;
}

function showResult(){
  return true;
}

$.when(getCurrentMatches(), getCommendMatches())
  .then(showResult)
  .fail(function(){
    console.error( 'one or more requests failed.' );
});

