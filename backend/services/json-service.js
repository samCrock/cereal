'use strict'

let request = require('request')
let cheerio = require('cheerio')
let Promise = require('bluebird')
let fsExtra = require('fs-extra')

let url = 'http://www.pogdesign.co.uk/cat/'
let json

exports = module.exports = function() {

    let json_module = {}

    json_module['updateLibrary'] = function updateLibrary(torrent_object) {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/local_torrents.json', (err, data) => {
                // if (err) throw err;
                var json = []
                if (data) { // Locals exists
                    // console.log(chalk.blue('local_torrents found\n'));
                    json = JSON.parse(data);
                    for (var i = json.length - 1; i >= 0; i--) {
                        if (json[i].title === torrent_object.title && json[i].ready === true) {
                            // console.log(chalk.blue('torrent already downloaded\n'));
                            resolve(json)
                            return
                        }
                    }
                    json.push(torrent_object);
                    // console.log(chalk.bgBlue(JSON.stringify(json)) + '\n');
                    fsExtra.writeFile('./backend/json/local_torrents.json', JSON.stringify(json, null, 4), function(err) {
                        if (err) reject('Cannot write file :', err)
                        // console.log(chalk.blue('new torrent added to locals\n'));
                        // console.log(chalk.blue('Successfully updated local_torrents: ', JSON.stringify(json)));
                        resolve(json)
                    })
                } else { // first entry
                    // console.log(chalk.blue('first local download!\n'));
                    json.push(torrent_object);
                    fsExtra.writeFile('./backend/json/local_torrents.json', JSON.stringify(json, null, 4), function(err) {
                        if (err) reject('Cannot write file :', err)
                        // console.log(chalk.blue('Successfully updated local_torrents: ', JSON.stringify(json)));
                        resolve(json)
                    })
                }
            })

        })
    }


    json_module['month'] = function month() {

        return new Promise(function(resolve, reject) {

            request(url, function(error, response, html) {
                if (!error) {

                    var $ = cheerio.load(html)
                    var json = []

                    $('.day').filter(function() {
                        var date = this.attribs.id
                        date = date.split('_')
                        var date_d = date[1]
                        var date_m = date[2] - 1
                        var date_y = date[3]
                        var date_obj = new Date(date_y, date_m, date_d)
                        var date_label = date_obj.toDateString()
                        var day = {
                            date: date_obj,
                            date_label: date_label,
                            series: []
                        }
                        for (var i = this.children.length - 1; i >= 0; i--) {
                            if (this.children[i].name === 'div' && this.children[i].attribs.class === 'ep info') {
                                var d = this.children[i].children;
                                for (var j = d.length - 1; j >= 0; j--) {
                                    if (d[j].name === 'span') {
                                        var children = d[j].children
                                        for (var k = children.length - 1; k >= 0; k--) {
                                            if (children[k].name === 'p') {
                                                var title = children[k].children[0].children[0].data
                                                var episode = children[k].children[0].next.next.children[0].data
                                                day.series.push({
                                                    title: title,
                                                    episode: episode
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        json.push(day)
                    })

                }
                // Write monthly.json with all the info regarding the series
                fsExtra.writeFile('./backend/json/monthly.json', JSON.stringify(json, null, 4), function(err) {
                    resolve(json)
                })
            })
        })
    }
    return json_module
}

exports['@singleton'] = true
