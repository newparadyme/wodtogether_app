angular.module('wodtogether.controllers', [])

.controller('LoginCtrl', function($scope, $state, $cordovaPush, API) {
	$scope.login = function(email, password) {
		API.login({
			email: email,
			password: password
		}).then(function(response) {
			var login_result = response.data;
			if (login_result && login_result.access_token) {
				if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
					// Register Device
					var config = null;
					
					if (ionic.Platform.isAndroid()) {
					    config = {
					        "senderID": WODTogetherConfig.gcm_senderID // REPLACE THIS WITH YOURS FROM GCM CONSOLE - also in the project URL like: https://console.developers.google.com/project/434205989073
					    };
					} else if (ionic.Platform.isIOS()) {
					    config = {
					        "badge": "true",
					        "sound": "true",
					        "alert": "true"
					    }
					}
					
					$cordovaPush.register(config).then(function (result) {
					    // ** NOTE: Android regid result comes back in the pushNotificationReceived, only iOS returned here
					    if (ionic.Platform.isIOS()) {
							storeDeviceToken("ios", result);
					    }
					}, function (err) {

					});
					
					function storeDeviceToken(type, token) {
						var params = {
							method: "registerDevice",
							regid: token,
							type: type
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
				}

				$state.go("app.home.wods", {}, {reload: true});
			}
		});
	};
	
	if (API.getUserData()) {
		$state.go("app.home.wods");
	}
})

.controller('AppCtrl', function($scope, $state, API) {
	$scope.logout = function() {
		API.logout();
		$state.go("login");
	};
	
	$scope.getDateInfo = function(d) {
		if (!angular.isDate(d)) {
			d = new Date(d);
			d.setDate(d.getDate()+1);
		}
		
		var year = d.getFullYear();
		var month = d.getMonth() + 1;
		if (month < 10) {
			month = '0' + month;
		}
		var day = d.getDate();
		if (day < 10) {
			day = '0' + day;
		}
		
		var ymd = '' + year + month + day;
		var y_m_d = year + '-' + month + '-' + day;
		
		return {
			year: year,
			month: month,
			day: day,
			ymd: ymd,
			y_m_d: y_m_d
		}
	};
})

.controller('HomeCtrl', function($scope, $state, API) {
	$scope.data =  {
		last_updated: 0,
		new_comment: ''
	};
	$scope.wodsSelect = {};
	$scope.dailyComments = {};
	$scope.getCount = function() {
		if ($scope.dailyComments.data) {
			return $scope.dailyComments.data.comments.length;
		} else {
			return 0;
		} 
	};
	
	var user_data = API.getUserData();
	if (!user_data) {
		$state.go("login");
		return;
	}
	
	$scope.changeDate = function(direction) {
		var d = new Date($scope.tabdate);
		if (direction == "prev") {
			d.setDate(d.getDate() - 1);
			date_info = $scope.getDateInfo(d);
		} else if (direction == "next") {
			d.setDate(d.getDate() + 1);
			date_info = $scope.getDateInfo(d);
		} else if (direction == "today") { 
			d = new Date();
			date_info = $scope.getDateInfo(d);
		} else {
			date_info = $scope.getDateInfo(d);
		}
		
		$scope.tabdate = d;

		var params = {
			method: "wodsSelect",
			date: date_info.ymd
		};
		API.post(params).then(function(response) {
			var api_response = response.data;
			if (api_response.response_code > 0) {
				$scope.wodsSelect.data = api_response.data;
				$scope.wodsSelect.empty = (api_response.data.wods.length < 1);
				
				var params = {
					method: "gyms/dailyComments",
					date: date_info.ymd,
					gid: user_data.user.gym_id
				};

				$scope.data.last_updated = Date.now() / 1000;
				API.post(params).then(function(response) {
					var api_response = response.data;
					if (api_response.response_code > 0) {
						$scope.dailyComments.data = api_response.data;
						$scope.dailyComments.count = api_response.data.comments.length;
					} else {
						// error fetching comments
					}
				});
			} else {
				// error fetching wods
			}
		});
	};
	
	$scope.$on('$ionicView.enter', function(){
		if ($scope.tabdate == "today" || !$scope.tabdate) {
			$scope.tabdate = new Date();
			$scope.changeDate($scope.tabdate);
		} else {
			var update_threshold = (Date.now() / 1000) - 15; // fetch data if it hasn't been updated in the last 15 seconds
			if ($scope.data.last_updated < update_threshold) {
				$scope.changeDate(false);
			}
			
		}
	});
		
	$scope.addComment = function() {
		var new_comment = $scope.data.new_comment;
		var date_info = $scope.getDateInfo($scope.tabdate);
		
		var params = {
			method: "gyms/addComment",
			date: date_info.ymd,
			comment: new_comment,
			gid: user_data.user.gym_id
		};
		
		API.post(params).then(function(response) {
			var api_response = response.data;
			if (api_response.response_code > 0) {
				$scope.dailyComments.data.comments.push(api_response.data.comment);
				$scope.data.new_comment = '';
			} else {
				alert('test4: ' + api_response.response_code);
				// error fetching comments
			}
		});
	};
})
.controller('SettingsCtrl', function($scope, $state, API) {	
	API.post({method: "users/getAppSettings"}).then(function(response){
		var api_response = response.data;
		if (api_response.response_code > 0) {
			$scope.enable_notifications = api_response.data.enable_notifications;
		}
	});
	
	$scope.saveSettings = function(enable_notifications) {
		var params = {
			method: "users/saveAppSettings",
			enable_notifications: enable_notifications
		};
		API.post(params).then(function(response) {
			var api_response = response.data;
			if (api_response.response_code > 0) {
				API.toast('all good');
			} else {
				API.toast('error saving settings');
			}
		});
	}
})
;
