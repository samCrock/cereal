(function() {
    'use strict';

    angular
        .module('app')
        .service('posterService', posterService);

    /* @ngInject */
    function posterService(wtService) {

        let request = require('request')
        let cheerio = require('cheerio')
        let fsExtra = require('fs-extra')
        let WebTorrent = require('webtorrent')
        let logUpdate = require('log-update')
        let chokidar = require('chokidar')
        let magnetUri = require('magnet-uri')

        let torrent_module = {}

        // Downloads poster image then if fav is true, updates following.json w/ the relative path else updates monthly
        torrent_module['downloadPoster'] = function downloadPoster(showName, scope) {

            return new Promise((resolve, reject) => {

                showName = showName.toLowerCase()
                let dashedShowName = showName.split('.').join('')
                dashedShowName = dashedShowName.split('?').join('')
                dashedShowName = dashedShowName.split(' ').join('-')

                // console.log('Searching trakt.tv for: ', dashedShowName)
                // console.log()

                var url = 'https://trakt.tv/shows/' + dashedShowName

                // console.log('https://trakt.tv/shows/' + dashedShowName)

                request.get(url, function(error, response, body) {

                    if (error || !response) return reject(error)

                    // console.log(response.statusCode)

                    if (!error && response.statusCode == 200) {
                        let $ = cheerio.load(body)
                        let sidebar = $('.sidebar')
                            // let posterSrc = sidebar['0'].children[0].children[1].attribs.src
                        let posterSrc = sidebar['0'].children[0].children[1].attribs['data-original']
                            // console.log('->', sidebar['0'].children[0])
                        if (dashedShowName.includes('walking')) {
                            console.log('Poster found ->', sidebar['0'].children[0].children[1].attribs['data-original'])
                        }
                        request.get({ url: posterSrc, encoding: 'binary' }, function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                let posterPath = './res/posters/' + dashedShowName + '.jpg'
                                fsExtra.writeFile(posterPath, body, 'binary', (err) => {
                                    if (err) reject('Cannot write file :', err)
                                    console.log(dashedShowName, 'poster successfuly saved')
                                    // if (scope) {
                                    //     scope.locals.filter((local) => {
                                    //         if (local.show === showName) {
                                    //             local.poster = posterPath
                                    //         }
                                    //     })
                                    // }
                                    resolve({ 'title': showName, 'poster': posterPath })
                                })

                            } else {
                                // console.error('Couldn\'t save this poster')
                                resolve()
                            }
                        })
                    } else resolve()
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
