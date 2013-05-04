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