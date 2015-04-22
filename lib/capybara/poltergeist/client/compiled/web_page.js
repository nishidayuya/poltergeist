var slice = [].slice;

Poltergeist.WebPage = (function() {
  var command, delegate, fn1, fn2, i, j, len, len1, ref, ref1;

  WebPage.CALLBACKS = ['onAlert', 'onConsoleMessage', 'onLoadFinished', 'onInitialized', 'onLoadStarted', 'onResourceRequested', 'onResourceReceived', 'onUnsupportedContentReceived', 'onError', 'onNavigationRequested', 'onUrlChanged'];

  WebPage.DELEGATES = ['open', 'sendEvent', 'uploadFile', 'release', 'render'];

  WebPage.COMMANDS = ['currentUrl', 'find', 'nodeCall', 'pushFrame', 'popFrame', 'documentSize'];

  function WebPage(width, height) {
    var callback, i, len, ref;
    this["native"] = require('webpage').create();
    this._source = "";
    this._errors = [];
    this._networkTraffic = {};
    this.setViewportSize({
      width: width,
      height: height
    });
    ref = WebPage.CALLBACKS;
    for (i = 0, len = ref.length; i < len; i++) {
      callback = ref[i];
      this.bindCallback(callback);
    }
    this.injectAgent();
  }

  ref = WebPage.COMMANDS;
  fn1 = function(command) {
    return WebPage.prototype[command] = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.runCommand(command, args);
    };
  };
  for (i = 0, len = ref.length; i < len; i++) {
    command = ref[i];
    fn1(command);
  }

  ref1 = WebPage.DELEGATES;
  fn2 = function(delegate) {
    return WebPage.prototype[delegate] = function() {
      return this["native"][delegate].apply(this["native"], arguments);
    };
  };
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    delegate = ref1[j];
    fn2(delegate);
  }

  WebPage.prototype.onInitializedNative = function() {
    this._source = null;
    this.injectAgent();
    return this.setScrollPosition({
      left: 0,
      top: 0
    });
  };

  WebPage.prototype.injectAgent = function() {
    if (this["native"].evaluate(function() {
      return typeof __poltergeist;
    }) === "undefined") {
      this["native"].injectJs(phantom.libraryPath + "/agent.js");
      return this.nodes = {};
    }
  };

  WebPage.prototype.onConsoleMessageNative = function(message) {
    if (message === '__DOMContentLoaded') {
      this._source = this["native"].content;
      return false;
    }
  };

  WebPage.prototype.onLoadStartedNative = function() {
    return this.requestId = this.lastRequestId;
  };

  WebPage.prototype.onLoadFinishedNative = function() {
    return this._source || (this._source = this["native"].content);
  };

  WebPage.prototype.onConsoleMessage = function(message) {
    return console.log(message);
  };

  WebPage.prototype.onErrorNative = function(message, stack) {
    var stackString;
    stackString = message;
    stack.forEach(function(frame) {
      stackString += "\n";
      stackString += "    at " + frame.file + ":" + frame.line;
      if (frame["function"] && frame["function"] !== '') {
        return stackString += " in " + frame["function"];
      }
    });
    return this._errors.push({
      message: message,
      stack: stackString
    });
  };

  WebPage.prototype.onResourceRequestedNative = function(request) {
    this.lastRequestId = request.id;
    return this._networkTraffic[request.id] = {
      request: request,
      responseParts: []
    };
  };

  WebPage.prototype.onResourceReceivedNative = function(response) {
    this._networkTraffic[response.id].responseParts.push(response);
    if (this.requestId === response.id) {
      if (response.redirectURL) {
        return this.requestId = response.id;
      } else {
        return this._statusCode = response.status;
      }
    }
  };

  WebPage.prototype.networkTraffic = function() {
    return this._networkTraffic;
  };

  WebPage.prototype.content = function() {
    return this["native"].content;
  };

  WebPage.prototype.source = function() {
    return this._source;
  };

  WebPage.prototype.errors = function() {
    return this._errors;
  };

  WebPage.prototype.clearErrors = function() {
    return this._errors = [];
  };

  WebPage.prototype.statusCode = function() {
    return this._statusCode;
  };

  WebPage.prototype.viewportSize = function() {
    return this["native"].viewportSize;
  };

  WebPage.prototype.setViewportSize = function(size) {
    return this["native"].viewportSize = size;
  };

  WebPage.prototype.scrollPosition = function() {
    return this["native"].scrollPosition;
  };

  WebPage.prototype.setScrollPosition = function(pos) {
    return this["native"].scrollPosition = pos;
  };

  WebPage.prototype.clipRect = function() {
    return this["native"].clipRect;
  };

  WebPage.prototype.setClipRect = function(rect) {
    return this["native"].clipRect = rect;
  };

  WebPage.prototype.dimensions = function() {
    var scroll, viewport;
    scroll = this.scrollPosition();
    viewport = this.viewportSize();
    return {
      top: scroll.top,
      bottom: scroll.top + viewport.height,
      left: scroll.left,
      right: scroll.left + viewport.width,
      viewport: viewport,
      document: this.documentSize()
    };
  };

  WebPage.prototype.validatedDimensions = function() {
    var dimensions, document;
    dimensions = this.dimensions();
    document = dimensions.document;
    if (dimensions.right > document.width) {
      dimensions.left = Math.max(0, dimensions.left - (dimensions.right - document.width));
      dimensions.right = document.width;
    }
    if (dimensions.bottom > document.height) {
      dimensions.top = Math.max(0, dimensions.top - (dimensions.bottom - document.height));
      dimensions.bottom = document.height;
    }
    this.setScrollPosition({
      left: dimensions.left,
      top: dimensions.top
    });
    return dimensions;
  };

  WebPage.prototype.get = function(id) {
    var base;
    return (base = this.nodes)[id] || (base[id] = new Poltergeist.Node(this, id));
  };

  WebPage.prototype.evaluate = function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return JSON.parse(this["native"].evaluate("function() { return PoltergeistAgent.stringify(" + (this.stringifyCall(fn, args)) + ") }"));
  };

  WebPage.prototype.execute = function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return this["native"].evaluate("function() { " + (this.stringifyCall(fn, args)) + " }");
  };

  WebPage.prototype.stringifyCall = function(fn, args) {
    if (args.length === 0) {
      return "(" + (fn.toString()) + ")()";
    } else {
      return "(" + (fn.toString()) + ").apply(this, JSON.parse(" + (JSON.stringify(JSON.stringify(args))) + "))";
    }
  };

  WebPage.prototype.bindCallback = function(name) {
    var that;
    that = this;
    return this["native"][name] = function() {
      var result;
      if (that[name + 'Native'] != null) {
        result = that[name + 'Native'].apply(that, arguments);
      }
      if (result !== false && (that[name] != null)) {
        return that[name].apply(that, arguments);
      }
    };
  };

  WebPage.prototype.runCommand = function(name, args) {
    var result;
    result = this.evaluate(function(name, args) {
      return __poltergeist.externalCall(name, args);
    }, name, args);
    if (result.error != null) {
      if (result.error.message === 'PoltergeistAgent.ObsoleteNode') {
        throw new Poltergeist.ObsoleteNode;
      } else {
        throw new Poltergeist.JavascriptError([result.error]);
      }
    } else {
      return result.value;
    }
  };

  return WebPage;

})();
