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

    common_module['getDayObject'] = function getDayObject(date) {
        let m_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        let d_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        let myDate = new Date(date)
        myDate.setDate(myDate.getDate() + 7)
        let curr_date = myDate.getDate()
        let curr_month = myDate.getMonth() - 1
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

    return common_module;
}

exports['@singleton'] = true;
