'use strict'

let chalk = require('chalk')
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

exports = module.exports = function(commonService) {

    let torrent_module = {}
    let path = process.cwd() + '/download/'

    torrent_module['getPoster'] = function getPoster(showName) {
        return new Promise(function(resolve, reject) {

            console.log(chalk.yellow('Searching trakt.tv for: '), chalk.white('"' + showName + '"'))
            console.log()

            showName = showName.toLowerCase()
            let dashedShowName = showName.replace(' ', '-')

            var url = 'https://trakt.tv/shows/' + dashedShowName

            request.get(url, function(error, response, body) {

                if (error || !response) return reject(error)

                console.log(chalk.yellow(response.statusCode))

                if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(body)
                    let sidebar = $('.sidebar')
                    let posterSrc = sidebar['0'].children[0].children[1].attribs.src
                    console.log(chalk.green('Poster found ->', posterSrc))
                    request.get({ url: posterSrc, encoding: 'binary' }, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            let posterPath = './res/posters/' + dashedShowName + '.jpg'
                            fsExtra.writeFile(posterPath, body, 'binary', function(err) {
                                if (err) reject('Cannot write file :', err)
                                console.log(chalk.green(dashedShowName, 'poster successfuly saved'))
                                resolve(showName)
                            })
                            jsonService.updateFollowing({"title" : showName, "poster" : posterPath})

                        } else console.log(chalk.red('Couldn\'t save this poster'))
                    })
                } else reject()
            });
        });
    }

    

    return torrent_module
}

exports['@singleton'] = true
exports['@require'] = ['services/common-service']
