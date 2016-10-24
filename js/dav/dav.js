/**
 * Polyfill from developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 */
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
/**
 * Polyfill from developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol =
    typeof Symbol === "function" && Symbol.iterator || "@@iterator";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);

    generator._invoke = makeInvokeMethod(
      innerFn, self || null,
      new Context(tryLocsList || [])
    );

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    genFun.__proto__ = GeneratorFunctionPrototype;
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    return new Promise(function(resolve, reject) {
      var generator = wrap(innerFn, outerFn, self, tryLocsList);
      var callNext = step.bind(generator, "next");
      var callThrow = step.bind(generator, "throw");

      function step(method, arg) {
        var record = tryCatch(generator[method], generator, arg);
        if (record.type === "throw") {
          reject(record.arg);
          return;
        }

        var info = record.arg;
        if (info.done) {
          resolve(info.value);
        } else {
          Promise.resolve(info.value).then(callNext, callThrow);
        }
      }

      callNext();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            delete context.sent;
          }

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  function defineGeneratorMethod(method) {
    Gp[method] = function(arg) {
      return this._invoke(method, arg);
    };
  }
  defineGeneratorMethod("next");
  defineGeneratorMethod("throw");
  defineGeneratorMethod("return");

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset();
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function() {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      // Pre-initialize at least 20 temporary variables to enable hidden
      // class optimizations for simple generators.
      for (var tempIndex = 0, tempName;
           hasOwn.call(this, tempName = "t" + tempIndex) || tempIndex < 20;
           ++tempIndex) {
        this[tempName] = null;
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dav = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _calendars = require('./calendars');

var _contacts = require('./contacts');

var _fuzzy_url_equals = require('./fuzzy_url_equals');

var _fuzzy_url_equals2 = _interopRequireDefault(_fuzzy_url_equals);

var _model = require('./model');

var _namespace = require('./namespace');

var ns = _interopRequireWildcard(_namespace);

var _request = require('./request');

var request = _interopRequireWildcard(_request);

var debug = require('./debug')('dav:accounts');

var defaults = {
  accountType: 'caldav',
  loadCollections: true,
  loadObjects: false
};

/**
 * rfc 6764.
 *
 * @param {dav.Account} account to find root url for.
 */
var serviceDiscovery = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account, options) {
  var endpoint, uri, req, xhr, _location;

  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Attempt service discovery.');

        endpoint = _url2['default'].parse(account.server);

        endpoint.protocol = endpoint.protocol || 'http'; // TODO(gareth) https?

        uri = _url2['default'].format({
          protocol: endpoint.protocol,
          host: endpoint.host,
          pathname: !options.useProvidedPath ? '/.well-known/' + options.accountType : endpoint.pathname
        });
        req = request.basic({ method: 'GET' });
        context$1$0.prev = 5;
        context$1$0.next = 8;
        return options.xhr.send(req, uri, { sandbox: options.sandbox });

      case 8:
        xhr = context$1$0.sent;

        if (!(xhr.status >= 300 && xhr.status < 400)) {
          context$1$0.next = 14;
          break;
        }

        _location = xhr.getResponseHeader('Location');

        if (!(typeof _location === 'string' && _location.length)) {
          context$1$0.next = 14;
          break;
        }

        debug('Discovery redirected to ' + _location);
        return context$1$0.abrupt('return', _url2['default'].format({
          protocol: endpoint.protocol,
          host: endpoint.host,
          pathname: _location
        }));

      case 14:
        context$1$0.next = 19;
        break;

      case 16:
        context$1$0.prev = 16;
        context$1$0.t0 = context$1$0['catch'](5);

        debug('Discovery failed... failover to the provided url');

      case 19:
        return context$1$0.abrupt('return', endpoint.href);

      case 20:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this, [[5, 16]]);
}));

/**
 * rfc 5397.
 *
 * @param {dav.Account} account to get principal url for.
 */
var principalUrl = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account, options) {
  var req, res, container;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Fetch principal url from context path ' + account.rootUrl + '.');
        req = request.propfind({
          props: [{ name: 'current-user-principal', namespace: ns.DAV }],
          depth: 0,
          mergeResponses: true
        });
        context$1$0.next = 4;
        return options.xhr.send(req, account.rootUrl, {
          sandbox: options.sandbox
        });

      case 4:
        res = context$1$0.sent;
        container = res.props;

        debug('Received principal: ' + container.currentUserPrincipal);
        return context$1$0.abrupt('return', _url2['default'].resolve(account.rootUrl, container.currentUserPrincipal));

      case 8:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

/**
 * @param {dav.Account} account to get home url for.
 */
var homeUrl = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account, options) {
  var prop, req, responses, response, container, href;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Fetch home url from principal url ' + account.principalUrl + '.');
        prop = undefined;

        if (options.accountType === 'caldav') {
          prop = { name: 'calendar-home-set', namespace: ns.CALDAV };
        } else if (options.accountType === 'carddav') {
          prop = { name: 'addressbook-home-set', namespace: ns.CARDDAV };
        }

        req = request.propfind({ props: [prop] });
        context$1$0.next = 6;
        return options.xhr.send(req, account.principalUrl, {
          sandbox: options.sandbox
        });

      case 6:
        responses = context$1$0.sent;
        response = responses.find(function (response) {
          return (0, _fuzzy_url_equals2['default'])(account.principalUrl, response.href);
        });
        container = response.props;
        href = undefined;

        if (options.accountType === 'caldav') {
          debug('Received home: ' + container.calendarHomeSet);
          href = container.calendarHomeSet;
        } else if (options.accountType === 'carddav') {
          debug('Received home: ' + container.addressbookHomeSet);
          href = container.addressbookHomeSet;
        }

        return context$1$0.abrupt('return', _url2['default'].resolve(account.rootUrl, href));

      case 12:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

/**
 * Options:
 *
 *   (String) accountType - one of 'caldav' or 'carddav'. Defaults to 'caldav'.
 *   (Array.<Object>) filters - list of caldav filters to send with request.
 *   (Boolean) loadCollections - whether or not to load dav collections.
 *   (Boolean) loadObjects - whether or not to load dav objects.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (String) server - some url for server (needn't be base url).
 *   (String) timezone - VTIMEZONE calendar object.
 *   (dav.Transport) xhr - request sender.
 *
 * @return {Promise} a promise that will resolve with a dav.Account object.
 */
exports.createAccount = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(options) {
  var account, key, loadCollections, loadObjects, collections;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        options = Object.assign({}, defaults, options);
        if (typeof options.loadObjects !== 'boolean') {
          options.loadObjects = options.loadCollections;
        }

        account = new _model.Account({
          server: options.server,
          credentials: options.xhr.credentials
        });
        context$1$0.next = 5;
        return serviceDiscovery(account, options);

      case 5:
        account.rootUrl = context$1$0.sent;
        context$1$0.next = 8;
        return principalUrl(account, options);

      case 8:
        account.principalUrl = context$1$0.sent;
        context$1$0.next = 11;
        return homeUrl(account, options);

      case 11:
        account.homeUrl = context$1$0.sent;

        if (options.loadCollections) {
          context$1$0.next = 14;
          break;
        }

        return context$1$0.abrupt('return', account);

      case 14:
        key = undefined, loadCollections = undefined, loadObjects = undefined;

        if (options.accountType === 'caldav') {
          key = 'calendars';
          loadCollections = _calendars.listCalendars;
          loadObjects = _calendars.listCalendarObjects;
        } else if (options.accountType === 'carddav') {
          key = 'addressBooks';
          loadCollections = _contacts.listAddressBooks;
          loadObjects = _contacts.listVCards;
        }

        context$1$0.next = 18;
        return loadCollections(account, options);

      case 18:
        collections = context$1$0.sent;

        account[key] = collections;

        if (options.loadObjects) {
          context$1$0.next = 22;
          break;
        }

        return context$1$0.abrupt('return', account);

      case 22:
        context$1$0.next = 24;
        return collections.map(_co2['default'].wrap(regeneratorRuntime.mark(function callee$1$0(collection) {
          return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
              case 0:
                context$2$0.prev = 0;
                context$2$0.next = 3;
                return loadObjects(collection, options);

              case 3:
                collection.objects = context$2$0.sent;
                context$2$0.next = 9;
                break;

              case 6:
                context$2$0.prev = 6;
                context$2$0.t0 = context$2$0['catch'](0);

                collection.error = context$2$0.t0;

              case 9:
              case 'end':
                return context$2$0.stop();
            }
          }, callee$1$0, this, [[0, 6]]);
        })));

      case 24:

        account[key] = account[key].filter(function (collection) {
          return !collection.error;
        });

        return context$1$0.abrupt('return', account);

      case 26:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

// http redirect.
},{"./calendars":2,"./contacts":5,"./debug":6,"./fuzzy_url_equals":7,"./model":9,"./namespace":10,"./request":12,"co":26,"url":31}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createCalendarObject = createCalendarObject;
exports.updateCalendarObject = updateCalendarObject;
exports.deleteCalendarObject = deleteCalendarObject;
exports.syncCalendar = syncCalendar;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _fuzzy_url_equals = require('./fuzzy_url_equals');

var _fuzzy_url_equals2 = _interopRequireDefault(_fuzzy_url_equals);

var _model = require('./model');

var _namespace = require('./namespace');

var ns = _interopRequireWildcard(_namespace);

var _request = require('./request');

var request = _interopRequireWildcard(_request);

var _webdav = require('./webdav');

var webdav = _interopRequireWildcard(_webdav);

var debug = require('./debug')('dav:calendars');

var ICAL_OBJS = new Set(['VEVENT', 'VTODO', 'VJOURNAL', 'VFREEBUSY', 'VTIMEZONE', 'VALARM']);

/**
 * @param {dav.Account} account to fetch calendars for.
 */
var listCalendars = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account, options) {
  var req, responses, cals;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Fetch calendars from home url ' + account.homeUrl);
        req = request.propfind({
          props: [{ name: 'calendar-description', namespace: ns.CALDAV }, { name: 'calendar-timezone', namespace: ns.CALDAV }, { name: 'displayname', namespace: ns.DAV }, { name: 'getctag', namespace: ns.CALENDAR_SERVER }, { name: 'resourcetype', namespace: ns.DAV }, { name: 'supported-calendar-component-set', namespace: ns.CALDAV }, { name: 'sync-token', namespace: ns.DAV }],
          depth: 1
        });
        context$1$0.next = 4;
        return options.xhr.send(req, account.homeUrl, {
          sandbox: options.sandbox
        });

      case 4:
        responses = context$1$0.sent;

        debug('Found ' + responses.length + ' calendars.');
        cals = responses.filter(function (res) {
          // We only want the calendar if it contains iCalendar objects.
          var components = res.props.supportedCalendarComponentSet || [];
          return components.reduce(function (hasObjs, component) {
            return hasObjs || ICAL_OBJS.has(component);
          }, false);
        }).map(function (res) {
          debug('Found calendar ' + res.props.displayname + ',\n             props: ' + JSON.stringify(res.props));
          return new _model.Calendar({
            data: res,
            account: account,
            description: res.props.calendarDescription,
            timezone: res.props.calendarTimezone,
            url: _url2['default'].resolve(account.rootUrl, res.href),
            ctag: res.props.getctag,
            displayName: res.props.displayname,
            components: res.props.supportedCalendarComponentSet,
            resourcetype: res.props.resourcetype,
            syncToken: res.props.syncToken
          });
        });
        context$1$0.next = 9;
        return cals.map(_co2['default'].wrap(regeneratorRuntime.mark(function callee$1$0(cal) {
          return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
              case 0:
                context$2$0.next = 2;
                return webdav.supportedReportSet(cal, options);

              case 2:
                cal.reports = context$2$0.sent;

              case 3:
              case 'end':
                return context$2$0.stop();
            }
          }, callee$1$0, this);
        })));

      case 9:
        return context$1$0.abrupt('return', cals);

      case 10:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.listCalendars = listCalendars;
/**
 * @param {dav.Calendar} calendar the calendar to put the object on.
 * @return {Promise} promise will resolve when the calendar has been created.
 *
 * Options:
 *
 *   (String) data - rfc 5545 VCALENDAR object.
 *   (String) filename - name for the calendar ics file.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function createCalendarObject(calendar, options) {
  var objectUrl = _url2['default'].resolve(calendar.url, options.filename);
  return webdav.createObject(objectUrl, options.data, options);
}

;

/**
 * @param {dav.CalendarObject} calendarObject updated calendar object.
 * @return {Promise} promise will resolve when the calendar has been updated.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function updateCalendarObject(calendarObject, options) {
  return webdav.updateObject(calendarObject.url, calendarObject.calendarData, calendarObject.etag, options);
}

/**
 * @param {dav.CalendarObject} calendarObject target calendar object.
 * @return {Promise} promise will resolve when the calendar has been deleted.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function deleteCalendarObject(calendarObject, options) {
  return webdav.deleteObject(calendarObject.url, calendarObject.etag, options);
}

/**
 * @param {dav.Calendar} calendar the calendar to fetch objects for.
 *
 * Options:
 *
 *   (Array.<Object>) filters - optional caldav filters.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
var listCalendarObjects = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(calendar, options) {
  var filters, req, responses;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Doing REPORT on calendar ' + calendar.url + ' which belongs to\n         ' + calendar.account.credentials.username);

        filters = options.filters || [{
          type: 'comp-filter',
          attrs: { name: 'VCALENDAR' },
          children: [{
            type: 'comp-filter',
            attrs: { name: 'VEVENT' }
          }]
        }];
        req = request.calendarQuery({
          depth: 1,
          props: [{ name: 'getetag', namespace: ns.DAV }, { name: 'calendar-data', namespace: ns.CALDAV }],
          filters: filters
        });
        context$1$0.next = 5;
        return options.xhr.send(req, calendar.url, {
          sandbox: options.sandbox
        });

      case 5:
        responses = context$1$0.sent;
        return context$1$0.abrupt('return', responses.map(function (res) {
          debug('Found calendar object with url ' + res.href);
          return new _model.CalendarObject({
            data: res,
            calendar: calendar,
            url: _url2['default'].resolve(calendar.account.rootUrl, res.href),
            etag: res.props.getetag,
            calendarData: res.props.calendarData
          });
        }));

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.listCalendarObjects = listCalendarObjects;
/**
 * @param {dav.Calendar} calendar the calendar to fetch updates to.
 * @return {Promise} promise will resolve with updated calendar object.
 *
 * Options:
 *
 *   (Array.<Object>) filters - list of caldav filters to send with request.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (String) syncMethod - either 'basic' or 'webdav'. If unspecified, will
 *       try to do webdav sync and failover to basic sync if rfc 6578 is not
 *       supported by the server.
 *   (String) timezone - VTIMEZONE calendar object.
 *   (dav.Transport) xhr - request sender.
 */

function syncCalendar(calendar, options) {
  options.basicSync = basicSync;
  options.webdavSync = webdavSync;
  return webdav.syncCollection(calendar, options);
}

/**
 * @param {dav.Account} account the account to fetch updates for.
 * @return {Promise} promise will resolve with updated account.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
var syncCaldavAccount = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var cals;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        options.loadObjects = false;
        if (!account.calendars) account.calendars = [];

        context$1$0.next = 4;
        return listCalendars(account, options);

      case 4:
        cals = context$1$0.sent;

        cals.filter(function (cal) {
          // Filter the calendars not previously seen.
          return account.calendars.every(function (prev) {
            return !(0, _fuzzy_url_equals2['default'])(prev.url, cal.url);
          });
        }).forEach(function (cal) {
          // Add them to the account's calendar list.
          account.calendars.push(cal);
        });

        options.loadObjects = true;
        context$1$0.next = 9;
        return account.calendars.map(_co2['default'].wrap(regeneratorRuntime.mark(function callee$1$0(cal, index) {
          return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
              case 0:
                context$2$0.prev = 0;
                context$2$0.next = 3;
                return syncCalendar(cal, options);

              case 3:
                context$2$0.next = 9;
                break;

              case 5:
                context$2$0.prev = 5;
                context$2$0.t0 = context$2$0['catch'](0);

                debug('Sync calendar ' + cal.displayName + ' failed with ' + context$2$0.t0);
                account.calendars.splice(index, 1);

              case 9:
              case 'end':
                return context$2$0.stop();
            }
          }, callee$1$0, this, [[0, 5]]);
        })));

      case 9:
        return context$1$0.abrupt('return', account);

      case 10:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.syncCaldavAccount = syncCaldavAccount;
var basicSync = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(calendar, options) {
  var sync;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return webdav.isCollectionDirty(calendar, options);

      case 2:
        sync = context$1$0.sent;

        if (sync) {
          context$1$0.next = 6;
          break;
        }

        debug('Local ctag matched remote! No need to sync :).');
        return context$1$0.abrupt('return', calendar);

      case 6:

        debug('ctag changed so we need to fetch stuffs.');
        context$1$0.next = 9;
        return listCalendarObjects(calendar, options);

      case 9:
        calendar.objects = context$1$0.sent;
        return context$1$0.abrupt('return', calendar);

      case 11:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

var webdavSync = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(calendar, options) {
  var req, result;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        req = request.syncCollection({
          props: [{ name: 'getetag', namespace: ns.DAV }, { name: 'calendar-data', namespace: ns.CALDAV }],
          syncLevel: 1,
          syncToken: calendar.syncToken
        });
        context$1$0.next = 3;
        return options.xhr.send(req, calendar.url, {
          sandbox: options.sandbox
        });

      case 3:
        result = context$1$0.sent;

        // TODO(gareth): Handle creations and deletions.
        result.responses.forEach(function (response) {
          // Find the calendar object that this response corresponds with.
          var calendarObject = calendar.objects.filter(function (object) {
            return (0, _fuzzy_url_equals2['default'])(object.url, response.href);
          })[0];

          if (!calendarObject) {
            return;
          }

          calendarObject.etag = response.props.getetag;
          calendarObject.calendarData = response.props.calendarData;
        });

        calendar.syncToken = result.syncToken;
        return context$1$0.abrupt('return', calendar);

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));
},{"./debug":6,"./fuzzy_url_equals":7,"./model":9,"./namespace":10,"./request":12,"./webdav":24,"co":26,"url":31}],3:[function(require,module,exports){
/**
 * @fileoverview Camelcase something.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = camelize;

function camelize(str) {
  var delimiter = arguments.length <= 1 || arguments[1] === undefined ? '_' : arguments[1];

  var words = str.split(delimiter);
  return [words[0]].concat(words.slice(1).map(function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  })).join('');
}

module.exports = exports['default'];
},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _accounts = require('./accounts');

var accounts = _interopRequireWildcard(_accounts);

var _calendars = require('./calendars');

var calendars = _interopRequireWildcard(_calendars);

var _contacts = require('./contacts');

var contacts = _interopRequireWildcard(_contacts);

/**
 * @param {dav.Transport} xhr - request sender.
 *
 * Options:
 *
 *   (String) baseUrl - root url to resolve relative request urls with.
 */

var Client = (function () {
  function Client(xhr) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Client);

    this.xhr = xhr;
    Object.assign(this, options);

    // Expose internal modules for unit testing
    this._accounts = accounts;
    this._calendars = calendars;
    this._contacts = contacts;
  }

  /**
   * @param {dav.Request} req - dav request.
   * @param {String} uri - where to send request.
   * @return {Promise} a promise that will be resolved with an xhr request
   *     after its readyState is 4 or the result of applying an optional
   *     request `transformResponse` function to the xhr object after its
   *     readyState is 4.
   *
   * Options:
   *
   *   (Object) sandbox - optional request sandbox.
   */

  _createClass(Client, [{
    key: 'send',
    value: function send(req, uri, options) {
      if (this.baseUrl) {
        var urlObj = _url2['default'].parse(uri);
        uri = _url2['default'].resolve(this.baseUrl, urlObj.path);
      }

      return this.xhr.send(req, uri, options);
    }
  }, {
    key: 'createAccount',
    value: function createAccount() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.xhr = options.xhr || this.xhr;
      return accounts.createAccount(options);
    }
  }, {
    key: 'createCalendarObject',
    value: function createCalendarObject(calendar) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return calendars.createCalendarObject(calendar, options);
    }
  }, {
    key: 'updateCalendarObject',
    value: function updateCalendarObject(calendarObject) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return calendars.updateCalendarObject(calendarObject, options);
    }
  }, {
    key: 'deleteCalendarObject',
    value: function deleteCalendarObject(calendarObject) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return calendars.deleteCalendarObject(calendarObject, options);
    }
  }, {
    key: 'syncCalendar',
    value: function syncCalendar(calendar) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return calendars.syncCalendar(calendar, options);
    }
  }, {
    key: 'syncCaldavAccount',
    value: function syncCaldavAccount(account) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return calendars.syncCaldavAccount(account, options);
    }
  }, {
    key: 'getAddressBook',
    value: function getAddressBook() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.xhr = options.xhr || this.xhr;
      return contacts.getAddressBook(options);
    }
  }, {
    key: 'createAddressBook',
    value: function createAddressBook() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.xhr = options.xhr || this.xhr;
      return contacts.createAddressBook(options);
    }
  }, {
    key: 'deleteAddressBook',
    value: function deleteAddressBook(addressBook) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.deleteAddressBook(addressBook, options);
    }
  }, {
    key: 'renameAddressBook',
    value: function renameAddressBook(addressBook) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.renameAddressBook(addressBook, options);
    }
  }, {
    key: 'createCard',
    value: function createCard(addressBook) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.createCard(addressBook, options);
    }
  }, {
    key: 'updateCard',
    value: function updateCard(card) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.updateCard(card, options);
    }
  }, {
    key: 'deleteCard',
    value: function deleteCard(card) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.deleteCard(card, options);
    }
  }, {
    key: 'syncAddressBook',
    value: function syncAddressBook(addressBook) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.syncAddressBook(addressBook, options);
    }
  }, {
    key: 'syncCarddavAccount',
    value: function syncCarddavAccount(account) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.xhr = options.xhr || this.xhr;
      return contacts.syncCarddavAccount(account, options);
    }
  }]);

  return Client;
})();

exports.Client = Client;
},{"./accounts":1,"./calendars":2,"./contacts":5,"url":31}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getAddressBook = getAddressBook;
exports.createAddressBook = createAddressBook;
exports.deleteAddressBook = deleteAddressBook;
exports.renameAddressBook = renameAddressBook;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;
exports.syncAddressBook = syncAddressBook;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _fuzzy_url_equals = require('./fuzzy_url_equals');

var _fuzzy_url_equals2 = _interopRequireDefault(_fuzzy_url_equals);

var _model = require('./model');

var _namespace = require('./namespace');

var ns = _interopRequireWildcard(_namespace);

var _request = require('./request');

var request = _interopRequireWildcard(_request);

var _webdav = require('./webdav');

var webdav = _interopRequireWildcard(_webdav);

var debug = require('./debug')('dav:contacts');

/**
 * @param {dav.Account} account to fetch address books for.
 */
var listAddressBooks = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account, options) {
  var req, responses, addressBooks;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Fetch address books from home url ' + account.homeUrl);
        req = request.propfind({
          props: [{ name: 'displayname', namespace: ns.DAV }, { name: 'owner', namespace: ns.DAV }, { name: 'getctag', namespace: ns.CALENDAR_SERVER }, { name: 'resourcetype', namespace: ns.DAV }, { name: 'sync-token', namespace: ns.DAV },
          //{ name: 'groups', namespace: ns.OC },
          { name: 'invite', namespace: ns.OC }],
          depth: 1
        });
        context$1$0.next = 4;
        return options.xhr.send(req, account.homeUrl, {
          sandbox: options.sandbox
        });

      case 4:
        responses = context$1$0.sent;
        addressBooks = responses.filter(function (res) {
          return typeof res.props.displayname === 'string';
        }).map(function (res) {
          debug('Found address book named ' + res.props.displayname + ',\n             props: ' + JSON.stringify(res.props));
          return new _model.AddressBook({
            data: res,
            account: account,
            url: _url2['default'].resolve(account.rootUrl, res.href),
            ctag: res.props.getctag,
            displayName: res.props.displayname,
            resourcetype: res.props.resourcetype,
            syncToken: res.props.syncToken
          });
        });
        context$1$0.next = 8;
        return addressBooks.map(_co2['default'].wrap(regeneratorRuntime.mark(function callee$1$0(addressBook) {
          return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
              case 0:
                context$2$0.next = 2;
                return webdav.supportedReportSet(addressBook, options);

              case 2:
                addressBook.reports = context$2$0.sent;

              case 3:
              case 'end':
                return context$2$0.stop();
            }
          }, callee$1$0, this);
        })));

      case 8:
        return context$1$0.abrupt('return', addressBooks);

      case 9:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.listAddressBooks = listAddressBooks;

function getAddressBook(options) {
  var addressBookUrl = _url2['default'].resolve(options.url, options.displayName);
  var req = request.propfind({
    props: [{ name: 'displayname', namespace: ns.DAV }, { name: 'owner', namespace: ns.DAV }, { name: 'getctag', namespace: ns.CALENDAR_SERVER }, { name: 'resourcetype', namespace: ns.DAV }, { name: 'sync-token', namespace: ns.DAV },
    //{ name: 'groups', namespace: ns.OC },
    { name: 'invite', namespace: ns.OC }],
    depth: 1
  });

  return options.xhr.send(req, addressBookUrl);
}

/**
 * @return {Promise} promise will resolve when the addressBook has been created.
 *
 * Options:
 *
 *   (String) url
 *   (String) displayName - name for the address book.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function createAddressBook(options) {
  var collectionUrl = _url2['default'].resolve(options.url, options.displayName);
  options.props = [{ name: 'resourcetype', namespace: ns.DAV, children: [{ name: 'collection', namespace: ns.DAV }, { name: 'addressbook', namespace: ns.CARDDAV }]
  }, { name: 'displayname', value: options.displayName, namespace: ns.DAV }];
  return webdav.createCollection(collectionUrl, options);
}

/**
 * @param {dav.AddressBook} addressBook the address book to be deleted.
 * @return {Promise} promise will resolve when the addressBook has been deleted.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function deleteAddressBook(addressBook, options) {
  return webdav.deleteCollection(addressBook.url, options);
}

/**
 * @param {dav.AddressBook} addressBook the address book to be renamed.
 * @return {Promise} promise will resolve when the addressBook has been renamed.
 *
 * Options:
 *
 *   (String) displayName - new name for the address book.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function renameAddressBook(addressBook, options) {
  options.props = [{ name: 'displayname', value: options.displayName, namespace: ns.DAV }];
  return webdav.updateProperties(addressBook.url, options);
}

/**
 * @param {dav.AddressBook} addressBook the address book to put the object on.
 * @return {Promise} promise will resolve when the card has been created.
 *
 * Options:
 *
 *   (String) data - vcard object.
 *   (String) filename - name for the address book vcf file.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function createCard(addressBook, options) {
  var objectUrl = _url2['default'].resolve(addressBook.url, options.filename);
  return webdav.createObject(objectUrl, options.data, options);
}

/**
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 */
var listVCards = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(addressBook, options) {
  var req, responses;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Doing REPORT on address book ' + addressBook.url + ' which belongs to\n        ' + addressBook.account.credentials.username);

        req = request.addressBookQuery({
          depth: 1,
          props: [{ name: 'getetag', namespace: ns.DAV }, { name: 'address-data', namespace: ns.CARDDAV }]
        });
        context$1$0.next = 4;
        return options.xhr.send(req, addressBook.url, {
          sandbox: options.sandbox
        });

      case 4:
        responses = context$1$0.sent;
        return context$1$0.abrupt('return', responses.map(function (res) {
          debug('Found vcard with url ' + res.href);
          return new _model.VCard({
            data: res,
            addressBook: addressBook,
            url: _url2['default'].resolve(addressBook.account.rootUrl, res.href),
            etag: res.props.getetag,
            addressData: res.props.addressData
          });
        }));

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.listVCards = listVCards;
/**
 * @param {dav.VCard} card updated vcard object.
 * @return {Promise} promise will resolve when the card has been updated.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function updateCard(card, options) {
  return webdav.updateObject(card.url, card.addressData, card.etag, options);
}

/**
 * @param {dav.VCard} card target vcard object.
 * @return {Promise} promise will resolve when the calendar has been deleted.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */

function deleteCard(card, options) {
  return webdav.deleteObject(card.url, card.etag, options);
}

/**
 * @param {dav.Calendar} calendar the calendar to fetch updates to.
 * @return {Promise} promise will resolve with updated calendar object.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (String) syncMethod - either 'basic' or 'webdav'. If unspecified, will
 *       try to do webdav sync and failover to basic sync if rfc 6578 is not
 *       supported by the server.
 *   (dav.Transport) xhr - request sender.
 */

function syncAddressBook(addressBook, options) {
  options.basicSync = basicSync;
  options.webdavSync = webdavSync;
  return webdav.syncCollection(addressBook, options);
}

/**
 * @param {dav.Account} account the account to fetch updates for.
 * @return {Promise} promise will resolve with updated account.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
var syncCarddavAccount = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(account) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var addressBooks;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        options.loadObjects = false;

        if (!account.addressBooks) {
          account.addressBooks = [];
        }

        context$1$0.next = 4;
        return listAddressBooks(account, options);

      case 4:
        addressBooks = context$1$0.sent;

        addressBooks.filter(function (addressBook) {
          // Filter the address books not previously seen.
          return account.addressBooks.every(function (prev) {
            return !(0, _fuzzy_url_equals2['default'])(prev.url, addressBook.url);
          });
        }).forEach(function (addressBook) {
          return account.addressBooks.push(addressBook);
        });

        options.loadObjects = true;
        context$1$0.next = 9;
        return account.addressBooks.map(_co2['default'].wrap(regeneratorRuntime.mark(function callee$1$0(addressBook, index) {
          return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
              case 0:
                context$2$0.prev = 0;
                context$2$0.next = 3;
                return syncAddressBook(addressBook, options);

              case 3:
                context$2$0.next = 9;
                break;

              case 5:
                context$2$0.prev = 5;
                context$2$0.t0 = context$2$0['catch'](0);

                debug('Syncing ' + addressBook.displayName + ' failed with ' + context$2$0.t0);
                account.addressBooks.splice(index, 1);

              case 9:
              case 'end':
                return context$2$0.stop();
            }
          }, callee$1$0, this, [[0, 5]]);
        })));

      case 9:
        return context$1$0.abrupt('return', account);

      case 10:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.syncCarddavAccount = syncCarddavAccount;
var basicSync = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(addressBook, options) {
  var sync;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        sync = webdav.isCollectionDirty(addressBook, options);

        if (sync) {
          context$1$0.next = 4;
          break;
        }

        debug('Local ctag matched remote! No need to sync :).');
        return context$1$0.abrupt('return', addressBook);

      case 4:

        debug('ctag changed so we need to fetch stuffs.');
        context$1$0.next = 7;
        return listVCards(addressBook, options);

      case 7:
        addressBook.objects = context$1$0.sent;
        return context$1$0.abrupt('return', addressBook);

      case 9:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

var webdavSync = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(addressBook, options) {
  var req, result;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        req = request.syncCollection({
          props: [{ name: 'getetag', namespace: ns.DAV }, { name: 'address-data', namespace: ns.CARDDAV }],
          syncLevel: 1,
          syncToken: addressBook.syncToken
        });
        context$1$0.next = 3;
        return options.xhr.send(req, addressBook.url, {
          sandbox: options.sandbox
        });

      case 3:
        result = context$1$0.sent;

        // TODO(gareth): Handle creations and deletions.
        result.responses.forEach(function (response) {
          // Find the vcard that this response corresponds with.
          var vcard = addressBook.objects.filter(function (object) {
            return (0, _fuzzy_url_equals2['default'])(object.url, response.href);
          })[0];

          if (!vcard) return;

          vcard.etag = response.props.getetag;
          vcard.addressData = response.props.addressData;
        });

        addressBook.syncToken = result.syncToken;
        return context$1$0.abrupt('return', addressBook);

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));
},{"./debug":6,"./fuzzy_url_equals":7,"./model":9,"./namespace":10,"./request":12,"./webdav":24,"co":26,"url":31}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = debug;

function debug(topic) {
  return function (message) {
    if (debug.enabled) {
      console.log("[" + topic + "] " + message);
    }
  };
}

module.exports = exports["default"];
},{}],7:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = fuzzyUrlEquals;

function fuzzyUrlEquals(one, other) {
  other = encodeURI(other);
  return fuzzyIncludes(one, other) || fuzzyIncludes(other, one);
}

;

function fuzzyIncludes(one, other) {
  return one.indexOf(other) !== -1 || other.charAt(other.length - 1) === '/' && one.indexOf(other.slice(0, -1)) !== -1;
}
module.exports = exports['default'];
},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopExportWildcard(obj, defaults) { var newObj = defaults({}, obj); delete newObj['default']; return newObj; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var _namespace = require('./namespace');

var ns = _interopRequireWildcard(_namespace);

var _request = require('./request');

var request = _interopRequireWildcard(_request);

var _transport = require('./transport');

var transport = _interopRequireWildcard(_transport);

var _package = require('../package');

Object.defineProperty(exports, 'version', {
  enumerable: true,
  get: function get() {
    return _package.version;
  }
});

var _accounts = require('./accounts');

Object.defineProperty(exports, 'createAccount', {
  enumerable: true,
  get: function get() {
    return _accounts.createAccount;
  }
});

var _calendars = require('./calendars');

_defaults(exports, _interopExportWildcard(_calendars, _defaults));

var _client = require('./client');

Object.defineProperty(exports, 'Client', {
  enumerable: true,
  get: function get() {
    return _client.Client;
  }
});

var _contacts = require('./contacts');

_defaults(exports, _interopExportWildcard(_contacts, _defaults));

var _model = require('./model');

_defaults(exports, _interopExportWildcard(_model, _defaults));

Object.defineProperty(exports, 'Request', {
  enumerable: true,
  get: function get() {
    return _request.Request;
  }
});

var _sandbox = require('./sandbox');

Object.defineProperty(exports, 'Sandbox', {
  enumerable: true,
  get: function get() {
    return _sandbox.Sandbox;
  }
});
Object.defineProperty(exports, 'createSandbox', {
  enumerable: true,
  get: function get() {
    return _sandbox.createSandbox;
  }
});
exports.debug = _debug2['default'];
exports.ns = ns;
exports.request = request;
exports.transport = transport;
},{"../package":35,"./accounts":1,"./calendars":2,"./client":4,"./contacts":5,"./debug":6,"./model":9,"./namespace":10,"./request":12,"./sandbox":13,"./transport":23}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Account = function Account(options) {
  _classCallCheck(this, Account);

  Object.assign(this, {
    server: null,
    credentials: null,
    rootUrl: null,
    principalUrl: null,
    homeUrl: null,
    calendars: null,
    addressBooks: null
  }, options);
}

/**
 * Options:
 *   (String) username - username (perhaps email) for calendar user.
 *   (String) password - plaintext password for calendar user.
 *   (String) clientId - oauth client id.
 *   (String) clientSecret - oauth client secret.
 *   (String) authorizationCode - oauth code.
 *   (String) redirectUrl - oauth redirect url.
 *   (String) tokenUrl - oauth token url.
 *   (String) accessToken - oauth access token.
 *   (String) refreshToken - oauth refresh token.
 *   (Number) expiration - unix time for access token expiration.
 */
;

exports.Account = Account;

var Credentials = function Credentials(options) {
  _classCallCheck(this, Credentials);

  Object.assign(this, {
    username: null,
    password: null,
    clientId: null,
    clientSecret: null,
    authorizationCode: null,
    redirectUrl: null,
    tokenUrl: null,
    accessToken: null,
    refreshToken: null,
    expiration: null
  }, options);
};

exports.Credentials = Credentials;

var DAVCollection = function DAVCollection(options) {
  _classCallCheck(this, DAVCollection);

  Object.assign(this, {
    data: null,
    objects: null,
    account: null,
    ctag: null,
    description: null,
    displayName: null,
    reports: null,
    resourcetype: null,
    syncToken: null,
    url: null
  }, options);
};

exports.DAVCollection = DAVCollection;

var AddressBook = (function (_DAVCollection) {
  _inherits(AddressBook, _DAVCollection);

  function AddressBook(options) {
    _classCallCheck(this, AddressBook);

    _get(Object.getPrototypeOf(AddressBook.prototype), "constructor", this).call(this, options);
  }

  return AddressBook;
})(DAVCollection);

exports.AddressBook = AddressBook;

var Calendar = (function (_DAVCollection2) {
  _inherits(Calendar, _DAVCollection2);

  function Calendar(options) {
    _classCallCheck(this, Calendar);

    _get(Object.getPrototypeOf(Calendar.prototype), "constructor", this).call(this, options);
    Object.assign(this, {
      components: null,
      timezone: null
    }, options);
  }

  return Calendar;
})(DAVCollection);

exports.Calendar = Calendar;

var DAVObject = function DAVObject(options) {
  _classCallCheck(this, DAVObject);

  Object.assign(this, {
    data: null,
    etag: null,
    url: null
  }, options);
};

exports.DAVObject = DAVObject;

var CalendarObject = (function (_DAVObject) {
  _inherits(CalendarObject, _DAVObject);

  function CalendarObject(options) {
    _classCallCheck(this, CalendarObject);

    _get(Object.getPrototypeOf(CalendarObject.prototype), "constructor", this).call(this, options);
    Object.assign(this, {
      calendar: null,
      calendarData: null
    }, options);
  }

  return CalendarObject;
})(DAVObject);

exports.CalendarObject = CalendarObject;

var VCard = (function (_DAVObject2) {
  _inherits(VCard, _DAVObject2);

  function VCard(options) {
    _classCallCheck(this, VCard);

    _get(Object.getPrototypeOf(VCard.prototype), "constructor", this).call(this, options);
    Object.assign(this, {
      addressBook: null,
      addressData: null
    }, options);
  }

  return VCard;
})(DAVObject);

exports.VCard = VCard;
},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var CALENDAR_SERVER = 'http://calendarserver.org/ns/';
exports.CALENDAR_SERVER = CALENDAR_SERVER;
var CALDAV = 'urn:ietf:params:xml:ns:caldav';
exports.CALDAV = CALDAV;
var CARDDAV = 'urn:ietf:params:xml:ns:carddav';
exports.CARDDAV = CARDDAV;
var DAV = 'DAV:';
exports.DAV = DAV;
var OC = 'http://owncloud.org/ns';
exports.OC = OC;
},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.multistatus = multistatus;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _camelize = require('./camelize');

var _camelize2 = _interopRequireDefault(_camelize);

var debug = require('./debug')('dav:parser');

var DOMParser = require('xmldom').DOMParser;

function multistatus(string) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(string, 'text/xml');
  var result = traverse.multistatus(child(doc, 'multistatus'));
  debug('input:\n' + string + '\noutput:\n' + JSON.stringify(result) + '\n');
  return result;
}

var traverse = {
  // { response: [x, y, z] }
  multistatus: function multistatus(node) {
    return complex(node, { response: true });
  },

  // { propstat: [x, y, z] }
  response: function response(node) {
    return complex(node, { propstat: true, href: false });
  },

  // { prop: x }
  propstat: function propstat(node) {
    return complex(node, { prop: false });
  },

  // {
  //   resourcetype: x
  //   supportedCalendarComponentSet: y,
  //   supportedReportSet: z
  // }
  prop: function prop(node) {
    return complex(node, {
      resourcetype: false,
      supportedCalendarComponentSet: false,
      supportedReportSet: false,
      currentUserPrincipal: false,
      groups: false,
      invite: false
    });
  },

  resourcetype: function resourcetype(node) {
    return childNodes(node).map(function (childNode) {
      return childNode.localName;
    });
  },

  groups: function groups(node) {
    return complex(node, { group: true }, 'group');
  },
  group: function group(node) {
    return childNodes(node).map(function (childNode) {
      return childNode.nodeValue;
    });
  },
  invite: function invite(node) {
    return complex(node, { user: true }, 'user');
  },
  user: function user(node) {
    return complex(node, { href: false, access: false });
  },
  access: function access(node) {
    return complex(node, {});
  },
  //access: node => {
  //  return childNodes(node).map(childNode => childNode.localName);
  //},

  // [x, y, z]
  supportedCalendarComponentSet: function supportedCalendarComponentSet(node) {
    return complex(node, { comp: true }, 'comp');
  },

  // [x, y, z]
  supportedReportSet: function supportedReportSet(node) {
    return complex(node, { supportedReport: true }, 'supportedReport');
  },

  comp: function comp(node) {
    return node.getAttribute('name');
  },

  // x
  supportedReport: function supportedReport(node) {
    return complex(node, { report: false }, 'report');
  },

  report: function report(node) {
    return childNodes(node).map(function (childNode) {
      return childNode.localName;
    });
  },

  href: function href(node) {
    return decodeURIComponent(childNodes(node)[0].nodeValue);
  },

  currentUserPrincipal: function currentUserPrincipal(node) {
    return complex(node, { href: false }, 'href');
  }
};

function complex(node, childspec, collapse) {
  var result = {};
  for (var key in childspec) {
    if (childspec[key]) {
      // Create array since we're expecting multiple.
      result[key] = [];
    }
  }

  childNodes(node).forEach(function (childNode) {
    return traverseChild(node, childNode, childspec, result);
  });

  return maybeCollapse(result, childspec, collapse);
}

/**
 * Parse child childNode of node with childspec and write outcome to result.
 */
function traverseChild(node, childNode, childspec, result) {
  if (childNode.nodeType === 3 && /^\s+$/.test(childNode.nodeValue)) {
    // Whitespace... nothing to do.
    return;
  }

  var localName = (0, _camelize2['default'])(childNode.localName, '-');
  if (!(localName in childspec)) {
    debug('Unexpected node of type ' + localName + ' encountered while ' + 'parsing ' + node.localName + ' node!');
    var value = childNode.textContent;
    if (localName in result) {
      if (!Array.isArray(result[camelCase])) {
        // Since we've already encountered this node type and we haven't yet
        // made an array for it, make an array now.
        result[localName] = [result[localName]];
      }

      result[localName].push(value);
      return;
    }

    // First time we're encountering this node.
    result[localName] = value;
    return;
  }

  var traversal = traverse[localName](childNode);
  if (childspec[localName]) {
    // Expect multiple.
    result[localName].push(traversal);
  } else {
    // Expect single.
    result[localName] = traversal;
  }
}

function maybeCollapse(result, childspec, collapse) {
  if (!collapse) {
    return result;
  }

  if (!childspec[collapse]) {
    return result[collapse];
  }

  // Collapse array.
  return result[collapse].reduce(function (a, b) {
    return a.concat(b);
  }, []);
}

function childNodes(node) {
  var result = node.childNodes;
  if (!Array.isArray(result)) {
    result = Array.prototype.slice.call(result);
  }

  return result;
}

function children(node, localName) {
  return childNodes(node).filter(function (childNode) {
    return childNode.localName === localName;
  });
}

function child(node, localName) {
  return children(node, localName)[0];
}
},{"./camelize":3,"./debug":6,"xmldom":32}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.addressBookQuery = addressBookQuery;
exports.basic = basic;
exports.calendarQuery = calendarQuery;
exports.collectionQuery = collectionQuery;
exports.mkcol = mkcol;
exports.proppatch = proppatch;
exports.propfind = propfind;
exports.syncCollection = syncCollection;
exports.mergeProps = mergeProps;
exports.getProps = getProps;
exports.setRequestHeaders = setRequestHeaders;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _parser = require('./parser');

var _template = require('./template');

var template = _interopRequireWildcard(_template);

/**
 * Options:
 *
 *   (String) depth - optional value for Depth header.
 *   (Array.<Object>) props - list of props to request.
 */

function addressBookQuery(options) {
  return collectionQuery(template.addressBookQuery({ props: options.props || [] }), { depth: options.depth });
}

/**
 * Options:
 *
 *   (String) data - put request body.
 *   (String) method - http method.
 *   (String) etag - cached calendar object etag.
 */

function basic(options) {
  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  return new Request({
    method: options.method,
    requestData: options.data,
    transformRequest: transformRequest
  });
}

/**
 * Options:
 *
 *   (String) depth - optional value for Depth header.
 *   (Array.<Object>) filters - list of filters to send with request.
 *   (Array.<Object>) props - list of props to request.
 *   (String) timezone - VTIMEZONE calendar object.
 */

function calendarQuery(options) {
  return collectionQuery(template.calendarQuery({
    props: options.props || [],
    filters: options.filters || [],
    timezone: options.timezone
  }), {
    depth: options.depth
  });
}

function collectionQuery(requestData, options) {
  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  function transformResponse(xhr) {
    return (0, _parser.multistatus)(xhr.responseText).response.map(function (res) {
      return { href: res.href, props: getProps(res.propstat) };
    });
  }

  return new Request({
    method: 'REPORT',
    requestData: requestData,
    transformRequest: transformRequest,
    transformResponse: transformResponse
  });
}

function mkcol(options) {
  var requestData = template.mkcol({ props: options.props });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  return new Request({
    method: 'MKCOL',
    requestData: requestData,
    transformRequest: transformRequest
  });
}

function proppatch(options) {
  var requestData = template.proppatch({ props: options.props });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  return new Request({
    method: 'PROPPATCH',
    requestData: requestData,
    transformRequest: transformRequest
  });
}

/**
 * Options:
 *
 *   (String) depth - optional value for Depth header.
 *   (Array.<Object>) props - list of props to request.
 */

function propfind(options) {
  var requestData = template.propfind({ props: options.props });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  function transformResponse(xhr) {
    var responses = (0, _parser.multistatus)(xhr.responseText).response.map(function (res) {
      return { href: res.href, props: getProps(res.propstat) };
    });

    if (!options.mergeResponses) {
      return responses;
    }

    // Merge the props.
    var merged = mergeProps(responses.map(function (res) {
      return res.props;
    }));
    var hrefs = responses.map(function (res) {
      return res.href;
    });
    return { props: merged, hrefs: hrefs };
  }

  return new Request({
    method: 'PROPFIND',
    requestData: requestData,
    transformRequest: transformRequest,
    transformResponse: transformResponse
  });
}

/**
 * Options:
 *
 *   (String) depth - option value for Depth header.
 *   (Array.<Object>) props - list of props to request.
 *   (Number) syncLevel - indicates scope of the sync report request.
 *   (String) syncToken - synchronization token provided by the server.
 */

function syncCollection(options) {
  var requestData = template.syncCollection({
    props: options.props,
    syncLevel: options.syncLevel,
    syncToken: options.syncToken
  });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  function transformResponse(xhr) {
    var object = (0, _parser.multistatus)(xhr.responseText);
    var responses = object.response.map(function (res) {
      return { href: res.href, props: getProps(res.propstat) };
    });

    return { responses: responses, syncToken: object.syncToken };
  }

  return new Request({
    method: 'REPORT',
    requestData: requestData,
    transformRequest: transformRequest,
    transformResponse: transformResponse
  });
}

var Request = function Request() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  _classCallCheck(this, Request);

  Object.assign(this, {
    method: null,
    requestData: null,
    transformRequest: null,
    transformResponse: null,
    onerror: null
  }, options);
};

exports.Request = Request;

function getProp(propstat) {
  if (/404/g.test(propstat.status)) {
    return null;
  }
  if (/5\d{2}/g.test(propstat.status) || /4\d{2}/g.test(propstat.status)) {
    throw new Error('Bad status on propstat: ' + propstat.status);
  }

  return 'prop' in propstat ? propstat.prop : null;
}

function mergeProps(props) {
  return props.reduce(function (a, b) {
    return Object.assign(a, b);
  }, {});
}

/**
 * Map propstats to props.
 */

function getProps(propstats) {
  return mergeProps(propstats.map(getProp).filter(function (prop) {
    return prop && typeof prop === 'object';
  }));
}

function setRequestHeaders(request, options) {
  request.setRequestHeader('Content-Type', 'application/xml;charset=utf-8');

  if ('depth' in options) {
    request.setRequestHeader('Depth', options.depth);
  }

  if ('etag' in options) {
    request.setRequestHeader('If-Match', options.etag);
  }

  if ('destination' in options) {
    request.setRequestHeader('Destination', options.destination);
  }

  if ('overwrite' in options) {
    request.setRequestHeader('Overwrite', options.overwrite);
  }
}
},{"./parser":11,"./template":17}],13:[function(require,module,exports){
/**
 * @fileoverview Group requests together and then abort as a group.
 *
 * var sandbox = new dav.Sandbox();
 * return Promise.all([
 *   dav.createEvent(event, { sandbox: sandbox }),
 *   dav.deleteEvent(other, { sandbox: sandbox })
 * ])
 * .catch(function() {
 *   // Something went wrong so abort all requests.
 *   sandbox.abort;
 * });
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.createSandbox = createSandbox;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var debug = require('./debug')('dav:sandbox');

var Sandbox = (function () {
  function Sandbox() {
    _classCallCheck(this, Sandbox);

    this.requestList = [];
  }

  _createClass(Sandbox, [{
    key: 'add',
    value: function add(request) {
      debug('Adding request to sandbox.');
      this.requestList.push(request);
    }
  }, {
    key: 'abort',
    value: function abort() {
      debug('Aborting sandboxed requests.');
      this.requestList.forEach(function (request) {
        return request.abort();
      });
    }
  }]);

  return Sandbox;
})();

exports.Sandbox = Sandbox;

function createSandbox() {
  return new Sandbox();
}
},{"./debug":6}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = addressBookQuery;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

function addressBookQuery(object) {
  return '<card:addressbook-query xmlns:card="urn:ietf:params:xml:ns:carddav"\n                          xmlns:d="DAV:">\n    <d:prop>\n      ' + object.props.map(_prop2['default']) + '\n    </d:prop>\n    <!-- According to http://stackoverflow.com/questions/23742568/google-carddav-api-addressbook-multiget-returns-400-bad-request,\n         Google\'s CardDAV server requires a filter element. I don\'t think all addressbook-query calls need a filter in the spec though? -->\n  </card:addressbook-query>';
}

module.exports = exports['default'];
},{"./prop":19}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = calendarQuery;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _filter = require('./filter');

var _filter2 = _interopRequireDefault(_filter);

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

function calendarQuery(object) {
  return '<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav"\n                    xmlns:cs="http://calendarserver.org/ns/"\n                    xmlns:d="DAV:">\n    <d:prop>\n      ' + object.props.map(_prop2['default']) + '\n    </d:prop>\n    <c:filter>\n      ' + object.filters.map(_filter2['default']) + '\n    </c:filter>\n    ' + (object.timezone ? '<c:timezone>' + object.timezone + '</c:timezone>' : '') + '\n  </c:calendar-query>';
}

module.exports = exports['default'];
},{"./filter":16,"./prop":19}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = filter;

function filter(item) {
  if (!item.children || !item.children.length) {
    return '<c:' + item.type + ' ' + formatAttrs(item.attrs) + '/>';
  }

  var children = item.children.map(filter);
  return '<c:' + item.type + ' ' + formatAttrs(item.attrs) + '>\n            ' + children + '\n          </c:' + item.type + '>';
}

function formatAttrs(attrs) {
  if (typeof attrs !== 'object') {
    return '';
  }

  return Object.keys(attrs).map(function (attr) {
    return attr + '="' + attrs[attr] + '"';
  }).join(' ');
}
module.exports = exports['default'];
},{}],17:[function(require,module,exports){
'use strict';

exports.addressBookQuery = require('./address_book_query');
exports.calendarQuery = require('./calendar_query');
exports.propfind = require('./propfind');
exports.syncCollection = require('./sync_collection');
exports.mkcol = require('./mkcol');
exports.proppatch = require('./proppatch');
},{"./address_book_query":14,"./calendar_query":15,"./mkcol":18,"./propfind":20,"./proppatch":21,"./sync_collection":22}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = mkcol;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

function mkcol(object) {
  return '<d:mkcol xmlns:c="urn:ietf:params:xml:ns:caldav"\n              xmlns:card="urn:ietf:params:xml:ns:carddav"\n              xmlns:cs="http://calendarserver.org/ns/"\n              xmlns:d="DAV:">\n    <d:set>\n      <d:prop>\n        ' + object.props.map(_prop2['default']) + '\n      </d:prop>\n    </d:set>\n  </d:mkcol>';
}

module.exports = exports['default'];
},{"./prop":19}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = prop;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _namespace = require('../namespace');

var ns = _interopRequireWildcard(_namespace);

/**
 * @param {Object} filter looks like
 *
 *     {
 *       type: 'comp-filter',
 *       attrs: {
 *         name: 'VCALENDAR'
 *       }
 *     }
 *
 * Or maybe
 *
 *     {
 *       type: 'time-range',
 *       attrs: {
 *         start: '20060104T000000Z',
 *         end: '20060105T000000Z'
 *       }
 *     }
 *
 * You can nest them like so:
 *
 *     {
 *       type: 'comp-filter',
 *       attrs: { name: 'VCALENDAR' },
 *       children: [{
 *         type: 'comp-filter',
 *         attrs: { name: 'VEVENT' },
 *         children: [{
 *           type: 'time-range',
 *           attrs: { start: '20060104T000000Z', end: '20060105T000000Z' }
 *         }]
 *       }]
 *     }
 */

function prop(item) {
  if (!item.children || !item.children.length) {
    if (typeof item.value === "undefined") {
      return '<' + xmlnsPrefix(item.namespace) + ':' + item.name + ' />';
    }
    return '<' + xmlnsPrefix(item.namespace) + ':' + item.name + '>' + item.value + '</' + xmlnsPrefix(item.namespace) + ':' + item.name + '>';
  }

  var children = item.children.map(prop);
  return '<' + xmlnsPrefix(item.namespace) + ':' + item.name + '>\n            ' + children + '\n          </' + xmlnsPrefix(item.namespace) + ':' + item.name + '>';
}

function xmlnsPrefix(namespace) {
  switch (namespace) {
    case ns.DAV:
      return 'd';
    case ns.CALENDAR_SERVER:
      return 'cs';
    case ns.CALDAV:
      return 'c';
    case ns.CARDDAV:
      return 'card';
    case ns.OC:
      return 'oc';
    default:
      throw new Error('Unrecognized xmlns ' + namespace);
  }
}
module.exports = exports['default'];
},{"../namespace":10}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = propfind;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

function propfind(object) {
  return '<d:propfind xmlns:c="urn:ietf:params:xml:ns:caldav"\n              xmlns:card="urn:ietf:params:xml:ns:carddav"\n              xmlns:cs="http://calendarserver.org/ns/"\n              xmlns:oc="http://owncloud.org/ns"\n              xmlns:d="DAV:">\n    <d:prop>\n      ' + object.props.map(_prop2['default']) + '\n    </d:prop>\n  </d:propfind>';
}

module.exports = exports['default'];
},{"./prop":19}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = proppatch;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

function proppatch(object) {
  return '<d:propertyupdate xmlns:c="urn:ietf:params:xml:ns:caldav"\n              xmlns:card="urn:ietf:params:xml:ns:carddav"\n              xmlns:cs="http://calendarserver.org/ns/"\n              xmlns:d="DAV:">\n    <d:set>\n      <d:prop>\n        ' + object.props.map(_prop2['default']) + '\n      </d:prop>\n    </d:set>\n  </d:propertyupdate>';
}

module.exports = exports['default'];
},{"./prop":19}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = syncCollection;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

function syncCollection(object) {
  return '<d:sync-collection xmlns:c="urn:ietf:params:xml:ns:caldav"\n                     xmlns:card="urn:ietf:params:xml:ns:carddav"\n                     xmlns:d="DAV:">\n    <d:sync-level>' + object.syncLevel + '</d:sync-level>\n    <d:sync-token>' + object.syncToken + '</d:sync-token>\n    <d:prop>\n      ' + object.props.map(_prop2['default']) + '\n    </d:prop>\n  </d:sync-collection>';
}

module.exports = exports['default'];
},{"./prop":19}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _xmlhttprequest = require('./xmlhttprequest');

var _xmlhttprequest2 = _interopRequireDefault(_xmlhttprequest);

var Transport = (function () {
  /**
   * @param {dav.Credentials} credentials user authorization.
   */

  function Transport(credentials) {
    _classCallCheck(this, Transport);

    this.credentials = credentials || null;
  }

  /**
   * @param {dav.Request} request object with request info.
   * @return {Promise} a promise that will be resolved with an xhr request after
   *     its readyState is 4 or the result of applying an optional request
   *     `transformResponse` function to the xhr object after its readyState is 4.
   *
   * Options:
   *
   *   (Object) sandbox - optional request sandbox.
   */

  _createClass(Transport, [{
    key: 'send',
    value: function send() {}
  }]);

  return Transport;
})();

exports.Transport = Transport;

var Basic = (function (_Transport) {
  _inherits(Basic, _Transport);

  /**
   * @param {dav.Credentials} credentials user authorization.
   */

  function Basic(credentials) {
    _classCallCheck(this, Basic);

    _get(Object.getPrototypeOf(Basic.prototype), 'constructor', this).call(this, credentials);
  }

  /**
   * @param {dav.Credentials} credentials user authorization.
   */

  _createClass(Basic, [{
    key: 'send',
    value: function send(request, url, options) {
      return (0, _co2['default'])(regeneratorRuntime.mark(function callee$2$0() {
        var sandbox, transformRequest, transformResponse, onerror, xhr, result;
        return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              sandbox = options && options.sandbox;
              transformRequest = request.transformRequest;
              transformResponse = request.transformResponse;
              onerror = request.onerror;
              xhr = new _xmlhttprequest2['default']();

              if (sandbox) sandbox.add(xhr);
              xhr.open(request.method, url, true, /* async */
              this.credentials.username, this.credentials.password);

              if (transformRequest) transformRequest(xhr);

              result = undefined;
              context$3$0.prev = 9;

              xhr.setRequestHeader('requesttoken', oc_requesttoken);
              context$3$0.next = 13;
              return xhr.send(request.requestData);

            case 13:
              result = transformResponse ? transformResponse(xhr) : xhr;
              context$3$0.next = 20;
              break;

            case 16:
              context$3$0.prev = 16;
              context$3$0.t0 = context$3$0['catch'](9);

              if (onerror) onerror(context$3$0.t0);
              throw context$3$0.t0;

            case 20:
              return context$3$0.abrupt('return', result);

            case 21:
            case 'end':
              return context$3$0.stop();
          }
        }, callee$2$0, this, [[9, 16]]);
      }).bind(this));
    }
  }]);

  return Basic;
})(Transport);

exports.Basic = Basic;

var OAuth2 = (function (_Transport2) {
  _inherits(OAuth2, _Transport2);

  function OAuth2(credentials) {
    _classCallCheck(this, OAuth2);

    _get(Object.getPrototypeOf(OAuth2.prototype), 'constructor', this).call(this, credentials);
  }

  /**
   * @return {Promise} promise that will resolve with access token.
   */

  _createClass(OAuth2, [{
    key: 'send',
    value: function send(request, url) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return (0, _co2['default'])(regeneratorRuntime.mark(function callee$2$0() {
        var sandbox, transformRequest, transformResponse, onerror, result, xhr, token;
        return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              sandbox = options.sandbox;
              transformRequest = request.transformRequest;
              transformResponse = request.transformResponse;
              onerror = request.onerror;

              if (!('retry' in options)) options.retry = true;

              result = undefined, xhr = undefined;
              context$3$0.prev = 6;
              context$3$0.next = 9;
              return access(this.credentials, options);

            case 9:
              token = context$3$0.sent;

              xhr = new _xmlhttprequest2['default']();
              if (sandbox) sandbox.add(xhr);
              xhr.open(request.method, url, true /* async */);
              xhr.setRequestHeader('Authorization', 'Bearer ' + token);
              if (transformRequest) transformRequest(xhr);
              xhr.setRequestHeader('requesttoken', oc_requesttoken);
              context$3$0.next = 18;
              return xhr.send(request.requestData);

            case 18:
              result = transformResponse ? transformResponse(xhr) : xhr;
              context$3$0.next = 29;
              break;

            case 21:
              context$3$0.prev = 21;
              context$3$0.t0 = context$3$0['catch'](6);

              if (!(options.retry && xhr.status === 401)) {
                context$3$0.next = 27;
                break;
              }

              // Force expiration.
              this.credentials.expiration = 0;
              // Retry once at most.
              options.retry = false;
              return context$3$0.abrupt('return', this.send(request, url, options));

            case 27:

              if (onerror) onerror(context$3$0.t0);
              throw context$3$0.t0;

            case 29:
              return context$3$0.abrupt('return', result);

            case 30:
            case 'end':
              return context$3$0.stop();
          }
        }, callee$2$0, this, [[6, 21]]);
      }).bind(this));
    }
  }]);

  return OAuth2;
})(Transport);

exports.OAuth2 = OAuth2;
function access(credentials, options) {
  if (!credentials.accessToken) {
    return getAccessToken(credentials, options);
  }

  if (credentials.refreshToken && isExpired(credentials)) {
    return refreshAccessToken(credentials, options);
  }

  return Promise.resolve(credentials.accessToken);
}

function isExpired(credentials) {
  return typeof credentials.expiration === 'number' && Date.now() > credentials.expiration;
}

var getAccessToken = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(credentials, options) {
  var sandbox, xhr, data, now, response;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        sandbox = options.sandbox;
        xhr = new _xmlhttprequest2['default']();

        if (sandbox) sandbox.add(xhr);
        xhr.open('POST', credentials.tokenUrl, true /* async */);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        data = _querystring2['default'].stringify({
          code: credentials.authorizationCode,
          redirect_uri: credentials.redirectUrl,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          grant_type: 'authorization_code'
        });
        now = Date.now();
        context$1$0.next = 9;
        return xhr.send(data);

      case 9:
        response = JSON.parse(xhr.responseText);

        credentials.accessToken = response.access_token;
        credentials.refreshToken = 'refresh_token' in response ? response.refresh_token : null;
        credentials.expiration = 'expires_in' in response ? now + response.expires_in : null;

        return context$1$0.abrupt('return', response.access_token);

      case 14:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

var refreshAccessToken = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(credentials, options) {
  var sandbox, xhr, data, now, response;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        sandbox = options.sandbox;
        xhr = new _xmlhttprequest2['default']();

        if (sandbox) sandbox.add(xhr);
        xhr.open('POST', credentials.tokenUrl, true /* async */);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        data = _querystring2['default'].stringify({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          refresh_token: credentials.refreshToken,
          grant_type: 'refresh_token'
        });
        now = Date.now();
        context$1$0.next = 9;
        return xhr.send(data);

      case 9:
        response = JSON.parse(xhr.responseText);

        credentials.accessToken = response.access_token;
        credentials.expiration = 'expires_in' in response ? now + response.expires_in : null;

        return context$1$0.abrupt('return', response.access_token);

      case 13:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));
},{"./xmlhttprequest":25,"co":26,"querystring":30}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createObject = createObject;
exports.updateObject = updateObject;
exports.deleteObject = deleteObject;
exports.syncCollection = syncCollection;
exports.updateProperties = updateProperties;
exports.createCollection = createCollection;
exports.deleteCollection = deleteCollection;
exports.moveCollection = moveCollection;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _fuzzy_url_equals = require('./fuzzy_url_equals');

var _fuzzy_url_equals2 = _interopRequireDefault(_fuzzy_url_equals);

var _namespace = require('./namespace');

var ns = _interopRequireWildcard(_namespace);

var _request = require('./request');

var request = _interopRequireWildcard(_request);

var debug = require('./debug')('dav:webdav');

/**
 * @param {String} objectUrl url for webdav object.
 * @param {String} objectData webdav object data.
 */

function createObject(objectUrl, objectData, options) {
  var req = request.basic({ method: 'PUT', data: objectData });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

function updateObject(objectUrl, objectData, etag, options) {
  var req = request.basic({ method: 'PUT', data: objectData, etag: etag });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

function deleteObject(objectUrl, etag, options) {
  var req = request.basic({ method: 'DELETE', etag: etag });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

function syncCollection(collection, options) {
  var syncMethod = undefined;
  if ('syncMethod' in options) {
    syncMethod = options.syncMethod;
  } else if (collection.reports && collection.reports.indexOf('syncCollection') !== -1) {
    syncMethod = 'webdav';
  } else {
    syncMethod = 'basic';
  }

  if (syncMethod === 'webdav') {
    debug('rfc 6578 sync.');
    return options.webdavSync(collection, options);
  } else {
    debug('basic sync.');
    return options.basicSync(collection, options);
  }
}

function updateProperties(objectUrl, options) {
  var req = request.proppatch({
    props: options.props
  });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

function createCollection(collectionUrl, options) {
  var req = request.mkcol({
    props: options.props
  });
  return options.xhr.send(req, collectionUrl, { sandbox: options.sandbox });
}

function deleteCollection(collectionUrl, options) {
  var req = request.basic({ method: 'DELETE' });
  return options.xhr.send(req, collectionUrl, { sandbox: options.sandbox });
}

function moveCollection(collectionUrl, options) {
  var req = request.basic({ method: 'MOVE', overwrite: 'F', destination: options.destination, data: objectData });
  return options.xhr.send(req, collectionUrl, { sandbox: options.sandbox });
}

/**
 * @param {dav.DAVCollection} collection to fetch report set for.
 */
var supportedReportSet = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(collection, options) {
  var req, response;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        debug('Checking supported report set for collection at ' + collection.url);
        req = request.propfind({
          props: [{ name: 'supported-report-set', namespace: ns.DAV }],
          depth: 1,
          mergeResponses: true
        });
        context$1$0.next = 4;
        return options.xhr.send(req, collection.url, {
          sandbox: options.sandbox
        });

      case 4:
        response = context$1$0.sent;
        return context$1$0.abrupt('return', response.props.supportedReportSet);

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

exports.supportedReportSet = supportedReportSet;
var isCollectionDirty = _co2['default'].wrap(regeneratorRuntime.mark(function callee$0$0(collection, options) {
  var req, responses, response;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (collection.ctag) {
          context$1$0.next = 3;
          break;
        }

        debug('Missing ctag.');
        return context$1$0.abrupt('return', false);

      case 3:

        debug('Fetch remote getctag prop.');
        req = request.propfind({
          props: [{ name: 'getctag', namespace: ns.CALENDAR_SERVER }],
          depth: 0
        });
        context$1$0.next = 7;
        return options.xhr.send(req, collection.account.homeUrl, {
          sandbox: options.sandbox
        });

      case 7:
        responses = context$1$0.sent;
        response = responses.filter(function (response) {
          // Find the response that corresponds to the parameter collection.
          return (0, _fuzzy_url_equals2['default'])(collection.url, response.href);
        })[0];

        if (response) {
          context$1$0.next = 11;
          break;
        }

        throw new Error('Could not find collection on remote. Was it deleted?');

      case 11:

        debug('Check whether cached ctag matches remote.');
        return context$1$0.abrupt('return', collection.ctag !== response.props.getctag);

      case 13:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));
exports.isCollectionDirty = isCollectionDirty;
},{"./debug":6,"./fuzzy_url_equals":7,"./namespace":10,"./request":12,"co":26}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var debug = require('./debug')('dav:xmlhttprequest');

var Native = undefined;
if (typeof self !== 'undefined' && 'XMLHttpRequest' in self) {
  Native = self.XMLHttpRequest;
} else {
  // Trick browserify into not loading XMLHttpRequest polyfill
  // since it is available in the platform (including web workers)
  Native = require(false || 'xmlhttprequest').XMLHttpRequest;
}

/**
 * @fileoverview Promise wrapper around native xhr api.
 */

var XMLHttpRequest = (function () {
  function XMLHttpRequest(options) {
    var _this = this;

    _classCallCheck(this, XMLHttpRequest);

    this.request = new Native(options);
    this.sandbox = null;

    /* readwrite */
    ['response', 'responseText', 'responseType', 'responseXML', 'timeout', 'upload', 'withCredentials'].forEach(function (attribute) {
      Object.defineProperty(_this, attribute, {
        get: function get() {
          return this.request[attribute];
        },
        set: function set(value) {
          this.request[attribute] = value;
        }
      });
    });

    /* readonly */
    ['status', 'statusText'].forEach(function (attribute) {
      Object.defineProperty(_this, attribute, {
        get: function get() {
          return this.request[attribute];
        }
      });
    });
  }

  _createClass(XMLHttpRequest, [{
    key: 'abort',
    value: function abort() {
      return this._callNative('abort', arguments);
    }
  }, {
    key: 'getAllResponseHeaders',
    value: function getAllResponseHeaders() {
      return this._callNative('getAllResponseHeaders', arguments);
    }
  }, {
    key: 'getResponseHeader',
    value: function getResponseHeader() {
      return this._callNative('getResponseHeader', arguments);
    }
  }, {
    key: 'open',
    value: function open() {
      return this._callNative('open', arguments);
    }
  }, {
    key: 'overrideMimeType',
    value: function overrideMimeType() {
      return this._callNative('overrideMimeType', arguments);
    }
  }, {
    key: 'setRequestHeader',
    value: function setRequestHeader() {
      return this._callNative('setRequestHeader', arguments);
    }
  }, {
    key: 'send',
    value: function send(data) {
      debug('Sending request data: ' + data);
      if (this.sandbox) this.sandbox.add(this);
      var request = this.request;
      request.send(data);
      return new Promise(function (resolve, reject) {
        request.onreadystatechange = function () {
          if (request.readyState !== 4 /* done */) {
              return;
            }

          if (request.status < 200 || request.status >= 400) {
            return reject(new Error('Bad status: ' + request.status));
          }

          return resolve(request.responseText);
        };

        request.ontimeout = function () {
          reject(new Error('Request timed out after ' + request.timeout + ' ms'));
        };
      });
    }
  }, {
    key: '_callNative',
    value: function _callNative(method, args) {
      return this.request[method].apply(this.request, args);
    }
  }]);

  return XMLHttpRequest;
})();

exports['default'] = XMLHttpRequest;
module.exports = exports['default'];
},{"./debug":6}],26:[function(require,module,exports){

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

module.exports = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1)

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}

},{}],27:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],28:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],29:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],30:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":28,"./encode":29}],31:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":27,"querystring":30}],32:[function(require,module,exports){
function DOMParser(options){
	this.options = options ||{locator:{}};
	
}
DOMParser.prototype.parseFromString = function(source,mimeType){	
	var options = this.options;
	var sax =  new XMLReader();
	var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
	var errorHandler = options.errorHandler;
	var locator = options.locator;
	var defaultNSMap = options.xmlns||{};
	var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"}
	if(locator){
		domBuilder.setDocumentLocator(locator)
	}
	
	sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
	sax.domBuilder = options.domBuilder || domBuilder;
	if(/\/x?html?$/.test(mimeType)){
		entityMap.nbsp = '\xa0';
		entityMap.copy = '\xa9';
		defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
	}
	defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';
	if(source){
		sax.parse(source,defaultNSMap,entityMap);
	}else{
		sax.errorHandler.error("invalid document source");
	}
	return domBuilder.document;
}
function buildErrorHandler(errorImpl,domBuilder,locator){
	if(!errorImpl){
		if(domBuilder instanceof DOMHandler){
			return domBuilder;
		}
		errorImpl = domBuilder ;
	}
	var errorHandler = {}
	var isCallback = errorImpl instanceof Function;
	locator = locator||{}
	function build(key){
		var fn = errorImpl[key];
		if(!fn && isCallback){
			fn = errorImpl.length == 2?function(msg){errorImpl(key,msg)}:errorImpl;
		}
		errorHandler[key] = fn && function(msg){
			fn('[xmldom '+key+']\t'+msg+_locator(locator));
		}||function(){};
	}
	build('warning');
	build('error');
	build('fatalError');
	return errorHandler;
}

//console.log('#\n\n\n\n\n\n\n####')
/**
 * +ContentHandler+ErrorHandler
 * +LexicalHandler+EntityResolver2
 * -DeclHandler-DTDHandler 
 * 
 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
 */
function DOMHandler() {
    this.cdata = false;
}
function position(locator,node){
	node.lineNumber = locator.lineNumber;
	node.columnNumber = locator.columnNumber;
}
/**
 * @see org.xml.sax.ContentHandler#startDocument
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
 */ 
DOMHandler.prototype = {
	startDocument : function() {
    	this.document = new DOMImplementation().createDocument(null, null, null);
    	if (this.locator) {
        	this.document.documentURI = this.locator.systemId;
    	}
	},
	startElement:function(namespaceURI, localName, qName, attrs) {
		var doc = this.document;
	    var el = doc.createElementNS(namespaceURI, qName||localName);
	    var len = attrs.length;
	    appendElement(this, el);
	    this.currentElement = el;
	    
		this.locator && position(this.locator,el)
	    for (var i = 0 ; i < len; i++) {
	        var namespaceURI = attrs.getURI(i);
	        var value = attrs.getValue(i);
	        var qName = attrs.getQName(i);
			var attr = doc.createAttributeNS(namespaceURI, qName);
			if( attr.getOffset){
				position(attr.getOffset(1),attr)
			}
			attr.value = attr.nodeValue = value;
			el.setAttributeNode(attr)
	    }
	},
	endElement:function(namespaceURI, localName, qName) {
		var current = this.currentElement
	    var tagName = current.tagName;
	    this.currentElement = current.parentNode;
	},
	startPrefixMapping:function(prefix, uri) {
	},
	endPrefixMapping:function(prefix) {
	},
	processingInstruction:function(target, data) {
	    var ins = this.document.createProcessingInstruction(target, data);
	    this.locator && position(this.locator,ins)
	    appendElement(this, ins);
	},
	ignorableWhitespace:function(ch, start, length) {
	},
	characters:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
		//console.log(chars)
		if(this.currentElement && chars){
			if (this.cdata) {
				var charNode = this.document.createCDATASection(chars);
				this.currentElement.appendChild(charNode);
			} else {
				var charNode = this.document.createTextNode(chars);
				this.currentElement.appendChild(charNode);
			}
			this.locator && position(this.locator,charNode)
		}
	},
	skippedEntity:function(name) {
	},
	endDocument:function() {
		this.document.normalize();
	},
	setDocumentLocator:function (locator) {
	    if(this.locator = locator){// && !('lineNumber' in locator)){
	    	locator.lineNumber = 0;
	    }
	},
	//LexicalHandler
	comment:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
	    var comm = this.document.createComment(chars);
	    this.locator && position(this.locator,comm)
	    appendElement(this, comm);
	},
	
	startCDATA:function() {
	    //used in characters() methods
	    this.cdata = true;
	},
	endCDATA:function() {
	    this.cdata = false;
	},
	
	startDTD:function(name, publicId, systemId) {
		var impl = this.document.implementation;
	    if (impl && impl.createDocumentType) {
	        var dt = impl.createDocumentType(name, publicId, systemId);
	        this.locator && position(this.locator,dt)
	        appendElement(this, dt);
	    }
	},
	/**
	 * @see org.xml.sax.ErrorHandler
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
	 */
	warning:function(error) {
		console.warn('[xmldom warning]\t'+error,_locator(this.locator));
	},
	error:function(error) {
		console.error('[xmldom error]\t'+error,_locator(this.locator));
	},
	fatalError:function(error) {
		console.error('[xmldom fatalError]\t'+error,_locator(this.locator));
	    throw error;
	}
}
function _locator(l){
	if(l){
		return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
	}
}
function _toString(chars,start,length){
	if(typeof chars == 'string'){
		return chars.substr(start,length)
	}else{//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
		if(chars.length >= start+length || start){
			return new java.lang.String(chars,start,length)+'';
		}
		return chars;
	}
}

/*
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * used method of org.xml.sax.ext.LexicalHandler:
 *  #comment(chars, start, length)
 *  #startCDATA()
 *  #endCDATA()
 *  #startDTD(name, publicId, systemId)
 *
 *
 * IGNORED method of org.xml.sax.ext.LexicalHandler:
 *  #endDTD()
 *  #startEntity(name)
 *  #endEntity(name)
 *
 *
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * IGNORED method of org.xml.sax.ext.DeclHandler
 * 	#attributeDecl(eName, aName, type, mode, value)
 *  #elementDecl(name, model)
 *  #externalEntityDecl(name, publicId, systemId)
 *  #internalEntityDecl(name, value)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
 * IGNORED method of org.xml.sax.EntityResolver2
 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
 *  #resolveEntity(publicId, systemId)
 *  #getExternalSubset(name, baseURI)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * IGNORED method of org.xml.sax.DTDHandler
 *  #notationDecl(name, publicId, systemId) {};
 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
 */
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
	DOMHandler.prototype[key] = function(){return null}
})

/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
function appendElement (hander,node) {
    if (!hander.currentElement) {
        hander.document.appendChild(node);
    } else {
        hander.currentElement.appendChild(node);
    }
}//appendChild and setAttributeNS are preformance key

if(typeof require == 'function'){
	var XMLReader = require('./sax').XMLReader;
	var DOMImplementation = exports.DOMImplementation = require('./dom').DOMImplementation;
	exports.XMLSerializer = require('./dom').XMLSerializer ;
	exports.DOMParser = DOMParser;
}

},{"./dom":33,"./sax":34}],33:[function(require,module,exports){
/*
 * DOM Level 2
 * Object DOMException
 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
 */

function copy(src,dest){
	for(var p in src){
		dest[p] = src[p];
	}
}
/**
^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
 */
function _extends(Class,Super){
	var pt = Class.prototype;
	if(Object.create){
		var ppt = Object.create(Super.prototype)
		pt.__proto__ = ppt;
	}
	if(!(pt instanceof Super)){
		function t(){};
		t.prototype = Super.prototype;
		t = new t();
		copy(pt,t);
		Class.prototype = pt = t;
	}
	if(pt.constructor != Class){
		if(typeof Class != 'function'){
			console.error("unknow Class:"+Class)
		}
		pt.constructor = Class
	}
}
var htmlns = 'http://www.w3.org/1999/xhtml' ;
// Node Types
var NodeType = {}
var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

// ExceptionCode
var ExceptionCode = {}
var ExceptionMessage = {};
var INDEX_SIZE_ERR              = ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
var DOMSTRING_SIZE_ERR          = ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
var WRONG_DOCUMENT_ERR          = ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
var INVALID_CHARACTER_ERR       = ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
var NO_DATA_ALLOWED_ERR         = ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
var NOT_SUPPORTED_ERR           = ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
//level2
var INVALID_STATE_ERR        	= ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
var SYNTAX_ERR               	= ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
var INVALID_MODIFICATION_ERR 	= ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
var NAMESPACE_ERR            	= ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
var INVALID_ACCESS_ERR       	= ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);


function DOMException(code, message) {
	if(message instanceof Error){
		var error = message;
	}else{
		error = this;
		Error.call(this, ExceptionMessage[code]);
		this.message = ExceptionMessage[code];
		if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	error.code = code;
	if(message) this.message = this.message + ": " + message;
	return error;
};
DOMException.prototype = Error.prototype;
copy(ExceptionCode,DOMException)
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
 * The items in the NodeList are accessible via an integral index, starting from 0.
 */
function NodeList() {
};
NodeList.prototype = {
	/**
	 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
	 * @standard level1
	 */
	length:0, 
	/**
	 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
	 * @standard level1
	 * @param index  unsigned long 
	 *   Index into the collection.
	 * @return Node
	 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
	 */
	item: function(index) {
		return this[index] || null;
	},
	toString:function(){
		for(var buf = [], i = 0;i<this.length;i++){
			serializeToString(this[i],buf);
		}
		return buf.join('');
	}
};
function LiveNodeList(node,refresh){
	this._node = node;
	this._refresh = refresh
	_updateLiveList(this);
}
function _updateLiveList(list){
	var inc = list._node._inc || list._node.ownerDocument._inc;
	if(list._inc != inc){
		var ls = list._refresh(list._node);
		//console.log(ls.length)
		__set__(list,'length',ls.length);
		copy(ls,list);
		list._inc = inc;
	}
}
LiveNodeList.prototype.item = function(i){
	_updateLiveList(this);
	return this[i];
}

_extends(LiveNodeList,NodeList);
/**
 * 
 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
 * NamedNodeMap objects in the DOM are live.
 * used for attributes or DocumentType entities 
 */
function NamedNodeMap() {
};

function _findNodeIndex(list,node){
	var i = list.length;
	while(i--){
		if(list[i] === node){return i}
	}
}

function _addNamedNode(el,list,newAttr,oldAttr){
	if(oldAttr){
		list[_findNodeIndex(list,oldAttr)] = newAttr;
	}else{
		list[list.length++] = newAttr;
	}
	if(el){
		newAttr.ownerElement = el;
		var doc = el.ownerDocument;
		if(doc){
			oldAttr && _onRemoveAttribute(doc,el,oldAttr);
			_onAddAttribute(doc,el,newAttr);
		}
	}
}
function _removeNamedNode(el,list,attr){
	var i = _findNodeIndex(list,attr);
	if(i>=0){
		var lastIndex = list.length-1
		while(i<lastIndex){
			list[i] = list[++i]
		}
		list.length = lastIndex;
		if(el){
			var doc = el.ownerDocument;
			if(doc){
				_onRemoveAttribute(doc,el,attr);
				attr.ownerElement = null;
			}
		}
	}else{
		throw DOMException(NOT_FOUND_ERR,new Error())
	}
}
NamedNodeMap.prototype = {
	length:0,
	item:NodeList.prototype.item,
	getNamedItem: function(key) {
//		if(key.indexOf(':')>0 || key == 'xmlns'){
//			return null;
//		}
		var i = this.length;
		while(i--){
			var attr = this[i];
			if(attr.nodeName == key){
				return attr;
			}
		}
	},
	setNamedItem: function(attr) {
		var el = attr.ownerElement;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		var oldAttr = this.getNamedItem(attr.nodeName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},
	/* returns Node */
	setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
		var el = attr.ownerElement, oldAttr;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},

	/* returns Node */
	removeNamedItem: function(key) {
		var attr = this.getNamedItem(key);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
		
		
	},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
	
	//for level2
	removeNamedItemNS:function(namespaceURI,localName){
		var attr = this.getNamedItemNS(namespaceURI,localName);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
	},
	getNamedItemNS: function(namespaceURI, localName) {
		var i = this.length;
		while(i--){
			var node = this[i];
			if(node.localName == localName && node.namespaceURI == namespaceURI){
				return node;
			}
		}
		return null;
	}
};
/**
 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
 */
function DOMImplementation(/* Object */ features) {
	this._features = {};
	if (features) {
		for (var feature in features) {
			 this._features = features[feature];
		}
	}
};

DOMImplementation.prototype = {
	hasFeature: function(/* string */ feature, /* string */ version) {
		var versions = this._features[feature.toLowerCase()];
		if (versions && (!version || version in versions)) {
			return true;
		} else {
			return false;
		}
	},
	// Introduced in DOM Level 2:
	createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
		var doc = new Document();
		doc.implementation = this;
		doc.childNodes = new NodeList();
		doc.doctype = doctype;
		if(doctype){
			doc.appendChild(doctype);
		}
		if(qualifiedName){
			var root = doc.createElementNS(namespaceURI,qualifiedName);
			doc.appendChild(root);
		}
		return doc;
	},
	// Introduced in DOM Level 2:
	createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
		var node = new DocumentType();
		node.name = qualifiedName;
		node.nodeName = qualifiedName;
		node.publicId = publicId;
		node.systemId = systemId;
		// Introduced in DOM Level 2:
		//readonly attribute DOMString        internalSubset;
		
		//TODO:..
		//  readonly attribute NamedNodeMap     entities;
		//  readonly attribute NamedNodeMap     notations;
		return node;
	}
};


/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
 */

function Node() {
};

Node.prototype = {
	firstChild : null,
	lastChild : null,
	previousSibling : null,
	nextSibling : null,
	attributes : null,
	parentNode : null,
	childNodes : null,
	ownerDocument : null,
	nodeValue : null,
	namespaceURI : null,
	prefix : null,
	localName : null,
	// Modified in DOM Level 2:
	insertBefore:function(newChild, refChild){//raises 
		return _insertBefore(this,newChild,refChild);
	},
	replaceChild:function(newChild, oldChild){//raises 
		this.insertBefore(newChild,oldChild);
		if(oldChild){
			this.removeChild(oldChild);
		}
	},
	removeChild:function(oldChild){
		return _removeChild(this,oldChild);
	},
	appendChild:function(newChild){
		return this.insertBefore(newChild,null);
	},
	hasChildNodes:function(){
		return this.firstChild != null;
	},
	cloneNode:function(deep){
		return cloneNode(this.ownerDocument||this,this,deep);
	},
	// Modified in DOM Level 2:
	normalize:function(){
		var child = this.firstChild;
		while(child){
			var next = child.nextSibling;
			if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
				this.removeChild(next);
				child.appendData(next.data);
			}else{
				child.normalize();
				child = next;
			}
		}
	},
  	// Introduced in DOM Level 2:
	isSupported:function(feature, version){
		return this.ownerDocument.implementation.hasFeature(feature,version);
	},
    // Introduced in DOM Level 2:
    hasAttributes:function(){
    	return this.attributes.length>0;
    },
    lookupPrefix:function(namespaceURI){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			for(var n in map){
    				if(map[n] == namespaceURI){
    					return n;
    				}
    			}
    		}
    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI:function(prefix){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			if(prefix in map){
    				return map[prefix] ;
    			}
    		}
    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace:function(namespaceURI){
    	var prefix = this.lookupPrefix(namespaceURI);
    	return prefix == null;
    }
};


function _xmlEncoder(c){
	return c == '<' && '&lt;' ||
         c == '>' && '&gt;' ||
         c == '&' && '&amp;' ||
         c == '"' && '&quot;' ||
         '&#'+c.charCodeAt()+';'
}


copy(NodeType,Node);
copy(NodeType,Node.prototype);

/**
 * @param callback return true for continue,false for break
 * @return boolean true: break visit;
 */
function _visitNode(node,callback){
	if(callback(node)){
		return true;
	}
	if(node = node.firstChild){
		do{
			if(_visitNode(node,callback)){return true}
        }while(node=node.nextSibling)
    }
}



function Document(){
}
function _onAddAttribute(doc,el,newAttr){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value
	}
}
function _onRemoveAttribute(doc,el,newAttr,remove){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		delete el._nsMap[newAttr.prefix?newAttr.localName:'']
	}
}
function _onUpdateChild(doc,el,newChild){
	if(doc && doc._inc){
		doc._inc++;
		//update childNodes
		var cs = el.childNodes;
		if(newChild){
			cs[cs.length++] = newChild;
		}else{
			//console.log(1)
			var child = el.firstChild;
			var i = 0;
			while(child){
				cs[i++] = child;
				child =child.nextSibling;
			}
			cs.length = i;
		}
	}
}

/**
 * attributes;
 * children;
 * 
 * writeable properties:
 * nodeValue,Attr:value,CharacterData:data
 * prefix
 */
function _removeChild(parentNode,child){
	var previous = child.previousSibling;
	var next = child.nextSibling;
	if(previous){
		previous.nextSibling = next;
	}else{
		parentNode.firstChild = next
	}
	if(next){
		next.previousSibling = previous;
	}else{
		parentNode.lastChild = previous;
	}
	_onUpdateChild(parentNode.ownerDocument,parentNode);
	return child;
}
/**
 * preformance key(refChild == null)
 */
function _insertBefore(parentNode,newChild,nextChild){
	var cp = newChild.parentNode;
	if(cp){
		cp.removeChild(newChild);//remove and update
	}
	if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
		var newFirst = newChild.firstChild;
		if (newFirst == null) {
			return newChild;
		}
		var newLast = newChild.lastChild;
	}else{
		newFirst = newLast = newChild;
	}
	var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

	newFirst.previousSibling = pre;
	newLast.nextSibling = nextChild;
	
	
	if(pre){
		pre.nextSibling = newFirst;
	}else{
		parentNode.firstChild = newFirst;
	}
	if(nextChild == null){
		parentNode.lastChild = newLast;
	}else{
		nextChild.previousSibling = newLast;
	}
	do{
		newFirst.parentNode = parentNode;
	}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
	_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
	//console.log(parentNode.lastChild.nextSibling == null)
	if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
		newChild.firstChild = newChild.lastChild = null;
	}
	return newChild;
}
function _appendSingleChild(parentNode,newChild){
	var cp = newChild.parentNode;
	if(cp){
		var pre = parentNode.lastChild;
		cp.removeChild(newChild);//remove and update
		var pre = parentNode.lastChild;
	}
	var pre = parentNode.lastChild;
	newChild.parentNode = parentNode;
	newChild.previousSibling = pre;
	newChild.nextSibling = null;
	if(pre){
		pre.nextSibling = newChild;
	}else{
		parentNode.firstChild = newChild;
	}
	parentNode.lastChild = newChild;
	_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
	return newChild;
	//console.log("__aa",parentNode.lastChild.nextSibling == null)
}
Document.prototype = {
	//implementation : null,
	nodeName :  '#document',
	nodeType :  DOCUMENT_NODE,
	doctype :  null,
	documentElement :  null,
	_inc : 1,
	
	insertBefore :  function(newChild, refChild){//raises 
		if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
			var child = newChild.firstChild;
			while(child){
				var next = child.nextSibling;
				this.insertBefore(child,refChild);
				child = next;
			}
			return newChild;
		}
		if(this.documentElement == null && newChild.nodeType == 1){
			this.documentElement = newChild;
		}
		
		return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
	},
	removeChild :  function(oldChild){
		if(this.documentElement == oldChild){
			this.documentElement = null;
		}
		return _removeChild(this,oldChild);
	},
	// Introduced in DOM Level 2:
	importNode : function(importedNode,deep){
		return importNode(this,importedNode,deep);
	},
	// Introduced in DOM Level 2:
	getElementById :	function(id){
		var rtv = null;
		_visitNode(this.documentElement,function(node){
			if(node.nodeType == 1){
				if(node.getAttribute('id') == id){
					rtv = node;
					return true;
				}
			}
		})
		return rtv;
	},
	
	//document factory method:
	createElement :	function(tagName){
		var node = new Element();
		node.ownerDocument = this;
		node.nodeName = tagName;
		node.tagName = tagName;
		node.childNodes = new NodeList();
		var attrs	= node.attributes = new NamedNodeMap();
		attrs._ownerElement = node;
		return node;
	},
	createDocumentFragment :	function(){
		var node = new DocumentFragment();
		node.ownerDocument = this;
		node.childNodes = new NodeList();
		return node;
	},
	createTextNode :	function(data){
		var node = new Text();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createComment :	function(data){
		var node = new Comment();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createCDATASection :	function(data){
		var node = new CDATASection();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createProcessingInstruction :	function(target,data){
		var node = new ProcessingInstruction();
		node.ownerDocument = this;
		node.tagName = node.target = target;
		node.nodeValue= node.data = data;
		return node;
	},
	createAttribute :	function(name){
		var node = new Attr();
		node.ownerDocument	= this;
		node.name = name;
		node.nodeName	= name;
		node.localName = name;
		node.specified = true;
		return node;
	},
	createEntityReference :	function(name){
		var node = new EntityReference();
		node.ownerDocument	= this;
		node.nodeName	= name;
		return node;
	},
	// Introduced in DOM Level 2:
	createElementNS :	function(namespaceURI,qualifiedName){
		var node = new Element();
		var pl = qualifiedName.split(':');
		var attrs	= node.attributes = new NamedNodeMap();
		node.childNodes = new NodeList();
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.tagName = qualifiedName;
		node.namespaceURI = namespaceURI;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		attrs._ownerElement = node;
		return node;
	},
	// Introduced in DOM Level 2:
	createAttributeNS :	function(namespaceURI,qualifiedName){
		var node = new Attr();
		var pl = qualifiedName.split(':');
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.name = qualifiedName;
		node.namespaceURI = namespaceURI;
		node.specified = true;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		return node;
	}
};
_extends(Document,Node);


function Element() {
	this._nsMap = {};
};
Element.prototype = {
	nodeType : ELEMENT_NODE,
	hasAttribute : function(name){
		return this.getAttributeNode(name)!=null;
	},
	getAttribute : function(name){
		var attr = this.getAttributeNode(name);
		return attr && attr.value || '';
	},
	getAttributeNode : function(name){
		return this.attributes.getNamedItem(name);
	},
	setAttribute : function(name, value){
		var attr = this.ownerDocument.createAttribute(name);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	removeAttribute : function(name){
		var attr = this.getAttributeNode(name)
		attr && this.removeAttributeNode(attr);
	},
	
	//four real opeartion method
	appendChild:function(newChild){
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			return this.insertBefore(newChild,null);
		}else{
			return _appendSingleChild(this,newChild);
		}
	},
	setAttributeNode : function(newAttr){
		return this.attributes.setNamedItem(newAttr);
	},
	setAttributeNodeNS : function(newAttr){
		return this.attributes.setNamedItemNS(newAttr);
	},
	removeAttributeNode : function(oldAttr){
		return this.attributes.removeNamedItem(oldAttr.nodeName);
	},
	//get real attribute name,and remove it by removeAttributeNode
	removeAttributeNS : function(namespaceURI, localName){
		var old = this.getAttributeNodeNS(namespaceURI, localName);
		old && this.removeAttributeNode(old);
	},
	
	hasAttributeNS : function(namespaceURI, localName){
		return this.getAttributeNodeNS(namespaceURI, localName)!=null;
	},
	getAttributeNS : function(namespaceURI, localName){
		var attr = this.getAttributeNodeNS(namespaceURI, localName);
		return attr && attr.value || '';
	},
	setAttributeNS : function(namespaceURI, qualifiedName, value){
		var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	getAttributeNodeNS : function(namespaceURI, localName){
		return this.attributes.getNamedItemNS(namespaceURI, localName);
	},
	
	getElementsByTagName : function(tagName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
					ls.push(node);
				}
			});
			return ls;
		});
	},
	getElementsByTagNameNS : function(namespaceURI, localName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
					ls.push(node);
				}
			});
			return ls;
		});
	}
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


_extends(Element,Node);
function Attr() {
};
Attr.prototype.nodeType = ATTRIBUTE_NODE;
_extends(Attr,Node);


function CharacterData() {
};
CharacterData.prototype = {
	data : '',
	substringData : function(offset, count) {
		return this.data.substring(offset, offset+count);
	},
	appendData: function(text) {
		text = this.data+text;
		this.nodeValue = this.data = text;
		this.length = text.length;
	},
	insertData: function(offset,text) {
		this.replaceData(offset,0,text);
	
	},
	appendChild:function(newChild){
		//if(!(newChild instanceof CharacterData)){
			throw new Error(ExceptionMessage[3])
		//}
		return Node.prototype.appendChild.apply(this,arguments)
	},
	deleteData: function(offset, count) {
		this.replaceData(offset,count,"");
	},
	replaceData: function(offset, count, text) {
		var start = this.data.substring(0,offset);
		var end = this.data.substring(offset+count);
		text = start + text + end;
		this.nodeValue = this.data = text;
		this.length = text.length;
	}
}
_extends(CharacterData,Node);
function Text() {
};
Text.prototype = {
	nodeName : "#text",
	nodeType : TEXT_NODE,
	splitText : function(offset) {
		var text = this.data;
		var newText = text.substring(offset);
		text = text.substring(0, offset);
		this.data = this.nodeValue = text;
		this.length = text.length;
		var newNode = this.ownerDocument.createTextNode(newText);
		if(this.parentNode){
			this.parentNode.insertBefore(newNode, this.nextSibling);
		}
		return newNode;
	}
}
_extends(Text,CharacterData);
function Comment() {
};
Comment.prototype = {
	nodeName : "#comment",
	nodeType : COMMENT_NODE
}
_extends(Comment,CharacterData);

function CDATASection() {
};
CDATASection.prototype = {
	nodeName : "#cdata-section",
	nodeType : CDATA_SECTION_NODE
}
_extends(CDATASection,CharacterData);


function DocumentType() {
};
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
_extends(DocumentType,Node);

function Notation() {
};
Notation.prototype.nodeType = NOTATION_NODE;
_extends(Notation,Node);

function Entity() {
};
Entity.prototype.nodeType = ENTITY_NODE;
_extends(Entity,Node);

function EntityReference() {
};
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
_extends(EntityReference,Node);

function DocumentFragment() {
};
DocumentFragment.prototype.nodeName =	"#document-fragment";
DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
_extends(DocumentFragment,Node);


function ProcessingInstruction() {
}
ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
_extends(ProcessingInstruction,Node);
function XMLSerializer(){}
XMLSerializer.prototype.serializeToString = function(node,attributeSorter){
	return node.toString(attributeSorter);
}
Node.prototype.toString =function(attributeSorter){
	var buf = [];
	serializeToString(this,buf,attributeSorter);
	return buf.join('');
}
function serializeToString(node,buf,attributeSorter,isHTML){
	switch(node.nodeType){
	case ELEMENT_NODE:
		var attrs = node.attributes;
		var len = attrs.length;
		var child = node.firstChild;
		var nodeName = node.tagName;
		isHTML =  (htmlns === node.namespaceURI) ||isHTML 
		buf.push('<',nodeName);
		if(attributeSorter){
			buf.sort.apply(attrs, attributeSorter);
		}
		for(var i=0;i<len;i++){
			serializeToString(attrs.item(i),buf,attributeSorter,isHTML);
		}
		if(child || isHTML && !/^(?:meta|link|img|br|hr|input|button)$/i.test(nodeName)){
			buf.push('>');
			//if is cdata child node
			if(isHTML && /^script$/i.test(nodeName)){
				if(child){
					buf.push(child.data);
				}
			}else{
				while(child){
					serializeToString(child,buf,attributeSorter,isHTML);
					child = child.nextSibling;
				}
			}
			buf.push('</',nodeName,'>');
		}else{
			buf.push('/>');
		}
		return;
	case DOCUMENT_NODE:
	case DOCUMENT_FRAGMENT_NODE:
		var child = node.firstChild;
		while(child){
			serializeToString(child,buf,attributeSorter,isHTML);
			child = child.nextSibling;
		}
		return;
	case ATTRIBUTE_NODE:
		return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
	case TEXT_NODE:
		return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
	case CDATA_SECTION_NODE:
		return buf.push( '<![CDATA[',node.data,']]>');
	case COMMENT_NODE:
		return buf.push( "<!--",node.data,"-->");
	case DOCUMENT_TYPE_NODE:
		var pubid = node.publicId;
		var sysid = node.systemId;
		buf.push('<!DOCTYPE ',node.name);
		if(pubid){
			buf.push(' PUBLIC "',pubid);
			if (sysid && sysid!='.') {
				buf.push( '" "',sysid);
			}
			buf.push('">');
		}else if(sysid && sysid!='.'){
			buf.push(' SYSTEM "',sysid,'">');
		}else{
			var sub = node.internalSubset;
			if(sub){
				buf.push(" [",sub,"]");
			}
			buf.push(">");
		}
		return;
	case PROCESSING_INSTRUCTION_NODE:
		return buf.push( "<?",node.target," ",node.data,"?>");
	case ENTITY_REFERENCE_NODE:
		return buf.push( '&',node.nodeName,';');
	//case ENTITY_NODE:
	//case NOTATION_NODE:
	default:
		buf.push('??',node.nodeName);
	}
}
function importNode(doc,node,deep){
	var node2;
	switch (node.nodeType) {
	case ELEMENT_NODE:
		node2 = node.cloneNode(false);
		node2.ownerDocument = doc;
		//var attrs = node2.attributes;
		//var len = attrs.length;
		//for(var i=0;i<len;i++){
			//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
		//}
	case DOCUMENT_FRAGMENT_NODE:
		break;
	case ATTRIBUTE_NODE:
		deep = true;
		break;
	//case ENTITY_REFERENCE_NODE:
	//case PROCESSING_INSTRUCTION_NODE:
	////case TEXT_NODE:
	//case CDATA_SECTION_NODE:
	//case COMMENT_NODE:
	//	deep = false;
	//	break;
	//case DOCUMENT_NODE:
	//case DOCUMENT_TYPE_NODE:
	//cannot be imported.
	//case ENTITY_NODE:
	//case NOTATION_NODE：
	//can not hit in level3
	//default:throw e;
	}
	if(!node2){
		node2 = node.cloneNode(false);//false
	}
	node2.ownerDocument = doc;
	node2.parentNode = null;
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(importNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}
//
//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
function cloneNode(doc,node,deep){
	var node2 = new node.constructor();
	for(var n in node){
		var v = node[n];
		if(typeof v != 'object' ){
			if(v != node2[n]){
				node2[n] = v;
			}
		}
	}
	if(node.childNodes){
		node2.childNodes = new NodeList();
	}
	node2.ownerDocument = doc;
	switch (node2.nodeType) {
	case ELEMENT_NODE:
		var attrs	= node.attributes;
		var attrs2	= node2.attributes = new NamedNodeMap();
		var len = attrs.length
		attrs2._ownerElement = node2;
		for(var i=0;i<len;i++){
			node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
		}
		break;;
	case ATTRIBUTE_NODE:
		deep = true;
	}
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(cloneNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}

function __set__(object,key,value){
	object[key] = value
}
//do dynamic
try{
	if(Object.defineProperty){
		Object.defineProperty(LiveNodeList.prototype,'length',{
			get:function(){
				_updateLiveList(this);
				return this.$$length;
			}
		});
		Object.defineProperty(Node.prototype,'textContent',{
			get:function(){
				return getTextContent(this);
			},
			set:function(data){
				switch(this.nodeType){
				case 1:
				case 11:
					while(this.firstChild){
						this.removeChild(this.firstChild);
					}
					if(data || String(data)){
						this.appendChild(this.ownerDocument.createTextNode(data));
					}
					break;
				default:
					//TODO:
					this.data = data;
					this.value = value;
					this.nodeValue = data;
				}
			}
		})
		
		function getTextContent(node){
			switch(node.nodeType){
			case 1:
			case 11:
				var buf = [];
				node = node.firstChild;
				while(node){
					if(node.nodeType!==7 && node.nodeType !==8){
						buf.push(getTextContent(node));
					}
					node = node.nextSibling;
				}
				return buf.join('');
			default:
				return node.nodeValue;
			}
		}
		__set__ = function(object,key,value){
			//console.log(value)
			object['$$'+key] = value
		}
	}
}catch(e){//ie8
}

if(typeof require == 'function'){
	exports.DOMImplementation = DOMImplementation;
	exports.XMLSerializer = XMLSerializer;
}

},{}],34:[function(require,module,exports){
//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//[5]   	Name	   ::=   	NameStartChar (NameChar)*
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]///\u10000-\uEFFFF
var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\u00B7\u0300-\u036F\\u203F-\u2040]");
var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

//S_TAG,	S_ATTR,	S_EQ,	S_V
//S_ATTR_S,	S_E,	S_S,	S_C
var S_TAG = 0;//tag name offerring
var S_ATTR = 1;//attr name offerring 
var S_ATTR_S=2;//attr name end and space offer
var S_EQ = 3;//=space?
var S_V = 4;//attr value(no quot value only)
var S_E = 5;//attr value end and no space(quot end)
var S_S = 6;//(attr value end || tag end ) && (space offer)
var S_C = 7;//closed el<el />

function XMLReader(){
	
}

XMLReader.prototype = {
	parse:function(source,defaultNSMap,entityMap){
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap ,defaultNSMap = {})
		parse(source,defaultNSMap,entityMap,
				domBuilder,this.errorHandler);
		domBuilder.endDocument();
	}
}
function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
  function fixedFromCharCode(code) {
		// String.prototype.fromCharCode does not supports
		// > 2 bytes unicode chars directly
		if (code > 0xffff) {
			code -= 0x10000;
			var surrogate1 = 0xd800 + (code >> 10)
				, surrogate2 = 0xdc00 + (code & 0x3ff);

			return String.fromCharCode(surrogate1, surrogate2);
		} else {
			return String.fromCharCode(code);
		}
	}
	function entityReplacer(a){
		var k = a.slice(1,-1);
		if(k in entityMap){
			return entityMap[k]; 
		}else if(k.charAt(0) === '#'){
			return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
		}else{
			errorHandler.error('entity not found:'+a);
			return a;
		}
	}
	function appendText(end){//has some bugs
		if(end>start){
			var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
			locator&&position(start);
			domBuilder.characters(xt,0,end-start);
			start = end
		}
	}
	function position(p,m){
		while(p>=lineEnd && (m = linePattern.exec(source))){
			lineStart = m.index;
			lineEnd = lineStart + m[0].length;
			locator.lineNumber++;
			//console.log('line++:',locator,startPos,endPos)
		}
		locator.columnNumber = p-lineStart+1;
	}
	var lineStart = 0;
	var lineEnd = 0;
	var linePattern = /.+(?:\r\n?|\n)|.*$/g
	var locator = domBuilder.locator;
	
	var parseStack = [{currentNSMap:defaultNSMapCopy}]
	var closeMap = {};
	var start = 0;
	while(true){
		try{
			var tagStart = source.indexOf('<',start);
			if(tagStart<0){
				if(!source.substr(start).match(/^\s*$/)){
					var doc = domBuilder.document;
	    			var text = doc.createTextNode(source.substr(start));
	    			doc.appendChild(text);
	    			domBuilder.currentElement = text;
				}
				return;
			}
			if(tagStart>start){
				appendText(tagStart);
			}
			switch(source.charAt(tagStart+1)){
			case '/':
				var end = source.indexOf('>',tagStart+3);
				var tagName = source.substring(tagStart+2,end);
				var config = parseStack.pop();
				var localNSMap = config.localNSMap;
		        if(config.tagName != tagName){
		            errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
		        }
				domBuilder.endElement(config.uri,config.localName,tagName);
				if(localNSMap){
					for(var prefix in localNSMap){
						domBuilder.endPrefixMapping(prefix) ;
					}
				}
				end++;
				break;
				// end elment
			case '?':// <?...?>
				locator&&position(tagStart);
				end = parseInstruction(source,tagStart,domBuilder);
				break;
			case '!':// <!doctype,<![CDATA,<!--
				locator&&position(tagStart);
				end = parseDCC(source,tagStart,domBuilder,errorHandler);
				break;
			default:
			
				locator&&position(tagStart);
				
				var el = new ElementAttributes();
				
				//elStartEnd
				var end = parseElementStartPart(source,tagStart,el,entityReplacer,errorHandler);
				var len = el.length;
				
				if(locator){
					if(len){
						//attribute position fixed
						for(var i = 0;i<len;i++){
							var a = el[i];
							position(a.offset);
							a.offset = copyLocator(locator,{});
						}
					}
					position(end);
				}
				if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
					el.closed = true;
					if(!entityMap.nbsp){
						errorHandler.warning('unclosed xml attribute');
					}
				}
				appendElement(el,domBuilder,parseStack);
				
				
				if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
					end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder)
				}else{
					end++;
				}
			}
		}catch(e){
			errorHandler.error('element parse error: '+e);
			end = -1;
		}
		if(end>start){
			start = end;
		}else{
			//TODO: 这里有可能sax回退，有位置错误风险
			appendText(Math.max(tagStart,start)+1);
		}
	}
}
function copyLocator(f,t){
	t.lineNumber = f.lineNumber;
	t.columnNumber = f.columnNumber;
	return t;
}

/**
 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function parseElementStartPart(source,start,el,entityReplacer,errorHandler){
	var attrName;
	var value;
	var p = ++start;
	var s = S_TAG;//status
	while(true){
		var c = source.charAt(p);
		switch(c){
		case '=':
			if(s === S_ATTR){//attrName
				attrName = source.slice(start,p);
				s = S_EQ;
			}else if(s === S_ATTR_S){
				s = S_EQ;
			}else{
				//fatalError: equal must after attrName or space after attrName
				throw new Error('attribute equal must after attrName');
			}
			break;
		case '\'':
		case '"':
			if(s === S_EQ){//equal
				start = p+1;
				p = source.indexOf(c,start)
				if(p>0){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					el.add(attrName,value,start-1);
					s = S_E;
				}else{
					//fatalError: no end quot match
					throw new Error('attribute value no end \''+c+'\' match');
				}
			}else if(s == S_V){
				value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
				//console.log(attrName,value,start,p)
				el.add(attrName,value,start);
				//console.dir(el)
				errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
				start = p+1;
				s = S_E
			}else{
				//fatalError: no equal before
				throw new Error('attribute value must after "="');
			}
			break;
		case '/':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_E:
			case S_S:
			case S_C:
				s = S_C;
				el.closed = true;
			case S_V:
			case S_ATTR:
			case S_ATTR_S:
				break;
			//case S_EQ:
			default:
				throw new Error("attribute invalid close char('/')")
			}
			break;
		case ''://end document
			//throw new Error('unexpected end of input')
			errorHandler.error('unexpected end of input');
		case '>':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_E:
			case S_S:
			case S_C:
				break;//normal
			case S_V://Compatible state
			case S_ATTR:
				value = source.slice(start,p);
				if(value.slice(-1) === '/'){
					el.closed  = true;
					value = value.slice(0,-1)
				}
			case S_ATTR_S:
				if(s === S_ATTR_S){
					value = attrName;
				}
				if(s == S_V){
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start)
				}else{
					errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!')
					el.add(value,value,start)
				}
				break;
			case S_EQ:
				throw new Error('attribute value missed!!');
			}
//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
			return p;
		/*xml space '\x20' | #x9 | #xD | #xA; */
		case '\u0080':
			c = ' ';
		default:
			if(c<= ' '){//space
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));//tagName
					s = S_S;
					break;
				case S_ATTR:
					attrName = source.slice(start,p)
					s = S_ATTR_S;
					break;
				case S_V:
					var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value,start)
				case S_E:
					s = S_S;
					break;
				//case S_S:
				//case S_EQ:
				//case S_ATTR_S:
				//	void();break;
				//case S_C:
					//ignore warning
				}
			}else{//not space
//S_TAG,	S_ATTR,	S_EQ,	S_V
//S_ATTR_S,	S_E,	S_S,	S_C
				switch(s){
				//case S_TAG:void();break;
				//case S_ATTR:void();break;
				//case S_V:void();break;
				case S_ATTR_S:
					errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead!!')
					el.add(attrName,attrName,start);
					start = p;
					s = S_ATTR;
					break;
				case S_E:
					errorHandler.warning('attribute space is required"'+attrName+'"!!')
				case S_S:
					s = S_ATTR;
					start = p;
					break;
				case S_EQ:
					s = S_V;
					start = p;
					break;
				case S_C:
					throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
		}
		p++;
	}
}
/**
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function appendElement(el,domBuilder,parseStack){
	var tagName = el.tagName;
	var localNSMap = null;
	var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
	var i = el.length;
	while(i--){
		var a = el[i];
		var qName = a.qName;
		var value = a.value;
		var nsp = qName.indexOf(':');
		if(nsp>0){
			var prefix = a.prefix = qName.slice(0,nsp);
			var localName = qName.slice(nsp+1);
			var nsPrefix = prefix === 'xmlns' && localName
		}else{
			localName = qName;
			prefix = null
			nsPrefix = qName === 'xmlns' && ''
		}
		//can not set prefix,because prefix !== ''
		a.localName = localName ;
		//prefix == null for no ns prefix attribute 
		if(nsPrefix !== false){//hack!!
			if(localNSMap == null){
				localNSMap = {}
				//console.log(currentNSMap,0)
				_copy(currentNSMap,currentNSMap={})
				//console.log(currentNSMap,1)
			}
			currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
			a.uri = 'http://www.w3.org/2000/xmlns/'
			domBuilder.startPrefixMapping(nsPrefix, value) 
		}
	}
	var i = el.length;
	while(i--){
		a = el[i];
		var prefix = a.prefix;
		if(prefix){//no prefix attribute has no namespace
			if(prefix === 'xml'){
				a.uri = 'http://www.w3.org/XML/1998/namespace';
			}if(prefix !== 'xmlns'){
				a.uri = currentNSMap[prefix]
				
				//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
			}
		}
	}
	var nsp = tagName.indexOf(':');
	if(nsp>0){
		prefix = el.prefix = tagName.slice(0,nsp);
		localName = el.localName = tagName.slice(nsp+1);
	}else{
		prefix = null;//important!!
		localName = el.localName = tagName;
	}
	//no prefix element has default namespace
	var ns = el.uri = currentNSMap[prefix || ''];
	domBuilder.startElement(ns,localName,tagName,el);
	//endPrefixMapping and startPrefixMapping have not any help for dom builder
	//localNSMap = null
	if(el.closed){
		domBuilder.endElement(ns,localName,tagName);
		if(localNSMap){
			for(prefix in localNSMap){
				domBuilder.endPrefixMapping(prefix) 
			}
		}
	}else{
		el.currentNSMap = currentNSMap;
		el.localNSMap = localNSMap;
		parseStack.push(el);
	}
}
function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
	if(/^(?:script|textarea)$/i.test(tagName)){
		var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
		var text = source.substring(elStartEnd+1,elEndStart);
		if(/[&<]/.test(text)){
			if(/^script$/i.test(tagName)){
				//if(!/\]\]>/.test(text)){
					//lexHandler.startCDATA();
					domBuilder.characters(text,0,text.length);
					//lexHandler.endCDATA();
					return elEndStart;
				//}
			}//}else{//text area
				text = text.replace(/&#?\w+;/g,entityReplacer);
				domBuilder.characters(text,0,text.length);
				return elEndStart;
			//}
			
		}
	}
	return elStartEnd+1;
}
function fixSelfClosed(source,elStartEnd,tagName,closeMap){
	//if(tagName in closeMap){
	var pos = closeMap[tagName];
	if(pos == null){
		//console.log(tagName)
		pos = closeMap[tagName] = source.lastIndexOf('</'+tagName+'>')
	}
	return pos<elStartEnd;
	//} 
}
function _copy(source,target){
	for(var n in source){target[n] = source[n]}
}
function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
	var next= source.charAt(start+2)
	switch(next){
	case '-':
		if(source.charAt(start + 3) === '-'){
			var end = source.indexOf('-->',start+4);
			//append comment source.substring(4,end)//<!--
			if(end>start){
				domBuilder.comment(source,start+4,end-start-4);
				return end+3;
			}else{
				errorHandler.error("Unclosed comment");
				return -1;
			}
		}else{
			//error
			return -1;
		}
	default:
		if(source.substr(start+3,6) == 'CDATA['){
			var end = source.indexOf(']]>',start+9);
			domBuilder.startCDATA();
			domBuilder.characters(source,start+9,end-start-9);
			domBuilder.endCDATA() 
			return end+3;
		}
		//<!DOCTYPE
		//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
		var matchs = split(source,start);
		var len = matchs.length;
		if(len>1 && /!doctype/i.test(matchs[0][0])){
			var name = matchs[1][0];
			var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0]
			var sysid = len>4 && matchs[4][0];
			var lastMatch = matchs[len-1]
			domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
					sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
			domBuilder.endDTD();
			
			return lastMatch.index+lastMatch[0].length
		}
	}
	return -1;
}



function parseInstruction(source,start,domBuilder){
	var end = source.indexOf('?>',start);
	if(end){
		var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
		if(match){
			var len = match[0].length;
			domBuilder.processingInstruction(match[1], match[2]) ;
			return end+2;
		}else{//error
			return -1;
		}
	}
	return -1;
}

/**
 * @param source
 */
function ElementAttributes(source){
	
}
ElementAttributes.prototype = {
	setTagName:function(tagName){
		if(!tagNamePattern.test(tagName)){
			throw new Error('invalid tagName:'+tagName)
		}
		this.tagName = tagName
	},
	add:function(qName,value,offset){
		if(!tagNamePattern.test(qName)){
			throw new Error('invalid attribute:'+qName)
		}
		this[this.length++] = {qName:qName,value:value,offset:offset}
	},
	length:0,
	getLocalName:function(i){return this[i].localName},
	getOffset:function(i){return this[i].offset},
	getQName:function(i){return this[i].qName},
	getURI:function(i){return this[i].uri},
	getValue:function(i){return this[i].value}
//	,getIndex:function(uri, localName)){
//		if(localName){
//			
//		}else{
//			var qName = uri
//		}
//	},
//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
//	getType:function(uri,localName){}
//	getType:function(i){},
}




function _set_proto_(thiz,parent){
	thiz.__proto__ = parent;
	return thiz;
}
if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
	_set_proto_ = function(thiz,parent){
		function p(){};
		p.prototype = parent;
		p = new p();
		for(parent in thiz){
			p[parent] = thiz[parent];
		}
		return p;
	}
}

function split(source,start){
	var match;
	var buf = [];
	var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
	reg.lastIndex = start;
	reg.exec(source);//skip <
	while(match = reg.exec(source)){
		buf.push(match);
		if(match[1])return buf;
	}
}

if(typeof require == 'function'){
	exports.XMLReader = XMLReader;
}


},{}],35:[function(require,module,exports){
module.exports={
  "name": "dav",
  "version": "1.8.0",
  "author": "Gareth Aye [:gaye] <gaye@mozilla.com>",
  "description": "WebDAV, CalDAV, and CardDAV client for nodejs and the browser",
  "license": "MPL-2.0",
  "main": "./dav.js",
  "repository": "https://github.com/gaye/dav",
  "keywords": [
    "address book",
    "calendar",
    "contacts",
    "dav",
    "caldav",
    "carddav",
    "webdav",
    "ical",
    "vcard",
    "sync",
    "rfc 4791",
    "rfc 6352",
    "rfc 6578"
  ],
  "dependencies": {
    "co": "^4.6.0",
    "xmldom": "^0.1.19",
    "xmlhttprequest": "^1.7.0"
  },
  "devDependencies": {
    "babel": "^5.8.23",
    "browserify": "^11.0.1",
    "chai": "^3.2.0",
    "doctoc": "^0.15.0",
    "mocha": "^2.3.2",
    "nock": "^2.10.0",
    "sinon": "^1.16.1",
    "tcp-port-used": "^0.1.2",
    "uglify-js": "^2.4.24"
  },
  "scripts": {
    "test": "make test"
  }
}

},{}]},{},[8])(8)
});