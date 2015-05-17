
angular.module('wodtogether', ['ionic', 'ngCordova', 'wodtogether.controllers', 'wodtogether.services'])

.run(function($ionicPlatform, $rootScope, $cordovaPush, $cordovaDialogs, $cordovaAppVersion, API) {
	$ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		$rootScope.wodtogether_version = "0.0.0";
		if (window.cordova) {
			if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
				$cordovaAppVersion.getAppVersion().then(function (version) {
					$rootScope.wodtogether_version = version;
					// @todo call API to get latest version to compare against to prompt to update
				});
			}
			
			if (window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			}
		}
		if (window.StatusBar) {
			// org.apache.cordova.statusbar required
			StatusBar.styleDefault();
		}
		
		// handle push notifications
		// Notification Received
		$rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
			if (ionic.Platform.isAndroid()) {
				handleAndroid(notification);
			}
			else if (ionic.Platform.isIOS()) {
				handleIOS(notification);
			}
		});

		// Android Notification Received Handler
		function handleAndroid(notification) {
			// ** NOTE: ** You could add code for when app is in foreground or not, or coming from coldstart here too
			//             via the console fields as shown.
			console.log("In foreground " + notification.foreground  + " Coldstart " + notification.coldstart);
			if (notification.event == "registered") {
				var params = {
					method: "registerDevice",
					regid: notification.regid,
					type: "gcm"
				};
				API.post(params).then(function(response) {
					var api_response = response.data;
					if (api_response.response_code > 0) {
						// device registered
					} else {
						// error registering device
					}
				});
			}
			else if (notification.event == "message") {
				/**
				 * @todo if it's a new comment for the current date, update the data?
				 */
				$cordovaDialogs.alert(notification.message, "Push Notification Received");
			}
			else if (notification.event == "error") {
				$cordovaDialogs.alert(notification.msg, "Push notification error event");
			}
			else  {
				$cordovaDialogs.alert(notification.event, "Push notification handler - Unprocessed Event");
			}
		} // end of handleAndroid

		// IOS Notification Received Handler
		function handleIOS(notification) {
			// The app was already open but we'll still show the alert and sound the tone received this way. If you didn't check
			// for foreground here it would make a sound twice, once when received in background and upon opening it from clicking
			// the notification when this code runs (weird).
			if (notification.foreground == "1") {
			// Play custom audio if a sound specified.
				if (notification.sound) {
					var mediaSrc = $cordovaMedia.newMedia(notification.sound);
					mediaSrc.promise.then($cordovaMedia.play(mediaSrc.media));
				}
		
				if (notification.body && notification.messageFrom) {
					$cordovaDialogs.alert(notification.body, notification.messageFrom);
				} else {
					$cordovaDialogs.alert(notification.alert, "Push Notification Received");
				}
		
				if (notification.badge) {
					$cordovaPush.setBadgeNumber(notification.badge).then(
						function (result) {
							console.log("Set badge success " + result)
						}, function (err) {
							console.log("Set badge error " + err)
						});
				}
			}
			// Otherwise it was received in the background and reopened from the push notification. Badge is automatically cleared
			// in this case. You probably wouldn't be displaying anything at this point, this is here to show that you can process
			// the data in this situation.
			else {
				if (notification.body && notification.messageFrom) {
					$cordovaDialogs.alert(notification.body, "(RECEIVED WHEN APP IN BACKGROUND) " + notification.messageFrom);
				}
				else { 
					$cordovaDialogs.alert(notification.alert, "(RECEIVED WHEN APP IN BACKGROUND) Push Notification Received");
				}
			}
			
		} // end of handleIOS
		// end of notification stuff
	}); // end ionic platform ready
})

.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider

	.state('login', {
		url: "/login",
		templateUrl: "templates/login.html",
		controller: 'LoginCtrl'
	})
	
	.state('app', {
		url: "/app",
		abstract: true,
		templateUrl: "templates/menu.html",
		controller: 'AppCtrl'
	})
	
	.state('app.home', {
		url: "/home",
		abstract: true,
		views: {
			'menuContent': {
				controller: 'HomeCtrl',
				templateUrl: "templates/home_tabs.html"
			}
		}
	})
	.state('app.home.wods', {
		url: "/wods",
		views: {
			'home_tabs-wods': {
				templateUrl: 'templates/home_tabs-wods.html',
			}
		}
	})
	.state('app.home.discussion', {
		url: "/discussion",
		views: {
			'home_tabs-discussion': {
				templateUrl: 'templates/home_tabs-discussion.html',
			}
		}
	})
	.state('app.home.schedule', {
		url: "/schedule",
		views: {
			'home_tabs-schedule': {
				templateUrl: 'templates/home_tabs-schedule.html',
			}
		}
	})
	
	.state('app.settings', {
		url: "/settings",
		views: {
			'menuContent': {
				controller: 'SettingsCtrl',
				templateUrl: "templates/settings.html"
			}
		}
	})
;
	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/login');
});
