var $;

function Faker () {
	this.create = function() {
		var $form = $('<form />', {
			action: 'http://localhost'
		});
		var $field = this.createField();
		$form.append($field);
		var $submit = this.createSubmit();
		$form.append($submit);

		return {
			$form: $form,
			$field: $field,
			$submit: $submit
		};
	};

	this.createField = function() {
		return $('<input type="text" class="' + this.options.dName + '" />');
	};

	this.createSubmit = function() {
		return $('<input type="submit" />');
	};
}

Faker.setJQuery = function(jQuery) {
	$ = jQuery;
};

Faker.create = function(dName) {
	var inst = new this;
	inst.options = {dName: dName};
	return inst.create();
};

module.exports = Faker;