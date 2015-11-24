Ext.define('Extjs.contribs.panel.Panel', {
  override: 'Ext.panel.Panel',
  
  getReExpander: function() {
    return this.callParent(arguments);
  },
  
  destroy: function() {
    var retvalue = this.callParent(arguments);
    
    // The stock ExtJS Panel class will try to create a re-expander when destroying a collapsed panel. This causes
    // nastiness, as it leaves behind an undestroyed header.
    // Curiously, this doesn't seem to happen in a fiddle environment, meaning that there may be something else going
    // on. However, in the meantime...
    //
    // Try to prevent that by destroying the reExpander.
    //
    // This can be tested using memory profiling
    
    if (this.reExpander && this.reExpander.destroyed == false) {
      this.reExpander.destroy();
      this.reExpander = null;
    }
    return retvalue;
  }
}, function() {
  if (Ext.getVersion('core').getShortVersion() !== '600640') {
    console.warn("EXTJS Version has been updated from 6.0.0.640. This bug should have been fixed in 6.0.1. Check please!")
  }
})
