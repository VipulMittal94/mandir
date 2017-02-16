
// Global variables
var map;
var markers=[];
var vm;
function initMap() {
       map = new google.maps.Map(document.getElementById('map'),{
        center: new google.maps.LatLng(10.957025,78.066409),
        zoom:13 ,
        mapTypeControl: false
       }); 
       //Instantiate ViewModel
       vm = new ViewModel();
       //Apply bindings
       ko.applyBindings(vm);
}
$('.launch-map').on('click', function () {
    
    $('#modal').modal({
        backdrop: 'static',
        keyboard: false
    }).on('shown.bs.modal', function () {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
    });
});

//ViewModel
var ViewModel=function(){
       var largeInfowindow = new google.maps.InfoWindow();
       var bounds = new google.maps.LatLngBounds();
       var self = this;
       self.locations= ko.observableArray(model);
       //Input given by the user as search term.
       self.searchterm = ko.observable('');
       // Marker for all the locations in the locations array.
       self.locations().forEach(function(loc){
            var marker = new google.maps.Marker({
            title:loc.title,
            position:loc.location,
            map:map
            });
            loc.marker=marker;
            loc.updatelist = ko.observable(true);
            loc.venue = ko.observable('venue');
            markers.push(marker);
            //Add an event listener to open the Infowindow
            marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            });
       });
       //Add the position to the bounds
       for(var i=0;i<markers.length;i++) {
            bounds.extend(markers[i].getPosition());
       }
       //Set the center of the map to the center of all the bounds 
       map.setCenter(bounds.getCenter());
       // Fit the bounds of all the markers
       map.fitBounds(bounds);
       //Search Function
       self.searchfunction = ko.computed(function(){
       var search = self.searchterm();
         //Iterate through all the location in the array and find if the search location is available and set the corresponding marker as visible. 
         for (var i = 0; i < self.locations().length; i++) {
            if (self.locations()[i].title.toLowerCase().indexOf(search)>=0){
                self.locations()[i].updatelist(true);
                self.locations()[i].marker.setVisible(true);
            }
            else{
                self.locations()[i].updatelist(false);
                self.locations()[i].marker.setVisible(false);
            }
          }
       });    
    }

//Function to execute when the user clicks the listview 
self.selectloc = function(loc){
        loc.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
        loc.marker.setAnimation(null);
        }, 1400);
        var largeInfowindow = new google.maps.InfoWindow();
        populateInfoWindow(loc.marker,largeInfowindow);
}

// Function to open the InfoWindow onclick
function populateInfoWindow(marker, infowindow) {
        if (infowindow.marker != marker) 
          {
            infowindow.marker = marker;
            infowindow.setContent("Loading...");
            infowindow.open(map,marker);
          }
        // Client ID and Secret for making the Fooursquare API request
        var client_id = 'ONYWHF4FEUXDFOJQ3UQESCFICNGFJXQHBVMM1KTEFEDHY4FY',
            client_secret = 'CIABUKHJV2WSOLETHUWQBL5R2FHBO0T5GRKSK01JZ5F2DP3Z',
            lat=marker.position.lat(),
            lng=marker.position.lng();
            var name = marker.title;
            var pos = lat +','+ lng;
            //AJax request for the foursquare API to get the location data.
            var url = 'https://api.foursquare.com/v2/venues/search?ll=' + pos + '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=20161129&m=foursquare';
                $.ajax({
                        method: 'GET',
                        url: url,
                        dataType: 'jsonp',
                        success: function (data) {
                                  //Store the data from the ajax request.
                                  //venue id is for making the second ajax request to foursquare to get the photos of that place. 
                                  var venue_id = data.response.venues[0].id;
                                  var address = data.response.venues[0].location.address;
                                  if(address==undefined)
                                  {
                                    address="Currently not available."
                                  }
                                  var counts = data.response.venues[0].stats.checkinsCount;
                                  //Second ajax request for fetching the photos.
                                  var secondurl = 'https://api.foursquare.com/v2/venues/' + venue_id +'/photos?client_id=' + client_id + '&client_secret=' + client_secret + '&v=20161129';
                                  $.ajax({
                                          method: 'GET',
                                          url: secondurl,
                                          dataType: 'jsonp',
                                          success: function(data){
                                            //var prefix = data.response.photos.items[0].prefix;
                                            //var suffix = data.response.photos.items[0].suffix;
                                            infowindow.setContent('<div><span class="bold"> ' + name + '</span><br><span class="bold">Address: </span>'+ address+'<br><span class="bold">Check-ins: </span>'+ counts + '</div>');
                                            infowindow.open(map, marker);
                                            infowindow.addListener('closeclick', function() {
                                              infowindow.marker = null;
                                            });
                                          },
                                          //On error function to display the error message in the Infowindow.
                                          error: function(){
                                            infowindow.setContent('<div>Error Fetching Data</div>');
                                          }
                                      });
                                  },
                        //On error function to display the error message in the Infowindow.
                        error: function () {
                                infowindow.setContent('<div>Error Fetching Data</div>');
                                  }
                      });
}

//Function to display the error message
function erroralert(){
  alert("Error loading data. Please check the connection or try again later.");
}




