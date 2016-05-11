'use strict';

exports = module.exports = function() {

    let common_module = {};

    common_module['replaceAll'] = function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    common_module['sameDay'] = function sameDay(d1, d2) {
        return d1.getUTCFullYear() == d2.getUTCFullYear() &&
            d1.getUTCMonth() == d2.getUTCMonth() &&
            d1.getUTCDate() == d2.getUTCDate();
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
