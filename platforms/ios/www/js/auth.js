angular.module('HaveaTalk.auth', ['angular-storage'])
.service('AuthService', function($q, $http, apiUrl, store) {
  var LOCAL_TOKEN_KEY = 'yourTokenKey';
  var isAuthenticated = false;
  var authToken;

  function currentUser(user){
    var currentUserId = user.data.user._id;
    store.set('currentUserId', currentUserId );
    console.log('auth currentUserId' + store.get('currentUserId'));
  }
 
  function loadUserCredentials() {
    var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (token) {
      useCredentials(token);
    }
  }
 
  function storeUserCredentials(token) {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
    useCredentials(token);
  }
 
  function useCredentials(token) {
    isAuthenticated = true;
    authToken = token;
 
    // Set the token as header for your requests!
    $http.defaults.headers.common.Authorization = authToken;
  }
 
  function destroyUserCredentials() {
    store.remove('currentUserId');
    authToken = undefined;
    isAuthenticated = false;
    $http.defaults.headers.common.Authorization = undefined;
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
  }
 
  var register = function(user) {
    return $q(function(resolve, reject) {
      $http.post(apiUrl + '/users/register', user).then(function(result) {
        if (result.data.success) {
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      });
    });
  };
 
  var login = function(user) {
    return $q(function(resolve, reject) {
      $http({
        method: 'POST',
        url: apiUrl + '/users/login',
        data: user
      }).then(function(result) {
        console.log('Réponse de l API; Succes true ou false: ' + result.data.success);
        if (result.data.success) {
          currentUser(result);
          storeUserCredentials(result.data.token);
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      });
    });
  };
 
  var logout = function() {
    destroyUserCredentials();
  };
 
  loadUserCredentials();
 
  return {
    login: login,
    register: register,
    logout: logout,
    isAuthenticated: function() {return isAuthenticated;},
  };
})
 
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
      }[response.status], response);
      return $q.reject(response);
    }
  };
})
 
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
})

.controller('LoginCtrl', function($scope, AuthService, $ionicLoading, $ionicPopup, $state) {
  $scope.user = {
    email: '',
    password: ''
  };
 
  $scope.login = function() {
    $ionicLoading.show({
        template: 'Connexion...',
        delay: 750
    });
    console.log('$scope user: ' + JSON.stringify($scope.user));
    AuthService.login($scope.user).then(function(msg) {
      $ionicLoading.hide();
      $state.go('tab.events-map');
    }, function(errMsg) {
      $ionicLoading.hide();
      var alertPopup = $ionicPopup.alert({
        title: 'Connexion impossible'
      });
    });
  };
})
 
.controller('RegisterCtrl', function($scope, AuthService, $ionicPopup, $state) {
  $scope.user = {
    firstname: '',
    lastname: '',
    sexe: '',
    dob: '',
    email: '',
    password: '',
    category: [],
  };
 
  $scope.signup = function() {
    AuthService.register($scope.user).then(function(msg) {
      $state.go('login');
      var alertPopup = $ionicPopup.alert({
        title: 'Inscription réussie !',
        template: msg
      });
    }, function(errMsg) {
      var alertPopup = $ionicPopup.alert({
        title: 'Register failed!',
        template: errMsg
      });
    });
  };
})
 
.controller('LogoutCtrl', function($scope, AuthService, apiUrl, $http, $state) {
  $scope.destroySession = function() {
    AuthService.logout();
  };
 
  $scope.getInfo = function() {
    $http.get(apiUrl + '/memberinfo').then(function(result) {
      $scope.memberinfo = result.data.msg;
    });
  };
 
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  };
})
 
.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS) {
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $state.go('outside.login');
    var alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });
})

;

/*
  .factory('AuthService', function(store) {
    var service = {
      currentUserId: store.get('currentUserId'),
      

      setUser: function(user) {
        service.currentUserId = user;
        store.set('currentUserId', user);
      },

      unsetUser: function() {
        service.currentUserId = null;
        store.remove('currentUserId');
      }
    };

    return service;
  })

  .controller('LogisterCtrl', function(apiUrl, AuthService, $http, $ionicHistory, $ionicLoading, $scope, $state) {

    // The $ionicView.beforeEnter event happens every time the screen is displayed.
    $scope.$on('$ionicView.beforeEnter', function() {
      // Re-initialize the user object every time the screen is displayed.
      // The first name and last name will be automatically filled from the form thanks to AngularJS's two-way binding.
      $scope.user = {};
    });

    // Add the register function to the scope.
    $scope.login = function() {

      // Forget the previous error (if any).
      delete $scope.error;

      // Show a loading message if the request takes too long.
      $ionicLoading.show({
        template: 'Connexion...',
        delay: 750
      });

      // Make the request to retrieve or create the user.
      $http({
        method: 'POST',
        url: apiUrl + '/users/login',
        data: $scope.user
      }).success(function(user) {

        var currentUserId = String(JSON.stringify(user));
        currentUserId = currentUserId.replace('[{"_id":"', '');
        currentUserId = currentUserId.replace('"}]','');

        $http({
          method: 'GET',
          url: apiUrl + '/users/' + currentUserId
        }).success(function(userCheck) {
          console.log('email send ' + $scope.user.email);
          console.log('password send: ' + $scope.user.password);

          console.log('email get: ' + userCheck[0].email);
          console.log('passord get: ' + userCheck[0].password);

          if(($scope.user.email == userCheck[0].email) && ($scope.user.password == userCheck[0].password)){
            console.log("PEUT SE CONNECTER YEAAAAH");
            console.log(user);
            AuthService.setUser(user);
            $ionicLoading.hide();

            $ionicHistory.nextViewOptions({
              disableBack: true,
              historyRoot: true
            });

            $state.go('tab.events-map');
          }else{
            $ionicLoading.hide();
            $scope.error = 'Could not log in.';
          }

        }).error(function() {
          $ionicLoading.hide();
          $scope.error = 'Could not log in.';
        });
  
       

      }).error(function() {
        $ionicLoading.hide();
        $scope.error = 'Could not log in.';
      });
    };

    $scope.register = function(){

      // Forget the previous error (if any).
      delete $scope.error;

      // Show a loading message if the request takes too long.
      $ionicLoading.show({
        template: 'Inscription...',
        delay: 750
      });

      // Make the request to create the user.
      $http({
        method: 'POST',
        url: apiUrl + '/users/',
        data: $scope.user
      }).success(function(user) {

        // If successful, give the user to the authentication service.
        AuthService.setUser(user);
        
        console.log('console.log email scope user ' + $scope.user.email);
        
        // Hide the loading message.
        $ionicLoading.hide();
        console.log('Loading message hidded');

        // Set the next view as the root of the history.
        // Otherwise, the next screen will have a "back" arrow pointing back to the login screen.
        $ionicHistory.nextViewOptions({
          disableBack: true,
          historyRoot: true
        });

        // Go to the issue creation tab.
        $state.go('tab.events-map');

      }).error(function() {
        console.log('une erreur');

        // If an error occurs, hide the loading message and show an error message.
        $ionicLoading.hide();
        $scope.error = 'Could not log in.';
      });
    };
  })

  .controller('LogoutCtrl', function(AuthService, $scope, $state) {
    $scope.logOut = function() {
      AuthService.unsetUser();
      $state.go('login');
    };
  })

  .factory('AuthInterceptor', function(AuthService) {
    return {

      // The request function will be called before all requests.
      // In it, you can modify the request configuration object.
      request: function(config) {

        // If the user is logged in, add the X-User-Id header.
        if (AuthService.currentUserId) {
          config.headers['X-User-Id'] = AuthService.currentUserId;
        }

        return config;
      }
    };
  })

  .config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
  })

;
*/