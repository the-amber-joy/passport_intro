var app = angular.module('getApp', []);

app.controller('MainController', function ($scope, $http){
    $http.get('/getUser').then(function(response){
        console.log(response);
        $scope.user = response;
    })
});