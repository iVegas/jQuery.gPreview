(function ($) {
    'use strict';

    $.fn.gPreview = function (options, callback) {
        if (!this.length) {
            return false;
        }

        var defaults = {
                'wrapperClass': 'gpreviewWrapper',
                'elementsClass': 'item',
                'currentElementClass': 'gpreview-current',
                'lastElementInARowClass': 'gpreview-last',
                'currentPreviewBlockClass': 'gpreview',
                'processPreviewClass': 'process',
                'previewContent': 'content',
                'navNextClass': 'next',
                'navPrevClass': 'prev'
            },
            elementsList = [],
            $lastElementInARow = false,
            $gcurrent,
            $gpreview,
            iterator,
            settings = $.extend({}, defaults, options);

        String.prototype.c = function () {
            return '.' + this;
        };

        function processCalback(cb) {
            $.when($gpreview.addClass(settings.processPreviewClass)).then(function () {
                if (typeof cb === 'function') {
                    cb($gcurrent, $gpreview.children(settings.previewContent.c()));
                }
                if (typeof cb === 'string') {
                    $gpreview.children(settings.previewContent.c()).html(cb);
                }
            }).then($gpreview.removeClass(settings.processPreviewClass));

        }

        function hideInMemoryBlock() {
            if ($gpreview) {
                $gpreview.trigger('gpreview_hide_before');
                $gpreview = $gpreview.detach();
                $gpreview.trigger('gpreview_hide_after');
            }
        }

        function placeBlock($block, $after) {
            $block.trigger('gpreview_moved_before');
            $block.insertAfter($after);
            $block.trigger('gpreview_moved_after');
        }

        function createBlockPreview($lastInARow) {
            var $currentBlock = $(settings.wrapperClass.c() + ' ' + settings.currentPreviewBlockClass.c());
            if (!$currentBlock.length) {
                return $lastInARow
                    .clone()
                    .removeClass(settings.currentElementClass).removeClass(settings.lastElementInARowClass)
                    .addClass(settings.currentPreviewBlockClass)
                    .html('')
                    .append($('<a/>', {
                        'class': settings.navPrevClass
                    }))
                    .append($('<div/>', {
                        'class': 'content'
                    }))
                    .append($('<a/>', {
                        'class': settings.navNextClass
                    }))
                    ;
            }
            return $currentBlock;
        }

        function getLastItemInRow($selector) {
            if ($selector.hasClass(settings.lastElementInARowClass)) {
                return $selector;
            }
            var $lastInARow = $selector.next();
            if (!$lastInARow.length) {
                return $selector;
            }
            if ($lastInARow.hasClass(settings.lastElementInARowClass)) {
                return $lastInARow;
            }
            return getLastItemInRow($lastInARow);
        }

        function positioningBlock($current) {
            var _lastElement = false;
            if ($current.hasClass(settings.currentElementClass)) {
                $current.removeClass(settings.currentElementClass);
                hideInMemoryBlock();
            }
            else {
                var $prev = $(settings.wrapperClass.c() + ' ' + settings.currentElementClass.c());
                $(settings.wrapperClass.c() + ' ' + settings.elementsClass.c()).removeClass(settings.currentElementClass);
                $current.addClass(settings.currentElementClass);
                // get last element i a row to know where we must render a block
                _lastElement = getLastItemInRow($current);
                if (!$prev.length && !$gpreview) {
                        $gpreview = createBlockPreview(_lastElement);
                }
            }
            return _lastElement;
        }

        this.run = function (event) {
            // detect current element;
            $gcurrent = $(event.target);
            if ($gcurrent.hasClass(settings.currentPreviewBlockClass) || !$gcurrent.hasClass(settings.elementsClass)) {
                return true;
            }
            var _lastElementInARow = positioningBlock($gcurrent);
            processCalback(callback);
            if (!$lastElementInARow || !$lastElementInARow.is(_lastElementInARow) ) {
                $lastElementInARow = _lastElementInARow;
                placeBlock($gpreview, $lastElementInARow);
                $('html, body').animate({scrollTop: $gcurrent.offset().top}, 200);
            }
        };

        function detectLastItems() {

            if (!elementsList.length) {
                elementsList = $(settings.wrapperClass.c() + ' ' + settings.elementsClass.c() + ':not(' + settings.currentPreviewBlockClass.c() + ')');
                iterator = 0;
                // resize with active block fix.
                hideInMemoryBlock();
            }
            if (!iterator) {
                $(settings.wrapperClass.c() + ' ' + settings.elementsClass.c()).removeClass(settings.lastElementInARowClass);
            }
            var $selector = $(elementsList[iterator]);
            var $lastInARow = $selector.next();
            if (!$lastInARow.length) {
                $selector.addClass(settings.lastElementInARowClass);
                iterator = 0;
                elementsList = [];
                // resize with active block fix.
                $gcurrent = $(settings.wrapperClass.c() + ' ' + settings.currentElementClass.c());
                if ($gcurrent.length) {
                    $gcurrent.removeClass(settings.currentElementClass);
                    $lastElementInARow = positioningBlock($gcurrent);
                    placeBlock($gpreview, $lastElementInARow);
                }
                return true;
            }
            var curr_top = $selector.position().top;
            var half_height = $selector.height() / 2;
            var next_top = $lastInARow.position().top;
            if (!(curr_top + half_height >= next_top && curr_top - half_height < next_top)) {
                $selector.addClass(settings.lastElementInARowClass);
            }
            iterator += 1;
            detectLastItems($lastInARow);
        }

        this.prev = function () {
            var p = $(settings.wrapperClass.c() + ' ' + settings.currentElementClass.c()).prev();
            if (p) {
                $(p).trigger('click.gpreview');
                return true;
            }
            return false;
        };
        this.next = function () {
            var n = $(settings.wrapperClass.c() + ' ' + settings.currentElementClass.c()).next();
            if (n) {
                if (n.hasClass(settings.currentPreviewBlockClass)) {
                    n = n.next();
                }
                $(n).trigger('click.gpreview');
                return true;
            }
            return false;
        };

        this.on('click.gpreview', this.find(settings.elementsClass.c()), this.run);
        $(document).on('click.gpreview', settings.wrapperClass.c() + ' ' + settings.navPrevClass.c(), this.prev);
        $(document).on('click.gpreview', settings.wrapperClass.c() + ' ' + settings.navNextClass.c(), this.next);
        $(window).on('resizeend.gpreview', detectLastItems);
        $(window).trigger('resizeend.gpreview');
        return this;
    };

}(jQuery));

