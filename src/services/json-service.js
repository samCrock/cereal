(function() {
  'use strict';

  angular
    .module('app')
    .service('jsonService', jsonService);

  /* @ngInject */
  function jsonService(commonService, $rootScope, $interval, $mdToast, dbService) {

    let request = require('request')
    let cheerio = require('cheerio')
    let Promise = require('bluebird')
    let fsExtra = require('fs-extra')
    let PouchDB = require('pouchdb-browser')

    let json
    let json_module = {}

    // Returns all downloaded poster show names
    json_module['getLocalPosters'] = function getLocalPosters() {
      return new Promise(function(resolve, reject) {
        let local_posters = []
        // console.log(__dirname + '/../../assets/posters')
        fsExtra.mkdirp(__dirname + '/../../assets/posters')
        fsExtra.readdirSync(__dirname + '/../../assets/posters')
          .filter((file) => {
            let dashedShowName = file.split('.jpg')
            dashedShowName = dashedShowName[0]
            local_posters.push(dashedShowName)
          })
        resolve(local_posters)
      })
    }

    // Get youtube trailer from show title
    json_module['getYTTrailer'] = function getYTTrailer(show) {
      return new Promise(function(resolve, reject) {
        show = show.toLowerCase().split(' ').join('+')
        request('https://www.youtube.com/results?search_query=' + show + 'show+trailer', function(error, response, body) {
          if (!error) {
            console.log('YT url: ', 'https://www.youtube.com/results?search_query=' + show + '+trailer')
            console.log('Trailer candidates')
            let $ = cheerio.load(body)
            console.log('YouTube results ->', $('.item-section')['0'])
            let firstResultId = $('.item-section')['0'].children[1].children[0].attribs['data-context-item-id']
            if (!firstResultId) firstResultId = $('.item-section')['0'].children[3].children[0].attribs['data-context-item-id']
            console.log('YouTube first result id->', firstResultId)
            let url = 'https://www.youtube.com/watch?v=' + firstResultId
            console.log('Url ->', url)
            resolve(url)
          } else {
            reject()
          }
        })
      })
    }

    // Writes and returns target show episode list
    let getShow = json_module['getShow'] = function getShow(show) {
      return new Promise(function(resolve, reject) {

        dbService.get(show)
          .then((showJson) => {
            // showJson.Updated = new Date('11/11/2011')
            // console.log('From DB ->', showJson)
            if (commonService.daysToNow(showJson.Updated) === 0) {
              console.log('Local data is fresh!')
              resolve(showJson)
            } else {
              if (showJson.Updated) {
                console.log('Updating show latest info', showJson.Updated, commonService.daysToNow(showJson.Updated))
                resolve(showJson)
                updateRemote(show)
              } else {
                console.log('Adding new show')
                retrieveRemote(show)
              }

            }
          })
          .catch(() => {
            commonService.findAlias(show)
              .then((result) => {
                show = result
                console.log('Adding new aliased show')
                retrieveRemote(show)
              })
              .catch(() => {
                console.log('Adding new show')
                retrieveRemote(show)
              })
          })
          // })

        function retrieveRemote(dashed_title) {

          let urlMain = 'https://trakt.tv/shows/' + dashed_title

          console.log('https://trakt.tv/shows/' + dashed_title)

          request.get({
            url: urlMain
          }, function(error, response, body) {

            if (error || !response || !response.statusCode) return (error)

            console.log('Status', response.statusCode);

            if (response.statusCode !== 200) reject(response.statusCode)

            if (!error && response.statusCode === 200) {
              let $ = cheerio.load(body)
              let showJson
              let seasons, network, premiered, runtime, genres, overview, trailer, title, wallpaper, poster
              let genresArray = []
              if ($('.additional-stats')['0'] && $('.additional-stats')['0'].children[0]) {

                poster = $('.sidebar')['0'].children[0].children[1].attribs['data-original']

                // title = commonService.capitalCase(show)
                seasons = $('.season-count')[1].attribs['data-all-count']
                network = $('.additional-stats')['0'].children[0].children[4] ? $('.additional-stats')['0'].children[0].children[4].data : ''
                network = network.split(' on ')
                network = network[1]
                  // console.log('overview', $('#overview'))
                genres = $('#overview')['0'].children[2].children[0].children[0].children[6] ? $('#overview')['0'].children[2].children[0].children[0].children[6].children : []
                premiered = $('#overview')['0'].children[2].children[0].children[0].children[1].children[2] ? $('#overview')['0'].children[2].children[0].children[0].children[1].children[2].attribs.content : ''
                overview = $('#overview')[1].children[0].children[0].data
                trailer = $('.affiliate-links')['0'].children[0] ? $('.affiliate-links')['0'].children[0].children[1].attribs.href : ''
                runtime = $('#overview')['0'].children[2].children[0].children[0].children[2].children[1].data
                runtime = runtime ? runtime.split(' mins').join('') : ''
                genres.filter((genre, i) => {
                  if (i % 2 && i !== 0 && genre.children) genresArray.push(genre.children[0].data)
                })
                wallpaper = $('#summary-wrapper')['0'].attribs['data-fanart']
                console.log('##########################')
                console.log('SpacedTitle :', commonService.dashedToSpaced(dashed_title))
                console.log('DashedTitle :', dashed_title)
                console.log('Seasons     :', seasons)
                console.log('Network     :', network)
                console.log('Premiered   :', premiered)
                console.log('Runtime     :', runtime)
                console.log('Genres      :', genresArray)
                console.log('Overview    :', overview)
                console.log('Trailer     :', trailer)
                console.log('Wallpaper   :', wallpaper)
                console.log('Poster      :', poster)
                console.log('##########################')
                showJson = {
                  Updated: new Date,
                  SpacedTitle: commonService.dashedToSpaced(dashed_title),
                  DashedTitle: dashed_title,
                  Network: network,
                  Premiered: premiered,
                  Runtime: runtime,
                  Genres: genresArray,
                  Overview: overview,
                  Trailer: trailer,
                  Wallpaper: wallpaper,
                  Poster: poster,
                  Seasons: {}
                }
              }

              $rootScope.$broadcast('show_overview', {
                show: showJson
              })

              let currentSeason = seasons
              let seasonPromises = []
              let lastSeason

              $interval(() => {
                if (lastSeason !== currentSeason && currentSeason !== 0) {
                  lastSeason = currentSeason
                  let urlSeason = 'https://trakt.tv/shows/' + show + '/seasons/' + currentSeason
                  request.get({
                    url: urlSeason
                  }, function(error, response, body) {
                    if (!error) {
                      getSeason(error, response, body)
                      currentSeason--
                    }
                  })
                }
              }, 200)

              function getSeason(error, response, body) {
                if (error || !response) return reject(error)
                if (!error && response.statusCode == 200) {

                  let $ = cheerio.load(body)

                  currentSeason = $('.selected')[2].children[0].data
                  showJson.Seasons[currentSeason] = {}
                  let episode = 1

                  for (var i = 1; i < $('.titles').length; i++) {

                    if ($('.titles')[i].children.length == 2 && $('.titles')[i].children[0].children[1]) {
                      let title
                      let date = $('.titles')[i].children[1].children[0].children[0].children[0].data
                      if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                      let ep = $('.titles')[i].children[0].children[1].children[0].children[0].data
                      if ($('.titles')[i].children[0].children[1].children[2].children[0]) {
                        title = $('.titles')[i].children[0].children[1].children[2].children[0].data
                      }
                      if (ep.length == 4) ep = '0' + ep
                      ep = ep.slice(0, 2) + ep.slice(3)
                      ep = ep.slice(0, 2) + 'e' + ep.slice(2)
                      ep = 's' + ep

                      showJson.Seasons[currentSeason][episode] = {
                        episode: ep,
                        title: title,
                        date: date
                      }
                      episode++
                    } else if ($('.titles')[i].children.length == 6) {
                      let date = $('.titles')[i].children[1].children[0].children[0].data
                      if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                      let ep = $('.titles')[i].children[2].children[0].children[0].data
                      let title = $('.titles')[i].children[2].children[2].children[0].data
                      if (ep.length == 4) ep = '0' + ep
                      ep = ep.slice(0, 2) + ep.slice(3)
                      ep = ep.slice(0, 2) + 'e' + ep.slice(2)
                      ep = 's' + ep
                      showJson.Seasons[currentSeason][episode] = {
                        episode: ep,
                        title: title,
                        date: date
                      }
                      episode++
                    }
                  }

                  let valid = false
                  for (var ep in showJson.Seasons) {
                    if (ep.hasOwnProperty(showJson.Seasons)) {
                      console.log(ep + " -> " + showJson.Seasons[ep])
                    }
                  }

                  console.log('Saved seasons:', Object.keys(showJson.Seasons).length, '/', seasons)
                  $mdToast.show($mdToast.simple().textContent('Saved seasons: ' + Object.keys(showJson.Seasons).length + ' / ' + seasons))
                  if (Object.keys(showJson.Seasons).length === parseInt(seasons)) {
                    // let db = new PouchDB('cereal')
                    dbService.put(show, showJson)
                      .then(() => {
                        $rootScope.$broadcast('show_ready', showJson)
                      })
                      .catch((err) => {
                        console.error(err)
                        reject(err)
                      })
                  }
                } else {
                  reject(response.statusCode)
                }
              }

            } else reject('Status:', response.statusCode)
          })
        }
      })
    }


    let updateRemote = function(show) {
      dbService.get(show)
        .then((showJson) => {

          let urlMain = 'https://trakt.tv/shows/' + show
          console.log('https://trakt.tv/shows/' + show)

          request.get({
            url: urlMain
          }, function(error, response, body) {

            console.log('Status', response.statusCode);

            if (response.statusCode !== 200) reject(response.statusCode)

            if (!error && response.statusCode === 200) {
              let $ = cheerio.load(body)
              let seasons
              let lastSeason = {}
                // console.log('.additional-stats', $('.additional-stats')['0'].children[0])
              if ($('.additional-stats')['0'] && $('.additional-stats')['0'].children[0]) {
                seasons = $('.season-count')[1].attribs['data-all-count']
                console.log('##########################')
                console.log('Last season    :', seasons)
                console.log('##########################')
              }

              let urlSeason = 'https://trakt.tv/shows/' + show + '/seasons/' + seasons
              request.get({
                url: urlSeason
              }, function(error, response, body) {
                if (error) console.error(error)
                if (!error) {
                  getSeason(error, response, body)
                }
              })

              function getSeason(error, response, body) {
                if (error || !response) {
                  // console.error(error)
                  return reject(error)
                }
                if (!error && response.statusCode == 200) {

                  let $ = cheerio.load(body)

                  let last = $('.selected')[2].children[0].data
                  let episode = 1

                  for (var i = 1; i < $('.titles').length; i++) {

                    if ($('.titles')[i].children.length == 2 && $('.titles')[i].children[0].children[1]) {
                      let title
                      let date = $('.titles')[i].children[1].children[0].children[0].children[0].data
                      if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                      let ep = $('.titles')[i].children[0].children[1].children[0].children[0].data
                      if ($('.titles')[i].children[0].children[1].children[2].children[0]) {
                        title = $('.titles')[i].children[0].children[1].children[2].children[0].data
                      }
                      if (ep.length == 4) ep = '0' + ep
                      ep = ep.slice(0, 2) + ep.slice(3)
                      ep = ep.slice(0, 2) + 'e' + ep.slice(2)
                      ep = 's' + ep

                      lastSeason[episode] = {
                        episode: ep,
                        title: title,
                        date: date
                      }
                      episode++
                    } else if ($('.titles')[i].children.length == 6) {
                      let date = $('.titles')[i].children[1].children[0].children[0].data
                      if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                      let ep = $('.titles')[i].children[2].children[0].children[0].data
                      let title = $('.titles')[i].children[2].children[2].children[0].data
                      if (ep.length == 4) ep = '0' + ep
                      ep = ep.slice(0, 2) + ep.slice(3)
                      ep = ep.slice(0, 2) + 'e' + ep.slice(2)
                      ep = 's' + ep
                      lastSeason[episode] = {
                        episode: ep,
                        title: title,
                        date: date
                      }
                      episode++
                    }
                  }

                  let valid = false
                  for (var ep in lastSeason) {
                    if (ep.hasOwnProperty(lastSeason)) {
                      console.log(ep + " -> " + lastSeason[ep])
                    }
                  }

                  console.log('lastSeason', lastSeason)

                  let db = new PouchDB('cereal')
                  dbService.get(show)
                    .then(function(doc) {
                      console.log('doc.Seasons[last]', doc.Seasons[last])
                      doc.Updated = new Date()
                      if (doc.Seasons && !doc.Seasons[last]) doc.Seasons.push(lastSeason)
                      if (doc.Seasons[last]) {
                        Object.keys(lastSeason).map(function(keyNew, iNew) {
                            Object.keys(doc.Seasons[last]).map(function(keySaved, iSaved) {
                              if (doc.Seasons[last][keyNew] > lastSeason[keySaved]) doc.Seasons[last][keyNew] = lastSeason[keyNew];
                            })
                          })
                          // for (var i = 0; i < doc.Seasons[last].length; i++) {
                          //     for (var j = 0; j < lastSeason.length; j++) {
                          //         doc.Seasons[last][i].episode = lastSeason.episode
                          //         doc.Seasons[last][i].title = lastSeason.title
                          //         doc.Seasons[last][i].date = lastSeason.date
                          //     }
                          // }
                          // if (doc.Seasons[last].length < lastSeason.length) {
                          //   for (var k = lastSeason.length - doc.Seasons[last].length; k < lastSeason.length; k++) {
                          //     doc.Seasons[last].push(lastSeason[k])
                          //   }
                          // }
                      }
                      dbService.put(show, doc)
                        .then(() => {
                          $mdToast.show($mdToast.simple().textContent('Synced \'' + commonService.dashedToSpaced(show) + '\' season ' + seasons))
                          $rootScope.$broadcast('show_ready', doc)
                        }).catch((reason) => {
                          console.error(reason)
                        })
                    })

                } else {
                  reject(response.statusCode)
                }
              }

            } else reject('Status:', response.statusCode)
          })
        })
    }


    return json_module

  }
})();
