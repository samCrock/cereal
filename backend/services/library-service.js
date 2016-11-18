'use strict'

let request = require('request')
let cheerio = require('cheerio')
let Promise = require('bluebird')
let fsExtra = require('fs-extra')

let wtService = ioc.create('services/wt-service')


exports = module.exports = function(commonService) {

    let library_module = {}
    
    const wt_client = wtService.client()

    // Returns all shows w/ all episodes
    library_module['getLibrary'] = function getLibrary() {
        return new Promise(function(resolve, reject) {
            let library = []
            fsExtra.readdirSync('./backend/json/episodes')
                .filter((file) => {
                    let dashedShowName = file.split('.json')
                    dashedShowName = dashedShowName[0]
                    let showName = dashedShowName.split(' ').join('-')
                    let show = {
                        title: showName,
                        poster: './res/posters/' + dashedShowName + '.jpg',
                        episodes: []
                    }
                    fsExtra.readFile('./backend/json/episodes/' + file, (err, showEpisodes) => {
                        if (err) throw err
                        if (showEpisodes) {
                            let episodes = JSON.parse(showEpisodes)
                            show.episodes = episodes
                        }
                    })
                    library.push(show)
                })
            resolve(library)

        })
    }


    return library_module
}

exports['@singleton'] = true
exports['@require'] = ['services/common-service']
