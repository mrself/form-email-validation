function EmailValiditon() {
	/**
	 * Form containing $field
	 * @type {jQuery|undefined}
	 */
	this.$form = undefined;

	/**
	 * Email field
	 * @type {jQuery|undefined}
	 */
	this.$field = undefined;

	/**
	 * If plugin was inited on $field
	 * @type {Boolean}
	 */
	this.isInited = false;

	/**
	 * If form could be proceeded
	 * @type {Boolean}
	 */
	this.formEnabled = true;
}

EmailValiditon.prototype = {
	constructor: EmailValiditon,

	init: function() {
		if (!this.defineForm() || !this.defineSubmitBtn()) return;
		this.setEvents();
		this.dName = this.options.dName;
		this.$field.addClass(this.dName);
		this.setIsInited();
	},

	/**
	 * Set that a plugin is fully inited.
	 */
	setIsInited: function() {
		this.isInited = true;
		this.$field.addClass(this.dName + '--inited');
	},

	/**
	 * Define and set $sbmit in $form
	 * @return {boolean} If $submit exists
	 */
	defineSubmitBtn: function() {
		this.$submit = this.$form.find('[type="submit"]');
		return !!this.$submit.length;
	},

	/**
	 * Define and set $form
	 * @return {boolean} If $form exists
	 */
	defineForm: function() {
		this.$form = this.$field.closest('form');
		return !!this.$form.length;
	},

	setEvents: function() {
		if (~this.options.triggerType.indexOf('focusout'))
			this.initBlurTrigger();
		this.$form.on('submit', this.onSubmit.bind(this));
	},

	initBlurTrigger: function() {
		var timeoutFlag, self = this;
		this.$field.on('blur', function() {
			timeoutFlag = setTimeout(self.run.bind(self), self.options.focusoutDelay);
		}).on('focus', function() {
			clearTimeout(timeoutFlag);
		});
	},

	/**
	 * Called on form submit.
	 * Prevent default form proceeding if an email is invalid
	 * @return {boolean|void}
	 */
	onSubmit: function() {
		if (!('state' in this)) this.run();
		if (!this.formEnabled)
			return false;
	},

	run: function() {
		var value = this.$field.val();
		var self = this;
		this.state = EmailValiditon.STATES.PENDING;
		this.validate(value).done(function(result) {
			self.setState(result);
			if (!result) return false;
		});
	},

	/**
	 * Set state
	 * @param {boolean|null|undefined} state 
	 */
	setState: function(state) {
		if (state === EmailValiditon.STATES.INVALID) {
			this.setInValid();
		} else if (state === EmailValiditon.STATES.VALID || 
			state === EmailValiditon.STATES.UNDEFINED)
			this.setValid();
		else if (state == EmailValiditon.STATES.UNDEFINED)
			this.reset();
		else {
			state = EmailValiditon.STATES.UNDEFINED;
			this.state = state;
			throw new Error('Not allowed value of state');
		}
	},

	/**
	 * Reset form and field to default value as they were before plugin init
	 */
	reset: function() {
		this.formEnabled = true;
		this.$submit.removeClass(this.dName + 'Submit--disabled').prop('disabled', false);
		this.$field
			.removeClass(this.dName + '--valid')
			.removeClass(this.dName + '--invalid');
	},

	/**
	 * Called when email is invalid.
	 * Disable form. Mark field as invalid
	 */
	setInValid: function() {
		this.formEnabled = false;
		this.$submit.addClass(this.dName + 'Submit--disabled').prop('disabled', true);
		this.$field
			.removeClass(this.dName + '--valid')
			.addClass(this.dName + '--invalid');
	},

	/**
	 * Called when email is valid.
	 * Enable form. Mark field as valid
	 */
	setValid: function() {
		this.formEnabled = true;
		this.$submit.removeClass(this.dName + 'Submit--disabled').prop('disabled', false);
		this.$field.removeClass(this.dName + '--invalid').addClass(this.dName + '--valid');
	},

	/**
	 * Validate email
	 * @param  {string} email Email to validate
	 * @return {jQuery.Deferred} Deferred instance, which is resolved with a state
	 */
	validate: function(email) {
		var result = this.validateRegExp(email);
		if (result && this.options.remoteValidate)
			return this.options.remoteValidate(email);
		var def = $.Deferred();
		def.resolve(result);
		return def;
	},

	/**
	 * Validate an email with regular expression
	 * @param  {string} email Email to validate
	 * @return {boolean}      Result of validation
	 */
	validateRegExp: function(email) {
		return this.options.validationReg.test(email);
	},

	/**
	 * Set options, extending existing
	 * @param {Object} options New options
	 */
	setOptions: function(options) {
		this.options = $.extend(true, this.options, options);
		this.options.triggerType = [].concat(this.options.triggerType);
	},
};

EmailValiditon.STATES = {
	// State can not be detected. It happens when #remoteValidation produces an error
	UNDEFINED: undefined,
	// State is valid
	VALID: true,
	// State is invalid
	INVALID: false,
	PENDING: null
};

EmailValiditon.initField = function($field) {
	var inst = new this;
	inst.$field = $field;
	inst.setOptions(this.options);
	inst.init();
	return inst;

};
EmailValiditon.options = {
	dName: 'femm',
	validationReg: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
	triggerType: ['submit', 'focusout'/*,'keyup'*/],
	remoteValidate: false,
	// Used only when `triggerType` contains 'focusout'
	focusoutDelay: 400
};
EmailValiditon.setOptions = function(options) {
	this.options = $.extend(true, this.options, options);
};

module.exports = EmailValiditon;

global.l = function (x) {
	console.log(x);
};