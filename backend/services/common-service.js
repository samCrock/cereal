'use strict';

const os = require('os')
const { shell } = require('electron')

exports = module.exports = function() {

    let common_module = {};

    common_module['replaceAll'] = function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    common_module['openFile'] = function openFile(filePath) {
        let util = require('util');
        let exec = require('child_process').exec;
        let platform = os.platform()
        switch (process.platform) {
            case 'darwin':
                return exec('open ' + filePath)
            case 'win32':
                return shell.openExternal(filePath)
            case 'win64':
                return shell.openExternal(filePath)
            default:
                return exec('xdg-open ' + filePath)
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

    common_module['sameDay'] = function sameDay(d1, d2) {
        // console.log(d1.toDateString(), d2.toDateString())
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
