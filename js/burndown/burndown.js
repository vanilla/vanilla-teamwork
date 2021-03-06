
/**
 * Teamwork / Burndown Javascript
 *
 * This javascript runs on the burndown overview page and is responsible for
 * gathering and making available information about the burndown's tasks and
 * rendering graphs for that data.
 */

var burndown = {
    week: null,
    type: null,
    analytics: [],

    start: function(method) {

        burndown.week = $('.js-burndown.is-burndown').first().data('burndownid');

        // Active
        active.start('burndown', '/burndown/burndowndata.json/' + burndown.week, 120, true);

        // Charts
        jQuery('.js-burndown.is-burndown .is-chart').each(function(i, element) {
            var widget = jQuery(element);
            var chartwidget = jQuery(element).find('.chart-widget').first();

            var chartoptions = {};
            chartoptions.tag = widget.data('tag') || false;
            chartoptions.url = gdn.url(widget.data('url'));
            chartoptions.autounload = true;
            chartoptions.refresh = widget.data('refresh') || false;
            if (chartoptions.refresh) {
                chartoptions.interval = parseInt(widget.data('interval')) || 30;
            }
            chartoptions.template = burndown.loadBurndownTemplate;

            // Initialize chart
            var burndownanalytics = new analytics();
            burndownanalytics.init(chartwidget, chartoptions);

            burndown.analytics.push(burndownanalytics);
        });

        // Force refresh
        active.refresh();

    },

    /**
     * Load a template for this gridwidth
     *
     * @param {String} tag
     * @param {Integer} gridWidth
     * @returns {Boolean}
     */
    loadBurndownTemplate: function(tag, gridWidth) {
        var analyticsTplName = null;
        var tweaks = {};
        switch (tag) {
            case 'burndown':
                analyticsTplName = "teamwork/burndown";
                break;
        }

        var realTplName = analyticsTplName + '/' + gridWidth;

        // Have we already loaded a compatible template?
        if (graphing.haveTemplate(realTplName)) {
            return realTplName;
        }

        // Load new TPL based on base TPL name
        var alterations = burndown.templates[analyticsTplName];
        jQuery.extend(true, alterations, tweaks);
        graphing.loadTemplate(realTplName, burndown.templates[analyticsTplName].base, alterations);

        return realTplName;
    },

    // C3JS templates
    templates: {

        // Burndown
        "teamwork/burndown": {
            base: false,
            point: {
                show: false
            },
            padding: {
              left: 20,
              top: -6,
              right: 0
            }      ,
            data: {
                x: 'x',
                columns: [],
                type: 'area',
                colors: {
                    burndownSeries: '#67b6ff',
                    todaySeries: '#ff9c3b'
                },
                color: function(color, dataSerie) {
                    var definedSeries = ['burndownSeries', 'todaySeries'];
                    if (definedSeries.indexOf(dataSerie.id) === -1) {
                        // All other series will get this default color
                        return '#88ee88';
                    }

                    // 'burndownSeries', 'todaySeries' and already defined in "data.colors"
                    return color;
                },
                types: {
                    burndownSeries: 'line',
                    todaySeries: 'line'
                }
            },
            legend: {
                show: false
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: true
                }
            },
            tooltip: {
                contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                    // NOTE: The context "this" refers to "c3.chart.internal"

                    if (!d.length) {
                        return null;
                    }
                    var index = d[0].x;

                    var data = this.getExtra('data');
                    var eventKey = data.events.keys[index];
                    if (!data.events.series.hasOwnProperty(eventKey)) {
                        jQuery('.scope-tooltips').html('');
                        return null;
                    }

                    var events = data.events.series[eventKey];
                    var eventDate = events.date;
                    var eventList = '';

                    var totalHours = 0;
                    jQuery.each(events.events, function(projectid, project){
                        var hours = Math.round(project.minutes / 60,1);
                        totalHours += hours;
                        var hoursText = (hours === 1) ? 'hour' : 'hours';
                        eventList += "<div class=\"event\">\n\
        <span class=\"project-name\">"+project.project+"</span> (<span class=\"project-info\"><span class=\"project-hours\">"+hours+" "+hoursText+"</span></span>)\
    </div>";
                    });

                    var totalHoursText = totalHours === 1 ? 'hour' : 'hours';
                    var tooltiptext = "<div class=\"chart-tooltip scope-events\">\n\
        <div class=\"tooltip-title\">scope increases</div>\n\
        <div class=\"date\">" + eventDate + "</div>\n\
        <div class=\"events\">\
            {events}\
        </div>\
        <div class=\"scope-summary\">\
            Total: <span class=\"summary-hours\">"+totalHours+" "+totalHoursText+"</span>\
        </div>\
    </div>";

                    jQuery('.scope-tooltips').html(tooltiptext.replace('{events}', eventList));

                    return null;
                }
            },
            axis: {
                x: {
                    padding: {
                        left: 0,
                        right: 0
                    },
                    tick: {
                        outer: false, // Removes the outer ticks at the beginning and end of the axis
                        format: function(index) {
                            // NOTE: The context "this" refers to "c3.chart.internal"
                            var label = this.getXTickLabel(index);
                            return label ? label : index;
                        }
                    }
                },
                y: {
                    padding: {
                        bottom: 0
                    },
                    min: 0,
                    inner: true,
                    tick: {
                        outer: false,
                        count: 7,
                        format: function(x) {
                            // Do not show the first tick at 0 since
                            // we display the tick values lower a bit
                            if (x === 0) {
                                return '';
                            }
                            return String(Math.ceil(x)).addCommas();
                        }
                    }
                }
            }
        }
    }
};
