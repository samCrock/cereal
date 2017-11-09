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

    // $scope.download = (showObj) => {
    //   torrentService.searchTorrent({
    //     show: showObj.show,
    //     episode: showObj.episode
    //   })
    //   .then((result) => {
    //     torrentService.downloadTorrent(result)
    //     .then((t) => {
    //       console.log('downloadTorrent result', t)
    //     })
    //   })
    // }



    if ($rootScope.reloadCalendar) {
      $rootScope.msg = 'Loading this week\'s calendar'
      Promise.all([dbService.library(), dbService.calendar()])
      .then((results) => {
        $rootScope.library = results[0]
        $rootScope.calendar = results[1]

        console.log('Library  ->', $rootScope.library)
        console.log('Calendar ->', $rootScope.calendar)

        // Auto download
        if ($rootScope.CONFIG.auto_download) {
          for (let [calK, calV] of Object.entries($rootScope.calendar)) {
            calV.shows.map(show => {
              var showInLibrary = $rootScope.library[show.dashed_title]
              if ($rootScope.library.hasOwnProperty(show.dashed_title) && showInLibrary.last_download) {
                for (var sK in showInLibrary.Seasons) {
                  for (var epK in showInLibrary.Seasons[sK]) {
                    var ep = showInLibrary.Seasons[sK][epK]
                    if (ep.episode === show.episode && !ep.downloaded) {
                      $scope.download({
                        show: show.dashed_title,
                        episode: show.episode
                      })
                    }
                  }
                }
              }
            })
          }
        }
        delete $rootScope.msg
        $rootScope.loading = false
        $rootScope.reloadCalendar = false
        $rootScope.$apply()
      })
    } else {
      delete $rootScope.msg
      $rootScope.loading = false
    }

  }

})();
