var gmxLayersVersion = null;

if (!L.gmx) L.gmx = {};
L.gmx.gmxLayersVersion = function(worker) {
    //console.log('gmxLayersVersion worker' , worker);
    var layers = {},
        notActive = false;
    var callback = function(ev) {
        console.log('gmxLayersVersion callback' , arguments);
        var isPageHidden = gmxAPIutils.isPageHidden();
        if (notActive !== isPageHidden) {
            notActive = isPageHidden;
            worker.send({ cmd: 'layersVersion', setActive: !notActive }, callback, {notRemove: true});
        }
        if (ev && ev.Status === 'ok' && ev.Result) {
            for (var i = 0, len = ev.Result.length; i < len; i++) {
                var pt = ev.Result[i],
                    prop = pt.properties,
                    id = prop.name,
                    layer = layers[id];
                if (layer && 'updateVersion' in layer) layer.updateVersion(prop);
            }
        }
    }
    worker.send({
        cmd: 'layersVersion'
        ,timer: 20000
    }, callback, {notRemove: true});
    this.layeradd = function(ev) {
        var layer = ev.layer,
            gmx = layer._gmx;
        if (gmx) {
            var prop = gmx.properties,
                id = prop.name,
                add = {};
            //console.log('layeradd' , arguments);
            if (id && 'LayerVersion' in prop) {
                layers[id] = layer;
                add[id] = prop.LayerVersion;
                worker.send({
                    cmd: 'layersVersion'
                    ,add: add
                }, callback, {notRemove: true});
            }
        }
    }
    this.layerremove = function(ev) {
        //console.log('layerremove' , arguments);
        var layer = ev.layer,
            gmx = layer._gmx;
        if (gmx) {
            var prop = gmx.properties,
                id = prop.name,
                remove = {};
            //console.log('layeradd' , arguments);
            if (id && 'LayerVersion' in prop) {
                delete layers[id];
                remove[id] = prop.LayerVersion;
                worker.send({
                    cmd: 'layersVersion'
                    ,remove: remove
                }, callback, {notRemove: true});
            }
        }
    }
    return this;
};

L.Map.addInitHook(function () {
    if (!gmxLayersVersion) {
        var prefix = '../src/workers/',
            workerUrl = prefix + 'WorkerLayersVersion.js';
         
        var onError = function(ev) {
            console.log('onError' , arguments);
        }
        var worker = new L.gmx.WorkerManager(workerUrl, onError);
        
        gmxLayersVersion = new L.gmx.gmxLayersVersion(worker);
    }
    this
        .on('layeradd', gmxLayersVersion.layeradd, this)
        .on('layerremove', gmxLayersVersion.layerremove, this);
});

