importScripts('WorkerUtils.js');

var layersVersion = {
    prefix: 'http://maps.kosmosnimki.ru/Layer/CheckVersion.ashx'
    ,active: true
    ,callback: null
    ,ids: []
    ,add: function(ph) {
        for (var id in ph) {
            if (!this.ids[id]) {
                this.ids.push(id);
            }
            this.ids[id] = ph[id];
        }
    }
    ,remove: function(ph) {
        for (var i = this.ids.length - 1; i >= 0; i--) {
            var id = this.ids[i];
            if (ph[id]) {
                this.ids.splice(i, 1);
                delete this.ids[id];
            }
        }
    }
    ,parseResult: function(st) {
        if (st && st.Status === 'ok' && st.Result) {
            var pt = {};
            for (var i = 0, len = st.Result.length; i < len; i++) {
                var prop = st.Result[i].properties;
                pt[prop.name] = prop.LayerVersion;
            }
            layersVersion.add(pt);
        }
    }
    ,setActive: function(flag) {
        this.active = flag;
    }
    ,stop: function() {
        if(this.intervalID) clearInterval(this.intervalID);
        this.intervalID = null;
    }
    ,start: function(callback, timer) {
        this.callback = function(out) {
            layersVersion.parseResult(out);
            callback(out);
        }
        this.stop();
        this.intervalID = setInterval(this.request, timer);
        this.request();
    }
    ,request: function() {
        if (!layersVersion.active) {
            layersVersion.callback();
        } else if (layersVersion.ids.length) {
            for (var i = 0, len = layersVersion.ids.length; i < len; i += 40) {
                var len1 = i + 40 > len ? len : i + 40,
                    arr = [];
                for (var j = i; j < len1; j++) {
                    var id = layersVersion.ids[j];
                    arr.push({Name: id, Version: layersVersion.ids[id]});
                }
                var url = layersVersion.prefix + '?';
                url += 'layers=' + JSON.stringify(arr);
                url += '&CallbackName=layersVersion.callback';
                importScripts(url);
            }
        }
    }
}

var cmdHash = {
    layersVersion: function(ph, callback) {
        if ('add' in ph) layersVersion.add(ph.add);
        if ('remove' in ph) layersVersion.remove(ph.remove);
        if ('setActive' in ph) layersVersion.setActive(ph.setActive);
        
        if ('stop' in ph) layersVersion.stop();
        else layersVersion.start(callback, ph.timer || 20000);
    },

    dataManager: function(ph, callback) {
    }
};

self.commands = function(ph, callback) {
    if (!ph) ph = {};
    var cmd = ph.cmd;
    var out = (cmd && cmd in cmdHash ? cmdHash[cmd].call(cmdHash, ph, callback) : null);
    if (out) callback(out);
}
