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

    db_module['fetchShows'] = function get() {
      return new Promise((resolve, reject) => {
        let library = {}
        db.allDocs({
          include_docs: true
        })
        .then(function(doc) {
          for (var i = 0; i < doc.rows.length; i++) {
            if (doc.rows[i].id !== 'calendar') {
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
            let lastWeek = moment().subtract(7, 'days').format('YYYY-MM-DD')

            let days = []

            console.log(url + lastWeek)
            
            request(url + lastWeek, function(error, response, html) {

              if (!error) {
                console.log('Checking calendar')

                var $ = cheerio.load(html)
                var week = []

                $('.fanarts, .calendar-list')
                .filter((i, result) => {
                  // console.log('Day   :', result.children[0].children[0].children[0].data)
                  // console.log('Month :', result.children[0].children[1].children[0].data)

                  var day = {
                    date_label: result.children[0].children[0].children[0].data + ' ' + result.children[0].children[1].children[0].data,
                    shows: []
                  }

                  for (i = 1; i < result.children.length; i++) {
                    if (result.children[i].attribs['data-episode-id']) {
                      // console.log(result.children[i].children[1].children[0].children.length)
                      var episode, network, title, poster
                      if (result.children[i].children[1].children[0].children.length == 7) {
                        // console.log('Regular', result.children[i].children[1].children[0].children[6].children)
                        if (result.children[i].children[1].children[0].children[6].children.length == 8) {
                          episode = result.children[i].children[1].children[0].children[6].children[3].children[0].children[0].data
                          network = result.children[i].children[1].children[0].children[6].children[2].children[0].data
                        } else {
                          title = result.children[i].children[1].children[0].children[6].children[6].children[0].attribs['content']
                          episode = result.children[i].children[1].children[0].children[6].children[2].children[0].children[0].data
                          network = result.children[i].children[1].children[0].children[6].children[1].children[0].data
                        }
                      } else {
                        // console.log('Finale || Premiere', result.children[i].children[1].children[0].children)
                        title = result.children[i].children[1].children[0].children[5].children[7].children[0].attribs['content']
                        network = result.children[i].children[1].children[0].children[5].children[1].children[0].data
                        episode = result.children[i].children[1].children[0].children[5].children[3].children[0].children[0].data
                      }

                      let showObject = {
                        title: title,
                        dashed_title: result.children[i].children[0].attribs['content'].split('/')[4],
                        episode: episode,
                        network: network,
                        runtime: result.children[i].attribs['data-runtime'],
                      }
                      // console.log(showObject)
                      day.shows.push(showObject)

                    }
                  }
                  week.push(day)
                })

                // console.log(week)

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
        console.log(sinceLastUpdate + ' days since last update')

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
