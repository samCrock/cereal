'use strict'

let chalk = require('chalk')
let request = require('request')
let cheerio = require('cheerio')
let ioc = require('../ioc')
let fsExtra = require('fs-extra')
let magnet_uri = require('magnet-uri')
let WebTorrent = require('webtorrent')
let logUpdate = require('log-update')
let chokidar = require('chokidar')

let wt_client = new WebTorrent()

let jsonService = ioc.create('services/json-service')
let subService = ioc.create('services/subs-service')

exports = module.exports = function(commonService) {

    let torrent_module = {}
    let path = process.cwd() + '/download/'
    let watcher = chokidar.watch(path)

    torrent_module['downloadTorrent'] = function downloadTorrent(t, day_label) {
        return new Promise(function(resolve, reject) {

            // Initialize watcher
            // watcher.on('add', path => console.log(chalk.bgMagenta(`File ${path} has been added\n`)))

            console.log(chalk.magenta("'" + t.title + "'"))
            console.log()

            fsExtra.mkdirp(path, function(err) {

                if (err) return console.error(err)

                wt_client.add(t.magnet, {
                    path: path
                }, function(torrent) {

                    if (torrent.progress != 1) {
                        torrent.files.forEach(function(file) {
                            console.log(chalk.green('Started downloading ') + file.name + '\n')
                            file.getBuffer(function(err, buffer) {
                                if (err) {
                                    console.error('Error downloading ' + file.name)
                                    reject(err)
                                }
                            })
                        })
                    }

                    torrent.on('done', function() {
                        console.log(chalk.bgGreen(torrent.name, ' ready'))
                        console.log()
                        logUpdate.done()

                        subService.search(torrent.name)
                            .then((opts) => {
                                subService.download(opts)
                            })

                        resolve(torrent.name)

                        jsonService.updateLibrary({
                            // date: day_label,
                            // name: string,
                            title: torrent.name,
                            seeds: torrent.seeds,
                            size: torrent.size,
                            released: day_label,
                            extension: t.extension,
                            magnet: torrent.magnet,
                            video_location: torrent.name + '/' + torrent.name + '.' + t.extension,
                            progress: torrent.progress,
                            ready: torrent.progress === 1 ? true : false
                        })
                    })

                    torrent.on('download', function(chunkSize) {
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
                    })

                })

            })
        })
    }


    torrent_module['searchTorrent'] = function searchTorrent(searchString) {
        return new Promise(function(resolve, reject) {

            // var searchString = json[0].series[0].title + ' ' + json[0].series[0].episode; // First serie first day

            console.log(chalk.yellow('Searching Kickass for: '), chalk.white('"' + searchString + '"'))
            console.log()

            searchString = encodeURIComponent(searchString)

            var url = 'https://kickass.unblocked.tv/usearch/' + searchString

            request.get(url, function(error, response, body) {
                if (error) reject(error);
                if (response.statusCode) console.log(chalk.yellow(response.statusCode));
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(body);
                    var json = [];
                    var counter = 0;
                    $('tr').filter(function() {
                        var torrent = {};
                        var data = $(this);
                        // if (data['0'].attribs) {
                        if (data['0'].attribs && data['0'].attribs.id && data['0'].attribs.id.match(/torrent_/) && counter < 3) {
                            counter++
                            var row = data.children()
                            var data_params = row.children()['0'].children[3].next.next.attribs['data-sc-params']
                            if (data_params) {
                                var json_obj = commonService.replaceAll(data_params, "'", '"')
                                json_obj = JSON.parse(json_obj)

                                torrent.title = decodeURIComponent(json_obj.name)
                                torrent.seeds = row[4].children[0].data
                                torrent.size = row.children()['2'].prev.data + row.children()['2'].children[0].data
                                torrent.released = row[3].children[0].data
                                torrent.extension = json_obj.extension
                                torrent.magnet = json_obj.magnet

                                // console.log(chalk.blue(' ----------------------------------------'));
                                // console.log(chalk.blue('Torrent ' + counter + ' ->\n', torrent.title));
                                // console.log(chalk.blue(' ----------------------------------------'));

                                resolve(torrent) // Returns only the first result
                            }

                        }

                    });
                } else resolve()
            });
        });
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

    return torrent_module
}

exports['@singleton'] = true
exports['@require'] = ['services/common-service']
