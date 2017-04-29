var state_default = 0;
var state_drag = 1;
var state_connecting = 2;

;(function ($, window, document, undefined) {

  var pluginName = 'node_editor';

  var CONNECTOR_IN = 0;
  var CONNECTOR_OUT = 1;

  var nodeCount = 0; //unique node identificator
  var connectorCount = 0; //unique connector identificator

  var newNodeId = function() {
    nodeCount++;
    return nodeCount;
  }

  var newConnectorId = function() {
    connectorCount++;
    return connectorCount;
  }

  var Connector = function (editor, parentNode, type) {
    this.parentNode = parentNode;
    $(parentNode.element).append(editor.template.connector);
    this.element = parentNode.element.lastChild;
    this.id = newConnectorId();
    this.element.setAttribute("connector-id", this.id);

    this.state = state_default;
    this.xPos = 0;
    this.yPos = 0;
    this.width = parseInt(editor.styles['.connector'].width, 10);
    this.height = parseInt(editor.styles['.connector'].height, 10);
    this.type = type;
    this.updatePosition(parentNode);

    editor.connectors[this.id] = this;
    //Connections
  }

  Connector.prototype.setState = function(state) {
    this.state = state;
    this.state == state_connecting ? $(this.element).addClass('connector-connecting') : $(this.element).removeClass('connector-connecting');
  }

  Connector.prototype.updatePosition = function(parentNode) {
    var left = parentNode.xPos + (parentNode.width * 0.5);
    var top = (this.type == CONNECTOR_OUT) ? parentNode.yPos + parentNode.height : 0;
    this.xPos = left - (this.width * 0.5);
    this.yPos = top - (this.height * 0.5);
    this.updateStyles();
  }

  Connector.prototype.updateStyles = function() {
    this.element.style.left = this.xPos + "px";
    this.element.style.top = this.yPos + "px";
  }

  var Node = function (editor, parent) {
    this.id = newNodeId();

    // Add to DOM
    parent.append(editor.template.node);
    this.element = parent[0].lastChild;
    this.element.setAttribute("node-id", this.id);

    this.xPos = 0;
    this.yPos = 0;
    this.width = parseInt(editor.styles['.node'].width, 10);
    this.height = parseInt(editor.styles['.node'].height, 10);

    this.state = state_default;

    this.addConnectors(editor);

    // Add itself to editor
    editor.nodes[this.id] = this;
  }

  Node.prototype.addConnectors = function(editor) {
    this.connectorIn = new Connector(editor, this, CONNECTOR_IN);
    this.connectorOut = new Connector(editor, this, CONNECTOR_OUT);
  }

  Node.prototype.setPosition = function(xPos, yPos) {
    this.xPos = xPos - (this.width * 0.5);
    this.yPos = yPos - (this.height * 0.5);
    this.updateStyles();
  }

  Node.prototype.updateDragPosition = function(xPos, yPos) {
    this.xPos = xPos - this.dragOffsetX;
    this.yPos = yPos - this.dragOffsetY;
    this.updateStyles();
  }

  Node.prototype.updateStyles = function() {
    this.element.style.left = this.xPos + "px";
    this.element.style.top = this.yPos + "px";
  }

  Node.prototype.setDragOffset = function(xPos, yPos) {
    this.dragOffsetX = xPos - this.xPos;
    this.dragOffsetY = yPos - this.yPos;
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

    this.$element.append(this.template.background);
    this.background = this.$element[0].lastChild;

    this.nodes = {};
    this.connectors = {};
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
    this.setStylesheet('.connector');
  }

  Editor.prototype.subscribeEvents = function() {
    this.$element.on('mousedown', $.proxy(this.mouseDownHandler, this));
    this.$element.on('mouseup', $.proxy(this.mouseUpHandler, this));

    // this.$element.on('click', $.proxy(this.clickHandler, this));
    this.$element.on('mousemove', $.proxy(this.mouseMovedHandler, this));
  }

  Editor.prototype.mouseMovedHandler = function(event) {
    if(this.curDraggedNode) {
      this.curDraggedNode.updateDragPosition(event.clientX, event.clientY)
    }

    if(this.curPressedConnector) {
      // var connector = this.$element.find($(".connector-temp"));
      // connector.attr()
    }
  }

  Editor.prototype.mouseDownHandler = function(event) {
    var nodeID = event.target.getAttribute("node-id");
    if(nodeID) {
      var node = this.nodes[nodeID];
      if(node) {
        this.startDraggingNode(node, event.clientX, event.clientY);
      }
    }
    var connectorID = event.target.getAttribute("connector-id");
    if(connectorID) {
      var connector = this.connectors[connectorID];
      if(connector) {
        this.startConnection(connector);
      }
    }
  }

  Editor.prototype.startDraggingNode = function (node, clientX, clientY) {
    this.curDraggedNode = node;
    this.curDraggedNode.setDragOffset(clientX, clientY);
    this.curDraggedNode.setState(state_drag);
  }

  Editor.prototype.stopDraggingNode = function () {
    if(this.curDraggedNode) {
      this.curDraggedNode.setState(state_default);
      this.curDraggedNode = undefined;
      return true;
    }
    return false;
  }

  Editor.prototype.startConnection = function (connector, clientX, clientY) {
    var xPos = connector.parentNode.xPos + connector.xPos;
    var yPos = connector.parentNode.yPos;
    this.$element.append(this.createLineElement(xPos, yPos, 200, 0.2).addClass("connector-temp"));
    this.curPressedConnector = connector;
    this.curPressedConnector.setState(state_connecting);
  }

  Editor.prototype.finishConnection = function () {
    if(this.curPressedConnector) {
      this.$element.find($(".connector-temp")).remove();
      this.curPressedConnector.setState(state_default);
      this.curPressedConnector = undefined;
      return true;
    }
    return false;
  }

  Editor.prototype.mouseUpHandler = function(event) {
    var consumeClick = this.stopDraggingNode();
    consumeClick = this.finishConnection() ? true : consumeClick;
    if(!consumeClick) {
      this.clickHandler(event);
    }
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

  // Editor.prototype.removeNode = function(event) {
  //   var nodeId = event.target.getAttribute("node-id");
  //   this.removeNodeWithId(nodeId);
  //   event.target.remove();
  // }

  Editor.prototype.createNode = function(clientX, clientY) {
    var node = new Node(this, this.$element);
    node.setPosition(clientX, clientY);
  }

  Editor.prototype.createLineElement = function(x, y, length, angle) {
    var line = $('<div class="connection"></div>');
    var styles = 'border: 1px solid black; '
               + 'width: ' + length + 'px; '
               + 'height: 0px; '
               + '-moz-transform: rotate(' + angle + 'rad); '
               + '-webkit-transform: rotate(' + angle + 'rad); '
               + '-o-transform: rotate(' + angle + 'rad); '  
               + '-ms-transform: rotate(' + angle + 'rad); '  
               + 'position: absolute; '
               + 'top: ' + y + 'px; '
               + 'left: ' + x + 'px; ';
    line.attr('style', styles);  
    return line;
  }

  Editor.prototype.template = {
    background: '<div class="nodes-background"></div>',
    node: '<div class="node"></div>',
    connector: '<div class="connector"></div>'
    // connection: '<div class="connection"></div>',
  };

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