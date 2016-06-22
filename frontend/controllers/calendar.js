angular.module('App')
    .controller('calendarCtrl', ['$scope', '$interval', function($scope, $interval) {
        console.log('Calendar')
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')

        $scope.days = []

        fsExtra.readFile('./backend/json/monthly.json', (err, data) => {
            if (err) return
            data = JSON.parse(data)
            data.filter((day) => {
                $scope.days.push(day)
            })
            $scope.$apply()
        })


        // fsExtra.readFile('./backend/json/monthly.json', (err, data) => {
        //     let posterTitles = []
        //         if (data) {
        //             data = JSON.parse(data)
        //             let posters = []
        //             data.filter((day) => {
        //                 day.shows.filter((show) => {
        //                     posters.push(posterService.getPosterUrl(show))
        //                 })
        //                 $scope.days.push(day)
        //                 $scope.$apply()
        //             })
        //             Promise.all(posters)
        //                 .then((results) => {
        //                     console.log('--- All posters urls found ---')
        //                     $scope.days.filter( (day, i) => {
        //                         day.shows.filter( (show, j) => {
        //                             results.filter ( (showWithPoster) => {
        //                                 if (showWithPoster.title === show.title && showWithPoster) {
        //                                    $scope.days[i].shows[j].poster = showWithPoster.poster 
        //                                     $scope.$apply()
        //                                    next()
        //                                 }
        //                             })
        //                         })
        //                     })
        //                 })
        //         }
        // })


    }])
