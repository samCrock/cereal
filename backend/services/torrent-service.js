'use strict';

let chalk = require('chalk');
let request = require('request');
let cheerio = require('cheerio');
let ioc = require('../ioc');


exports = module.exports = function(commonService) {

    let torrent_module = {};

    torrent_module['downloadArray'] = function downloadTorrents(tArray) {

        return new Promise(function(resolve, reject) {

            var tPromises = [];
            
            tArray.forEach(function(t) {

                console.log(chalk.magenta('Downloading', "'" + t.title + "'"));
                console.log();


                var parsed = magnet_uri.decode(t.magnet);
                var path = __dirname + '/download/';

                fsExtra.mkdirp(path, function(err) {

                    if (err) return console.error(err)

                    // console.log(chalk.yellow('t.progress --------->', t.progress));
                    // if (t.progress === 1) {
                    //     console.log(chalk.green('Already downloaded!'));
                    // }

                    wt_client.add(t.magnet, {
                        path: path
                    }, function(torrent) {
                        torrent.files.forEach(function(file) {
                            console.log(chalk.green('Started saving ') + file.name);
                            file.getBuffer(function(err, buffer) {
                                if (err) {
                                    console.error('Error downloading ' + file.name);
                                    return;
                                }
                                torrent.on('download', function(chunkSize) {
                                    var output = [
                                        chalk.cyan(''),
                                        chalk.cyan('=================='),
                                        chalk.dim('              Name : ') + torrent.name,
                                        chalk.dim('        Downloaded : ') + formatBytes(torrent.downloaded),
                                        chalk.dim('             Speed : ') + formatBytes(torrent.downloadSpeed) + '/s',
                                        chalk.dim('          Progress : ') + Math.floor(torrent.progress * 100) + '%',
                                        chalk.cyan('==================')
                                    ];
                                    logUpdate(output.join('\n'));
                                })

                                torrent.on('done', function() {
                                    console.log(chalk.bgGreen(torrent.name, ' finished downloading'));
                                })

                            });
                        });
                    });

                });
            });
            resolve();
        });
    }
    torrent_module['searchTorrent'] = function searchTorrent(searchString) {

        return new Promise(function(resolve, reject) {

            // var searchString = json[0].series[0].title + ' ' + json[0].series[0].episode; // First serie first day

            console.log(chalk.yellow('Searching Kickass for: '), chalk.white('"' + searchString + '"'));
            console.log();

            searchString = encodeURIComponent(searchString);

            var path = 'https://kickass.unblocked.tv/usearch/' + searchString;

            request.get(path, function(error, response, body) {
                if (error) reject(error);
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(body);
                    var json = [];
                    var counter = 0;
                    $('tr').filter(function() {
                        var torrent = {};
                        var data = $(this);
                        // if (data['0'].attribs) {
                        if (data['0'].attribs.id && data['0'].attribs.id.match(/torrent_/) && counter < 3) {
                            counter++;
                            var row = data.children();
                            var data_params = row.children()['0'].children[3].next.next.attribs['data-sc-params'];
                            if (data_params) {
                                // var json_obj = replaceAll(data_params, "'", '"');
                                var json_obj = commonService.replaceAll(data_params, "'", '"');
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

                    });
                }
            });
        });
    }

    return torrent_module;
}

exports['@singleton'] = true;
exports['@require'] = ['services/common-service'];
