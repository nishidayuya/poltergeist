var Poltergeist,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Poltergeist = (function() {
  function Poltergeist(port, width, height) {
    var that;
    this.browser = new Poltergeist.Browser(this, width, height);
    this.connection = new Poltergeist.Connection(this, port);
    that = this;
    phantom.onError = function(message, stack) {
      return that.onError(message, stack);
    };
    this.running = false;
  }

  Poltergeist.prototype.runCommand = function(command) {
    var error;
    this.running = true;
    try {
      return this.browser[command.name].apply(this.browser, command.args);
    } catch (_error) {
      error = _error;
      if (error instanceof Poltergeist.Error) {
        return this.sendError(error);
      } else {
        return this.sendError(new Poltergeist.BrowserError(error.toString(), error.stack));
      }
    }
  };

  Poltergeist.prototype.sendResponse = function(response) {
    return this.send({
      response: response
    });
  };

  Poltergeist.prototype.sendError = function(error) {
    return this.send({
      error: {
        name: error.name || 'Generic',
        args: error.args && error.args() || [error.toString()]
      }
    });
  };

  Poltergeist.prototype.send = function(data) {
    if (this.running) {
      this.connection.send(data);
      return this.running = false;
    }
  };

  return Poltergeist;

})();

window.Poltergeist = Poltergeist;

Poltergeist.Error = (function() {
  function Error() {}

  return Error;

})();

Poltergeist.ObsoleteNode = (function(superClass) {
  extend(ObsoleteNode, superClass);

  function ObsoleteNode() {
    return ObsoleteNode.__super__.constructor.apply(this, arguments);
  }

  ObsoleteNode.prototype.name = "Poltergeist.ObsoleteNode";

  ObsoleteNode.prototype.args = function() {
    return [];
  };

  ObsoleteNode.prototype.toString = function() {
    return this.name;
  };

  return ObsoleteNode;

})(Poltergeist.Error);

Poltergeist.ClickFailed = (function(superClass) {
  extend(ClickFailed, superClass);

  function ClickFailed(selector, position) {
    this.selector = selector;
    this.position = position;
  }

  ClickFailed.prototype.name = "Poltergeist.ClickFailed";

  ClickFailed.prototype.args = function() {
    return [this.selector, this.position];
  };

  return ClickFailed;

})(Poltergeist.Error);

Poltergeist.JavascriptError = (function(superClass) {
  extend(JavascriptError, superClass);

  function JavascriptError(errors) {
    this.errors = errors;
  }

  JavascriptError.prototype.name = "Poltergeist.JavascriptError";

  JavascriptError.prototype.args = function() {
    return [this.errors];
  };

  return JavascriptError;

})(Poltergeist.Error);

Poltergeist.BrowserError = (function(superClass) {
  extend(BrowserError, superClass);

  function BrowserError(message1, stack1) {
    this.message = message1;
    this.stack = stack1;
  }

  BrowserError.prototype.name = "Poltergeist.BrowserError";

  BrowserError.prototype.args = function() {
    return [this.message, this.stack];
  };

  return BrowserError;

})(Poltergeist.Error);

phantom.injectJs(phantom.libraryPath + "/web_page.js");

phantom.injectJs(phantom.libraryPath + "/node.js");

phantom.injectJs(phantom.libraryPath + "/connection.js");

phantom.injectJs(phantom.libraryPath + "/browser.js");

new Poltergeist(phantom.args[0], phantom.args[1], phantom.args[2]);
