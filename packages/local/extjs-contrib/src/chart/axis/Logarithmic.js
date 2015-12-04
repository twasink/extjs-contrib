Ext.define('Extjs.contribs.chart.axis.Logarithmic', {
  extend: 'Ext.chart.axis.Numeric',
  
  requires: [
    'Extjs.contribs.chart.axis.layout.Logarithmic',
    'Extjs.contribs.chart.axis.segmenter.Logarithmic'
  ],
  
  type: 'logarithmic',
  alias: [
    'axis.logarithmic',
  ],
  config: {
    layout: 'logarithmic',
    segmenter: 'logarithmic',
  }
});
