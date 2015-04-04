angular.module('canvas').directive("canvas", [
    function () {

        "use strict";

        return {
            restrict: "A",
            scope: { manager: "=canvas" },
            controller: [

                "$scope",
                "$element",

                function ($scope, $element) {
                    var canvas = angular.element("<canvas>");
                    canvas.width($scope.manager.width());
                    canvas.height($scope.manager.height());

                    $element.append(canvas);

                    $scope.manager.ctx(canvas.get(0));
                }
            ]
        };
    }
]);
