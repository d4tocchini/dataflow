( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  // Thanks bobince http://stackoverflow.com/a/3642265/592125
  var makeSvgElement = function(tag, attrs) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (k === "xlink:href") {
        // Pssh namespaces...
        svg.setAttributeNS('http://www.w3.org/1999/xlink','href', attrs[k]);
      } else {
        svg.setAttribute(k, attrs[k]);
      }
    }
    return svg;
  };
  
  Edge.View = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge",
    positions: null,
    initialize: function() {
      this.positions = {
        from: null, 
        to: null
      };
      // Render on source/target view move
      if (this.model.source) {
        this.model.source.parentNode.on("change:x change:y change:w", this.render, this);
        // this.model.source.parentNode.inputs.on("add remove", this.render, this);
        // this.model.source.parentNode.outputs.on("add remove", this.render, this);
      }
      if (this.model.target) {
        this.model.target.parentNode.on("change:x change:y", this.render, this);
      }
      // Set port plug active
      if (this.model.source && this.model.source.view) {
        this.model.source.view.plugSetActive();
      }
      if (this.model.target && this.model.target.view) {
        this.model.target.view.plugSetActive();
      }
      // Made SVG elements
      this.el = makeSvgElement("g", {
        "class": "dataflow-edge"
      });
      this.elEdge = makeSvgElement("path", {
        "class": "dataflow-edge-wire"
      });
      this.elShadow = makeSvgElement("path", {
        "class": "dataflow-edge-shadow"
      });

      this.el.appendChild(this.elShadow);
      this.el.appendChild(this.elEdge);

      // Click handler
      var self = this;
      this.el.addEventListener("click", function(event){
        self.click(event);
      });
    },
    render: function(previewPosition){
      var source = this.model.source;
      var target = this.model.target;
      var dataflowParent, graphPos;
      if (source) {
        this.positions.from = source.view.holePosition();
      }
      else {
        // Preview 
        dataflowParent = this.model.parentGraph.dataflow.$el.parent().position();
        graph = this.model.parentGraph.view.$el;
        this.positions.from = {
          left: graph.scrollLeft() + previewPosition.left - 5 - dataflowParent.left,
          top:  graph.scrollTop()  + previewPosition.top + 5 - dataflowParent.top
        };
      }
      if (target) {
        this.positions.to = target.view.holePosition();
      } else {
        // Preview
        dataflowParent = this.model.parentGraph.dataflow.$el.parent().position();
        graph = this.model.parentGraph.view.$el;
        this.positions.to = {
          left: graph.scrollLeft() + previewPosition.left + 15 - dataflowParent.left,
          top:  graph.scrollTop()  + previewPosition.top + 5 - dataflowParent.top
        };
      }
      // No half-pixels
      this.positions.from.left = Math.floor(this.positions.from.left);
      this.positions.from.top = Math.floor(this.positions.from.top);
      this.positions.to.left = Math.floor(this.positions.to.left);
      this.positions.to.top = Math.floor(this.positions.to.top);
      // Make and apply the path
      var pathD = this.edgePath(this.positions);
      this.elEdge.setAttribute("d", pathD);
      this.elShadow.setAttribute("d", pathD);
      // Reset bounding box
      if (this.model.parentGraph && this.model.parentGraph.view){
        this.model.parentGraph.view.sizeSVG();
      }
    },
    fade: function(){
      this.el.setAttribute("class", "dataflow-edge fade");
    },
    unfade: function(){
      this.el.setAttribute("class", "dataflow-edge");
    },
    highlight: function(){
      this.el.setAttribute("class", "dataflow-edge highlight");
    },
    unhighlight: function(){
      this.el.setAttribute("class", "dataflow-edge");
    },
    edgePath: function(positions){
      var extend = 20;
      var x = (positions.to.left-extend) - (positions.from.left+extend);
      var halfX = Math.floor(x/2);
      var halfX2 = x-halfX;
      var y = positions.to.top - positions.from.top;
      var halfY = Math.floor(y/2);
      var halfY2 = y-halfY;

      var control1 = "";
      var control2 = "";

      // Todo: check if this wire path is occupied, if so shift it over

      if (Math.abs(y) > Math.abs(x)) {
        // More vertical travel
        if (y > 0) {
          if (x > 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top+halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top-halfX2);
          } else if (x < 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top-halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top+halfX2);
          }
        } else if (y < 0) {
          if (x > 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top-halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top+halfX2);
          } else if (x < 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top+halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top-halfX2);
          }          
        }
      } else if (Math.abs(y) < Math.abs(x)) {
        // More horizontal travel
        if (x > 0) {
          if (y > 0) {
            control1 = " L " + (positions.from.left+extend+halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend-halfY2) + " " + (positions.to.top-halfY2);
          } else if (y < 0) {
            control1 = " L " + (positions.from.left+extend-halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend+halfY2) + " " + (positions.to.top-halfY2);
          }
        } else if (x < 0) {
          if (y > 0) {
            control1 = " L " + (positions.from.left+extend-halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend+halfY2) + " " + (positions.to.top-halfY2);
          } else if (y < 0) {
            control1 = " L " + (positions.from.left+extend+halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend-halfY2) + " " + (positions.to.top-halfY2);
          }          
        }
      } 

      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+extend) + " " + positions.from.top +
        control1 + control2 +
        " L " + (positions.to.left-extend) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
      var source = this.model.source;
      var target = this.model.target;
      // Remove listeners
      if (source) {
        source.parentNode.off(null, null, this);
      }
      if (target) {
        target.parentNode.off(null, null, this);
      }
      // Check if port plug is still active
      if (source) {
        source.view.plugCheckActive();
      }
      if (target) {
        target.view.plugCheckActive();
      }
      // Remove element
      this.el.parentNode.removeChild(this.el);
    },
    click: function(event){
      // Highlight
      this.highlight();
      this.bringToTop();
      this.model.trigger("select");
    },
    bringToTop: function(){
      this.model.bringToTop();
      var parent = this.el.parentNode;
      if(parent){
        parent.removeChild(this.el);
        parent.appendChild(this.el);
      }
    }
  });

}(Dataflow) );
