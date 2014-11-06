(function () {
    'use strict';

    var module = angular.module('hackathon.components.tree', [
        'hackathon.templates'
    ]);

    module.directive('tree', function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'hackathon/templates/tree.html',
            scope: {},
            link: function () {
            }
        };
    });

})();
