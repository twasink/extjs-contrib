Ext.define('Extjs.contribs.data.request.Ajax', {
    override: 'Ext.data.request.Ajax',
    
    /**
     * Somehow... Sencha broke the AJAX requests. By parsing, but not actually using, the response headers. Go figure.
     * This was done as part of their drive to return XMLHTTPRequestObject-like objects, but not actually return
     * XMLHTTPRequestObjects for some reason.
     * 
     * The relevant line is highlighted below. Aside from that, this is a direct copy out of Ext.data.request.Ajax
     * 
     * Sencha bug ID: EXTJS-18481
     */
    /**
     * Creates the response object
     * @param {Object} request
     * @private
     */
    createResponse: function(xhr) {
      
        if (Ext.getVersion('core').getShortVersion() !== '600640') {
          console.warn("EXTJS Version has been updated from 6.0.0.640. This bug should have been fixed in 6.0.1. Check please!")
        }
        var me = this,
            isXdr = me.isXdr,
            headers = {},
            lines = isXdr ? [] : xhr.getAllResponseHeaders().replace(/\r\n/g, '\n').split('\n'),
            count = lines.length,
            line, index, key, response, byteArray;

        while (count--) {
            line = lines[count];
            index = line.indexOf(':');
            
            if (index >= 0) {
                key = line.substr(0, index).toLowerCase();
                
                if (line.charAt(index + 1) == ' ') {
                    ++index;
                }
                
                headers[key] = line.substr(index + 1);
            }
        }
        
        response = {
            request: me,
            requestId: me.id,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers, // <------- SENCHA FORGOT THIS LINE!
            getResponseHeader: me._getHeader,
            getAllResponseHeaders: me._getHeaders
        };

        if (isXdr) {
            me.processXdrResponse(response, xhr);
        }

        if (me.binary) {
            response.responseBytes = me.getByteArray(xhr);
        }
        else {
            // an error is thrown when trying to access responseText or responseXML
            // on an xhr object with responseType of 'arraybuffer', so only attempt
            // to set these properties in the response if we're not dealing with
            // binary data
            response.responseText = xhr.responseText;
            response.responseXML = xhr.responseXML;
        }

        return response;
    }
});