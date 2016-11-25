/**
 * Copyright (c) 2016 hustcc
 * License: MIT
 * Version: v2.0.2
 * https://github.com/hustcc/timeago.js
**/
/* jshint expr: true */
function factory() {
  var cnt = 0, // the timer counter, for timer key
//> cnt: undefined; 1/1
//> indexMapEn: undefined; 1/1
    indexMapEn = 'second_minute_hour_day_week_month_year'.split('_'),
//> 'second_minute_hour_day_week_month_year'.split: (separator: RegExp, limit?: number) => Array<, string>; 1/1
    indexMapZh = '秒_分钟_小时_天_周_月_年'.split('_'),
//> indexMapZh: undefined; 1/1
//> '秒_分钟_小时_天_周_月_年'.split: (separator: RegExp, limit?: number) => Array<, string>; 1/1
    // build-in locales: en & zh_CN
//> locales: undefined; 1/1
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
//> SEC_ARRAY: undefined; 1/1
    SEC_ARRAY = [60, 60, 24, 7, 365/7/12, 12],
    SEC_ARRAY_LEN = 6,
//> SEC_ARRAY_LEN: undefined; 1/1
    ATTR_DATETIME = 'datetime';
//> ATTR_DATETIME: undefined; 1/1
  
  // format Date / string / timestamp to Date instance.
  function toDate(input) {
    if (input instanceof Date) return input;
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 10/10
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
    if (!isNaN(input)) return new Date(toInt(input));
//> isNaN: (number: number) => boolean; 10/10
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 10/10
//> toInt: toInt~(f: any) => any; 10/10
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
    if (/^\d+$/.test(input)) return new Date(toInt(input, 10));
//> /^\d+$/.test: (string: string) => boolean; 10/10
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 10/10
//> toInt: toInt~(f: any) => any; 10/10
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
    input = (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
//> input: "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 10/10
//> (input || '').trim: () => string; 10/10
//> (input || '').trim().replace: (searchValue: RegExp, replacer: (substring: string, ...args: Array<, any>) => string) => string; 10/10
//> (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
      .replace: any; 10/10
//> (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
      .replace(/-/, '/').replace: any; 10/10
//> (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
      .replace(/-/, '/').replace(/-/, '/')
      .replace: any; 10/10
//> (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
      .replace(/-/, '/').replace(/-/, '/')
      .replace(/T/, ' ').replace: any; 10/10
//> (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
      .replace(/-/, '/').replace(/-/, '/')
      .replace(/T/, ' ').replace(/Z/, ' UTC')
      .replace: any; 10/10
      .replace(/-/, '/').replace(/-/, '/')
      .replace(/T/, ' ').replace(/Z/, ' UTC')
      .replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400
    return new Date(input);
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 10/10
//> input: any; 10/10
  }
  // change f into int, remove Decimal. just for code compression
  function toInt(f) {
    return parseInt(f);
//> parseInt: (s: string, radix?: number) => number; 25/25
//> f: number | "2016-02-28 12:00:00" | "2016-03-01 12:00:00"; 25/25
  }
  // format the diff second to *** time ago, with setting locale
  function formatDiff(diff, locale, defaultLocale) {
    // if locale is not exist, use defaultLocale.
//> locale: "zh_CN" | "hahah" | undefined; 5/5
    // if defaultLocale is not exist, use build-in `en`.
    // be sure of no error when locale is not exist.
    locale = locales[locale] ? locale : (locales[defaultLocale] ? defaultLocale : 'en');
//> locales: any; 5/5
//> locale: "zh_CN" | "hahah" | undefined; 5/5
//> locales[locale]: any; 5/5
//> locale: "zh_CN" | "hahah" | undefined; 5/5
//> locales: any; 5/5
//> defaultLocale: "en" | "pl" | "zh_CN" | undefined; 5/5
//> locales[defaultLocale]: any; 5/5
//> defaultLocale: "en" | "pl" | "zh_CN" | undefined; 5/5
    // if (! locales[locale]) locale = defaultLocale;
    var i = 0,
//> i: undefined; 5/5
      agoin = diff < 0 ? 1 : 0; // timein or timeago
//> agoin: undefined; 5/5
//> diff: number; 5/5
//> diff: number; 5/5
    diff = Math.abs(diff);
//> Math: { "E": number, "LN10": number, "LN2": number, "LOG2E": number, "LOG10E": number, "PI": number, "SQRT1_2": number, "SQRT2": number, "abs": (x: number) => number, "acos": (x: number) => number, "asin": (x: number) => number, "atan": (x: number) => number, "atan2": (y: number, x: number) => number, "ceil": (x: number) => number, "cos": (x: number) => number, "exp": (x: number) => number, "floor": (x: number) => number, "log": (x: number) => number, "max": (...values: Array<, number>) => number, "min": (...values: Array<, number>) => number, "pow": (x: number, y: number) => number, "random": () => number, "round": (x: number) => number, "sin": (x: number) => number, "sqrt": (x: number) => number, "tan": (x: number) => number }; 5/5
//> Math.abs: (x: number) => number; 5/5
//> diff: number; 5/5

    for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY_LEN; i++) {
//> diff: number; 5/5
//> SEC_ARRAY: { "length": number, "toString": () => string, "toLocaleString": () => string, "push": (...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => number, "pop": () => 60 | 24 | 7 | 4.345238095238096 | 12 | undefined, "concat": (...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12 | Array<, 60 | 24 | 7 | 4.345238095238096 | 12>>) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "join": (separator?: string) => string, "reverse": () => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "shift": () => 60 | 24 | 7 | 4.345238095238096 | 12 | undefined, "slice": (start?: number, end?: number) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "sort": (compareFn?: (a: 60 | 24 | 7 | 4.345238095238096 | 12, b: 60 | 24 | 7 | 4.345238095238096 | 12) => number) => any, "splice": (start: number, deleteCount: number, ...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "unshift": (...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => number, "indexOf": (searchElement: 60 | 24 | 7 | 4.345238095238096 | 12, fromIndex?: number) => number, "lastIndexOf": (searchElement: 60 | 24 | 7 | 4.345238095238096 | 12, fromIndex?: number) => number, "every": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => boolean, thisArg?: any) => boolean, "some": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => boolean, thisArg?: any) => boolean, "forEach": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => void, thisArg?: any) => void, "map": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, thisArg?: any) => Array<, any>, "filter": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, thisArg?: any) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "reduce": (callbackfn: (previousValue: any, currentValue: 60 | 24 | 7 | 4.345238095238096 | 12, currentIndex: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, initialValue: any) => any, "reduceRight": (callbackfn: (previousValue: any, currentValue: 60 | 24 | 7 | 4.345238095238096 | 12, currentIndex: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, initialValue: any) => any, [index: number]: T }; 5/5
//> i: 0; 5/5
//> SEC_ARRAY[i]: T | undefined; 5/5
//> i: 0; 5/5
//> SEC_ARRAY_LEN: 6; 5/5
//> i: 0; 5/5
      diff /= SEC_ARRAY[i];
//> diff: number; 5/5
//> SEC_ARRAY: { "length": number, "toString": () => string, "toLocaleString": () => string, "push": (...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => number, "pop": () => 60 | 24 | 7 | 4.345238095238096 | 12 | undefined, "concat": (...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12 | Array<, 60 | 24 | 7 | 4.345238095238096 | 12>>) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "join": (separator?: string) => string, "reverse": () => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "shift": () => 60 | 24 | 7 | 4.345238095238096 | 12 | undefined, "slice": (start?: number, end?: number) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "sort": (compareFn?: (a: 60 | 24 | 7 | 4.345238095238096 | 12, b: 60 | 24 | 7 | 4.345238095238096 | 12) => number) => any, "splice": (start: number, deleteCount: number, ...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "unshift": (...items: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => number, "indexOf": (searchElement: 60 | 24 | 7 | 4.345238095238096 | 12, fromIndex?: number) => number, "lastIndexOf": (searchElement: 60 | 24 | 7 | 4.345238095238096 | 12, fromIndex?: number) => number, "every": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => boolean, thisArg?: any) => boolean, "some": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => boolean, thisArg?: any) => boolean, "forEach": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => void, thisArg?: any) => void, "map": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, thisArg?: any) => Array<, any>, "filter": (callbackfn: (value: 60 | 24 | 7 | 4.345238095238096 | 12, index: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, thisArg?: any) => Array<, 60 | 24 | 7 | 4.345238095238096 | 12>, "reduce": (callbackfn: (previousValue: any, currentValue: 60 | 24 | 7 | 4.345238095238096 | 12, currentIndex: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, initialValue: any) => any, "reduceRight": (callbackfn: (previousValue: any, currentValue: 60 | 24 | 7 | 4.345238095238096 | 12, currentIndex: number, array: Array<, 60 | 24 | 7 | 4.345238095238096 | 12>) => any, initialValue: any) => any, [index: number]: T }; 5/5
//> i: 0; 5/5
//> SEC_ARRAY[i]: T | undefined; 5/5
    }
    diff = toInt(diff);
//> diff: number; 5/5
//> toInt: toInt~(f: any) => any; 5/5
//> diff: number; 5/5
    i *= 2;
//> i: 1; 5/5

    if (diff > (i === 0 ? 9 : 1)) i += 1;
//> diff: any; 5/5
//> i: 2; 5/5
//> i: 2; 5/5
    return locales[locale](diff, i)[agoin].replace('%s', diff);
//> locales: any; 5/5
//> locale: "zh_CN" | "en" | "pl" | undefined | "hahah"; 5/5
//> locales[locale]: any; 5/5
//> diff: any; 5/5
//> i: number; 5/5
//> agoin: 1 | 0; 5/5
//> locales[locale](diff, i)[agoin]: any; 5/5
//> locales[locale](diff, i)[agoin].replace: any; 5/5
//> diff: any; 5/5
  }
  // calculate the diff second between date to be formated an now date.
  function diffSec(date, nowDate) {
    nowDate = nowDate ? toDate(nowDate) : new Date();
//> nowDate: "2016-03-01 12:00:00"; 5/5
//> nowDate: "2016-03-01 12:00:00"; 5/5
//> toDate: toDate~(input: any) => any; 5/5
//> nowDate: "2016-03-01 12:00:00"; 5/5
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 5/5
    return (nowDate - toDate(date)) / 1000;
//> nowDate: "2016-03-01 12:00:00" | { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 5/5
//> toDate: toDate~(input: any) => any; 5/5
//> date: "2016-02-28 12:00:00"; 5/5
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
//> timers: undefined; 21/21
    // if do not set the defaultLocale, set it with `en`
    if (! defaultLocale) defaultLocale = 'en'; // use default build-in locale
//> defaultLocale: undefined | "pl" | "zh_CN" | null; 21/21
//> defaultLocale: undefined | "pl" | "zh_CN" | null; 21/21
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
//> this: any; 21/21
//> this.format: any; 21/21
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
//> formatDiff: formatDiff~(diff: any, locale: any, defaultLocale: any) => any; 5/5
//> diffSec: diffSec~(date: any, nowDate: any) => any; 5/5
//> date: "2016-02-28 12:00:00"; 5/5
//> nowDate: "2016-03-01 12:00:00"; 5/5
//> locale: "zh_CN" | "hahah" | undefined; 5/5
//> defaultLocale: "en" | "pl" | "zh_CN" | undefined; 5/5
    };
    /**
//> this: { "format": (unnamed)~(date: any, locale: any) => any }; 21/21
//> this.render: any; 21/21
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
//> this: { "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 21/21
//> this.cancel: any; 21/21
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
//> this: { "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 21/21
//> this.setLocale: any; 21/21
     * setLocale: set the default locale name.
     *
     * How to use it?
     * var timeago = require('timeago.js');
     * timeago = new timeago();
     * timeago.setLocale('fr');
    **/
    this.setLocale = function(locale) {
      defaultLocale = locale;
//> defaultLocale: "en" | undefined; 1/1
//> locale: "zh_CN"; 1/1
    };
    return this;
//> this: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 21/21
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
//> Timeago: Timeago~(nowDate: any, defaultLocale: any) => any; 33/33
//> nowDate: "2016-03-01 12:00:00" | "2015-03-01 12:00:00" | { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } | number | "2016-06-23"; 33/33
//> defaultLocale: undefined | "pl" | "zh_CN" | null; 33/33
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
//> timeagoFactory: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
}
var timeago = factory();
//> timeago: undefined; 1/1
//> factory: factory~() => any; 1/1
timeago;
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1

var t = undefined as any;
//> t: undefined; 1/1
//> undefined: any; 1/1

//> t: any; 1/1
//> t.equal: any; 1/1
// test locale, can set the locale
  t.equal(timeago('2016-06-23').format('2016-06-22'), '1 day ago');
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-06-23').format: never; 1/1
  t.equal(timeago('2016-06-23').format('2016-06-25'), 'in 2 days');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-06-23').format: never; 1/1
  t.equal(timeago('2016-06-23').format('2016-06-22', 'zh_CN'), '1天前');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-06-23').format: never; 1/1
  t.equal(timeago('2016-06-23').format('2016-06-25', 'zh_CN'), '2天后');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-06-23').format: never; 1/1

  // test register locale
  const timeagoReg = timeago('2016-06-23');
//> timeagoReg: undefined; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
  timeago.register('test_local', (number, index) => [
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago.register: any; 1/1
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
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeagoReg: never; 1/1
//> timeagoReg.format: never; 1/1

//> t: any; 1/1
//> t.equal: any; 1/1
  // testcase for other points
  // relative now
  t.equal(timeago().format(Date.now() - 11 * 1000 * 60 * 60), '11 hours ago');
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().format: never; 1/1
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 1/1
//> Date.now: () => number; 1/1

  // timestamp is also can work
  let current = Date.now();
//> current: undefined; 1/1
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 1/1
//> Date.now: () => number; 1/1
  t.equal(timeago(current, null).format(current - 8 * 1000 * 60 * 60 * 24), '1 week ago');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> current: number; 1/1
//> timeago(current, null).format: never; 1/1
//> current: number; 1/1
  t.equal(timeago(current, null).format(current - 31536000 * 1000 + 1000), '11 months ago');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> current: number; 1/1
//> timeago(current, null).format: never; 1/1
//> current: number; 1/1

//> current: number; 1/1
  // Date()
  current = new Date();
//> Date: { "prototype": { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }, "parse": (s: string) => number, "UTC": (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => number, "now": () => number } & new () => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate } & () => string & new (vd: VarDate) => { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 1/1
  t.equal(timeago(current, null).format(current), 'just now');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> current: { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 1/1
//> timeago(current, null).format: never; 1/1
//> current: { "toString": () => string, "toDateString": () => string, "toTimeString": () => string, "toLocaleString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleDateString": (locales?: string | Array<, string>, options?: any) => string & () => string, "toLocaleTimeString": (locales?: string | Array<, string>, options?: any) => string & () => string, "valueOf": () => number, "getTime": () => number, "getFullYear": () => number, "getUTCFullYear": () => number, "getMonth": () => number, "getUTCMonth": () => number, "getDate": () => number, "getUTCDate": () => number, "getDay": () => number, "getUTCDay": () => number, "getHours": () => number, "getUTCHours": () => number, "getMinutes": () => number, "getUTCMinutes": () => number, "getSeconds": () => number, "getUTCSeconds": () => number, "getMilliseconds": () => number, "getUTCMilliseconds": () => number, "getTimezoneOffset": () => number, "setTime": (time: number) => number, "setMilliseconds": (ms: number) => number, "setUTCMilliseconds": (ms: number) => number, "setSeconds": (sec: number, ms?: number) => number, "setUTCSeconds": (sec: number, ms?: number) => number, "setMinutes": (min: number, sec?: number, ms?: number) => number, "setUTCMinutes": (min: number, sec?: number, ms?: number) => number, "setHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setUTCHours": (hours: number, min?: number, sec?: number, ms?: number) => number, "setDate": (date: number) => number, "setUTCDate": (date: number) => number, "setMonth": (month: number, date?: number) => number, "setUTCMonth": (month: number, date?: number) => number, "setFullYear": (year: number, month?: number, date?: number) => number, "setUTCFullYear": (year: number, month?: number, date?: number) => number, "toUTCString": () => string, "toISOString": () => string, "toJSON": (key?: any) => string, "getVarDate": () => VarDate }; 1/1

//> t: any; 1/1
//> t.equal: any; 1/1

  // test leap year
  t.equal(timeago('2016-03-01 12:00:00').format('2016-02-28 12:00:00'), '2 days ago');
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-03-01 12:00:00').format: never; 1/1
  t.equal(timeago('2015-03-01 12:00:00').format('2015-02-28 12:00:00'), '1 day ago');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2015-03-01 12:00:00').format: never; 1/1

//> t: any; 1/1
//> t.equal: any; 1/1
  // test default locale
  t.equal(timeago('2016-03-01 12:00:00').format('2016-02-28 12:00:00'), '2 days ago');
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-03-01 12:00:00').format: never; 1/1
  t.equal(timeago('2016-03-01 12:00:00', 'zh_CN').format('2016-02-28 12:00:00'), '2天前');
//> t: any; 1/1
//> t.equal: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago('2016-03-01 12:00:00', 'zh_CN').format: never; 1/1

  // test setLocale
  const newTimeAgo = timeago('2016-03-01 12:00:00');
//> newTimeAgo: undefined; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
  t.equal(newTimeAgo.format('2016-02-28 12:00:00'), '2 days ago');
//> t: any; 1/1
//> t.equal: any; 1/1
//> newTimeAgo: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 1/1
//> newTimeAgo.format: (unnamed)~(date: any, locale: any) => any; 1/1
  newTimeAgo.setLocale('zh_CN');
//> newTimeAgo: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 1/1
//> newTimeAgo.setLocale: (unnamed)~(locale: any) => any; 1/1
  t.equal(newTimeAgo.format('2016-02-28 12:00:00'), '2天前');
//> t: any; 1/1
//> t.equal: any; 1/1
//> newTimeAgo: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 1/1
//> newTimeAgo.format: (unnamed)~(date: any, locale: any) => any; 1/1

  const newTimeAgoDefaultLocale = timeago('2016-03-01 12:00:00', 'pl');
//> newTimeAgoDefaultLocale: undefined; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
  t.equal(newTimeAgoDefaultLocale.format('2016-02-28 12:00:00'), '2 days ago');
//> t: any; 1/1
//> t.equal: any; 1/1
//> newTimeAgoDefaultLocale: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 1/1
//> newTimeAgoDefaultLocale.format: (unnamed)~(date: any, locale: any) => any; 1/1
  t.equal(newTimeAgoDefaultLocale.format('2016-02-28 12:00:00', 'hahah'), '2 days ago');
//> t: any; 1/1
//> t.equal: any; 1/1
//> newTimeAgoDefaultLocale: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 1/1
//> newTimeAgoDefaultLocale.format: (unnamed)~(date: any, locale: any) => any; 1/1
  t.equal(newTimeAgoDefaultLocale.format('2016-02-28 12:00:00', 'zh_CN'), '2天前');
//> t: any; 1/1
//> t.equal: any; 1/1
//> newTimeAgoDefaultLocale: { "setLocale": (unnamed)~(locale: any) => any, "cancel": (unnamed)~() => any, "render": (unnamed)~(nodes: any, locale: any) => any, "format": (unnamed)~(date: any, locale: any) => any }; 1/1
//> newTimeAgoDefaultLocale.format: (unnamed)~(date: any, locale: any) => any; 1/1
  t.end();
//> t: any; 1/1
//> t.end: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(0.134), 1);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  t.true(timeago().nextInterval(8.1), 1);
//> t: any; 1/1
//> t.true: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  t.true(timeago().nextInterval(59.3), 1);
//> t: any; 1/1
//> t.true: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(70.13), 50);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(60 * 3 + 10.01), 50);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  // 10 hours
//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(3600 * 10 + 100.01), 3500);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  // 3 days
//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(60 * 60 * 24 * 3 + 100.01), 3600 * 24 -100);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  // 2 weeks
  t.true(timeago().nextInterval(60 * 60 * 24 * 15 + 100.01),  3600 * 24 * 6 - 100);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  // 10 years
  t.true(timeago().nextInterval(3600 * 24 * 365 * 3 + 100.01), 3600 * 24 * 365 - 100);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  ////////////////////////////////////////

  t.true(timeago().nextInterval(-0.134), 1);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  t.true(timeago().nextInterval(-8.1), 1);
//> t: any; 1/1
//> t.true: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  t.true(timeago().nextInterval(-59.3), 1);
//> t: any; 1/1
//> t.true: any; 1/1
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(-70.13), 50);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(-60 * 3 + 10.01), 50);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  // 10 hours
//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(-3600 * 10 + 100.01), 3500);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  // 3 days
//> t: any; 1/1
//> t.true: any; 1/1
  t.true(timeago().nextInterval(-60 * 60 * 24 * 3 + 100.01), 3600 * 24 -100);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  // 2 weeks
  t.true(timeago().nextInterval(-60 * 60 * 24 * 15 + 100.01),  3600 * 24 * 6 - 100);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1

//> t: any; 1/1
//> t.true: any; 1/1
  // 10 years
  t.true(timeago().nextInterval(-3600 * 24 * 365 * 3 + 100.01), 3600 * 24 * 365 - 100);
//> timeago: timeagoFactory~(nowDate: any, defaultLocale: any) => any; 1/1
//> timeago().nextInterval: any; 1/1
  t.end();
//> t: any; 1/1
//> t.end: any; 1/1