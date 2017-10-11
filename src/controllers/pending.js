(function() {
  'use strict';

  angular
  .module('app')
  .controller('pendingCtrl', pendingCtrl);

  function pendingCtrl($rootScope, $state, $scope, $interval, wtService) {

    $rootScope.loading = false
    const wt_client = wtService.client()
    let fsExtra = require('fs-extra')
    let recent = localStorage.getItem('recent')

    console.log('recent', recent)

    function setRecentDownloads() {
      recent = localStorage.getItem('recent')
      if (recent) {
        recent = JSON.parse(recent)
      } else { recent = [] }
      $scope.recent = recent
    }

    let destroyShowListener;
    $scope.$on('$destroy', function() {
      destroyShowListener()
    })
    destroyShowListener = $rootScope.$on('episode_downloaded', (e, showResult) => {
      console.log('Downloaded', showResult);
      setRecentDownloads()
      $scope.$applyAsync()
    })

    var deleteFromPending = (torrent) => {
      for (var i = 0; i < $rootScope.pending.length; i++) {
        if ($rootScope.pending[i].show === torrent.show && $rootScope.pending[i].episode === torrent.episode) {
          $rootScope.pending.splice(i, 1)
        }
      }
      let local_pending = JSON.parse(localStorage.getItem('pending'))
      for (var i = 0; i < local_pending.length; i++) {
        if (local_pending[i].show === torrent.show && local_pending[i].episode === torrent.episode) {
          local_pending.splice(i, 1)
        }
      }
      localStorage.setItem('pending', JSON.stringify(local_pending))
      $rootScope.$applyAsync()
    }

    $scope.remove = (torrent) => {
      console.log(torrent);
      if (wt_client.get(torrent.magnet)) {
        wt_client.remove(torrent.magnet, () => {
          console.log('Deleted from client')
          deleteFromPending(torrent)
        })
      } else {
        console.log('No torrent in wt');
        deleteFromPending(torrent)
      }
    }

    $scope.play = function(episode) {
      for (var i = recent.length - 1; i >= 0; i--) {
        if (recent[i].torrent === episode.torrent) {
          recent = recent.splice(i, 1)
          localStorage.setItem('recent', JSON.stringify(recent))
        }
      }
      $state.go('app.episode', ({ show: episode.show, episode: episode.episode }))
    }

    // INIT
    setRecentDownloads()
  }
})();
