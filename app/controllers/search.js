(function() {
    'use strict';

    angular
        .module('app')
        .controller('searchCtrl', searchCtrl);

    function searchCtrl($rootScope, $state, $scope, $timeout, $stateParams, searchService,commonService) {

        $rootScope.loading = false
        let input = document.getElementById('input-field')
        $timeout(()=> { input.focus() })
        if (sessionStorage.getItem('search_results')) {
            $scope.shows = JSON.parse(sessionStorage.getItem('search_results'))
        }
        if (sessionStorage.getItem('search_string')) {
            $scope.show = sessionStorage.getItem('search_string')
        }
        $scope.search = function() {
            console.log('Searching for', $scope.show)
            sessionStorage.setItem('search_string', $scope.show)
            $scope.search_loading = true;
            searchService.show($scope.show)
                .then( (results) => {
                    console.log('Shows found:', results)
                    $scope.search_loading = false
                    $scope.shows = results
                    sessionStorage.setItem('search_results', JSON.stringify(results))
                    $scope.$apply()
            })
        }

    }
})();
