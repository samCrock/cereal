(function() {
  'use strict';

  angular
    .module('app')
    .service('dialogService', dialogService);

  /* @ngInject */
  function dialogService($mdDialog, $sce) {

    let message_module = {}

    message_module['notify'] = function notify(notifyObj) {
      let parentEl = angular.element(document.body)
      $mdDialog.show({
        controller: function($scope, $mdDialog) {
          $scope.close = function() {
            $mdDialog.cancel()
          }
        },
        parent: parentEl,
        clickOutsideToClose: true,
        templateUrl: 'src/partials/dialog/notify_tmpl.html',
        locals: {
          title: notifyObj.title,
          content: notifyObj.content
        }
      }
        // .parent(angular.element(document.querySelector('#header')))
        // .clickOutsideToClose(true)
        // .templateUrl: 'src/partials/dialog/trailer_tmpl.html'
        // .title(notifyObj.title)
        // .textContent(notifyObj.content)
        // .ok('OK')
      )
    }

    message_module['trailer'] = function trailer(params) {
      let src = $sce.trustAsResourceUrl(params.src.replace("watch?v=", "embed/"))
      let parentEl = angular.element(document.body)
      $mdDialog.show({
        controller: DialogController,
        parent: parentEl,
        clickOutsideToClose: true,
        templateUrl: 'src/partials/dialog/trailer_tmpl.html',
        locals: {
          src: src
        }
      })

      function DialogController($scope, $mdDialog, src) {
        $scope.src = src
        $scope.close = function() {
          $mdDialog.cancel()
        }
      }
    }

    message_module['confirm'] = function confirm(params) {
      return new Promise(function(resolve, reject) {
        let data = params
        let parentEl = angular.element(document.body)
        console.log('data', data)
        $mdDialog.show({
            controller: DialogController,
            parent: parentEl,
            clickOutsideToClose: true,
            templateUrl: 'src/partials/dialog/confirm_tmpl.html',
            locals: {
              data: data
            }
          })
          .then(function(result) {
            resolve(result)
          }, function() {
            reject()
          })

        function DialogController($scope, $mdDialog, $timeout, data) {
          $scope.data = data
          $scope.show = data.show
          console.log('DialogController', data)
          $scope.confirm = function() {
            $mdDialog.hide()
          }
          $scope.close = function() {
            $mdDialog.cancel()
          }
        }
      })
    }

    message_module['torrentForm'] = function torrentForm(searchObj) {
      return new Promise(function(resolve, reject) {
        let formattedDate = searchObj.date.split('T')[0].replace(/-/g, '.')
        let parentEl = angular.element(document.body)
        searchObj.episodeAlias = formattedDate
        console.log('locals', searchObj)
        $mdDialog.show({
            controller: DialogController,
            parent: parentEl,
            clickOutsideToClose: true,
            templateUrl: 'src/partials/dialog/episode_tmpl.html',
            locals: {
              searchObj: searchObj
            }
          })
          .then(function(result) {
            resolve(result)
          }, function() {
            reject()
          })

        function DialogController($scope, $mdDialog, $timeout, searchObj) {
          $scope.searchObj = searchObj
          $scope.show = searchObj.show
          $scope.episodeOption = searchObj.episode
          console.log('DialogController', searchObj)
          $scope.search = function(result) {
            $mdDialog.hide(result)
          }
          $scope.close = function() {
            $mdDialog.cancel()
          }
        }
      })
    }

    return message_module
  }
})();