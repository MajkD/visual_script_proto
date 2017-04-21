var state_default = 0;
var state_drag = 1;

;(function ($, window, document, undefined) {

  var pluginName = 'node_editor';

  var nodeCount = 0; //unique node identificator

  var Node = function (editor, parent) {
    this.id = nodeCount;
    nodeCount++;
    this.editor = editor;

    // Add to DOM
    parent.append("<div class='node'></div>");
    this.element = parent[0].lastChild;
    this.element.setAttribute("node-id", this.id);

    // this.offsetLeft = parent[0].offsetLeft;
    // this.offsetTop = parent[0].offsetTop;

    this.state = state_default;

    // Add itself to editor
    this.editor.nodes.push(this);
  }

  Node.prototype.setPosition = function(xPos, yPos) {
    var nodeWidth = parseInt(this.editor.styles['.node'].width, 10);
    var nodeHeight = parseInt(this.editor.styles['.node'].height, 10);
    this.element.style.left = (xPos - (nodeWidth * 0.5)) + "px";
    this.element.style.top = (yPos - (nodeHeight * 0.5)) + "px";
  }

  Node.prototype.updateDragPosition = function(xPos, yPos) {
    this.element.style.left = xPos - this.dragOffsetX + "px";
    this.element.style.top = yPos - this.dragOffsetY + "px";
  }

  Node.prototype.setDragOffset = function(xPos, yPos) {
    var left = parseInt(this.element.style.left, 10);
    var top = parseInt(this.element.style.top, 10);
    this.dragOffsetX = xPos - left;
    this.dragOffsetY = yPos - top;
  }

  Node.prototype.setState = function(state) {
    this.state = state;
    this.state == state_drag ? $(this.element).addClass('node-dragged') : $(this.element).removeClass('node-dragged');
  }

  var Editor = function (element, options) {
    this.$element = $(element);
    this.elementId = element.id;
    this.styleId = this.elementId + '-style';

    console.log("I'm alive with options: ", options);
    console.log("I'm alive with element: ", element);

    this.subscribeEvents();
    this.initStyles();

    this.$element.append("<div class='nodes-background'></div>");
    this.background = this.$element[0].lastChild;

    this.nodes = [];
  };

  Editor.prototype.setStylesheet = function(selector) {
    var _this = this;
    [].some.call(document.styleSheets, function (sheet) {
      return [].some.call(sheet.rules, function (rule) {
        if (selector === rule.selectorText) {
          return [].some.call(rule.style, function (style) {
            _this.styles[selector] = rule.style;
            return true;
          });
        }
        return false;
      });
    });
  }

  Editor.prototype.initStyles = function () {
    this.styles = {}
    this.setStylesheet('.nodes-background');
    this.setStylesheet('.node');
  }

  Editor.prototype.subscribeEvents = function() {
    this.$element.on('mousedown', $.proxy(this.mouseDownHandler, this));
    this.$element.on('mouseup', $.proxy(this.mouseUpHandler, this));

    // this.$element.on('click', $.proxy(this.clickHandler, this));
    this.$element.on('mousemove', $.proxy(this.mouseMovedHandler, this));
  }

  Editor.prototype.mouseMovedHandler = function(event) {
    if(this.curDrag) {
      this.curDrag.updateDragPosition(event.clientX, event.clientY)
    }
  }

  Editor.prototype.mouseDownHandler = function(event) {
    var nodeID = event.target.getAttribute("node-id");
    if(nodeID) {
      var node = this.findNode(nodeID);
      if(node) {
        this.setDraggingNode(node, event.clientX, event.clientY);
      }
    }
  }

  Editor.prototype.setDraggingNode = function (node, clientX, clientY) {
    this.curDrag = node;
    this.curDrag.setDragOffset(clientX, clientY);
    this.curDrag.setState(state_drag);
  }

  Editor.prototype.mouseUpHandler = function(event) {
    if(this.curDrag) {
      this.curDrag.setState(state_default);
      this.curDrag = undefined;
    }
    this.clickHandler(event);
  }

  Editor.prototype.clickHandler = function(event) {
    var target = event.target;
    if(target.className == "nodes-background") {
      this.handleBackgroundClicked(event.clientX, event.clientY);
    } else if(this.hasClass('node', target)) {
      this.handleNodeClicked(event);
    }
  }

  Editor.prototype.hasClass = function(className, element) {
    var classList = $(element).attr('class') ? $(element).attr('class').split(' ') : [];
    return classList.includes(className);
  }

  Editor.prototype.handleNodeClicked = function(event) {
    // this.removeNode(event);
  }

  Editor.prototype.handleBackgroundClicked = function(clientX, clientY) {
    this.createNode(clientX, clientY);
  }

  Editor.prototype.removeNode = function(event) {
    var nodeId = event.target.getAttribute("node-id");
    this.removeNodeWithId(nodeId);
    event.target.remove();
  }

  Editor.prototype.createNode = function(clientX, clientY) {
    var node = new Node(this, this.$element);
    node.setPosition(clientX, clientY);
  }

  Editor.prototype.findNode = function(id) {
    for(var index = 0; index < this.nodes.length; index++) {
      if(this.nodes[index].id == id) {
        return this.nodes[index];
      }
    }
  }

  Editor.prototype.removeNodeWithId = function (id) {
    for(var index = this.nodes.length - 1; index >= 0; index--) {
      if(this.nodes[index].id == id) {
        this.nodes.splice(index, 1);
      }
    }
  }

  var logError = function (message) {
    if (window.console) {
      window.console.error(message);
    }
  };

  // Prevent against multiple instantiations,
  // handle updates and method calls
  $.fn[pluginName] = function (options, args) {

    var result;

    this.each(function () {
      var _this = $.data(this, pluginName);
      if (typeof options === 'string') {
        if (!_this) {
          logError('Not initialized, can not call method : ' + options);
        }
        else if (!$.isFunction(_this[options]) || options.charAt(0) === '_') {
          logError('No such method : ' + options);
        }
        else {
          if (!(args instanceof Array)) {
            args = [ args ];
          }
          result = _this[options].apply(_this, args);
        }
      }
      else if (typeof options === 'boolean') {
        result = _this;
      }
      else {
        $.data(this, pluginName, new Editor(this, $.extend(true, {}, options)));
      }
    });

    return result || this;
  };

})($, window, document);