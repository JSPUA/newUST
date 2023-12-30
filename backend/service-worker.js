// service-worker.js

// The 'install' event is fired when the service worker has been successfully registered
self.addEventListener('install', event => {
    // Perform install steps if necessary
    console.log('Service Worker installing.');
  });
  
  // The 'activate' event is fired after the 'install' event
  self.addEventListener('activate', event => {
    // Perform activation steps if necessary
    console.log('Service Worker activating.');
  });
  
  // Listen for push events and show notifications when they are received
  self.addEventListener('push', event => {
    // Parse the message data and show a notification
    let data = {};
    if (event.data) {
      data = event.data.json();
    }
  
    const options = {
      body: data.body,
      icon: './MML.png', // Replace with your own icon URL
      badge: './magnifier.png', // Replace with your own badge URL
      // You can add additional notification options if needed
    };
  
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  // Optional: Listen for notification click events
  self.addEventListener('notificationclick', event => {
    event.notification.close(); // Close the notification
  
    // Handle notification click event
    // You can open a URL or handle in some other way
    event.waitUntil(
      clients.openWindow('http://localhost:5173') // Replace with your own URL
    );
  });
  