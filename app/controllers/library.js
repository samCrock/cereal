(function() {
    'use strict';

    angular
        .module('app')
        .controller('libraryCtrl', libraryCtrl);

    function libraryCtrl($rootScope, $state, $scope, commonService, torrentService){

        console.log('Library')
        $rootScope.loading = false

        // libraryService.getLibrary().then((library) => {
        //     console.log('Library --->', library)
        //         // let ranges = commonService.putInRange(library)
        //         // $rootScope.ranges = ranges
        //         // console.log('**********')
        //         // console.log(ranges)
        //         // console.log('**********')
        //         // $rootScope.$apply()
        // })

        $scope.currents = torrentService.getCurrents()
        console.log('currents ->', $scope.currents)

        $scope.watch = (show) => {
            $state.go(app.episode({ show: show.title, episode: show.episode }))
        }


    }

})();

