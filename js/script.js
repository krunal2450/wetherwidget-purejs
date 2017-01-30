(function() {
  var ww = function(el) { // core constructor
    // ensure to use the `new` operator
    if (!(this instanceof ww))
      return new ww(el);
    // store an argument for this example
    this.el = el;
    //..
  };

  // create `fn` alias to `prototype` property
  ww.fn = ww.prototype = {
    init: function () {/*...*/}
    //...
  };

  // expose the library
  window.ww = ww;
})();

ww.fn.widgetConstruct = function(me){
	var city, state, url, query;
	var geocoder;
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
	}
	//Get the latitude and the longitude;
	function successFunction(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		codeLatLng(lat, lng);
	}

	function errorFunction() {
		console.log("Geocoder failed");
		me.querySelector(".spinner").style.display = "none";
	}
  
	function detectIE() {
		var ua = window.navigator.userAgent;

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			//IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			//IE 11 => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
		   //Edge (IE 12+) => return version number
		   return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}

		//other browser
		return false;
	}

	function loadAPIData() {
		me.querySelector(".refresh").style.display = "none";
		me.querySelector(".spinner").style.display = "block";
		me.querySelector(".add").style.display = "none";
		me.querySelector(".temp").innerHTML = me.querySelector(".title").innerHTML = me.querySelector(".forecastCont").innerHTML = "";
		query = "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text='"+city.long_name.toLowerCase()+","+state.short_name.toLowerCase()+"')";
		query = encodeURIComponent(query);
		url = "http://query.yahooapis.com/v1/public/yql?q="+query+"&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithke";
		if (window.XDomainRequest && detectIE()) {
			var xdr = new XDomainRequest();
			xdr.open("GET", url, false);
			xdr.onload = function () {
				var res = JSON.parse(xdr.responseText);
				if (res == null || typeof (res) == 'undefined')
				{
					res = JSON.parse(data.firstChild.textContent);
				}
				publishData(res);
			};
			xdr.send();
		} else {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
			  if (xmlhttp.readyState == 4) {
				if (xmlhttp.status == 200 || xmlhttp.status == 304) {
				  publishData(JSON.parse(xmlhttp.responseText));
				} else {
				  setTimeout(function(){ console.log("Request failed!") }, 0);
				}
			  }
			}

			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		}
	}
  
	function publishData(data){
		me.querySelector(".refresh").style.display = "inline-block";
		me.querySelector(".spinner").style.display = "none";
		me.querySelector(".title").innerHTML = city.long_name+", "+state.short_name;
		if(data.query.results){
			var temp_html = "",
			forecast_html = "";
			temp_html += "<div class='tempText'>"+data.query.results.channel.item.condition.temp +"&deg;"+data.query.results.channel.units.temperature+"</div>";
			temp_html += "<div class='condition'><div class='condImg' code='"+data.query.results.channel.item.condition.code+"'></div>"+data.query.results.channel.item.condition.text+"</div>";
			me.querySelector(".temp").innerHTML = temp_html;
			
			if(data.query.results){
				data.query.results.channel.item.forecast.forEach(function(item, i){
					if(i < 5)
					forecast_html += "<span class='forecastEle'>"+item.day+"<br>"+item.low+"&deg;/"+item.high+"&deg;</span>";
				});
				me.querySelector(".forecastCont").innerHTML = forecast_html;
			}
		}else{
			me.querySelector(".temp").innerHTML = "<span class='error'>Error while fetching data. You can try by refreshing button or fill details below.</span>";
			me.querySelector(".add").style.display = "block";
		}
	}
  
	function codeLatLng(lat, lng) {
		var latlng = new google.maps.LatLng(lat, lng);
		geocoder.geocode({
		  'latLng': latlng
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (results[1]) {
					//find country name
					for (var i = 0; i < results[0].address_components.length; i++) {
						for (var b = 0; b < results[0].address_components[i].types.length; b++) {
							//there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
							if (results[0].address_components[i].types[b] == "administrative_area_level_2") {
								//this is the object you are looking for
								city = results[0].address_components[i];
								break;
							}
						}
					}
					
					for (var i = 0; i < results[0].address_components.length; i++) {
						for (var b = 0; b < results[0].address_components[i].types.length; b++) {
							//there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
							if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
								//this is the object you are looking for
								state = results[0].address_components[i];
								break;
							}
						}
					}
					loadAPIData();
				} else {
					console.log("City name not available");

				}
			} else {
				console.log("Geocoder failed due to: ", status);
			}
		});
	}
  
	function bindEvents(){
		me.querySelector(".refresh").addEventListener("click", function(e){
			this.style.display = "none";
			if(me.querySelector(".city").value && me.querySelector(".state").value){
				city.long_name = me.querySelector(".city").value;
				state.short_name = me.querySelector(".state").value;
			}
			loadAPIData();
		});
	  
		me.querySelector("form.add").addEventListener("submit", function(e){
			e.preventDefault();
			if(me.querySelector(".city").value && me.querySelector(".state").value){
				city.long_name = me.querySelector(".city").value;
				state.short_name = me.querySelector(".state").value;
				loadAPIData();
				me.querySelector(".add").style.display = "none";
			}
		});
	}
	
	function initialize() {
		geocoder = new google.maps.Geocoder();

		var html = '<div class="title"></div>'
					+'<button class="refresh" title="Refresh"></button>'
					+'<div class="temp"></div>'
					+'<div class="forecastCont"></div>'
					+'<form class="add"><input class="city" type="text" placeholder="Enter city name" /><input class="state" type="text" placeholder="Enter state code" />'
					+'<input type="submit" /></form>'
					+'<div class="spinner"></div>';

		me.innerHTML = html;
		me.querySelector(".refresh").style.display = "none";
		me.querySelector(".spinner").style.display = "block";
		bindEvents();
	}
  
	initialize();
}

ww.fn.WeatherWidget = function () {
  var me = this.el;
  return new ww.fn.widgetConstruct(me);
};

document.addEventListener('DOMContentLoaded', function() {
	for(var i=0; i<document.getElementsByClassName("weather").length; i++){
		ww(document.getElementsByClassName("weather")[i]).WeatherWidget();
	}
}, false);