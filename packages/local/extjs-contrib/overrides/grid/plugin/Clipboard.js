Ext.define('Extjs.contribs.grid.plugin.Clipboard', {
  override: 'Ext.grid.plugin.Clipboard',
  
  // The default putCellData doesn't pay attention to the selection, or the editor. This is a fix
  putCellData: function(data, format) {
    // Decode the values into an m x n array (m rows, n columns)
    var values = Ext.util.TSV.decode(data);
    var recCount = values.length;
    var colCount = recCount ? values[0].length : 0;
    
    var view = this.getCmp().getView();
    var maxRowIdx = view.dataSource.getCount() - 1;
    var maxColIdx = view.getVisibleColumnManager().getColumns().length - 1;
    
    // determine the destination from the selection.

    var destination = this.determineDestination(view);
    
    var destinationStartColumn = destination.colIdx;
    
    for (var sourceRowIdx = 0; sourceRowIdx < recCount; sourceRowIdx++) {
      var row = values[sourceRowIdx];
      var dataObject = {}
      // Collect new values in dataObject
      for (var sourceColIdx = 0; sourceColIdx < colCount; sourceColIdx++) {
        this.transferValue(destination, dataObject, format, row, sourceColIdx);
        // If we are at the end of the destination row, break the column loop.
        if (destination.colIdx === maxColIdx) {
         break;
        }
        destination.setColumn(destination.colIdx + 1);
      }
    
      // Update the record in one go.
      destination.record.set(dataObject);
    
      // If we are at the end of the destination store, break the row loop.
      if (destination.rowIdx === maxRowIdx) {
          break;
      }
    
      // Jump to next row in destination
      destination.setPosition(destination.rowIdx + 1, destinationStartColumn);
    }
  },
  
  privates: {
    determineDestination: function(view) {
      // Default ExtJS behaviour ignores the selection model. Lines 56-65 represent the default behaviour.
      var selectionModel = this.getCmp().getSelectionModel();
      var selection = selectionModel.getSelected();
      var destination;
      if (selection) {
        destination = new Ext.grid.CellContext(view).setPosition(selection.getFirstRowIndex(), selection.getFirstColumnIndex());
      } else {
        var navModel = view.getNavigationModel();
        var currentPosition = navModel.getPosition();
        if (position) {
          // Create a new Context based upon the outermost View.
          // NavigationModel works on local views. TODO: remove this step when NavModel is fixed to use outermost view in locked grid.
          // At that point, we can use navModel.getPosition()
          destination = new Ext.grid.CellContext(view).setPosition(position.record, position.column); 
        } else {
          destination = new Ext.grid.CellContext(view).setPosition(0, 0);
        }
      }
      return destination;
    },
    
    transferValue: function(destination, dataObject, format, row, sourceColIdx) {
      if (format == 'html') { return; }
      
      var column = destination.column;
      
      // Default ExtJS behaviour doesn't care if the column has an editor or not.
      var editor = column.editor || column.getEditor();
      if (!editor) { return; } // Thou shalt not edit a column that is not editable
      
      var dataIndex = column.dataIndex;
      if (!dataIndex) { return; } // Thou shalt not edit a column that is not mapped.

      // Default ExtJS behaviour doesn't care if the editor vetoes editing the destination.
      if (this.editIsVetoed(destination)) { return; }
      
      var value = row[sourceColIdx];
      
      if (editor.rawToValue) { // If there is a convertor, apply it
        // Default ExtJS behaviour doesn't care if there is an editor, so doesn't apply transformations.
        value = editor.rawToValue(value);
      }
      
      dataObject[dataIndex] = value ;
    },
    
    editIsVetoed: function(destination) {
      var cmp = this.getCmp();
      var editorPlugin = Ext.Array.findBy(cmp.getPlugins(), function(plugin) { return plugin instanceof Ext.grid.plugin.Editing; });
      
      if (!editorPlugin) { return true; } // can't edit without an editor, right?
      
      var context = editorPlugin.getEditingContext(destination.record, destination.column)
      editorPlugin.fireEvent("beforeedit", editorPlugin, context);
      
      return context.cancel;
    }
  }
}, function() {
  if (Ext.getVersion('core').getShortVersion() !== '600640') {
    console.warn("EXTJS Version has been updated from 6.0.0.640. This bug should have been fixed in 6.0.2. Check please!")
  }
})
