var protoclass = require("protoclass"),
utils          = require("../../../utils");

function UnboundBlockBinding (node, script, view) {
  this.view   = view;
  this.nodeFactory = view.template.nodeFactory;
  this.script = script;
  this.node   = node;
}

module.exports = protoclass(UnboundBlockBinding, {
  bind: function (context) {
    var self = this;
    var value = this.script.evaluate(context);
    if (this.value === value) return;
    this.value = value;

    var v = String(value == null ? "" : value);

    if (this.nodeFactory.name !== "dom") {
      this.node.replaceText(v, true);
    } else {
      this.node.nodeValue = String(v);
    }
  },
  unbind: function () { }
});