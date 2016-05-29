'use strict';

let util = require('util')

exports = module.exports = function() {

    let common_module = {};

    common_module['replaceAll'] = function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    common_module['openFile'] = function openFile(filePath) {
        function getCommandLine() {
            switch (process.platform) {
                case 'darwin':
                    return 'open';
                case 'win32':
                    return 'start';
                case 'win64':
                    return 'start';
                default:
                    return 'xdg-open';
            }
        }
        var exec = require('child_process').exec;
        exec(getCommandLine() + ' ' + filePath);
    }

    common_module['getShowTitleFromTorrent'] = function getShowTitleFromTorrent(torrent) {
        let show_title = torrent.title.split(/S[0-9]+E[0-9]+/)
        show_title = show_title[0].slice(0, -1)
        return show_title
    }

    common_module['generateID'] = function getRandomInt() {
        return Math.floor(Math.random() * (999999999 - 1)) + 1;
    }

    common_module['sameDay'] = function sameDay(d1, d2) {
        // let result = d1.getUTCFullYear() == d2.getUTCFullYear() &&
        //     d1.getUTCMonth() == d2.getUTCMonth() &&
        //     d1.getUTCDate() == d2.getUTCDate()
        // console.log(typeof d1, typeof d2)
        // console.log(result)
        // return result
        return d1.toDateString() === d2.toDateString()
    }

    common_module['formatBytes'] = function formatBytes(bytes, decimals) {
        if (bytes == 0) return '0 Byte';
        var k = 1000; // or 1024 for binary
        var dm = decimals + 1 || 3;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
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

    return common_module;
}

exports['@singleton'] = true;
