$(document).ready(function() {

	$('#login-form').submit(function(){
		var name = $('#name').val();
		localStorage.setItem('gameName', name);

		return true;
	});

});