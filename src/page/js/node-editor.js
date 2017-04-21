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

    this.offsetLeft = parent[0].offsetLeft;
    this.offsetTop = parent[0].offsetTop;

    this.state = state_default;

    // Add itself to editor
    this.editor.nodes.push(this);
  }

  Node.prototype.setPosition = function(xPos, yPos) {
    var nodeWidth = parseInt(this.editor.styles['.node'].width, 10);
    var nodeHeight = parseInt(this.editor.styles['.node'].height, 10);
    var offsetLeft = this.offsetLeft - (nodeWidth * 0.5);
    var offsetTop = this.offsetTop - (nodeHeight * 0.5);
    this.element.style.left = (xPos + offsetLeft) + "px";
    this.element.style.top = (yPos + offsetTop) + "px";
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
    // this.$element.on('mousemove', $.proxy(this.mouseMovedHandler, this));
  }

  Editor.prototype.mouseMovedHandler = function(event) {
    console.log("mouse moved...")
  }

  Editor.prototype.mouseDownHandler = function(event) {
    var nodeID = event.target.getAttribute("node-id");
    if(nodeID) {
      var node = this.findNode(nodeID);
      if(node) {
        this.curDrag = node;
        node.setState(state_drag);
      }
    }
  }

  Editor.prototype.mouseUpHandler = function(event) {
    if(this.curDrag) {
      this.curDrag.setState(state_default);
      this.curDrag = undefined;
    }

    this.clickHandler(event);
  }

  Editor.prototype.clickHandler = function(event) {
    if(event.target.className == "nodes-background") {
      this.handleBackgroundClicked(event.offsetX, event.offsetY);
      // this.handleBackgroundClicked(event.offsetX, event.offsetY);
    } else if(event.target.className == "node") {
      // this.handleNodeClicked(event);
    }
  }

  Editor.prototype.handleNodeClicked = function(event) {
    this.removeNode(event);
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