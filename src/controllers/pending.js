(function() {
  'use strict';

  angular
    .module('app')
    .controller('pendingCtrl', pendingCtrl);

  function pendingCtrl($rootScope, $state, $scope, $interval, wtService) {

    $rootScope.loading = false
    const wt_client = wtService.client()
    let fsExtra = require('fs-extra')
    let recent = $rootScope.recent

    // console.log('recent', recent)

    function setRecentDownloads() {
      recent = localStorage.getItem('recent')
      if (recent) {
        recent = JSON.parse(recent)
      } else {
        recent = []
      }
      $rootScope.recent = recent
    }

    let destroyShowListener;
    $scope.$on('$destroy', function() {
      destroyShowListener()
    })
    destroyShowListener = $rootScope.$on('episode_downloaded', (e, showResult) => {
      console.log('Downloaded', showResult);
      setRecentDownloads()
      $rootScope.$applyAsync()
    })

    var deleteFromPending = (torrent) => {
      for (var i = 0; i < $rootScope.pending.length; i++) {
        if ($rootScope.pending[i].dashed_show === torrent.dashed_show && $rootScope.pending[i].episode === torrent.episode) {
          $rootScope.pending.splice(i, 1)
        }
      }
      let local_pending = JSON.parse(localStorage.getItem('pending'))
      for (var i = 0; i < local_pending.length; i++) {
        if (local_pending[i].dashed_show === torrent.dashed_show && local_pending[i].episode === torrent.episode) {
          local_pending.splice(i, 1)
        }
      }
      localStorage.setItem('pending', JSON.stringify(local_pending))
      $rootScope.$applyAsync()
    }

    $scope.remove = (episode) => {
      recent.forEach((r, i) => {
        if (r.magnet === episode.magnet) { recent.splice(i, 1) }
        localStorage.setItem('recent', JSON.stringify(recent))
        $rootScope.recent = recent
      })
      console.log('Recent', recent)
    }

    $scope.cancel = (torrent) => {
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
      $state.go('app.episode', ({
        show: episode.dashed_show,
        episode: episode.episode
      }))
    }

    // INIT
    setRecentDownloads()
  }
})();
