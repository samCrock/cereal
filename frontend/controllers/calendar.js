angular.module('App')
    .controller('calendarCtrl', ['$scope', '$interval', function($scope, $interval) {
        console.log('Calendar')
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')
        let commonService = ioc.create('services/common-service')

        $scope.days = []
        let today = new Date()
        let _7daysago = new Date()
        today.setHours(0, 0, 0, 0)
        _7daysago.setDate(today.getDate() - 7)

        // fsExtra.readFile('./backend/json/monthly.json', (err, data) => {
        //     if (err) return
        //     data = JSON.parse(data)
        //     data.filter((day) => {
        //         if (new Date(day.date) > _7daysago) {
        //             day.dateObj = commonService.getDayObject(day.date)
        //             $scope.days.push(day)
        //         }
        //     })
        //     $scope.$apply()
        // })

        jsonService.getLocalPosters()
            .then((local_posters) => {

                fsExtra.readFile('./backend/json/monthly.json', (err, data) => {
                    let posterTitles = []
                    if (data) {
                        data = JSON.parse(data)
                        let posters = []
                        data.filter((day) => {
                                if (new Date(day.date) > _7daysago) {
                                    day.dateObj = commonService.getDayObject(day.date)
                                        // $scope.days.push(day)
                                    day.shows.filter((show) => {
                                        let dashedTitle = commonService.spacedToDashed(show.title)
                                        let index = local_posters.indexOf(dashedTitle)
                                        if ( index >= 0 ) {
                                            console.log('--poster found--')
                                            show.poster = './res/posters/' + local_posters[index] + '.jpg'
                                        } else {
                                            // posters.push(posterService.getPosterUrl(show.title))
                                            posters.push(posterService.downloadPoster(show.title))
                                        }
                                    })
                                    $scope.days.push(day)
                                    $scope.$apply()
                                }
                            })
                            Promise.all(posters)
                                .then((results) => {
                                    console.log('--- All posters found ---')
                                    $scope.days.filter((day, i) => {
                                        day.shows.filter((show, j) => {
                                            results.filter((poster) => {
                                                if (poster && poster.title === show.title && poster) {
                                                    $scope.days[i].shows[j].poster = poster.poster
                                                    $scope.$apply()
                                                    next()
                                                }
                                            })
                                        })
                                    })
                                })
                    }
                })
            })


    }])
