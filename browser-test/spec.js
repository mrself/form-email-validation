var $fixture = $('#fixtures');
beforeEach(function() {
	$fixture.empty();
});

Faker.setJQuery($);
var EM = EmailValiditon;

it('test', function() {
	var form = Faker.create('femm');
	$fixture.html(form.$form);
	var inst = EM.initField(form.$field);
});

function l (x) {
	console.log(x);
}