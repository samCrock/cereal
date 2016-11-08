'use strict'

const os = require('os')
let util = require('util')
let exec = require('child_process').exec
let platform = os.platform()

let chalk = require('chalk')
let request = require('request')
let cheerio = require('cheerio')
let ioc = require('../ioc')
let fsExtra = require('fs-extra')
let logUpdate = require('log-update')
let chokidar = require('chokidar')
let magnetUri = require('magnet-uri')

let jsonService = ioc.create('services/json-service')
let subService = ioc.create('services/subs-service')
let posterService = ioc.create('services/poster-service')
let commonService = ioc.create('services/common-service')

exports = module.exports = function() {

    let torrent_module = {}
    let path = process.cwd() + '/download/'
    let watcher = chokidar.watch(path)

    torrent_module['getCurrents'] = function getCurrents() {
        return wt_client.torrents
    }

    let downloadTorrent = torrent_module['downloadTorrent'] = function downloadTorrent(t, $rootScope) {
        return new Promise(function(resolve, reject) {

            if (!t.show) {
                console.log('---' + typeof t + '---')
                resolve(parseInt(t))
            }

            // console.log("'" + t.title + "'")
            // console.log()

            t.poster = './res/posters/' + commonService.spacedToDashed(t.show) + '.jpg'

            jsonService.getEpisodeInfo(t)
                .then((t) => {
                    console.log('Updating library w\\ torrent:', t)
                    jsonService.updateLibrary(t)
                })

            fsExtra.mkdirp(path, function(err) {

                if (err) return console.error(err)

                // console.log('TORRENTS:', wt_client.torrents)

                wt_client.add(t.magnet, {
                    path: path
                }, function(torrent) {

                    t.path = torrent.path + torrent.name

                    jsonService.getLocalTorrent(t.title).then((result) => {
                        if (result) {
                            $rootScope.locals.filter(function(obj) {
                                if (result.title === obj.title) {
                                    console.log('Already here baby', result)
                                    obj = result
                                    resolve(result.name)
                                    $rootScope.$apply()
                                }
                            })
                        } else { console.log('not found') }
                    })

                    if (torrent.progress != 1) {
                        torrent.files.forEach(function(file) {
                            console.log('Started downloading ' + file.name)
                            file.getBuffer(function(err, buffer) {
                                if (err) {
                                    console.error('Error downloading ' + file.name)
                                    reject(err)
                                }
                            })
                        })
                    }

                    torrent.on('done', () => {
                        console.log(torrent.name, ' ready')
                        console.log()

                        subService.search(torrent.name).then((opts) => {
                            subService.download(opts)
                        })

                        t.ready = true
                        delete t['download_info']

                        jsonService.updateLibrary(t)

                        resolve(torrent.name)
                        $rootScope.$apply()

                    })

                    torrent.on('download', (chunkSize) => {
                        var output = [
                            chalk.cyan(''),
                            chalk.cyan('=================='),
                            chalk.dim('              Name : ') + torrent.name,
                            chalk.dim('        Downloaded : ') + commonService.formatBytes(torrent.downloaded),
                            chalk.dim('             Speed : ') + commonService.formatBytes(torrent.downloadSpeed) + '/s',
                            chalk.dim('          Progress : ') + Math.floor(torrent.progress * 100) + '%',
                            chalk.dim('         Remaining : ') + commonService.formatTime(torrent.timeRemaining),
                            chalk.cyan('==================')
                        ]
                        logUpdate(output.join('\n'))

                        torrent.id = t.id

                        $rootScope.locals.filter((obj) => {
                            if (obj.id === torrent.id) {
                                obj.download_info = {
                                    progress: Math.floor(torrent.progress * 100),
                                    remaining: commonService.formatTime(torrent.timeRemaining),
                                    ready: torrent.progress === 1 ? true : false,
                                    speed: commonService.formatBytes(torrent.downloadSpeed) + '/s',
                                    downloaded: commonService.formatBytes(torrent.downloaded)
                                }
                                $rootScope.$apply()
                            }
                        })
                    })

                })

            })
        })
    }


    let searchTorrent = torrent_module['searchTorrent'] = function searchTorrent(searchObj) {
        return new Promise(function(resolve, reject) {
            var show = searchObj.show
            show = show.toLowerCase().split('.').join('')

            var episode = searchObj.episode
            var searchString = show + ' ' + episode
            console.log('Searching PB for: ' + searchString)
            console.log()

            searchString = encodeURIComponent(searchString)

            // var url = 'https://thepiratebay.org/search/' + searchString + '/0/99/0'
            var url = 'https://pirateproxy.vip/search/' + searchString + '/0/99/0'

            request.get(url, function(error, response, body) {

                if (error || !response) return reject(error)

                console.log('[', response.statusCode, ']')

                if (!error && response.statusCode === 200) {
                    var $ = cheerio.load(body)
                    var data = $('#searchResult')
                    var torrent = {}
                        // console.log('*************************')
                        // console.log('NAME', data['0'].children[3].children[3].children[1].children[1].children[0].data)
                        // console.log('MAGNET->', data['0'].children[3].children[3].children[3].attribs.href)
                        // console.log('SEEDS', data['0'].children[3].children[5].children[0].data)
                        // console.log('', data['0'].children[3])
                        // console.log('*************************')
                    torrent.show = show
                    torrent.episode = episode

                    if (data['0']) {
                        torrent.name = data['0'].children[3].children[3].children[1].children[1].children[0].data
                        torrent.magnet = data['0'].children[3].children[3].children[3].attribs.href
                        torrent.seeds = data['0'].children[3].children[5].children[0].data
                        console.log('-------', torrent)
                        resolve(torrent)
                    } else {
                        resolve(0)
                    }

                } else resolve(parseInt(response.statusCode))
            })
        })
    }

    torrent_module['getLocalTorrents'] = function getLocalTorrents() {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('local_torrents.json', (err, data) => {
                if (data) { // Locals exists
                    resolve(JSON.parse(data))
                }
            })
        })
    }

    torrent_module['streamEpisode'] = function streamEpisode(searchObj, $rootScope) {
        $rootScope.msg = 'Searching for' + ' ' + searchObj.show + ' ' + searchObj.episode
        return new Promise(function(resolve, reject) {
            searchTorrent(searchObj)
                .then(function(t) {
                    // console.log('streamEpisode search result ->', t)
                    if (t.name) {
                        $rootScope.msg = 'Loading \n' + t.name
                        $rootScope.$apply()
                        switch (process.platform) {
                            case 'darwin':
                                resolve(exec('webtorrent download "' + t.magnet + '" --vlc'))
                                break
                            case 'win32':
                                resolve(shell.openExternal('webtorrent download "' + t.magnet + '" --vlc'))
                                break
                            case 'win64':
                                resolve(shell.openExternal('webtorrent download "' + t.magnet + '" --vlc'))
                                break
                            default:
                                resolve(exec('webtorrent download "' + t.magnet + '" --vlc'))
                                break
                        }
                    } else {
                        $rootScope.msg = 'This episode in not available'
                        $rootScope.$apply()
                        reject($rootScope.msg)
                    }
                })
        })
    }

    return torrent_module
}

exports['@singleton'] = true
    // exports['@require'] = [
    //     'services/common-service',
    //     'services/subs-service',
    //     'services/json-service',
    //     'services/poster-service'
    // ]
