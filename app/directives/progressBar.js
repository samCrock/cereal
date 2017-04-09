(function() {
    'use strict';

    angular
        .module('app')
        .directive('progressBar', progressBar)

    /* @ngInject */
    function progressBar() {

        var directive = {
            link: link,
            scope: {
                progress: '='
            },
            restrict: 'E',
            templateUrl: 'app/directives/progressBar.html'
        }
        return directive

        function link(scope) {
            // console.log('progressBar scope:', scope.progress)
            scope.progress_label = scope.progress ? scope.progress + '%' : '0'
            if (!scope.progress || window.matchMedia( "(min-width: 900px)" )) scope.relativeWidth = scope.progress + '%'
            if (scope.progress) scope.relativeWidth = 'calc(900px * ' + scope.progress + ' / 100)'

        }
    }
})();