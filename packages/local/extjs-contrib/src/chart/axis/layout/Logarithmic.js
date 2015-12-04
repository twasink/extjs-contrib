Ext.define('Extjs.contribs.chart.axis.layout.Logarithmic', {
  extend: 'Ext.chart.axis.layout.Continuous',
  alias: 'axisLayout.logarithmic',
  
  config: {
    adjustMinimumByMajorUnit: false,
    adjustMaximumByMajorUnit: false
  },
  
  /**
   * Convert the value from the normal to the log10 version.
   * NB: The renderer for the field needs to do the inverse.
   * It is also advised that 0 and negative values be excluded, as they will return negative Infinity
   */
  getCoordFor: function (value, field, idx, items) {
    return Math.log10(value);
  },

  /**
   * Called by the parent class to build the 'tick marks', which also determines where the grid lines get shown.
   * The default behaviour is to get an even spread. Instead, we want to show the grid lines on the multiples of the
   * power of tens - e.g. 1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100, and so forth
   */
  snapEnds: function (context, min, max, estStepSize) {
    var segmenter = context.segmenter;
    var axis = this.getAxis();
    var majorTickSteps = axis.getMajorTickSteps();
        // if specific number of steps requested and the segmenter can do such segmentation
    var out = majorTickSteps && segmenter.exactStep ?
        segmenter.exactStep(min, (max - min) / majorTickSteps) :
        segmenter.preferredStep(min, estStepSize);
    var unit = out.unit;
    var step = out.step;
    var from = segmenter.align(min, step, unit);

    // Calculate the steps.
    var steps = []
    for (var magnitude = Math.floor(min); magnitude < Math.ceil(max); magnitude++) {
      var baseValue = Math.pow(10, magnitude);
      for (var increment = 1; increment < 10; increment++) {
        var value = baseValue * increment;
        var logValue = Math.log10(value);
        if (logValue > min && logValue < max) {
          steps.push(logValue);
        }
      }
    }

    return {
        min: segmenter.from(min),
        max: segmenter.from(max),
        from: from,
        to: segmenter.add(from, steps * step, unit),
        step: step,
        steps: steps.length,
        unit: unit,
        get: function (current) {
            return steps[current]
        }
    };
  },
  
  // Trimming by the range makes the graph look weird. So we don't.
  trimByRange: Ext.emptyFn
  
}, function() {
  // IE (and the PhantomJS system) do not have have a log10 function. So we polyfill it in if needed.
  Math.log10 = Math.log10 || function(x) {
    return Math.log(x) / Math.LN10;
  };
})