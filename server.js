'use strict';

var express = require('express');
var fs = require('fs');
var fsPath = require('fs-path');
var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var ioc = require('./ioc');
var WebTorrent = require('webtorrent');
let fsExtra = require('fs-extra');
let magnet_uri = require('magnet-uri');

// var sys = require('sys');
// var exec = require('child_process').exec;

var wt_client = new WebTorrent();

var app = express();

// app.get('/scrape', function(req, res) {
function init() {

    let url = 'http://www.pogdesign.co.uk/cat/';

    request(url, function(error, response, html) {
        if (!error) {
            console.log('Started..');

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
            console.log('File successfully written! - Check your project directory for the monthly.json file');

            // Search from my favourites
            fs.readFile('./following.json', (err, data) => {
                if (err) throw err;
                console.log('following.json found! Searching for today\'s series..');
                var following = JSON.parse(data);
                var following_torrents = [];

                // dailySeries contains today's series
                var today = new Date();
                today.setDate(today.getDate() - 1); // actually yesterday

                for (var i = json.length - 1; i >= 0; i--) {
                    var nday = json[i].date;
                    if (sameDay(today, nday)) {
                        console.log('-------------------');
                        console.log('| Today\'s series  |');
                        console.log('-------------------');
                        console.log(json[i].series);
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
                                following_torrents.push(searchTorrent(dailySeries[j].title + ' ' + dailySeries[j].episode));
                            }
                        }
                    }
                    Promise.all(following_torrents).then(function(results) {
                        console.log(following_torrents.length, 'instances found');
                        if (results.length > 0) {
                            downloadTorrents(results).then(function() {});
                        } else {
                            console.log('Nothing to see today');
                        }
                    }).catch(function(e) {
                        console.error('That\'s bullshit! ->', e);
                    });

                }

            });
        })

        // res.send(json)

    });
}

function searchTorrent(searchString) {

    return new Promise(function(resolve, reject) {

        // var searchString = json[0].series[0].title + ' ' + json[0].series[0].episode; // First serie first day

        console.log('Searching Kickass for: ', '"' + searchString + '"');

        searchString = encodeURIComponent(searchString);

        var path = 'https://kickass.unblocked.tv/usearch/' + searchString;

        request.get(path, function(error, response, body) {
            if (error) reject(error);
            if (!error && response.statusCode == 200) {
                // console.log(body);
                var $ = cheerio.load(body);
                var json = [];

                // $('td').filter(function() {
                var counter = 0;
                $('tr').filter(function() {
                    // return this.id.match(/torrent_/);
                    var torrent = {};
                    var data = $(this);

                    // if (data['0'].attribs) {
                    if (data['0'].attribs.id && data['0'].attribs.id.match(/torrent_/) && counter < 3) {
                        counter++;
                        var row = data.children();
                        var data_params = row.children()['0'].children[3].next.next.attribs['data-sc-params'];
                        if (data_params) {
                            var json_obj = replaceAll(data_params, "'", '"');
                            json_obj = JSON.parse(json_obj);

                            torrent.title = decodeURIComponent(json_obj.name);
                            torrent.seeds = row[4].children[0].data;
                            torrent.size = row.children()['2'].prev.data + row.children()['2'].children[0].data;
                            torrent.released = row[3].children[0].data;
                            torrent.extension = json_obj.extension;
                            torrent.magnet = json_obj.magnet;

                        }
                        // console.log(' ----------------------------------------');
                        // console.log('Torrent ' + counter + ' ->\n', torrent);

                        // console.log(' ----------------------------------------');

                        resolve(torrent); // Returns only the first result
                    }

                    // json.push(day);

                });
            }
        });
    });
}


function downloadTorrents(tArray) {
    return new Promise(function(resolve, reject) {
        tArray.forEach(function(t) {
            console.log('Downloading', "'" + t.title + "'");

            var parsed = magnet_uri.decode(t.magnet);
            // console.log(parsed.dn);
            var path = __dirname + '/download/';
            fsExtra.mkdirp(path, function(err) {
                if (err) return console.error(err)
                wt_client.add(t.magnet, {
                    path: path
                }, function(torrent) {
                    torrent.files.forEach(function(file) {
                        console.log('Started saving ' + file.name);
                        file.getBuffer(function(err, buffer) {
                            if (err) {
                                console.error('Error downloading ' + file.name)
                                return
                            }
                            fs.writeFile(file.name, buffer, function(err) {
                                console.log('Finished downloading ' + file.name);
                                torrent.on('download', function(chunkSize) {
                                    console.log('chunk size: ' + chunkSize);
                                    console.log('total downloaded: ' + torrent.downloaded);
                                    console.log('download speed: ' + torrent.downloadSpeed);
                                    console.log('progress: ' + torrent.progress);
                                    console.log('======');
                                })
                            });

                            torrent.on('done', function() {
                                console.log(torrent, ' finished downloading');
                            })

                        });
                    });
                });

            });
        });
        resolve();
    });
}


// Utils
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}


function sameDay(d1, d2) {
    return d1.getUTCFullYear() == d2.getUTCFullYear() &&
        d1.getUTCMonth() == d2.getUTCMonth() &&
        d1.getUTCDate() == d2.getUTCDate();
}

function prevWeek(d1, d2) {
    return d1.getUTCFullYear() == d2.getUTCFullYear() &&
        d1.getUTCMonth() == d2.getUTCMonth() &&
        d1.getUTCDate() == d2.getUTCDate();
}





// app.listen('8081')
// console.log('Magic happens on port 8081');
init();
exports = module.exports = app;
