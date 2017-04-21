var onWindowLoaded = function() {
  var v_scripter = document.getElementById('v_scripter')
  $(v_scripter).node_editor({
    foo: "bar",
    test: "this"
  });
}