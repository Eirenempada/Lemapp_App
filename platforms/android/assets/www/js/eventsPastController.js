angular.module('HaveaTalk.eventsPast', [])

.controller("eventsPastController", function($log, $scope, $http, apiUrl) {
	$scope.loadEventsList = function () {
		$http.get(apiUrl + '/events').success(function (events) {
			$scope.events = events;
			console.log(events);

			index = 0;

			while (index < events.length)
			{
			    $scope.currentEvent = events[index].name;
			    index++;
			}

		});
	};
	$scope.loadEventsList();
});