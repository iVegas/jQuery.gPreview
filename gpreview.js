/**
 * Created by voleger on 17.02.16.
 */
(function ($) {
    'use strict';

    $.fn.gPreview = function (options, callback) {

        function sel(obj) {
            var r;
            r = obj.attr('id');
            if (r) {
                r =  '#' + r;
            }
            else {
                r = obj.attr('class').split(' ').join('.');
                r = r ? '.' + r : '';
                r = (obj.attr("tagName") || obj.prop("tagName")) + r;

            }
            return r;
        }

        var defaults = {
                'elementsClass': 'item',
                'currentElementClass': 'gpreview-current',
                'lastElementInARowClass': 'gpreview-last',
                'currentPreviewBlockClass': 'gpreview',
                'processPreviewClass': 'process',
                'previewContent': 'content',
                'navNextClass': 'next',
                'navPrevClass': 'prev'
            },
            wrapperClass = sel(this),
            elementsList = [],
            $lastElementInARow = false,
            $gcurrent,
            $gpreview,
            iterator,
            settings = $.extend({}, defaults, options);


        console.log(wrapperClass);

        function c(classname) {
            return '.' + classname;
        }

        function processCalback(cb) {
            $.when($gpreview.addClass(settings.processPreviewClass)).then(function () {
                if (typeof cb === 'function') {
                    cb($gcurrent, $gpreview.children(c(settings.previewContent)));
                }
                if (typeof cb === 'string') {
                    $gpreview.children(c(settings.previewContent)).html(cb);
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

        function createBlockPreview($lastInARow) {
            var $currentBlock = $(wrapperClass + ' ' + c(settings.currentPreviewBlockClass));
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
            if ($current.hasClass(settings.currentElementClass)) {
                $current.removeClass(settings.currentElementClass);
                hideInMemoryBlock();
                $lastElementInARow = false;
            }
            else {
                var $prev = $(wrapperClass + ' ' + c(settings.currentElementClass));
                $(wrapperClass + ' ' + c(settings.elementsClass)).removeClass(settings.currentElementClass);
                $current.addClass(settings.currentElementClass);
                // get last element i a row to know where we must render a block
                $lastElementInARow = getLastItemInRow($current);
                if ($prev.length) {
                    var curr_center = $current.position().top + ( $current.height() / 2 );
                    var prev_top = $prev.position().top;
                    var prev_bot = prev_top + $prev.height();
                    $lastElementInARow = !(curr_center >= prev_top && curr_center <= prev_bot) ? $lastElementInARow : false;
                }
                else {
                    if (!$gpreview) {
                        $gpreview = createBlockPreview($lastElementInARow);
                    }
                }
            }
            return $lastElementInARow;
        }

        function placeBlock($block, $after) {
            $block.trigger('gpreview_moved_before');
            $block.insertAfter($after);
            $block.trigger('gpreview_moved_after');
        }

        this.run = function (event) {
            // detect current element;
            $gcurrent = $(event.target);
            if ($gcurrent.hasClass(settings.currentPreviewBlockClass) || !$gcurrent.hasClass(settings.elementsClass)) {
                return true;
            }
            $lastElementInARow = positioningBlock($gcurrent);

            if ($lastElementInARow) {
                placeBlock($gpreview, $lastElementInARow);
                processCalback(callback);
                $('html, body').animate({scrollTop: $gcurrent.offset().top}, 200);
            }
        };

        function detectLastItems() {

            if (!elementsList.length) {
                elementsList = $(wrapperClass + ' ' + c(settings.elementsClass) + ':not(' + c(settings.currentPreviewBlockClass) + ')');
                iterator = 0;
                // resize with active block fix.
                hideInMemoryBlock();
            }
            if (!iterator) {
                $(wrapperClass + ' ' + c(settings.elementsClass)).removeClass(settings.lastElementInARowClass);
            }
            var $selector = $(elementsList[iterator]);
            var $lastInARow = $selector.next();
            if (!$lastInARow.length) {
                $selector.addClass(settings.lastElementInARowClass);
                iterator = 0;
                elementsList = [];
                // resize with active block fix.
                $gcurrent = $(wrapperClass + ' ' + c(settings.currentElementClass));
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
            var p = $(wrapperClass + ' ' + c(settings.currentElementClass)).prev();
            if (p) {
                $(p).trigger('click.gpreview');
                return true;
            }
            return false;
        };
        this.next = function () {
            var n = $(wrapperClass + ' ' + c(settings.currentElementClass)).next();
            if (n) {
                if (n.hasClass(settings.currentPreviewBlockClass)) {
                    n = n.next();
                }
                $(n).trigger('click.gpreview');
                return true;
            }
            return false;
        };

        this.on('click.gpreview', this.find(c(settings.elementsClass)), this.run);
        $(document).on('click.gpreview', wrapperClass + ' ' + c(settings.navPrevClass), this.prev);
        $(document).on('click.gpreview', wrapperClass + ' ' + c(settings.navNextClass), this.next);
        $(window).on('resizeend.gpreview', detectLastItems);
        $(window).trigger('resizeend.gpreview');
        return this;
    };

}(jQuery));