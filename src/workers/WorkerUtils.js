self.addEventListener('message', function(e) {
    var data = e.data,
        cmdID = data.id,
        out = {id: data.id}; // , 'cmd': data.cmd, 'inMsg': data.msg
    if(!self.log) {
        self.log = function(msg) {
            out.log = msg;
            self.postMessage(out);
        }
    }
    if(self.commands) {
        self.commands(data.msg, function(ph) {  // поступила команда
            out.msg = ph;
            self.postMessage(out);
        });
    }
}, false);
