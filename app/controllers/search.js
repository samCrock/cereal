(function() {
    'use strict';

    angular
        .module('app')
        .controller('searchCtrl', searchCtrl);

    function searchCtrl($rootScope, $state, $scope, $timeout, $stateParams, searchService, commonService, posterService) {

        $rootScope.loading = false
        let input = document.getElementById('input-field')
        $timeout(() => { input.focus() })
        if (sessionStorage.getItem('search_results')) {
            $scope.shows = JSON.parse(sessionStorage.getItem('search_results'))
        }
        if (sessionStorage.getItem('search_string')) {
            $scope.show = sessionStorage.getItem('search_string')
        }

        $scope.$watch('show', (show) => {
            if (show) {
                $scope.show = commonService.capitalCase(show)
            }
        })

        $scope.openShow = function(show) {
            let posterPath = './res/posters/' + commonService.spacedToDashed(show.title) + '.jpg'
            posterService.downloadPosterFromUrl({ path: posterPath, url: show.poster })
            console.log('app.show->', show)
            $state.go('app.show', { show: show.title})
        }

        $scope.search = function() {
            let searchString = $scope.show.toLowerCase()
            console.log('Searching for', searchString)
            sessionStorage.setItem('search_string', searchString)
            $scope.search_loading = true;
            searchService.show(searchString)
                .then((results) => {
                    console.log('Shows found:', results)
                    $scope.search_loading = false
                    $scope.shows = results
                    sessionStorage.setItem('search_results', JSON.stringify(results))
                    $scope.$apply()
                })
        }

    }
})();
