(function() {
  'use strict';

  angular
    .module('app')
    .controller('calendarCtrl', calendarCtrl);

  function calendarCtrl($rootScope, $scope, $interval, jsonService, posterService, commonService, torrentService, dialogService, dbService) {
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

    $scope.stream = function(episode) {
      console.log('PLAY ->', episode)
      torrentService.searchTorrent({
          show: episode.show,
          episode: episode.episode
        })
        .then((t) => {
          let streamObj = {
            magnet: t.magnet,
            path: __dirname + '/../../library/' + episode.show + '/' + episode.episode
          }
          console.log('streamObj', streamObj)
          commonService.stream(streamObj)
        })
        .catch((reason) => {
          console.log(reason)
        })
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

    $scope.download = (showObj) => {
      torrentService.searchTorrent({
          show: showObj.show,
          episode: showObj.episode
        })
        .then((result) => {
          torrentService.downloadTorrent(result)
            .then((t) => {
              console.log('downloadTorrent result', t)
            })
        })
    }

    if ($rootScope.reload) {
      $rootScope.msg = 'Loading this week\'s calendar'
      var prereq = []
      prereq.push(dbService.fetchShows())
      prereq.push(dbService.calendar())
      Promise.all(prereq).then((results) => {
        $rootScope.library = results[0]
        $rootScope.calendar = results[1]

        console.log('Calendar ->', $rootScope.calendar)
        console.log('Library  ->', $rootScope.library)

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

        $rootScope.days = []
        jsonService.getLocalPosters()
          .then((local_posters) => {
            let posterTitles = []
            if ($rootScope.calendar) {
              let posters = []
              let showsToUpdate = []

              $rootScope.calendar
                .filter((day) => {
                  // LAST WEEK ONLY
                  day.shows.filter((show) => {
                    let index = local_posters.indexOf(show.dashed_title)
                    if (index >= 0) {
                      show.poster = 'assets/posters/' + local_posters[index] + '.jpg'
                    } else {
                      posters.push(posterService.downloadPoster(show.dashed_title))
                    }
                  })
                  $rootScope.days.push(day)
                })
              $rootScope.reload = false

              Promise.all(posters)
                .then((results) => {
                  console.log('--- All posters found ---')
                  $rootScope.days.filter((day, i) => {
                    day.shows.filter((show, j) => {
                      results.filter((poster) => {
                        if (poster && poster.title === show.dashed_title) {
                          showsToUpdate.push({
                            title: show.dashed_title,
                            poster: poster.poster
                          })
                          $rootScope.days[i].shows[j].poster = poster.poster
                          $rootScope.$applyAsync()
                        }
                      })
                    })
                  })
                  delete $rootScope.msg
                  $rootScope.loading = false
                  $rootScope.$apply()
                })
            } else {
              delete $rootScope.msg
              $rootScope.loading = false
            }
          })
      })
    } else {
      delete $rootScope.msg
      $rootScope.loading = false
    }

  }

})();