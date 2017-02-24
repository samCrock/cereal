(function() {
    'use strict';

    angular
        .module('app')
        .service('libraryService', libraryService);

    /* @ngInject */
    function libraryService(wtService, commonService) {

        let request = require('request')
        let cheerio = require('cheerio')
        let Promise = require('bluebird')
        let fsExtra = require('fs-extra')

        let library_module = {}

        const wt_client = wtService.client()

        library_module['getLibrary'] = function getLibrary() {
            return new Promise(function(resolve, reject) {

                let pending = JSON.parse(localStorage.getItem('pending'))
                let isPending
                let library = {}
                let episodes = []
                let shows = fsExtra.readdirSync(__dirname + '/../../library/')

                for (var i = 0; i < shows.length; i++) {
                    library[shows[i]] = []
                    episodes = fsExtra.readdirSync(__dirname + '/../../library/' + shows[i])
                    for (var j = 0; j < episodes.length; j++) {
                        // console.log(shows[i], episodes[j])
                        isPending = false
                        for (var k = 0; k < pending.length; k++) {
                            if (pending[k].show === shows[i] && pending[k].episode === episodes[j]) {
                                isPending = true
                            }
                        }
                        if (!isPending) {
                            library[shows[i]].push({
                                show: shows[i],
                                episode: episodes[j]
                            })
                        }
                    }
                }
                resolve(library)
            })
        }

        return library_module
    }
})();
