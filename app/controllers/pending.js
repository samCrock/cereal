(function() {
    'use strict';

    angular
        .module('app')
        .controller('pendingCtrl', pendingCtrl);

    function pendingCtrl($rootScope, $state, $scope, $interval, jsonService, torrentService, commonService, wtService) {

        $rootScope.loading = false

        $interval(() => {
            if(!$rootScope.$$phase) {
                $rootScope.$apply()
            }
        }, 1000)



    }
})();
