'use strict'

let request = require('request')
let cheerio = require('cheerio')
let ioc = require('../ioc')
let fsExtra = require('fs-extra')
let magnet_uri = require('magnet-uri')
let WebTorrent = require('webtorrent')
let logUpdate = require('log-update')
let chokidar = require('chokidar')


let jsonService = ioc.create('services/json-service')

exports = module.exports = function() {

    let subs_module = {}
    let path = process.cwd() + '/download/'

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

                            if (lang === 'English' && spliced_search === spliced_title) {
                                // resolve({ link: link, path: path + searchString })
                                resolve({ link: link, path: path + show + '/' + episode })
                            }
                        })
                        // console.log('No suitable subs found')
                    resolve()
                } else reject()
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
                    if (response.statusCode) console.log(response.statusCode)
                    if (!error && response.statusCode == 200) {
                        let $ = cheerio.load(body)
                        let dButton = $('#downloadButton')
                        let downloadUrl = 'http://subscene.com' + dButton['0'].attribs.href
                        let zipTitle = ''

                        console.log()
                        console.log('Download subs in:', path)
                        console.log()

                        $('.release').filter(function() {
                            zipTitle = $(this)['0'].children[3].children[0].data.trim()
                        })

                        request.get(downloadUrl)
                            .pipe(fsExtra.createWriteStream(path + '/' + zipTitle + '.zip'))
                            .on('close', function() {
                                fsExtra.readFile(path + '/' + zipTitle + '.zip', (err, data) => {
                                    if (err) throw err
                                    let zip = new require('node-zip')(data, { base64: false, checkCRC32: true })
                                    let subFile = zip.files[Object.keys(zip.files)[0]]
                                    let subName = zip.files[Object.keys(zip.files)[0]].name
                                    console.log()
                                    fsExtra.writeFile(path + '/' + subName, subFile._data, function(err) {
                                        if (err) reject('Cannot write file :', err)
                                        fsExtra.unlinkSync(path + '/' + zipTitle + '.zip')
                                        console.log('Subs for ' + zipTitle + ' downloaded')
                                        resolve(path + '/' + subName, subFile._data)
                                    })
                                })
                            })
                    }
                })
            } else {
                reject()
            }

        })
    }

    return subs_module
}

exports['@singleton'] = true;
