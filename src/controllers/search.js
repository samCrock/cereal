(function() {
  'use strict';

  angular
  .module('app')
  .controller('searchCtrl', searchCtrl);

  function searchCtrl($rootScope, $state, $scope, $timeout, $stateParams, searchService, commonService, posterService) {

    $rootScope.loading = false
    $timeout(() => {
      document.getElementById('search-input').focus()
    }, 200)
    if (sessionStorage.getItem('search_results')) {
      $scope.shows = JSON.parse(sessionStorage.getItem('search_results'))
    }
    if (sessionStorage.getItem('search_string')) {
      $scope.show = sessionStorage.getItem('search_string')
    }

    $scope.$watch('show', (show) => {
      if (show) { $scope.show = commonService.capitalCase(show) }
    })

    $scope.openShow = function(show) {
      let posterPath = './assets/posters/' + show.dashedTitle + '.jpg'
      posterService.downloadPosterFromUrl({ path: posterPath, url: show.poster })
      console.log('app.show->', show)
      $state.go('app.show', { show: show.dashedTitle })
    }

    $scope.search = function() {
      $rootScope.loading = true
      let searchString = $scope.show ? $scope.show.toLowerCase() : ''
      console.log('Searching for', searchString)
      sessionStorage.setItem('search_string', searchString)
      searchService.show(searchString)
      .then((results) => {
        $rootScope.loading = false
        console.log('Shows found:', results)
        $scope.shows = results
        sessionStorage.setItem('search_results', JSON.stringify(results))
        $scope.$apply()
      })
    }

    if (!sessionStorage.getItem('search_results')) $scope.search()
  }
})();
