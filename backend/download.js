'use strict';

let chalk = require('chalk');

let ioc = require('./ioc')
let torrentService = ioc.create('services/torrent-service');
let jsonService = ioc.create('services/json-service');
let subService = ioc.create('services/subs-service')

torrentService.searchTorrent({
        serie: process.argv[2],
        episode: process.argv[3]
    })
    .then((result) => {
        torrentService.downloadTorrent(result)
        .then( () => {
            console.log('Done')
        })
    })
