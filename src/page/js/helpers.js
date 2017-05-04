  function lineDistance(x, y, x0, y0){
    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
  };

  function drawLine(a, b, line) {
    var angle = Math.atan2(b.top - a.top, b.left - a.left) * 180 / Math.PI;
    var distance = lineDistance(a.left, a.top, b.left, b.top);
    $(line).css('transform', 'rotate(' + angle + 'deg)');
    $(line).css('width', distance + 'px');
    $(line).css('position', 'absolute');
    var leftOffset = (b.left < a.left) ? b.left : a.left;
    var topOffset = (b.top < a.top) ? b.top : a.top;
    $(line).offset({top: topOffset, left: leftOffset});
  }