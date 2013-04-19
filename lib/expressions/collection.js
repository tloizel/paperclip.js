// Generated by CoffeeScript 1.6.2
(function() {
  var CollectionExpression, Evaluator, base,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("./base");

  Evaluator = (function(_super) {
    __extends(Evaluator, _super);

    function Evaluator() {
      var _this = this;

      Evaluator.__super__.constructor.apply(this, arguments);
      this.items = this.expr.items.map(function(item) {
        return _this.linkChild(item.evaluate(_this.context));
      });
    }

    Evaluator.prototype.toString = function() {
      return this.items.map(function(item) {
        return item.toString();
      }).join(" ");
    };

    return Evaluator;

  })(base.Evaluator);

  CollectionExpression = (function() {
    CollectionExpression.prototype._type = "collection";

    /*
    */


    function CollectionExpression(items) {
      this.items = items;
    }

    /*
    */


    CollectionExpression.prototype.evaluate = function(context) {
      return new Evaluator(this, context);
    };

    return CollectionExpression;

  })();

  module.exports = CollectionExpression;

  module.exports.Evaluator = Evaluator;

}).call(this);