Ext.define('Extjs.contribs.chart.axis.segmenter.Logarithmic', {
  extend: 'Ext.chart.axis.segmenter.Numeric',
  alias: 'segmenter.logarithmic',
  config: {
    minimum: 200
  },
  
  renderer: function (value, context) {
    return (Math.pow(10, value)).toFixed(3);
  }

});