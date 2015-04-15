(function($) {
    "use strict";

    var pluginName = "tinyscrollbar",
        defaults = {
            axis: 'y' // Vertical or horizontal scrollbar? ( x || y ).
                ,
            wheel: true // Enable or disable the mousewheel;
                ,
            wheelSpeed: 40 // How many pixels must the mouswheel scroll at a time.
                ,
            wheelLock: true // Lock default scrolling window when there is no more content.
                ,
            scrollInvert: false // Enable invert style scrolling
                ,
            trackSize: false // Set the size of the scrollbar to auto or a fixed number.
                ,
            thumbSize: false // Set the size of the thumb to auto or a fixed number
                ,
            pointSize: 20 // click to scroll and down size default:20
                ,
            ucallback : null //callback after update
        };

    function Plugin($container, options) {
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        if ($container.find(".scrollbar").length == 0) {
            $container.append('<div class="scrollbar"><div class="scroll_up"></div><div class="track"><div class="thumb"><div class="thumb_end"></div></div></div><div class="scroll_down"></div></div>');
        }
        var self = this,
            $viewport = $container.find(".viewport"),
            $overview = $container.find(".overview"),
            $scrollbar = $container.find(".scrollbar"),
            $track = $scrollbar.find(".track"),
            $thumb = $scrollbar.find(".thumb"),
            $scrollup = $scrollbar.find(".scroll_up"),
            $scrolldown = $scrollbar.find(".scroll_down")

        , mousePosition = 0

        , isHorizontal = this.options.axis === 'x', hasTouchEvents = ("ontouchstart" in document.documentElement), wheelEvent = ("onwheel" in document || document.documentMode >= 9) ? "wheel" :
            (document.onmousewheel !== undefined ? "mousewheel" : "DOMMouseScroll")

        , sizeLabel = isHorizontal ? "width" : "height", posiLabel = isHorizontal ? "left" : "top";

        this.contentPosition = 0;
        this.viewportSize = 0;
        this.contentSize = 0;
        this.contentRatio = 0;
        this.trackSize = 0;
        this.trackRatio = 0;
        this.thumbSize = 0;
        this.thumbPosition = 0;
        this.pointSize = this.options.pointSize

        function initialize() {
            self.update();
            setEvents();

            return self;
        }

        this.update = function(scrollTo) {
            var sizeLabelCap = sizeLabel.charAt(0).toUpperCase() + sizeLabel.slice(1).toLowerCase();
            this.viewportSize = $viewport[0]['offset' + sizeLabelCap];
            this.contentSize = $overview[0]['scroll' + sizeLabelCap];
            this.contentRatio = this.viewportSize / this.contentSize;
            this.trackSize = this.options.trackSize || this.viewportSize;
            this.thumbSize = Math.min(this.trackSize, Math.max(0, (this.options.thumbSize || (this.trackSize * this.contentRatio))));
            this.trackRatio = this.options.thumbSize ? (this.contentSize - this.viewportSize) / (this.trackSize - this.thumbSize) : (this.contentSize / this.trackSize);
            mousePosition = $track.offset().top;

            $scrollbar.toggleClass("disable", this.contentRatio >= 1);
            switch (scrollTo) {
                case "bottom":
                    this.contentPosition = this.contentSize - this.viewportSize > 0 ? (this.contentSize - this.viewportSize) : 0;
                    break;

                case "relative":
                    this.contentPosition = Math.min(Math.max(this.contentSize - this.viewportSize, 0), Math.max(0, this.contentPosition));
                    break;

                default:
                    this.contentPosition = parseInt(scrollTo, 10) || 0;
            }

            setSize();
            if(self.options.ucallback){
                self.options.ucallback();
            }
            return self;
        };
        this.scrollUp = function() {
            var viewTop = $overview.css('top');
            viewTop = parseInt(viewTop.substring(0, viewTop.length - 2));
            var upLeft = Math.abs(viewTop);
            var upNum = upLeft > self.pointSize ? (self.contentPosition - self.pointSize) : 0;
            self.update(upNum);
        }
        this.scrollDown = function() {
            var viewTop = $overview.css('top');
            viewTop = viewTop.substring(0, viewTop.length - 2);
            var downLeft = self.contentSize - self.viewportSize - Math.abs(viewTop);
            var downNum = downLeft > self.pointSize ? (self.contentPosition + self.pointSize) : (self.contentPosition + downLeft);
            self.update(downNum);
        }

        function setSize() {
            $thumb.css(posiLabel, self.contentPosition / self.trackRatio);
            $overview.css(posiLabel, -self.contentPosition);
            $scrollbar.css(sizeLabel, self.trackSize);
            $track.css(sizeLabel, self.trackSize - 24);
            $thumb.css(sizeLabel, self.thumbSize - 24);
        }

        function setEvents() {
            if (hasTouchEvents) {
                $viewport[0].ontouchstart = function(event) {
                    if (1 === event.touches.length) {
                        event.stopPropagation();

                        start(event.touches[0]);
                    }
                };
            } else {
                $thumb.bind("mousedown", start);
                $track.bind("mousedown", drag);
                $scrollup.bind("click", self.scrollUp)
                $scrolldown.bind('click', self.scrollDown);
            }

            $(window).resize(function() {
                self.update("relative");
            });

            if (self.options.wheel && window.addEventListener) {
                $container[0].addEventListener(wheelEvent, wheel, false);
            } else if (self.options.wheel) {
                $container[0].onmousewheel = wheel;
            }
            if(self.options.ucallback){
                self.options.ucallback();
            }
        }

        function start(event) {
            $("body").addClass("noSelect");

            mousePosition = isHorizontal ? event.pageX : event.pageY;
            self.thumbPosition = parseInt($thumb.css(posiLabel), 10) || 0;

            if (hasTouchEvents) {
                document.ontouchmove = function(event) {
                    event.preventDefault();
                    drag(event.touches[0]);
                };
                document.ontouchend = end;
            } else {
                $(document).bind("mousemove", drag);
                $(document).bind("mouseup", end);
                $thumb.bind("mouseup", end);
            }
            if(self.options.ucallback){
                self.options.ucallback();
            }
        }

        function wheel(event) {
            if (self.contentRatio < 1) {
                var evntObj = event || window.event,
                    deltaDir = "delta" + self.options.axis.toUpperCase(),
                    wheelSpeedDelta = -(evntObj[deltaDir] || evntObj.detail || (-1 / 3 * evntObj.wheelDelta)) / 40;

                self.contentPosition -= wheelSpeedDelta * self.options.wheelSpeed;
                self.contentPosition = Math.min((self.contentSize - self.viewportSize), Math.max(0, self.contentPosition));

                $container.trigger("move");

                $thumb.css(posiLabel, self.contentPosition / self.trackRatio);
                $overview.css(posiLabel, -self.contentPosition);

                if (self.options.wheelLock || (self.contentPosition !== (self.contentSize - self.viewportSize) && self.contentPosition !== 0)) {
                    evntObj = $.event.fix(evntObj);
                    evntObj.preventDefault();
                }
                if(self.options.ucallback){
                    self.options.ucallback();
                }
            }
        }

        function drag(event) {
            if (self.contentRatio < 1) {
                var mousePositionNew = isHorizontal ? event.pageX : event.pageY,
                    thumbPositionDelta = mousePositionNew - mousePosition;

                if (self.options.scrollInvert && hasTouchEvents) {
                    thumbPositionDelta = mousePosition - mousePositionNew;
                }

                var thumbPositionNew = Math.min((self.trackSize - self.thumbSize), Math.max(0, self.thumbPosition + thumbPositionDelta));
                self.contentPosition = thumbPositionNew * self.trackRatio;

                $container.trigger("move");

                $thumb.css(posiLabel, thumbPositionNew);
                $overview.css(posiLabel, -self.contentPosition);

                if(self.options.ucallback){
                    self.options.ucallback();
                }
            }
        }

        function end() {
            $("body").removeClass("noSelect");
            $(document).unbind("mousemove", drag);
            $(document).unbind("mouseup", end);
            $thumb.unbind("mouseup", end);
            document.ontouchmove = document.ontouchend = null;
            if(self.options.ucallback){
                self.options.ucallback();
            }
        }

        return initialize();
    }

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin($(this), options));
            }
        });
    };
})(jQuery);