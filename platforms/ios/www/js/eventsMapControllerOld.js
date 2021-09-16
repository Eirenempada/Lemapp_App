/*
* Controller pour Event map. Bcp de choses à améliorer.
* - La variable currentUserId est toujours recalculé. Elle intervient 3x dans
*   addEvents2MapMarkers, dans toutes les fonctions du user2EventCtrl controller
*	ainsi que dans l'eventsDetailController. Il faut faire un module ou un truc comme ça.
*	Pour plus tard.
* - En outre je remarque que le AuthService.currentUserId retourne pe un
*	tableau... Donc y'aurait pas besoin de le stringigier... c'est bizzare...Ca vient pe
*	de l'API...
* - Je pourrais essayer JSHint pour tema les erreurs et tout.
* Thanks to Dave Alden 
*/
angular.module("HaveaTalk.eventsMap", ['angular-storage', 'leaflet-directive','geolocation'])

.controller("eventsMapController", function($http, apiUrl, $log, $scope, AuthService, geolocation, mapboxMapId, mapboxAccessToken, leafletData , $timeout) {	

      $scope.mapCenter = {};
	  $scope.mapDefaults = {};
	  $scope.mapMarkers = [];
	  $scope.userCoords = {};
	  $scope.eventCoords= {};
	  $scope.data = {};
	  $scope.radius = {};
	  $scope.mapEnabled = false;
	  $scope.mapBounds;
	  $scope.filters = [];
	  $scope.status = [{"name": "in_progress"}, {"name": "assigned"}, {"name": "acknowledged"}, {"name": "created"}, {"name": "solved"}];
	  
	  var userPos;
	  var eventPos;
 	
	  if($scope.mapDefaults != null){
	  	$scope.mapDefaults.off();
	  	$scope.mapDefaults.remove();
	  }
	  

	  getEvents();
	 
		/* Pour les formats de dates
		* https://github.com/urish/angular-moment
		*/


		function createData4POST(map)
		{
			$scope.mapBounds = map.getBounds();
			$scope.data = {
				"loc": {
					"$geoWithin": {
						"$geometry": {
							"type" : "Polygon",
							"coordinates": [[
								[ $scope.mapBounds._northEast.lng, $scope.mapBounds._northEast.lat ],
								[ $scope.mapBounds._southWest.lng, $scope.mapBounds._northEast.lat ], 
								[ $scope.mapBounds._southWest.lng, $scope.mapBounds._southWest.lat ], 
								[ $scope.mapBounds._northEast.lng, $scope.mapBounds._southWest.lat ],
								[ $scope.mapBounds._northEast.lng, $scope.mapBounds._northEast.lat ]
							]]
						}
					}
				}
			}
		}
		
		function getEvents()
		{
			$http({
				method: 'GET',
				url: apiUrl + '/events',
			}).success(createFiltersList)
		}
		
		function createFiltersList(events)
		{
			//A revoir
			$scope.events = events;
		}
		
		$scope.refreshEventsByFilters = function refreshEventsByFilters()
		{
			//afficher les markers selon les filtres
			/* $scope.filters = checked-boxes mais ça me soule de continuer juste là a chercher lolilol */
		}
		
		
		
		//recupération des events dans le périmètre de l'utilisateur
		function getEventsFromLocation()
		{
            console.log("Fonction getEvent");
			$http({
				method: 'GET',
				url: apiUrl + '/events',
				data: $scope.data
			}).success(addEvents2MapMarkers)
		}
		
		function addEvents2MapMarkers(events)
		{
			clearMarkers();
			$scope.mapMarkers.push(userPos);

			angular.forEach(events, function(event, index){

				var iconCat = {
			  	iconUrl: event.categoryId.catLogoUrl ,
			  	shadowUrl: './css/images/markers-shadow.png',
		        iconSize:     [36, 45], // size of the icon
		        shadowSize:   [35, 16], // size of the shadow
		        iconAnchor:   [18, 44], // point of the icon which will correspond to marker's location
		        shadowAnchor: [5, 16],  // the same for the shadow
		        popupAnchor:  [0, -48] // point from which the popup should open relative to the iconAnchor
			  } 
				
				$scope.eventCoords.lat = event.placeId.location.coordinates[0];
				$scope.eventCoords.lng = event.placeId.location.coordinates[1];
				
				/*
				* Création du message
				*/
				var subject = '<h1>{{ event.subject }}</h1>';
				var placename = "<h2>{{ event.placeId.name }}</h2>";
				var eventDate = "<p>{{ event.date | date: 'EEEE d MMMM à HH:mm'}}</p>";
				var img = '<img class="full-image" src="{{ event.imgurl }}">'
				var space = "";
				var more = "<p>&nbsp;</p><button class='button button-positive' ng-controller='goDetailEventCtrl' ng-click='goDetail(event._id)'><i class='fa fa-plus'></i></button>"
				var isInEvent = 0;
				var currentUserId = String(JSON.stringify(AuthService.currentUserId));
				currentUserId = currentUserId.replace('[{"_id":"', '');
				currentUserId = currentUserId.replace('"}]','');

				

				//On parcour le tableau
				for (var i=0; i<event.space; i++) {
					switch(event.userId[i])
					{
						//si vide, on affiche un cercle
						case undefined:
							space = space + '<button class="button button-stable"><i class="fa fa-circle-thin"></i></button>';
							break;
						//si l'entrée correspond à l'utilisateur courrant, on met un icone en vert
						case currentUserId:
							space = space + '<button class="button button-balanced"><i class="fa fa-user"></i></button>';
							isInEvent = 1;
							break;
						//si c'est ni vide, ni l'utilisateur courrant, on met une icone bleue
						default:
							space = space + '<button class="button button-calm"><i class="fa fa-user"></i></button>';
					}

				}

				//Si l'utilisateur est inscrit on ajoute le bouton de désincription
				if(isInEvent){
					space = space + '<button class="button button-assertive" ng-click="removeUser2Event(event._id)"><i class="fa fa-user-times"></i></button>';
				}

				//Si il reste de la place et que l'utilisateur est pas inscrit on ajoute le bouton d'inscription
				if((event.userId.length < event.space) && (isInEvent == 0)) {

					space = space + '<button class="button button-balanced" ng-click="addUser2Event(event._id)"><i class="fa fa-user-plus"></i></button>';
				}
				
				eventPos = {
					lat: $scope.eventCoords.lat,
					lng: $scope.eventCoords.lng,
					icon: iconCat,
					message: '<div class="card padding"  ng-controller="goDetailEventCtrl" ng-click="goDetail(event._id)">' + img + subject + placename + eventDate + '</div>',
					getMessageScope: function() {
						var scope = $scope.$new();
						scope.event = event;
						return scope;
					}
				}
				
				//{{ date_expression | date : format : timezone}}
				$scope.mapMarkers.push(eventPos);
			});
		}
		
		function clearMarkers()
		{
			$scope.mapMarkers.length =0;
		}
		
		function refresh(event)
		{
			leafletData.getMap().then(createData4POST).then(getEventsFromLocation);
		}
		
		$scope.$on('leafletDirectiveMap.zoomend', refresh);
		$scope.$on('leafletDirectiveMap.moveend', refresh);
	
   
	//recupération de la localisation de l'utilisateur 
	geolocation.getLocation().then(function(data) {
		
		$scope.mapCenter.lat = data.coords.latitude;
		$scope.mapCenter.lng = data.coords.longitude;
		$scope.mapCenter.zoom = 14;

		$timeout(function () {
       		$scope.mapEnabled = true;
		}, 1000);
		

		
		var mapboxTileLayer = "https://api.mapbox.com/styles/v1/mojojojolapin/" + mapboxMapId;
		
		mapboxTileLayer = mapboxTileLayer + "/tiles/256/{z}/{x}/{y}?access_token=" + mapboxAccessToken;

		
		
        $scope.mapDefaults = {
           tileLayer: mapboxTileLayer,
			 events: {
				map: {
					enable: ['zoomend', 'drag', 'click'],
					
	            }
	        }
        };
   	

      	
		
		

		//ajout du pin du user
		$scope.userCoords.lat = $scope.mapCenter.lat;
		$scope.userCoords.lng = $scope.mapCenter.lng;
		userPos = {
			lat: $scope.userCoords.lat,
			lng: $scope.userCoords.lng,
			icon: {
						type: 'awesomeMarker',
						icon: 'street-view',
						prefix: 'fa',
					},
		}
		$scope.mapMarkers.push(userPos);
		
		
	}, function(error) {
		$log.error("Could not get location: " + error);
	})

	$scope.addUser2Event = function(eventId) {
		leafletData.getMap().then(function(map) {
        	map.closePopup();
    	});
    	
		var currentUserId = String(JSON.stringify(AuthService.currentUserId));
		currentUserId = currentUserId.replace('[{"_id":"', '');
		currentUserId = currentUserId.replace('"}]','');
    	$http({
				method: 'PUT',
				url: apiUrl + '/events/' + eventId + '/adduser',
				data: '{"userId":"' + currentUserId + '"}'
		}).success(refresh) //remplacer goDetailEvent par Refrehs
    };

    $scope.removeUser2Event = function(eventId) {
    	leafletData.getMap().then(function(map) {
        	map.closePopup();
    	});
		var currentUserId = String(JSON.stringify(AuthService.currentUserId));
		currentUserId = currentUserId.replace('[{"_id":"', '');
		currentUserId = currentUserId.replace('"}]','');
    	$http({
				method: 'PUT',
				url: apiUrl + '/events/' + eventId + '/removeuser',
				data: '{"userId":"' + currentUserId + '"}'
		}).success(refresh) //remplacer goDetailEvent par Refresh
    };

})

.controller("goDetailEventCtrl", function($log, $scope, $state, AuthService) {

	console.log('goDetailEventCtrl');

	$scope.goDetail = function(event){
		$state.go('event-detail', { 'currentEventId' : event }); //appliquer sur bouton
	}

});
;