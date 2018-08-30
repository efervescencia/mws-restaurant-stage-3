let restaurant;
let reviews;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiZWZlcnZlc2NlbmNpYSIsImEiOiJjamt3czQ2d28wMTJ4M3FyMHQyYTMxMjl1In0.zSgxe32JlZeO9Y-dgk9vDQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  
  const is_favorite = document.getElementById("favorite2_id");
  state = restaurant.is_favorite;
  if (state === 'true') {
  	is_favorite.setAttribute('aria-checked', 'false');
  	is_favorite.innerHTML="<span aria-hidden='true'>&#x2764;</span>";
  }
  else {
  	is_favorite.setAttribute('aria-checked', 'true');
  	is_favorite.innerHTML="<span aria-hidden='true'>&#x2661;</span>";  
       }
  
  
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  const image_name = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = image_name+"_small.jpg";
  image.srcset = image_name+"_small.jpg 400w, "+image_name+" 800w"
  image.sizes = "(max-width:550px) 100vw, 40vw";
  image.alt = restaurant.name+ " restaurant representative picture";

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  getReviews(restaurant);
}


getReviews = (restaurant) =>{
		
	if(navigator.onLine){
		console.log("ESTAMOS ONLINE!!!!!");
		// los sacamos de internet
		// console.log(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`);
		fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`)
					.then(response => {
					return response.json();
					})
					.then(reviews => {
					self.reviews = reviews;
					console.log(self.reviews);
					fillReviewsHTML();
					})
					.then(reviews => {
					// las metemos en la base de datos
					
						DBHelper.dbPromise.then(function(db) {
  						var tx = db.transaction('reviews', 'readwrite');
  						var store = tx.objectStore('reviews');
						self.reviews.forEach(review => {
						store.put(review);
						console.log('añadida review a la BD'+review.id);
						});
						})
						.catch(error => {
						// Error en internet
						callback(error, null);
						});						
						});
	
	}	
	else {
		console.log("NOOOOOOOOOO ESTAMOS ONLINE!!!!!");
		DBHelper.dbPromise.then(db => {
			const tx = db.transaction('reviews');
			const store = tx.objectStore('reviews');
			var index = store.index("restaurant_id");
			index.getAll(self.restaurant.id).then(reviews => {
				self.reviews= reviews;
				console.log(self.reviews);
				fillReviewsHTML();
				});});
			}	

				
	}
				

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt*1000);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


function toggleCheckbox(event) {

  var node = event.currentTarget;
  var state = node.getAttribute('aria-checked').toLowerCase();

  if (event.type === 'click' || 
      (event.type === 'keydown' && event.keyCode === 32)
      ) {
          if (state === 'true') {
            node.setAttribute('aria-checked', 'false');
            node.innerHTML="<span aria-hidden='true'>&#x2764;</span>";
          }
          else {
            node.setAttribute('aria-checked', 'true');
            node.innerHTML="<span aria-hidden='true'>&#x2661;</span>";  
          }
          
          console.log("cambiamos el estado del corazon");
          //cambiamos primero la variable
          self.restaurant.is_favorite = state;
          //ahora cambiamos en internet
          console.log("hemos cambiado la variable is favorite a: "+self.restaurant.is_favorite);
          fetch(`${DBHelper.DATABASE_URL}/restaurants/${self.restaurant.id}/?is_favorite=${state}`, {
				method: 'PUT'
				})
					//ahora lo cambiamos en la base de datos
					DBHelper.dbPromise.then(db => {
					const tx = db.transaction('restaurants', 'readwrite');
					const store = tx.objectStore('restaurants');
					store.put(self.restaurant);
						})
				.then(response => {
				return response.json();
				});
    event.preventDefault();
    event.stopPropagation();
  }

}


function focusCheckbox(event) {
  event.currentTarget.className += ' focus';
}

function blurCheckbox(event) {
  event.currentTarget.className = event.currentTarget.className .replace(' focus','');
}


function submitReview(){
	
		const review_name  = document.getElementById('name').value;
		const options_rating = document.getElementById('rating');
		const review_rating = options_rating.options[options_rating.selectedIndex].value;
		const review_text = document.getElementById('comments').value;

		let review = {"restaurant_id": self.restaurant.id,
				"name": review_name,
				"rating": review_rating,
				"comments": review_text,
				"createdAt": Date.now(),
				"updatedAt": Date.now(),
				};

		console.log(review);
		
	
		if(navigator.onLine){
		console.log("ESTAMOS ONLINE!!!!!");
		console.log("Vamos a enviar la review");

		//INTENTAMOS SUBIRLO A INTERNET
		review = DBHelper.submitReview(review);
		console.log("subida a internet la review: "+review);			
				
		}
		else {
			// LO METEMOS EN BASE DE DATOS PENDING Y PONEMOS UN LISTENER PARA CUANDO VUELVA LA CONEXION
			console.log("COMO NO ESTAMOS ONLINE...");
			console.log("Vamos a enviar la review"+review);
			DBHelper.submitReviewPending(review);			
			window.addEventListener('online', goOnline);
			
			}
			
		//EN CUALQUIER CASO
		//lo ponemos en la página y reseteamos el formulario
		const ul = document.getElementById('reviews-list');
		ul.appendChild(createReviewHTML(review));
		document.getElementById("submit-review-form-id").reset();	
			
	}


	function goOnline() {
			//hemos recuperado conexion!!!
			console.log('Internet on!!!');
    		DBHelper.submitOfflineReviews();
}



