(function() {
    'use strict';

    angular
        .module('app')
        .controller('libraryCtrl', libraryCtrl);

    function libraryCtrl($rootScope, $state, $scope, commonService, libraryService) {

        console.log('Library')
        $rootScope.loading = false
        $scope.library = {}

        $scope.getPoster = function(show) {
            return ('./assets/posters/' + commonService.spacedToDashed(show)) + '.jpg'
        }

        libraryService.getLibrary().then((library) => {
            console.log('Library --->', library)
            let empty = true
            for (var prop in library) {
                if (library.hasOwnProperty(prop)) {
                    // handle prop as required
                    empty = false
                }
            }
            $scope.emptyLibrary = empty
                // var isNew = true
                // for (var i = 0; i < library.length; i++) {
                //     if (!$scope.library[library[i].show]) {
                //         $scope.library[library[i].show] = []
                //         $scope.library[library[i].show].push(library[i])
                //     } else {
                //         $scope.library[library[i].show].push(library[i])
                //     }
                // }
            $scope.library = library
            console.log('$scope.library --->', $scope.library)

            // ---------------LAYOUT HANDLER-------------
            var config = sessionStorage.getItem('LAYOUT_CONFIG')

            var libraryLength = Object.keys($scope.library).length
            var rows = Math.floor(libraryLength / config.columns)
            var libraryHeight = config.poster_h * rows + rows + config.rem * 5 // poster height, + margins + navbar top
            var libraryWidth = config.poster_w * config.columns + config.columns // poster height, + margins + navbar top

            var library_container = document.getElementById('library_container')
            library_container.style.height = libraryHeight
                // ------------------------------------------

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
