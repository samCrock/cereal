(function() {
    'use strict';

    angular
        .module('app')
        .controller('libraryCtrl', libraryCtrl);

    function libraryCtrl($rootScope, $state, $scope, commonService, dbService) {

        console.log('Library')
        $rootScope.loading = false
        $scope.library = {}

        $scope.getPoster = function(show) {
            return ('./assets/posters/' + commonService.spacedToDashed(show)) + '.jpg'
        }

        $scope.sortableLibrary = (library) => {
            var sortable = []
            angular.forEach(library, function(value, key) {
                if (value.hasOwnProperty('last_update')) {
                    sortable.push(value)
                }
            })
            return sortable
        }

        dbService.fetchShows().then((library) => {
            console.log('Library --->', library)
            let empty = true
            for (var prop in library) {
                if (library.hasOwnProperty(prop)) {
                    empty = false
                }
                let s_count = 0
                for (var s in library[prop].Seasons) {
                    s_count++
                }
                library[prop].SeasonsCount = s_count
            }
            $scope.isEmpty = empty

            $scope.library = library

            // ---------------LAYOUT HANDLER-------------
            var config = sessionStorage.getItem('LAYOUT_CONFIG')

            var libraryLength = Object.keys($scope.library).length
            var rows = Math.floor(libraryLength / config.columns)
            var libraryHeight = config.poster_h * rows + rows + config.rem * 5 // poster height, + margins + navbar top
            var libraryWidth = config.poster_w * config.columns + config.columns // poster height, + margins + navbar top

            var library_container = document.getElementById('library_container')
            if (library_container) library_container.style.height = libraryHeight
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
