var $fixture;

beforeEach(function(cb) {
	$fixture = $('#fixtures').appendTo('body');
	var form = Faker.create('femm');
	$fixture.html(form.$form);
	var inst = EM.initField(form.$field);
	this.inst = inst;
	this.form = form;
	cb();
});

afterEach(function() {
	$fixture.empty();
});

var EM = EmailValiditon;

it('#isFieldInViewport return false if element is not visible', function() {
	this.form.$form.css({'margin-top': 1000});
	expect(this.inst.isFieldInViewport()).toBe(false);
});

it('#isFieldInViewport return true if element is visible', function() {
	expect(this.inst.isFieldInViewport()).toBe(true);
});

it('#scrollToField should scroll to field', function(cb) {
	this.form.$form.css({'margin-top': 1500});
	this.inst.scrollToField();
	var $field = this.form.$field;
	var inst = this.inst;
	setTimeout(function () {
		expect(inst.isFieldInViewport()).toBe(true);
		$('html, body').animate({
			scrollTop: 0
		}, 1);
		cb();
	}, 1000);
});

function l (x) {
	console.log(x);
}