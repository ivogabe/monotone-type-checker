/**
 * Copyright (c) 2016 hustcc
 * License: MIT
 * Version: v2.0.2
 * https://github.com/hustcc/timeago.js
**/
/* jshint expr: true */
function factory() {
  var cnt = 0, // the timer counter, for timer key
    indexMapEn = 'second_minute_hour_day_week_month_year'.split('_'),
    indexMapZh = '秒_分钟_小时_天_周_月_年'.split('_'),
    // build-in locales: en & zh_CN
    locales = {
      'en': function(number, index) {
        if (index === 0) return ['just now', 'right now'];
        var unit = indexMapEn[parseInt(index / 2)];
        if (number > 1) unit += 's';
        return [number + ' ' + unit + ' ago', 'in ' + number + ' ' + unit];
      },
      'zh_CN': function(number, index) {
        if (index === 0) return ['刚刚', '片刻后'];
        var unit = indexMapZh[parseInt(index / 2)];
        return [number + unit + '前', number + unit + '后'];
      }
    },
    // second, minute, hour, day, week, month, year(365 days)
    SEC_ARRAY = [60, 60, 24, 7, 365/7/12, 12],
    SEC_ARRAY_LEN = 6,
    ATTR_DATETIME = 'datetime';
  
  // format Date / string / timestamp to Date instance.
  function toDate(input) {
    if (input instanceof Date) return input;
    if (!isNaN(input)) return new Date(toInt(input));
    if (/^\d+$/.test(input)) return new Date(toInt(input, 10));
    input = (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
      .replace(/-/, '/').replace(/-/, '/')
      .replace(/T/, ' ').replace(/Z/, ' UTC')
      .replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400
    return new Date(input);
  }
  // change f into int, remove Decimal. just for code compression
  function toInt(f) {
    return parseInt(f);
  }
  // format the diff second to *** time ago, with setting locale
  function formatDiff(diff, locale, defaultLocale) {
    // if locale is not exist, use defaultLocale.
    // if defaultLocale is not exist, use build-in `en`.
    // be sure of no error when locale is not exist.
    locale = locales[locale] ? locale : (locales[defaultLocale] ? defaultLocale : 'en');
    // if (! locales[locale]) locale = defaultLocale;
    var i = 0;
      agoin = diff < 0 ? 1 : 0; // timein or timeago
    diff = Math.abs(diff);

    for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY_LEN; i++) {
      diff /= SEC_ARRAY[i];
    }
    diff = toInt(diff);
    i *= 2;

    if (diff > (i === 0 ? 9 : 1)) i += 1;
    return locales[locale](diff, i)[agoin].replace('%s', diff);
  }
  // calculate the diff second between date to be formated an now date.
  function diffSec(date, nowDate) {
    nowDate = nowDate ? toDate(nowDate) : new Date();
    return (nowDate - toDate(date)) / 1000;
  }
  /**
   * nextInterval: calculate the next interval time.
   * - diff: the diff sec between now and date to be formated.
   *
   * What's the meaning?
   * diff = 61 then return 59
   * diff = 3601 (an hour + 1 second), then return 3599
   * make the interval with high performace.
  **/
  function nextInterval(diff) {
    var rst = 1, i = 0, d = Math.abs(diff);
    for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY_LEN; i++) {
      diff /= SEC_ARRAY[i];
      rst *= SEC_ARRAY[i];
    }
    // return leftSec(d, rst);
    d = d % rst;
    d = d ? rst - d : rst;
    return Math.ceil(d);
  }
  // get the datetime attribute, jQuery and DOM
  function getDateAttr(node) {
    if (node.getAttribute) return node.getAttribute(ATTR_DATETIME);
    if(node.attr) return node.attr(ATTR_DATETIME);
  }
  /**
   * timeago: the function to get `timeago` instance.
   * - nowDate: the relative date, default is new Date().
   * - defaultLocale: the default locale, default is en. if your set it, then the `locale` parameter of format is not needed of you.
   *
   * How to use it?
   * var timeagoLib = require('timeago.js');
   * var timeago = timeagoLib(); // all use default.
   * var timeago = timeagoLib('2016-09-10'); // the relative date is 2016-09-10, so the 2016-09-11 will be 1 day ago.
   * var timeago = timeagoLib(null, 'zh_CN'); // set default locale is `zh_CN`.
   * var timeago = timeagoLib('2016-09-10', 'zh_CN'); // the relative date is 2016-09-10, and locale is zh_CN, so the 2016-09-11 will be 1天前.
  **/
  function Timeago(nowDate, defaultLocale) {
    var timers = {}; // real-time render timers
    // if do not set the defaultLocale, set it with `en`
    if (! defaultLocale) defaultLocale = 'en'; // use default build-in locale
    // what the timer will do
    function doRender(node, date, locale, cnt) {
      var diff = diffSec(date, nowDate);
      node.innerHTML = formatDiff(diff, locale, defaultLocale);
      // waiting %s seconds, do the next render
      timers['k' + cnt] = setTimeout(function() {
        doRender(node, date, locale, cnt);
      }, nextInterval(diff) * 1000);
    }
    /**
     * nextInterval: calculate the next interval time.
     * - diff: the diff sec between now and date to be formated.
     *
     * What's the meaning?
     * diff = 61 then return 59
     * diff = 3601 (an hour + 1 second), then return 3599
     * make the interval with high performace.
    **/
    // this.nextInterval = function(diff) { // for dev test
    //   var rst = 1, i = 0, d = Math.abs(diff);
    //   for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY_LEN; i++) {
    //     diff /= SEC_ARRAY[i];
    //     rst *= SEC_ARRAY[i];
    //   }
    //   // return leftSec(d, rst);
    //   d = d % rst;
    //   d = d ? rst - d : rst;
    //   return Math.ceil(d);
    // }; // for dev test
    /**
     * format: format the date to *** time ago, with setting or default locale
     * - date: the date / string / timestamp to be formated
     * - locale: the formated string's locale name, e.g. en / zh_CN
     *
     * How to use it?
     * var timeago = require('timeago.js')();
     * timeago.format(new Date(), 'pl'); // Date instance
     * timeago.format('2016-09-10', 'fr'); // formated date string
     * timeago.format(1473473400269); // timestamp with ms
    **/
    this.format = function(date, locale) {
      return formatDiff(diffSec(date, nowDate), locale, defaultLocale);
    };
    /**
     * render: render the DOM real-time.
     * - nodes: which nodes will be rendered.
     * - locale: the locale name used to format date.
     *
     * How to use it?
     * var timeago = new require('timeago.js')();
     * // 1. javascript selector
     * timeago.render(document.querySelectorAll('.need_to_be_rendered'));
     * // 2. use jQuery selector
     * timeago.render($('.need_to_be_rendered'), 'pl');
     *
     * Notice: please be sure the dom has attribute `datetime`.
    **/
    this.render = function(nodes, locale) {
      if (nodes.length === undefined) nodes = [nodes];
      for (var i = 0; i < nodes.length; i++) {
        doRender(nodes[i], getDateAttr(nodes[i]), locale, ++ cnt); // render item
      }
    };
    /**
     * cancel: cancel all the timers which are doing real-time render.
     *
     * How to use it?
     * var timeago = new require('timeago.js')();
     * timeago.render(document.querySelectorAll('.need_to_be_rendered'));
     * timeago.cancel(); // will stop all the timer, stop render in real time.
    **/
    this.cancel = function() {
      for (var key in timers) {
        clearTimeout(timers[key]);
      }
      timers = {};
    };
    /**
     * setLocale: set the default locale name.
     *
     * How to use it?
     * var timeago = require('timeago.js');
     * timeago = new timeago();
     * timeago.setLocale('fr');
    **/
    this.setLocale = function(locale) {
      defaultLocale = locale;
    };
    return this;
  }
  /**
   * timeago: the function to get `timeago` instance.
   * - nowDate: the relative date, default is new Date().
   * - defaultLocale: the default locale, default is en. if your set it, then the `locale` parameter of format is not needed of you.
   *
   * How to use it?
   * var timeagoLib = require('timeago.js');
   * var timeago = timeagoLib(); // all use default.
   * var timeago = timeagoLib('2016-09-10'); // the relative date is 2016-09-10, so the 2016-09-11 will be 1 day ago.
   * var timeago = timeagoLib(null, 'zh_CN'); // set default locale is `zh_CN`.
   * var timeago = timeagoLib('2016-09-10', 'zh_CN'); // the relative date is 2016-09-10, and locale is zh_CN, so the 2016-09-11 will be 1天前.
   **/
  function timeagoFactory(nowDate, defaultLocale) {
    return new Timeago(nowDate, defaultLocale);
  }
  /**
   * register: register a new language locale
   * - locale: locale name, e.g. en / zh_CN, notice the standard.
   * - localeFunc: the locale process function
   *
   * How to use it?
   * var timeagoLib = require('timeago.js');
   *
   * timeagoLib.register('the locale name', the_locale_func);
   * // or
   * timeagoLib.register('pl', require('timeago.js/locales/pl'));
   **/
  /* timeagoFactory.register = function(locale, localeFunc) {
    locales[locale] = localeFunc;
  }; */

  return timeagoFactory;
}
var timeago = factory();
timeago;

var t = undefined as any;

// test locale, can set the locale
  t.equal(timeago('2016-06-23').format('2016-06-22'), '1 day ago');
  t.equal(timeago('2016-06-23').format('2016-06-25'), 'in 2 days');
  t.equal(timeago('2016-06-23').format('2016-06-22', 'zh_CN'), '1天前');
  t.equal(timeago('2016-06-23').format('2016-06-25', 'zh_CN'), '2天后');

  // test register locale
  const timeagoReg = timeago('2016-06-23');
  timeago.register('test_local', (number, index) => [
      ["just xxx", "right now"],
      ["%s seconds xxx", "in %s seconds"],
      ["1 minute xxx", "in 1 minute"],
      ["%s minutes xxx", "in %s minutes"],
      ["1 hour xxx", "in 1 hour"],
      ["%s hours xxx", "in %s hours"],
      ["1 day xxx", "in 1 day"],
      ["%s days xxx", "in %s days"],
      ['一周前', '一周后'],
      ['%s周前', '%s周后'],
      ["1 month xxx", "in 1 month"],
      ["%s months xxx", "in %s months"],
      ["1 year xxx", "in 1 year"],
      ["%s years xxx", "in %s years"]
    ][index]
  );
  t.equal(timeagoReg.format('2016-06-22', 'test_local'), '1 day xxx');

  // testcase for other points
  // relative now
  t.equal(timeago().format(Date.now() - 11 * 1000 * 60 * 60), '11 hours ago');

  // timestamp is also can work
  let current = Date.now();
  t.equal(timeago(current, null).format(current - 8 * 1000 * 60 * 60 * 24), '1 week ago');
  t.equal(timeago(current, null).format(current - 31536000 * 1000 + 1000), '11 months ago');

  // Date()
  current = new Date();
  t.equal(timeago(current, null).format(current), 'just now');


  // test leap year
  t.equal(timeago('2016-03-01 12:00:00').format('2016-02-28 12:00:00'), '2 days ago');
  t.equal(timeago('2015-03-01 12:00:00').format('2015-02-28 12:00:00'), '1 day ago');

  // test default locale
  t.equal(timeago('2016-03-01 12:00:00').format('2016-02-28 12:00:00'), '2 days ago');
  t.equal(timeago('2016-03-01 12:00:00', 'zh_CN').format('2016-02-28 12:00:00'), '2天前');

  // test setLocale
  const newTimeAgo = timeago('2016-03-01 12:00:00');
  t.equal(newTimeAgo.format('2016-02-28 12:00:00'), '2 days ago');
  newTimeAgo.setLocale('zh_CN');
  t.equal(newTimeAgo.format('2016-02-28 12:00:00'), '2天前');

  const newTimeAgoDefaultLocale = timeago('2016-03-01 12:00:00', 'pl');
  t.equal(newTimeAgoDefaultLocale.format('2016-02-28 12:00:00'), '2 days ago');
  t.equal(newTimeAgoDefaultLocale.format('2016-02-28 12:00:00', 'hahah'), '2 days ago');
  t.equal(newTimeAgoDefaultLocale.format('2016-02-28 12:00:00', 'zh_CN'), '2天前');
  t.end();

  t.true(timeago().nextInterval(0.134), 1);
  t.true(timeago().nextInterval(8.1), 1);
  t.true(timeago().nextInterval(59.3), 1);

  t.true(timeago().nextInterval(70.13), 50);

  t.true(timeago().nextInterval(60 * 3 + 10.01), 50);
  // 10 hours
  t.true(timeago().nextInterval(3600 * 10 + 100.01), 3500);
  // 3 days
  t.true(timeago().nextInterval(60 * 60 * 24 * 3 + 100.01), 3600 * 24 -100);

  // 2 weeks
  t.true(timeago().nextInterval(60 * 60 * 24 * 15 + 100.01),  3600 * 24 * 6 - 100);

  // 10 years
  t.true(timeago().nextInterval(3600 * 24 * 365 * 3 + 100.01), 3600 * 24 * 365 - 100);

  ////////////////////////////////////////

  t.true(timeago().nextInterval(-0.134), 1);
  t.true(timeago().nextInterval(-8.1), 1);
  t.true(timeago().nextInterval(-59.3), 1);

  t.true(timeago().nextInterval(-70.13), 50);

  t.true(timeago().nextInterval(-60 * 3 + 10.01), 50);
  // 10 hours
  t.true(timeago().nextInterval(-3600 * 10 + 100.01), 3500);
  // 3 days
  t.true(timeago().nextInterval(-60 * 60 * 24 * 3 + 100.01), 3600 * 24 -100);

  // 2 weeks
  t.true(timeago().nextInterval(-60 * 60 * 24 * 15 + 100.01),  3600 * 24 * 6 - 100);

  // 10 years
  t.true(timeago().nextInterval(-3600 * 24 * 365 * 3 + 100.01), 3600 * 24 * 365 - 100);
  t.end();
  
