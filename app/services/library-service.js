(function() {
    'use strict';

    angular
        .module('app')
        .service('libraryService', libraryService);

    /* @ngInject */
    function libraryService(wtService) {

        let request = require('request')
        let cheerio = require('cheerio')
        let Promise = require('bluebird')
        let fsExtra = require('fs-extra')

        let library_module = {}

        const wt_client = wtService.client()

        library_module['getLibrary'] = function getLibrary() {
            return new Promise(function(resolve, reject) {
                if (localStorage.getItem('library')) {
                    let library = JSON.parse(localStorage.getItem('library'))
                    let formattedLibrary = {}
                    for (var i = 0; i < library.length; i++) {
                        if (!formattedLibrary[library[i].show]) {
                            formattedLibrary[library[i].show] = []
                            formattedLibrary[library[i].show].push(library[i])
                        } else {
                            formattedLibrary[library[i].show].push(library[i])
                        }
                    }
                    resolve(formattedLibrary)
                }
            })
        }

        // // Returns all shows w/ all episodes
        // library_module['getLibrary'] = function getLibrary() {
        //     return new Promise(function(resolve, reject) {
        //         let library = []
        //         fsExtra.readdirSync('./data/shows')
        //             .filter((file) => {
        //                 let dashedShowName = file.split('.json')
        //                 dashedShowName = dashedShowName[0]
        //                 let showName = dashedShowName.split(' ').join('-')
        //                 let show = {
        //                     title: showName,
        //                     poster: './assets/posters/' + dashedShowName + '.jpg',
        //                     episodes: []
        //                 }
        //                 fsExtra.readFile('./data/shows/' + file, (err, showEpisodes) => {
        //                     if (err) throw err
        //                     if (showEpisodes) {
        //                         let episodes = JSON.parse(showEpisodes)
        //                         show.episodes = episodes
        //                     }
        //                 })
        //                 library.push(show)
        //             })
        //         resolve(library)
        //
        //     })
        // }


        return library_module
    }
})();
