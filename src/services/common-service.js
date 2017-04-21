(function() {
    'use strict';

    angular
        .module('app')
        .service('commonService', commonService);

    /* @ngInject */
    function commonService(wtService) {

        const os = require('os')
        const {
            shell
        } = require('electron')
        let fsExtra = require('fs-extra')

        let common_module = {};

        common_module['mapRange'] = function mapRange(value, low1, high1, low2, high2) {
            return Math.round(low2 + (high2 - low2) * (value - low1) / (high1 - low1))
        }
   
        common_module['findAlias'] = function findAlias(show) {
            return new Promise((resolve, reject) => {
                fsExtra.readFile(__dirname + '/../../data/aliases.json', 'utf-8', (err, data) => {
                    if (err) reject('Cannot find aliases.json')
                    let aliases = JSON.parse(data)
                    for (var key in aliases) {
                        if (key === show) {
                            console.log('Found alias:', key, aliases[key])
                            resolve(aliases[key])
                        }
                    }
                    reject(show)
                })
            })
        }

        common_module['findAliasSync'] = function findAliasSync(show) {
            // console.log('Checking for aliases', show)
            var data = fsExtra.readFileSync(__dirname + '/../../data/aliases.json', 'utf-8')
            let aliases = JSON.parse(data)
            for (var key in aliases) {
                if (key === show) {
                    console.log('Found alias:', key, aliases[key])
                    return aliases[key]
                }
            }
            return show
        }


        common_module['areMatching'] = function areMatching(target, matcher) {
            target = target.toLowerCase()
            matcher = matcher.toLowerCase().split('.').join(' ')
                // console.log(target, ':', matcher)
            return matcher.indexOf(target) > -1
        }

        // Compare strings similarity. Based on Levenshtein distance
        common_module['calculateSimilarity'] = function calculateSimilarity(s1, s2) {
            var longer = s1;
            var shorter = s2;
            if (s1.length < s2.length) {
                longer = s2;
                shorter = s1;
            }
            var longerLength = longer.length;
            if (longerLength == 0) {
                return 1.0;
            }
            return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);

            function editDistance(s1, s2) {
                s1 = s1.toLowerCase();
                s2 = s2.toLowerCase();

                var costs = new Array();
                for (var i = 0; i <= s1.length; i++) {
                    var lastValue = i;
                    for (var j = 0; j <= s2.length; j++) {
                        if (i == 0)
                            costs[j] = j;
                        else {
                            if (j > 0) {
                                var newValue = costs[j - 1];
                                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                                    newValue = Math.min(Math.min(newValue, lastValue),
                                        costs[j]) + 1;
                                costs[j - 1] = lastValue;
                                lastValue = newValue;
                            }
                        }
                    }
                    if (i > 0)
                        costs[s2.length] = lastValue;
                }
                return costs[s2.length];
            }
        }


        common_module['replaceAll'] = function replaceAll(str, find, replace) {
            return str.replace(new RegExp(find, 'g'), replace);
        }

        common_module['capitalCase'] = function capitalCase(str) {
            let splitChar = ' '
            if (str.indexOf('-') > -1) splitChar = '-'
            let array = str.split(splitChar)
            let result = ''
            for (var i = 0; i < array.length; i++) {
                result = result + array[i].charAt(0).toUpperCase() + array[i].slice(1) + ' '
            }
            return result.trim()
        }

        common_module['openFile'] = function openFile(filePath) {
            let util = require('util');
            let exec = require('child_process').exec;
            let platform = os.platform()
            switch (process.platform) {
                case 'darwin':
                    return exec('open "' + filePath + '"')
                case 'win32':
                    return shell.openExternal('"' + filePath + '"')
                case 'win64':
                    return shell.openExternal('"' + filePath + '"')
                default:
                    return exec('xdg-open ' + '"' + filePath + '"')
            }
        }

        common_module['stream'] = function stream(streamObj) {
            let util = require('util');
            let exec = require('child_process').exec;
            let platform = os.platform()
            let magnet = streamObj.magnet
            let path = streamObj.path
            console.log('webtorrent download --vlc ' + ' "' + magnet + '" ' + '--out' + ' "' + path + '"')
            exec('webtorrent download --vlc ' + ' "' + magnet + '" ' + '--out' + ' "' + path + '"')
        }

        common_module['getDayObject'] = function getDayObject(date) {
            let m_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            let d_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            let myDate = new Date(date)
            myDate.setDate(myDate.getDate())
            let curr_date = myDate.getDate()
            let curr_month = myDate.getMonth()
            let curr_day = myDate.getDay()
            return {
                dotw: d_names[curr_day],
                month: m_names[curr_month],
                dotm: curr_date,
                date: date
            }

        }

        common_module['getShowTitleFromTorrent'] = function getShowTitleFromTorrent(torrent) {
            let show_title = torrent.title.split(/S[0-9]+E[0-9]+/)
            show_title = show_title[0].slice(0, -1)
            return show_title
        }

        common_module['generateID'] = function getRandomInt() {
            return Math.floor(Math.random() * (999999999 - 1)) + 1;
        }

        common_module['daysToNow'] = function daysToNow(d) {
            let now = new Date()
            let dtn = new Date(d)
            return Math.round((now - dtn) / (1000 * 60 * 60 * 24))
        }

        common_module['timePassed'] = function timePassed(d) {

            var date1 = new Date()
            d = new Date(d)

            var diff = Math.floor(date1.getTime() - d.getTime())
            var day = 1000 * 60 * 60 * 24

            var days = Math.floor(diff / day)
            var months = Math.floor(days / 31)
            var years = Math.floor(months / 12)
            var message = ''

            if (days !== 0) { message = days + " days ago" }
            if (days == 1) { message = "Yesterday" }
            if (days == 0) { message = "Today" }
            if (months !== 0) { message = months + " months ago" }
            if (months == 1) { message = months + " month ago" }
            if (years !== 0) { message = years + " years ago" }
            if (years == 1) { message = years + " year ago" }

            if (years < 0 || months < 0 || days < 0) message = this.getDayObject(d).dotm + ' ' + this.getDayObject(d).month
            return message
        }

        common_module['formatBytes'] = function formatBytes(bytes, decimals) {
            if (bytes == 0) return '0 Byte';
            var k = 1000; // or 1024 for binary
            var dm = decimals + 1 || 3;
            var sizes = ['Bytes', 'Kb', 'Mb', 'Gb'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        common_module['formatTime'] = function formatTime(millis) {
            var str = '';
            var date = new Date(millis);
            var days = date.getUTCDate() - 1;
            var hours = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            var seconds = date.getUTCSeconds();

            if (days != 0) str += days + 'd ';
            if (hours != 0) str += hours + 'h ';
            if (minutes != 0) str += minutes + 'm ';
            if (seconds != 0) str += seconds + 's ';
            return str;
        }

        common_module['dateFromLabel'] = function dateFromLabel(label) {
            let date = label.split(',')
            let month
            date = date[1]
            date = label.split(' ')
            date.filter((token, i) => {
                if (token === '') date.splice(i, 1)
            })
            let dateObj = {
                label: date[2] + ' ' + date[1],
                wDay: date[0].replace(',', ''),
                month: date[1],
                mDay: date[2],
                year: date[3]
            }
            switch (dateObj.month) {
                case 'Jan':
                    month = 0
                    break
                case 'Feb':
                    month = 1
                    break
                case 'Mar':
                    month = 2
                    break
                case 'Apr':
                    month = 3
                    break
                case 'May':
                    month = 4
                    break
                case 'Jun':
                    month = 5
                    break
                case 'Jul':
                    month = 6
                    break
                case 'Aug':
                    month = 7
                    break
                case 'Sep':
                    month = 8
                    break
                case 'Oct':
                    month = 9
                    break
                case 'Nov':
                    month = 10
                    break
                case 'Dec':
                    month = 11
                    break
            }
            dateObj.date_object = new Date(date[3], month, date[2])
                // console.log(dateObj)
            return dateObj
        }

        common_module['dashedToSpaced'] = function dashedToSpaced(dashed) {
            return dashed.toLowerCase().split('-').join(' ')
        }
        common_module['spacedToDashed'] = function spacedToDashed(spaced) {
                let niceAndSpaced = spaced.toLowerCase().split('.').join('')
                return niceAndSpaced.split(' ').join('-')
            }
            // Takes an array of downloaded torrents w/ dates and returns an array of 'ranged' group of torrents (e.g  last week)
        common_module['putInRange'] = function putInRange(completed) {
            let today = []
            let last_week = []
            let last_month = []
            let last_year = []
            let older = []
            let no_date = []
            let now = new Date()
            let ranges = {}
            completed.filter((torrent) => {
                let t = new Date(torrent.date)
                let diff = now.getTime() - t.getTime()
                let days = Math.floor(diff / (1000 * 60 * 60 * 24))
                console.log(torrent.title, days)
                if (days == 1) {
                    today.push(torrent)
                } else if (days > 1 && days < 8) {
                    last_week.push(torrent)
                } else if (days >= 8 && days < 31) {
                    last_month.push(torrent)
                } else if (days >= 31 && days < 365) {
                    last_year.push(torrent)
                } else if (days >= 365) {
                    older.push(torrent)
                } else {
                    no_date.push(torrent)
                }
            })
            ranges.today = {
                label: 'Today',
                data: today
            }
            ranges.last_week = {
                label: 'Last Week',
                data: last_week
            }
            ranges.last_month = {
                label: 'Last Month',
                data: last_month
            }
            ranges.last_year = {
                label: 'Last Year',
                data: last_year
            }
            ranges.older = {
                label: 'Older',
                data: older
            }
            ranges.no_date = {
                label: 'No date',
                data: no_date
            }
            return ranges
        }

        return common_module;
    }
})();