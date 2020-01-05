window.anoumi = window.anoumi || {};

(function($){
	'use strict';
	$.fn.AnoumiSlider = function (options) {
		var settings = $.extend({}, $.fn.AnoumiSlider.defaults, options);

		return this.each(function(){
			var el=this,
				body = document.getElementsByTagName('body')[0],
				activeSlide = 0,
				v={};

			v.sizes = {};
			v.paused = false;
			v.onPlay = false;
			v.slides = el.querySelectorAll('.slider-item');
			if ( v.slides.length < 1 ) return false;

			function setup() {

				// resize the images manually,
				// we need to use this instead background-size cover
				// to get the real scale
				for(var i = 0; i < v.slides.length; i++ ) {
					var slide = v.slides[i],
						img = slide.querySelector('img'),
						dataSize = ( typeof $(slide).data('sizes') !== 'undefined' ? $(slide).data('sizes') : {width: img.naturalWidth, height: img.naturalHeight, ratio: (img.naturalWidth / img.naturalHeight).toFixed(2)} );

					var widthRatio = v.sizes.w / dataSize.width,
						heightRatio = v.sizes.h / dataSize.height;

					if (widthRatio > heightRatio) {
						dataSize.newWidth = v.sizes.w;
						dataSize.newHeight = Math.ceil( v.sizes.w / dataSize.ratio );
					} else {
						dataSize.newHeight = v.sizes.h;
						dataSize.newWidth = Math.ceil( v.sizes.h * dataSize.ratio );
					}

					dataSize.top = (v.sizes.h-dataSize.newHeight)/2;
					dataSize.left = (v.sizes.w-dataSize.newWidth)/2;

					img.style.maxWidth = 'none';
					img.style.width = dataSize.newWidth+'px';
					img.style.height = dataSize.newHeight+'px';
					img.style.top = dataSize.top+'px';
					img.style.left = dataSize.left+'px';

					$(slide).data('sizes', dataSize);
					if ( typeof $(slide).data('effect') === 'undefined' ) {
						$(slide).data('effect', 'downscale');
					}

					if ( typeof $(slide).data('zoom') === 'undefined' ) {
						$(slide).data('zoom', 1.2);
					}

					if ( typeof $(slide).data('speed') === 'undefined' ) {
						$(slide).data('speed', settings.speed);
					}
				}
			};

			function play() {
				var slide = v.slides[activeSlide],
					zoomer = [ $(slide).data('zoom'), 1 ];

				switch( $(slide).data('effect') ) {
					case 'topright':
						$(slide).css({ 'transform-origin': 'right top' });
					break;

					case 'topleft':
						$(slide).css({ 'transform-origin': 'left top' });
					break;

					case 'bottomleft':
						$(slide).css({ 'transform-origin': 'left bottom' });
					break;

					case 'bottomright':
						$(slide).css({ 'transform-origin': 'right bottom' });
					break;
				}

				if ( $(slide).data('effect') === 'upscale' ) {
					zoomer = [ 1, $(slide).data('zoom') ];
				}

				// show the first slide
				$(slide).css({opacity: 1});
				anime({
					targets: el,
					opacity: [0,1],
					easing: 'linear',
					duration: 300,
				});
				anime({
					targets: v.slides[activeSlide],
					scale: zoomer,
					duration: $(slide).data('speed'),
					easing: 'easeInOutSine',
					complete: function() {
						
						$(slide).css({zIndex: 2});

						if ( v.slides.length < 2 ) {
							if ( settings.nextButtonId ) {
								$(settings.nextButtonId).hide();
							}
							if ( settings.previousButtonId ) {
								$(settings.previousButtonId).hide();
							}
						}

						if ( ! v.paused ) {
							window.setTimeout( function() {
								requestAnimationFrame( function() {
									loop(); 
								});
							}, 500);
						}
					}
				});
			};

			function loop( direction, callback ) {
				var slideNow = $(v.slides[activeSlide]);

				if ( v.onPlay ) {
					return false;
				}

				v.onPlay = true;

				if ( typeof direction === 'undefined' ) direction = 'next';

				if ( typeof direction === 'number' ) {
					activeSlide = direction;
				} else { 
					(direction === 'next') ? activeSlide++ : activeSlide--;
				}

				if ( activeSlide === v.slides.length ) {
					activeSlide = 0;
				}

				if ( activeSlide < 0 ) {
					activeSlide = v.slides.length-1;
				}

				var nextSlide = $(v.slides[activeSlide]),
					zoomer = [ nextSlide.data('zoom'), 1 ];

				if ( nextSlide.data('effect') === 'upscale' ) {
					zoomer = [ 1, nextSlide.data('zoom') ];
				}

				$(el).find('.current-bullet').removeClass('current-bullet');
				$(el).find('#slide-bullet-'+activeSlide).addClass('current-bullet');

				nextSlide.css({ zIndex : 1 });
				anime.set( nextSlide[0], {
					opacity: 1,
					scale: zoomer[0],
				});
				switch( nextSlide.data('effect') ) {
					case 'topright':
						nextSlide.css({ 'transform-origin': 'right top' });
					break;

					case 'topleft':
						nextSlide.css({ 'transform-origin': 'left top' });
					break;

					case 'bottomleft':
						nextSlide.css({ 'transform-origin': 'left bottom' });
					break;

					case 'bottomright':
						nextSlide.css({ 'transform-origin': 'right bottom' });
					break;
				}
				anime({
					targets: slideNow[0],
					opacity: [1,0],
					duration: 500,
					easing: 'linear',
					complete: function() {
						anime({
							targets: nextSlide[0],
							scale: zoomer,
							duration: nextSlide.data('speed'),
							easing: 'easeInOutSine',
							complete: function() {
								nextSlide.css({zIndex: 2});
								
								v.onPlay = false;
								if ( typeof callback === 'function' ) {
									callback();
								}

								if ( ! v.paused ) {
									window.setTimeout( function() {
										requestAnimationFrame( function() {
											loop(); 
										});
									}, 500);
								}
							}
						});
					}
				});
			};

			function getParentSize() {		
				if ( $('#countFrame').length < 1 ) {
					var f = document.createElement('iframe');
					f.id = 'countFrame';
					f.style.height = '100%';
					f.style.width = '100%';
					f.style.border = '0';
					f.style.margin = '0';
					f.style.padding = '0';
					f.style.top = '0';
					f.style.left = '0';
					f.style.position = 'absolute';
					f.style.zIndex = '-99';
					el.appendChild(f);
				}

				var iframeWin = document.getElementById('countFrame').contentWindow;
				v.sizes.h = iframeWin.document.body.scrollHeight;
				v.sizes.w = iframeWin.document.body.scrollWidth;
				
				iframeWin.addEventListener('resize', function(){
					v.sizes.h = this.document.body.scrollHeight;
					v.sizes.w = this.document.body.scrollWidth;
					setup();
				});
			};

			function attachButtonListener() {
				$(settings.nextButtonId).unbind().on('click', function(e) {
					e.preventDefault();
					loop();
				});

				$(settings.previousButtonId).unbind().on('click', function(e) {
					e.preventDefault();
					loop('prev');
				});

				$('#slideBullets').find('a').each(function(){
					var $a = $(this),
						index = $a.data('index');

					$a.unbind().on('click', function(e) {
						e.preventDefault();

						if ( parseInt(index) !== activeSlide ) {
							loop( parseInt(index) );
						}
					});
				});

				$(document.documentElement).on( 'keyup', function (e) {
					if (e.keyCode == 39) {
						loop();
					}

					if (e.keyCode == 37) {
						loop('prev');
					}
				});
			};

			function pause() {
				v.paused = true;
			};

			function resume() {
				if ( v.paused ) {
					v.paused = false;
					window.setTimeout( function() {
						requestAnimationFrame( function() {
							loop(); 
						});
					}, 500);
				}
			};

			function init() {
				$(el).css({opacity: 0});
				getParentSize();
				setup();
				requestAnimationFrame( play );

				$(el).on( 'pause', function() {
					pause();
				});

				$(el).on( 'resume', function() {
					resume();
				});
			};
			init();
		});
	};

	$.fn.AnoumiSlider.defaults = {
		speed: 6000,
		nextButtonId: false,
		previousButtonId: false,
	};
})(window.jQuery);


window.anoumi = function($) {
	"use strict";
	var an = {
		init: function() {
			var d = this,
				html = document.documentElement;

			d.activeId = 0;
			d.onPageMove = false;
			d.contentScroll = window.Scrollbar;
			html.className = html.className.replace(/\bno-js\b/,'js');

			// Map all section ids.
			d.mainIds = $.map( $('.anoumi-section'), function(el){
				return el.id;
			});

			// IOS thing.
			if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
				$('html').addClass('ios');
			}

			d.video_bg_init();
			d.static_bg_init();

			$(window).on( 'load', function() {
				d.initSlider();
				d.removePreloader();
				d.onePageInit();
				d.initTextRotator();
			});

			$(window).on( 'anoumiLoaded', function() {
				d.menuInit();
				d.initContent();
				d.trackAppear();
				d.contactFormInit();
			});

			$(window).on('resize', function() {
				$('.toggleMenu').removeClass('toggleMenu');
				$('.anoumi-hamburger__menu').removeAttr('style').removeClass('is-active');
				$('.nav-ui').removeClass('onMouseOver');

				$('html').removeClass('ios');
				if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
					$('html').addClass('ios');
				}
			});
		},

		onePageInit: function() {
			var self = this;

			if ( $('.anoumi-section').length < 1 ) {
				return false;
			}

			// check if any hash in current URL
			if ( window.location.hash ) {
				var nh = window.location.hash.substring(1);

				if ( nh !== "" ) {

					if ( self.mainIds.indexOf(nh) !== -1 ) {
						self.activeId = self.mainIds.indexOf(nh);
						$('#'+nh).addClass('active');
						
						if ( $('#'+nh).find('#kenburn-slides').length < 1 ) {
							if ( $('#kenburn-slides').length ) {
								$('#kenburn-slides').trigger( 'pause' );
							}
						} else {
							$('#kenburn-slides').trigger( 'resume' );
						}

						$(window).trigger('pageMoved');

					} else {
						window.setTimeout( function() {
							self.movePage(nh);
						},10);
					}
				}
			} else {
				self.activeId = 0;
				$('#'+self.mainIds[self.activeId]).addClass('active');
			}

			self.setActiveMenuItem();

			$(document).unbind().on('click', 'a', function(e){
				var z=this;

				// check if link is local && it has hash
				if ( self.linkisLocal(z) && z.href.indexOf('#') !== -1 ) {
					e.preventDefault();
					var ccid = z.hash.substring(1);
					
					if ( ccid !== "" ) {
						self.movePage(ccid);
					}
				}
			});

			if ("onhashchange" in window) {
				$(window).on('hashchange', function(e) {
					e.preventDefault();
					var nh = window.location.hash.substring(1);

					if ( nh === "" ) {
						nh = self.mainIds[0];
					}
					if ( nh !== self.mainIds[self.activeId] ) {
						self.movePage(nh);
					}
				});
			}
		},

		linkisLocal: function(el) {
			var d=this;
			if ( window.location.hostname === el.hostname || !el.hostname.length ) {
				return true;
			}

			return false;
		},

		movePage: function( elid ) {
			var self = this,
				after = false,
				currentID = self.mainIds[self.activeId];

			// Not valid ID.
			if ( typeof elid === 'undefined' || $('#'+elid).length < 1 ) {
				return false;
			}

			// Stop, if another request is on process.
			if ( self.onPageMove ) {
				return false;
			}

			if ( elid === currentID ) {
				return false;
			}

			// Markup is exists but it is not the one from our section ids
			// So it should be an id of an element inside the section
			if ( self.mainIds.indexOf(elid) < 0 ) {
				var origtarget = elid,
					parentT = $('#'+origtarget).closest('.anoumi-section');

				// Update our elid.
				elid = $(parentT).attr('id');

				// Tell the script we should move to the target after the transition.
				after = function() {
					var targetElem = document.querySelector('#'+elid+' .inner-section'),
						targetScrollbar = self.contentScroll.get(targetElem);
					
					targetScrollbar.scrollIntoView( document.querySelector('#'+origtarget), {
						alignToTop: true,
						onlyScrollIfNeeded: true,
					});
				}

				if ( elid === currentID ) {
					after();
					return false;
				}
			}

			if ( self.mainIds.indexOf(elid) !== -1 ) {
				// Track.
				self.onPageMove = true;

				// let's close the menu for now.
				$('.toggleMenu').removeClass('toggleMenu');
				$('.anoumi-hamburger__menu').removeClass('is-active');
				$('.nav-ui').removeClass('onMouseOver');

				self.activeId = self.mainIds.indexOf(elid);
				$('.current-menu-item').removeClass('current-menu-item');
				self.setActiveMenuItem();

				anime.set( '#'+elid, { translateY: '-200vh' } );
				anime({
					targets: '#main',
					scale: [1, 0.75],
					duration: 500,
					easing: 'easeOutCubic',
					complete: function() {

						// Animate shadow.
						anime({
							targets: '#main .main-shadow',
							left: '48%',
							right: '48%',
							opacity: [1, 0.5],
							duration: 600,
							easing: 'easeOutCubic',
							complete: function() {
								anime({
									targets: '#main .main-shadow',
									left: '-3%',
									right: '-3%',
									opacity: [0.5, 1],
									duration: 600,
									easing: 'easeInCirc',
								});
							}
						});

						anime({
							targets: '#'+currentID,
							translateY: ['0vh', '-200vh'],
							duration: 600,
							easing: 'easeOutCubic',
							complete: function() {
								$('#'+currentID).removeClass('active').removeAttr('style');

								if ( $('#'+elid).find('.inner-section').length ) {
									var elem = document.querySelector('#'+elid+' .inner-section'),
										scrollbar = self.contentScroll.get(elem);

									scrollbar.scrollTop = 0;
								}

								anime({
									targets: '#'+elid,
									translateY: ['-200vh', '0vh'],
									duration: 600,
									easing: 'easeInCirc',
									complete: function() {
										
										anime({
											targets: '#main',
											scale: [0.75, 1],
											duration: 500,
											delay: 250,
											easing: 'easeOutCubic',
											complete: function() {
												$('#'+elid).addClass('active').removeAttr('style');
												window.location.hash = elid;
												self.onPageMove = false;
												if ( $('#'+elid).find('#kenburn-slides').length < 1 ) {
													if ( $('#kenburn-slides').length ) {
														$('#kenburn-slides').trigger( 'pause' );
													}
												} else {
													window.requestAnimationFrame(function() {
														$('#kenburn-slides').trigger( 'resume' );
													});
												}

												self.trackAppear();
												$(window).trigger('pageMoved');
												if ( typeof after === 'function' ) {
													after();
												}
											}
										});										
									}
								});
							}
						});
					}
				});
			}
		},

		setActiveMenuItem: function() {
			var self = this;
			$('#anoumi-nav').find('a[href*="'+self.mainIds[self.activeId]+'"]').parent().addClass('current-menu-item');
		},

		initContent: function() {
			var self = this;

			$('.split-header-image, .fullscreen-header-image').each( function() {
				if ( $(this).find('img').length ) {
					var img = $(this).find('img');
					$(img).hide();
					$(this).css({ backgroundImage : 'url('+ $(img).attr('src') +')'});
				}
			});

			$('.inner-section').each(function() {
				var contentEl = this,
					scrollEl;

				scrollEl = self.contentScroll.init( contentEl );
				scrollEl.scrollTop = 0;

				scrollEl.addListener( self.appear );
			});

			// Testimonial carousel
			if ( $('.testimonial-carousel-contain').length ) {
				var testiSwiper = new Swiper ('.testimonial-carousel-contain', {
					slidesPerView: 1,
					spaceBetween: 0,
					grabCursor: false,
					navigation: {
						nextEl: '.testimonial-carousel-btn-next',
						prevEl: '.testimonial-carousel-btn-prev',
					},
					speed: 800,
					effect: 'fade',
					fadeEffect: {
						crossFade: true,
					},
					autoplay: {
						delay: 7000,
						disableOnInteraction: false,
					},
					on: {
						init: function() {
							if ( ! $('.testimonial-carousel-contain').hasClass('initted') ) {
								var $slideTotal = $('.testimonial-carousel-contain').find('.ano-testimonial').length,
									$markup = $('<div class="total-slide"><span class="slide-current">01</span>/<span class="slide-total">0'+$slideTotal+'</span></div>');

								$('.testimonial-carousel-contain').addClass('initted')
								$markup.insertAfter( $('.testimonial-carousel-btn-prev') );
								$slideTotal = $markup = null;
							}
						},
						slideChange: function() {
							var crt = "0"+(testiSwiper.activeIndex+1);
							$('.testimonial-carousel-contain').find('.slide-current').html(crt);
							crt = null;
						},
					}
				});
			}

			// Portfolio grid
			if ( $('.portfolio-list-wrap').length ) {
				$('.portfolio-list-wrap').each( function() {
					var masonPortfolio, grids = $(this).find('.portfolio-grid');
					masonPortfolio = grids.masonry({
						itemSelector: '.portfolio-item',
						columnWidth: '.portfolio-grid__sizer',
						percentPosition: true,
						transitionDuration: '0.3s',
						gutter: 0,
					});

					masonPortfolio.masonry().masonry('layout');

					if ( $(this).find('.portfolio-filter-container').length ) {
						var filterParent = $(this).find('.portfolio-filter-container');
						filterParent.find('a').each(function() {
							var filter = this,
								target = $(this).data('field');

							$(filter).on('click', function(e) {
								e.preventDefault();
								if( $(this).parent('li').hasClass('active-filter') ) {
									return false;
								}

								filterParent.find('.active-filter').removeClass('active-filter');
								$(filter).parent('li').addClass('active-filter');

								if ( target === 'all' ) {
									$(grids).find('.hidden-grid').removeClass('hidden-grid');
								} else {
									$(grids).find('.portfolio-item.'+target).removeClass('hidden-grid');
									$(grids).find('.portfolio-item:not(.'+target+')').addClass('hidden-grid');
								}
								masonPortfolio.masonry('layout');
							});
						});

						filterParent.find('.filter-drop-button').on('click', function(e) {
							e.preventDefault();
							filterParent.toggleClass( 'mob-show-filter' );
						});
					}

					if ( $(grids).find('a').length ) {
						var gal = false;
						$(grids).find('a').each( function(i, el) {
							var href_value = el.href;
							if (/\.(jpg|jpeg|png|gif)$/.test(href_value)) {
								gal=true;
							}
						});

						if ( gal ) {
							$(grids).magnificPopup({
								delegate: 'a[href*=".jpg"],a[href*=".png"],a[href*=".jpeg"],a[href*=".gif"],a[href*=".bmp"]',
								type: 'image',
								removalDelay: 300,
								mainClass: 'mfp-fade',
								gallery:{
									enabled:true
								}
							});
						}
					}
				});
			}
		},

		appear: function( callback ) {
			var self=window.anoumi, pos=callback.offset;

			self.trackAppear(pos);
		},

		trackAppear: function( pos ) {
			var self = window.anoumi,
				currentID = self.mainIds[self.activeId],
				mh = $('#main').height(),
				mt = $('#main').offset().top;

			if ( $('#'+currentID).find('.has-reveal-effect:not(.animated)').length ) {
				$('#'+currentID).find('.has-reveal-effect:not(.animated)').each(function() {
					var el=this,
						ps= el.getBoundingClientRect(),
						pt= ps.top - mt;

					if ( $(el).hasClass('animated') ) {
						return;
					}

					if ( typeof pos === 'undefined') {
						if ( pt < (mh-$(el).height()) ) {
							$(el).addClass('animated');
						}
					} else {
						if (pt < mh) {
							$(el).addClass('animated');
						} else {
							if ( (pt+$(el).height()) == pos.y ) {
								$(el).addClass('animated');
							}
						}
					}
				});
			}

			if ( $('#'+currentID).find('.progress-wrap').length ) {
				$('#'+currentID).find('.progress-wrap:not(.animated)').each(function() {
					var el=this,
						ps=$(el).offset(),
						pt= ps.top - mt;

					if ( $(el).hasClass('animated') ) {
						return;
					}

					if ( typeof pos === 'undefined') {
						if ( pt < (mh-$(el).height()) ) {
							$(el).addClass('animated');
							self.progressBar(el);
						}
					} else {
						if (pt < mh) {
							$(el).addClass('animated');
							self.progressBar(el);
						} else {
							if ( (pt+$(el).height()) == pos.y ) {
								$(el).addClass('animated');
								self.progressBar(el);
							}
						}
					}
				});
			}

			if ( $('#'+currentID).find('.animated-number').length ) {
				$('#'+currentID).find('.animated-number:not(.animated)').each(function() {
					var el=this,
						ps=$(el).offset(),
						pt= ps.top - mt;

					if ( $(el).hasClass('animated') ) {
						return;
					}

					if ( typeof pos === 'undefined') {
						if ( pt < (mh-$(el).height()) ) {
							$(el).addClass('animated');
							self.counterNumber(el);
						}
					} else {
						if (pt < mh) {
							$(el).addClass('animated');
							self.counterNumber(el);
						} else {
							if ( (pt+$(el).height()) == pos.y ) {
								$(el).addClass('animated');
								self.counterNumber(el);
							}
						}
					}
				});
			}
		},

		// Progress bars
		progressBar: function(el) {
			var fnlObj,
				bar = $(el).find('.progress-bar'),
				progValue = ( typeof $(bar).data('progress') === 'undefined' ? 100 : parseInt($(bar).data('progress')) ),
				c = document.createDocumentFragment(),
				sp = document.createElement('span');

			c.appendChild(sp);
			sp.className = 'progress-value';
			el.appendChild(c);

			fnlObj = {progress: 0};
			anime({
				targets: fnlObj,
				progress: [0, progValue],
				duration: progValue*12,
				easing: 'linear',
				update: function() {
					bar.css({width: Math.round(fnlObj.progress)+'%'});
					sp.innerHTML = Math.round(fnlObj.progress)+'%';
				}
			});
		},

		// Reset progress bar
		resetProgressBar: function() {
			var self = this,
				currentID = self.mainIds[self.activeId];

			if ( $('#'+currentID).find('.progress-wrap').length ) {
				$('#'+currentID).find('.progress-wrap').each(function() {
					$(this).find('.progress-bar').removeAttr('style');
					$(this).find('.progress-value').remove();
				});
			}
		},

		// Animated numbers
		counterNumber: function(el) {
			var fnlObj, fnl=$(el).data('final-number'), drt=(typeof $(el).data('duration') === 'undefined') ? 1500 : $(el).data('duration');

			if ( typeof fnl === 'undefined' ) {
				return false;
			}
			fnlObj = {progress: 0};
			anime({
				targets: fnlObj,
				progress: [0, fnl],
				duration: Math.round(drt),
				easing: 'easeInSine',
				update: function() {
					$(el).html( Math.round(fnlObj.progress).toLocaleString() );
				}
			});
		},

		resetCounterNumber: function() {
			var self = this,
				currentID = self.mainIds[self.activeId];

			if ( $('#'+currentID).find('.animated-number').length ) {
				$('#'+currentID).find('.animated-number').each(function() {
					$(this).html('0');
				});
			}
		},

		initTextRotator: function() {
			var self=this,
				els = $('.text-rotator');

			if ( els.length ) {
				els.each(function() {
					var el=this,
						textData = $(el).text(),
						dataArr = textData.split(","),typed;

					if ( dataArr.length > 1 ) {
						$(el).html('');
						typed = new Typed(el,{
							strings: dataArr,
							typeSpeed: 100,
							backSpeed: 75,
							backDelay: 1500,
							loop: true,
						});

						// Decrease memory, make sure it only animate in the right scene!
						if ( $('.anoumi-section.active').find( el ).length < 1 ) {
							typed.stop();
						}

						$(window).on( 'pageMoved', function() {
							var currentID = self.mainIds[self.activeId];
							if ( $('#'+currentID).find( el ).length ) {
								typed.start();
							} else {
								typed.stop();
							}
						});
					}
				});
			}
		},

		initSlider: function() {
			var d=this;

			if ( $('#kenburn-slides').length ) {
				$('#kenburn-slides').AnoumiSlider();
			}
		},

		contactFormInit: function() {
			var self=this,
				form=$('.contact-form');

			if ( form.length ) {
				form.each( function() {
					var f=this;

					$(f).find('input:not([type="submit"])').each(function() {
						var ip=this;

						( $(ip).val() !== "" ) && $(ip).addClass('has_value');

						$(ip).on('blur', function() {
							( $(ip).val() !== "" ) ? $(ip).addClass('has_value') : $(ip).removeClass('has_value');
						});
					});

					$(f).find('textarea').each(function () {
						var origH = $(this).innerHeight()/4;
						this.style.height = 'auto';
						this.setAttribute('style', 'height:' + (this.scrollHeight+origH-(17*2)) + 'px;overflow-y:hidden;');
						$(this).on('input', function () {
							this.style.height = 'auto';
							this.style.height = (this.scrollHeight+origH-(17*2)) + 'px';
						});
					});

					// Ajax contact form
					self.processContactForm(f);
				});
			}
		},

		video_bg_init: function() {
			var self=this;

			if ( $('#ano-video-bg').length ) {
				var params = {
					vtype: $('#ano-video-bg').data('video-type'),
					videoID: $('#ano-video-bg').data('video-id'),
					img: $('#ano-video-bg').data('img-fallback'),
				};

				$('#ano-video-bg').YTPlayer({
					containment: '.yt-background',
					videoURL: 'https://youtu.be/'+params.videoID,
					useOnMobile: true,
					startAt: 0,
					mobileFallbackImage: params.img,
					coverImage: params.img,
					mute: true,
					autoPlay: true,
					loop: true,
					showYTLogo: false,
					showControls: false,
				});

			}
		},

		static_bg_init: function() {
			var self=this;
			if ( $('.static-background').length ) {
				$('.static-background').each(function() {
					var el=this,
						bgHolder = $(el).find('.static-background-inner'),
						bgImage = $(el).find('img');

					if ( bgImage.length < 1 ) {
						return false;
					}

					bgImage.hide();
					bgHolder.css({ backgroundImage: 'url('+ bgImage.attr('src') +')'});
				});
			}
		},

		// Process contact form
		processContactForm: function( el ) {
			var self=this, $form=$(el), onSend = false;

			$form.on('submit', function(e) {
				e.preventDefault();

				if ( onSend ) {
					return false;
				}

				if ( $form.find('textarea[name="message"]').val() === "" ) {
					$form.find('textarea[name="message"]').trigger('focus').addClass('border-danger');
					return false;
				}

				$form.find('.border-danger').removeClass('border-danger');
				$form.find('button').addClass('on-submit');
				onSend = true;

				var from_data = $form.serialize();

				$.ajax({
					url  : $form.attr('action'),
					type : 'post',
					data : from_data,
					dataType : 'json',
					success: function( cb ) {
						$form.find('.cf-message').html('<div class="alert alert-success">'+ cb.messages +'</div>');
						$form.trigger('reset');
						$form.find('input').trigger('blur');
						$form.find('textarea').removeAttr('style').trigger('input');
						$form.find('button').removeClass('on-submit');
						window.setTimeout(function() {
							$form.find('.cf-message').find('.alert').animate({
								opacity : 0
							}, 300, function() {
								$form.find('.cf-message').html('');
								onSend = false;
							});
						}, 3000);
					},
					error: function( cb ) {
						var err = JSON.parse( cb.responseText );

						$form.find('.cf-message').html('<div class="alert alert-danger">'+ err.messages +'</div>');
						$form.find('button').removeClass('on-submit');
						window.setTimeout(function() {
							$form.find('.cf-message').find('.alert').animate({
								opacity : 0
							}, 300, function() {
								$form.find('.cf-message').html('');
								onSend = false
							});
						}, 3000);
					}
				});

			});
		},

		menuInit: function() {
			var d=this;

			$('.anoumi-hamburger__menu').on( 'mouseover', function() {
				if ( $(window).width() > 767 && ! $('#main-header').hasClass('toggleMenu') && ! d.onPageMove ) {
					$('#main-header').addClass('toggleMenu');
				}
			}).on('mouseleave', function() {
				window.setTimeout(function(){
					if ( ! $('.nav-ui').hasClass('onMouseOver') ) {
						$('#main-header').removeClass('toggleMenu');
					}
				},25);
			});

			$('.nav-ui').on('mouseover', function() {
				$(this).addClass('onMouseOver');
			}).on( 'mouseleave', function() {
				$(this).removeClass('onMouseOver');
				if ( $(window).width() > 767 && $('#main-header').hasClass('toggleMenu') ) {
					$('#main-header').removeClass('toggleMenu');
				}
			});

			// Click.
			$('.anoumi-hamburger__menu').on( 'click', function() {
				var n = this;

				if ( $(window).width() > 767 ) {
					$('.anoumi-hamburger__menu').trigger('mouseover');
					return false;
				}

				if ( d.onPageMove ) {
					return false;
				}

				$(n).css({zIndex: 99});
				if ( $(n).hasClass('is-active') ) {
					$(n).removeClass('is-active');
					$('.nav-ui').removeClass('onMouseOver');
					$('#main-header').removeClass('toggleMenu');
				} else {
					if ( ! d.onPageMove ) {
						$(n).addClass('is-active');
						$('#main-header').addClass('toggleMenu');
					}		
				}

			});

			var menuScroll = window.Scrollbar,
				menuEl = document.querySelector('.main-menu-container-wrap'),
				scrollEm;

			scrollEm = menuScroll.init( menuEl );
			scrollEm.scrollTop = 0;
		},

		removePreloader: function() {
			var self=this;
			if ( $('#anoumi-site-preloader').length ) {
				anime({
					targets: '#anoumi-site-preloader',
					opacity: [1,0],
					duration: 500,
					easing: 'linear',
					complete: function() {
						$('#anoumi-site-preloader').detach();
						$(window).trigger('anoumiLoaded');
					}
				});
			} else {
				$(window).trigger('anoumiLoaded');
			}
		},
	};
	an.init();
	return an;
}( window.jQuery );
