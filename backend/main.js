'use strict';

let express = require('express');
let fsExtra = require('fs-extra');
let fsPath = require('fs-path');
let ioc = require('./ioc');
let logUpdate = require('log-update');
let chalk = require('chalk');

// var app = express();

let commonService = ioc.create('services/common-service');
let torrentService = ioc.create('services/torrent-service');
let jsonService = ioc.create('services/json-service');
let subService = ioc.create('services/subs-service')

jsonService.month()
    .then(function(json) {
        console.log(chalk.yellow('monthly.json file successfully written!'))
            // Search from my favourites
        fsExtra.readFile('./backend/json/following.json', (err, data) => {
            if (err) throw err;
            console.log(chalk.yellow('following.json found! Searching for today\'s series..'))
            let following = JSON.parse(data)
            let following_torrents = []

            // dailySeries contains today's series
            let today = new Date()

            for (var i = process.argv.length - 1; i >= 0; i--) {
                process.argv[i]
                console.log(chalk.bgGreen(process.argv[i]))
            }
            
            let searchDay = process.argv[2] ? process.argv[2] : 1
            today.setDate(today.getDate() - searchDay); // actually yesterday

            // console.log(json)
            for (var i = json.length - 1; i >= 0; i--) {
                var nday = json[i].date

                if (commonService.sameDay(today, nday)) {

                    console.log()
                    console.log(chalk.inverse(json[i].date_label))
                    console.log(json[i].series)
                    console.log()

                    getMatch(json[i])
                }
            }

            // Then cycle through dailySeries to match myFollowing   
            function getMatch(day) {
                var dailySeries = day.series;
                for (var i = following.length - 1; i >= 0; i--) {
                    var myTitle = following[i].title;
                    for (var j = dailySeries.length - 1; j >= 0; j--) {
                        if (myTitle.toUpperCase() === dailySeries[j].title.toUpperCase()) { // perfect match is bs!
                            following_torrents.push(torrentService.searchTorrent({
                                serie: dailySeries[j].title, 
                                episode: dailySeries[j].episode
                            }));
                        }
                    }
                }
                Promise.all(following_torrents).then(function(results) {
                    console.log()
                    console.log(chalk.green(results.length, 'instances found'))
                    console.log()
                    let torrentsArray = []
                    if (results.length > 0) {
                        for (var i = results.length - 1; i >= 0; i--) {
                            torrentsArray.push(torrentService.downloadTorrent(results[i]))
                        }
                        Promise.all(torrentsArray).then((results) => {
                            console.log(chalk.green('Done\n'))
                        })
                    } else {
                        return console.log(chalk.bgBlack('Nothing to see today'))
                    }
                }).catch(function(e) {
                    return console.error(chalk.red('That\'s bullshit! ->', e))
                })

            }

        })
    })

// subService.search("Silicon.Valley.S03E05.720p.HDTV.x264-AVS[rarbg]")
// .then( (link) => {
//     subService.download(link)
// })
