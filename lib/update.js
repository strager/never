var IS_NODE = true;
var IS_SPACEPORT = false;

var path = require('path');
var fs = require('fs');

var Q = require('q');

function collectLiveScripts(socket) {
    return Q.ncall(
        socket.request,
        socket,
        { 'command': 'scripts' }
    ).get(0).then(function (data) {
        var scripts = Object.create(null);

        data.forEach(function (scriptData) {
            if (scriptData['type'] === 'script'
             && scriptData['scriptType'] === 2) {
                var name = scriptData['name'];
                if (typeof name === 'string') {
                    var id = scriptData['id'];

                    if (IS_SPACEPORT) {
                        name = path.basename(name);
                    }

                    scripts[name] = id;
                }
            }
        });

        return scripts;
    });
}

function updateScripts(socket, filePaths) {
    return Q.ncall(socket.pauseWith, socket, function (callback) {
        // Debugger is paused in this function block,
        // as to make updates atomic

        collectLiveScripts(socket).then(function (liveScripts) {
            function readFileContents(filePath, scriptName) {
            }

            function sendContentsToDebugger(scriptName, contents) {
                if (IS_NODE) {
                    contents = '(function (exports, require, module, __filename, __dirname) { ' + contents + '\n});';
                }

                return Q.ncall(socket.request, socket, {
                    'command': 'changelive',
                    'arguments': {
                        'script_id': liveScripts[scriptName],
                        'new_source': contents
                    }
                });
            }

            function updateScript(filePath) {
                var scriptName = filePath;
                if (IS_SPACEPORT) {
                    scriptName = path.basename(filePath);
                }

                if (!(scriptName in liveScripts)) {
                    return null;
                }

                console.log("Updating script " + filePath);

                return Q.ncall(fs.readFile, fs, filePath).then(function (contents) {
                    return sendContentsToDebugger(scriptName, contents);
                }).fail(function (err) {
                    // Add some debugging information to errors
                    err.scriptName = scriptName;
                    err.filePath = filePath;
                    throw err;
                });
            }

            return Q.all(filePaths.map(updateScript));
        }).then(function (_) {
            callback(null);
        }, function (err) {
            callback(err);
        });

        // end debugger stopped
    });
}

// XXX Mutates `queue`
// XXX This should be encapsulated into an object
var updatePromise = Q.ref(null);
var changeTimeout = null;
var UPDATE_INTERVAL = 100;
function queueUpdateScripts(socket, queue) {
    if (changeTimeout !== null) {
        clearTimeout(changeTimeout);
    }

    changeTimeout = setTimeout(function () {
        updatePromise = updatePromise.then(function () {
            // Remove all files from queue and update them
            var filePaths = queue.splice(0, queue.length);
            updateScripts(socket, filePaths).end();
        }).fail(function (err) {
            console.error(err);
            // Eat error
        });
    }, UPDATE_INTERVAL);
}

exports.queueUpdateScripts = queueUpdateScripts;
