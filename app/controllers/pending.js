(function() {
    'use strict';

    angular
        .module('app')
        .controller('pendingCtrl', pendingCtrl);

    function pendingCtrl($rootScope, $state, $scope, $interval, wtService) {

        $rootScope.loading = false
        const wt_client = wtService.client()
        let fsExtra = require('fs-extra')

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

    }
})();
