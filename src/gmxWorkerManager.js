//WorkerManager
if (!L.gmx) L.gmx = {};
L.gmx.WorkerManager = function(url, onError) {  // добавить worker
    if(!url) return null;
    var worker = new Worker(url);
    if(!worker) return null;
    var workerItem = {
        currCommand: {}
        ,send: function(ph, onMsg, attr) {
            var cmdId = gmxAPIutils.newId();
            workerItem.currCommand[cmdId] = {onMsg: onMsg, attr: attr};
            console.log('message to worker ' , ph);
            worker.postMessage({id: cmdId, cmd: 'inCmd', msg: ph});
        }
        ,terminate: function() {			// Прекратить работу объекта Worker
            worker.terminate();
        }
        ,onMsg: function(e) {
            var data = e.data;
            //console.log(data);
            if(data.log) {
                //console.log(data.log);
                return;
            }
            var inId = data.id,
                it = workerItem.currCommand[inId];
            if(it) {
                if(it.onMsg) it.onMsg(data.msg);
                if(!it.attr || !it.attr.notRemove) delete workerItem.currCommand[inId];
            }
        }
        ,onError: function(e) {
            onError(e);
            //console.log('onError from worker ' , e);
        }
    };
    worker.addEventListener('message', workerItem.onMsg, false);
    worker.addEventListener('error', onError, false);
    return {send: workerItem.send, terminate: workerItem.terminate};
};
