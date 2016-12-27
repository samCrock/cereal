(function() {
    'use strict';

    angular
        .module('app')
        .controller('libraryCtrl', libraryCtrl);

    function libraryCtrl($rootScope, $state, $scope, commonService, libraryService) {

        console.log('Library')
        $rootScope.loading = false
        $scope.library = {}

        libraryService.getLibrary().then((library) => {
            console.log('Library --->', library)
            var isNew = true
            for (var i = 0; i < library.length; i++) {
                if (!$scope.library[library[i].show]) {
                    $scope.library[library[i].show] = []
                    $scope.library[library[i].show].push(library[i])
                }else {
                    $scope.library[library[i].show].push(library[i])
                }

            }
            console.log('$scope.library --->', $scope.library)
            $scope.$apply()
        })


        $scope.watch = (show) => {
            $state.go(app.episode({
                show: show.title,
                episode: show.episode
            }))
        }


    }

})();
