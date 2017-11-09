(function() {
  'use strict';

  angular
  .module('app')
  .service('posterService', posterService);

  /* @ngInject */
  function posterService(wtService, commonService) {

    let request = require('request')
    let cheerio = require('cheerio')
    let fsExtra = require('fs-extra')
    let WebTorrent = require('webtorrent')
    let logUpdate = require('log-update')
    let chokidar = require('chokidar')
    let magnetUri = require('magnet-uri')

    let torrent_module = {}

    torrent_module['getPoster'] = function getPoster(dashedShowTitle) {
      return new Promise((resolve, reject) => {
        var url = 'https://trakt.tv/shows/' + dashedShowTitle
        request.get(url, function(error, response, body) {
          if (error || !response) return reject(error)
          if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body)
            let sidebar = $('.sidebar')
            let posterSrc = sidebar['0'].children[0].children[1].attribs['data-original']
            resolve({ title: dashedShowTitle, poster: posterSrc })
          } else resolve()
        });
      });
    }

    return torrent_module
  }
})();
