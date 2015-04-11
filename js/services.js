angular.module('wodtogether.services', [])

.service('API', function($http, $ionicLoading, $q, $state, $cordovaToast) {
	var user_json = window.localStorage.getItem('user_data');
	if (!user_json || user_json == "undefined") {
		user_data = false;
	} else {
		var user_data = JSON.parse(user_json);
	}
	
	if (user_data) {
		this.user_data = user_data;
	} else {
		this.user_data = false;
	}
	
	this.toParams = function (obj) {
		var p = [];
		for (var key in obj) {
			p.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
		}
		return p.join('&');
	};
	
	this.toast = function(msg) {
		if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
        	$cordovaToast.showShortBottom(msg);
        } else {
        	alert(msg);
        }
	}
	
	this.getUserData = function() {
		console.log("getUserData");
		if (!this.user_data) {
			var user_json = window.localStorage.getItem('user_data');
			console.log(user_json);
			if (!user_json || user_json == "undefined") {
				this.user_data = false;
			} else {
				this.user_data = JSON.parse(user_json);
			}
		}
		
		return this.user_data;
	}
	
	this.login = function(user) {
		var that = this;
		user.client_id = WODTogetherConfig.api.client_id; 
		user.client_secret = WODTogetherConfig.api.client_secret;
		user.grant_type = "password";
		user.username = user.email;
		
		$ionicLoading.show({
			template: '<ion-spinner></ion-spinner>'
	    });
		
		return $http({
			method: "POST",
			url: API_ENDPOINT + "token.php",
			data: this.toParams(user),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		}).success(function(response) {
			$ionicLoading.hide();
			window.localStorage.setItem('user_data', JSON.stringify(response));
			that.user_data = response;
			return response.data;
		}).error(function(response) {
			$ionicLoading.hide();
			console.log("error logging in");
			if (response.error_description) {
				alert(response.error_description);
			}
		});
	};
	
	this.logout = function() {
		// remove localstorage
		window.localStorage.removeItem('user_data');
		this.user_data = false;
		console.log("all clear?");
		// @todo .clear()???
	};
	
	this.check = function() {
		var that = this;
		console.log("Session.check");
		if (!this.user_data || !this.user_data.access_token) {
			// we don't even have an access token
			return $q(function(resolve, reject) {
				reject("No access token");
				return false;
			});
		}
		
		var now = Math.floor(Date.now() / 1000);
		if (this.user_data.access_expires < now) {
			console.log("Expired access, use refresh");
			// access token is expired, try to get a new one
			var refresh_params = {
				grant_type: "refresh_token",
				refresh_token: this.user_data.refresh_token,
				client_id: WODTogetherConfig.api.client_id,
				client_secret: WODTogetherConfig.api.client_secret
			};
			
			return $http({
				method: "POST",
				url: API_ENDPOINT + "token.php",
				data: this.toParams(refresh_params),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				}
			}).success(function(response) {
				console.log("Refreshed, store new token data", response);
				window.localStorage.setItem('user_data', JSON.stringify(response));
				that.user_data = response;
				
				return $q(function(resolve, reject) {
					resolve(that.user_data);
				});
			}).error(function(response) {
				console.log("refresh failed");
	            return $q(function(resolve, reject) {
					reject("Refresh failed");
					return false;
				});
			});
		}
		
		console.log("valid session");
		return $q(function(resolve, reject) {
			resolve(that.user_data);
			return true;
		});
	};
	
	this.post = function(params) {
		console.log("API post");
		var that = this;
		$ionicLoading.show({
			template: '<ion-spinner></ion-spinner>'
	    });
		
		return this.check()
			.then(function(result) {
	            // promise fulfilled
				console.log("this.check.then result: ", result);
	            if (result) {
	            	// @todo why arent these always the same (refresh token/promises stuff)
	            	if (!result.access_token) {
	            		params.access_token = result.data.access_token;
	            	} else {
	            		params.access_token = result.access_token;
	            	}

					return $http({
						method: "POST",
						url: API_ENDPOINT+ "resource.php",
						data: that.toParams(params),
						headers: {
							"Content-Type": "application/x-www-form-urlencoded"
						}
					})
					.success(function(response) {
						$ionicLoading.hide();
						return response.data;
					})
					.error(function(e) {
						// if we get a 401, error expired_token, get a new one and try again?
						console.log(e);
						$ionicLoading.hide();
						return {data: {response_code: -997}};
					});
	            } else {
	                console.log(result, "go to login");
	                return {data: {response_code: -998}};
	            }
	        }, function(error) {
	        	// double check session?
	            console.log("error", error);
	            
	            $state.go("login");
	            $ionicLoading.hide();
	            if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
	            	$cordovaToast.showShortBottom(error);
	            }
	            return {data: {response_code: -999}};
	        });
	};
})

;