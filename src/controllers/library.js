(function() {
  'use strict';

  angular
  .module('app')
  .controller('libraryCtrl', libraryCtrl);

  function libraryCtrl($rootScope, $state, $scope, commonService, dbService, jsonService, posterService) {

    $rootScope.loading = true
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

    $scope.fromNow = (date) => {
      return moment(date).fromNow()
    }

    dbService.fetchShows()
    .then((library) => {
      console.log('Library --->', library)
      $rootScope.msg = 'Filling library'
      if (angular.equals({}, $scope.sortableLibrary(library))) $scope.emptyLibrary = true
      // Check posters
      let posters = []
      jsonService.getLocalPosters()
      .then((local_posters) => {
        for (var title in library) {
          if (title && title !== undefined) {
            console.log(title)
            let index = local_posters.indexOf(title)
            if (index >= 0) {
              let posterPath = 'assets/posters/' + local_posters[index] + '.jpg'
              // console.log('--poster found--')
              library[title].poster = posterPath
            } else {
              // console.log('Poster to download:', library[title].title)
              posters.push(posterService.downloadPoster(title))
            }
            let s_count = 0
            for (var s in library[title].Seasons) {
              s_count++
            }
            library[title].SeasonsCount = s_count
          }
        }
        Promise.all(posters)
        .then((results) => {
          // console.log('--- All posters found ---', results)
          $scope.library = library
          $rootScope.msg = 'Loading posters'
          $rootScope.loading = false
          $scope.$apply()
        })
      })
      .catch((reason)=>{
        console.error(reason)
      })


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
