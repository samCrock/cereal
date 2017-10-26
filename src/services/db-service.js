(function() {
  'use strict';

  angular
  .module('app')
  .service('dbService', dbService);

  /* @ngInject */
  function dbService(commonService, $rootScope, $interval) {
    let request = require('request')
    let cheerio = require('cheerio')
    let Promise = require('bluebird')
    let fsExtra = require('fs-extra')
    let PouchDB = require('pouchdb-browser')
    let db_module = {}

    // let url = 'https://www.pogdesign.co.uk/cat/'
    let url = 'https://trakt.tv/calendars/shows/'

    let db = new PouchDB('cereal')

    // new PouchDB('cereal').destroy()

    // PouchDB.debug.enable('*')
    PouchDB.debug.disable()

    db_module['put'] = function put(key, value) {
      return new Promise((resolve, reject) => {
        db.get(key)
        .then(function(doc) {
          value._id = doc._id
          value._rev = doc._rev
          db.put(value)
          .then(function(doc) {
            resolve(doc)
          })
          .catch((reason) => {
            reject(reason)
          })
        })
        .catch((reason) => {
          value._id = key
          db.put(value)
          .then(function(doc) {
            resolve(doc)
          })
          .catch((reason) => {
            reject(reason)
          })
        })
      })
    }

    db_module['get'] = function get(key) {
      return new Promise((resolve, reject) => {
        db.get(key)
        .then(function(doc) {
          resolve(doc)
        })
        .catch((reason) => {
          resolve(reason)
        })
      })
    }

    db_module['remove'] = function remove(value) {
      return new Promise((resolve, reject) => {
        db.remove(value)
        .then(function(doc) {
          resolve(doc)
        })
        .catch((reason) => {
          resolve(reason)
        })
      })
    }

    db_module['library'] = function get() {
      return new Promise((resolve, reject) => {
        let library = {}
        db.allDocs({
          include_docs: true
        })
        .then(function(doc) {
          for (var i = 0; i < doc.rows.length; i++) {
            if (doc.rows[i].id !== 'calendar' && doc.rows[i].id !== 'undefined') {
              library[doc.rows[i].doc.DashedTitle] = (doc.rows[i].doc)
            }
          }
          resolve(library)
        })
        .catch((reason) => {
          resolve(reason)
        })
      })
    }

    db_module['calendar'] = function calendar() {
      return new Promise(function(resolve, reject) {

        function update() {
          return new Promise(function(resolve, reject) {

            localStorage.lastUpdate = new Date()
            let lastWeek = moment().subtract(6, 'days').format('YYYY-MM-DD')

            let days = []

            // console.log(url + lastWeek)

            request(url + lastWeek, function(error, response, html) {

              if (!error) {
                console.log('Checking calendar')

                var $ = cheerio.load(html)
                var week = []

                $('.fanarts, .calendar-list')
                .filter((i, result) => {
                  var dotm = result.children[0].children[0].children[0].data
                  var month = result.children[0].children[1].children[0].data
                  var year = moment().format('YYYY')
                  // If we're in december and current day is January, increment current day's year
                  if (moment().month() == 11 && month == 'January') {
                    year = +year
                  }
                  var date = moment(year + ' ' + month + ' ' + dotm, 'YYYY MMM DD', 'en').format()
                  var day = {
                    date: date,
                    shows: []
                  }
                  // console.log(dotm)
                  // console.log(month)
                  // console.log(year)
                  // console.log('DATE', date)

                  for (i = 1; i < result.children.length; i++) {
                    if (result.children[i].attribs['data-episode-id']) {
                      // console.log(result.children[i].children[1].children[0].children.length)
                      var episode, network, title, poster
                      if (result.children[i].children[1].children[0].children.length == 7) {
                        if (result.children[i].children[1].children[0].children[6].children.length == 8) {
                          title = result.children[i].children[1].children[0].children[6].children[7].children[0].attribs['content']
                          episode = result.children[i].children[1].children[0].children[6].children[3].children[0].children[0].data
                          network = result.children[i].children[1].children[0].children[6].children[2].children[0].data
                          console.log(title, 'Season premiere')
                        } else {
                          title = result.children[i].children[1].children[0].children[6].children[6].children[0].attribs['content']
                          episode = result.children[i].children[1].children[0].children[6].children[2].children[0].children[0].data
                          network = result.children[i].children[1].children[0].children[6].children[1].children[0].data
                          // console.log('Regular episode')
                        }
                      } else {
                        // console.log('Finale || Premiere', result.children[i].children[1].children[0].children[5].children)
                        if (result.children[i].children[1].children[0].children[5].children.length == 9) {
                          title = result.children[i].children[1].children[0].children[5].children[8].children[0].attribs['content']
                          network = result.children[i].children[1].children[0].children[5].children[2].children[0].data
                          episode = result.children[i].children[1].children[0].children[5].children[4].children[0].children[0].data
                          console.log(title, 'Season Finale')
                        } else {
                          title = result.children[i].children[1].children[0].children[5].children[7].children[0].attribs['content']
                          network = result.children[i].children[1].children[0].children[5].children[1].children[0].data
                          episode = result.children[i].children[1].children[0].children[5].children[3].children[0].children[0].data
                        }
                      }

                      episode = episode.split('x')
                      if (episode[0].length == 1) episode[0] = '0' + episode[0]
                      episode[0] = 's' + episode[0]
                      episode[1] = 'e' + episode[1]
                      episode = episode[0] + episode[1]
                      let showObject = {
                        title: title,
                        dashed_title: result.children[i].children[0].attribs['content'].split('/')[4],
                        episode: episode,
                        network: network,
                        runtime: result.children[i].attribs['data-runtime'],
                      }
                      // Clear year
                      if (title) {
                        var match = title.match(/(200[0-9]|201[0-9])/)
                        if (title.match(/(200[0-9]|201[0-9])/)) {
                          title = title.substring(0, match['index'])
                          title = title.replace(/-/g, ' ').trim()
                          console.log('Cleared title string:', title)
                          showObject.cleared_title = title
                        }
                      }
                      // console.log(showObject)
                      day.shows.push(showObject)
                    }
                  }
                  if (day.shows.length > 0) week.push(day)
                })

                // console.log('Week ->', week)

                db.get('calendar')
                .then(function(doc) {
                  // console.log('pre update', doc.days)
                  db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    days: week
                  })
                  resolve(week)
                })
                .catch(function(err) {
                  console.log('No calendar in db')
                  db.put({
                    _id: 'calendar',
                    days: week
                  })
                  .then(() => {
                    resolve(week)
                  })
                })
                // resolve(week)
              }
            })

          })
        }

        // let sinceLastUpdate = commonService.daysToNow(localStorage.lastUpdate)
        let sinceLastUpdate = 1
        // console.log(sinceLastUpdate + ' days since last update')

        if (localStorage.lastUpdate && sinceLastUpdate < 1) {
          db.get('calendar')
          .then(function(doc) {
            resolve(doc.days)
            // resolve(update())
          })
          .catch((err) => {
            resolve(update())
          })
        } else {
          resolve(update())
        }
      })
    }

    return db_module

  }
})();
