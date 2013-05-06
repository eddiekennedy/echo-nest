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

*/

(function( win, $, undefined ) {

  // App object
  var app = {};
  app.root = '/fuckery/echo-nest/';
  app.apiKey = 'KWJSW0SIMG606Y0IN';
  app.apiPrefix = 'http://developer.echonest.com/api/v4/';
  app.activeTerms = [];

  // Router object
  var Router = Backbone.Router.extend({
    initialize: function() {
      this.terms = new TermCollection();
      this.artists = new ArtistCollection();
      // Application layout
      this.layout = new Backbone.Layout({
        template: '#application',
        views: {
          '#terms': new TermListView({ collection: this.terms }),
          '#artists': new ArtistListView({ collection: this.artists })
        }
      });
      // Append the Layout and Render 
      this.layout.$el.appendTo('#main');
      this.layout.render();
    },
    routes: {
      '' : 'index'
    },
    index: function() {
      this.terms.fetch({ reset: true });
      //this.artists.fetch({ reset: true });
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
      'change .term-input': 'updateArtists'
    },
    updateArtists: function( event ) {
      // Get the term
      var term = this.model.get('name');
      // Determine if term is in app.activeTerms
      var termIndex = app.activeTerms.indexOf( term );
      if ( termIndex > -1 ) {
        // Remove term
        app.activeTerms.splice( termIndex, 1 );
      } else {
        // Add term
        app.activeTerms.push( term );
      }
      app.router.artists.url( app.activeTerms );
      if ( app.activeTerms.length ){
        app.router.artists.fetch({ reset: true });
      } else {
        app.router.artists.reset();
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
    url: function( term ) {
      var termQueryString = '';
      $.each( app.activeTerms, function( i, term ) {
        termQueryString += '&style=' + app.activeTerms[i];
      });
      return app.apiPrefix + 'artist/search?api_key=' + app.apiKey + termQueryString + '&results=20';
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
    initialize: function() {
      this.listenTo(this.collection, {
        "reset": this.render
      });
    }
  });

  // Define Router and kick things off
  app.router = new Router();
  Backbone.history.start({ pushState: true, root: app.root });

  win.app = app;

})( window, jQuery );