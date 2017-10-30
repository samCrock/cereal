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


    torrent_module['downloadPosterFromUrl'] = function downloadPosterFromUrl(path, url) {
      request.get({ url: url, encoding: 'binary' }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log('Saving poster', path)
          fsExtra.outputFile(path, body, 'binary', (err) => {
            if (err) reject('Cannot write file :', err)
          })
        } else {
          console.error('Couldn\'t save this poster')
        }
      })
    }

    // Downloads poster image then if fav is true, updates following.json w/ the relative path else updates monthly
    torrent_module['downloadPoster'] = function downloadPoster(showName) {

      return new Promise((resolve, reject) => {
        var url = 'https://trakt.tv/shows/' + showName

        request.get(url, function(error, response, body) {
          if (error || !response) return reject(error)
          if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body)
            let sidebar = $('.sidebar')
            let posterSrc = sidebar['0'].children[0].children[1].attribs['data-original']

            // console.log(posterSrc)

            request.get({ url: posterSrc, encoding: 'binary' }, function(error, response, body) {
              if (!error && response.statusCode == 200) {
                let posterPath = './assets/posters/' + showName + '.jpg'
                fsExtra.outputFile(posterPath, body, 'binary', (err) => {
                  if (err) reject('Cannot write file :', err)
                  console.log(showName, 'poster successfuly saved')
                  resolve({ 'title': showName, 'poster': posterPath })
                })
              } else {
                reject()
              }
            })
          }
        });
      });
    }

    // Downloads poster image then if fav is true, updates following.json w/ the relative path else updates monthly
    torrent_module['getPosterUrl'] = function getPosterUrl(showTitle) {

      return new Promise((resolve, reject) => {

        showTitle = showTitle.toLowerCase()
        let dashedShowName = showTitle.split(' ').join('-')

        // console.log('Searching trakt.tv for: ', dashedShowName)
        // console.log()

        var url = 'https://trakt.tv/shows/' + dashedShowName

        // console.log('https://trakt.tv/shows/' + dashedShowName)

        request.get(url, function(error, response, body) {

          if (error || !response) return reject(error)

          console.log(response.statusCode)

          if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body)
            let sidebar = $('.sidebar')
            let posterSrc = sidebar['0'].children[0].children[1].attribs.src
            // console.log('Poster found ->', posterSrc)

            resolve(posterSrc)
          } else resolve()
        });
      });
    }

    // Returns wallpaper url
    torrent_module['getWallpaperUrl'] = function getWallpaperUrl(showTitle) {

      return new Promise((resolve, reject) => {

        showTitle = showTitle.toLowerCase()
        let dashedShowName = showTitle.split('.').join('')
        dashedShowName = dashedShowName.split(' ').join('-')

        console.log('Searching trakt.tv for: ', dashedShowName)
        console.log()

        var url = 'https://trakt.tv/shows/' + dashedShowName

        console.log('https://trakt.tv/shows/' + dashedShowName)

        request.get(url, function(error, response, body) {

          if (error || !response) return reject(error)

          console.log(response.statusCode)

          if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body)
            let bg = $('#summary-wrapper')['0'].attribs.style
            let regExp = /\(([^)]+)\)/
            bg = regExp.exec(bg)
            console.log('bg', bg)
            resolve(bg)
          } else resolve()
        });
      });
    }


    return torrent_module
  }
})();
