'use strict';

let fsExtra = require('fs-extra');
let Transmission = require('transmission');
let magnet_uri = require('magnet-uri');
let sleep = require('sleep');

exports = module.exports = function() {

    let transmission_module = {};

    var transmission = new Transmission({
        port: 9091, // DEFAULT : 9091 
        // username: 'transmission',
        // password: '{1994e0c04add385ce392ab25cd277d6172aaba0eOi/HND57'
    });

    // Get details of all torrents currently queued in transmission app 
    transmission_module['getTransmissionStats'] = function() {
        transmission.sessionStats(function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(result);
            }
        });
    }

    // Add a torrent by passing a URL to .torrent file or a magnet link 
    transmission_module['addTorrent'] = function(url) {
        var parsed = magnet_uri.decode(url);
        console.log(parsed.dn);
        var path = __dirname + '/download/' + parsed.dn;
        fsExtra.mkdirp(path, function(err) {
            if (err) return console.error(err)
            transmission.addUrl(url, {
                'download-dir': path
            }, function(err, result) {
                if (err) {
                    return console.log('Error transmission.addUrl', err);
                }
                var id = result.id;
                console.log('Just added a new torrent.');
                console.log('Path: ' + path);
                console.log('Torrent ID: ' + id);

                // var done = false;
                // while (!done) {
                //     console.log('::info::');
                //     transmission.get(id, function(err, result) {
                //         if (err) { console.error(err); }
                //         console.log(result);
                //         if (result.torrents.length > 0) {
                //             console.log("Name = " + result.torrents[0].name);
                //             console.log("Download Rate = " + result.torrents[0].rateDownload / 1000);
                //             console.log("Upload Rate = " + result.torrents[0].rateUpload / 1000);
                //             console.log("Completed = " + result.torrents[0].percentDone * 100);
                //             console.log("ETA = " + result.torrents[0].eta / 3600);
                //             console.log("Status = " + getStatusType(result.torrents[0].status));
                //         }
                //     });
                //     sleep.sleep(3);
                // }
            });

        });


    }

    // Get various stats about a torrent in the queue 
    transmission_module['getTorrentDetails'] = function(id) {
        transmission.get(id, function(err, result) {
            if (err) {
                throw err;
            }
            if (result.torrents.length > 0) {
                // console.log(result.torrents[0]);			// Gets all details 
                console.log("Name = " + result.torrents[0].name);
                console.log("Download Rate = " + result.torrents[0].rateDownload / 1000);
                console.log("Upload Rate = " + result.torrents[0].rateUpload / 1000);
                console.log("Completed = " + result.torrents[0].percentDone * 100);
                console.log("ETA = " + result.torrents[0].eta / 3600);
                console.log("Status = " + getStatusType(result.torrents[0].status));
            }
        });
    }

    transmission_module['deleteTorrent'] = function(id) {
        transmission.remove(id, true, function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(result); // Read this output to get more details which can be accessed as shown below. 
                // Extra details 
                console.log('bt.get returned ' + result.torrents.length + ' torrents');
                result.torrents.forEach(function(torrent) {
                    console.log('hashString', torrent.hashString)
                });
                removeTorrent(id);
            }
        });
    }

    // To start a paused / stopped torrent which is still in queue 
    transmission_module['startTorrent'] = function(id) {
        transmission.start(id, function(err, result) {});
    }

    // To get list of all torrents currently in queue (downloading + paused) 
    // NOTE : This may return null if all torrents are in paused state  
    transmission_module['getAllActiveTorrents'] = function() {
        transmission.active(function(err, result) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < result.torrents.length; i++) {
                    console.log(result.torrents[i].id);
                    console.log(result.torrents[i].name);
                }
            }
        });
    }

    // Pause / Stop a torrent 
    transmission_module['stopTorrent'] = function(id) {
        transmission.stop(id, function(err, result) {});
    }

    // Pause / Stop all torrent 
    transmission_module['stopAllActiveTorrents'] = function() {
        transmission.active(function(err, result) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < result.torrents.length; i++) {
                    stopTorrents(result.torrents[i].id);
                }
            }
        });
    }

    // Remove a torrent from download queue 
    // NOTE : This does not trash torrent data i.e. does not remove it from disk 
    transmission_module['removeTorrent'] = function(id) {
        transmission.remove(id, function(err) {
            if (err) {
                throw err;
            }
            console.log('torrent was removed');
        });
    }

    // Get torrent state 
    transmission_module['getStatusType'] = function(type) {
        if (type === 0) {
            return 'STOPPED';
        } else if (type === 1) {
            return 'CHECK_WAIT';
        } else if (type === 2) {
            return 'CHECK';
        } else if (type === 3) {
            return 'DOWNLOAD_WAIT';
        } else if (type === 4) {
            return 'DOWNLOAD';
        } else if (type === 5) {
            return 'SEED_WAIT';
        } else if (type === 6) {
            return 'SEED';
        } else if (type === 7) {
            return 'ISOLATED';
        }
    }
    return transmission_module;
}

exports['@singleton'] = true;
