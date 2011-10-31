$('#resetFavorites').live('click', function() {
  alert(":) is not implemented")
});


$('#resetCache').live('click', function() {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

