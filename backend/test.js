'use strict'

require(__dirname + '/services/torrent-service')

torrentService.searchTorrent({
        show: 'stranger things',
        episode: 's01e06'
    })
    .then((result) => {
        torrentService.downloadTorrent(result)
    })
