(function() {
    'use strict';

    angular
        .module('app')
        .service('subsService', subsService);

    /* @ngInject */
    function subsService($q, $http, commonService) {

        let request = require('request')
        let cheerio = require('cheerio')
        let fsExtra = require('fs-extra')
        let magnet_uri = require('magnet-uri')
        let WebTorrent = require('webtorrent')
        let logUpdate = require('log-update')
        let chokidar = require('chokidar')
        let srt2vtt = require('srt2vtt')

        let subs_module = {}
        let path = process.cwd() + '/library/'

        subs_module['search'] = function search(searchObj) {
            return new Promise(function(resolve, reject) {

                let fileName = searchObj.fileName
                let show = searchObj.show
                let episode = searchObj.episode
                console.log('Searching Subscene for: ' + fileName)
                console.log('                  Show: ' + show)
                console.log('                    Ep: ' + episode)

                let searchString = encodeURIComponent(fileName)

                var url = 'http://subscene.com/subtitles/release?q=' + searchString;
                request.get(url, function(error, response, body) {
                    if (error || !response) reject(error)
                    if (response && response.statusCode) console.log(response.statusCode)
                    if (!error && response.statusCode == 200) {
                        var $ = cheerio.load(body)
                        var json = []
                        var counter = 0
                        var best_match = {
                            similarity: 0,
                            value: {}
                        }
                        $('.a1').filter(function() {
                            var data = $(this)
                            var link = data['0'].children[1].attribs.href
                            var lang = data['0'].children[1].children[1].children[0].data
                            lang = lang.trim()
                            var title = data['0'].children[1].children[3].children[0].data
                            title = title.trim()

                            var spliced_title = title.split('-')
                            spliced_title = spliced_title[0]
                            var spliced_search = searchString.split('-')
                            spliced_search = spliced_search[0]

                            let similarity = commonService.calculateSimilarity(fileName, spliced_title)
                            // console.log(fileName, '->', spliced_title)
                            // console.log('Subs strings similarity ->', similarity)
                            if (lang === 'English' && similarity > best_match.similarity) {
                                best_match = {
                                    similarity: similarity,
                                    value: {
                                        link: link,
                                        path: path + show + '/' + episode
                                    }
                                }
                                console.log('Found sub:', spliced_title)
                            }
                        })
                        resolve(best_match.value)
                    } else reject(error)
                })
            })
        }

        subs_module['download'] = function download(opts) {
            return new Promise(function(resolve, reject) {
                if (opts) {
                    let path = decodeURIComponent(opts.path)
                    let link = opts.link
                    let url = 'http://subscene.com' + link
                    request.get(url, function(error, response, body) {
                        if (error) reject(error)
                        if (!error && response.statusCode == 200) {
                            let $ = cheerio.load(body)
                            let dButton = $('.download')['0']

                            let libraryUrl = 'http://subscene.com' + dButton.children[1].attribs.href
                            let zipTitle = ''

                            $('.release').filter(function() {
                                zipTitle = $(this)['0'].children[3].children[0].data.trim()
                            })

                            request.get(libraryUrl)
                                .pipe(fsExtra.createWriteStream(path + '/' + zipTitle + '.zip'))
                                .on('close', function() {
                                    fsExtra.readFile(path + '/' + zipTitle + '.zip', (err, data) => {
                                        if (err) throw err
                                        let zip = new require('node-zip')(data, {
                                            base64: false,
                                            checkCRC32: true
                                        })
                                        let subFile = zip.files[Object.keys(zip.files)[0]]
                                        let subName = zip.files[Object.keys(zip.files)[0]].name

                                        fsExtra.outputFile(path + '/' + subName, subFile._data, function(err) {
                                            if (err) reject('Cannot write file :', err)
                                            fsExtra.unlinkSync(path + '/' + zipTitle + '.zip')
                                            console.log('Subs downloaded in:', path)
                                            var res = path + '/' + subName
                                            var srtData = fsExtra.readFileSync(res)
                                            srt2vtt(srtData, function(err, vttData) {
                                                if (err) throw new Error('Error converting subs:', err)
                                                fsExtra.outputFileSync(res.substring(0, res.length - 4) + '.vtt', vttData)
                                                resolve(res)
                                            })
                                        })

                                    })
                                })
                        }
                    })
                } else {
                    reject('No subs found')
                }

            })
        }

        return subs_module
    }
})();
