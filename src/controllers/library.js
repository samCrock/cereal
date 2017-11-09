(function() {
  'use strict';

  angular
    .module('app')
    .controller('libraryCtrl', libraryCtrl);

  function libraryCtrl($rootScope, $state, $scope, commonService, dbService, jsonService) {

    // $rootScope.loading = true

    $scope.fromNow = (date) => { return moment(date).fromNow() }

    $scope.sortableLibrary = (library) => {
      var sortable = []
      angular.forEach(library, function(value, key) {
        if (value.hasOwnProperty('last_download')) {
          sortable.push(value)
        }
      })
      return sortable
    }

    var library = $rootScope.library
    console.log('Library --->', library)
    $rootScope.msg = 'Filling library'
    if (angular.equals({}, $scope.sortableLibrary(library))) $scope.emptyLibrary = true

    $scope.watch = (show) => {
      $state.go(app.episode({
        show: show.title,
        episode: show.episode
      }))
    }

    // ---------------LAYOUT HANDLER-------------
    var config = sessionStorage.getItem('LAYOUT_CONFIG')

    var libraryLength = Object.keys($rootScope.library).length
    var rows = Math.floor(libraryLength / config.columns)
    var libraryHeight = config.poster_h * rows + rows + config.rem * 5 // poster height, + margins + navbar top
    var libraryWidth = config.poster_w * config.columns + config.columns // poster height, + margins + navbar top

    var library_container = document.getElementById('library_container')
    if (library_container) library_container.style.height = libraryHeight
      // ------------------------------------------

  }

})();
