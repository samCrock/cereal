(function() {
    'use strict';

    angular
    .module('app')
    .controller('calendarCtrl', calendarCtrl);

    function calendarCtrl($rootScope, $scope, $interval, jsonService, commonService, torrentService, dialogService, dbService) {
        let fsExtra = require('fs-extra')

        $rootScope.loading = true

        $scope.calendarDate = (date) => {
            return moment(date).calendar(null, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: '[ ' + moment(date).toNow() + ' ]',
                lastDay: '[Yesterday]',
                lastWeek: '[ ' + moment(date).fromNow() + ' ]',
                sameElse: 'dddd D MMMM'
            })
        }

        $scope.completeDate = (date) => {
            return moment(date).format('dddd D MMMM')
        }

        $scope.posterOnly = (show) => {
            return show
        }

        $scope.playTrailer = function(show) {
            console.log(show)
            jsonService.getYTTrailer(show.show)
            .then((url) => {
                dialogService.trailer({
                    src: url
                })
            })
        }

        // App started
        if ($rootScope.reloadCalendar) {
            $rootScope.msg = 'Loading this week\'s calendar'
            Promise.all([dbService.library(), dbService.calendar()])
            .then((results) => {
                $rootScope.library = results[0]
                $rootScope.calendar = results[1]

                console.log('Library  ->', $rootScope.library)
                console.log('Calendar ->', $rootScope.calendar)

                delete $rootScope.msg
                $rootScope.loading = false
                $rootScope.reloadCalendar = false
                $rootScope.$apply()

                // Auto download
                for (var show in $rootScope.library) {
                    if ($rootScope.library[show]['last_download']) {
                        // console.log($rootScope.library[show]['DashedTitle'], $rootScope.library[show]['Seasons'])
                        for (var season in $rootScope.library[show]['Seasons']) {
                            for (var episodes in $rootScope.library[show]['Seasons'][season]) {
                                // console.log($rootScope.library[show]['DashedTitle'], $rootScope.library[show]['Seasons'][season][episodes])
                                let daysPassed = moment().diff(moment($rootScope.library[show]['Seasons'][season][episodes].date, moment.ISO_8601).toISOString(), 'days')
                                // console.log('daysPassed', daysPassed)
                                if (daysPassed >= 0 && daysPassed < 8 && !$rootScope.library[show]['Seasons'][season][episodes].downloaded) {
                                    console.log('Auto download ->', $rootScope.library[show]['Title'], $rootScope.library[show]['Seasons'][season][episodes])
                                    torrentService.searchTorrent({
                                        spaced_show: $rootScope.library[show]['Title'],
                                        dashed_show: $rootScope.library[show]['DashedTitle'],
                                        episode: $rootScope.library[show]['Seasons'][season][episodes].episode
                                    })
                                    .then((result) => {
                                        torrentService.downloadTorrent(result)
                                        .then((t) => {
                                            console.log('downloadTorrent result', t)
                                        })
                                    })
                                }
                            }
                        }
                    }
                }

            })
        } else {
            delete $rootScope.msg
            $rootScope.loading = false
        }

    }

})();
