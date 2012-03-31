var path = require('path');

// XXX Mutates queue
// See lib/update.js queueUpdateScripts
function watch(watchPath, queue, updateCallback) {
    require('watch').watchTree(watchPath, {
        ignoreDotFiles: true
    }, function on_watchEvent(fileName, cur, prev) {
        if (typeof fileName === 'string') {
            var filePath = path.resolve(fileName);
            if (queue.indexOf(filePath) < 0) {
                queue.push(filePath);
                updateCallback();
            }
        }
    });
}

module.exports = watch;
