/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 *
 * Open source under the BSD License.
 *
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend(jQuery.easing, {
  def: 'easeOutQuad',
  swing: function(x, t, b, c, d) {
    //alert(jQuery.easing.default);
    return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
  },
  easeInQuad: function(x, t, b, c, d) {
    return c * (t /= d) * t + b;
  },
  easeOutQuad: function(x, t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  },
  easeInOutQuad: function(x, t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
  },
  easeInCubic: function(x, t, b, c, d) {
    return c * (t /= d) * t * t + b;
  },
  easeOutCubic: function(x, t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  },
  easeInOutCubic: function(x, t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
  },
  easeInQuart: function(x, t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
  },
  easeOutQuart: function(x, t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  },
  easeInOutQuart: function(x, t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
    return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
  },
  easeInQuint: function(x, t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  },
  easeOutQuint: function(x, t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  },
  easeInOutQuint: function(x, t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  },
  easeInSine: function(x, t, b, c, d) {
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  },
  easeOutSine: function(x, t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  },
  easeInOutSine: function(x, t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  },
  easeInExpo: function(x, t, b, c, d) {
    return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
  },
  easeOutExpo: function(x, t, b, c, d) {
    return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
  },
  easeInOutExpo: function(x, t, b, c, d) {
    if (t == 0) return b;
    if (t == d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
  },
  easeInCirc: function(x, t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
  },
  easeOutCirc: function(x, t, b, c, d) {
    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
  },
  easeInOutCirc: function(x, t, b, c, d) {
    if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
  },
  easeInElastic: function(x, t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t == 0) return b;
    if ((t /= d) == 1) return b + c;
    if (!p) p = d * .3;
    if (a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else var s = p / (2 * Math.PI) * Math.asin(c / a);
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  },
  easeOutElastic: function(x, t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t == 0) return b;
    if ((t /= d) == 1) return b + c;
    if (!p) p = d * .3;
    if (a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else var s = p / (2 * Math.PI) * Math.asin(c / a);
    return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
  },
  easeInOutElastic: function(x, t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t == 0) return b;
    if ((t /= d / 2) == 2) return b + c;
    if (!p) p = d * (.3 * 1.5);
    if (a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else var s = p / (2 * Math.PI) * Math.asin(c / a);
    if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
  },
  easeInBack: function(x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  },
  easeOutBack: function(x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  },
  easeInOutBack: function(x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
  },
  easeInBounce: function(x, t, b, c, d) {
    return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b;
  },
  easeOutBounce: function(x, t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
      return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
      return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
    } else if (t < (2.5 / 2.75)) {
      return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
    } else {
      return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
    }
  },
  easeInOutBounce: function(x, t, b, c, d) {
    if (t < d / 2) return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
    return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
  }
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.11
 *
 * Requires: jQuery 1.2.2+
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS style for Browserify
    module.exports = factory;
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function($) {

  var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
    toBind = ('onwheel' in document || document.documentMode >= 9) ?
    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
    slice = Array.prototype.slice,
    nullLowestDeltaTimeout, lowestDelta;

  if ($.event.fixHooks) {
    for (var i = toFix.length; i;) {
      $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
    }
  }

  var special = $.event.special.mousewheel = {
    version: '3.1.11',

    setup: function() {
      if (this.addEventListener) {
        for (var i = toBind.length; i;) {
          this.addEventListener(toBind[--i], handler, false);
        }
      } else {
        this.onmousewheel = handler;
      }
      // Store the line height and page height for this particular element
      $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
      $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
    },

    teardown: function() {
      if (this.removeEventListener) {
        for (var i = toBind.length; i;) {
          this.removeEventListener(toBind[--i], handler, false);
        }
      } else {
        this.onmousewheel = null;
      }
      // Clean up the data we added to the element
      $.removeData(this, 'mousewheel-line-height');
      $.removeData(this, 'mousewheel-page-height');
    },

    getLineHeight: function(elem) {
      var $parent = $(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
      if (!$parent.length) {
        $parent = $('body');
      }
      return parseInt($parent.css('fontSize'), 10);
    },

    getPageHeight: function(elem) {
      return $(elem).height();
    },

    settings: {
      adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
      normalizeOffset: true // calls getBoundingClientRect for each event
    }
  };

  $.fn.extend({
    mousewheel: function(fn) {
      return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
    },

    unmousewheel: function(fn) {
      return this.unbind('mousewheel', fn);
    }
  });


  function handler(event) {
    var orgEvent = event || window.event,
      args = slice.call(arguments, 1),
      delta = 0,
      deltaX = 0,
      deltaY = 0,
      absDelta = 0,
      offsetX = 0,
      offsetY = 0;
    event = $.event.fix(orgEvent);
    event.type = 'mousewheel';

    // Old school scrollwheel delta
    if ('detail' in orgEvent) {
      deltaY = orgEvent.detail * -1;
    }
    if ('wheelDelta' in orgEvent) {
      deltaY = orgEvent.wheelDelta;
    }
    if ('wheelDeltaY' in orgEvent) {
      deltaY = orgEvent.wheelDeltaY;
    }
    if ('wheelDeltaX' in orgEvent) {
      deltaX = orgEvent.wheelDeltaX * -1;
    }

    // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
    if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
      deltaX = deltaY * -1;
      deltaY = 0;
    }

    // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
    delta = deltaY === 0 ? deltaX : deltaY;

    // New school wheel delta (wheel event)
    if ('deltaY' in orgEvent) {
      deltaY = orgEvent.deltaY * -1;
      delta = deltaY;
    }
    if ('deltaX' in orgEvent) {
      deltaX = orgEvent.deltaX;
      if (deltaY === 0) {
        delta = deltaX * -1;
      }
    }

    // No change actually happened, no reason to go any further
    if (deltaY === 0 && deltaX === 0) {
      return;
    }

    // Need to convert lines and pages to pixels if we aren't already in pixels
    // There are three delta modes:
    //   * deltaMode 0 is by pixels, nothing to do
    //   * deltaMode 1 is by lines
    //   * deltaMode 2 is by pages
    if (orgEvent.deltaMode === 1) {
      var lineHeight = $.data(this, 'mousewheel-line-height');
      delta *= lineHeight;
      deltaY *= lineHeight;
      deltaX *= lineHeight;
    } else if (orgEvent.deltaMode === 2) {
      var pageHeight = $.data(this, 'mousewheel-page-height');
      delta *= pageHeight;
      deltaY *= pageHeight;
      deltaX *= pageHeight;
    }

    // Store lowest absolute delta to normalize the delta values
    absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

    if (!lowestDelta || absDelta < lowestDelta) {
      lowestDelta = absDelta;

      // Adjust older deltas if necessary
      if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
        lowestDelta /= 40;
      }
    }

    // Adjust older deltas if necessary
    if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
      // Divide all the things by 40!
      delta /= 40;
      deltaX /= 40;
      deltaY /= 40;
    }

    // Get a whole, normalized value for the deltas
    delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
    deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
    deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

    // Normalise offsetX and offsetY properties
    if (special.settings.normalizeOffset && this.getBoundingClientRect) {
      var boundingRect = this.getBoundingClientRect();
      offsetX = event.clientX - boundingRect.left;
      offsetY = event.clientY - boundingRect.top;
    }

    // Add information to the event object
    event.deltaX = deltaX;
    event.deltaY = deltaY;
    event.deltaFactor = lowestDelta;
    event.offsetX = offsetX;
    event.offsetY = offsetY;
    // Go ahead and set deltaMode to 0 since we converted to pixels
    // Although this is a little odd since we overwrite the deltaX/Y
    // properties with normalized deltas.
    event.deltaMode = 0;

    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);

    // Clearout lowestDelta after sometime to better
    // handle multiple device types that give different
    // a different lowestDelta
    // Ex: trackpad = 3 and mouse wheel = 120
    if (nullLowestDeltaTimeout) {
      clearTimeout(nullLowestDeltaTimeout);
    }
    nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

    return ($.event.dispatch || $.event.handle).apply(this, args);
  }

  function nullLowestDelta() {
    lowestDelta = null;
  }

  function shouldAdjustOldDeltas(orgEvent, absDelta) {
    // If this is an older event and the delta is divisable by 120,
    // then we are assuming that the browser is treating this as an
    // older mouse wheel event and that we should divide the deltas
    // by 40 to try and get a more usable deltaFactor.
    // Side note, this actually impacts the reported scroll distance
    // in older browsers and can cause scrolling to be slower than native.
    // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
    return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
  }

}));


(function(e, t, n, r) {
  "use strict";
  var i = [],
    s = [],
    o = [],
    u = 0,
    a = t.location.hash,
    f = false,
    l, c, h = e(t).scrollTop(),
    p = false,
    d = {
      section: "section",
      sectionName: "section-name",
      easing: "easeOutExpo",
      scrollSpeed: 1100,
      offset: 0,
      scrollbars: true,
      axis: "y",
      target: "html,body",
      touchExceptions: "a",
      before: function() {},
      after: function() {}
    };
  e.scrollify = function(r) {
    function a(n) {
      if (s[n]) {
        d.before(n, o);
        if (d.sectionName) {
          t.location.hash = s[n]
        }
        e(d.target).stop().animate({
          scrollTop: i[n]
        }, d.scrollSpeed, d.easing);
        e(d.target).promise().done(function() {
          d.after(n, o)
        })
      }
    }

    function y(n) {
      e(d.section).each(function(n) {
        if (n > 0) {
          i[n] = e(this).offset().top + d.offset
        } else {
          i[n] = e(this).offset().top
        }
        if (d.sectionName && e(this).data(d.sectionName)) {
          s[n] = "#" + e(this).data(d.sectionName).replace(/ /g, "-")
        } else {
          s[n] = "#" + (n + 1)
        }
        o[n] = e(this);
        if (t.location.hash === s[n]) {
          u = n;
          f = true
        }
      });
      if (true === n) {
        a(u)
      }
    }
    var v = {
      handleMousedown: function() {
        p = false
      },
      handleMouseup: function() {
        p = true
      },
      handleScroll: function() {
        if (l) {
          clearTimeout(l)
        }
        l = setTimeout(function() {
          h = e(t).scrollTop();
          if (p === false) {
            return false
          }
          p = false;
          var n = 1,
            r = i.length,
            s = 0,
            o = Math.abs(i[0] - h),
            f;
          for (; n < r; n++) {
            f = Math.abs(i[n] - h);
            if (f < o) {
              o = f;
              s = n
            }
          }
          u = s;
          a(s)
        }, 200)
      },
      wheelHandler: function(e, t) {
        e.preventDefault();
        t = t || -e.originalEvent.detail / 3 || e.originalEvent.wheelDelta / 120;
        if (l) {
          clearTimeout(l)
        }
        l = setTimeout(function() {
          if (t < 0) {
            if (u < i.length - 1) {
              u++
            }
          } else if (t > 0) {
            if (u > 0) {
              u--
            }
          }
          if (u >= 0) {
            a(u)
          } else {
            u = 0
          }
        }, 25)
      },
      keyHandler: function(e) {
        e.preventDefault();
        if (e.keyCode == 38) {
          if (u > 0) {
            u--
          }
          a(u)
        } else if (e.keyCode == 40) {
          if (u < i.length - 1) {
            u++
          }
          a(u)
        }
      },
      init: function() {
        if (d.scrollbars) {
          e(t).bind("mousedown", v.handleMousedown);
          e(t).bind("mouseup", v.handleMouseup);
          e(t).bind("scroll", v.handleScroll)
        } else {
          e("body").css({
            overflow: "hidden"
          })
        }
        e(n).bind("DOMMouseScroll mousewheel", v.wheelHandler);
        e(n).bind("keyup", v.keyHandler)
      }
    };
    var m = {
      touches: {
        touchstart: {
          y: -1
        },
        touchmove: {
          y: -1
        },
        touchend: false,
        direction: "undetermined"
      },
      options: {
        distance: 30,
        timeGap: 800,
        timeStamp: (new Date).getTime()
      },
      touchHandler: function(t) {
        var n;
        if (typeof t !== "undefined") {
          if (typeof t.touches !== "undefined") {
            n = t.touches[0];
            switch (t.type) {
              case "touchstart":
                //排除的元素
                m.options.timeStamp = (new Date).getTime();
                m.touches.touchmove.y = n.pageY;
                m.touches.touchend = false;
                // if (!(e(t.target).parents(d.touchExceptions).length < 1 && e(t.target).is(d.touchExceptions) === false)) {
                //   break;
                // }
                // break;
              case "touchmove":
                if (e(t.target).parents(d.touchExceptions).length < 1 && e(t.target).is(d.touchExceptions) === false) {
                  t.preventDefault()
                }
                m.touches[t.type].y = n.pageY;
                if (m.options.timeStamp + m.options.timeGap < (new Date).getTime() && m.touches.touchend == false) {
                  m.touches.touchend = true;
                  if (m.touches.touchstart.y > -1) {
                    if (Math.abs(m.touches.touchmove.y - m.touches.touchstart.y) > m.options.distance) {
                      if (m.touches.touchstart.y < m.touches.touchmove.y) {
                        if (u > 0) {
                          u--
                        }
                        a(u)
                      } else {
                        if (u < i.length - 1) {
                          u++
                        }
                        a(u)
                      }
                    }
                  }
                }
                break;
              case "touchend":
                if (m.touches[t.type] == false) {
                  m.touches[t.type] = true;
                  if (m.touches.touchstart.y > -1) {
                    if (Math.abs(m.touches.touchmove.y - m.touches.touchstart.y) > m.options.distance) {
                      if (m.touches.touchstart.y < m.touches.touchmove.y) {
                        if (u > 0) {
                          u--
                        }
                        a(u)
                      } else {
                        if (u < i.length - 1) {
                          u++
                        }
                        a(u)
                      }
                    }
                  }
                };
              default:
                break
            }
          }
        }
      },
      init: function() {
        if (n.addEventListener) {
          n.addEventListener("touchstart", m.touchHandler, false);
          n.addEventListener("touchmove", m.touchHandler, false);
          n.addEventListener("touchend", m.touchHandler, false)
        }
      }
    };
    if (typeof r === "string") {
      var g = s.length;
      for (; g >= 0; g--) {
        if (typeof arguments[1] === "string") {
          if (s[g] == arguments[1]) {
            u = g;
            a(g)
          }
        } else {
          if (g === arguments[1]) {
            u = g;
            a(g)
          }
        }
      }
    } else {
      d = e.extend(d, r);
      y(false);
      if (f === false && d.sectionName) {
        t.location.hash = s[0]
      } else {
        a(u)
      }
      v.init();
      m.init()
    }
    e(t).resize(function() {
      clearTimeout(c);
      c = setTimeout(function() {
        y(true)
      }, 50)
    })
  }
})(jQuery, this, document)