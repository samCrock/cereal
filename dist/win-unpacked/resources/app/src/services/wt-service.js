(function() {
    'use strict';

    angular
        .module('app')
        .service('wtService', wtService);

    /* @ngInject */
    function wtService() {

        let WebTorrent = require('webtorrent')
        const wt_client = new WebTorrent()

        let wt_module = {}

        wt_module['client'] = function client() {
            return wt_client
        }

        return wt_module
    }
})();
