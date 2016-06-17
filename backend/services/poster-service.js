'use strict'

let request = require('request')
let cheerio = require('cheerio')
let ioc = require('../ioc')
let fsExtra = require('fs-extra')
let WebTorrent = require('webtorrent')
let logUpdate = require('log-update')
let chokidar = require('chokidar')
let magnetUri = require('magnet-uri')

let wt_client = new WebTorrent()

let jsonService = ioc.create('services/json-service')
let subService = ioc.create('services/subs-service')

exports = module.exports = (commonService) => {

    let torrent_module = {}

    // Downloads poster image and updates following.json w/ the relative path then id scope is defined, refreshes locals
    torrent_module['downloadPoster'] = function downloadPoster(showName, scope) {

        return new Promise((resolve, reject) => {

            showName = showName.toLowerCase()
            let dashedShowName = showName.replace(' ', '-')
            dashedShowName = dashedShowName.replace(' ', '-')

            console.log('Searching trakt.tv for: ', showName)
            console.log()

            var url = 'https://trakt.tv/shows/' + dashedShowName

            console.log('https://trakt.tv/shows/' + dashedShowName)

            request.get(url, function(error, response, body) {

                if (error || !response) return reject(error)

                console.log(response.statusCode)

                if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(body)
                    let sidebar = $('.sidebar')
                    let posterSrc = sidebar['0'].children[0].children[1].attribs.src
                    console.log('Poster found ->', posterSrc)
                    request.get({ url: posterSrc, encoding: 'binary' }, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            let posterPath = './res/posters/' + dashedShowName + '.jpg'
                            fsExtra.writeFile(posterPath, body, 'binary', (err) => {
                                if (err) reject('Cannot write file :', err)
                                console.log(dashedShowName, 'poster successfuly saved')
                                if (scope) {
                                    scope.locals.filter( (local) => {
                                        if (local.show === showName) {
                                            local.poster = posterPath
                                        }
                                    })
                                }
                                jsonService.updateFollowing({"title" : showName, "poster" : posterPath})
                                resolve(posterPath)
                            })

                        } else {
                            console.log('Couldn\'t save this poster')
                            resolve()
                        }
                    })
                } else resolve()
            });
        });
    }

    

    return torrent_module
}

exports['@singleton'] = true
exports['@require'] = ['services/common-service']
