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

        let url = 'http://www.pogdesign.co.uk/cat/'

        let db = new PouchDB('cereal')

        // new PouchDB('cereal').destroy()

        // PouchDB.debug.enable('*')
        PouchDB.debug.disable()

        db_module['put'] = function put(key, value) {
            return new Promise((resolve, reject) => {
                db.get(key)
                    .then(function(doc) {
                        value._id = key
                        value._rev = doc._rev
                        db.put(value)
                            .then(() => {
                                resolve(value)
                            }).catch((reason) => {
                                reject(reason)
                            })
                    })
                    .catch((reason) => {
                        value._id = key
                        db.put(value)
                            .then(() => {
                                resolve(value)
                            }).catch((reason) => {
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

        db_module['fetchShows'] = function get() {
            return new Promise((resolve, reject) => {
                let library = {}
                db.allDocs({
                    include_docs: true
                })
                    .then(function(doc) {
                        for (var i = 0; i < doc.rows.length; i++) {
                            if (doc.rows[i].id !== 'calendar') {
                                library[doc.rows[i].doc.Title] = (doc.rows[i].doc)
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
                        const now = new Date()
                        localStorage.lastUpdate = now
                        var year = now.getFullYear()
                        var month = now.getMonth()

                        // if (month < 10) {
                        //     month = month.toString()
                        //     month = '0' + month
                        // }

                        var months = [(parseInt(month) - 1) + '-' + year, month + '-' + year, (parseInt(month) + 1) + '-' + year]
                        var promises = []

                        for (var i = months.length - 1; i >= 0; i--) {
                            promises.push(new Promise(function(resolve, reject) {
                                console.log('month', months[i])
                                request(url + months[i], function(error, response, html) {

                                    if (!error) {
                                        console.log('Checking calendar')

                                        var $ = cheerio.load(html)
                                        var json = []

                                        $('.day, .today').filter(function() {
                                            var date = this.attribs.id
                                            date = date.split('_')
                                            var date_d = date[1]
                                            var date_m = date[2] - 1
                                            var date_y = date[3]
                                            var date_obj = new Date(date_y, date_m, date_d)
                                            var date_label = date_obj.toDateString()
                                            var day = {
                                                date: date_obj,
                                                date_label: date_label,
                                                shows: []
                                            }
                                            for (var i = this.children.length - 1; i >= 0; i--) {
                                                if (this.children[i].name === 'div' && this.children[i].attribs.class.match('ep ')) {
                                                    var d = this.children[i].children;
                                                    for (var j = d.length - 1; j >= 0; j--) {
                                                        if (d[j].name === 'span') {
                                                            var children = d[j].children
                                                            for (var k = children.length - 1; k >= 0; k--) {
                                                                if (children[k].name === 'p') {
                                                                    var title = children[k].children[0].children[0].data
                                                                    var episode = children[k].children[0].next.next.children[0].data
                                                                    title = commonService.findAliasSync(title)
                                                                    day.shows.push({
                                                                        title: title,
                                                                        episode: episode
                                                                    })
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            json.push(day)
                                        })

                                        resolve(json)
                                    }
                                })
                            }))
                        }


                        Promise.all(promises).then((data) => {
                            var days = []
                            for (var i = data.length - 1; i >= 0; i--) {
                                for (var j = data[i].length - 1; j >= 0; j--) {
                                    days.push(data[i][j])
                                }
                            }
                            days.sort((a, b) => {
                                var c = new Date(a.date);
                                var d = new Date(b.date);
                                return c - d;
                            })
                            db.get('calendar')
                                .then(function(doc) {
                                    // console.log('pre update', doc.days)
                                    db.put({
                                        _id: doc._id,
                                        _rev: doc._rev,
                                        days: days
                                    })
                                    resolve(days)
                                })
                                .catch(function(err) {
                                    console.log('No calendar in db', err)
                                    db.put({
                                            _id: 'calendar',
                                            days: days
                                        })
                                        .then(() => {
                                            resolve(days)
                                        })
                                })

                        })
                    })
                }

                let sinceLastUpdate = commonService.daysToNow(localStorage.lastUpdate)
                console.log(sinceLastUpdate + ' days since last update')

                if (localStorage.lastUpdate && sinceLastUpdate < 1) {
                    db.get('calendar')
                        .then(function(doc) {
                            // resolve(doc.days)
                            resolve(update())
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
