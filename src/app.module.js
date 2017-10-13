(function() {
  'use strict'

  angular
    .module('app', ['ngMaterial', 'ngMdIcons', 'ui.router', 'pascalprecht.translate'])
    .config(function($translateProvider) {
      $translateProvider
        .translations('en', {
          key: 'translated'
        })
        .use('en');
    })

})()