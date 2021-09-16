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

.service('UserService', function() {
  // For the purpose of this example I will store user data on ionic local storage but you should save it on a database
  var setUser = function(user_data) {
    window.localStorage.starter_facebook_user = JSON.stringify(user_data);
  };

  var getUser = function(){
    return JSON.parse(window.localStorage.starter_facebook_user || '{}');
  };

  return {
    getUser: getUser,
    setUser: setUser
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

.controller('LoginCtrl', function($scope, AuthService, $ionicLoading, $ionicPopup, $state, $q, UserService) {
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
      $state.go('tab.events-list');
    }, function(errMsg) {
      $ionicLoading.hide();
      var alertPopup = $ionicPopup.alert({
        title: 'Connexion impossible'
      });
    });
  };

  // FB Login Stuff

  // This is the success callback from the login method
  var fbLoginSuccess = function(response) {
    if (!response.authResponse){
      fbLoginError("Cannot find the authResponse");
      return;
    }

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
    .then(function(profileInfo) {
      // For the purpose of this example I will store user data on local storage
      UserService.setUser({
        authResponse: authResponse,
        userID: profileInfo.id,
        name: profileInfo.name,
        email: profileInfo.email,
        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
      });
      $ionicLoading.hide();
      $state.go('tab.events-list');
    }, function(fail){
      // Fail get profile info
      console.log('profile info fail', fail);
    });
  };

  // This is the fail callback from the login method
  var fbLoginError = function(error){
    console.log('fbLoginError', error);
    $ionicLoading.hide();
  };

  // This method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
        console.log(response);
        info.resolve(response);
      },
      function (response) {
        console.log(response);
        info.reject(response);
      }
    );
    return info.promise;
  };

  //This method is executed when the user press the "Login with facebook" button
  $scope.facebookSignIn = function() {
    facebookConnectPlugin.getLoginStatus(function(success){
      if(success.status === 'connected'){
        // The user is logged in and has authenticated your app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed request, and the time the access token
        // and signed request each expire
        console.log('getLoginStatus', success.status);

        // Check if we have our user saved
        var user = UserService.getUser('facebook');

        if(!user.userID){
          getFacebookProfileInfo(success.authResponse)
          .then(function(profileInfo) {
            // For the purpose of this example I will store user data on local storage
            UserService.setUser({
              authResponse: success.authResponse,
              userID: profileInfo.id,
              name: profileInfo.name,
              email: profileInfo.email,
              picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
            });

            $ionicLoading.show({
              template: 'YEAAAH'
            });

            $state.go('tab.events-list');
          }, function(fail){

            $ionicLoading.show({
              template: 'FAIL'
            });
            // Fail get profile info
            console.log('profile info fail', fail);
          });
        }else{
          $ionicLoading.show({
              template: 'EPIC FAIL'
            });
          //$state.go('app.home');
        }
      } else {
        // If (success.status === 'not_authorized') the user is logged in to Facebook,
        // but has not authenticated your app
        // Else the person is not logged into Facebook,
        // so we're not sure if they are logged into this app or not.

        console.log('getLoginStatus', success.status);
        
        $ionicLoading.show({
          template: 'Minor Fail'
        });

        // Ask the permissions you need. You can learn more about
        // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
      }
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