(function() {
  'use strict';

  angular
    .module('app')
    .controller('calendarCtrl', calendarCtrl);

  function calendarCtrl($rootScope, $scope, $interval, jsonService, posterService, commonService, torrentService, dialogService, dbService) {
    let fsExtra = require('fs-extra')
    console.log('Calendar')

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
          show: showObj.dashed_title,
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
      $rootScope.days = []
      jsonService.getLocalPosters()
        .then((local_posters) => {
          $rootScope.msg = 'Loading this week\'s calendar'
            // jsonService.month().then((data) => {
          dbService.calendar()
            .then((data) => {
              // $rootScope.loading = false
              $rootScope.msg = 'Loading posters'

              let posterTitles = []
              if (data) {
                let posters = []
                let showsToUpdate = []
                  // let d, now, timeDiff, diffDays
                console.log('Calendar ->', data)

                data.filter((day) => {
                    // LAST WEEK ONLY
                    day.shows.filter((show) => {
                      let index = local_posters.indexOf(show.dashed_title)
                      if (index >= 0) {
                        show.poster = 'assets/posters/' + local_posters[index] + '.jpg'
                      } else {
                        posters.push(posterService.downloadPoster(show.dashed_title))
                      }

                      // If this show is in my library && autodownload is enabled, download this episode
                      if ($rootScope.CONFIG.auto_download) {
                        Object.keys($rootScope.library).forEach(function(key, index) {
                          if (key === show.title) {
                            console.log('New episode found', show.title, show.episode)
                            $scope.download({
                              show: show.title,
                              episode: show.episode
                            })
                          }
                        })
                      }
                    })
                    $rootScope.days.push(day)
                      // $scope.$apply()
                  })
                  // $rootScope.reload = false

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
                              // next()
                          }
                        })
                      })
                    })
                    delete $rootScope.msg
                    $rootScope.loading = false
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