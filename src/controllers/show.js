(function() {
  'use strict';

  angular
    .module('app')
    .controller('showCtrl', showCtrl);

  function showCtrl($rootScope, $state, $sce, $scope, $interval, $timeout, $stateParams, jsonService, torrentService, subsService, commonService, wtService, dialogService, dbService) {

    let fsExtra = require('fs-extra')
    let rimraf = require('rimraf')
    let PouchDB = require('pouchdb-browser')
    let db = new PouchDB('cereal')
    const wt_client = wtService.client()

    $rootScope.loading = true
    console.log('$stateParams', $stateParams)
    $scope.dashed_title = $stateParams.show ? $stateParams.show : $rootScope.current_show.DashedTitle
    $scope.selected_ep = $stateParams.episode
      // if ($rootScope.current_show) $rootScope.current_show.DashedTitle = $scope.dashed_title
    $scope.downloading = []
    $scope.poster = 'res/posters/' + $scope.dashed_title + '.jpg'

    let destroyShowListener;
    $scope.$on('$destroy', function() {
      destroyShowListener()
    })
    destroyShowListener = $rootScope.$on('show_ready', (e, showResult) => {
      sessionStorage.removeItem('current_show')
      formatDataAndSave(showResult)
      $scope.showIsLoading = false
      $rootScope.$applyAsync()
      console.log('Show is ready', showResult)
    })

    $scope.dotClass = function(episode) {
      if (episode) {
        if (episode.downloaded) return 'green'
        if (episode.timePassed &&
          episode.timePassed.indexOf('ago') === -1 &&
          episode.timePassed.indexOf('Today') === -1 &&
          episode.timePassed.indexOf('Yesterday') === -1 ||
          episode.timePassed && episode.timePassed.indexOf('NaN') !== -1)
          return 'hidden'
      }
      return ''
    }

    $scope.timePassedCheck = function(tp) {
      var visible = true
      if (tp && tp.indexOf('NaN') !== -1) visible = false
      return visible
    }

    $scope.stream = function(episode) {
      console.log('PLAY ->', episode)
      torrentService.searchTorrent({
          show: $scope.dashed_title,
          episode: episode.label
        })
        .then((t) => {
          let streamObj = {
            magnet: t.magnet,
            path: __dirname + '/../../library/' + $scope.dashed_title + '/' + episode.label
          }
          console.log('streamObj', streamObj)
          commonService.stream(streamObj)
        })
        .catch((reason) => {
          console.log(reason)
          dialogService.notify({
            title: 'Sorry',
            content: 'No results'
          })
        })
    }

    $scope.play = function(episode) {
      let recent = localStorage.getItem('recent')
      if (recent) {
        recent = JSON.parse(recent)
        for (var i = recent.length - 1; i >= 0; i--) {
          if (recent[i].torrent === episode.torrent) {
            recent.splice(i, 1)
            localStorage.setItem('recent', JSON.stringify(recent))
          }
        }
      }
      $state.go('app.episode', ({
        show: $scope.dashed_title,
        episode: episode.label
      }))
    }

    $interval(() => {
      if ($rootScope.pending && $scope.show && $scope.show.Seasons) {
        for (var i = 0; i < $rootScope.pending.length; i++) {
          for (var s in $scope.show.Seasons) {
            for (var e in $scope.show.Seasons[s]) {
              if ($rootScope.pending[i].dashed_show === $scope.show.DashedTitle && $rootScope.pending[i].episode === $scope.show.Seasons[s][e].episode) {
                $scope.show.Seasons[s][e].eta = commonService.formatTime($rootScope.pending[i].eta)
                if ($scope.show.Seasons[s][e].eta.indexOf('NaN') !== -1) $scope.show.Seasons[s][e].eta = ''
                $scope.show.Seasons[s][e].progress = $rootScope.pending[i].progress
                $scope.show.Seasons[s][e].magnet = $rootScope.pending[i].magnet
              }
            }
          }
        }
      }
      $scope.$applyAsync()
    }, 1000)

    function start() {
      jsonService.getShow($scope.dashed_title)
        .then((showResult) => {
          formatDataAndSave(showResult)
        })
    }

    function formatDataAndSave(showResult) {
      showResult.DashedTitle = $scope.dashed_title
      console.log('formatDataAndSave', showResult)
      if (showResult) {
        for (var season in showResult.Seasons) {
          for (var episode in showResult.Seasons[season]) {
            var formatted_date = {}
            formatted_date = commonService.getDayObject(showResult.Seasons[season][episode].date)
            showResult.Seasons[season][episode].dotw = formatted_date.dotw
            showResult.Seasons[season][episode].dotm = formatted_date.dotm
            showResult.Seasons[season][episode].month = formatted_date.month
            showResult.Seasons[season][episode].timePassed = commonService.timePassed(showResult.Seasons[season][episode].date)

            if ($rootScope.library[showResult.DashedTitle]) {
              let episodes = $rootScope.library[showResult.DashedTitle]
              for (var i = 0; i < episodes.length; i++) {
                if (episodes[i].episode === showResult.Seasons[season][episode].episode && showResult.Seasons[season][episode].progress === 100) {
                  showResult.Seasons[season][episode].downloaded = true
                }
              }
            }
          }
        }
      }
      $scope.show = showResult
      $rootScope.current_show = $scope.show
      sessionStorage.setItem('current_show', JSON.stringify($scope.show))
      $rootScope.wallpaper = $scope.show.Wallpaper
      dbService.get($scope.dashed_title)
        .then((doc) => {
          if (doc.currentEpisode) {
            console.log(doc.currentEpisode)
            $timeout(() => {
              $scope.selectedIndex = doc.currentEpisode.s - 1
            }, 200)
          }
          dbService.put($scope.dashed_title, doc)
            .then(() => {
              console.log($scope.show.DashedTitle, 'synced')
            })
            .catch((err) => {
              console.error('Error updating', $scope.dashed_title, err)
            })
        })
        .catch((err) => {
          // console.log(err)
          $scope.show._id = $scope.dashed_title
          dbService.put($scope.dashed_title, $scope.show)
            .then(() => {
              console.log($scope.show.DashedTitle, 'synced')
            })
            .catch((err) => {
              console.error('Error updating', $scope.dashed_title, err)
            })
        })
      $rootScope.loading = false
      $scope.$applyAsync()
    }

    $scope.$on('show_overview', function(event, result) {
      console.log('Overview ready')
      $scope.show = result.show
      $rootScope.loading = false
      $scope.showIsLoading = true
      $scope.$applyAsync()
      formatDataAndSave($scope.show)
    })

    $rootScope.$on('episode_downloaded', (event, result) => {
      console.log('Episode completed:', result)
      let e = result.episode.split('e')
      let s = e[0].split('s')
      s = parseInt(s[1], 10)
      e = parseInt(e[1], 10)
      if (result.dashed_show === $scope.show.DashedTitle) {
        $scope.show.Seasons[s][e].downloaded = true
        $scope.show.Seasons[s][e].loading = false
        delete $scope.show.Seasons[s][e].eta
        delete $scope.show.Seasons[s][e].progress
        $scope.$applyAsync()
      }
      dbService.get($scope.show.DashedTitle)
        .then((doc) => {
          $scope.show._id = doc._id
          $scope.show._rev = doc._rev
          $scope.show.last_update = new Date()
          dbService.put($scope.show.DashedTitle, $scope.show)
            .then(() => {
              console.log($scope.show.DashedTitle, 'synced')
            })
            .catch((err) => {
              console.error('Error updating', $scope.dashed_title, err)
            })
        })
    })

    $scope.downloadEpisode = (episode) => {
      let show = $scope.show.DashedTitle
      let label = episode.label
      let s = episode.s
      let e = episode.e
      let searchObject = {
        show: show,
        episode: label
      }
      if ($scope.show.Genres.indexOf('Talk Show') > -1) searchObject.date = episode.date

      console.log('Download episode:', episode)

      $scope.show.Seasons[s][e].loading = true
      $scope.$applyAsync()

      torrentService.searchTorrent(searchObject)
        .then((result) => {
          // $scope.show.Seasons[s][e].loading = false
          console.log(result, 'is downloading')
          torrentService.downloadTorrent(result)
        })
        .catch((reason) => {
          console.log(reason)
          console.log($scope.show, s, e)
          $scope.show.Seasons[s][e].loading = false
          dialogService.torrentForm({
              show: $scope.show.DashedTitle,
              episode: $scope.show.Seasons[s][e].episode,
              date: $scope.show.Seasons[s][e].date
            })
            .then((dialogResult) => {
              console.log('Dialog result ->', dialogResult)
              torrentService.searchTorrent(dialogResult)
                .then((result) => {
                  console.log(result.episode, 'is downloading')
                    // $scope.show.Seasons[s][e].loading = false
                  torrentService.downloadTorrent(result)
                    .then((t) => {
                      delete $scope.show.Seasons[s][e].eta
                      $rootScope.current_show = $scope.show
                      sessionStorage.setItem('current_show', JSON.stringify($scope.show))
                      $scope.show.Seasons[s][e].loading = false
                      $scope.show.Seasons[s][e].downloaded = true
                      console.log(result.episode, 'is ready')
                      $scope.showIsLoading = false
                      $scope.$applyAsync()
                    })
                })
            })
            .catch(() => {
              console.log('Dialog closed')
            })
        })
    }

    $scope.playTrailer = () => {
      let trailer = $scope.show.Trailer
      console.log('Playing trailer:', trailer)
      dialogService.trailer({
        src: $scope.show.Trailer
      })
    }

    $scope.deleteEpisode = (showObj) => {
      console.log('Deleting', showObj);
      let episode = showObj.episode.episode
      let magnet = showObj.episode.magnet
      let e = episode.split('e')
      let s = e[0].split('s')
      s = parseInt(s[1], 10)
      e = parseInt(e[1], 10)
      $timeout(() => {
        $scope.show.Seasons[s][e].downloaded = false
        $scope.show.Seasons[s][e].loading = false
        delete $scope.show.Seasons[s][e].eta
        delete $scope.show.Seasons[s][e].progress
      }, 1000)
      if (magnet) {
        try {
          wt_client.remove(magnet, () => {
            console.log('Deleted from client')
            for (var i = 0; i < $rootScope.pending.length; i++) {
              if ($rootScope.pending[i].magnet === magnet) {
                $rootScope.pending.splice(i, 1)
              }
            }
            let local_pending = JSON.parse(localStorage.getItem('pending'))
            for (var i = 0; i < local_pending.length; i++) {
              if (local_pending[i].magnet === magnet) {
                local_pending.splice(i, 1)
              }
            }
            localStorage.setItem('pending', JSON.stringify(local_pending))
            console.log('Deleted from pending')
          })
        } catch (err) {

        }
      }
      dbService.get($scope.dashed_title)
        .then((doc) => {
          doc.Seasons[s][e].downloaded = false
          delete doc.Seasons[s][e].eta
          delete doc.Seasons[s][e].progress
          dbService.put($scope.dashed_title, doc)
            .then(() => {
              console.log('Deleted from db')
            })
            .catch((err) => {
              console.error('Error writing db', err)
            })
        })
      $rootScope.$applyAsync()
      rimraf(__dirname + '/../../library/' + commonService.dashedToSpaced($scope.dashed_title) + '/' + episode, function() {
        console.log('Deleted from actual folder')
      });
    }


    $scope.deleteShow = () => {
      dialogService.confirm({
          data: $scope.show.DashedTitle
        })
        .then(() => {
          $rootScope.loading = true
          let show = commonService.dashedToSpaced($scope.dashed_title)
          dbService.get($scope.show.DashedTitle)
            .then(function(doc) {
              return dbService.remove(doc)
            }).then(function(result) {
              console.log('Deleted from db')
            }).catch(function(err) {
              console.log(err)
            })
          delete $rootScope.current_show
          sessionStorage.removeItem('current_show')
          $rootScope.$applyAsync()
          fsExtra.removeSync(__dirname + '/../../library/' + show)
          console.log('Deleted from actual folder')
          $state.go('app.library', {}, {
            reload: true
          })
        })

    }

    // INIT
    start()



  }
})();