'use strict';

let express = require('express');
let fs = require('fs');
let fsPath = require('fs-path');
let request = require('request');
let cheerio = require('cheerio');
let Promise = require('bluebird');
let ioc = require('./ioc');
// let WebTorrent = require('webtorrent');
let fsExtra = require('fs-extra');
let magnet_uri = require('magnet-uri');
let logUpdate = require('log-update');
let chalk = require('chalk');

// var wt_client = new WebTorrent();
// var app = express();

var torrentService = ioc.create('services/torrent-service');
var commonService = ioc.create('services/common-service');

// app.get('/scrape', function(req, res) {
// function init() {
return new Promise(function(resolve, reject) {

    let url = 'http://www.pogdesign.co.uk/cat/';

    request(url, function(error, response, html) {
        if (!error) {
            console.log(chalk.dim('Starting..'));

            var $ = cheerio.load(html);
            var json = [];

            // $('.day').filter(function() {
            $('td').filter(function() {
                if (this.attribs && this.attribs.id && this.attribs.id.match(/d_/)) {

                    // console.log($(this));
                    var data = $(this).children();
                    var day = { date_label: '', date: '', series: [] };
                    var date_label = data[0].children[0].attribs.title;
                    var date = data[0].children[0].attribs.href;
                    var date_d, date_m, date_y;
                    date = date.split('./day/')[1];
                    date = date.split('-');
                    date_d = date[0];
                    date_m = date[1] - 1;
                    date_y = date[2];
                    date = new Date(date_y, date_m, date_d);

                    // console.log(' ----------------------------------------');
                    // console.log('| ', date_label);
                    // console.log(' ----------------------------------------');

                    day.date_label = date_label;
                    day.date = date;

                    for (var i = 1; i < data.length; i++) {

                        var title = data[i].children[3].children[0].children[0].data;
                        title = title.split('\r\n        ')[0];
                        var episode = data[i].children[3].children[3].children[0].data;
                        var rex = /\s*[-:p]\s*/;
                        var episode__ = episode.split(rex);
                        // Normalize 
                        if (episode__[1].length === 1) episode__[1] = '0' + episode__[1];
                        if (episode__[4].length === 1) episode__[4] = '0' + episode__[4];
                        episode = episode__[0] + episode__[1] + episode__[2] + episode__[4];

                        day.series.push({
                            title: title,
                            episode: episode
                        });

                        // console.log('    Title ->', title);
                        // console.log('    Ep    -> ', episode);
                        // console.log();

                    }

                    json.push(day);

                }
            });

        }
        // Write monthly.json with all the info regarding the series
        fs.writeFile('monthly.json', JSON.stringify(json, null, 4), function(err) {
            console.log(chalk.yellow('monthly.json file successfully written!'));

            // Search from my favourites
            fs.readFile('./following.json', (err, data) => {
                if (err) throw err;
                console.log(chalk.yellow('following.json found! Searching for today\'s series..'));
                var following = JSON.parse(data);
                var following_torrents = [];

                // dailySeries contains today's series
                var today = new Date();
                today.setDate(today.getDate() - 1); // actually yesterday

                for (var i = json.length - 1; i >= 0; i--) {
                    var nday = json[i].date;
                    if (commonService.sameDay(today, nday)) {

                        console.log(chalk.inverse('-------------------'));
                        console.log(chalk.inverse('| Today\'s series  |'));
                        console.log(chalk.inverse('-------------------'));
                        console.log(json[i].series);
                        console.log();

                        getMatch(json[i].series);
                    }
                }

                // Then cycle through dailySeries to match myFollowing   
                function getMatch(dailySeries) {
                    for (var i = following.length - 1; i >= 0; i--) {
                        var myTitle = following[i].title;
                        // console.log('Current serie:', myTitle);
                        for (var j = dailySeries.length - 1; j >= 0; j--) {
                            if (myTitle.toUpperCase() === dailySeries[j].title.toUpperCase()) { // perfect match is bs!
                                // following_torrents.push(searchTorrent(dailySeries[j].title + ' ' + dailySeries[j].episode));
                                following_torrents.push(torrentService.searchTorrent(dailySeries[j].title + ' ' + dailySeries[j].episode));
                            }
                        }
                    }
                    Promise.all(following_torrents).then(function(results) {
                        console.log(chalk.green(following_torrents.length, 'instances found'));
                        console.log();
                        if (results.length > 0) {
                            // downloadTorrents(results)
                            torrentService.downloadArray(results)
                                .then(function() {
                                    resolve();
                                });
                        } else {
                            console.log(chalk.bgBlack('Nothing to see today'));
                            resolve();
                        }
                    }).catch(function(e) {
                        console.error('That\'s bullshit! ->', e);
                    });

                }

            });
        })

    });
});

// }

// init();

// exports = module.exports = app;
