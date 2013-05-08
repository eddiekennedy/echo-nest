/*

Assignment #1: Manipulating Artist Data
Many of our partners need to manipulate and work with dynamic artist data.
 
Create a basic web app that presents two columns. On the left, show our top 100 artist terms. Allow the user to select and deselect terms, and update a column on the right with up to 20 artists who have the selected terms.
 
Bonus points:
· Push state -- let the user use the browser history
· Hotttness -- let the user sort the artists by name or "hotttness"
· Artist Year -- let the user push buttons to select how artists are queried
  o Artist start year oldest first
  o artist start year newest first
  o Or the default, most familiar artists first
 
Please provide a link to the web app that we can evaluate

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

NOTES / Eddie Kennedy - 

Wasn't sure if Hotttness and Artist Year were meant to be handled with the same UI element, but it seemed to make sense.

These two endpoints were returning the same results, regardless of genre-
- http://developer.echonest.com/api/v4/artist/search?api_key=KWJSW0SIMG606Y0IN&style=rock&results=20&sort=artist_start_year-asc
- http://developer.echonest.com/api/v4/artist/search?api_key=KWJSW0SIMG606Y0IN&style=rock&results=20&sort=artist_start_year-desc

TODO:
- Add .htaccess so that refreshing the browser works
- Figure out a better scrolling solution

*/

(function( win, $, undefined ) {

  // App object
  var app = {};
  app.root = win.location.hostname == 'localhost' ? '/fuckery/echo-nest/' : '/echo-nest/';
  app.apiKey = 'KWJSW0SIMG606Y0IN';
  app.apiPrefix = 'http://developer.echonest.com/api/v4/';
  app.defaultSortOrder = 'familiarity-asc';
  app.activeTerms = [];

  // Router object
  var Router = Backbone.Router.extend({
    initialize: function() {
      // Set up collections
      app.terms = new TermCollection();
      app.artists = new ArtistCollection();
      app.artists.sortOrder = app.defaultSortOrder;
      // Application layout
      app.layout = new Backbone.Layout({
        template: '#application',
        views: {
          '#terms': new TermListView({ collection: app.terms }),
          '#artists': new ArtistListView({ collection: app.artists })
        }
      });
      // Append the Layout and Render 
      app.layout.$el.appendTo('#main');
      app.layout.render();
    },
    routes: {
      ''                : 'index',
      'terms/:termList' : 'getArtists'
    },
    index: function() {
      app.terms.fetch({ reset: true });
      if ( app.artists.length ) {
        app.artists.reset();
      }
    },
    getArtists: function( termList ) {
      app.activeTerms = termList.split('+');
      app.artists.fetch({ reset: true });
    },
    go: function() {
      return this.navigate( _.toArray(arguments).join("/"), { trigger: true } );
    }
  });

  /*
  * ------------------------------------------------------------
  *   Terms
  * ------------------------------------------------------------
  */

  // Term model
  var TermModel = Backbone.Model.extend({});

  // Term collection
  var TermCollection = Backbone.Collection.extend({
    model: TermModel,
    url: app.apiPrefix + 'artist/top_terms?api_key=' + app.apiKey + '&results=100',
    parse: function( response ) {
      return response.response.terms;
    }
  });

  // Single term view
  var TermView = Backbone.Layout.extend({
    template: '#term',
    tagName: 'li',
    className: 'term',
    serialize: function() {
      return { term: this.model };
    },
    initialize: function() {
      this.listenTo( this.model, 'change', this.render);
    },
    events: {
      'change .term-input': 'updateTerms'
    },
    updateTerms: function( event ) {
      // Get the term
      var term = this.model.get('name');
      // Determine if term is in app.activeTerms
      var termIndex = app.activeTerms.indexOf( term );
      // Either remove or add term
      if ( termIndex > -1 ) {
        app.activeTerms.splice( termIndex, 1 );
      } else {
        app.activeTerms.push( term );
      }
      if ( app.activeTerms.length ){
        // Turn active terms into a string
        var artiveTermUrl = '/terms/' + encodeURI( app.activeTerms.join('+') );
        // Redirect the router
        app.router.go( artiveTermUrl );
      } else {
        // Redirect the router
        app.router.go( '/' );
      }
    }
  });

  // Multi-term list view
  var TermListView = Backbone.Layout.extend({
    template: '#term-list',
    beforeRender: function() {
      this.collection.each(function( term ) {
        this.insertView('ul.term-list', new TermView({
          model: term
        }));
      }, this);
    },
    initialize: function() {
      this.listenTo(this.collection, {
        "reset": this.render
      });
    }
  });

  /*
  * ------------------------------------------------------------
  *   Artists
  * ------------------------------------------------------------
  */

  // Artist model
  var ArtistModel = Backbone.Model.extend({});

  // Artist collection
  var ArtistCollection = Backbone.Collection.extend({
    model: ArtistModel,
    url: function() {
      var termQueryString = '';
      $.each( app.activeTerms, function( i, term ) {
        termQueryString += '&style=' + app.activeTerms[i];
      });
      return app.apiPrefix + 'artist/search?api_key=' + app.apiKey + termQueryString + '&results=20&sort=' + this.sortOrder;
    },
    parse: function( response ) {
      return response.response.artists;
    }
  });

  // Single artist view
  var ArtistView = Backbone.Layout.extend({
    template: '#artist',
    tagName: 'li',
    serialize: function() {
      return { artist: this.model };
    },
    initialize: function() {
      this.listenTo( this.model, 'change', this.render);
    }
  });

  // Multi-artist list view
  var ArtistListView = Backbone.Layout.extend({
    template: '#artist-list',
    beforeRender: function() {
      this.collection.each(function( artist ) {
        this.insertView('ul.artist-list', new ArtistView({
          model: artist
        }));
      }, this);
    },
    afterRender: function() {
      this.$el.find("#sort-order").val(this.collection.sortOrder);
    },
    initialize: function() {
      this.listenTo(this.collection, {
        "reset": this.render
      });
    },
    events: {
      'change #sort-order': 'sortArtists'
    },
    sortArtists: function( event ) {
      // Get and set the new sort order
      var newSortOrder = this.$el.find("#sort-order").val();
      this.collection.sortOrder = newSortOrder;
      // Re-fetch collection if needed
      if ( this.collection.length ) {
        this.collection.fetch({ reset: true });
      }
    }
  });

  // Define Router and kick things off
  app.router = new Router();
  Backbone.history.start({ pushState: true, root: app.root });

  win.app = app;

})( window, jQuery );