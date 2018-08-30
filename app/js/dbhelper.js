
//cambios para que funcione con fetch

/**
 * Common database helper functions.
 */
 
class DBHelper {  

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */ 	
 	

  static get DATABASE_URL() {
  	
  	//puerto cambiado a node server 1337
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }
  
  
	
	//  IndexedDB Promised
	 
	static get dbPromise() {

			return idb.open('restaurants', 1, function (upgradeDb) {
				upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
				upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
				upgradeDb.createObjectStore('reviews-pending', { keyPath: 'updatedAt' });
			});
	}

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants(callback) {
		
		DBHelper.dbPromise.then(db => {
			if (!db) return;
			
			// db with elements?
			const tx = db.transaction('restaurants');
			const store = tx.objectStore('restaurants');
			
			store.getAll().then(datos => {
				if (datos.length > 0) 
				{
					// estan en la BD, la devolvemos
					callback(null, datos);
				}
			else 
				{
					// los sacamos de internet
					fetch(`${DBHelper.DATABASE_URL}/restaurants`)
					.then(response => {
					return response.json();
					})
					.then(restaurants => {
					// Ademas los metemos a la DB
					const tx = db.transaction('restaurants', 'readwrite');
					const store = tx.objectStore('restaurants');
					restaurants.forEach(restaurant => {
					store.put(restaurant);
					})
					callback(null, restaurants);
					})
					.catch(error => {
					// Error en internet
					callback(error, null);
					});					
				} 	
			})	
		});
	}
	

/*    ANTIGUO XMLHttpRequest()

    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json.restaurants;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();

*/


  /**
   * Fetch a restaurant by its ID.
   */
    static fetchRestaurantById(id, callback) {
       
       /* ANTIGUO REQUESTRESTAURANTSBY ID
       
   DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });   
       
       */
       
       
          DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
});
       

}

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph}`+`.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */


	static submitReview(review) {
		
		fetch(`${DBHelper.DATABASE_URL}/reviews`, {
			body: JSON.stringify(review), 
			cache: 'no-cache', 
			credentials: 'same-origin', 
			headers: {
			'content-type': 'application/json'
			},
			method: 'POST',
			mode: 'cors', 
			redirect: 'follow', 
			referrer: 'no-referrer', 
		})
		.then(response => {
			response.json()
				.then(datos => {
					//SI LA SUBIDA ES CORRECTA NOS DEVOLVERA UNA REVIEW CON UN ID CORRECTO
					//Y ESA REVIEW LA METEMOS EN LA BASE DE DATOS DE REVIEWS
					DBHelper.dbPromise.then(db => {
						// Put fetched reviews into IDB
						const tx = db.transaction('reviews', 'readwrite');
						const store = tx.objectStore('reviews');
						store.put(datos);
					});
					return datos;
				})
		})
		.catch(error => {
			//SI LA SUBIDA NO ES CORRECTA NOS DEVOLVERA LA REVIEW VACIA, O ERROR O NADA
			// Y ESA REVIEW LA METEMOS EN LA BASE DE DATOS DE REVIEWS-PENDING QUE TIENE EL ID COMO AUTOINCREMENT
			// ADEMAS TENDREMOS QUE PONER UN LISTENER PARA CUANDO HAY INTERNET QUE VUELVA A SUBIRLO DESDE PENDING
			// Y LA BORRE DE PENDING CUANDO LE DEVUELVA LA REVIEW CORRECTA ADEMAS DE METERLA EN LA BASE DE DATOS

			data['updatedAt'] = new Date().getTime();
			console.log(datos);
			
			this.dbPromise.then(db => {
				if (!db) return;
				// Put fetched reviews into IDB
				const tx = db.transaction('reviews-pending', 'readwrite');
				const store = tx.objectStore('reviews-pending');
				store.put(datos);
				console.log('Review guardada para enviar mas tarde');
			});
			return;
		});
}




	static submitOfflineReviews() {
		DBHelper.dbPromise.then(db => {
			const tx = db.transaction('reviews-pending');
			const store = tx.objectStore('reviews-pending');
			store.getAll().then(offlineReviews => {
				offlineReviews.forEach(review => {
					console.log(review);
					DBHelper.submitReview(review);
				})
				//Borramos las reviews
				DBHelper.clearOfflineReviews();
			})
		})
	}

	static clearOfflineReviews() {
		DBHelper.dbPromise.then(db => {
			const tx = db.transaction('reviews-pending', 'readwrite');
			const store = tx.objectStore('reviews-pending').clear();
		})
		return;
	}







}

