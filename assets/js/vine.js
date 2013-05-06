// Application object
var apiKey = 'KWJSW0SIMG606Y0IN';
var app = {
 terms: {},
 termsEndpoint: 'http://developer.echonest.com/api/v4/artist/top_terms?api_key=' + apiKey + '&results=100',
 getTerms: function() {
   $.ajax({
     url: app.termsEndpoint,
     dataType: 'json',
     success: function( data ) {
       app.terms = data.response.terms;
       var termList = $('<ul class="terms-list" />');
       $.each( app.terms, function( i, term ) {
         var termItem = '<li><input type="checkbox" value="' + term.name + '" /> <a href="' + term.name + '">' + term.name + '</a></li>';
         termList.append( termItem );
       });
       $('#terms').append( termList );
     }
   });
 },
 artists: {},
 artistsEndpoint: function( term ) {
   return 'http://developer.echonest.com/api/v4/artist/search?api_key=' + apiKey + '&style=' + term + '&results=20';
 },
 getArtistsByTerm: function( term ) {
   $.ajax({
     url: app.artistsEndpoint( term ),
     dataType: 'json',
     success: function( data ) {
       app.artists = data.response.artists;
       var artistList = $('<ul class="artists-list" />');
       $.each( app.artists, function( i, artist ) {
         var artistItem = '<li>' + artist.name + '</li>';
         artistList.append( artistItem );
       });
       $('#artists').html( artistList );
     }
   });
 }
};

$(document).ready(function() {
 app.getTerms();
 $(document).on('click', 'a', function( event ) {
   event.preventDefault();
   var term = $(this).attr('href');
   app.getArtistsByTerm( term );
 });
 $(document).on('click', 'input[type=checkbox]', function( event ) {
   var term = $(this).val();
   console.log(term);
   //app.getArtistsByTerm( term );
 });
});












(function( win, $, undefined ) {

  // Number of videos to show
  var maxVideo = 2;

  // The App Object
  var app = {
    root: '/',
    url: 'http://search.twitter.com/search.json?callback=?&include_entities=1&q=vine.co-filter:retweets&geocode=42.3583,-71.0603,16mi&rpp=' + maxVideo
  };

  // For Local Development
  app.root = win.location.hostname === 'localhost' ? '/vine/trunk' : app.root;
  app.url = win.location.hostname.indexOf("local") !== -1 ? '_js/vine-data.json' : app.url;

  // Router Object
  var Router = Backbone.Router.extend({
    initialize: function() {

      // Pusher initialization
      Pusher.channel_auth_endpoint = './pusher_auth.php';
      // Flash fallback logging - don't include this in production
      WEB_SOCKET_DEBUG = true;
      app.pusher = new Pusher('90f56a7f2bcc6ffc305d');
      app.channel = app.pusher.subscribe('private-vine-moderation');

      // New Collection
      this.tweets = new TweetCollection();
      // New Layout
      this.layout = new Backbone.Layout({
        template: '#vines',
        views: {
          'div.content': new TweetCollectionView({ collection: this.tweets })
        }
      });
      // Append the Layout and Render 
      this.layout.$el.appendTo('#main');
      this.layout.render();
    },
    routes: {
      '': 'index'
    },
    index: function() {
      this.tweets.fetch({
        reset: true
      });
    }
  });

  // Tweet Model
  var TweetModel = Backbone.Model.extend({
    defaults: {
      id: null,
      vid_loc: null,
      user: null,
      created_at: null,
      text: null,
      from_user: null,
      from_user_id: null,
      timeStamp: null
    }

  });

  // Tweet Collection
  var TweetCollection = Backbone.Collection.extend({
    model: TweetModel,
    url: app.url,
    parse: function( response ) {
      _.each( response.results, function( tweet ) {
        var expandedUrl = tweet.entities.urls[0].expanded_url || '';
        var match = expandedUrl.match(/vine.co/ig);
        if ( match ) {
          var videoUrl = this.getVideoUrl( expandedUrl );
          if ( videoUrl ) {
            tweet.vid_loc = videoUrl;
            tweet.timeStamp = this.formatTimestamp( tweet.created_at );
            return tweet;
          }
        }
      }, this);
      return response.results;
    },
    getVideoUrl: function( expandedUrl ) {
      var videoUrl = '';
      $.ajax({
        url: 'proxy.php?q=' + expandedUrl,
        async: false,
        contentType: 'application/json; charset=utf-8',
        data: { tweetsData: "object" },
        dataType: "json",
        success: function( data ) {
          if ( !data.error ) {
            videoUrl = data.replace(/\\/ig,'');
            // *** Smarter fallback maybe?
          }
        }
      });
      return videoUrl;
    },
    formatTimestamp: function( timestamp ) {
      var now = new Date();
      var date, secondsSince;
      if ( timestamp !== "notice" ){
        date = new Date( timestamp );
        secondsSince = ( now - date ) / 1000;
        if ( secondsSince < 86400 ) {
          if ( secondsSince > 3600 ) {
            var hours = parseInt( secondsSince / 3600, 10 );
            timestamp = ( hours === 1 ) ? 'An hour ago' : hours + ' hours ago';
          } else {
            var minutes = parseInt( secondsSince / 60, 10 );
            if ( minutes <= 0 ){
              timestamp = '<1 minute ago';
            }else{
              timestamp = ( minutes===1 ) ? '1 minute ago' : minutes + ' minutes ago';
            }
          }
        }
      }
      return timestamp;
    }
  });

  // Tweet View
  var TweetView = Backbone.Layout.extend({
    template: '#model',
    tagName: 'li',
    className: 'vine',
    serialize: function() {
      return { model: this.model };
    },
    initialize: function() {
      this.listenTo(this.model, "change", this.render);
    },
    events: {
      'click .remove': 'remove'
    },
    remove: function( event ) {
      event.preventDefault();
      if (app.channel.subscribed){
        app.channel.trigger('client-remove', this.model);
      }
    }
  });

  // Tweet Collection View
  var TweetCollectionView = Backbone.Layout.extend({
    template: '#collection',
    className: 'all-vines',
    serialize: function() {
      return { collection: this.collection };
    },
    beforeRender: function() {
      this.collection.each(function( tweet ) {
        this.insertView('ul.vine-list', new TweetView({
          model: tweet
        }));
      }, this);
    },
    afterRender: function() {
      // if ( this.collection.length ) {
      //   var i = 0,
      //       firstVideo = this.collection.at(i).attributes.vid_loc,
      //       $videoPlayer = $('#back-to-back');
      //   $videoPlayer.attr({ 'src' : firstVideo });
      //   i++;
      //   var that = this;
      //   $('#back-to-back').bind('ended', function() {
      //       if ( that.collection.at(i) ) {
      //         this.src = that.collection.at(i).attributes.vid_loc;
      //       } else {
      //         this.src = that.collection.at(0).attributes.vid_loc;
      //       }
      //       //this.load();
      //       this.play();
      //       i++;
      //   });
      // }
    },
    initialize: function() {
      this.listenTo(this.collection, {
        "reset": this.render,
        "remove": this.render
      });
      var that = this;
      app.channel.bind('pusher:subscription_succeeded', function(members){
        app.channel.bind('client-remove', function(data){
          that.collection.remove( data );
        });
      });
    },
    events: {
      'click #moderate': 'moderate'
    },
    moderate: function( event ) {
      event.preventDefault();
      this.$el.find('.remove').toggle();
    }
  });

  // Define Router and kick things off
  app.router = new Router();
  Backbone.history.start({ pushState: true, root: app.root });

  win.app = app;

})( window, jQuery );