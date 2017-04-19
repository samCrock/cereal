(function() {
    'use strict';

    angular
        .module('app')
        .service('libraryService', libraryService);

    /* @ngInject */
    function libraryService(wtService, commonService, dbService) {

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
                let shows_db = []

                // THIS VERSION RETURNS DOWNLOADED SHOWS ONLY
                // for (var i = 0; i < shows.length; i++) {
                //     shows_db.push(dbService.get(commonService.spacedToDashed(shows[i])))
                // }

                // Promise.all(shows_db)
                //     .then((show_docs) => {
                //         for (var i = 0; i < show_docs.length; i++) {
                //             if (!show_docs[i].status) {
                //                 // console.log('show_docs', i, show_docs[i])
                //                 library[show_docs[i].Title] = show_docs[i]

                //             }
                //         }
                //         resolve(library)
                //     })
                //     .catch((err) => {
                //         console.error(err)
                //     })


                // THIS RETURNS DB SHOWS AS THEY ARE
                dbService.fetchShows()
                .then((docs)=> {
                    resolve(docs)
                })



            })
        }

        return library_module
    }
})();
