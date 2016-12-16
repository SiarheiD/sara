'use strict';

Function.prototype.throttle = function (milliseconds) {
	var baseFunction = this,
		lastEventTimestamp = null,
		limit = milliseconds;
	return function () {
		var self = this,
			args = arguments,
			now = Date.now();

		if (!lastEventTimestamp || now - lastEventTimestamp >= limit) {
			lastEventTimestamp = now;
			baseFunction.apply(self, args);
		} else {};
	};
};

var trimm = function(value, min, max){
	return value < min ? min : value > max ? max : value;
};

var getTransFormScaleXValue = function(element) {
	var transform = element.css('transform');
	if (transform === 'none') return 1;
	return Number( transform.slice(7, -1).split(',')[0] );
};

var getTransformTranslateX = function(element) {
	var transform = element.css('transform');
	if (transform === 'none') return 0;
	return Number(element.css('transform').slice(7,-1).split(',')[4]);
}

var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd';
var trTimeFunction = {
	'single' : 'ease-in-out',
	'doubleFace' :  'ease-in',
	'doubleBackface' : 'ease-out'
};
var trDuration = .3;
var i = 0;
var magazineSelector = '#magazine';
var pageSelector = '.magazine-page';


var Model = {

	actModel: {},
	pages: [],

	pageInPlay: false,

	pagesCount: 0,
	index: 0,

	get currentIndex(){
		return this.index;
	},

	set currentIndex(value){
		this.index = trimm(value, 0, this.pagesCount - 1);
		window.location.hash = this.index + 1;
	},

	animate: function(delta, viewMode){

		var self = this;
		self.animateFunction[viewMode][delta.dir](delta, viewMode);

	},

	newTurnEvent: function(dir){
		var event = $.Event('turned');
		event.dir = dir;
		$(window).trigger(event);
	},

	animateFunction: {

		'single': {
			'prev': function(delta){

				View.changedPages = [];
				var page = View.pages.eq(Model.currentIndex - 1);
				var delta = 1 - getTransFormScaleXValue(page);

				if (Model.currentIndex > 0) {

					page.css({
							'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.single,
							'transform': 'scaleX(1)'
						});
					Model.pageInPlay = true;

					page.on(transitionEnd, function(){
						$(this).removeClass('turned');
						$(this).css({transform: '', transition: ''});
						Model.currentIndex -= 1;
						Model.pageInPlay = false;
						View.hideUnnecessaryPages(Model.currentIndex);
						$(this).off(transitionEnd);
					});
				};

			},

			'next': function(){

				View.changedPages = [];
				var page = View.pages.eq(Model.currentIndex);
				var delta = getTransFormScaleXValue(page);

				if (Model.currentIndex < Model.pagesCount - 1) {

					page.css({
							'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.single,
							'transform': 'scaleX(0)',
							});
					Model.pageInPlay = true;

					page.on(transitionEnd, function(){
						$(this).addClass('turned');
						$(this).css({transform: '', transition: ''});
						Model.currentIndex += 1;
						Model.pageInPlay = false;
						View.hideUnnecessaryPages(Model.currentIndex);
						$(this).off(transitionEnd);
					});
				} else {
					View.changedPages = [];
					page.css({
							'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.single,
							'transform': 'scaleX(1)',
						});
					Model.pageInPlay = true;

					page.on(transitionEnd, function(){
						$(this).css({
							'transform': '',
							'transition':''
						});

						Model.pageInPlay = false;
					})
				};
			},
		},

		'double': {
			'prev': function(){

				var face, backface;

				if ( !(Model.currentIndex > 0) ) return false;

				if (Model.currentIndex % 2 === 0){
					face = View.pages.eq(Model.currentIndex - 1);
					backface = View.pages.eq(Model.currentIndex - 2);
				} else {
					face = View.pages.eq(Model.currentIndex);
					backface = View.pages.eq(Model.currentIndex - 1);
				};

				View.changedPages = [];
				Model.pageInPlay = true;


				if ( getTransFormScaleXValue(face) === 0 ) {
					backfacePlay(backface);
				} else {
					facePlay(face, backface);
				};

				if (Model.currentIndex === 1 || Model.currentIndex === 2) {
					containerPlay(0);
				} else
				if (Model.currentIndex === Model.pagesCount - 1 && Model.pagesCount % 2 === 0) {
					containerPlay(1);
				};

				function backfacePlay(backface){
					var delta = 1 - getTransFormScaleXValue(backface);
					backface.css({
						'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.doubleBackface,
						'transform' : 'scaleX(1)',
					});
					backface.on(transitionEnd, function(){
						$(this).removeClass('turned');
						$(this).css({
							'transition': '',
							'transform' : '',
						});
						Model.currentIndex -= 2;

						Model.pageInPlay = false;
						View.hideUnnecessaryPages(Model.currentIndex);

						backface.off(transitionEnd);
					});
				};

				function facePlay(face, backface){
					var delta = getTransFormScaleXValue(face);
					face.css({
							'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.doubleFace,
							'transform' : 'scaleX(0)',
						});

					face.on(transitionEnd, function(){

						backfacePlay(backface);

						$(this).removeClass('turned');
						$(this).css({
								'transition': '',
								'transform' : '',
							});

						face.off(transitionEnd);
					});
				};

				function containerPlay(value){
					var contDelta;
					var transformValue;

					if (value === 0) {
						contDelta = 1 - Math.abs(getTransformTranslateX(View.container)/$(window).width())/.25
						transformValue = '-25%';
					} else if (value === 1) {
						contDelta = Math.abs(getTransformTranslateX(View.container)/$(window).width())/.25
						transformValue = '0';
					};

					View.changedContainer = null;

					View.container.css({
						'transition': 'transform ' + trDuration * contDelta + 's',
						'transform' : 'translateX(' + transformValue + ')',
					});

					View.container.on(transitionEnd, function(){
						$(this).css({
							'transition': '',
						});

						View.container.off(transitionEnd);
					});

				};
			},

			'next': function(delta, viewMode){

				var face, backface;
				if ( Model.currentIndex === Model.pagesCount - 1 && Model.pagesCount % 2 === 0 ) return false;

				if (Model.currentIndex % 2 === 0){
					face = View.pages.eq(Model.currentIndex);
					backface = View.pages.eq(Model.currentIndex + 1);
				} else {
					face = View.pages.eq(Model.currentIndex + 1);
					backface = View.pages.eq(Model.currentIndex + 2);
				};

				// centered first page
				if (Model.currentIndex === 0) {
					containerPlay(0);
				} else 
				if ( Model.currentIndex > Model.pagesCount - 4 && Model.pagesCount % 2 === 0 ) {
					containerPlay(1);
				};

				View.changedPages = [];
				Model.pageInPlay = true;

				if ( Model.currentIndex >=  Model.pagesCount - 2 && Model.pagesCount % 2 !== 0) {
					backfacePlay(face, 'last');
				} else if (getTransFormScaleXValue(face) === 0) {
					backfacePlay(backface);
				} else {
					facePlay(face, backface);
				};


				function backfacePlay(backface, last){
					var delta = 1 - getTransFormScaleXValue(backface);

					backface.css({
						'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.doubleBackface,
						'transform' : 'scaleX(1)',
					});

					backface.on(transitionEnd, function(){
						if (!last) {
							$(this).addClass('turned');
							Model.currentIndex += 2;
						}

						$(this).css({
							'transition': '',
							'transform' : '',
						});

						Model.pageInPlay = false;
						View.hideUnnecessaryPages(Model.currentIndex);

						backface.off(transitionEnd);
					});
				};

				function facePlay(face, backface){
					var delta = getTransFormScaleXValue(face);

					face.css({
							'transition': 'transform ' + (trDuration * delta) + 's ' + trTimeFunction.doubleFace,
							'transform' : 'scaleX(0)',
						});

					face.on(transitionEnd, function(){

						backfacePlay(backface);

						$(this).addClass('turned');
						$(this).css({
								'transition': '',
								'transform' : '',
							});

						face.off(transitionEnd);
					});
				};

				function containerPlay(value){
					var contDelta;
					var transformValue;

					if (value === 0) {
						contDelta = Math.abs(getTransformTranslateX(View.container)/$(window).width())/.25
						transformValue = '0';
					} else if (value === 1) {
						contDelta = 1 - Math.abs(getTransformTranslateX(View.container)/$(window).width())/.25
						transformValue = '25%';
					};

					View.changedContainer = null;

					View.container.css({
						'transition': 'transform ' + trDuration * contDelta + 's',
						'transform' : 'translateX(' + transformValue + ')',
					});

					View.container.on(transitionEnd, function(){
						$(this).css({
							'transition': '',
						});

						View.container.off(transitionEnd);
					});

				};


			},
		},
	},

	drawFunction: {

		'single': {
			'prev': function(delta, flag){

				var self = Model;
				var value, index;
				value = flag ? flag : trimm(delta.x, 0, 1);
				index = self.currentIndex - 1;
				if ( index >= 0) {
					View.changedPages[index] = value;
				};
			},

			'next': function(delta, flag){

				var self = Model;
				var value;
				value = flag ? flag : trimm(1 + delta.x, 0, 1);

				View.changedPages[self.currentIndex] = value;
			},
		},

		'double': {
			'prev': function(delta, flag){

				var self = Model;
				var face, backface;
				var value;

				if (self.currentIndex % 2 === 0){
					face = self.currentIndex - 1;
					backface = self.currentIndex - 2;
				} else {
					face = self.currentIndex;
					backface = self.currentIndex - 1;
				};

				if (self.currentIndex === 1 || self.currentIndex === 2) {
					View.changedContainer = trimm( -delta.x * 25 , -25, 0);
				} else if (self.pagesCount % 2 === 0 && self.currentIndex === self.pagesCount - 1 ) {
					View.changedContainer = trimm( (1 - delta.x) * 25 , 0, 25)
				}

				if (delta.x <= .5) {

					value = flag ? flag : trimm( 1 - delta.x*2 , 0, 1);

					View.changedPages[backface] = flag || 0;
					View.changedPages[face] = value;
				} else {
					value = flag ? flag : trimm(delta.x * 2 - 1, 0, 1);

					View.changedPages[face] = flag || 0;
					View.changedPages[backface] = value;
				};

			},

			'next': function(delta, flag){

				var self = Model;
				var face, backface;
				var value;
				if ( Model.currentIndex === Model.pagesCount - 1 && Model.pagesCount % 2 === 0 ) return false;

				if (self.currentIndex % 2 === 0){
					face = self.currentIndex;
					backface = self.currentIndex + 1;
				} else {
					face = self.currentIndex + 1;
					backface = self.currentIndex + 2;
				};

				if (self.currentIndex === 0) {
					View.changedContainer = trimm( -25 - delta.x * 25 , -25, 0);
				} else if (self.pagesCount % 2 === 0 &&  self.currentIndex >= self.pagesCount - 3) {
					View.changedContainer = trimm( -delta.x * 25 , 0, 25)
				};

				if (delta.x >= -.5) {
					value = flag ? flag : trimm(1 + delta.x * 2, 0, 1);

					View.changedPages[face] = value;
					View.changedPages[backface] = flag || 0;
				} else {
					value = flag ? flag : trimm( -delta.x*2 - 1 , 0, 1);

					View.changedPages[face] = flag || 0;
					View.changedPages[backface] = value;
				};


			},
		},
	},


	draw: function(delta, viewMode){

		var self = this;
		self.drawFunction[viewMode][delta.dir](delta);

	},

	checkHash: function(){
		var self = this;

		var hash = Number(window.location.hash.slice(1));
		if (isNaN(hash)) return self;

		if ( hash - 1 === self.currentIndex ) return self;

		self.currentIndex = hash - 1;
		View.goTo(self.currentIndex);

	},

	init: function(magazineSelector, pageSelector) {

		var self = this;

		View.init(magazineSelector, pageSelector);

		self.count = View.pages.length;
	},

};


var View = {

	magazine: null,
	pages: null,
	container: null,

	viewMode: '',

	changedPages: [], // [0: value, 1: value]
	changedContainer: null, // value

	drawPage: function(index, value){

		var self = this;

		if (typeof value === 'number'){
			self.pages.eq(index).css('transform', 'scaleX('+ value +')');

			return self;
		};

		if (value === 'animationEnded') {
			self.pages.eq(index).css('transform', '');
			self.pages.eq(index).toggleClass('turned');

			return self;
		};

		if (value === 'animationCanceled') {
			self.pages.eq(index).css('transform', '');
		};



		return self;
	},

	drawContainer: function(){
		var self = this; 
		if (!self.changedContainer) return false;

		self.container.css('transform', 'translateX('+ self.changedContainer +'%)');
		self.changedContainer = null;
		return self;
	},

	drawChangedPages: function(){

		var self = this;

		for (var i = 0, length = self.changedPages.length; i < length; i++) {

			if (self.changedPages.hasOwnProperty(i)) {
				self.drawPage(i, self.changedPages[i]);
				delete self.changedPages[i];
			};

		};

	},

	hideUnnecessaryPages: function(index){
		var self = this;
		var pages = self.pages;

		pages.removeClass('hidden');

		if (self.viewMode === 'single') {

			pages.eq(index - 1 < 0 ? 0 : index - 1).prevAll().addClass('hidden');
			pages.eq(index + 1).nextAll().addClass('hidden');

		} else if (self.viewMode === 'double') {

				pages.eq(index - 3 < 0 ? 0 : index - 3).prevAll().addClass('hidden');
				pages.eq(index + 3).nextAll().addClass('hidden');

		};

		return self;
	},

	drawLoop: function(){
		var self = View;
		// условие для включения/выключения цикла
		self.drawChangedPages();
		self.drawContainer();
		requestAnimationFrame(self.drawLoop);

	},

	checkViewMode: function(){
		var self = this;

		if ( $(window).width()/$(window).height() >= 750/667) {
			if (self.viewMode !== 'double') {
				self.viewMode = 'double';
				// self.drawSheetPosition = self.doubleModeDraw;
				// self.goTo(Magazine.currentPage);
			};
		} else {
			if (self.viewMode !== 'single') {
				self.viewMode = 'single';
				self.hideUnnecessaryPages(Model.currentIndex);
				// self.drawSheetPosition = self.singleModeDraw;
				// self.goTo(Magazine.currentPage);
			};
		};
		self.goTo(Model.currentIndex);

		return self;
	},

	goTo: function(index){
//page - page index from
		var self = this;
		var pages = self.pages;


		Model.currentIndex = index;
		index = Model.currentIndex;

// пробегаем по страницам и в зависимости от viewMode 
// добавляем классы turned (для перевернутых страниц)
		if (self.viewMode === 'single' || (self.viewMode === 'double' && index % 2 === 0)) {
			pages.eq(index).prevAll().addClass('turned');
			pages.eq(index).nextAll().removeClass('turned');
			pages.eq(index).removeClass('turned');
		} else
		if (self.viewMode === 'double' && index % 2 !== 0) {
			pages.eq(index).prevAll().addClass('turned');
			pages.eq(index).addClass('turned');
			pages.eq(index).nextAll().removeClass('turned');
		};

		if (self.viewMode === 'double') {
			if (index === 0) {
				self.container.css('transform', 'translateX(-25%)')
			} else
			if (index === self.pages.length - 1 && index % 2 !== 0) {
				self.container.css('transform', 'translateX(25%)')
			} else {
				self.container.css('transform', '')
			};
		} else {
			self.container.css('transform', '')
		};

		self.hideUnnecessaryPages();
		return self;
	},

	zIndexRules: function(pageSelector){
		var self = this;
		var pagesCount = self.pages.length;
		var styleElement = $('<style type="text/css">');
		var styleRule = '';

		for (var i = 1; i <= pagesCount; i++) {

			styleRule += pageSelector + ':nth-child('+ i +')' + '{z-index: ' + (pagesCount + 10 - i) + ';}\r\n';

		};

		styleElement.text(styleRule);
		$('head').append(styleElement);

		return self;
	},

	init: function(magazineSelector, pageSelector){

		var self = this;
		self.magazine = $(magazineSelector);
		self.pages = self.magazine.find(pageSelector);
		Model.pagesCount = self.pages.length;
		self.container = self.magazine.children('.container');
		Model.checkHash();
		self.zIndexRules(pageSelector)
			.checkViewMode()
			.goTo(Model.currentIndex)
			.hideUnnecessaryPages(Model.currentIndex)
			.drawLoop();
		Model.pagesCount = self.pages.length;

	},


};

/* =============================*/

var Controller = {

	startMoving: function(delta){


	},

	pageMove: function(delta){

		Model.draw(delta, View.viewMode);

	},

	stopMoving: function(delta) {

		Model.animate(delta, View.viewMode);

	},

	resize: function(){
		View.checkViewMode()
			.hideUnnecessaryPages(Model.currentIndex);
	},

	onTurn: function(evt){


		var dir = evt.dir === 'next' ? 1 : -1;
		var viewMode = View.viewMode === 'single' ? 1 : 2;

		Model.currentIndex += dir * viewMode;
		View.hideUnnecessaryPages(Model.currentIndex);

	},

	hashChange: function() {
		Model.checkHash();
	}
};

/* ============================ */


(function(){

	var app = {

		init: function(){

			this.event();
			this.main();

		},

		main: function(){

			Model.init(magazineSelector, pageSelector);

		},

		event: function(){
			var touched = false;
			$(window).on('mousedown touchstart', function(eDown) {

				if (touched) return false;
				if (Model.pageInPlay) return false;

					touched = true;

				if (eDown.type === 'touchstart') {
					eDown.originalEvent.changedTouches[0].preventDefault = eDown.preventDefault;
					eDown.originalEvent.changedTouches[0].stopPropagation = eDown.stopPropagation;
					eDown = eDown.originalEvent.changedTouches[0];
				};

				// Controller.mouseDown();
				eDown.preventDefault();
				var moved = false;
				var delta = {};
				var wWidth = $(window).width();

				$(window).on('mousemove touchmove', function(eMove) {

					if (eMove.type === 'touchmove') {
						eMove.originalEvent.changedTouches[0].preventDefault = eMove.preventDefault;
						eMove.originalEvent.changedTouches[0].stopPropagation = eMove.stopPropagation;
						eMove = eMove.originalEvent.changedTouches[0];
					};
				// VS.moves++;

					eMove.preventDefault();
					delta.x = (eMove.pageX - eDown.pageX)/wWidth;

					if ( moved ) {
						Controller.pageMove( delta );
					} else if ( Math.abs(eMove.pageX - eDown.pageX) > 5 ) {
						moved = true;
						delta.dir = delta.x < 0 ? 'next' : 'prev';
						Controller.startMoving(delta);
					};

				}.throttle(12));

				$(window).on('mouseup touchend', function(evt){

					$(window).off('mousemove');
					$(window).off('touchmove');

					if (moved) {
						Controller.stopMoving(delta);
					};

						touched = false;


					$(window).off('mouseup');
					$(window).off('touchend');

				});

			});


			$(window).on('resize', Controller.resize);
			$(window).on('hashchange', Controller.hashChange);
			//custom
			$(window).on('turned', Controller.onTurn);
		},

	};

	app.init();

}());