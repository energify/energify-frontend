
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function (exports) {
    'use strict';

    function noop$1() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop$1;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*!
     * Chart.js v3.2.0
     * https://www.chartjs.org
     * (c) 2021 Chart.js Contributors
     * Released under the MIT License
     */
    const requestAnimFrame = (function() {
      if (typeof window === 'undefined') {
        return function(callback) {
          return callback();
        };
      }
      return window.requestAnimationFrame;
    }());
    function throttled(fn, thisArg, updateFn) {
      const updateArgs = updateFn || ((args) => Array.prototype.slice.call(args));
      let ticking = false;
      let args = [];
      return function(...rest) {
        args = updateArgs(rest);
        if (!ticking) {
          ticking = true;
          requestAnimFrame.call(window, () => {
            ticking = false;
            fn.apply(thisArg, args);
          });
        }
      };
    }
    function debounce(fn, delay) {
      let timeout;
      return function() {
        if (delay) {
          clearTimeout(timeout);
          timeout = setTimeout(fn, delay);
        } else {
          fn();
        }
        return delay;
      };
    }
    const _toLeftRightCenter = (align) => align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
    const _alignStartEnd = (align, start, end) => align === 'start' ? start : align === 'end' ? end : (start + end) / 2;
    const _textX = (align, left, right) => align === 'right' ? right : align === 'center' ? (left + right) / 2 : left;

    function noop() {}
    const uid = (function() {
      let id = 0;
      return function() {
        return id++;
      };
    }());
    function isNullOrUndef(value) {
      return value === null || typeof value === 'undefined';
    }
    function isArray(value) {
      if (Array.isArray && Array.isArray(value)) {
        return true;
      }
      const type = Object.prototype.toString.call(value);
      if (type.substr(0, 7) === '[object' && type.substr(-6) === 'Array]') {
        return true;
      }
      return false;
    }
    function isObject(value) {
      return value !== null && Object.prototype.toString.call(value) === '[object Object]';
    }
    const isNumberFinite = (value) => (typeof value === 'number' || value instanceof Number) && isFinite(+value);
    function finiteOrDefault(value, defaultValue) {
      return isNumberFinite(value) ? value : defaultValue;
    }
    function valueOrDefault(value, defaultValue) {
      return typeof value === 'undefined' ? defaultValue : value;
    }
    const toPercentage = (value, dimension) =>
      typeof value === 'string' && value.endsWith('%') ?
        parseFloat(value) / 100
        : value / dimension;
    const toDimension = (value, dimension) =>
      typeof value === 'string' && value.endsWith('%') ?
        parseFloat(value) / 100 * dimension
        : +value;
    function callback(fn, args, thisArg) {
      if (fn && typeof fn.call === 'function') {
        return fn.apply(thisArg, args);
      }
    }
    function each(loopable, fn, thisArg, reverse) {
      let i, len, keys;
      if (isArray(loopable)) {
        len = loopable.length;
        if (reverse) {
          for (i = len - 1; i >= 0; i--) {
            fn.call(thisArg, loopable[i], i);
          }
        } else {
          for (i = 0; i < len; i++) {
            fn.call(thisArg, loopable[i], i);
          }
        }
      } else if (isObject(loopable)) {
        keys = Object.keys(loopable);
        len = keys.length;
        for (i = 0; i < len; i++) {
          fn.call(thisArg, loopable[keys[i]], keys[i]);
        }
      }
    }
    function _elementsEqual(a0, a1) {
      let i, ilen, v0, v1;
      if (!a0 || !a1 || a0.length !== a1.length) {
        return false;
      }
      for (i = 0, ilen = a0.length; i < ilen; ++i) {
        v0 = a0[i];
        v1 = a1[i];
        if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
          return false;
        }
      }
      return true;
    }
    function clone$1(source) {
      if (isArray(source)) {
        return source.map(clone$1);
      }
      if (isObject(source)) {
        const target = Object.create(null);
        const keys = Object.keys(source);
        const klen = keys.length;
        let k = 0;
        for (; k < klen; ++k) {
          target[keys[k]] = clone$1(source[keys[k]]);
        }
        return target;
      }
      return source;
    }
    function isValidKey(key) {
      return ['__proto__', 'prototype', 'constructor'].indexOf(key) === -1;
    }
    function _merger(key, target, source, options) {
      if (!isValidKey(key)) {
        return;
      }
      const tval = target[key];
      const sval = source[key];
      if (isObject(tval) && isObject(sval)) {
        merge(tval, sval, options);
      } else {
        target[key] = clone$1(sval);
      }
    }
    function merge(target, source, options) {
      const sources = isArray(source) ? source : [source];
      const ilen = sources.length;
      if (!isObject(target)) {
        return target;
      }
      options = options || {};
      const merger = options.merger || _merger;
      for (let i = 0; i < ilen; ++i) {
        source = sources[i];
        if (!isObject(source)) {
          continue;
        }
        const keys = Object.keys(source);
        for (let k = 0, klen = keys.length; k < klen; ++k) {
          merger(keys[k], target, source, options);
        }
      }
      return target;
    }
    function mergeIf(target, source) {
      return merge(target, source, {merger: _mergerIf});
    }
    function _mergerIf(key, target, source) {
      if (!isValidKey(key)) {
        return;
      }
      const tval = target[key];
      const sval = source[key];
      if (isObject(tval) && isObject(sval)) {
        mergeIf(tval, sval);
      } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
        target[key] = clone$1(sval);
      }
    }
    const emptyString = '';
    const dot = '.';
    function indexOfDotOrLength(key, start) {
      const idx = key.indexOf(dot, start);
      return idx === -1 ? key.length : idx;
    }
    function resolveObjectKey(obj, key) {
      if (key === emptyString) {
        return obj;
      }
      let pos = 0;
      let idx = indexOfDotOrLength(key, pos);
      while (obj && idx > pos) {
        obj = obj[key.substr(pos, idx - pos)];
        pos = idx + 1;
        idx = indexOfDotOrLength(key, pos);
      }
      return obj;
    }
    function _capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    const defined = (value) => typeof value !== 'undefined';
    const isFunction = (value) => typeof value === 'function';
    const setsEqual = (a, b) => {
      if (a.size !== b.size) {
        return false;
      }
      for (const item of a) {
        if (!b.has(item)) {
          return false;
        }
      }
      return true;
    };

    const PI = Math.PI;
    const TAU = 2 * PI;
    const PITAU = TAU + PI;
    const INFINITY = Number.POSITIVE_INFINITY;
    const RAD_PER_DEG = PI / 180;
    const HALF_PI = PI / 2;
    const QUARTER_PI = PI / 4;
    const TWO_THIRDS_PI = PI * 2 / 3;
    const log10 = Math.log10;
    const sign = Math.sign;
    function niceNum(range) {
      const niceRange = Math.pow(10, Math.floor(log10(range)));
      const fraction = range / niceRange;
      const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return niceFraction * niceRange;
    }
    function _factorize(value) {
      const result = [];
      const sqrt = Math.sqrt(value);
      let i;
      for (i = 1; i < sqrt; i++) {
        if (value % i === 0) {
          result.push(i);
          result.push(value / i);
        }
      }
      if (sqrt === (sqrt | 0)) {
        result.push(sqrt);
      }
      result.sort((a, b) => a - b).pop();
      return result;
    }
    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function almostEquals(x, y, epsilon) {
      return Math.abs(x - y) < epsilon;
    }
    function almostWhole(x, epsilon) {
      const rounded = Math.round(x);
      return ((rounded - epsilon) <= x) && ((rounded + epsilon) >= x);
    }
    function _setMinAndMaxByKey(array, target, property) {
      let i, ilen, value;
      for (i = 0, ilen = array.length; i < ilen; i++) {
        value = array[i][property];
        if (!isNaN(value)) {
          target.min = Math.min(target.min, value);
          target.max = Math.max(target.max, value);
        }
      }
    }
    function toRadians(degrees) {
      return degrees * (PI / 180);
    }
    function toDegrees(radians) {
      return radians * (180 / PI);
    }
    function _decimalPlaces(x) {
      if (!isNumberFinite(x)) {
        return;
      }
      let e = 1;
      let p = 0;
      while (Math.round(x * e) / e !== x) {
        e *= 10;
        p++;
      }
      return p;
    }
    function getAngleFromPoint(centrePoint, anglePoint) {
      const distanceFromXCenter = anglePoint.x - centrePoint.x;
      const distanceFromYCenter = anglePoint.y - centrePoint.y;
      const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
      let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
      if (angle < (-0.5 * PI)) {
        angle += TAU;
      }
      return {
        angle,
        distance: radialDistanceFromCenter
      };
    }
    function distanceBetweenPoints(pt1, pt2) {
      return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
    }
    function _angleDiff(a, b) {
      return (a - b + PITAU) % TAU - PI;
    }
    function _normalizeAngle(a) {
      return (a % TAU + TAU) % TAU;
    }
    function _angleBetween(angle, start, end) {
      const a = _normalizeAngle(angle);
      const s = _normalizeAngle(start);
      const e = _normalizeAngle(end);
      const angleToStart = _normalizeAngle(s - a);
      const angleToEnd = _normalizeAngle(e - a);
      const startToAngle = _normalizeAngle(a - s);
      const endToAngle = _normalizeAngle(a - e);
      return a === s || a === e || (angleToStart > angleToEnd && startToAngle < endToAngle);
    }
    function _limitValue(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
    function _int16Range(value) {
      return _limitValue(value, -32768, 32767);
    }

    const atEdge = (t) => t === 0 || t === 1;
    const elasticIn = (t, s, p) => -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
    const elasticOut = (t, s, p) => Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
    const effects = {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => -t * (t - 2),
      easeInOutQuad: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t
        : -0.5 * ((--t) * (t - 2) - 1),
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (t -= 1) * t * t + 1,
      easeInOutCubic: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t * t
        : 0.5 * ((t -= 2) * t * t + 2),
      easeInQuart: t => t * t * t * t,
      easeOutQuart: t => -((t -= 1) * t * t * t - 1),
      easeInOutQuart: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t * t * t
        : -0.5 * ((t -= 2) * t * t * t - 2),
      easeInQuint: t => t * t * t * t * t,
      easeOutQuint: t => (t -= 1) * t * t * t * t + 1,
      easeInOutQuint: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t * t * t * t
        : 0.5 * ((t -= 2) * t * t * t * t + 2),
      easeInSine: t => -Math.cos(t * HALF_PI) + 1,
      easeOutSine: t => Math.sin(t * HALF_PI),
      easeInOutSine: t => -0.5 * (Math.cos(PI * t) - 1),
      easeInExpo: t => (t === 0) ? 0 : Math.pow(2, 10 * (t - 1)),
      easeOutExpo: t => (t === 1) ? 1 : -Math.pow(2, -10 * t) + 1,
      easeInOutExpo: t => atEdge(t) ? t : t < 0.5
        ? 0.5 * Math.pow(2, 10 * (t * 2 - 1))
        : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
      easeInCirc: t => (t >= 1) ? t : -(Math.sqrt(1 - t * t) - 1),
      easeOutCirc: t => Math.sqrt(1 - (t -= 1) * t),
      easeInOutCirc: t => ((t /= 0.5) < 1)
        ? -0.5 * (Math.sqrt(1 - t * t) - 1)
        : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
      easeInElastic: t => atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
      easeOutElastic: t => atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
      easeInOutElastic(t) {
        const s = 0.1125;
        const p = 0.45;
        return atEdge(t) ? t :
          t < 0.5
            ? 0.5 * elasticIn(t * 2, s, p)
            : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
      },
      easeInBack(t) {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
      },
      easeOutBack(t) {
        const s = 1.70158;
        return (t -= 1) * t * ((s + 1) * t + s) + 1;
      },
      easeInOutBack(t) {
        let s = 1.70158;
        if ((t /= 0.5) < 1) {
          return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s));
        }
        return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
      },
      easeInBounce: t => 1 - effects.easeOutBounce(1 - t),
      easeOutBounce(t) {
        const m = 7.5625;
        const d = 2.75;
        if (t < (1 / d)) {
          return m * t * t;
        }
        if (t < (2 / d)) {
          return m * (t -= (1.5 / d)) * t + 0.75;
        }
        if (t < (2.5 / d)) {
          return m * (t -= (2.25 / d)) * t + 0.9375;
        }
        return m * (t -= (2.625 / d)) * t + 0.984375;
      },
      easeInOutBounce: t => (t < 0.5)
        ? effects.easeInBounce(t * 2) * 0.5
        : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
    };

    /*!
     * @kurkle/color v0.1.9
     * https://github.com/kurkle/color#readme
     * (c) 2020 Jukka Kurkela
     * Released under the MIT License
     */
    const map = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15};
    const hex = '0123456789ABCDEF';
    const h1 = (b) => hex[b & 0xF];
    const h2 = (b) => hex[(b & 0xF0) >> 4] + hex[b & 0xF];
    const eq = (b) => (((b & 0xF0) >> 4) === (b & 0xF));
    function isShort(v) {
    	return eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
    }
    function hexParse(str) {
    	var len = str.length;
    	var ret;
    	if (str[0] === '#') {
    		if (len === 4 || len === 5) {
    			ret = {
    				r: 255 & map[str[1]] * 17,
    				g: 255 & map[str[2]] * 17,
    				b: 255 & map[str[3]] * 17,
    				a: len === 5 ? map[str[4]] * 17 : 255
    			};
    		} else if (len === 7 || len === 9) {
    			ret = {
    				r: map[str[1]] << 4 | map[str[2]],
    				g: map[str[3]] << 4 | map[str[4]],
    				b: map[str[5]] << 4 | map[str[6]],
    				a: len === 9 ? (map[str[7]] << 4 | map[str[8]]) : 255
    			};
    		}
    	}
    	return ret;
    }
    function hexString(v) {
    	var f = isShort(v) ? h1 : h2;
    	return v
    		? '#' + f(v.r) + f(v.g) + f(v.b) + (v.a < 255 ? f(v.a) : '')
    		: v;
    }
    function round(v) {
    	return v + 0.5 | 0;
    }
    const lim = (v, l, h) => Math.max(Math.min(v, h), l);
    function p2b(v) {
    	return lim(round(v * 2.55), 0, 255);
    }
    function n2b(v) {
    	return lim(round(v * 255), 0, 255);
    }
    function b2n(v) {
    	return lim(round(v / 2.55) / 100, 0, 1);
    }
    function n2p(v) {
    	return lim(round(v * 100), 0, 100);
    }
    const RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
    function rgbParse(str) {
    	const m = RGB_RE.exec(str);
    	let a = 255;
    	let r, g, b;
    	if (!m) {
    		return;
    	}
    	if (m[7] !== r) {
    		const v = +m[7];
    		a = 255 & (m[8] ? p2b(v) : v * 255);
    	}
    	r = +m[1];
    	g = +m[3];
    	b = +m[5];
    	r = 255 & (m[2] ? p2b(r) : r);
    	g = 255 & (m[4] ? p2b(g) : g);
    	b = 255 & (m[6] ? p2b(b) : b);
    	return {
    		r: r,
    		g: g,
    		b: b,
    		a: a
    	};
    }
    function rgbString(v) {
    	return v && (
    		v.a < 255
    			? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})`
    			: `rgb(${v.r}, ${v.g}, ${v.b})`
    	);
    }
    const HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
    function hsl2rgbn(h, s, l) {
    	const a = s * Math.min(l, 1 - l);
    	const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    	return [f(0), f(8), f(4)];
    }
    function hsv2rgbn(h, s, v) {
    	const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    	return [f(5), f(3), f(1)];
    }
    function hwb2rgbn(h, w, b) {
    	const rgb = hsl2rgbn(h, 1, 0.5);
    	let i;
    	if (w + b > 1) {
    		i = 1 / (w + b);
    		w *= i;
    		b *= i;
    	}
    	for (i = 0; i < 3; i++) {
    		rgb[i] *= 1 - w - b;
    		rgb[i] += w;
    	}
    	return rgb;
    }
    function rgb2hsl(v) {
    	const range = 255;
    	const r = v.r / range;
    	const g = v.g / range;
    	const b = v.b / range;
    	const max = Math.max(r, g, b);
    	const min = Math.min(r, g, b);
    	const l = (max + min) / 2;
    	let h, s, d;
    	if (max !== min) {
    		d = max - min;
    		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    		h = max === r
    			? ((g - b) / d) + (g < b ? 6 : 0)
    			: max === g
    				? (b - r) / d + 2
    				: (r - g) / d + 4;
    		h = h * 60 + 0.5;
    	}
    	return [h | 0, s || 0, l];
    }
    function calln(f, a, b, c) {
    	return (
    		Array.isArray(a)
    			? f(a[0], a[1], a[2])
    			: f(a, b, c)
    	).map(n2b);
    }
    function hsl2rgb(h, s, l) {
    	return calln(hsl2rgbn, h, s, l);
    }
    function hwb2rgb(h, w, b) {
    	return calln(hwb2rgbn, h, w, b);
    }
    function hsv2rgb(h, s, v) {
    	return calln(hsv2rgbn, h, s, v);
    }
    function hue(h) {
    	return (h % 360 + 360) % 360;
    }
    function hueParse(str) {
    	const m = HUE_RE.exec(str);
    	let a = 255;
    	let v;
    	if (!m) {
    		return;
    	}
    	if (m[5] !== v) {
    		a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
    	}
    	const h = hue(+m[2]);
    	const p1 = +m[3] / 100;
    	const p2 = +m[4] / 100;
    	if (m[1] === 'hwb') {
    		v = hwb2rgb(h, p1, p2);
    	} else if (m[1] === 'hsv') {
    		v = hsv2rgb(h, p1, p2);
    	} else {
    		v = hsl2rgb(h, p1, p2);
    	}
    	return {
    		r: v[0],
    		g: v[1],
    		b: v[2],
    		a: a
    	};
    }
    function rotate(v, deg) {
    	var h = rgb2hsl(v);
    	h[0] = hue(h[0] + deg);
    	h = hsl2rgb(h);
    	v.r = h[0];
    	v.g = h[1];
    	v.b = h[2];
    }
    function hslString(v) {
    	if (!v) {
    		return;
    	}
    	const a = rgb2hsl(v);
    	const h = a[0];
    	const s = n2p(a[1]);
    	const l = n2p(a[2]);
    	return v.a < 255
    		? `hsla(${h}, ${s}%, ${l}%, ${b2n(v.a)})`
    		: `hsl(${h}, ${s}%, ${l}%)`;
    }
    const map$1 = {
    	x: 'dark',
    	Z: 'light',
    	Y: 're',
    	X: 'blu',
    	W: 'gr',
    	V: 'medium',
    	U: 'slate',
    	A: 'ee',
    	T: 'ol',
    	S: 'or',
    	B: 'ra',
    	C: 'lateg',
    	D: 'ights',
    	R: 'in',
    	Q: 'turquois',
    	E: 'hi',
    	P: 'ro',
    	O: 'al',
    	N: 'le',
    	M: 'de',
    	L: 'yello',
    	F: 'en',
    	K: 'ch',
    	G: 'arks',
    	H: 'ea',
    	I: 'ightg',
    	J: 'wh'
    };
    const names = {
    	OiceXe: 'f0f8ff',
    	antiquewEte: 'faebd7',
    	aqua: 'ffff',
    	aquamarRe: '7fffd4',
    	azuY: 'f0ffff',
    	beige: 'f5f5dc',
    	bisque: 'ffe4c4',
    	black: '0',
    	blanKedOmond: 'ffebcd',
    	Xe: 'ff',
    	XeviTet: '8a2be2',
    	bPwn: 'a52a2a',
    	burlywood: 'deb887',
    	caMtXe: '5f9ea0',
    	KartYuse: '7fff00',
    	KocTate: 'd2691e',
    	cSO: 'ff7f50',
    	cSnflowerXe: '6495ed',
    	cSnsilk: 'fff8dc',
    	crimson: 'dc143c',
    	cyan: 'ffff',
    	xXe: '8b',
    	xcyan: '8b8b',
    	xgTMnPd: 'b8860b',
    	xWay: 'a9a9a9',
    	xgYF: '6400',
    	xgYy: 'a9a9a9',
    	xkhaki: 'bdb76b',
    	xmagFta: '8b008b',
    	xTivegYF: '556b2f',
    	xSange: 'ff8c00',
    	xScEd: '9932cc',
    	xYd: '8b0000',
    	xsOmon: 'e9967a',
    	xsHgYF: '8fbc8f',
    	xUXe: '483d8b',
    	xUWay: '2f4f4f',
    	xUgYy: '2f4f4f',
    	xQe: 'ced1',
    	xviTet: '9400d3',
    	dAppRk: 'ff1493',
    	dApskyXe: 'bfff',
    	dimWay: '696969',
    	dimgYy: '696969',
    	dodgerXe: '1e90ff',
    	fiYbrick: 'b22222',
    	flSOwEte: 'fffaf0',
    	foYstWAn: '228b22',
    	fuKsia: 'ff00ff',
    	gaRsbSo: 'dcdcdc',
    	ghostwEte: 'f8f8ff',
    	gTd: 'ffd700',
    	gTMnPd: 'daa520',
    	Way: '808080',
    	gYF: '8000',
    	gYFLw: 'adff2f',
    	gYy: '808080',
    	honeyMw: 'f0fff0',
    	hotpRk: 'ff69b4',
    	RdianYd: 'cd5c5c',
    	Rdigo: '4b0082',
    	ivSy: 'fffff0',
    	khaki: 'f0e68c',
    	lavFMr: 'e6e6fa',
    	lavFMrXsh: 'fff0f5',
    	lawngYF: '7cfc00',
    	NmoncEffon: 'fffacd',
    	ZXe: 'add8e6',
    	ZcSO: 'f08080',
    	Zcyan: 'e0ffff',
    	ZgTMnPdLw: 'fafad2',
    	ZWay: 'd3d3d3',
    	ZgYF: '90ee90',
    	ZgYy: 'd3d3d3',
    	ZpRk: 'ffb6c1',
    	ZsOmon: 'ffa07a',
    	ZsHgYF: '20b2aa',
    	ZskyXe: '87cefa',
    	ZUWay: '778899',
    	ZUgYy: '778899',
    	ZstAlXe: 'b0c4de',
    	ZLw: 'ffffe0',
    	lime: 'ff00',
    	limegYF: '32cd32',
    	lRF: 'faf0e6',
    	magFta: 'ff00ff',
    	maPon: '800000',
    	VaquamarRe: '66cdaa',
    	VXe: 'cd',
    	VScEd: 'ba55d3',
    	VpurpN: '9370db',
    	VsHgYF: '3cb371',
    	VUXe: '7b68ee',
    	VsprRggYF: 'fa9a',
    	VQe: '48d1cc',
    	VviTetYd: 'c71585',
    	midnightXe: '191970',
    	mRtcYam: 'f5fffa',
    	mistyPse: 'ffe4e1',
    	moccasR: 'ffe4b5',
    	navajowEte: 'ffdead',
    	navy: '80',
    	Tdlace: 'fdf5e6',
    	Tive: '808000',
    	TivedBb: '6b8e23',
    	Sange: 'ffa500',
    	SangeYd: 'ff4500',
    	ScEd: 'da70d6',
    	pOegTMnPd: 'eee8aa',
    	pOegYF: '98fb98',
    	pOeQe: 'afeeee',
    	pOeviTetYd: 'db7093',
    	papayawEp: 'ffefd5',
    	pHKpuff: 'ffdab9',
    	peru: 'cd853f',
    	pRk: 'ffc0cb',
    	plum: 'dda0dd',
    	powMrXe: 'b0e0e6',
    	purpN: '800080',
    	YbeccapurpN: '663399',
    	Yd: 'ff0000',
    	Psybrown: 'bc8f8f',
    	PyOXe: '4169e1',
    	saddNbPwn: '8b4513',
    	sOmon: 'fa8072',
    	sandybPwn: 'f4a460',
    	sHgYF: '2e8b57',
    	sHshell: 'fff5ee',
    	siFna: 'a0522d',
    	silver: 'c0c0c0',
    	skyXe: '87ceeb',
    	UXe: '6a5acd',
    	UWay: '708090',
    	UgYy: '708090',
    	snow: 'fffafa',
    	sprRggYF: 'ff7f',
    	stAlXe: '4682b4',
    	tan: 'd2b48c',
    	teO: '8080',
    	tEstN: 'd8bfd8',
    	tomato: 'ff6347',
    	Qe: '40e0d0',
    	viTet: 'ee82ee',
    	JHt: 'f5deb3',
    	wEte: 'ffffff',
    	wEtesmoke: 'f5f5f5',
    	Lw: 'ffff00',
    	LwgYF: '9acd32'
    };
    function unpack() {
    	const unpacked = {};
    	const keys = Object.keys(names);
    	const tkeys = Object.keys(map$1);
    	let i, j, k, ok, nk;
    	for (i = 0; i < keys.length; i++) {
    		ok = nk = keys[i];
    		for (j = 0; j < tkeys.length; j++) {
    			k = tkeys[j];
    			nk = nk.replace(k, map$1[k]);
    		}
    		k = parseInt(names[ok], 16);
    		unpacked[nk] = [k >> 16 & 0xFF, k >> 8 & 0xFF, k & 0xFF];
    	}
    	return unpacked;
    }
    let names$1;
    function nameParse(str) {
    	if (!names$1) {
    		names$1 = unpack();
    		names$1.transparent = [0, 0, 0, 0];
    	}
    	const a = names$1[str.toLowerCase()];
    	return a && {
    		r: a[0],
    		g: a[1],
    		b: a[2],
    		a: a.length === 4 ? a[3] : 255
    	};
    }
    function modHSL(v, i, ratio) {
    	if (v) {
    		let tmp = rgb2hsl(v);
    		tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
    		tmp = hsl2rgb(tmp);
    		v.r = tmp[0];
    		v.g = tmp[1];
    		v.b = tmp[2];
    	}
    }
    function clone(v, proto) {
    	return v ? Object.assign(proto || {}, v) : v;
    }
    function fromObject(input) {
    	var v = {r: 0, g: 0, b: 0, a: 255};
    	if (Array.isArray(input)) {
    		if (input.length >= 3) {
    			v = {r: input[0], g: input[1], b: input[2], a: 255};
    			if (input.length > 3) {
    				v.a = n2b(input[3]);
    			}
    		}
    	} else {
    		v = clone(input, {r: 0, g: 0, b: 0, a: 1});
    		v.a = n2b(v.a);
    	}
    	return v;
    }
    function functionParse(str) {
    	if (str.charAt(0) === 'r') {
    		return rgbParse(str);
    	}
    	return hueParse(str);
    }
    class Color {
    	constructor(input) {
    		if (input instanceof Color) {
    			return input;
    		}
    		const type = typeof input;
    		let v;
    		if (type === 'object') {
    			v = fromObject(input);
    		} else if (type === 'string') {
    			v = hexParse(input) || nameParse(input) || functionParse(input);
    		}
    		this._rgb = v;
    		this._valid = !!v;
    	}
    	get valid() {
    		return this._valid;
    	}
    	get rgb() {
    		var v = clone(this._rgb);
    		if (v) {
    			v.a = b2n(v.a);
    		}
    		return v;
    	}
    	set rgb(obj) {
    		this._rgb = fromObject(obj);
    	}
    	rgbString() {
    		return this._valid ? rgbString(this._rgb) : this._rgb;
    	}
    	hexString() {
    		return this._valid ? hexString(this._rgb) : this._rgb;
    	}
    	hslString() {
    		return this._valid ? hslString(this._rgb) : this._rgb;
    	}
    	mix(color, weight) {
    		const me = this;
    		if (color) {
    			const c1 = me.rgb;
    			const c2 = color.rgb;
    			let w2;
    			const p = weight === w2 ? 0.5 : weight;
    			const w = 2 * p - 1;
    			const a = c1.a - c2.a;
    			const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
    			w2 = 1 - w1;
    			c1.r = 0xFF & w1 * c1.r + w2 * c2.r + 0.5;
    			c1.g = 0xFF & w1 * c1.g + w2 * c2.g + 0.5;
    			c1.b = 0xFF & w1 * c1.b + w2 * c2.b + 0.5;
    			c1.a = p * c1.a + (1 - p) * c2.a;
    			me.rgb = c1;
    		}
    		return me;
    	}
    	clone() {
    		return new Color(this.rgb);
    	}
    	alpha(a) {
    		this._rgb.a = n2b(a);
    		return this;
    	}
    	clearer(ratio) {
    		const rgb = this._rgb;
    		rgb.a *= 1 - ratio;
    		return this;
    	}
    	greyscale() {
    		const rgb = this._rgb;
    		const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
    		rgb.r = rgb.g = rgb.b = val;
    		return this;
    	}
    	opaquer(ratio) {
    		const rgb = this._rgb;
    		rgb.a *= 1 + ratio;
    		return this;
    	}
    	negate() {
    		const v = this._rgb;
    		v.r = 255 - v.r;
    		v.g = 255 - v.g;
    		v.b = 255 - v.b;
    		return this;
    	}
    	lighten(ratio) {
    		modHSL(this._rgb, 2, ratio);
    		return this;
    	}
    	darken(ratio) {
    		modHSL(this._rgb, 2, -ratio);
    		return this;
    	}
    	saturate(ratio) {
    		modHSL(this._rgb, 1, ratio);
    		return this;
    	}
    	desaturate(ratio) {
    		modHSL(this._rgb, 1, -ratio);
    		return this;
    	}
    	rotate(deg) {
    		rotate(this._rgb, deg);
    		return this;
    	}
    }
    function index_esm(input) {
    	return new Color(input);
    }

    const isPatternOrGradient = (value) => value instanceof CanvasGradient || value instanceof CanvasPattern;
    function color(value) {
      return isPatternOrGradient(value) ? value : index_esm(value);
    }
    function getHoverColor(value) {
      return isPatternOrGradient(value)
        ? value
        : index_esm(value).saturate(0.5).darken(0.1).hexString();
    }

    const overrides = Object.create(null);
    const descriptors = Object.create(null);
    function getScope$1(node, key) {
      if (!key) {
        return node;
      }
      const keys = key.split('.');
      for (let i = 0, n = keys.length; i < n; ++i) {
        const k = keys[i];
        node = node[k] || (node[k] = Object.create(null));
      }
      return node;
    }
    function set(root, scope, values) {
      if (typeof scope === 'string') {
        return merge(getScope$1(root, scope), values);
      }
      return merge(getScope$1(root, ''), scope);
    }
    class Defaults {
      constructor(_descriptors) {
        this.animation = undefined;
        this.backgroundColor = 'rgba(0,0,0,0.1)';
        this.borderColor = 'rgba(0,0,0,0.1)';
        this.color = '#666';
        this.datasets = {};
        this.devicePixelRatio = (context) => context.chart.platform.getDevicePixelRatio();
        this.elements = {};
        this.events = [
          'mousemove',
          'mouseout',
          'click',
          'touchstart',
          'touchmove'
        ];
        this.font = {
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 12,
          style: 'normal',
          lineHeight: 1.2,
          weight: null
        };
        this.hover = {};
        this.hoverBackgroundColor = (ctx, options) => getHoverColor(options.backgroundColor);
        this.hoverBorderColor = (ctx, options) => getHoverColor(options.borderColor);
        this.hoverColor = (ctx, options) => getHoverColor(options.color);
        this.indexAxis = 'x';
        this.interaction = {
          mode: 'nearest',
          intersect: true
        };
        this.maintainAspectRatio = true;
        this.onHover = null;
        this.onClick = null;
        this.parsing = true;
        this.plugins = {};
        this.responsive = true;
        this.scale = undefined;
        this.scales = {};
        this.showLine = true;
        this.describe(_descriptors);
      }
      set(scope, values) {
        return set(this, scope, values);
      }
      get(scope) {
        return getScope$1(this, scope);
      }
      describe(scope, values) {
        return set(descriptors, scope, values);
      }
      override(scope, values) {
        return set(overrides, scope, values);
      }
      route(scope, name, targetScope, targetName) {
        const scopeObject = getScope$1(this, scope);
        const targetScopeObject = getScope$1(this, targetScope);
        const privateName = '_' + name;
        Object.defineProperties(scopeObject, {
          [privateName]: {
            value: scopeObject[name],
            writable: true
          },
          [name]: {
            enumerable: true,
            get() {
              const local = this[privateName];
              const target = targetScopeObject[targetName];
              if (isObject(local)) {
                return Object.assign({}, target, local);
              }
              return valueOrDefault(local, target);
            },
            set(value) {
              this[privateName] = value;
            }
          }
        });
      }
    }
    var defaults = new Defaults({
      _scriptable: (name) => !name.startsWith('on'),
      _indexable: (name) => name !== 'events',
      hover: {
        _fallback: 'interaction'
      },
      interaction: {
        _scriptable: false,
        _indexable: false,
      }
    });

    function toFontString(font) {
      if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
        return null;
      }
      return (font.style ? font.style + ' ' : '')
    		+ (font.weight ? font.weight + ' ' : '')
    		+ font.size + 'px '
    		+ font.family;
    }
    function _measureText(ctx, data, gc, longest, string) {
      let textWidth = data[string];
      if (!textWidth) {
        textWidth = data[string] = ctx.measureText(string).width;
        gc.push(string);
      }
      if (textWidth > longest) {
        longest = textWidth;
      }
      return longest;
    }
    function _longestText(ctx, font, arrayOfThings, cache) {
      cache = cache || {};
      let data = cache.data = cache.data || {};
      let gc = cache.garbageCollect = cache.garbageCollect || [];
      if (cache.font !== font) {
        data = cache.data = {};
        gc = cache.garbageCollect = [];
        cache.font = font;
      }
      ctx.save();
      ctx.font = font;
      let longest = 0;
      const ilen = arrayOfThings.length;
      let i, j, jlen, thing, nestedThing;
      for (i = 0; i < ilen; i++) {
        thing = arrayOfThings[i];
        if (thing !== undefined && thing !== null && isArray(thing) !== true) {
          longest = _measureText(ctx, data, gc, longest, thing);
        } else if (isArray(thing)) {
          for (j = 0, jlen = thing.length; j < jlen; j++) {
            nestedThing = thing[j];
            if (nestedThing !== undefined && nestedThing !== null && !isArray(nestedThing)) {
              longest = _measureText(ctx, data, gc, longest, nestedThing);
            }
          }
        }
      }
      ctx.restore();
      const gcLen = gc.length / 2;
      if (gcLen > arrayOfThings.length) {
        for (i = 0; i < gcLen; i++) {
          delete data[gc[i]];
        }
        gc.splice(0, gcLen);
      }
      return longest;
    }
    function _alignPixel(chart, pixel, width) {
      const devicePixelRatio = chart.currentDevicePixelRatio;
      const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
      return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
    }
    function clearCanvas(canvas, ctx) {
      ctx = ctx || canvas.getContext('2d');
      ctx.save();
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    function drawPoint(ctx, options, x, y) {
      let type, xOffset, yOffset, size, cornerRadius;
      const style = options.pointStyle;
      const rotation = options.rotation;
      const radius = options.radius;
      let rad = (rotation || 0) * RAD_PER_DEG;
      if (style && typeof style === 'object') {
        type = style.toString();
        if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rad);
          ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
          ctx.restore();
          return;
        }
      }
      if (isNaN(radius) || radius <= 0) {
        return;
      }
      ctx.beginPath();
      switch (style) {
      default:
        ctx.arc(x, y, radius, 0, TAU);
        ctx.closePath();
        break;
      case 'triangle':
        ctx.moveTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        ctx.closePath();
        break;
      case 'rectRounded':
        cornerRadius = radius * 0.516;
        size = radius - cornerRadius;
        xOffset = Math.cos(rad + QUARTER_PI) * size;
        yOffset = Math.sin(rad + QUARTER_PI) * size;
        ctx.arc(x - xOffset, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
        ctx.arc(x + yOffset, y - xOffset, cornerRadius, rad - HALF_PI, rad);
        ctx.arc(x + xOffset, y + yOffset, cornerRadius, rad, rad + HALF_PI);
        ctx.arc(x - yOffset, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
        ctx.closePath();
        break;
      case 'rect':
        if (!rotation) {
          size = Math.SQRT1_2 * radius;
          ctx.rect(x - size, y - size, 2 * size, 2 * size);
          break;
        }
        rad += QUARTER_PI;
      case 'rectRot':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + yOffset, y - xOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        ctx.closePath();
        break;
      case 'crossRot':
        rad += QUARTER_PI;
      case 'cross':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        break;
      case 'star':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        rad += QUARTER_PI;
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        break;
      case 'line':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        break;
      case 'dash':
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(rad) * radius, y + Math.sin(rad) * radius);
        break;
      }
      ctx.fill();
      if (options.borderWidth > 0) {
        ctx.stroke();
      }
    }
    function _isPointInArea(point, area, margin) {
      margin = margin || 0.5;
      return point && point.x > area.left - margin && point.x < area.right + margin &&
    		point.y > area.top - margin && point.y < area.bottom + margin;
    }
    function clipArea(ctx, area) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
      ctx.clip();
    }
    function unclipArea(ctx) {
      ctx.restore();
    }
    function _steppedLineTo(ctx, previous, target, flip, mode) {
      if (!previous) {
        return ctx.lineTo(target.x, target.y);
      }
      if (mode === 'middle') {
        const midpoint = (previous.x + target.x) / 2.0;
        ctx.lineTo(midpoint, previous.y);
        ctx.lineTo(midpoint, target.y);
      } else if (mode === 'after' !== !!flip) {
        ctx.lineTo(previous.x, target.y);
      } else {
        ctx.lineTo(target.x, previous.y);
      }
      ctx.lineTo(target.x, target.y);
    }
    function _bezierCurveTo(ctx, previous, target, flip) {
      if (!previous) {
        return ctx.lineTo(target.x, target.y);
      }
      ctx.bezierCurveTo(
        flip ? previous.cp1x : previous.cp2x,
        flip ? previous.cp1y : previous.cp2y,
        flip ? target.cp2x : target.cp1x,
        flip ? target.cp2y : target.cp1y,
        target.x,
        target.y);
    }
    function renderText(ctx, text, x, y, font, opts = {}) {
      const lines = isArray(text) ? text : [text];
      const stroke = opts.strokeWidth > 0 && opts.strokeColor !== '';
      let i, line;
      ctx.save();
      if (opts.translation) {
        ctx.translate(opts.translation[0], opts.translation[1]);
      }
      if (!isNullOrUndef(opts.rotation)) {
        ctx.rotate(opts.rotation);
      }
      ctx.font = font.string;
      if (opts.color) {
        ctx.fillStyle = opts.color;
      }
      if (opts.textAlign) {
        ctx.textAlign = opts.textAlign;
      }
      if (opts.textBaseline) {
        ctx.textBaseline = opts.textBaseline;
      }
      for (i = 0; i < lines.length; ++i) {
        line = lines[i];
        if (stroke) {
          if (opts.strokeColor) {
            ctx.strokeStyle = opts.strokeColor;
          }
          if (!isNullOrUndef(opts.strokeWidth)) {
            ctx.lineWidth = opts.strokeWidth;
          }
          ctx.strokeText(line, x, y, opts.maxWidth);
        }
        ctx.fillText(line, x, y, opts.maxWidth);
        if (opts.strikethrough || opts.underline) {
          const metrics = ctx.measureText(line);
          const left = x - metrics.actualBoundingBoxLeft;
          const right = x + metrics.actualBoundingBoxRight;
          const top = y - metrics.actualBoundingBoxAscent;
          const bottom = y + metrics.actualBoundingBoxDescent;
          const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath();
          ctx.lineWidth = opts.decorationWidth || 2;
          ctx.moveTo(left, yDecoration);
          ctx.lineTo(right, yDecoration);
          ctx.stroke();
        }
        y += font.lineHeight;
      }
      ctx.restore();
    }
    function addRoundedRectPath(ctx, rect) {
      const {x, y, w, h, radius} = rect;
      ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, -HALF_PI, PI, true);
      ctx.lineTo(x, y + h - radius.bottomLeft);
      ctx.arc(x + radius.bottomLeft, y + h - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
      ctx.lineTo(x + w - radius.bottomRight, y + h);
      ctx.arc(x + w - radius.bottomRight, y + h - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
      ctx.lineTo(x + w, y + radius.topRight);
      ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
      ctx.lineTo(x + radius.topLeft, y);
    }

    const LINE_HEIGHT = new RegExp(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/);
    const FONT_STYLE = new RegExp(/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/);
    function toLineHeight(value, size) {
      const matches = ('' + value).match(LINE_HEIGHT);
      if (!matches || matches[1] === 'normal') {
        return size * 1.2;
      }
      value = +matches[2];
      switch (matches[3]) {
      case 'px':
        return value;
      case '%':
        value /= 100;
        break;
      }
      return size * value;
    }
    const numberOrZero$1 = v => +v || 0;
    function _readValueToProps(value, props) {
      const ret = {};
      const objProps = isObject(props);
      const keys = objProps ? Object.keys(props) : props;
      const read = isObject(value)
        ? objProps
          ? prop => valueOrDefault(value[prop], value[props[prop]])
          : prop => value[prop]
        : () => value;
      for (const prop of keys) {
        ret[prop] = numberOrZero$1(read(prop));
      }
      return ret;
    }
    function toTRBL(value) {
      return _readValueToProps(value, {top: 'y', right: 'x', bottom: 'y', left: 'x'});
    }
    function toTRBLCorners(value) {
      return _readValueToProps(value, ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
    }
    function toPadding(value) {
      const obj = toTRBL(value);
      obj.width = obj.left + obj.right;
      obj.height = obj.top + obj.bottom;
      return obj;
    }
    function toFont(options, fallback) {
      options = options || {};
      fallback = fallback || defaults.font;
      let size = valueOrDefault(options.size, fallback.size);
      if (typeof size === 'string') {
        size = parseInt(size, 10);
      }
      let style = valueOrDefault(options.style, fallback.style);
      if (style && !('' + style).match(FONT_STYLE)) {
        console.warn('Invalid font style specified: "' + style + '"');
        style = '';
      }
      const font = {
        family: valueOrDefault(options.family, fallback.family),
        lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
        size,
        style,
        weight: valueOrDefault(options.weight, fallback.weight),
        string: ''
      };
      font.string = toFontString(font);
      return font;
    }
    function resolve(inputs, context, index, info) {
      let cacheable = true;
      let i, ilen, value;
      for (i = 0, ilen = inputs.length; i < ilen; ++i) {
        value = inputs[i];
        if (value === undefined) {
          continue;
        }
        if (context !== undefined && typeof value === 'function') {
          value = value(context);
          cacheable = false;
        }
        if (index !== undefined && isArray(value)) {
          value = value[index % value.length];
          cacheable = false;
        }
        if (value !== undefined) {
          if (info && !cacheable) {
            info.cacheable = false;
          }
          return value;
        }
      }
    }
    function _addGrace(minmax, grace) {
      const {min, max} = minmax;
      return {
        min: min - Math.abs(toDimension(grace, min)),
        max: max + toDimension(grace, max)
      };
    }

    function _lookup(table, value, cmp) {
      cmp = cmp || ((index) => table[index] < value);
      let hi = table.length - 1;
      let lo = 0;
      let mid;
      while (hi - lo > 1) {
        mid = (lo + hi) >> 1;
        if (cmp(mid)) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return {lo, hi};
    }
    const _lookupByKey = (table, key, value) =>
      _lookup(table, value, index => table[index][key] < value);
    const _rlookupByKey = (table, key, value) =>
      _lookup(table, value, index => table[index][key] >= value);
    function _filterBetween(values, min, max) {
      let start = 0;
      let end = values.length;
      while (start < end && values[start] < min) {
        start++;
      }
      while (end > start && values[end - 1] > max) {
        end--;
      }
      return start > 0 || end < values.length
        ? values.slice(start, end)
        : values;
    }
    const arrayEvents = ['push', 'pop', 'shift', 'splice', 'unshift'];
    function listenArrayEvents(array, listener) {
      if (array._chartjs) {
        array._chartjs.listeners.push(listener);
        return;
      }
      Object.defineProperty(array, '_chartjs', {
        configurable: true,
        enumerable: false,
        value: {
          listeners: [listener]
        }
      });
      arrayEvents.forEach((key) => {
        const method = '_onData' + _capitalize(key);
        const base = array[key];
        Object.defineProperty(array, key, {
          configurable: true,
          enumerable: false,
          value(...args) {
            const res = base.apply(this, args);
            array._chartjs.listeners.forEach((object) => {
              if (typeof object[method] === 'function') {
                object[method](...args);
              }
            });
            return res;
          }
        });
      });
    }
    function unlistenArrayEvents(array, listener) {
      const stub = array._chartjs;
      if (!stub) {
        return;
      }
      const listeners = stub.listeners;
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length > 0) {
        return;
      }
      arrayEvents.forEach((key) => {
        delete array[key];
      });
      delete array._chartjs;
    }
    function _arrayUnique(items) {
      const set = new Set();
      let i, ilen;
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        set.add(items[i]);
      }
      if (set.size === ilen) {
        return items;
      }
      const result = [];
      set.forEach(item => {
        result.push(item);
      });
      return result;
    }

    function _createResolver(scopes, prefixes = [''], rootScopes = scopes, fallback, getTarget = () => scopes[0]) {
      if (!defined(fallback)) {
        fallback = _resolve('_fallback', scopes);
      }
      const cache = {
        [Symbol.toStringTag]: 'Object',
        _cacheable: true,
        _scopes: scopes,
        _rootScopes: rootScopes,
        _fallback: fallback,
        _getTarget: getTarget,
        override: (scope) => _createResolver([scope, ...scopes], prefixes, rootScopes, fallback),
      };
      return new Proxy(cache, {
        deleteProperty(target, prop) {
          delete target[prop];
          delete target._keys;
          delete scopes[0][prop];
          return true;
        },
        get(target, prop) {
          return _cached(target, prop,
            () => _resolveWithPrefixes(prop, prefixes, scopes, target));
        },
        getOwnPropertyDescriptor(target, prop) {
          return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
        },
        getPrototypeOf() {
          return Reflect.getPrototypeOf(scopes[0]);
        },
        has(target, prop) {
          return getKeysFromAllScopes(target).includes(prop);
        },
        ownKeys(target) {
          return getKeysFromAllScopes(target);
        },
        set(target, prop, value) {
          const storage = target._storage || (target._storage = getTarget());
          storage[prop] = value;
          delete target[prop];
          delete target._keys;
          return true;
        }
      });
    }
    function _attachContext(proxy, context, subProxy, descriptorDefaults) {
      const cache = {
        _cacheable: false,
        _proxy: proxy,
        _context: context,
        _subProxy: subProxy,
        _stack: new Set(),
        _descriptors: _descriptors(proxy, descriptorDefaults),
        setContext: (ctx) => _attachContext(proxy, ctx, subProxy, descriptorDefaults),
        override: (scope) => _attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
      };
      return new Proxy(cache, {
        deleteProperty(target, prop) {
          delete target[prop];
          delete proxy[prop];
          return true;
        },
        get(target, prop, receiver) {
          return _cached(target, prop,
            () => _resolveWithContext(target, prop, receiver));
        },
        getOwnPropertyDescriptor(target, prop) {
          return target._descriptors.allKeys
            ? Reflect.has(proxy, prop) ? {enumerable: true, configurable: true} : undefined
            : Reflect.getOwnPropertyDescriptor(proxy, prop);
        },
        getPrototypeOf() {
          return Reflect.getPrototypeOf(proxy);
        },
        has(target, prop) {
          return Reflect.has(proxy, prop);
        },
        ownKeys() {
          return Reflect.ownKeys(proxy);
        },
        set(target, prop, value) {
          proxy[prop] = value;
          delete target[prop];
          return true;
        }
      });
    }
    function _descriptors(proxy, defaults = {scriptable: true, indexable: true}) {
      const {_scriptable = defaults.scriptable, _indexable = defaults.indexable, _allKeys = defaults.allKeys} = proxy;
      return {
        allKeys: _allKeys,
        scriptable: _scriptable,
        indexable: _indexable,
        isScriptable: isFunction(_scriptable) ? _scriptable : () => _scriptable,
        isIndexable: isFunction(_indexable) ? _indexable : () => _indexable
      };
    }
    const readKey = (prefix, name) => prefix ? prefix + _capitalize(name) : name;
    const needsSubResolver = (prop, value) => isObject(value) && prop !== 'adapters';
    function _cached(target, prop, resolve) {
      let value = target[prop];
      if (defined(value)) {
        return value;
      }
      value = resolve();
      if (defined(value)) {
        target[prop] = value;
      }
      return value;
    }
    function _resolveWithContext(target, prop, receiver) {
      const {_proxy, _context, _subProxy, _descriptors: descriptors} = target;
      let value = _proxy[prop];
      if (isFunction(value) && descriptors.isScriptable(prop)) {
        value = _resolveScriptable(prop, value, target, receiver);
      }
      if (isArray(value) && value.length) {
        value = _resolveArray(prop, value, target, descriptors.isIndexable);
      }
      if (needsSubResolver(prop, value)) {
        value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors);
      }
      return value;
    }
    function _resolveScriptable(prop, value, target, receiver) {
      const {_proxy, _context, _subProxy, _stack} = target;
      if (_stack.has(prop)) {
        throw new Error('Recursion detected: ' + [..._stack].join('->') + '->' + prop);
      }
      _stack.add(prop);
      value = value(_context, _subProxy || receiver);
      _stack.delete(prop);
      if (isObject(value)) {
        value = createSubResolver(_proxy._scopes, _proxy, prop, value);
      }
      return value;
    }
    function _resolveArray(prop, value, target, isIndexable) {
      const {_proxy, _context, _subProxy, _descriptors: descriptors} = target;
      if (defined(_context.index) && isIndexable(prop)) {
        value = value[_context.index % value.length];
      } else if (isObject(value[0])) {
        const arr = value;
        const scopes = _proxy._scopes.filter(s => s !== arr);
        value = [];
        for (const item of arr) {
          const resolver = createSubResolver(scopes, _proxy, prop, item);
          value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors));
        }
      }
      return value;
    }
    function resolveFallback(fallback, prop, value) {
      return isFunction(fallback) ? fallback(prop, value) : fallback;
    }
    const getScope = (key, parent) => key === true ? parent
      : typeof key === 'string' ? resolveObjectKey(parent, key) : undefined;
    function addScopes(set, parentScopes, key, parentFallback) {
      for (const parent of parentScopes) {
        const scope = getScope(key, parent);
        if (scope) {
          set.add(scope);
          const fallback = resolveFallback(scope._fallback, key, scope);
          if (defined(fallback) && fallback !== key && fallback !== parentFallback) {
            return fallback;
          }
        } else if (scope === false && defined(parentFallback) && key !== parentFallback) {
          return null;
        }
      }
      return false;
    }
    function createSubResolver(parentScopes, resolver, prop, value) {
      const rootScopes = resolver._rootScopes;
      const fallback = resolveFallback(resolver._fallback, prop, value);
      const allScopes = [...parentScopes, ...rootScopes];
      const set = new Set();
      set.add(value);
      let key = addScopesFromKey(set, allScopes, prop, fallback || prop);
      if (key === null) {
        return false;
      }
      if (defined(fallback) && fallback !== prop) {
        key = addScopesFromKey(set, allScopes, fallback, key);
        if (key === null) {
          return false;
        }
      }
      return _createResolver([...set], [''], rootScopes, fallback, () => {
        const parent = resolver._getTarget();
        if (!(prop in parent)) {
          parent[prop] = {};
        }
        return parent[prop];
      });
    }
    function addScopesFromKey(set, allScopes, key, fallback) {
      while (key) {
        key = addScopes(set, allScopes, key, fallback);
      }
      return key;
    }
    function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
      let value;
      for (const prefix of prefixes) {
        value = _resolve(readKey(prefix, prop), scopes);
        if (defined(value)) {
          return needsSubResolver(prop, value)
            ? createSubResolver(scopes, proxy, prop, value)
            : value;
        }
      }
    }
    function _resolve(key, scopes) {
      for (const scope of scopes) {
        if (!scope) {
          continue;
        }
        const value = scope[key];
        if (defined(value)) {
          return value;
        }
      }
    }
    function getKeysFromAllScopes(target) {
      let keys = target._keys;
      if (!keys) {
        keys = target._keys = resolveKeysFromAllScopes(target._scopes);
      }
      return keys;
    }
    function resolveKeysFromAllScopes(scopes) {
      const set = new Set();
      for (const scope of scopes) {
        for (const key of Object.keys(scope).filter(k => !k.startsWith('_'))) {
          set.add(key);
        }
      }
      return [...set];
    }

    const EPSILON = Number.EPSILON || 1e-14;
    const getPoint = (points, i) => i < points.length && !points[i].skip && points[i];
    function splineCurve(firstPoint, middlePoint, afterPoint, t) {
      const previous = firstPoint.skip ? middlePoint : firstPoint;
      const current = middlePoint;
      const next = afterPoint.skip ? middlePoint : afterPoint;
      const d01 = distanceBetweenPoints(current, previous);
      const d12 = distanceBetweenPoints(next, current);
      let s01 = d01 / (d01 + d12);
      let s12 = d12 / (d01 + d12);
      s01 = isNaN(s01) ? 0 : s01;
      s12 = isNaN(s12) ? 0 : s12;
      const fa = t * s01;
      const fb = t * s12;
      return {
        previous: {
          x: current.x - fa * (next.x - previous.x),
          y: current.y - fa * (next.y - previous.y)
        },
        next: {
          x: current.x + fb * (next.x - previous.x),
          y: current.y + fb * (next.y - previous.y)
        }
      };
    }
    function monotoneAdjust(points, deltaK, mK) {
      const pointsLen = points.length;
      let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for (let i = 0; i < pointsLen - 1; ++i) {
        pointCurrent = pointAfter;
        pointAfter = getPoint(points, i + 1);
        if (!pointCurrent || !pointAfter) {
          continue;
        }
        if (almostEquals(deltaK[i], 0, EPSILON)) {
          mK[i] = mK[i + 1] = 0;
          continue;
        }
        alphaK = mK[i] / deltaK[i];
        betaK = mK[i + 1] / deltaK[i];
        squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
        if (squaredMagnitude <= 9) {
          continue;
        }
        tauK = 3 / Math.sqrt(squaredMagnitude);
        mK[i] = alphaK * tauK * deltaK[i];
        mK[i + 1] = betaK * tauK * deltaK[i];
      }
    }
    function monotoneCompute(points, mK) {
      const pointsLen = points.length;
      let deltaX, pointBefore, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for (let i = 0; i < pointsLen; ++i) {
        pointBefore = pointCurrent;
        pointCurrent = pointAfter;
        pointAfter = getPoint(points, i + 1);
        if (!pointCurrent) {
          continue;
        }
        const {x, y} = pointCurrent;
        if (pointBefore) {
          deltaX = (x - pointBefore.x) / 3;
          pointCurrent.cp1x = x - deltaX;
          pointCurrent.cp1y = y - deltaX * mK[i];
        }
        if (pointAfter) {
          deltaX = (pointAfter.x - x) / 3;
          pointCurrent.cp2x = x + deltaX;
          pointCurrent.cp2y = y + deltaX * mK[i];
        }
      }
    }
    function splineCurveMonotone(points) {
      const pointsLen = points.length;
      const deltaK = Array(pointsLen).fill(0);
      const mK = Array(pointsLen);
      let i, pointBefore, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for (i = 0; i < pointsLen; ++i) {
        pointBefore = pointCurrent;
        pointCurrent = pointAfter;
        pointAfter = getPoint(points, i + 1);
        if (!pointCurrent) {
          continue;
        }
        if (pointAfter) {
          const slopeDeltaX = (pointAfter.x - pointCurrent.x);
          deltaK[i] = slopeDeltaX !== 0 ? (pointAfter.y - pointCurrent.y) / slopeDeltaX : 0;
        }
        mK[i] = !pointBefore ? deltaK[i]
          : !pointAfter ? deltaK[i - 1]
          : (sign(deltaK[i - 1]) !== sign(deltaK[i])) ? 0
          : (deltaK[i - 1] + deltaK[i]) / 2;
      }
      monotoneAdjust(points, deltaK, mK);
      monotoneCompute(points, mK);
    }
    function capControlPoint(pt, min, max) {
      return Math.max(Math.min(pt, max), min);
    }
    function capBezierPoints(points, area) {
      let i, ilen, point, inArea, inAreaPrev;
      let inAreaNext = _isPointInArea(points[0], area);
      for (i = 0, ilen = points.length; i < ilen; ++i) {
        inAreaPrev = inArea;
        inArea = inAreaNext;
        inAreaNext = i < ilen - 1 && _isPointInArea(points[i + 1], area);
        if (!inArea) {
          continue;
        }
        point = points[i];
        if (inAreaPrev) {
          point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
          point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
        }
        if (inAreaNext) {
          point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
          point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
        }
      }
    }
    function _updateBezierControlPoints(points, options, area, loop) {
      let i, ilen, point, controlPoints;
      if (options.spanGaps) {
        points = points.filter((pt) => !pt.skip);
      }
      if (options.cubicInterpolationMode === 'monotone') {
        splineCurveMonotone(points);
      } else {
        let prev = loop ? points[points.length - 1] : points[0];
        for (i = 0, ilen = points.length; i < ilen; ++i) {
          point = points[i];
          controlPoints = splineCurve(
            prev,
            point,
            points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen],
            options.tension
          );
          point.cp1x = controlPoints.previous.x;
          point.cp1y = controlPoints.previous.y;
          point.cp2x = controlPoints.next.x;
          point.cp2y = controlPoints.next.y;
          prev = point;
        }
      }
      if (options.capBezierPoints) {
        capBezierPoints(points, area);
      }
    }

    function _getParentNode(domNode) {
      let parent = domNode.parentNode;
      if (parent && parent.toString() === '[object ShadowRoot]') {
        parent = parent.host;
      }
      return parent;
    }
    function parseMaxStyle(styleValue, node, parentProperty) {
      let valueInPixels;
      if (typeof styleValue === 'string') {
        valueInPixels = parseInt(styleValue, 10);
        if (styleValue.indexOf('%') !== -1) {
          valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
        }
      } else {
        valueInPixels = styleValue;
      }
      return valueInPixels;
    }
    const getComputedStyle = (element) => window.getComputedStyle(element, null);
    function getStyle(el, property) {
      return getComputedStyle(el).getPropertyValue(property);
    }
    const positions = ['top', 'right', 'bottom', 'left'];
    function getPositionedStyle(styles, style, suffix) {
      const result = {};
      suffix = suffix ? '-' + suffix : '';
      for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        result[pos] = parseFloat(styles[style + '-' + pos + suffix]) || 0;
      }
      result.width = result.left + result.right;
      result.height = result.top + result.bottom;
      return result;
    }
    const useOffsetPos = (x, y, target) => (x > 0 || y > 0) && (!target || !target.shadowRoot);
    function getCanvasPosition(evt, canvas) {
      const e = evt.native || evt;
      const touches = e.touches;
      const source = touches && touches.length ? touches[0] : e;
      const {offsetX, offsetY} = source;
      let box = false;
      let x, y;
      if (useOffsetPos(offsetX, offsetY, e.target)) {
        x = offsetX;
        y = offsetY;
      } else {
        const rect = canvas.getBoundingClientRect();
        x = source.clientX - rect.left;
        y = source.clientY - rect.top;
        box = true;
      }
      return {x, y, box};
    }
    function getRelativePosition$1(evt, chart) {
      const {canvas, currentDevicePixelRatio} = chart;
      const style = getComputedStyle(canvas);
      const borderBox = style.boxSizing === 'border-box';
      const paddings = getPositionedStyle(style, 'padding');
      const borders = getPositionedStyle(style, 'border', 'width');
      const {x, y, box} = getCanvasPosition(evt, canvas);
      const xOffset = paddings.left + (box && borders.left);
      const yOffset = paddings.top + (box && borders.top);
      let {width, height} = chart;
      if (borderBox) {
        width -= paddings.width + borders.width;
        height -= paddings.height + borders.height;
      }
      return {
        x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
        y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
      };
    }
    function getContainerSize(canvas, width, height) {
      let maxWidth, maxHeight;
      if (width === undefined || height === undefined) {
        const container = _getParentNode(canvas);
        if (!container) {
          width = canvas.clientWidth;
          height = canvas.clientHeight;
        } else {
          const rect = container.getBoundingClientRect();
          const containerStyle = getComputedStyle(container);
          const containerBorder = getPositionedStyle(containerStyle, 'border', 'width');
          const containerPadding = getPositionedStyle(containerStyle, 'padding');
          width = rect.width - containerPadding.width - containerBorder.width;
          height = rect.height - containerPadding.height - containerBorder.height;
          maxWidth = parseMaxStyle(containerStyle.maxWidth, container, 'clientWidth');
          maxHeight = parseMaxStyle(containerStyle.maxHeight, container, 'clientHeight');
        }
      }
      return {
        width,
        height,
        maxWidth: maxWidth || INFINITY,
        maxHeight: maxHeight || INFINITY
      };
    }
    const round1 = v => Math.round(v * 10) / 10;
    function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
      const style = getComputedStyle(canvas);
      const margins = getPositionedStyle(style, 'margin');
      const maxWidth = parseMaxStyle(style.maxWidth, canvas, 'clientWidth') || INFINITY;
      const maxHeight = parseMaxStyle(style.maxHeight, canvas, 'clientHeight') || INFINITY;
      const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
      let {width, height} = containerSize;
      if (style.boxSizing === 'content-box') {
        const borders = getPositionedStyle(style, 'border', 'width');
        const paddings = getPositionedStyle(style, 'padding');
        width -= paddings.width + borders.width;
        height -= paddings.height + borders.height;
      }
      width = Math.max(0, width - margins.width);
      height = Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height - margins.height);
      width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
      height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
      if (width && !height) {
        height = round1(width / 2);
      }
      return {
        width,
        height
      };
    }
    function retinaScale(chart, forceRatio, forceStyle) {
      const pixelRatio = chart.currentDevicePixelRatio = forceRatio || 1;
      const {canvas, width, height} = chart;
      canvas.height = height * pixelRatio;
      canvas.width = width * pixelRatio;
      chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (canvas.style && (forceStyle || (!canvas.style.height && !canvas.style.width))) {
        canvas.style.height = height + 'px';
        canvas.style.width = width + 'px';
      }
    }
    const supportsEventListenerOptions = (function() {
      let passiveSupported = false;
      try {
        const options = {
          get passive() {
            passiveSupported = true;
            return false;
          }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
      } catch (e) {
      }
      return passiveSupported;
    }());
    function readUsedSize(element, property) {
      const value = getStyle(element, property);
      const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
      return matches ? +matches[1] : undefined;
    }

    function _pointInLine(p1, p2, t, mode) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
    }
    function _steppedInterpolation(p1, p2, t, mode) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: mode === 'middle' ? t < 0.5 ? p1.y : p2.y
        : mode === 'after' ? t < 1 ? p1.y : p2.y
        : t > 0 ? p2.y : p1.y
      };
    }
    function _bezierInterpolation(p1, p2, t, mode) {
      const cp1 = {x: p1.cp2x, y: p1.cp2y};
      const cp2 = {x: p2.cp1x, y: p2.cp1y};
      const a = _pointInLine(p1, cp1, t);
      const b = _pointInLine(cp1, cp2, t);
      const c = _pointInLine(cp2, p2, t);
      const d = _pointInLine(a, b, t);
      const e = _pointInLine(b, c, t);
      return _pointInLine(d, e, t);
    }

    const intlCache = new Map();
    function getNumberFormat(locale, options) {
      options = options || {};
      const cacheKey = locale + JSON.stringify(options);
      let formatter = intlCache.get(cacheKey);
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        intlCache.set(cacheKey, formatter);
      }
      return formatter;
    }
    function formatNumber(num, locale, options) {
      return getNumberFormat(locale, options).format(num);
    }

    const getRightToLeftAdapter = function(rectX, width) {
      return {
        x(x) {
          return rectX + rectX + width - x;
        },
        setWidth(w) {
          width = w;
        },
        textAlign(align) {
          if (align === 'center') {
            return align;
          }
          return align === 'right' ? 'left' : 'right';
        },
        xPlus(x, value) {
          return x - value;
        },
        leftForLtr(x, itemWidth) {
          return x - itemWidth;
        },
      };
    };
    const getLeftToRightAdapter = function() {
      return {
        x(x) {
          return x;
        },
        setWidth(w) {
        },
        textAlign(align) {
          return align;
        },
        xPlus(x, value) {
          return x + value;
        },
        leftForLtr(x, _itemWidth) {
          return x;
        },
      };
    };
    function getRtlAdapter(rtl, rectX, width) {
      return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
    }
    function overrideTextDirection(ctx, direction) {
      let style, original;
      if (direction === 'ltr' || direction === 'rtl') {
        style = ctx.canvas.style;
        original = [
          style.getPropertyValue('direction'),
          style.getPropertyPriority('direction'),
        ];
        style.setProperty('direction', direction, 'important');
        ctx.prevTextDirection = original;
      }
    }
    function restoreTextDirection(ctx, original) {
      if (original !== undefined) {
        delete ctx.prevTextDirection;
        ctx.canvas.style.setProperty('direction', original[0], original[1]);
      }
    }

    function propertyFn(property) {
      if (property === 'angle') {
        return {
          between: _angleBetween,
          compare: _angleDiff,
          normalize: _normalizeAngle,
        };
      }
      return {
        between: (n, s, e) => n >= Math.min(s, e) && n <= Math.max(e, s),
        compare: (a, b) => a - b,
        normalize: x => x
      };
    }
    function normalizeSegment({start, end, count, loop, style}) {
      return {
        start: start % count,
        end: end % count,
        loop: loop && (end - start + 1) % count === 0,
        style
      };
    }
    function getSegment(segment, points, bounds) {
      const {property, start: startBound, end: endBound} = bounds;
      const {between, normalize} = propertyFn(property);
      const count = points.length;
      let {start, end, loop} = segment;
      let i, ilen;
      if (loop) {
        start += count;
        end += count;
        for (i = 0, ilen = count; i < ilen; ++i) {
          if (!between(normalize(points[start % count][property]), startBound, endBound)) {
            break;
          }
          start--;
          end--;
        }
        start %= count;
        end %= count;
      }
      if (end < start) {
        end += count;
      }
      return {start, end, loop, style: segment.style};
    }
    function _boundSegment(segment, points, bounds) {
      if (!bounds) {
        return [segment];
      }
      const {property, start: startBound, end: endBound} = bounds;
      const count = points.length;
      const {compare, between, normalize} = propertyFn(property);
      const {start, end, loop, style} = getSegment(segment, points, bounds);
      const result = [];
      let inside = false;
      let subStart = null;
      let value, point, prevValue;
      const startIsBefore = () => between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
      const endIsBefore = () => compare(endBound, value) === 0 || between(endBound, prevValue, value);
      const shouldStart = () => inside || startIsBefore();
      const shouldStop = () => !inside || endIsBefore();
      for (let i = start, prev = start; i <= end; ++i) {
        point = points[i % count];
        if (point.skip) {
          continue;
        }
        value = normalize(point[property]);
        inside = between(value, startBound, endBound);
        if (subStart === null && shouldStart()) {
          subStart = compare(value, startBound) === 0 ? i : prev;
        }
        if (subStart !== null && shouldStop()) {
          result.push(normalizeSegment({start: subStart, end: i, loop, count, style}));
          subStart = null;
        }
        prev = i;
        prevValue = value;
      }
      if (subStart !== null) {
        result.push(normalizeSegment({start: subStart, end, loop, count, style}));
      }
      return result;
    }
    function _boundSegments(line, bounds) {
      const result = [];
      const segments = line.segments;
      for (let i = 0; i < segments.length; i++) {
        const sub = _boundSegment(segments[i], line.points, bounds);
        if (sub.length) {
          result.push(...sub);
        }
      }
      return result;
    }
    function findStartAndEnd(points, count, loop, spanGaps) {
      let start = 0;
      let end = count - 1;
      if (loop && !spanGaps) {
        while (start < count && !points[start].skip) {
          start++;
        }
      }
      while (start < count && points[start].skip) {
        start++;
      }
      start %= count;
      if (loop) {
        end += start;
      }
      while (end > start && points[end % count].skip) {
        end--;
      }
      end %= count;
      return {start, end};
    }
    function solidSegments(points, start, max, loop) {
      const count = points.length;
      const result = [];
      let last = start;
      let prev = points[start];
      let end;
      for (end = start + 1; end <= max; ++end) {
        const cur = points[end % count];
        if (cur.skip || cur.stop) {
          if (!prev.skip) {
            loop = false;
            result.push({start: start % count, end: (end - 1) % count, loop});
            start = last = cur.stop ? end : null;
          }
        } else {
          last = end;
          if (prev.skip) {
            start = end;
          }
        }
        prev = cur;
      }
      if (last !== null) {
        result.push({start: start % count, end: last % count, loop});
      }
      return result;
    }
    function _computeSegments(line, segmentOptions) {
      const points = line.points;
      const spanGaps = line.options.spanGaps;
      const count = points.length;
      if (!count) {
        return [];
      }
      const loop = !!line._loop;
      const {start, end} = findStartAndEnd(points, count, loop, spanGaps);
      if (spanGaps === true) {
        return splitByStyles([{start, end, loop}], points, segmentOptions);
      }
      const max = end < start ? end + count : end;
      const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
      return splitByStyles(solidSegments(points, start, max, completeLoop), points, segmentOptions);
    }
    function splitByStyles(segments, points, segmentOptions) {
      if (!segmentOptions || !segmentOptions.setContext || !points) {
        return segments;
      }
      return doSplitByStyles(segments, points, segmentOptions);
    }
    function doSplitByStyles(segments, points, segmentOptions) {
      const count = points.length;
      const result = [];
      let start = segments[0].start;
      let i = start;
      for (const segment of segments) {
        let prevStyle, style;
        let prev = points[start % count];
        for (i = start + 1; i <= segment.end; i++) {
          const pt = points[i % count];
          style = readStyle(segmentOptions.setContext({type: 'segment', p0: prev, p1: pt}));
          if (styleChanged(style, prevStyle)) {
            result.push({start: start, end: i - 1, loop: segment.loop, style: prevStyle});
            prevStyle = style;
            start = i - 1;
          }
          prev = pt;
          prevStyle = style;
        }
        if (start < i - 1) {
          result.push({start, end: i - 1, loop: segment.loop, style});
          start = i - 1;
        }
      }
      return result;
    }
    function readStyle(options) {
      return {
        backgroundColor: options.backgroundColor,
        borderCapStyle: options.borderCapStyle,
        borderDash: options.borderDash,
        borderDashOffset: options.borderDashOffset,
        borderJoinStyle: options.borderJoinStyle,
        borderWidth: options.borderWidth,
        borderColor: options.borderColor
      };
    }
    function styleChanged(style, prevStyle) {
      return prevStyle && JSON.stringify(style) !== JSON.stringify(prevStyle);
    }

    /*!
     * Chart.js v3.2.0
     * https://www.chartjs.org
     * (c) 2021 Chart.js Contributors
     * Released under the MIT License
     */

    class Animator {
      constructor() {
        this._request = null;
        this._charts = new Map();
        this._running = false;
        this._lastDate = undefined;
      }
      _notify(chart, anims, date, type) {
        const callbacks = anims.listeners[type];
        const numSteps = anims.duration;
        callbacks.forEach(fn => fn({
          chart,
          initial: anims.initial,
          numSteps,
          currentStep: Math.min(date - anims.start, numSteps)
        }));
      }
      _refresh() {
        const me = this;
        if (me._request) {
          return;
        }
        me._running = true;
        me._request = requestAnimFrame.call(window, () => {
          me._update();
          me._request = null;
          if (me._running) {
            me._refresh();
          }
        });
      }
      _update(date = Date.now()) {
        const me = this;
        let remaining = 0;
        me._charts.forEach((anims, chart) => {
          if (!anims.running || !anims.items.length) {
            return;
          }
          const items = anims.items;
          let i = items.length - 1;
          let draw = false;
          let item;
          for (; i >= 0; --i) {
            item = items[i];
            if (item._active) {
              if (item._total > anims.duration) {
                anims.duration = item._total;
              }
              item.tick(date);
              draw = true;
            } else {
              items[i] = items[items.length - 1];
              items.pop();
            }
          }
          if (draw) {
            chart.draw();
            me._notify(chart, anims, date, 'progress');
          }
          if (!items.length) {
            anims.running = false;
            me._notify(chart, anims, date, 'complete');
            anims.initial = false;
          }
          remaining += items.length;
        });
        me._lastDate = date;
        if (remaining === 0) {
          me._running = false;
        }
      }
      _getAnims(chart) {
        const charts = this._charts;
        let anims = charts.get(chart);
        if (!anims) {
          anims = {
            running: false,
            initial: true,
            items: [],
            listeners: {
              complete: [],
              progress: []
            }
          };
          charts.set(chart, anims);
        }
        return anims;
      }
      listen(chart, event, cb) {
        this._getAnims(chart).listeners[event].push(cb);
      }
      add(chart, items) {
        if (!items || !items.length) {
          return;
        }
        this._getAnims(chart).items.push(...items);
      }
      has(chart) {
        return this._getAnims(chart).items.length > 0;
      }
      start(chart) {
        const anims = this._charts.get(chart);
        if (!anims) {
          return;
        }
        anims.running = true;
        anims.start = Date.now();
        anims.duration = anims.items.reduce((acc, cur) => Math.max(acc, cur._duration), 0);
        this._refresh();
      }
      running(chart) {
        if (!this._running) {
          return false;
        }
        const anims = this._charts.get(chart);
        if (!anims || !anims.running || !anims.items.length) {
          return false;
        }
        return true;
      }
      stop(chart) {
        const anims = this._charts.get(chart);
        if (!anims || !anims.items.length) {
          return;
        }
        const items = anims.items;
        let i = items.length - 1;
        for (; i >= 0; --i) {
          items[i].cancel();
        }
        anims.items = [];
        this._notify(chart, anims, Date.now(), 'complete');
      }
      remove(chart) {
        return this._charts.delete(chart);
      }
    }
    var animator = new Animator();

    const transparent = 'transparent';
    const interpolators = {
      boolean(from, to, factor) {
        return factor > 0.5 ? to : from;
      },
      color(from, to, factor) {
        const c0 = color(from || transparent);
        const c1 = c0.valid && color(to || transparent);
        return c1 && c1.valid
          ? c1.mix(c0, factor).hexString()
          : to;
      },
      number(from, to, factor) {
        return from + (to - from) * factor;
      }
    };
    class Animation {
      constructor(cfg, target, prop, to) {
        const currentValue = target[prop];
        to = resolve([cfg.to, to, currentValue, cfg.from]);
        const from = resolve([cfg.from, currentValue, to]);
        this._active = true;
        this._fn = cfg.fn || interpolators[cfg.type || typeof from];
        this._easing = effects[cfg.easing] || effects.linear;
        this._start = Math.floor(Date.now() + (cfg.delay || 0));
        this._duration = this._total = Math.floor(cfg.duration);
        this._loop = !!cfg.loop;
        this._target = target;
        this._prop = prop;
        this._from = from;
        this._to = to;
        this._promises = undefined;
      }
      active() {
        return this._active;
      }
      update(cfg, to, date) {
        const me = this;
        if (me._active) {
          me._notify(false);
          const currentValue = me._target[me._prop];
          const elapsed = date - me._start;
          const remain = me._duration - elapsed;
          me._start = date;
          me._duration = Math.floor(Math.max(remain, cfg.duration));
          me._total += elapsed;
          me._loop = !!cfg.loop;
          me._to = resolve([cfg.to, to, currentValue, cfg.from]);
          me._from = resolve([cfg.from, currentValue, to]);
        }
      }
      cancel() {
        const me = this;
        if (me._active) {
          me.tick(Date.now());
          me._active = false;
          me._notify(false);
        }
      }
      tick(date) {
        const me = this;
        const elapsed = date - me._start;
        const duration = me._duration;
        const prop = me._prop;
        const from = me._from;
        const loop = me._loop;
        const to = me._to;
        let factor;
        me._active = from !== to && (loop || (elapsed < duration));
        if (!me._active) {
          me._target[prop] = to;
          me._notify(true);
          return;
        }
        if (elapsed < 0) {
          me._target[prop] = from;
          return;
        }
        factor = (elapsed / duration) % 2;
        factor = loop && factor > 1 ? 2 - factor : factor;
        factor = me._easing(Math.min(1, Math.max(0, factor)));
        me._target[prop] = me._fn(from, to, factor);
      }
      wait() {
        const promises = this._promises || (this._promises = []);
        return new Promise((res, rej) => {
          promises.push({res, rej});
        });
      }
      _notify(resolved) {
        const method = resolved ? 'res' : 'rej';
        const promises = this._promises || [];
        for (let i = 0; i < promises.length; i++) {
          promises[i][method]();
        }
      }
    }

    const numbers = ['x', 'y', 'borderWidth', 'radius', 'tension'];
    const colors = ['color', 'borderColor', 'backgroundColor'];
    defaults.set('animation', {
      delay: undefined,
      duration: 1000,
      easing: 'easeOutQuart',
      fn: undefined,
      from: undefined,
      loop: undefined,
      to: undefined,
      type: undefined,
    });
    const animationOptions = Object.keys(defaults.animation);
    defaults.describe('animation', {
      _fallback: false,
      _indexable: false,
      _scriptable: (name) => name !== 'onProgress' && name !== 'onComplete' && name !== 'fn',
    });
    defaults.set('animations', {
      colors: {
        type: 'color',
        properties: colors
      },
      numbers: {
        type: 'number',
        properties: numbers
      },
    });
    defaults.describe('animations', {
      _fallback: 'animation',
    });
    defaults.set('transitions', {
      active: {
        animation: {
          duration: 400
        }
      },
      resize: {
        animation: {
          duration: 0
        }
      },
      show: {
        animations: {
          colors: {
            from: 'transparent'
          },
          visible: {
            type: 'boolean',
            duration: 0
          },
        }
      },
      hide: {
        animations: {
          colors: {
            to: 'transparent'
          },
          visible: {
            type: 'boolean',
            easing: 'linear',
            fn: v => v | 0
          },
        }
      }
    });
    class Animations {
      constructor(chart, config) {
        this._chart = chart;
        this._properties = new Map();
        this.configure(config);
      }
      configure(config) {
        if (!isObject(config)) {
          return;
        }
        const animatedProps = this._properties;
        Object.getOwnPropertyNames(config).forEach(key => {
          const cfg = config[key];
          if (!isObject(cfg)) {
            return;
          }
          const resolved = {};
          for (const option of animationOptions) {
            resolved[option] = cfg[option];
          }
          (isArray(cfg.properties) && cfg.properties || [key]).forEach((prop) => {
            if (prop === key || !animatedProps.has(prop)) {
              animatedProps.set(prop, resolved);
            }
          });
        });
      }
      _animateOptions(target, values) {
        const newOptions = values.options;
        const options = resolveTargetOptions(target, newOptions);
        if (!options) {
          return [];
        }
        const animations = this._createAnimations(options, newOptions);
        if (newOptions.$shared) {
          awaitAll(target.options.$animations, newOptions).then(() => {
            target.options = newOptions;
          }, () => {
          });
        }
        return animations;
      }
      _createAnimations(target, values) {
        const animatedProps = this._properties;
        const animations = [];
        const running = target.$animations || (target.$animations = {});
        const props = Object.keys(values);
        const date = Date.now();
        let i;
        for (i = props.length - 1; i >= 0; --i) {
          const prop = props[i];
          if (prop.charAt(0) === '$') {
            continue;
          }
          if (prop === 'options') {
            animations.push(...this._animateOptions(target, values));
            continue;
          }
          const value = values[prop];
          let animation = running[prop];
          const cfg = animatedProps.get(prop);
          if (animation) {
            if (cfg && animation.active()) {
              animation.update(cfg, value, date);
              continue;
            } else {
              animation.cancel();
            }
          }
          if (!cfg || !cfg.duration) {
            target[prop] = value;
            continue;
          }
          running[prop] = animation = new Animation(cfg, target, prop, value);
          animations.push(animation);
        }
        return animations;
      }
      update(target, values) {
        if (this._properties.size === 0) {
          Object.assign(target, values);
          return;
        }
        const animations = this._createAnimations(target, values);
        if (animations.length) {
          animator.add(this._chart, animations);
          return true;
        }
      }
    }
    function awaitAll(animations, properties) {
      const running = [];
      const keys = Object.keys(properties);
      for (let i = 0; i < keys.length; i++) {
        const anim = animations[keys[i]];
        if (anim && anim.active()) {
          running.push(anim.wait());
        }
      }
      return Promise.all(running);
    }
    function resolveTargetOptions(target, newOptions) {
      if (!newOptions) {
        return;
      }
      let options = target.options;
      if (!options) {
        target.options = newOptions;
        return;
      }
      if (options.$shared) {
        target.options = options = Object.assign({}, options, {$shared: false, $animations: {}});
      }
      return options;
    }

    function scaleClip(scale, allowedOverflow) {
      const opts = scale && scale.options || {};
      const reverse = opts.reverse;
      const min = opts.min === undefined ? allowedOverflow : 0;
      const max = opts.max === undefined ? allowedOverflow : 0;
      return {
        start: reverse ? max : min,
        end: reverse ? min : max
      };
    }
    function defaultClip(xScale, yScale, allowedOverflow) {
      if (allowedOverflow === false) {
        return false;
      }
      const x = scaleClip(xScale, allowedOverflow);
      const y = scaleClip(yScale, allowedOverflow);
      return {
        top: y.end,
        right: x.end,
        bottom: y.start,
        left: x.start
      };
    }
    function toClip(value) {
      let t, r, b, l;
      if (isObject(value)) {
        t = value.top;
        r = value.right;
        b = value.bottom;
        l = value.left;
      } else {
        t = r = b = l = value;
      }
      return {
        top: t,
        right: r,
        bottom: b,
        left: l
      };
    }
    function getSortedDatasetIndices(chart, filterVisible) {
      const keys = [];
      const metasets = chart._getSortedDatasetMetas(filterVisible);
      let i, ilen;
      for (i = 0, ilen = metasets.length; i < ilen; ++i) {
        keys.push(metasets[i].index);
      }
      return keys;
    }
    function applyStack(stack, value, dsIndex, options) {
      const keys = stack.keys;
      const singleMode = options.mode === 'single';
      let i, ilen, datasetIndex, otherValue;
      if (value === null) {
        return;
      }
      for (i = 0, ilen = keys.length; i < ilen; ++i) {
        datasetIndex = +keys[i];
        if (datasetIndex === dsIndex) {
          if (options.all) {
            continue;
          }
          break;
        }
        otherValue = stack.values[datasetIndex];
        if (isNumberFinite(otherValue) && (singleMode || (value === 0 || sign(value) === sign(otherValue)))) {
          value += otherValue;
        }
      }
      return value;
    }
    function convertObjectDataToArray(data) {
      const keys = Object.keys(data);
      const adata = new Array(keys.length);
      let i, ilen, key;
      for (i = 0, ilen = keys.length; i < ilen; ++i) {
        key = keys[i];
        adata[i] = {
          x: key,
          y: data[key]
        };
      }
      return adata;
    }
    function isStacked(scale, meta) {
      const stacked = scale && scale.options.stacked;
      return stacked || (stacked === undefined && meta.stack !== undefined);
    }
    function getStackKey(indexScale, valueScale, meta) {
      return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
    }
    function getUserBounds(scale) {
      const {min, max, minDefined, maxDefined} = scale.getUserBounds();
      return {
        min: minDefined ? min : Number.NEGATIVE_INFINITY,
        max: maxDefined ? max : Number.POSITIVE_INFINITY
      };
    }
    function getOrCreateStack(stacks, stackKey, indexValue) {
      const subStack = stacks[stackKey] || (stacks[stackKey] = {});
      return subStack[indexValue] || (subStack[indexValue] = {});
    }
    function getLastIndexInStack(stack, vScale, positive) {
      for (const meta of vScale.getMatchingVisibleMetas('bar').reverse()) {
        const value = stack[meta.index];
        if ((positive && value > 0) || (!positive && value < 0)) {
          return meta.index;
        }
      }
      return null;
    }
    function updateStacks(controller, parsed) {
      const {chart, _cachedMeta: meta} = controller;
      const stacks = chart._stacks || (chart._stacks = {});
      const {iScale, vScale, index: datasetIndex} = meta;
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const key = getStackKey(iScale, vScale, meta);
      const ilen = parsed.length;
      let stack;
      for (let i = 0; i < ilen; ++i) {
        const item = parsed[i];
        const {[iAxis]: index, [vAxis]: value} = item;
        const itemStacks = item._stacks || (item._stacks = {});
        stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
        stack[datasetIndex] = value;
        stack._top = getLastIndexInStack(stack, vScale, true);
        stack._bottom = getLastIndexInStack(stack, vScale, false);
      }
    }
    function getFirstScaleId(chart, axis) {
      const scales = chart.scales;
      return Object.keys(scales).filter(key => scales[key].axis === axis).shift();
    }
    function createDatasetContext(parent, index) {
      return Object.assign(Object.create(parent),
        {
          active: false,
          dataset: undefined,
          datasetIndex: index,
          index,
          mode: 'default',
          type: 'dataset'
        }
      );
    }
    function createDataContext(parent, index, element) {
      return Object.assign(Object.create(parent), {
        active: false,
        dataIndex: index,
        parsed: undefined,
        raw: undefined,
        element,
        index,
        mode: 'default',
        type: 'data'
      });
    }
    function clearStacks(meta, items) {
      items = items || meta._parsed;
      for (const parsed of items) {
        const stacks = parsed._stacks;
        if (!stacks || stacks[meta.vScale.id] === undefined || stacks[meta.vScale.id][meta.index] === undefined) {
          return;
        }
        delete stacks[meta.vScale.id][meta.index];
      }
    }
    const isDirectUpdateMode = (mode) => mode === 'reset' || mode === 'none';
    const cloneIfNotShared = (cached, shared) => shared ? cached : Object.assign({}, cached);
    class DatasetController {
      constructor(chart, datasetIndex) {
        this.chart = chart;
        this._ctx = chart.ctx;
        this.index = datasetIndex;
        this._cachedDataOpts = {};
        this._cachedMeta = this.getMeta();
        this._type = this._cachedMeta.type;
        this.options = undefined;
        this._parsing = false;
        this._data = undefined;
        this._objectData = undefined;
        this._sharedOptions = undefined;
        this._drawStart = undefined;
        this._drawCount = undefined;
        this.enableOptionSharing = false;
        this.$context = undefined;
        this.initialize();
      }
      initialize() {
        const me = this;
        const meta = me._cachedMeta;
        me.configure();
        me.linkScales();
        meta._stacked = isStacked(meta.vScale, meta);
        me.addElements();
      }
      updateIndex(datasetIndex) {
        this.index = datasetIndex;
      }
      linkScales() {
        const me = this;
        const chart = me.chart;
        const meta = me._cachedMeta;
        const dataset = me.getDataset();
        const chooseId = (axis, x, y, r) => axis === 'x' ? x : axis === 'r' ? r : y;
        const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, 'x'));
        const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, 'y'));
        const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, 'r'));
        const indexAxis = meta.indexAxis;
        const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
        const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
        meta.xScale = me.getScaleForId(xid);
        meta.yScale = me.getScaleForId(yid);
        meta.rScale = me.getScaleForId(rid);
        meta.iScale = me.getScaleForId(iid);
        meta.vScale = me.getScaleForId(vid);
      }
      getDataset() {
        return this.chart.data.datasets[this.index];
      }
      getMeta() {
        return this.chart.getDatasetMeta(this.index);
      }
      getScaleForId(scaleID) {
        return this.chart.scales[scaleID];
      }
      _getOtherScale(scale) {
        const meta = this._cachedMeta;
        return scale === meta.iScale
          ? meta.vScale
          : meta.iScale;
      }
      reset() {
        this._update('reset');
      }
      _destroy() {
        const meta = this._cachedMeta;
        if (this._data) {
          unlistenArrayEvents(this._data, this);
        }
        if (meta._stacked) {
          clearStacks(meta);
        }
      }
      _dataCheck() {
        const me = this;
        const dataset = me.getDataset();
        const data = dataset.data || (dataset.data = []);
        if (isObject(data)) {
          me._data = convertObjectDataToArray(data);
        } else if (me._data !== data) {
          if (me._data) {
            unlistenArrayEvents(me._data, me);
            clearStacks(me._cachedMeta);
          }
          if (data && Object.isExtensible(data)) {
            listenArrayEvents(data, me);
          }
          me._data = data;
        }
      }
      addElements() {
        const me = this;
        const meta = me._cachedMeta;
        me._dataCheck();
        if (me.datasetElementType) {
          meta.dataset = new me.datasetElementType();
        }
      }
      buildOrUpdateElements(resetNewElements) {
        const me = this;
        const meta = me._cachedMeta;
        const dataset = me.getDataset();
        let stackChanged = false;
        me._dataCheck();
        meta._stacked = isStacked(meta.vScale, meta);
        if (meta.stack !== dataset.stack) {
          stackChanged = true;
          clearStacks(meta);
          meta.stack = dataset.stack;
        }
        me._resyncElements(resetNewElements);
        if (stackChanged) {
          updateStacks(me, meta._parsed);
        }
      }
      configure() {
        const me = this;
        const config = me.chart.config;
        const scopeKeys = config.datasetScopeKeys(me._type);
        const scopes = config.getOptionScopes(me.getDataset(), scopeKeys, true);
        me.options = config.createResolver(scopes, me.getContext());
        me._parsing = me.options.parsing;
      }
      parse(start, count) {
        const me = this;
        const {_cachedMeta: meta, _data: data} = me;
        const {iScale, _stacked} = meta;
        const iAxis = iScale.axis;
        let sorted = start === 0 && count === data.length ? true : meta._sorted;
        let prev = start > 0 && meta._parsed[start - 1];
        let i, cur, parsed;
        if (me._parsing === false) {
          meta._parsed = data;
          meta._sorted = true;
          parsed = data;
        } else {
          if (isArray(data[start])) {
            parsed = me.parseArrayData(meta, data, start, count);
          } else if (isObject(data[start])) {
            parsed = me.parseObjectData(meta, data, start, count);
          } else {
            parsed = me.parsePrimitiveData(meta, data, start, count);
          }
          const isNotInOrderComparedToPrev = () => cur[iAxis] === null || (prev && cur[iAxis] < prev[iAxis]);
          for (i = 0; i < count; ++i) {
            meta._parsed[i + start] = cur = parsed[i];
            if (sorted) {
              if (isNotInOrderComparedToPrev()) {
                sorted = false;
              }
              prev = cur;
            }
          }
          meta._sorted = sorted;
        }
        if (_stacked) {
          updateStacks(me, parsed);
        }
      }
      parsePrimitiveData(meta, data, start, count) {
        const {iScale, vScale} = meta;
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const labels = iScale.getLabels();
        const singleScale = iScale === vScale;
        const parsed = new Array(count);
        let i, ilen, index;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index = i + start;
          parsed[i] = {
            [iAxis]: singleScale || iScale.parse(labels[index], index),
            [vAxis]: vScale.parse(data[index], index)
          };
        }
        return parsed;
      }
      parseArrayData(meta, data, start, count) {
        const {xScale, yScale} = meta;
        const parsed = new Array(count);
        let i, ilen, index, item;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index = i + start;
          item = data[index];
          parsed[i] = {
            x: xScale.parse(item[0], index),
            y: yScale.parse(item[1], index)
          };
        }
        return parsed;
      }
      parseObjectData(meta, data, start, count) {
        const {xScale, yScale} = meta;
        const {xAxisKey = 'x', yAxisKey = 'y'} = this._parsing;
        const parsed = new Array(count);
        let i, ilen, index, item;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index = i + start;
          item = data[index];
          parsed[i] = {
            x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
            y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
          };
        }
        return parsed;
      }
      getParsed(index) {
        return this._cachedMeta._parsed[index];
      }
      getDataElement(index) {
        return this._cachedMeta.data[index];
      }
      applyStack(scale, parsed, mode) {
        const chart = this.chart;
        const meta = this._cachedMeta;
        const value = parsed[scale.axis];
        const stack = {
          keys: getSortedDatasetIndices(chart, true),
          values: parsed._stacks[scale.axis]
        };
        return applyStack(stack, value, meta.index, {mode});
      }
      updateRangeFromParsed(range, scale, parsed, stack) {
        const parsedValue = parsed[scale.axis];
        let value = parsedValue === null ? NaN : parsedValue;
        const values = stack && parsed._stacks[scale.axis];
        if (stack && values) {
          stack.values = values;
          range.min = Math.min(range.min, value);
          range.max = Math.max(range.max, value);
          value = applyStack(stack, parsedValue, this._cachedMeta.index, {all: true});
        }
        range.min = Math.min(range.min, value);
        range.max = Math.max(range.max, value);
      }
      getMinMax(scale, canStack) {
        const me = this;
        const meta = me._cachedMeta;
        const _parsed = meta._parsed;
        const sorted = meta._sorted && scale === meta.iScale;
        const ilen = _parsed.length;
        const otherScale = me._getOtherScale(scale);
        const stack = canStack && meta._stacked && {keys: getSortedDatasetIndices(me.chart, true), values: null};
        const range = {min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY};
        const {min: otherMin, max: otherMax} = getUserBounds(otherScale);
        let i, value, parsed, otherValue;
        function _skip() {
          parsed = _parsed[i];
          value = parsed[scale.axis];
          otherValue = parsed[otherScale.axis];
          return !isNumberFinite(value) || otherMin > otherValue || otherMax < otherValue;
        }
        for (i = 0; i < ilen; ++i) {
          if (_skip()) {
            continue;
          }
          me.updateRangeFromParsed(range, scale, parsed, stack);
          if (sorted) {
            break;
          }
        }
        if (sorted) {
          for (i = ilen - 1; i >= 0; --i) {
            if (_skip()) {
              continue;
            }
            me.updateRangeFromParsed(range, scale, parsed, stack);
            break;
          }
        }
        return range;
      }
      getAllParsedValues(scale) {
        const parsed = this._cachedMeta._parsed;
        const values = [];
        let i, ilen, value;
        for (i = 0, ilen = parsed.length; i < ilen; ++i) {
          value = parsed[i][scale.axis];
          if (isNumberFinite(value)) {
            values.push(value);
          }
        }
        return values;
      }
      getMaxOverflow() {
        return false;
      }
      getLabelAndValue(index) {
        const me = this;
        const meta = me._cachedMeta;
        const iScale = meta.iScale;
        const vScale = meta.vScale;
        const parsed = me.getParsed(index);
        return {
          label: iScale ? '' + iScale.getLabelForValue(parsed[iScale.axis]) : '',
          value: vScale ? '' + vScale.getLabelForValue(parsed[vScale.axis]) : ''
        };
      }
      _update(mode) {
        const me = this;
        const meta = me._cachedMeta;
        me.configure();
        me._cachedDataOpts = {};
        me.update(mode || 'default');
        meta._clip = toClip(valueOrDefault(me.options.clip, defaultClip(meta.xScale, meta.yScale, me.getMaxOverflow())));
      }
      update(mode) {}
      draw() {
        const me = this;
        const ctx = me._ctx;
        const chart = me.chart;
        const meta = me._cachedMeta;
        const elements = meta.data || [];
        const area = chart.chartArea;
        const active = [];
        const start = me._drawStart || 0;
        const count = me._drawCount || (elements.length - start);
        let i;
        if (meta.dataset) {
          meta.dataset.draw(ctx, area, start, count);
        }
        for (i = start; i < start + count; ++i) {
          const element = elements[i];
          if (element.active) {
            active.push(element);
          } else {
            element.draw(ctx, area);
          }
        }
        for (i = 0; i < active.length; ++i) {
          active[i].draw(ctx, area);
        }
      }
      getStyle(index, active) {
        const mode = active ? 'active' : 'default';
        return index === undefined && this._cachedMeta.dataset
          ? this.resolveDatasetElementOptions(mode)
          : this.resolveDataElementOptions(index || 0, mode);
      }
      getContext(index, active, mode) {
        const me = this;
        const dataset = me.getDataset();
        let context;
        if (index >= 0 && index < me._cachedMeta.data.length) {
          const element = me._cachedMeta.data[index];
          context = element.$context ||
            (element.$context = createDataContext(me.getContext(), index, element));
          context.parsed = me.getParsed(index);
          context.raw = dataset.data[index];
        } else {
          context = me.$context ||
            (me.$context = createDatasetContext(me.chart.getContext(), me.index));
          context.dataset = dataset;
        }
        context.active = !!active;
        context.mode = mode;
        return context;
      }
      resolveDatasetElementOptions(mode) {
        return this._resolveElementOptions(this.datasetElementType.id, mode);
      }
      resolveDataElementOptions(index, mode) {
        return this._resolveElementOptions(this.dataElementType.id, mode, index);
      }
      _resolveElementOptions(elementType, mode = 'default', index) {
        const me = this;
        const active = mode === 'active';
        const cache = me._cachedDataOpts;
        const cacheKey = elementType + '-' + mode;
        const cached = cache[cacheKey];
        const sharing = me.enableOptionSharing && defined(index);
        if (cached) {
          return cloneIfNotShared(cached, sharing);
        }
        const config = me.chart.config;
        const scopeKeys = config.datasetElementScopeKeys(me._type, elementType);
        const prefixes = active ? [`${elementType}Hover`, 'hover', elementType, ''] : [elementType, ''];
        const scopes = config.getOptionScopes(me.getDataset(), scopeKeys);
        const names = Object.keys(defaults.elements[elementType]);
        const context = () => me.getContext(index, active);
        const values = config.resolveNamedOptions(scopes, names, context, prefixes);
        if (values.$shared) {
          values.$shared = sharing;
          cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
        }
        return values;
      }
      _resolveAnimations(index, transition, active) {
        const me = this;
        const chart = me.chart;
        const cache = me._cachedDataOpts;
        const cacheKey = `animation-${transition}`;
        const cached = cache[cacheKey];
        if (cached) {
          return cached;
        }
        let options;
        if (chart.options.animation !== false) {
          const config = me.chart.config;
          const scopeKeys = config.datasetAnimationScopeKeys(me._type, transition);
          const scopes = config.getOptionScopes(me.getDataset(), scopeKeys);
          options = config.createResolver(scopes, me.getContext(index, active, transition));
        }
        const animations = new Animations(chart, options && options.animations);
        if (options && options._cacheable) {
          cache[cacheKey] = Object.freeze(animations);
        }
        return animations;
      }
      getSharedOptions(options) {
        if (!options.$shared) {
          return;
        }
        return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
      }
      includeOptions(mode, sharedOptions) {
        return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
      }
      updateElement(element, index, properties, mode) {
        if (isDirectUpdateMode(mode)) {
          Object.assign(element, properties);
        } else {
          this._resolveAnimations(index, mode).update(element, properties);
        }
      }
      updateSharedOptions(sharedOptions, mode, newOptions) {
        if (sharedOptions && !isDirectUpdateMode(mode)) {
          this._resolveAnimations(undefined, mode).update(sharedOptions, newOptions);
        }
      }
      _setStyle(element, index, mode, active) {
        element.active = active;
        const options = this.getStyle(index, active);
        this._resolveAnimations(index, mode, active).update(element, {
          options: (!active && this.getSharedOptions(options)) || options
        });
      }
      removeHoverStyle(element, datasetIndex, index) {
        this._setStyle(element, index, 'active', false);
      }
      setHoverStyle(element, datasetIndex, index) {
        this._setStyle(element, index, 'active', true);
      }
      _removeDatasetHoverStyle() {
        const element = this._cachedMeta.dataset;
        if (element) {
          this._setStyle(element, undefined, 'active', false);
        }
      }
      _setDatasetHoverStyle() {
        const element = this._cachedMeta.dataset;
        if (element) {
          this._setStyle(element, undefined, 'active', true);
        }
      }
      _resyncElements(resetNewElements) {
        const me = this;
        const numMeta = me._cachedMeta.data.length;
        const numData = me._data.length;
        if (numData > numMeta) {
          me._insertElements(numMeta, numData - numMeta, resetNewElements);
        } else if (numData < numMeta) {
          me._removeElements(numData, numMeta - numData);
        }
        const count = Math.min(numData, numMeta);
        if (count) {
          me.parse(0, count);
        }
      }
      _insertElements(start, count, resetNewElements = true) {
        const me = this;
        const meta = me._cachedMeta;
        const data = meta.data;
        const end = start + count;
        let i;
        const move = (arr) => {
          arr.length += count;
          for (i = arr.length - 1; i >= end; i--) {
            arr[i] = arr[i - count];
          }
        };
        move(data);
        for (i = start; i < end; ++i) {
          data[i] = new me.dataElementType();
        }
        if (me._parsing) {
          move(meta._parsed);
        }
        me.parse(start, count);
        if (resetNewElements) {
          me.updateElements(data, start, count, 'reset');
        }
      }
      updateElements(element, start, count, mode) {}
      _removeElements(start, count) {
        const me = this;
        const meta = me._cachedMeta;
        if (me._parsing) {
          const removed = meta._parsed.splice(start, count);
          if (meta._stacked) {
            clearStacks(meta, removed);
          }
        }
        meta.data.splice(start, count);
      }
      _onDataPush() {
        const count = arguments.length;
        this._insertElements(this.getDataset().data.length - count, count);
      }
      _onDataPop() {
        this._removeElements(this._cachedMeta.data.length - 1, 1);
      }
      _onDataShift() {
        this._removeElements(0, 1);
      }
      _onDataSplice(start, count) {
        this._removeElements(start, count);
        this._insertElements(start, arguments.length - 2);
      }
      _onDataUnshift() {
        this._insertElements(0, arguments.length);
      }
    }
    DatasetController.defaults = {};
    DatasetController.prototype.datasetElementType = null;
    DatasetController.prototype.dataElementType = null;

    function getAllScaleValues(scale) {
      if (!scale._cache.$bar) {
        const metas = scale.getMatchingVisibleMetas('bar');
        let values = [];
        for (let i = 0, ilen = metas.length; i < ilen; i++) {
          values = values.concat(metas[i].controller.getAllParsedValues(scale));
        }
        scale._cache.$bar = _arrayUnique(values.sort((a, b) => a - b));
      }
      return scale._cache.$bar;
    }
    function computeMinSampleSize(scale) {
      const values = getAllScaleValues(scale);
      let min = scale._length;
      let i, ilen, curr, prev;
      const updateMinAndPrev = () => {
        min = Math.min(min, i && Math.abs(curr - prev) || min);
        prev = curr;
      };
      for (i = 0, ilen = values.length; i < ilen; ++i) {
        curr = scale.getPixelForValue(values[i]);
        updateMinAndPrev();
      }
      for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
        curr = scale.getPixelForTick(i);
        updateMinAndPrev();
      }
      return min;
    }
    function computeFitCategoryTraits(index, ruler, options, stackCount) {
      const thickness = options.barThickness;
      let size, ratio;
      if (isNullOrUndef(thickness)) {
        size = ruler.min * options.categoryPercentage;
        ratio = options.barPercentage;
      } else {
        size = thickness * stackCount;
        ratio = 1;
      }
      return {
        chunk: size / stackCount,
        ratio,
        start: ruler.pixels[index] - (size / 2)
      };
    }
    function computeFlexCategoryTraits(index, ruler, options, stackCount) {
      const pixels = ruler.pixels;
      const curr = pixels[index];
      let prev = index > 0 ? pixels[index - 1] : null;
      let next = index < pixels.length - 1 ? pixels[index + 1] : null;
      const percent = options.categoryPercentage;
      if (prev === null) {
        prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
      }
      if (next === null) {
        next = curr + curr - prev;
      }
      const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
      const size = Math.abs(next - prev) / 2 * percent;
      return {
        chunk: size / stackCount,
        ratio: options.barPercentage,
        start
      };
    }
    function parseFloatBar(entry, item, vScale, i) {
      const startValue = vScale.parse(entry[0], i);
      const endValue = vScale.parse(entry[1], i);
      const min = Math.min(startValue, endValue);
      const max = Math.max(startValue, endValue);
      let barStart = min;
      let barEnd = max;
      if (Math.abs(min) > Math.abs(max)) {
        barStart = max;
        barEnd = min;
      }
      item[vScale.axis] = barEnd;
      item._custom = {
        barStart,
        barEnd,
        start: startValue,
        end: endValue,
        min,
        max
      };
    }
    function parseValue(entry, item, vScale, i) {
      if (isArray(entry)) {
        parseFloatBar(entry, item, vScale, i);
      } else {
        item[vScale.axis] = vScale.parse(entry, i);
      }
      return item;
    }
    function parseArrayOrPrimitive(meta, data, start, count) {
      const iScale = meta.iScale;
      const vScale = meta.vScale;
      const labels = iScale.getLabels();
      const singleScale = iScale === vScale;
      const parsed = [];
      let i, ilen, item, entry;
      for (i = start, ilen = start + count; i < ilen; ++i) {
        entry = data[i];
        item = {};
        item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
        parsed.push(parseValue(entry, item, vScale, i));
      }
      return parsed;
    }
    function isFloatBar(custom) {
      return custom && custom.barStart !== undefined && custom.barEnd !== undefined;
    }
    class BarController extends DatasetController {
      parsePrimitiveData(meta, data, start, count) {
        return parseArrayOrPrimitive(meta, data, start, count);
      }
      parseArrayData(meta, data, start, count) {
        return parseArrayOrPrimitive(meta, data, start, count);
      }
      parseObjectData(meta, data, start, count) {
        const {iScale, vScale} = meta;
        const {xAxisKey = 'x', yAxisKey = 'y'} = this._parsing;
        const iAxisKey = iScale.axis === 'x' ? xAxisKey : yAxisKey;
        const vAxisKey = vScale.axis === 'x' ? xAxisKey : yAxisKey;
        const parsed = [];
        let i, ilen, item, obj;
        for (i = start, ilen = start + count; i < ilen; ++i) {
          obj = data[i];
          item = {};
          item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
          parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
        }
        return parsed;
      }
      updateRangeFromParsed(range, scale, parsed, stack) {
        super.updateRangeFromParsed(range, scale, parsed, stack);
        const custom = parsed._custom;
        if (custom && scale === this._cachedMeta.vScale) {
          range.min = Math.min(range.min, custom.min);
          range.max = Math.max(range.max, custom.max);
        }
      }
      getLabelAndValue(index) {
        const me = this;
        const meta = me._cachedMeta;
        const {iScale, vScale} = meta;
        const parsed = me.getParsed(index);
        const custom = parsed._custom;
        const value = isFloatBar(custom)
          ? '[' + custom.start + ', ' + custom.end + ']'
          : '' + vScale.getLabelForValue(parsed[vScale.axis]);
        return {
          label: '' + iScale.getLabelForValue(parsed[iScale.axis]),
          value
        };
      }
      initialize() {
        const me = this;
        me.enableOptionSharing = true;
        super.initialize();
        const meta = me._cachedMeta;
        meta.stack = me.getDataset().stack;
      }
      update(mode) {
        const me = this;
        const meta = me._cachedMeta;
        me.updateElements(meta.data, 0, meta.data.length, mode);
      }
      updateElements(bars, start, count, mode) {
        const me = this;
        const reset = mode === 'reset';
        const vScale = me._cachedMeta.vScale;
        const base = vScale.getBasePixel();
        const horizontal = vScale.isHorizontal();
        const ruler = me._getRuler();
        const firstOpts = me.resolveDataElementOptions(start, mode);
        const sharedOptions = me.getSharedOptions(firstOpts);
        const includeOptions = me.includeOptions(mode, sharedOptions);
        me.updateSharedOptions(sharedOptions, mode, firstOpts);
        for (let i = start; i < start + count; i++) {
          const parsed = me.getParsed(i);
          const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {base, head: base} : me._calculateBarValuePixels(i);
          const ipixels = me._calculateBarIndexPixels(i, ruler);
          const stack = (parsed._stacks || {})[vScale.axis];
          const properties = {
            horizontal,
            base: vpixels.base,
            enableBorderRadius: !stack || isFloatBar(parsed._custom) || (me.index === stack._top || me.index === stack._bottom),
            x: horizontal ? vpixels.head : ipixels.center,
            y: horizontal ? ipixels.center : vpixels.head,
            height: horizontal ? ipixels.size : undefined,
            width: horizontal ? undefined : ipixels.size
          };
          if (includeOptions) {
            properties.options = sharedOptions || me.resolveDataElementOptions(i, mode);
          }
          me.updateElement(bars[i], i, properties, mode);
        }
      }
      _getStacks(last, dataIndex) {
        const me = this;
        const meta = me._cachedMeta;
        const iScale = meta.iScale;
        const metasets = iScale.getMatchingVisibleMetas(me._type);
        const stacked = iScale.options.stacked;
        const ilen = metasets.length;
        const stacks = [];
        let i, item;
        for (i = 0; i < ilen; ++i) {
          item = metasets[i];
          if (typeof dataIndex !== 'undefined') {
            const val = item.controller.getParsed(dataIndex)[
              item.controller._cachedMeta.vScale.axis
            ];
            if (isNullOrUndef(val) || isNaN(val)) {
              continue;
            }
          }
          if (stacked === false || stacks.indexOf(item.stack) === -1 ||
    				(stacked === undefined && item.stack === undefined)) {
            stacks.push(item.stack);
          }
          if (item.index === last) {
            break;
          }
        }
        if (!stacks.length) {
          stacks.push(undefined);
        }
        return stacks;
      }
      _getStackCount(index) {
        return this._getStacks(undefined, index).length;
      }
      _getStackIndex(datasetIndex, name, dataIndex) {
        const stacks = this._getStacks(datasetIndex, dataIndex);
        const index = (name !== undefined)
          ? stacks.indexOf(name)
          : -1;
        return (index === -1)
          ? stacks.length - 1
          : index;
      }
      _getRuler() {
        const me = this;
        const opts = me.options;
        const meta = me._cachedMeta;
        const iScale = meta.iScale;
        const pixels = [];
        let i, ilen;
        for (i = 0, ilen = meta.data.length; i < ilen; ++i) {
          pixels.push(iScale.getPixelForValue(me.getParsed(i)[iScale.axis], i));
        }
        const barThickness = opts.barThickness;
        const min = barThickness || computeMinSampleSize(iScale);
        return {
          min,
          pixels,
          start: iScale._startPixel,
          end: iScale._endPixel,
          stackCount: me._getStackCount(),
          scale: iScale,
          grouped: opts.grouped,
          ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
        };
      }
      _calculateBarValuePixels(index) {
        const me = this;
        const {vScale, _stacked} = me._cachedMeta;
        const {base: baseValue, minBarLength} = me.options;
        const parsed = me.getParsed(index);
        const custom = parsed._custom;
        const floating = isFloatBar(custom);
        let value = parsed[vScale.axis];
        let start = 0;
        let length = _stacked ? me.applyStack(vScale, parsed, _stacked) : value;
        let head, size;
        if (length !== value) {
          start = length - value;
          length = value;
        }
        if (floating) {
          value = custom.barStart;
          length = custom.barEnd - custom.barStart;
          if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
            start = 0;
          }
          start += value;
        }
        const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
        let base = vScale.getPixelForValue(startValue);
        if (this.chart.getDataVisibility(index)) {
          head = vScale.getPixelForValue(start + length);
        } else {
          head = base;
        }
        size = head - base;
        if (minBarLength !== undefined && Math.abs(size) < minBarLength) {
          size = size < 0 ? -minBarLength : minBarLength;
          if (value === 0) {
            base -= size / 2;
          }
          head = base + size;
        }
        const actualBase = baseValue || 0;
        if (base === vScale.getPixelForValue(actualBase)) {
          const halfGrid = vScale.getLineWidthForValue(actualBase) / 2;
          if (size > 0) {
            base += halfGrid;
            size -= halfGrid;
          } else if (size < 0) {
            base -= halfGrid;
            size += halfGrid;
          }
        }
        return {
          size,
          base,
          head,
          center: head + size / 2
        };
      }
      _calculateBarIndexPixels(index, ruler) {
        const me = this;
        const scale = ruler.scale;
        const options = me.options;
        const skipNull = options.skipNull;
        const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
        let center, size;
        if (ruler.grouped) {
          const stackCount = skipNull ? me._getStackCount(index) : ruler.stackCount;
          const range = options.barThickness === 'flex'
            ? computeFlexCategoryTraits(index, ruler, options, stackCount)
            : computeFitCategoryTraits(index, ruler, options, stackCount);
          const stackIndex = me._getStackIndex(me.index, me._cachedMeta.stack, skipNull ? index : undefined);
          center = range.start + (range.chunk * stackIndex) + (range.chunk / 2);
          size = Math.min(maxBarThickness, range.chunk * range.ratio);
        } else {
          center = scale.getPixelForValue(me.getParsed(index)[scale.axis], index);
          size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
        }
        return {
          base: center - size / 2,
          head: center + size / 2,
          center,
          size
        };
      }
      draw() {
        const me = this;
        const chart = me.chart;
        const meta = me._cachedMeta;
        const vScale = meta.vScale;
        const rects = meta.data;
        const ilen = rects.length;
        let i = 0;
        clipArea(chart.ctx, chart.chartArea);
        for (; i < ilen; ++i) {
          if (me.getParsed(i)[vScale.axis] !== null) {
            rects[i].draw(me._ctx);
          }
        }
        unclipArea(chart.ctx);
      }
    }
    BarController.id = 'bar';
    BarController.defaults = {
      datasetElementType: false,
      dataElementType: 'bar',
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      grouped: true,
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'base', 'width', 'height']
        }
      }
    };
    BarController.overrides = {
      interaction: {
        mode: 'index'
      },
      scales: {
        _index_: {
          type: 'category',
          offset: true,
          grid: {
            offset: true
          }
        },
        _value_: {
          type: 'linear',
          beginAtZero: true,
        }
      }
    };

    class BubbleController extends DatasetController {
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
      }
      parseObjectData(meta, data, start, count) {
        const {xScale, yScale} = meta;
        const {xAxisKey = 'x', yAxisKey = 'y'} = this._parsing;
        const parsed = [];
        let i, ilen, item;
        for (i = start, ilen = start + count; i < ilen; ++i) {
          item = data[i];
          parsed.push({
            x: xScale.parse(resolveObjectKey(item, xAxisKey), i),
            y: yScale.parse(resolveObjectKey(item, yAxisKey), i),
            _custom: item && item.r && +item.r
          });
        }
        return parsed;
      }
      getMaxOverflow() {
        const {data, _parsed} = this._cachedMeta;
        let max = 0;
        for (let i = data.length - 1; i >= 0; --i) {
          max = Math.max(max, data[i].size() / 2, _parsed[i]._custom);
        }
        return max > 0 && max;
      }
      getLabelAndValue(index) {
        const me = this;
        const meta = me._cachedMeta;
        const {xScale, yScale} = meta;
        const parsed = me.getParsed(index);
        const x = xScale.getLabelForValue(parsed.x);
        const y = yScale.getLabelForValue(parsed.y);
        const r = parsed._custom;
        return {
          label: meta.label,
          value: '(' + x + ', ' + y + (r ? ', ' + r : '') + ')'
        };
      }
      update(mode) {
        const me = this;
        const points = me._cachedMeta.data;
        me.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
        const me = this;
        const reset = mode === 'reset';
        const {xScale, yScale} = me._cachedMeta;
        const firstOpts = me.resolveDataElementOptions(start, mode);
        const sharedOptions = me.getSharedOptions(firstOpts);
        const includeOptions = me.includeOptions(mode, sharedOptions);
        for (let i = start; i < start + count; i++) {
          const point = points[i];
          const parsed = !reset && me.getParsed(i);
          const x = reset ? xScale.getPixelForDecimal(0.5) : xScale.getPixelForValue(parsed.x);
          const y = reset ? yScale.getBasePixel() : yScale.getPixelForValue(parsed.y);
          const properties = {
            x,
            y,
            skip: isNaN(x) || isNaN(y)
          };
          if (includeOptions) {
            properties.options = me.resolveDataElementOptions(i, mode);
            if (reset) {
              properties.options.radius = 0;
            }
          }
          me.updateElement(point, i, properties, mode);
        }
        me.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      resolveDataElementOptions(index, mode) {
        const parsed = this.getParsed(index);
        let values = super.resolveDataElementOptions(index, mode);
        if (values.$shared) {
          values = Object.assign({}, values, {$shared: false});
        }
        const radius = values.radius;
        if (mode !== 'active') {
          values.radius = 0;
        }
        values.radius += valueOrDefault(parsed && parsed._custom, radius);
        return values;
      }
    }
    BubbleController.id = 'bubble';
    BubbleController.defaults = {
      datasetElementType: false,
      dataElementType: 'point',
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'borderWidth', 'radius']
        }
      }
    };
    BubbleController.overrides = {
      scales: {
        x: {
          type: 'linear'
        },
        y: {
          type: 'linear'
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title() {
              return '';
            }
          }
        }
      }
    };

    function getRatioAndOffset(rotation, circumference, cutout) {
      let ratioX = 1;
      let ratioY = 1;
      let offsetX = 0;
      let offsetY = 0;
      if (circumference < TAU) {
        const startAngle = rotation;
        const endAngle = startAngle + circumference;
        const startX = Math.cos(startAngle);
        const startY = Math.sin(startAngle);
        const endX = Math.cos(endAngle);
        const endY = Math.sin(endAngle);
        const calcMax = (angle, a, b) => _angleBetween(angle, startAngle, endAngle) ? 1 : Math.max(a, a * cutout, b, b * cutout);
        const calcMin = (angle, a, b) => _angleBetween(angle, startAngle, endAngle) ? -1 : Math.min(a, a * cutout, b, b * cutout);
        const maxX = calcMax(0, startX, endX);
        const maxY = calcMax(HALF_PI, startY, endY);
        const minX = calcMin(PI, startX, endX);
        const minY = calcMin(PI + HALF_PI, startY, endY);
        ratioX = (maxX - minX) / 2;
        ratioY = (maxY - minY) / 2;
        offsetX = -(maxX + minX) / 2;
        offsetY = -(maxY + minY) / 2;
      }
      return {ratioX, ratioY, offsetX, offsetY};
    }
    class DoughnutController extends DatasetController {
      constructor(chart, datasetIndex) {
        super(chart, datasetIndex);
        this.enableOptionSharing = true;
        this.innerRadius = undefined;
        this.outerRadius = undefined;
        this.offsetX = undefined;
        this.offsetY = undefined;
      }
      linkScales() {}
      parse(start, count) {
        const data = this.getDataset().data;
        const meta = this._cachedMeta;
        let i, ilen;
        for (i = start, ilen = start + count; i < ilen; ++i) {
          meta._parsed[i] = +data[i];
        }
      }
      _getRotation() {
        return toRadians(this.options.rotation - 90);
      }
      _getCircumference() {
        return toRadians(this.options.circumference);
      }
      _getRotationExtents() {
        let min = TAU;
        let max = -TAU;
        const me = this;
        for (let i = 0; i < me.chart.data.datasets.length; ++i) {
          if (me.chart.isDatasetVisible(i)) {
            const controller = me.chart.getDatasetMeta(i).controller;
            const rotation = controller._getRotation();
            const circumference = controller._getCircumference();
            min = Math.min(min, rotation);
            max = Math.max(max, rotation + circumference);
          }
        }
        return {
          rotation: min,
          circumference: max - min,
        };
      }
      update(mode) {
        const me = this;
        const chart = me.chart;
        const {chartArea} = chart;
        const meta = me._cachedMeta;
        const arcs = meta.data;
        const spacing = me.getMaxBorderWidth() + me.getMaxOffset(arcs);
        const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
        const cutout = Math.min(toPercentage(me.options.cutout, maxSize), 1);
        const chartWeight = me._getRingWeight(me.index);
        const {circumference, rotation} = me._getRotationExtents();
        const {ratioX, ratioY, offsetX, offsetY} = getRatioAndOffset(rotation, circumference, cutout);
        const maxWidth = (chartArea.width - spacing) / ratioX;
        const maxHeight = (chartArea.height - spacing) / ratioY;
        const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
        const outerRadius = toDimension(me.options.radius, maxRadius);
        const innerRadius = Math.max(outerRadius * cutout, 0);
        const radiusLength = (outerRadius - innerRadius) / me._getVisibleDatasetWeightTotal();
        me.offsetX = offsetX * outerRadius;
        me.offsetY = offsetY * outerRadius;
        meta.total = me.calculateTotal();
        me.outerRadius = outerRadius - radiusLength * me._getRingWeightOffset(me.index);
        me.innerRadius = Math.max(me.outerRadius - radiusLength * chartWeight, 0);
        me.updateElements(arcs, 0, arcs.length, mode);
      }
      _circumference(i, reset) {
        const me = this;
        const opts = me.options;
        const meta = me._cachedMeta;
        const circumference = me._getCircumference();
        if ((reset && opts.animation.animateRotate) || !this.chart.getDataVisibility(i) || meta._parsed[i] === null) {
          return 0;
        }
        return me.calculateCircumference(meta._parsed[i] * circumference / TAU);
      }
      updateElements(arcs, start, count, mode) {
        const me = this;
        const reset = mode === 'reset';
        const chart = me.chart;
        const chartArea = chart.chartArea;
        const opts = chart.options;
        const animationOpts = opts.animation;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        const animateScale = reset && animationOpts.animateScale;
        const innerRadius = animateScale ? 0 : me.innerRadius;
        const outerRadius = animateScale ? 0 : me.outerRadius;
        const firstOpts = me.resolveDataElementOptions(start, mode);
        const sharedOptions = me.getSharedOptions(firstOpts);
        const includeOptions = me.includeOptions(mode, sharedOptions);
        let startAngle = me._getRotation();
        let i;
        for (i = 0; i < start; ++i) {
          startAngle += me._circumference(i, reset);
        }
        for (i = start; i < start + count; ++i) {
          const circumference = me._circumference(i, reset);
          const arc = arcs[i];
          const properties = {
            x: centerX + me.offsetX,
            y: centerY + me.offsetY,
            startAngle,
            endAngle: startAngle + circumference,
            circumference,
            outerRadius,
            innerRadius
          };
          if (includeOptions) {
            properties.options = sharedOptions || me.resolveDataElementOptions(i, mode);
          }
          startAngle += circumference;
          me.updateElement(arc, i, properties, mode);
        }
        me.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      calculateTotal() {
        const meta = this._cachedMeta;
        const metaData = meta.data;
        let total = 0;
        let i;
        for (i = 0; i < metaData.length; i++) {
          const value = meta._parsed[i];
          if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i)) {
            total += Math.abs(value);
          }
        }
        return total;
      }
      calculateCircumference(value) {
        const total = this._cachedMeta.total;
        if (total > 0 && !isNaN(value)) {
          return TAU * (Math.abs(value) / total);
        }
        return 0;
      }
      getLabelAndValue(index) {
        const me = this;
        const meta = me._cachedMeta;
        const chart = me.chart;
        const labels = chart.data.labels || [];
        const value = formatNumber(meta._parsed[index], chart.options.locale);
        return {
          label: labels[index] || '',
          value,
        };
      }
      getMaxBorderWidth(arcs) {
        const me = this;
        let max = 0;
        const chart = me.chart;
        let i, ilen, meta, controller, options;
        if (!arcs) {
          for (i = 0, ilen = chart.data.datasets.length; i < ilen; ++i) {
            if (chart.isDatasetVisible(i)) {
              meta = chart.getDatasetMeta(i);
              arcs = meta.data;
              controller = meta.controller;
              if (controller !== me) {
                controller.configure();
              }
              break;
            }
          }
        }
        if (!arcs) {
          return 0;
        }
        for (i = 0, ilen = arcs.length; i < ilen; ++i) {
          options = controller.resolveDataElementOptions(i);
          if (options.borderAlign !== 'inner') {
            max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
          }
        }
        return max;
      }
      getMaxOffset(arcs) {
        let max = 0;
        for (let i = 0, ilen = arcs.length; i < ilen; ++i) {
          const options = this.resolveDataElementOptions(i);
          max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
        }
        return max;
      }
      _getRingWeightOffset(datasetIndex) {
        let ringWeightOffset = 0;
        for (let i = 0; i < datasetIndex; ++i) {
          if (this.chart.isDatasetVisible(i)) {
            ringWeightOffset += this._getRingWeight(i);
          }
        }
        return ringWeightOffset;
      }
      _getRingWeight(datasetIndex) {
        return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
      }
      _getVisibleDatasetWeightTotal() {
        return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
      }
    }
    DoughnutController.id = 'doughnut';
    DoughnutController.defaults = {
      datasetElementType: false,
      dataElementType: 'arc',
      animation: {
        animateRotate: true,
        animateScale: false
      },
      animations: {
        numbers: {
          type: 'number',
          properties: ['circumference', 'endAngle', 'innerRadius', 'outerRadius', 'startAngle', 'x', 'y', 'offset', 'borderWidth']
        },
      },
      cutout: '50%',
      rotation: 0,
      circumference: 360,
      radius: '100%',
      indexAxis: 'r',
    };
    DoughnutController.overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i);
                  return {
                    text: label,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                  };
                });
              }
              return [];
            }
          },
          onClick(e, legendItem, legend) {
            legend.chart.toggleDataVisibility(legendItem.index);
            legend.chart.update();
          }
        },
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(tooltipItem) {
              let dataLabel = tooltipItem.label;
              const value = ': ' + tooltipItem.formattedValue;
              if (isArray(dataLabel)) {
                dataLabel = dataLabel.slice();
                dataLabel[0] += value;
              } else {
                dataLabel += value;
              }
              return dataLabel;
            }
          }
        }
      }
    };

    class LineController extends DatasetController {
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
      }
      update(mode) {
        const me = this;
        const meta = me._cachedMeta;
        const {dataset: line, data: points = [], _dataset} = meta;
        const animationsDisabled = me.chart._animationsDisabled;
        let {start, count} = getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
        me._drawStart = start;
        me._drawCount = count;
        if (scaleRangesChanged(meta)) {
          start = 0;
          count = points.length;
        }
        line._decimated = !!_dataset._decimated;
        line.points = points;
        const options = me.resolveDatasetElementOptions(mode);
        if (!me.options.showLine) {
          options.borderWidth = 0;
        }
        options.segment = me.options.segment;
        me.updateElement(line, undefined, {
          animated: !animationsDisabled,
          options
        }, mode);
        me.updateElements(points, start, count, mode);
      }
      updateElements(points, start, count, mode) {
        const me = this;
        const reset = mode === 'reset';
        const {xScale, yScale, _stacked} = me._cachedMeta;
        const firstOpts = me.resolveDataElementOptions(start, mode);
        const sharedOptions = me.getSharedOptions(firstOpts);
        const includeOptions = me.includeOptions(mode, sharedOptions);
        const spanGaps = me.options.spanGaps;
        const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
        const directUpdate = me.chart._animationsDisabled || reset || mode === 'none';
        let prevParsed = start > 0 && me.getParsed(start - 1);
        for (let i = start; i < start + count; ++i) {
          const point = points[i];
          const parsed = me.getParsed(i);
          const properties = directUpdate ? point : {};
          const nullData = isNullOrUndef(parsed.y);
          const x = properties.x = xScale.getPixelForValue(parsed.x, i);
          const y = properties.y = reset || nullData ? yScale.getBasePixel() : yScale.getPixelForValue(_stacked ? me.applyStack(yScale, parsed, _stacked) : parsed.y, i);
          properties.skip = isNaN(x) || isNaN(y) || nullData;
          properties.stop = i > 0 && (parsed.x - prevParsed.x) > maxGapLength;
          properties.parsed = parsed;
          if (includeOptions) {
            properties.options = sharedOptions || me.resolveDataElementOptions(i, mode);
          }
          if (!directUpdate) {
            me.updateElement(point, i, properties, mode);
          }
          prevParsed = parsed;
        }
        me.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      getMaxOverflow() {
        const me = this;
        const meta = me._cachedMeta;
        const dataset = meta.dataset;
        const border = dataset.options && dataset.options.borderWidth || 0;
        const data = meta.data || [];
        if (!data.length) {
          return border;
        }
        const firstPoint = data[0].size(me.resolveDataElementOptions(0));
        const lastPoint = data[data.length - 1].size(me.resolveDataElementOptions(data.length - 1));
        return Math.max(border, firstPoint, lastPoint) / 2;
      }
      draw() {
        this._cachedMeta.dataset.updateControlPoints(this.chart.chartArea);
        super.draw();
      }
    }
    LineController.id = 'line';
    LineController.defaults = {
      datasetElementType: 'line',
      dataElementType: 'point',
      showLine: true,
      spanGaps: false,
    };
    LineController.overrides = {
      scales: {
        _index_: {
          type: 'category',
        },
        _value_: {
          type: 'linear',
        },
      }
    };
    function getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
      const pointCount = points.length;
      let start = 0;
      let count = pointCount;
      if (meta._sorted) {
        const {iScale, _parsed} = meta;
        const axis = iScale.axis;
        const {min, max, minDefined, maxDefined} = iScale.getUserBounds();
        if (minDefined) {
          start = _limitValue(Math.min(
            _lookupByKey(_parsed, iScale.axis, min).lo,
            animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo),
          0, pointCount - 1);
        }
        if (maxDefined) {
          count = _limitValue(Math.max(
            _lookupByKey(_parsed, iScale.axis, max).hi + 1,
            animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max)).hi + 1),
          start, pointCount) - start;
        } else {
          count = pointCount - start;
        }
      }
      return {start, count};
    }
    function scaleRangesChanged(meta) {
      const {xScale, yScale, _scaleRanges} = meta;
      const newRanges = {
        xmin: xScale.min,
        xmax: xScale.max,
        ymin: yScale.min,
        ymax: yScale.max
      };
      if (!_scaleRanges) {
        meta._scaleRanges = newRanges;
        return true;
      }
      const changed = _scaleRanges.xmin !== xScale.min
    		|| _scaleRanges.xmax !== xScale.max
    		|| _scaleRanges.ymin !== yScale.min
    		|| _scaleRanges.ymax !== yScale.max;
      Object.assign(_scaleRanges, newRanges);
      return changed;
    }

    class PolarAreaController extends DatasetController {
      constructor(chart, datasetIndex) {
        super(chart, datasetIndex);
        this.innerRadius = undefined;
        this.outerRadius = undefined;
      }
      update(mode) {
        const arcs = this._cachedMeta.data;
        this._updateRadius();
        this.updateElements(arcs, 0, arcs.length, mode);
      }
      _updateRadius() {
        const me = this;
        const chart = me.chart;
        const chartArea = chart.chartArea;
        const opts = chart.options;
        const minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        const outerRadius = Math.max(minSize / 2, 0);
        const innerRadius = Math.max(opts.cutoutPercentage ? (outerRadius / 100) * (opts.cutoutPercentage) : 1, 0);
        const radiusLength = (outerRadius - innerRadius) / chart.getVisibleDatasetCount();
        me.outerRadius = outerRadius - (radiusLength * me.index);
        me.innerRadius = me.outerRadius - radiusLength;
      }
      updateElements(arcs, start, count, mode) {
        const me = this;
        const reset = mode === 'reset';
        const chart = me.chart;
        const dataset = me.getDataset();
        const opts = chart.options;
        const animationOpts = opts.animation;
        const scale = me._cachedMeta.rScale;
        const centerX = scale.xCenter;
        const centerY = scale.yCenter;
        const datasetStartAngle = scale.getIndexAngle(0) - 0.5 * PI;
        let angle = datasetStartAngle;
        let i;
        const defaultAngle = 360 / me.countVisibleElements();
        for (i = 0; i < start; ++i) {
          angle += me._computeAngle(i, mode, defaultAngle);
        }
        for (i = start; i < start + count; i++) {
          const arc = arcs[i];
          let startAngle = angle;
          let endAngle = angle + me._computeAngle(i, mode, defaultAngle);
          let outerRadius = chart.getDataVisibility(i) ? scale.getDistanceFromCenterForValue(dataset.data[i]) : 0;
          angle = endAngle;
          if (reset) {
            if (animationOpts.animateScale) {
              outerRadius = 0;
            }
            if (animationOpts.animateRotate) {
              startAngle = endAngle = datasetStartAngle;
            }
          }
          const properties = {
            x: centerX,
            y: centerY,
            innerRadius: 0,
            outerRadius,
            startAngle,
            endAngle,
            options: me.resolveDataElementOptions(i, mode)
          };
          me.updateElement(arc, i, properties, mode);
        }
      }
      countVisibleElements() {
        const dataset = this.getDataset();
        const meta = this._cachedMeta;
        let count = 0;
        meta.data.forEach((element, index) => {
          if (!isNaN(dataset.data[index]) && this.chart.getDataVisibility(index)) {
            count++;
          }
        });
        return count;
      }
      _computeAngle(index, mode, defaultAngle) {
        return this.chart.getDataVisibility(index)
          ? toRadians(this.resolveDataElementOptions(index, mode).angle || defaultAngle)
          : 0;
      }
    }
    PolarAreaController.id = 'polarArea';
    PolarAreaController.defaults = {
      dataElementType: 'arc',
      animation: {
        animateRotate: true,
        animateScale: true
      },
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius']
        },
      },
      indexAxis: 'r',
      startAngle: 0,
    };
    PolarAreaController.overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i);
                  return {
                    text: label,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                  };
                });
              }
              return [];
            }
          },
          onClick(e, legendItem, legend) {
            legend.chart.toggleDataVisibility(legendItem.index);
            legend.chart.update();
          }
        },
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(context) {
              return context.chart.data.labels[context.dataIndex] + ': ' + context.formattedValue;
            }
          }
        }
      },
      scales: {
        r: {
          type: 'radialLinear',
          angleLines: {
            display: false
          },
          beginAtZero: true,
          grid: {
            circular: true
          },
          pointLabels: {
            display: false
          },
          startAngle: 0
        }
      }
    };

    class PieController extends DoughnutController {
    }
    PieController.id = 'pie';
    PieController.defaults = {
      cutout: 0,
      rotation: 0,
      circumference: 360,
      radius: '100%'
    };

    class RadarController extends DatasetController {
      getLabelAndValue(index) {
        const me = this;
        const vScale = me._cachedMeta.vScale;
        const parsed = me.getParsed(index);
        return {
          label: vScale.getLabels()[index],
          value: '' + vScale.getLabelForValue(parsed[vScale.axis])
        };
      }
      update(mode) {
        const me = this;
        const meta = me._cachedMeta;
        const line = meta.dataset;
        const points = meta.data || [];
        const labels = meta.iScale.getLabels();
        line.points = points;
        if (mode !== 'resize') {
          const options = me.resolveDatasetElementOptions(mode);
          if (!me.options.showLine) {
            options.borderWidth = 0;
          }
          const properties = {
            _loop: true,
            _fullLoop: labels.length === points.length,
            options
          };
          me.updateElement(line, undefined, properties, mode);
        }
        me.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
        const me = this;
        const dataset = me.getDataset();
        const scale = me._cachedMeta.rScale;
        const reset = mode === 'reset';
        for (let i = start; i < start + count; i++) {
          const point = points[i];
          const options = me.resolveDataElementOptions(i, mode);
          const pointPosition = scale.getPointPositionForValue(i, dataset.data[i]);
          const x = reset ? scale.xCenter : pointPosition.x;
          const y = reset ? scale.yCenter : pointPosition.y;
          const properties = {
            x,
            y,
            angle: pointPosition.angle,
            skip: isNaN(x) || isNaN(y),
            options
          };
          me.updateElement(point, i, properties, mode);
        }
      }
    }
    RadarController.id = 'radar';
    RadarController.defaults = {
      datasetElementType: 'line',
      dataElementType: 'point',
      indexAxis: 'r',
      showLine: true,
      elements: {
        line: {
          fill: 'start'
        }
      },
    };
    RadarController.overrides = {
      aspectRatio: 1,
      scales: {
        r: {
          type: 'radialLinear',
        }
      }
    };

    class ScatterController extends LineController {
    }
    ScatterController.id = 'scatter';
    ScatterController.defaults = {
      showLine: false,
      fill: false
    };
    ScatterController.overrides = {
      interaction: {
        mode: 'point'
      },
      plugins: {
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(item) {
              return '(' + item.label + ', ' + item.formattedValue + ')';
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear'
        },
        y: {
          type: 'linear'
        }
      }
    };

    var controllers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BarController: BarController,
    BubbleController: BubbleController,
    DoughnutController: DoughnutController,
    LineController: LineController,
    PolarAreaController: PolarAreaController,
    PieController: PieController,
    RadarController: RadarController,
    ScatterController: ScatterController
    });

    function abstract() {
      throw new Error('This method is not implemented: either no adapter can be found or an incomplete integration was provided.');
    }
    class DateAdapter {
      constructor(options) {
        this.options = options || {};
      }
      formats() {
        return abstract();
      }
      parse(value, format) {
        return abstract();
      }
      format(timestamp, format) {
        return abstract();
      }
      add(timestamp, amount, unit) {
        return abstract();
      }
      diff(a, b, unit) {
        return abstract();
      }
      startOf(timestamp, unit, weekday) {
        return abstract();
      }
      endOf(timestamp, unit) {
        return abstract();
      }
    }
    DateAdapter.override = function(members) {
      Object.assign(DateAdapter.prototype, members);
    };
    var adapters = {
      _date: DateAdapter
    };

    function getRelativePosition(e, chart) {
      if ('native' in e) {
        return {
          x: e.x,
          y: e.y
        };
      }
      return getRelativePosition$1(e, chart);
    }
    function evaluateAllVisibleItems(chart, handler) {
      const metasets = chart.getSortedVisibleDatasetMetas();
      let index, data, element;
      for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
        ({index, data} = metasets[i]);
        for (let j = 0, jlen = data.length; j < jlen; ++j) {
          element = data[j];
          if (!element.skip) {
            handler(element, index, j);
          }
        }
      }
    }
    function binarySearch(metaset, axis, value, intersect) {
      const {controller, data, _sorted} = metaset;
      const iScale = controller._cachedMeta.iScale;
      if (iScale && axis === iScale.axis && _sorted && data.length) {
        const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
        if (!intersect) {
          return lookupMethod(data, axis, value);
        } else if (controller._sharedOptions) {
          const el = data[0];
          const range = typeof el.getRange === 'function' && el.getRange(axis);
          if (range) {
            const start = lookupMethod(data, axis, value - range);
            const end = lookupMethod(data, axis, value + range);
            return {lo: start.lo, hi: end.hi};
          }
        }
      }
      return {lo: 0, hi: data.length - 1};
    }
    function optimizedEvaluateItems(chart, axis, position, handler, intersect) {
      const metasets = chart.getSortedVisibleDatasetMetas();
      const value = position[axis];
      for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
        const {index, data} = metasets[i];
        const {lo, hi} = binarySearch(metasets[i], axis, value, intersect);
        for (let j = lo; j <= hi; ++j) {
          const element = data[j];
          if (!element.skip) {
            handler(element, index, j);
          }
        }
      }
    }
    function getDistanceMetricForAxis(axis) {
      const useX = axis.indexOf('x') !== -1;
      const useY = axis.indexOf('y') !== -1;
      return function(pt1, pt2) {
        const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
        const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
        return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      };
    }
    function getIntersectItems(chart, position, axis, useFinalPosition) {
      const items = [];
      if (!_isPointInArea(position, chart.chartArea, chart._minPadding)) {
        return items;
      }
      const evaluationFunc = function(element, datasetIndex, index) {
        if (element.inRange(position.x, position.y, useFinalPosition)) {
          items.push({element, datasetIndex, index});
        }
      };
      optimizedEvaluateItems(chart, axis, position, evaluationFunc, true);
      return items;
    }
    function getNearestItems(chart, position, axis, intersect, useFinalPosition) {
      const distanceMetric = getDistanceMetricForAxis(axis);
      let minDistance = Number.POSITIVE_INFINITY;
      let items = [];
      if (!_isPointInArea(position, chart.chartArea, chart._minPadding)) {
        return items;
      }
      const evaluationFunc = function(element, datasetIndex, index) {
        if (intersect && !element.inRange(position.x, position.y, useFinalPosition)) {
          return;
        }
        const center = element.getCenterPoint(useFinalPosition);
        const distance = distanceMetric(position, center);
        if (distance < minDistance) {
          items = [{element, datasetIndex, index}];
          minDistance = distance;
        } else if (distance === minDistance) {
          items.push({element, datasetIndex, index});
        }
      };
      optimizedEvaluateItems(chart, axis, position, evaluationFunc);
      return items;
    }
    function getAxisItems(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      const items = [];
      const axis = options.axis;
      const rangeMethod = axis === 'x' ? 'inXRange' : 'inYRange';
      let intersectsItem = false;
      evaluateAllVisibleItems(chart, (element, datasetIndex, index) => {
        if (element[rangeMethod](position[axis], useFinalPosition)) {
          items.push({element, datasetIndex, index});
        }
        if (element.inRange(position.x, position.y, useFinalPosition)) {
          intersectsItem = true;
        }
      });
      if (options.intersect && !intersectsItem) {
        return [];
      }
      return items;
    }
    var Interaction = {
      modes: {
        index(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'x';
          const items = options.intersect
            ? getIntersectItems(chart, position, axis, useFinalPosition)
            : getNearestItems(chart, position, axis, false, useFinalPosition);
          const elements = [];
          if (!items.length) {
            return [];
          }
          chart.getSortedVisibleDatasetMetas().forEach((meta) => {
            const index = items[0].index;
            const element = meta.data[index];
            if (element && !element.skip) {
              elements.push({element, datasetIndex: meta.index, index});
            }
          });
          return elements;
        },
        dataset(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'xy';
          let items = options.intersect
            ? getIntersectItems(chart, position, axis, useFinalPosition) :
            getNearestItems(chart, position, axis, false, useFinalPosition);
          if (items.length > 0) {
            const datasetIndex = items[0].datasetIndex;
            const data = chart.getDatasetMeta(datasetIndex).data;
            items = [];
            for (let i = 0; i < data.length; ++i) {
              items.push({element: data[i], datasetIndex, index: i});
            }
          }
          return items;
        },
        point(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'xy';
          return getIntersectItems(chart, position, axis, useFinalPosition);
        },
        nearest(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'xy';
          return getNearestItems(chart, position, axis, options.intersect, useFinalPosition);
        },
        x(chart, e, options, useFinalPosition) {
          options.axis = 'x';
          return getAxisItems(chart, e, options, useFinalPosition);
        },
        y(chart, e, options, useFinalPosition) {
          options.axis = 'y';
          return getAxisItems(chart, e, options, useFinalPosition);
        }
      }
    };

    const STATIC_POSITIONS = ['left', 'top', 'right', 'bottom'];
    function filterByPosition(array, position) {
      return array.filter(v => v.pos === position);
    }
    function filterDynamicPositionByAxis(array, axis) {
      return array.filter(v => STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
    }
    function sortByWeight(array, reverse) {
      return array.sort((a, b) => {
        const v0 = reverse ? b : a;
        const v1 = reverse ? a : b;
        return v0.weight === v1.weight ?
          v0.index - v1.index :
          v0.weight - v1.weight;
      });
    }
    function wrapBoxes(boxes) {
      const layoutBoxes = [];
      let i, ilen, box;
      for (i = 0, ilen = (boxes || []).length; i < ilen; ++i) {
        box = boxes[i];
        layoutBoxes.push({
          index: i,
          box,
          pos: box.position,
          horizontal: box.isHorizontal(),
          weight: box.weight
        });
      }
      return layoutBoxes;
    }
    function setLayoutDims(layouts, params) {
      let i, ilen, layout;
      for (i = 0, ilen = layouts.length; i < ilen; ++i) {
        layout = layouts[i];
        if (layout.horizontal) {
          layout.width = layout.box.fullSize && params.availableWidth;
          layout.height = params.hBoxMaxHeight;
        } else {
          layout.width = params.vBoxMaxWidth;
          layout.height = layout.box.fullSize && params.availableHeight;
        }
      }
    }
    function buildLayoutBoxes(boxes) {
      const layoutBoxes = wrapBoxes(boxes);
      const fullSize = sortByWeight(layoutBoxes.filter(wrap => wrap.box.fullSize), true);
      const left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
      const right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
      const top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
      const bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
      const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, 'x');
      const centerVertical = filterDynamicPositionByAxis(layoutBoxes, 'y');
      return {
        fullSize,
        leftAndTop: left.concat(top),
        rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
        chartArea: filterByPosition(layoutBoxes, 'chartArea'),
        vertical: left.concat(right).concat(centerVertical),
        horizontal: top.concat(bottom).concat(centerHorizontal)
      };
    }
    function getCombinedMax(maxPadding, chartArea, a, b) {
      return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
    }
    function updateMaxPadding(maxPadding, boxPadding) {
      maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
      maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
      maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
      maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
    }
    function updateDims(chartArea, params, layout) {
      const box = layout.box;
      const maxPadding = chartArea.maxPadding;
      if (!isObject(layout.pos)) {
        if (layout.size) {
          chartArea[layout.pos] -= layout.size;
        }
        layout.size = layout.horizontal ? box.height : box.width;
        chartArea[layout.pos] += layout.size;
      }
      if (box.getPadding) {
        updateMaxPadding(maxPadding, box.getPadding());
      }
      const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right'));
      const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom'));
      const widthChanged = newWidth !== chartArea.w;
      const heightChanged = newHeight !== chartArea.h;
      chartArea.w = newWidth;
      chartArea.h = newHeight;
      return layout.horizontal
        ? {same: widthChanged, other: heightChanged}
        : {same: heightChanged, other: widthChanged};
    }
    function handleMaxPadding(chartArea) {
      const maxPadding = chartArea.maxPadding;
      function updatePos(pos) {
        const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
        chartArea[pos] += change;
        return change;
      }
      chartArea.y += updatePos('top');
      chartArea.x += updatePos('left');
      updatePos('right');
      updatePos('bottom');
    }
    function getMargins(horizontal, chartArea) {
      const maxPadding = chartArea.maxPadding;
      function marginForPositions(positions) {
        const margin = {left: 0, top: 0, right: 0, bottom: 0};
        positions.forEach((pos) => {
          margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
        });
        return margin;
      }
      return horizontal
        ? marginForPositions(['left', 'right'])
        : marginForPositions(['top', 'bottom']);
    }
    function fitBoxes(boxes, chartArea, params) {
      const refitBoxes = [];
      let i, ilen, layout, box, refit, changed;
      for (i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i) {
        layout = boxes[i];
        box = layout.box;
        box.update(
          layout.width || chartArea.w,
          layout.height || chartArea.h,
          getMargins(layout.horizontal, chartArea)
        );
        const {same, other} = updateDims(chartArea, params, layout);
        refit |= same && refitBoxes.length;
        changed = changed || other;
        if (!box.fullSize) {
          refitBoxes.push(layout);
        }
      }
      return refit && fitBoxes(refitBoxes, chartArea, params) || changed;
    }
    function placeBoxes(boxes, chartArea, params) {
      const userPadding = params.padding;
      let x = chartArea.x;
      let y = chartArea.y;
      let i, ilen, layout, box;
      for (i = 0, ilen = boxes.length; i < ilen; ++i) {
        layout = boxes[i];
        box = layout.box;
        if (layout.horizontal) {
          box.left = box.fullSize ? userPadding.left : chartArea.left;
          box.right = box.fullSize ? params.outerWidth - userPadding.right : chartArea.left + chartArea.w;
          box.top = y;
          box.bottom = y + box.height;
          box.width = box.right - box.left;
          y = box.bottom;
        } else {
          box.left = x;
          box.right = x + box.width;
          box.top = box.fullSize ? userPadding.top : chartArea.top;
          box.bottom = box.fullSize ? params.outerHeight - userPadding.right : chartArea.top + chartArea.h;
          box.height = box.bottom - box.top;
          x = box.right;
        }
      }
      chartArea.x = x;
      chartArea.y = y;
    }
    defaults.set('layout', {
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
    var layouts = {
      addBox(chart, item) {
        if (!chart.boxes) {
          chart.boxes = [];
        }
        item.fullSize = item.fullSize || false;
        item.position = item.position || 'top';
        item.weight = item.weight || 0;
        item._layers = item._layers || function() {
          return [{
            z: 0,
            draw(chartArea) {
              item.draw(chartArea);
            }
          }];
        };
        chart.boxes.push(item);
      },
      removeBox(chart, layoutItem) {
        const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
        if (index !== -1) {
          chart.boxes.splice(index, 1);
        }
      },
      configure(chart, item, options) {
        item.fullSize = options.fullSize;
        item.position = options.position;
        item.weight = options.weight;
      },
      update(chart, width, height, minPadding) {
        if (!chart) {
          return;
        }
        const padding = toPadding(chart.options.layout.padding);
        const availableWidth = width - padding.width;
        const availableHeight = height - padding.height;
        const boxes = buildLayoutBoxes(chart.boxes);
        const verticalBoxes = boxes.vertical;
        const horizontalBoxes = boxes.horizontal;
        each(chart.boxes, box => {
          if (typeof box.beforeLayout === 'function') {
            box.beforeLayout();
          }
        });
        const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap) =>
          wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
        const params = Object.freeze({
          outerWidth: width,
          outerHeight: height,
          padding,
          availableWidth,
          availableHeight,
          vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
          hBoxMaxHeight: availableHeight / 2
        });
        const maxPadding = Object.assign({}, padding);
        updateMaxPadding(maxPadding, toPadding(minPadding));
        const chartArea = Object.assign({
          maxPadding,
          w: availableWidth,
          h: availableHeight,
          x: padding.left,
          y: padding.top
        }, padding);
        setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
        fitBoxes(boxes.fullSize, chartArea, params);
        fitBoxes(verticalBoxes, chartArea, params);
        if (fitBoxes(horizontalBoxes, chartArea, params)) {
          fitBoxes(verticalBoxes, chartArea, params);
        }
        handleMaxPadding(chartArea);
        placeBoxes(boxes.leftAndTop, chartArea, params);
        chartArea.x += chartArea.w;
        chartArea.y += chartArea.h;
        placeBoxes(boxes.rightAndBottom, chartArea, params);
        chart.chartArea = {
          left: chartArea.left,
          top: chartArea.top,
          right: chartArea.left + chartArea.w,
          bottom: chartArea.top + chartArea.h,
          height: chartArea.h,
          width: chartArea.w,
        };
        each(boxes.chartArea, (layout) => {
          const box = layout.box;
          Object.assign(box, chart.chartArea);
          box.update(chartArea.w, chartArea.h);
        });
      }
    };

    class BasePlatform {
      acquireContext(canvas, aspectRatio) {}
      releaseContext(context) {
        return false;
      }
      addEventListener(chart, type, listener) {}
      removeEventListener(chart, type, listener) {}
      getDevicePixelRatio() {
        return 1;
      }
      getMaximumSize(element, width, height, aspectRatio) {
        width = Math.max(0, width || element.width);
        height = height || element.height;
        return {
          width,
          height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
        };
      }
      isAttached(canvas) {
        return true;
      }
    }

    class BasicPlatform extends BasePlatform {
      acquireContext(item) {
        return item && item.getContext && item.getContext('2d') || null;
      }
    }

    const EXPANDO_KEY = '$chartjs';
    const EVENT_TYPES = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
      pointerenter: 'mouseenter',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerleave: 'mouseout',
      pointerout: 'mouseout'
    };
    const isNullOrEmpty = value => value === null || value === '';
    function initCanvas(canvas, aspectRatio) {
      const style = canvas.style;
      const renderHeight = canvas.getAttribute('height');
      const renderWidth = canvas.getAttribute('width');
      canvas[EXPANDO_KEY] = {
        initial: {
          height: renderHeight,
          width: renderWidth,
          style: {
            display: style.display,
            height: style.height,
            width: style.width
          }
        }
      };
      style.display = style.display || 'block';
      style.boxSizing = style.boxSizing || 'border-box';
      if (isNullOrEmpty(renderWidth)) {
        const displayWidth = readUsedSize(canvas, 'width');
        if (displayWidth !== undefined) {
          canvas.width = displayWidth;
        }
      }
      if (isNullOrEmpty(renderHeight)) {
        if (canvas.style.height === '') {
          canvas.height = canvas.width / (aspectRatio || 2);
        } else {
          const displayHeight = readUsedSize(canvas, 'height');
          if (displayHeight !== undefined) {
            canvas.height = displayHeight;
          }
        }
      }
      return canvas;
    }
    const eventListenerOptions = supportsEventListenerOptions ? {passive: true} : false;
    function addListener(node, type, listener) {
      node.addEventListener(type, listener, eventListenerOptions);
    }
    function removeListener(chart, type, listener) {
      chart.canvas.removeEventListener(type, listener, eventListenerOptions);
    }
    function fromNativeEvent(event, chart) {
      const type = EVENT_TYPES[event.type] || event.type;
      const {x, y} = getRelativePosition$1(event, chart);
      return {
        type,
        chart,
        native: event,
        x: x !== undefined ? x : null,
        y: y !== undefined ? y : null,
      };
    }
    function createAttachObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const container = canvas && _getParentNode(canvas);
      const element = container || canvas;
      const observer = new MutationObserver(entries => {
        const parent = _getParentNode(element);
        entries.forEach(entry => {
          for (let i = 0; i < entry.addedNodes.length; i++) {
            const added = entry.addedNodes[i];
            if (added === element || added === parent) {
              listener(entry.target);
            }
          }
        });
      });
      observer.observe(document, {childList: true, subtree: true});
      return observer;
    }
    function createDetachObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const container = canvas && _getParentNode(canvas);
      if (!container) {
        return;
      }
      const observer = new MutationObserver(entries => {
        entries.forEach(entry => {
          for (let i = 0; i < entry.removedNodes.length; i++) {
            if (entry.removedNodes[i] === canvas) {
              listener();
              break;
            }
          }
        });
      });
      observer.observe(container, {childList: true});
      return observer;
    }
    const drpListeningCharts = new Map();
    let oldDevicePixelRatio = 0;
    function onWindowResize() {
      const dpr = window.devicePixelRatio;
      if (dpr === oldDevicePixelRatio) {
        return;
      }
      oldDevicePixelRatio = dpr;
      drpListeningCharts.forEach((resize, chart) => {
        if (chart.currentDevicePixelRatio !== dpr) {
          resize();
        }
      });
    }
    function listenDevicePixelRatioChanges(chart, resize) {
      if (!drpListeningCharts.size) {
        window.addEventListener('resize', onWindowResize);
      }
      drpListeningCharts.set(chart, resize);
    }
    function unlistenDevicePixelRatioChanges(chart) {
      drpListeningCharts.delete(chart);
      if (!drpListeningCharts.size) {
        window.removeEventListener('resize', onWindowResize);
      }
    }
    function createResizeObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const container = canvas && _getParentNode(canvas);
      if (!container) {
        return;
      }
      const resize = throttled((width, height) => {
        const w = container.clientWidth;
        listener(width, height);
        if (w < container.clientWidth) {
          listener();
        }
      }, window);
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width === 0 && height === 0) {
          return;
        }
        resize(width, height);
      });
      observer.observe(container);
      listenDevicePixelRatioChanges(chart, resize);
      return observer;
    }
    function releaseObserver(chart, type, observer) {
      if (observer) {
        observer.disconnect();
      }
      if (type === 'resize') {
        unlistenDevicePixelRatioChanges(chart);
      }
    }
    function createProxyAndListen(chart, type, listener) {
      const canvas = chart.canvas;
      const proxy = throttled((event) => {
        if (chart.ctx !== null) {
          listener(fromNativeEvent(event, chart));
        }
      }, chart, (args) => {
        const event = args[0];
        return [event, event.offsetX, event.offsetY];
      });
      addListener(canvas, type, proxy);
      return proxy;
    }
    class DomPlatform extends BasePlatform {
      acquireContext(canvas, aspectRatio) {
        const context = canvas && canvas.getContext && canvas.getContext('2d');
        if (context && context.canvas === canvas) {
          initCanvas(canvas, aspectRatio);
          return context;
        }
        return null;
      }
      releaseContext(context) {
        const canvas = context.canvas;
        if (!canvas[EXPANDO_KEY]) {
          return false;
        }
        const initial = canvas[EXPANDO_KEY].initial;
        ['height', 'width'].forEach((prop) => {
          const value = initial[prop];
          if (isNullOrUndef(value)) {
            canvas.removeAttribute(prop);
          } else {
            canvas.setAttribute(prop, value);
          }
        });
        const style = initial.style || {};
        Object.keys(style).forEach((key) => {
          canvas.style[key] = style[key];
        });
        canvas.width = canvas.width;
        delete canvas[EXPANDO_KEY];
        return true;
      }
      addEventListener(chart, type, listener) {
        this.removeEventListener(chart, type);
        const proxies = chart.$proxies || (chart.$proxies = {});
        const handlers = {
          attach: createAttachObserver,
          detach: createDetachObserver,
          resize: createResizeObserver
        };
        const handler = handlers[type] || createProxyAndListen;
        proxies[type] = handler(chart, type, listener);
      }
      removeEventListener(chart, type) {
        const proxies = chart.$proxies || (chart.$proxies = {});
        const proxy = proxies[type];
        if (!proxy) {
          return;
        }
        const handlers = {
          attach: releaseObserver,
          detach: releaseObserver,
          resize: releaseObserver
        };
        const handler = handlers[type] || removeListener;
        handler(chart, type, proxy);
        proxies[type] = undefined;
      }
      getDevicePixelRatio() {
        return window.devicePixelRatio;
      }
      getMaximumSize(canvas, width, height, aspectRatio) {
        return getMaximumSize(canvas, width, height, aspectRatio);
      }
      isAttached(canvas) {
        const container = _getParentNode(canvas);
        return !!(container && _getParentNode(container));
      }
    }

    class Element {
      constructor() {
        this.x = undefined;
        this.y = undefined;
        this.active = false;
        this.options = undefined;
        this.$animations = undefined;
      }
      tooltipPosition(useFinalPosition) {
        const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
        return {x, y};
      }
      hasValue() {
        return isNumber(this.x) && isNumber(this.y);
      }
      getProps(props, final) {
        const me = this;
        const anims = this.$animations;
        if (!final || !anims) {
          return me;
        }
        const ret = {};
        props.forEach(prop => {
          ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : me[prop];
        });
        return ret;
      }
    }
    Element.defaults = {};
    Element.defaultRoutes = undefined;

    const formatters = {
      values(value) {
        return isArray(value) ? value : '' + value;
      },
      numeric(tickValue, index, ticks) {
        if (tickValue === 0) {
          return '0';
        }
        const locale = this.chart.options.locale;
        let notation;
        let delta = tickValue;
        if (ticks.length > 1) {
          const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
          if (maxTick < 1e-4 || maxTick > 1e+15) {
            notation = 'scientific';
          }
          delta = calculateDelta(tickValue, ticks);
        }
        const logDelta = log10(Math.abs(delta));
        const numDecimal = Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
        const options = {notation, minimumFractionDigits: numDecimal, maximumFractionDigits: numDecimal};
        Object.assign(options, this.options.ticks.format);
        return formatNumber(tickValue, locale, options);
      },
      logarithmic(tickValue, index, ticks) {
        if (tickValue === 0) {
          return '0';
        }
        const remain = tickValue / (Math.pow(10, Math.floor(log10(tickValue))));
        if (remain === 1 || remain === 2 || remain === 5) {
          return formatters.numeric.call(this, tickValue, index, ticks);
        }
        return '';
      }
    };
    function calculateDelta(tickValue, ticks) {
      let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
      if (Math.abs(delta) > 1 && tickValue !== Math.floor(tickValue)) {
        delta = tickValue - Math.floor(tickValue);
      }
      return delta;
    }
    var Ticks = {formatters};

    defaults.set('scale', {
      display: true,
      offset: false,
      reverse: false,
      beginAtZero: false,
      bounds: 'ticks',
      grace: 0,
      grid: {
        display: true,
        lineWidth: 1,
        drawBorder: true,
        drawOnChartArea: true,
        drawTicks: true,
        tickLength: 8,
        tickWidth: (_ctx, options) => options.lineWidth,
        tickColor: (_ctx, options) => options.color,
        offset: false,
        borderDash: [],
        borderDashOffset: 0.0,
        borderWidth: 1
      },
      title: {
        display: false,
        text: '',
        padding: {
          top: 4,
          bottom: 4
        }
      },
      ticks: {
        minRotation: 0,
        maxRotation: 50,
        mirror: false,
        textStrokeWidth: 0,
        textStrokeColor: '',
        padding: 3,
        display: true,
        autoSkip: true,
        autoSkipPadding: 3,
        labelOffset: 0,
        callback: Ticks.formatters.values,
        minor: {},
        major: {},
        align: 'center',
        crossAlign: 'near',
        showLabelBackdrop: false,
        backdropColor: 'rgba(255, 255, 255, 0.75)',
        backdropPadding: 2,
      }
    });
    defaults.route('scale.ticks', 'color', '', 'color');
    defaults.route('scale.grid', 'color', '', 'borderColor');
    defaults.route('scale.grid', 'borderColor', '', 'borderColor');
    defaults.route('scale.title', 'color', '', 'color');
    defaults.describe('scale', {
      _fallback: false,
      _scriptable: (name) => !name.startsWith('before') && !name.startsWith('after') && name !== 'callback' && name !== 'parser',
      _indexable: (name) => name !== 'borderDash' && name !== 'tickBorderDash',
    });
    defaults.describe('scales', {
      _fallback: 'scale',
    });

    function autoSkip(scale, ticks) {
      const tickOpts = scale.options.ticks;
      const ticksLimit = tickOpts.maxTicksLimit || determineMaxTicks(scale);
      const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
      const numMajorIndices = majorIndices.length;
      const first = majorIndices[0];
      const last = majorIndices[numMajorIndices - 1];
      const newTicks = [];
      if (numMajorIndices > ticksLimit) {
        skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
        return newTicks;
      }
      const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
      if (numMajorIndices > 0) {
        let i, ilen;
        const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
        skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
        for (i = 0, ilen = numMajorIndices - 1; i < ilen; i++) {
          skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
        }
        skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
        return newTicks;
      }
      skip(ticks, newTicks, spacing);
      return newTicks;
    }
    function determineMaxTicks(scale) {
      const offset = scale.options.offset;
      const tickLength = scale._tickSize();
      const maxScale = scale._length / tickLength + (offset ? 0 : 1);
      const maxChart = scale._maxLength / tickLength;
      return Math.floor(Math.min(maxScale, maxChart));
    }
    function calculateSpacing(majorIndices, ticks, ticksLimit) {
      const evenMajorSpacing = getEvenSpacing(majorIndices);
      const spacing = ticks.length / ticksLimit;
      if (!evenMajorSpacing) {
        return Math.max(spacing, 1);
      }
      const factors = _factorize(evenMajorSpacing);
      for (let i = 0, ilen = factors.length - 1; i < ilen; i++) {
        const factor = factors[i];
        if (factor > spacing) {
          return factor;
        }
      }
      return Math.max(spacing, 1);
    }
    function getMajorIndices(ticks) {
      const result = [];
      let i, ilen;
      for (i = 0, ilen = ticks.length; i < ilen; i++) {
        if (ticks[i].major) {
          result.push(i);
        }
      }
      return result;
    }
    function skipMajors(ticks, newTicks, majorIndices, spacing) {
      let count = 0;
      let next = majorIndices[0];
      let i;
      spacing = Math.ceil(spacing);
      for (i = 0; i < ticks.length; i++) {
        if (i === next) {
          newTicks.push(ticks[i]);
          count++;
          next = majorIndices[count * spacing];
        }
      }
    }
    function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
      const start = valueOrDefault(majorStart, 0);
      const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
      let count = 0;
      let length, i, next;
      spacing = Math.ceil(spacing);
      if (majorEnd) {
        length = majorEnd - majorStart;
        spacing = length / Math.floor(length / spacing);
      }
      next = start;
      while (next < 0) {
        count++;
        next = Math.round(start + count * spacing);
      }
      for (i = Math.max(start, 0); i < end; i++) {
        if (i === next) {
          newTicks.push(ticks[i]);
          count++;
          next = Math.round(start + count * spacing);
        }
      }
    }
    function getEvenSpacing(arr) {
      const len = arr.length;
      let i, diff;
      if (len < 2) {
        return false;
      }
      for (diff = arr[0], i = 1; i < len; ++i) {
        if (arr[i] - arr[i - 1] !== diff) {
          return false;
        }
      }
      return diff;
    }

    const reverseAlign = (align) => align === 'left' ? 'right' : align === 'right' ? 'left' : align;
    const offsetFromEdge = (scale, edge, offset) => edge === 'top' || edge === 'left' ? scale[edge] + offset : scale[edge] - offset;
    function sample(arr, numItems) {
      const result = [];
      const increment = arr.length / numItems;
      const len = arr.length;
      let i = 0;
      for (; i < len; i += increment) {
        result.push(arr[Math.floor(i)]);
      }
      return result;
    }
    function getPixelForGridLine(scale, index, offsetGridLines) {
      const length = scale.ticks.length;
      const validIndex = Math.min(index, length - 1);
      const start = scale._startPixel;
      const end = scale._endPixel;
      const epsilon = 1e-6;
      let lineValue = scale.getPixelForTick(validIndex);
      let offset;
      if (offsetGridLines) {
        if (length === 1) {
          offset = Math.max(lineValue - start, end - lineValue);
        } else if (index === 0) {
          offset = (scale.getPixelForTick(1) - lineValue) / 2;
        } else {
          offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
        }
        lineValue += validIndex < index ? offset : -offset;
        if (lineValue < start - epsilon || lineValue > end + epsilon) {
          return;
        }
      }
      return lineValue;
    }
    function garbageCollect(caches, length) {
      each(caches, (cache) => {
        const gc = cache.gc;
        const gcLen = gc.length / 2;
        let i;
        if (gcLen > length) {
          for (i = 0; i < gcLen; ++i) {
            delete cache.data[gc[i]];
          }
          gc.splice(0, gcLen);
        }
      });
    }
    function getTickMarkLength(options) {
      return options.drawTicks ? options.tickLength : 0;
    }
    function getTitleHeight(options, fallback) {
      if (!options.display) {
        return 0;
      }
      const font = toFont(options.font, fallback);
      const padding = toPadding(options.padding);
      const lines = isArray(options.text) ? options.text.length : 1;
      return (lines * font.lineHeight) + padding.height;
    }
    function createScaleContext(parent, scale) {
      return Object.assign(Object.create(parent), {
        scale,
        type: 'scale'
      });
    }
    function createTickContext(parent, index, tick) {
      return Object.assign(Object.create(parent), {
        tick,
        index,
        type: 'tick'
      });
    }
    function titleAlign(align, position, reverse) {
      let ret = _toLeftRightCenter(align);
      if ((reverse && position !== 'right') || (!reverse && position === 'right')) {
        ret = reverseAlign(ret);
      }
      return ret;
    }
    function titleArgs(scale, offset, position, align) {
      const {top, left, bottom, right} = scale;
      let rotation = 0;
      let maxWidth, titleX, titleY;
      if (scale.isHorizontal()) {
        titleX = _alignStartEnd(align, left, right);
        titleY = offsetFromEdge(scale, position, offset);
        maxWidth = right - left;
      } else {
        titleX = offsetFromEdge(scale, position, offset);
        titleY = _alignStartEnd(align, bottom, top);
        rotation = position === 'left' ? -HALF_PI : HALF_PI;
      }
      return {titleX, titleY, maxWidth, rotation};
    }
    class Scale extends Element {
      constructor(cfg) {
        super();
        this.id = cfg.id;
        this.type = cfg.type;
        this.options = undefined;
        this.ctx = cfg.ctx;
        this.chart = cfg.chart;
        this.top = undefined;
        this.bottom = undefined;
        this.left = undefined;
        this.right = undefined;
        this.width = undefined;
        this.height = undefined;
        this._margins = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        };
        this.maxWidth = undefined;
        this.maxHeight = undefined;
        this.paddingTop = undefined;
        this.paddingBottom = undefined;
        this.paddingLeft = undefined;
        this.paddingRight = undefined;
        this.axis = undefined;
        this.labelRotation = undefined;
        this.min = undefined;
        this.max = undefined;
        this._range = undefined;
        this.ticks = [];
        this._gridLineItems = null;
        this._labelItems = null;
        this._labelSizes = null;
        this._length = 0;
        this._maxLength = 0;
        this._longestTextCache = {};
        this._startPixel = undefined;
        this._endPixel = undefined;
        this._reversePixels = false;
        this._userMax = undefined;
        this._userMin = undefined;
        this._suggestedMax = undefined;
        this._suggestedMin = undefined;
        this._ticksLength = 0;
        this._borderValue = 0;
        this._cache = {};
        this._dataLimitsCached = false;
        this.$context = undefined;
      }
      init(options) {
        const me = this;
        me.options = options.setContext(me.getContext());
        me.axis = options.axis;
        me._userMin = me.parse(options.min);
        me._userMax = me.parse(options.max);
        me._suggestedMin = me.parse(options.suggestedMin);
        me._suggestedMax = me.parse(options.suggestedMax);
      }
      parse(raw, index) {
        return raw;
      }
      getUserBounds() {
        let {_userMin, _userMax, _suggestedMin, _suggestedMax} = this;
        _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
        _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
        _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
        _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
        return {
          min: finiteOrDefault(_userMin, _suggestedMin),
          max: finiteOrDefault(_userMax, _suggestedMax),
          minDefined: isNumberFinite(_userMin),
          maxDefined: isNumberFinite(_userMax)
        };
      }
      getMinMax(canStack) {
        const me = this;
        let {min, max, minDefined, maxDefined} = me.getUserBounds();
        let range;
        if (minDefined && maxDefined) {
          return {min, max};
        }
        const metas = me.getMatchingVisibleMetas();
        for (let i = 0, ilen = metas.length; i < ilen; ++i) {
          range = metas[i].controller.getMinMax(me, canStack);
          if (!minDefined) {
            min = Math.min(min, range.min);
          }
          if (!maxDefined) {
            max = Math.max(max, range.max);
          }
        }
        return {
          min: finiteOrDefault(min, finiteOrDefault(max, min)),
          max: finiteOrDefault(max, finiteOrDefault(min, max))
        };
      }
      getPadding() {
        const me = this;
        return {
          left: me.paddingLeft || 0,
          top: me.paddingTop || 0,
          right: me.paddingRight || 0,
          bottom: me.paddingBottom || 0
        };
      }
      getTicks() {
        return this.ticks;
      }
      getLabels() {
        const data = this.chart.data;
        return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
      }
      beforeLayout() {
        this._cache = {};
        this._dataLimitsCached = false;
      }
      beforeUpdate() {
        callback(this.options.beforeUpdate, [this]);
      }
      update(maxWidth, maxHeight, margins) {
        const me = this;
        const tickOpts = me.options.ticks;
        const sampleSize = tickOpts.sampleSize;
        me.beforeUpdate();
        me.maxWidth = maxWidth;
        me.maxHeight = maxHeight;
        me._margins = margins = Object.assign({
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }, margins);
        me.ticks = null;
        me._labelSizes = null;
        me._gridLineItems = null;
        me._labelItems = null;
        me.beforeSetDimensions();
        me.setDimensions();
        me.afterSetDimensions();
        me._maxLength = me.isHorizontal()
          ? me.width + margins.left + margins.right
          : me.height + margins.top + margins.bottom;
        if (!me._dataLimitsCached) {
          me.beforeDataLimits();
          me.determineDataLimits();
          me.afterDataLimits();
          me._range = _addGrace(me, me.options.grace);
          me._dataLimitsCached = true;
        }
        me.beforeBuildTicks();
        me.ticks = me.buildTicks() || [];
        me.afterBuildTicks();
        const samplingEnabled = sampleSize < me.ticks.length;
        me._convertTicksToLabels(samplingEnabled ? sample(me.ticks, sampleSize) : me.ticks);
        me.configure();
        me.beforeCalculateLabelRotation();
        me.calculateLabelRotation();
        me.afterCalculateLabelRotation();
        if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto')) {
          me.ticks = autoSkip(me, me.ticks);
          me._labelSizes = null;
        }
        if (samplingEnabled) {
          me._convertTicksToLabels(me.ticks);
        }
        me.beforeFit();
        me.fit();
        me.afterFit();
        me.afterUpdate();
      }
      configure() {
        const me = this;
        let reversePixels = me.options.reverse;
        let startPixel, endPixel;
        if (me.isHorizontal()) {
          startPixel = me.left;
          endPixel = me.right;
        } else {
          startPixel = me.top;
          endPixel = me.bottom;
          reversePixels = !reversePixels;
        }
        me._startPixel = startPixel;
        me._endPixel = endPixel;
        me._reversePixels = reversePixels;
        me._length = endPixel - startPixel;
        me._alignToPixels = me.options.alignToPixels;
      }
      afterUpdate() {
        callback(this.options.afterUpdate, [this]);
      }
      beforeSetDimensions() {
        callback(this.options.beforeSetDimensions, [this]);
      }
      setDimensions() {
        const me = this;
        if (me.isHorizontal()) {
          me.width = me.maxWidth;
          me.left = 0;
          me.right = me.width;
        } else {
          me.height = me.maxHeight;
          me.top = 0;
          me.bottom = me.height;
        }
        me.paddingLeft = 0;
        me.paddingTop = 0;
        me.paddingRight = 0;
        me.paddingBottom = 0;
      }
      afterSetDimensions() {
        callback(this.options.afterSetDimensions, [this]);
      }
      _callHooks(name) {
        const me = this;
        me.chart.notifyPlugins(name, me.getContext());
        callback(me.options[name], [me]);
      }
      beforeDataLimits() {
        this._callHooks('beforeDataLimits');
      }
      determineDataLimits() {}
      afterDataLimits() {
        this._callHooks('afterDataLimits');
      }
      beforeBuildTicks() {
        this._callHooks('beforeBuildTicks');
      }
      buildTicks() {
        return [];
      }
      afterBuildTicks() {
        this._callHooks('afterBuildTicks');
      }
      beforeTickToLabelConversion() {
        callback(this.options.beforeTickToLabelConversion, [this]);
      }
      generateTickLabels(ticks) {
        const me = this;
        const tickOpts = me.options.ticks;
        let i, ilen, tick;
        for (i = 0, ilen = ticks.length; i < ilen; i++) {
          tick = ticks[i];
          tick.label = callback(tickOpts.callback, [tick.value, i, ticks], me);
        }
        for (i = 0; i < ilen; i++) {
          if (isNullOrUndef(ticks[i].label)) {
            ticks.splice(i, 1);
            ilen--;
            i--;
          }
        }
      }
      afterTickToLabelConversion() {
        callback(this.options.afterTickToLabelConversion, [this]);
      }
      beforeCalculateLabelRotation() {
        callback(this.options.beforeCalculateLabelRotation, [this]);
      }
      calculateLabelRotation() {
        const me = this;
        const options = me.options;
        const tickOpts = options.ticks;
        const numTicks = me.ticks.length;
        const minRotation = tickOpts.minRotation || 0;
        const maxRotation = tickOpts.maxRotation;
        let labelRotation = minRotation;
        let tickWidth, maxHeight, maxLabelDiagonal;
        if (!me._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !me.isHorizontal()) {
          me.labelRotation = minRotation;
          return;
        }
        const labelSizes = me._getLabelSizes();
        const maxLabelWidth = labelSizes.widest.width;
        const maxLabelHeight = labelSizes.highest.height;
        const maxWidth = _limitValue(me.chart.width - maxLabelWidth, 0, me.maxWidth);
        tickWidth = options.offset ? me.maxWidth / numTicks : maxWidth / (numTicks - 1);
        if (maxLabelWidth + 6 > tickWidth) {
          tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
          maxHeight = me.maxHeight - getTickMarkLength(options.grid)
    				- tickOpts.padding - getTitleHeight(options.title, me.chart.options.font);
          maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
          labelRotation = toDegrees(Math.min(
            Math.asin(Math.min((labelSizes.highest.height + 6) / tickWidth, 1)),
            Math.asin(Math.min(maxHeight / maxLabelDiagonal, 1)) - Math.asin(maxLabelHeight / maxLabelDiagonal)
          ));
          labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
        }
        me.labelRotation = labelRotation;
      }
      afterCalculateLabelRotation() {
        callback(this.options.afterCalculateLabelRotation, [this]);
      }
      beforeFit() {
        callback(this.options.beforeFit, [this]);
      }
      fit() {
        const me = this;
        const minSize = {
          width: 0,
          height: 0
        };
        const {chart, options: {ticks: tickOpts, title: titleOpts, grid: gridOpts}} = me;
        const display = me._isVisible();
        const isHorizontal = me.isHorizontal();
        if (display) {
          const titleHeight = getTitleHeight(titleOpts, chart.options.font);
          if (isHorizontal) {
            minSize.width = me.maxWidth;
            minSize.height = getTickMarkLength(gridOpts) + titleHeight;
          } else {
            minSize.height = me.maxHeight;
            minSize.width = getTickMarkLength(gridOpts) + titleHeight;
          }
          if (tickOpts.display && me.ticks.length) {
            const {first, last, widest, highest} = me._getLabelSizes();
            const tickPadding = tickOpts.padding * 2;
            const angleRadians = toRadians(me.labelRotation);
            const cos = Math.cos(angleRadians);
            const sin = Math.sin(angleRadians);
            if (isHorizontal) {
              const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
              minSize.height = Math.min(me.maxHeight, minSize.height + labelHeight + tickPadding);
            } else {
              const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
              minSize.width = Math.min(me.maxWidth, minSize.width + labelWidth + tickPadding);
            }
            me._calculatePadding(first, last, sin, cos);
          }
        }
        me._handleMargins();
        if (isHorizontal) {
          me.width = me._length = chart.width - me._margins.left - me._margins.right;
          me.height = minSize.height;
        } else {
          me.width = minSize.width;
          me.height = me._length = chart.height - me._margins.top - me._margins.bottom;
        }
      }
      _calculatePadding(first, last, sin, cos) {
        const me = this;
        const {ticks: {align, padding}, position} = me.options;
        const isRotated = me.labelRotation !== 0;
        const labelsBelowTicks = position !== 'top' && me.axis === 'x';
        if (me.isHorizontal()) {
          const offsetLeft = me.getPixelForTick(0) - me.left;
          const offsetRight = me.right - me.getPixelForTick(me.ticks.length - 1);
          let paddingLeft = 0;
          let paddingRight = 0;
          if (isRotated) {
            if (labelsBelowTicks) {
              paddingLeft = cos * first.width;
              paddingRight = sin * last.height;
            } else {
              paddingLeft = sin * first.height;
              paddingRight = cos * last.width;
            }
          } else if (align === 'start') {
            paddingRight = last.width;
          } else if (align === 'end') {
            paddingLeft = first.width;
          } else {
            paddingLeft = first.width / 2;
            paddingRight = last.width / 2;
          }
          me.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * me.width / (me.width - offsetLeft), 0);
          me.paddingRight = Math.max((paddingRight - offsetRight + padding) * me.width / (me.width - offsetRight), 0);
        } else {
          let paddingTop = last.height / 2;
          let paddingBottom = first.height / 2;
          if (align === 'start') {
            paddingTop = 0;
            paddingBottom = first.height;
          } else if (align === 'end') {
            paddingTop = last.height;
            paddingBottom = 0;
          }
          me.paddingTop = paddingTop + padding;
          me.paddingBottom = paddingBottom + padding;
        }
      }
      _handleMargins() {
        const me = this;
        if (me._margins) {
          me._margins.left = Math.max(me.paddingLeft, me._margins.left);
          me._margins.top = Math.max(me.paddingTop, me._margins.top);
          me._margins.right = Math.max(me.paddingRight, me._margins.right);
          me._margins.bottom = Math.max(me.paddingBottom, me._margins.bottom);
        }
      }
      afterFit() {
        callback(this.options.afterFit, [this]);
      }
      isHorizontal() {
        const {axis, position} = this.options;
        return position === 'top' || position === 'bottom' || axis === 'x';
      }
      isFullSize() {
        return this.options.fullSize;
      }
      _convertTicksToLabels(ticks) {
        const me = this;
        me.beforeTickToLabelConversion();
        me.generateTickLabels(ticks);
        me.afterTickToLabelConversion();
      }
      _getLabelSizes() {
        const me = this;
        let labelSizes = me._labelSizes;
        if (!labelSizes) {
          const sampleSize = me.options.ticks.sampleSize;
          let ticks = me.ticks;
          if (sampleSize < ticks.length) {
            ticks = sample(ticks, sampleSize);
          }
          me._labelSizes = labelSizes = me._computeLabelSizes(ticks, ticks.length);
        }
        return labelSizes;
      }
      _computeLabelSizes(ticks, length) {
        const {ctx, _longestTextCache: caches} = this;
        const widths = [];
        const heights = [];
        let widestLabelSize = 0;
        let highestLabelSize = 0;
        let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
        for (i = 0; i < length; ++i) {
          label = ticks[i].label;
          tickFont = this._resolveTickFontOptions(i);
          ctx.font = fontString = tickFont.string;
          cache = caches[fontString] = caches[fontString] || {data: {}, gc: []};
          lineHeight = tickFont.lineHeight;
          width = height = 0;
          if (!isNullOrUndef(label) && !isArray(label)) {
            width = _measureText(ctx, cache.data, cache.gc, width, label);
            height = lineHeight;
          } else if (isArray(label)) {
            for (j = 0, jlen = label.length; j < jlen; ++j) {
              nestedLabel = label[j];
              if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
                width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
                height += lineHeight;
              }
            }
          }
          widths.push(width);
          heights.push(height);
          widestLabelSize = Math.max(width, widestLabelSize);
          highestLabelSize = Math.max(height, highestLabelSize);
        }
        garbageCollect(caches, length);
        const widest = widths.indexOf(widestLabelSize);
        const highest = heights.indexOf(highestLabelSize);
        const valueAt = (idx) => ({width: widths[idx] || 0, height: heights[idx] || 0});
        return {
          first: valueAt(0),
          last: valueAt(length - 1),
          widest: valueAt(widest),
          highest: valueAt(highest),
          widths,
          heights,
        };
      }
      getLabelForValue(value) {
        return value;
      }
      getPixelForValue(value, index) {
        return NaN;
      }
      getValueForPixel(pixel) {}
      getPixelForTick(index) {
        const ticks = this.ticks;
        if (index < 0 || index > ticks.length - 1) {
          return null;
        }
        return this.getPixelForValue(ticks[index].value);
      }
      getPixelForDecimal(decimal) {
        const me = this;
        if (me._reversePixels) {
          decimal = 1 - decimal;
        }
        const pixel = me._startPixel + decimal * me._length;
        return _int16Range(me._alignToPixels ? _alignPixel(me.chart, pixel, 0) : pixel);
      }
      getDecimalForPixel(pixel) {
        const decimal = (pixel - this._startPixel) / this._length;
        return this._reversePixels ? 1 - decimal : decimal;
      }
      getBasePixel() {
        return this.getPixelForValue(this.getBaseValue());
      }
      getBaseValue() {
        const {min, max} = this;
        return min < 0 && max < 0 ? max :
          min > 0 && max > 0 ? min :
          0;
      }
      getContext(index) {
        const me = this;
        const ticks = me.ticks || [];
        if (index >= 0 && index < ticks.length) {
          const tick = ticks[index];
          return tick.$context ||
    				(tick.$context = createTickContext(me.getContext(), index, tick));
        }
        return me.$context ||
    			(me.$context = createScaleContext(me.chart.getContext(), me));
      }
      _tickSize() {
        const me = this;
        const optionTicks = me.options.ticks;
        const rot = toRadians(me.labelRotation);
        const cos = Math.abs(Math.cos(rot));
        const sin = Math.abs(Math.sin(rot));
        const labelSizes = me._getLabelSizes();
        const padding = optionTicks.autoSkipPadding || 0;
        const w = labelSizes ? labelSizes.widest.width + padding : 0;
        const h = labelSizes ? labelSizes.highest.height + padding : 0;
        return me.isHorizontal()
          ? h * cos > w * sin ? w / cos : h / sin
          : h * sin < w * cos ? h / cos : w / sin;
      }
      _isVisible() {
        const display = this.options.display;
        if (display !== 'auto') {
          return !!display;
        }
        return this.getMatchingVisibleMetas().length > 0;
      }
      _computeGridLineItems(chartArea) {
        const me = this;
        const axis = me.axis;
        const chart = me.chart;
        const options = me.options;
        const {grid, position} = options;
        const offset = grid.offset;
        const isHorizontal = me.isHorizontal();
        const ticks = me.ticks;
        const ticksLength = ticks.length + (offset ? 1 : 0);
        const tl = getTickMarkLength(grid);
        const items = [];
        const borderOpts = grid.setContext(me.getContext());
        const axisWidth = borderOpts.drawBorder ? borderOpts.borderWidth : 0;
        const axisHalfWidth = axisWidth / 2;
        const alignBorderValue = function(pixel) {
          return _alignPixel(chart, pixel, axisWidth);
        };
        let borderValue, i, lineValue, alignedLineValue;
        let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
        if (position === 'top') {
          borderValue = alignBorderValue(me.bottom);
          ty1 = me.bottom - tl;
          ty2 = borderValue - axisHalfWidth;
          y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
          y2 = chartArea.bottom;
        } else if (position === 'bottom') {
          borderValue = alignBorderValue(me.top);
          y1 = chartArea.top;
          y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
          ty1 = borderValue + axisHalfWidth;
          ty2 = me.top + tl;
        } else if (position === 'left') {
          borderValue = alignBorderValue(me.right);
          tx1 = me.right - tl;
          tx2 = borderValue - axisHalfWidth;
          x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
          x2 = chartArea.right;
        } else if (position === 'right') {
          borderValue = alignBorderValue(me.left);
          x1 = chartArea.left;
          x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
          tx1 = borderValue + axisHalfWidth;
          tx2 = me.left + tl;
        } else if (axis === 'x') {
          if (position === 'center') {
            borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            borderValue = alignBorderValue(me.chart.scales[positionAxisID].getPixelForValue(value));
          }
          y1 = chartArea.top;
          y2 = chartArea.bottom;
          ty1 = borderValue + axisHalfWidth;
          ty2 = ty1 + tl;
        } else if (axis === 'y') {
          if (position === 'center') {
            borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            borderValue = alignBorderValue(me.chart.scales[positionAxisID].getPixelForValue(value));
          }
          tx1 = borderValue - axisHalfWidth;
          tx2 = tx1 - tl;
          x1 = chartArea.left;
          x2 = chartArea.right;
        }
        for (i = 0; i < ticksLength; ++i) {
          const optsAtIndex = grid.setContext(me.getContext(i));
          const lineWidth = optsAtIndex.lineWidth;
          const lineColor = optsAtIndex.color;
          const borderDash = grid.borderDash || [];
          const borderDashOffset = optsAtIndex.borderDashOffset;
          const tickWidth = optsAtIndex.tickWidth;
          const tickColor = optsAtIndex.tickColor;
          const tickBorderDash = optsAtIndex.tickBorderDash || [];
          const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
          lineValue = getPixelForGridLine(me, i, offset);
          if (lineValue === undefined) {
            continue;
          }
          alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
          if (isHorizontal) {
            tx1 = tx2 = x1 = x2 = alignedLineValue;
          } else {
            ty1 = ty2 = y1 = y2 = alignedLineValue;
          }
          items.push({
            tx1,
            ty1,
            tx2,
            ty2,
            x1,
            y1,
            x2,
            y2,
            width: lineWidth,
            color: lineColor,
            borderDash,
            borderDashOffset,
            tickWidth,
            tickColor,
            tickBorderDash,
            tickBorderDashOffset,
          });
        }
        me._ticksLength = ticksLength;
        me._borderValue = borderValue;
        return items;
      }
      _computeLabelItems(chartArea) {
        const me = this;
        const axis = me.axis;
        const options = me.options;
        const {position, ticks: optionTicks} = options;
        const isHorizontal = me.isHorizontal();
        const ticks = me.ticks;
        const {align, crossAlign, padding, mirror} = optionTicks;
        const tl = getTickMarkLength(options.grid);
        const tickAndPadding = tl + padding;
        const hTickAndPadding = mirror ? -padding : tickAndPadding;
        const rotation = -toRadians(me.labelRotation);
        const items = [];
        let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
        let textBaseline = 'middle';
        if (position === 'top') {
          y = me.bottom - hTickAndPadding;
          textAlign = me._getXAxisLabelAlignment();
        } else if (position === 'bottom') {
          y = me.top + hTickAndPadding;
          textAlign = me._getXAxisLabelAlignment();
        } else if (position === 'left') {
          const ret = me._getYAxisLabelAlignment(tl);
          textAlign = ret.textAlign;
          x = ret.x;
        } else if (position === 'right') {
          const ret = me._getYAxisLabelAlignment(tl);
          textAlign = ret.textAlign;
          x = ret.x;
        } else if (axis === 'x') {
          if (position === 'center') {
            y = ((chartArea.top + chartArea.bottom) / 2) + tickAndPadding;
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            y = me.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
          }
          textAlign = me._getXAxisLabelAlignment();
        } else if (axis === 'y') {
          if (position === 'center') {
            x = ((chartArea.left + chartArea.right) / 2) - tickAndPadding;
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            x = me.chart.scales[positionAxisID].getPixelForValue(value);
          }
          textAlign = me._getYAxisLabelAlignment(tl).textAlign;
        }
        if (axis === 'y') {
          if (align === 'start') {
            textBaseline = 'top';
          } else if (align === 'end') {
            textBaseline = 'bottom';
          }
        }
        const labelSizes = me._getLabelSizes();
        for (i = 0, ilen = ticks.length; i < ilen; ++i) {
          tick = ticks[i];
          label = tick.label;
          const optsAtIndex = optionTicks.setContext(me.getContext(i));
          pixel = me.getPixelForTick(i) + optionTicks.labelOffset;
          font = me._resolveTickFontOptions(i);
          lineHeight = font.lineHeight;
          lineCount = isArray(label) ? label.length : 1;
          const halfCount = lineCount / 2;
          const color = optsAtIndex.color;
          const strokeColor = optsAtIndex.textStrokeColor;
          const strokeWidth = optsAtIndex.textStrokeWidth;
          if (isHorizontal) {
            x = pixel;
            if (position === 'top') {
              if (crossAlign === 'near' || rotation !== 0) {
                textOffset = -lineCount * lineHeight + lineHeight / 2;
              } else if (crossAlign === 'center') {
                textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
              } else {
                textOffset = -labelSizes.highest.height + lineHeight / 2;
              }
            } else {
              if (crossAlign === 'near' || rotation !== 0) {
                textOffset = lineHeight / 2;
              } else if (crossAlign === 'center') {
                textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
              } else {
                textOffset = labelSizes.highest.height - lineCount * lineHeight;
              }
            }
            if (mirror) {
              textOffset *= -1;
            }
          } else {
            y = pixel;
            textOffset = (1 - lineCount) * lineHeight / 2;
          }
          let backdrop;
          if (optsAtIndex.showLabelBackdrop) {
            const labelPadding = toPadding(optsAtIndex.backdropPadding);
            const height = labelSizes.heights[i];
            const width = labelSizes.widths[i];
            let top = y + textOffset - labelPadding.top;
            let left = x - labelPadding.left;
            switch (textBaseline) {
            case 'middle':
              top -= height / 2;
              break;
            case 'bottom':
              top -= height;
              break;
            }
            switch (textAlign) {
            case 'center':
              left -= width / 2;
              break;
            case 'right':
              left -= width;
              break;
            }
            backdrop = {
              left,
              top,
              width: width + labelPadding.width,
              height: height + labelPadding.height,
              color: optsAtIndex.backdropColor,
            };
          }
          items.push({
            rotation,
            label,
            font,
            color,
            strokeColor,
            strokeWidth,
            textOffset,
            textAlign,
            textBaseline,
            translation: [x, y],
            backdrop,
          });
        }
        return items;
      }
      _getXAxisLabelAlignment() {
        const me = this;
        const {position, ticks} = me.options;
        const rotation = -toRadians(me.labelRotation);
        if (rotation) {
          return position === 'top' ? 'left' : 'right';
        }
        let align = 'center';
        if (ticks.align === 'start') {
          align = 'left';
        } else if (ticks.align === 'end') {
          align = 'right';
        }
        return align;
      }
      _getYAxisLabelAlignment(tl) {
        const me = this;
        const {position, ticks: {crossAlign, mirror, padding}} = me.options;
        const labelSizes = me._getLabelSizes();
        const tickAndPadding = tl + padding;
        const widest = labelSizes.widest.width;
        let textAlign;
        let x;
        if (position === 'left') {
          if (mirror) {
            textAlign = 'left';
            x = me.right + padding;
          } else {
            x = me.right - tickAndPadding;
            if (crossAlign === 'near') {
              textAlign = 'right';
            } else if (crossAlign === 'center') {
              textAlign = 'center';
              x -= (widest / 2);
            } else {
              textAlign = 'left';
              x = me.left;
            }
          }
        } else if (position === 'right') {
          if (mirror) {
            textAlign = 'right';
            x = me.left + padding;
          } else {
            x = me.left + tickAndPadding;
            if (crossAlign === 'near') {
              textAlign = 'left';
            } else if (crossAlign === 'center') {
              textAlign = 'center';
              x += widest / 2;
            } else {
              textAlign = 'right';
              x = me.right;
            }
          }
        } else {
          textAlign = 'right';
        }
        return {textAlign, x};
      }
      _computeLabelArea() {
        const me = this;
        if (me.options.ticks.mirror) {
          return;
        }
        const chart = me.chart;
        const position = me.options.position;
        if (position === 'left' || position === 'right') {
          return {top: 0, left: me.left, bottom: chart.height, right: me.right};
        } if (position === 'top' || position === 'bottom') {
          return {top: me.top, left: 0, bottom: me.bottom, right: chart.width};
        }
      }
      drawBackground() {
        const {ctx, options: {backgroundColor}, left, top, width, height} = this;
        if (backgroundColor) {
          ctx.save();
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(left, top, width, height);
          ctx.restore();
        }
      }
      getLineWidthForValue(value) {
        const me = this;
        const grid = me.options.grid;
        if (!me._isVisible() || !grid.display) {
          return 0;
        }
        const ticks = me.ticks;
        const index = ticks.findIndex(t => t.value === value);
        if (index >= 0) {
          const opts = grid.setContext(me.getContext(index));
          return opts.lineWidth;
        }
        return 0;
      }
      drawGrid(chartArea) {
        const me = this;
        const grid = me.options.grid;
        const ctx = me.ctx;
        const items = me._gridLineItems || (me._gridLineItems = me._computeGridLineItems(chartArea));
        let i, ilen;
        const drawLine = (p1, p2, style) => {
          if (!style.width || !style.color) {
            return;
          }
          ctx.save();
          ctx.lineWidth = style.width;
          ctx.strokeStyle = style.color;
          ctx.setLineDash(style.borderDash || []);
          ctx.lineDashOffset = style.borderDashOffset;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        };
        if (grid.display) {
          for (i = 0, ilen = items.length; i < ilen; ++i) {
            const item = items[i];
            if (grid.drawOnChartArea) {
              drawLine(
                {x: item.x1, y: item.y1},
                {x: item.x2, y: item.y2},
                item
              );
            }
            if (grid.drawTicks) {
              drawLine(
                {x: item.tx1, y: item.ty1},
                {x: item.tx2, y: item.ty2},
                {
                  color: item.tickColor,
                  width: item.tickWidth,
                  borderDash: item.tickBorderDash,
                  borderDashOffset: item.tickBorderDashOffset
                }
              );
            }
          }
        }
      }
      drawBorder() {
        const me = this;
        const {chart, ctx, options: {grid}} = me;
        const borderOpts = grid.setContext(me.getContext());
        const axisWidth = grid.drawBorder ? borderOpts.borderWidth : 0;
        if (!axisWidth) {
          return;
        }
        const lastLineWidth = grid.setContext(me.getContext(0)).lineWidth;
        const borderValue = me._borderValue;
        let x1, x2, y1, y2;
        if (me.isHorizontal()) {
          x1 = _alignPixel(chart, me.left, axisWidth) - axisWidth / 2;
          x2 = _alignPixel(chart, me.right, lastLineWidth) + lastLineWidth / 2;
          y1 = y2 = borderValue;
        } else {
          y1 = _alignPixel(chart, me.top, axisWidth) - axisWidth / 2;
          y2 = _alignPixel(chart, me.bottom, lastLineWidth) + lastLineWidth / 2;
          x1 = x2 = borderValue;
        }
        ctx.save();
        ctx.lineWidth = borderOpts.borderWidth;
        ctx.strokeStyle = borderOpts.borderColor;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
      drawLabels(chartArea) {
        const me = this;
        const optionTicks = me.options.ticks;
        if (!optionTicks.display) {
          return;
        }
        const ctx = me.ctx;
        const area = me._computeLabelArea();
        if (area) {
          clipArea(ctx, area);
        }
        const items = me._labelItems || (me._labelItems = me._computeLabelItems(chartArea));
        let i, ilen;
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          const item = items[i];
          const tickFont = item.font;
          const label = item.label;
          if (item.backdrop) {
            ctx.fillStyle = item.backdrop.color;
            ctx.fillRect(item.backdrop.left, item.backdrop.top, item.backdrop.width, item.backdrop.height);
          }
          let y = item.textOffset;
          renderText(ctx, label, 0, y, tickFont, item);
        }
        if (area) {
          unclipArea(ctx);
        }
      }
      drawTitle() {
        const {ctx, options: {position, title, reverse}} = this;
        if (!title.display) {
          return;
        }
        const font = toFont(title.font);
        const padding = toPadding(title.padding);
        const align = title.align;
        let offset = font.lineHeight / 2;
        if (position === 'bottom') {
          offset += padding.bottom;
          if (isArray(title.text)) {
            offset += font.lineHeight * (title.text.length - 1);
          }
        } else {
          offset += padding.top;
        }
        const {titleX, titleY, maxWidth, rotation} = titleArgs(this, offset, position, align);
        renderText(ctx, title.text, 0, 0, font, {
          color: title.color,
          maxWidth,
          rotation,
          textAlign: titleAlign(align, position, reverse),
          textBaseline: 'middle',
          translation: [titleX, titleY],
        });
      }
      draw(chartArea) {
        const me = this;
        if (!me._isVisible()) {
          return;
        }
        me.drawBackground();
        me.drawGrid(chartArea);
        me.drawBorder();
        me.drawTitle();
        me.drawLabels(chartArea);
      }
      _layers() {
        const me = this;
        const opts = me.options;
        const tz = opts.ticks && opts.ticks.z || 0;
        const gz = opts.grid && opts.grid.z || 0;
        if (!me._isVisible() || me.draw !== Scale.prototype.draw) {
          return [{
            z: tz,
            draw(chartArea) {
              me.draw(chartArea);
            }
          }];
        }
        return [{
          z: gz,
          draw(chartArea) {
            me.drawBackground();
            me.drawGrid(chartArea);
            me.drawTitle();
          }
        }, {
          z: gz + 1,
          draw() {
            me.drawBorder();
          }
        }, {
          z: tz,
          draw(chartArea) {
            me.drawLabels(chartArea);
          }
        }];
      }
      getMatchingVisibleMetas(type) {
        const me = this;
        const metas = me.chart.getSortedVisibleDatasetMetas();
        const axisID = me.axis + 'AxisID';
        const result = [];
        let i, ilen;
        for (i = 0, ilen = metas.length; i < ilen; ++i) {
          const meta = metas[i];
          if (meta[axisID] === me.id && (!type || meta.type === type)) {
            result.push(meta);
          }
        }
        return result;
      }
      _resolveTickFontOptions(index) {
        const opts = this.options.ticks.setContext(this.getContext(index));
        return toFont(opts.font);
      }
    }

    class TypedRegistry {
      constructor(type, scope, override) {
        this.type = type;
        this.scope = scope;
        this.override = override;
        this.items = Object.create(null);
      }
      isForType(type) {
        return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
      }
      register(item) {
        const me = this;
        const proto = Object.getPrototypeOf(item);
        let parentScope;
        if (isIChartComponent(proto)) {
          parentScope = me.register(proto);
        }
        const items = me.items;
        const id = item.id;
        const scope = me.scope + '.' + id;
        if (!id) {
          throw new Error('class does not have id: ' + item);
        }
        if (id in items) {
          return scope;
        }
        items[id] = item;
        registerDefaults(item, scope, parentScope);
        if (me.override) {
          defaults.override(item.id, item.overrides);
        }
        return scope;
      }
      get(id) {
        return this.items[id];
      }
      unregister(item) {
        const items = this.items;
        const id = item.id;
        const scope = this.scope;
        if (id in items) {
          delete items[id];
        }
        if (scope && id in defaults[scope]) {
          delete defaults[scope][id];
          if (this.override) {
            delete overrides[id];
          }
        }
      }
    }
    function registerDefaults(item, scope, parentScope) {
      const itemDefaults = merge(Object.create(null), [
        parentScope ? defaults.get(parentScope) : {},
        defaults.get(scope),
        item.defaults
      ]);
      defaults.set(scope, itemDefaults);
      if (item.defaultRoutes) {
        routeDefaults(scope, item.defaultRoutes);
      }
      if (item.descriptors) {
        defaults.describe(scope, item.descriptors);
      }
    }
    function routeDefaults(scope, routes) {
      Object.keys(routes).forEach(property => {
        const propertyParts = property.split('.');
        const sourceName = propertyParts.pop();
        const sourceScope = [scope].concat(propertyParts).join('.');
        const parts = routes[property].split('.');
        const targetName = parts.pop();
        const targetScope = parts.join('.');
        defaults.route(sourceScope, sourceName, targetScope, targetName);
      });
    }
    function isIChartComponent(proto) {
      return 'id' in proto && 'defaults' in proto;
    }

    class Registry {
      constructor() {
        this.controllers = new TypedRegistry(DatasetController, 'datasets', true);
        this.elements = new TypedRegistry(Element, 'elements');
        this.plugins = new TypedRegistry(Object, 'plugins');
        this.scales = new TypedRegistry(Scale, 'scales');
        this._typedRegistries = [this.controllers, this.scales, this.elements];
      }
      add(...args) {
        this._each('register', args);
      }
      remove(...args) {
        this._each('unregister', args);
      }
      addControllers(...args) {
        this._each('register', args, this.controllers);
      }
      addElements(...args) {
        this._each('register', args, this.elements);
      }
      addPlugins(...args) {
        this._each('register', args, this.plugins);
      }
      addScales(...args) {
        this._each('register', args, this.scales);
      }
      getController(id) {
        return this._get(id, this.controllers, 'controller');
      }
      getElement(id) {
        return this._get(id, this.elements, 'element');
      }
      getPlugin(id) {
        return this._get(id, this.plugins, 'plugin');
      }
      getScale(id) {
        return this._get(id, this.scales, 'scale');
      }
      removeControllers(...args) {
        this._each('unregister', args, this.controllers);
      }
      removeElements(...args) {
        this._each('unregister', args, this.elements);
      }
      removePlugins(...args) {
        this._each('unregister', args, this.plugins);
      }
      removeScales(...args) {
        this._each('unregister', args, this.scales);
      }
      _each(method, args, typedRegistry) {
        const me = this;
        [...args].forEach(arg => {
          const reg = typedRegistry || me._getRegistryForType(arg);
          if (typedRegistry || reg.isForType(arg) || (reg === me.plugins && arg.id)) {
            me._exec(method, reg, arg);
          } else {
            each(arg, item => {
              const itemReg = typedRegistry || me._getRegistryForType(item);
              me._exec(method, itemReg, item);
            });
          }
        });
      }
      _exec(method, registry, component) {
        const camelMethod = _capitalize(method);
        callback(component['before' + camelMethod], [], component);
        registry[method](component);
        callback(component['after' + camelMethod], [], component);
      }
      _getRegistryForType(type) {
        for (let i = 0; i < this._typedRegistries.length; i++) {
          const reg = this._typedRegistries[i];
          if (reg.isForType(type)) {
            return reg;
          }
        }
        return this.plugins;
      }
      _get(id, typedRegistry, type) {
        const item = typedRegistry.get(id);
        if (item === undefined) {
          throw new Error('"' + id + '" is not a registered ' + type + '.');
        }
        return item;
      }
    }
    var registry = new Registry();

    class PluginService {
      constructor() {
        this._init = [];
      }
      notify(chart, hook, args, filter) {
        const me = this;
        if (hook === 'beforeInit') {
          me._init = me._createDescriptors(chart, true);
          me._notify(me._init, chart, 'install');
        }
        const descriptors = filter ? me._descriptors(chart).filter(filter) : me._descriptors(chart);
        const result = me._notify(descriptors, chart, hook, args);
        if (hook === 'destroy') {
          me._notify(descriptors, chart, 'stop');
          me._notify(me._init, chart, 'uninstall');
        }
        return result;
      }
      _notify(descriptors, chart, hook, args) {
        args = args || {};
        for (const descriptor of descriptors) {
          const plugin = descriptor.plugin;
          const method = plugin[hook];
          const params = [chart, args, descriptor.options];
          if (callback(method, params, plugin) === false && args.cancelable) {
            return false;
          }
        }
        return true;
      }
      invalidate() {
        if (!isNullOrUndef(this._cache)) {
          this._oldCache = this._cache;
          this._cache = undefined;
        }
      }
      _descriptors(chart) {
        if (this._cache) {
          return this._cache;
        }
        const descriptors = this._cache = this._createDescriptors(chart);
        this._notifyStateChanges(chart);
        return descriptors;
      }
      _createDescriptors(chart, all) {
        const config = chart && chart.config;
        const options = valueOrDefault(config.options && config.options.plugins, {});
        const plugins = allPlugins(config);
        return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
      }
      _notifyStateChanges(chart) {
        const previousDescriptors = this._oldCache || [];
        const descriptors = this._cache;
        const diff = (a, b) => a.filter(x => !b.some(y => x.plugin.id === y.plugin.id));
        this._notify(diff(previousDescriptors, descriptors), chart, 'stop');
        this._notify(diff(descriptors, previousDescriptors), chart, 'start');
      }
    }
    function allPlugins(config) {
      const plugins = [];
      const keys = Object.keys(registry.plugins.items);
      for (let i = 0; i < keys.length; i++) {
        plugins.push(registry.getPlugin(keys[i]));
      }
      const local = config.plugins || [];
      for (let i = 0; i < local.length; i++) {
        const plugin = local[i];
        if (plugins.indexOf(plugin) === -1) {
          plugins.push(plugin);
        }
      }
      return plugins;
    }
    function getOpts(options, all) {
      if (!all && options === false) {
        return null;
      }
      if (options === true) {
        return {};
      }
      return options;
    }
    function createDescriptors(chart, plugins, options, all) {
      const result = [];
      const context = chart.getContext();
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        const id = plugin.id;
        const opts = getOpts(options[id], all);
        if (opts === null) {
          continue;
        }
        result.push({
          plugin,
          options: pluginOpts(chart.config, plugin, opts, context)
        });
      }
      return result;
    }
    function pluginOpts(config, plugin, opts, context) {
      const keys = config.pluginScopeKeys(plugin);
      const scopes = config.getOptionScopes(opts, keys);
      return config.createResolver(scopes, context, [''], {scriptable: false, indexable: false, allKeys: true});
    }

    function getIndexAxis(type, options) {
      const datasetDefaults = defaults.datasets[type] || {};
      const datasetOptions = (options.datasets || {})[type] || {};
      return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || 'x';
    }
    function getAxisFromDefaultScaleID(id, indexAxis) {
      let axis = id;
      if (id === '_index_') {
        axis = indexAxis;
      } else if (id === '_value_') {
        axis = indexAxis === 'x' ? 'y' : 'x';
      }
      return axis;
    }
    function getDefaultScaleIDFromAxis(axis, indexAxis) {
      return axis === indexAxis ? '_index_' : '_value_';
    }
    function axisFromPosition(position) {
      if (position === 'top' || position === 'bottom') {
        return 'x';
      }
      if (position === 'left' || position === 'right') {
        return 'y';
      }
    }
    function determineAxis(id, scaleOptions) {
      if (id === 'x' || id === 'y') {
        return id;
      }
      return scaleOptions.axis || axisFromPosition(scaleOptions.position) || id.charAt(0).toLowerCase();
    }
    function mergeScaleConfig(config, options) {
      const chartDefaults = overrides[config.type] || {scales: {}};
      const configScales = options.scales || {};
      const chartIndexAxis = getIndexAxis(config.type, options);
      const firstIDs = Object.create(null);
      const scales = Object.create(null);
      Object.keys(configScales).forEach(id => {
        const scaleConf = configScales[id];
        const axis = determineAxis(id, scaleConf);
        const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
        const defaultScaleOptions = chartDefaults.scales || {};
        firstIDs[axis] = firstIDs[axis] || id;
        scales[id] = mergeIf(Object.create(null), [{axis}, scaleConf, defaultScaleOptions[axis], defaultScaleOptions[defaultId]]);
      });
      config.data.datasets.forEach(dataset => {
        const type = dataset.type || config.type;
        const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
        const datasetDefaults = overrides[type] || {};
        const defaultScaleOptions = datasetDefaults.scales || {};
        Object.keys(defaultScaleOptions).forEach(defaultID => {
          const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
          const id = dataset[axis + 'AxisID'] || firstIDs[axis] || axis;
          scales[id] = scales[id] || Object.create(null);
          mergeIf(scales[id], [{axis}, configScales[id], defaultScaleOptions[defaultID]]);
        });
      });
      Object.keys(scales).forEach(key => {
        const scale = scales[key];
        mergeIf(scale, [defaults.scales[scale.type], defaults.scale]);
      });
      return scales;
    }
    function initOptions(config) {
      const options = config.options || (config.options = {});
      options.plugins = valueOrDefault(options.plugins, {});
      options.scales = mergeScaleConfig(config, options);
    }
    function initData(data) {
      data = data || {};
      data.datasets = data.datasets || [];
      data.labels = data.labels || [];
      return data;
    }
    function initConfig(config) {
      config = config || {};
      config.data = initData(config.data);
      initOptions(config);
      return config;
    }
    const keyCache = new Map();
    const keysCached = new Set();
    function cachedKeys(cacheKey, generate) {
      let keys = keyCache.get(cacheKey);
      if (!keys) {
        keys = generate();
        keyCache.set(cacheKey, keys);
        keysCached.add(keys);
      }
      return keys;
    }
    const addIfFound = (set, obj, key) => {
      const opts = resolveObjectKey(obj, key);
      if (opts !== undefined) {
        set.add(opts);
      }
    };
    class Config {
      constructor(config) {
        this._config = initConfig(config);
        this._scopeCache = new Map();
        this._resolverCache = new Map();
      }
      get type() {
        return this._config.type;
      }
      set type(type) {
        this._config.type = type;
      }
      get data() {
        return this._config.data;
      }
      set data(data) {
        this._config.data = initData(data);
      }
      get options() {
        return this._config.options;
      }
      set options(options) {
        this._config.options = options;
      }
      get plugins() {
        return this._config.plugins;
      }
      update() {
        const config = this._config;
        this.clearCache();
        initOptions(config);
      }
      clearCache() {
        this._scopeCache.clear();
        this._resolverCache.clear();
      }
      datasetScopeKeys(datasetType) {
        return cachedKeys(datasetType,
          () => [[
            `datasets.${datasetType}`,
            ''
          ]]);
      }
      datasetAnimationScopeKeys(datasetType, transition) {
        return cachedKeys(`${datasetType}.transition.${transition}`,
          () => [
            [
              `datasets.${datasetType}.transitions.${transition}`,
              `transitions.${transition}`,
            ],
            [
              `datasets.${datasetType}`,
              ''
            ]
          ]);
      }
      datasetElementScopeKeys(datasetType, elementType) {
        return cachedKeys(`${datasetType}-${elementType}`,
          () => [[
            `datasets.${datasetType}.elements.${elementType}`,
            `datasets.${datasetType}`,
            `elements.${elementType}`,
            ''
          ]]);
      }
      pluginScopeKeys(plugin) {
        const id = plugin.id;
        const type = this.type;
        return cachedKeys(`${type}-plugin-${id}`,
          () => [[
            `plugins.${id}`,
            ...plugin.additionalOptionScopes || [],
          ]]);
      }
      _cachedScopes(mainScope, resetCache) {
        const _scopeCache = this._scopeCache;
        let cache = _scopeCache.get(mainScope);
        if (!cache || resetCache) {
          cache = new Map();
          _scopeCache.set(mainScope, cache);
        }
        return cache;
      }
      getOptionScopes(mainScope, keyLists, resetCache) {
        const {options, type} = this;
        const cache = this._cachedScopes(mainScope, resetCache);
        const cached = cache.get(keyLists);
        if (cached) {
          return cached;
        }
        const scopes = new Set();
        keyLists.forEach(keys => {
          if (mainScope) {
            scopes.add(mainScope);
            keys.forEach(key => addIfFound(scopes, mainScope, key));
          }
          keys.forEach(key => addIfFound(scopes, options, key));
          keys.forEach(key => addIfFound(scopes, overrides[type] || {}, key));
          keys.forEach(key => addIfFound(scopes, defaults, key));
          keys.forEach(key => addIfFound(scopes, descriptors, key));
        });
        const array = [...scopes];
        if (keysCached.has(keyLists)) {
          cache.set(keyLists, array);
        }
        return array;
      }
      chartOptionScopes() {
        const {options, type} = this;
        return [
          options,
          overrides[type] || {},
          defaults.datasets[type] || {},
          {type},
          defaults,
          descriptors
        ];
      }
      resolveNamedOptions(scopes, names, context, prefixes = ['']) {
        const result = {$shared: true};
        const {resolver, subPrefixes} = getResolver(this._resolverCache, scopes, prefixes);
        let options = resolver;
        if (needContext(resolver, names)) {
          result.$shared = false;
          context = isFunction(context) ? context() : context;
          const subResolver = this.createResolver(scopes, context, subPrefixes);
          options = _attachContext(resolver, context, subResolver);
        }
        for (const prop of names) {
          result[prop] = options[prop];
        }
        return result;
      }
      createResolver(scopes, context, prefixes = [''], descriptorDefaults) {
        const {resolver} = getResolver(this._resolverCache, scopes, prefixes);
        return isObject(context)
          ? _attachContext(resolver, context, undefined, descriptorDefaults)
          : resolver;
      }
    }
    function getResolver(resolverCache, scopes, prefixes) {
      let cache = resolverCache.get(scopes);
      if (!cache) {
        cache = new Map();
        resolverCache.set(scopes, cache);
      }
      const cacheKey = prefixes.join();
      let cached = cache.get(cacheKey);
      if (!cached) {
        const resolver = _createResolver(scopes, prefixes);
        cached = {
          resolver,
          subPrefixes: prefixes.filter(p => !p.toLowerCase().includes('hover'))
        };
        cache.set(cacheKey, cached);
      }
      return cached;
    }
    function needContext(proxy, names) {
      const {isScriptable, isIndexable} = _descriptors(proxy);
      for (const prop of names) {
        if ((isScriptable(prop) && isFunction(proxy[prop]))
          || (isIndexable(prop) && isArray(proxy[prop]))) {
          return true;
        }
      }
      return false;
    }

    var version = "3.2.0";

    const KNOWN_POSITIONS = ['top', 'bottom', 'left', 'right', 'chartArea'];
    function positionIsHorizontal(position, axis) {
      return position === 'top' || position === 'bottom' || (KNOWN_POSITIONS.indexOf(position) === -1 && axis === 'x');
    }
    function compare2Level(l1, l2) {
      return function(a, b) {
        return a[l1] === b[l1]
          ? a[l2] - b[l2]
          : a[l1] - b[l1];
      };
    }
    function onAnimationsComplete(context) {
      const chart = context.chart;
      const animationOptions = chart.options.animation;
      chart.notifyPlugins('afterRender');
      callback(animationOptions && animationOptions.onComplete, [context], chart);
    }
    function onAnimationProgress(context) {
      const chart = context.chart;
      const animationOptions = chart.options.animation;
      callback(animationOptions && animationOptions.onProgress, [context], chart);
    }
    function isDomSupported() {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    }
    function getCanvas(item) {
      if (isDomSupported() && typeof item === 'string') {
        item = document.getElementById(item);
      } else if (item && item.length) {
        item = item[0];
      }
      if (item && item.canvas) {
        item = item.canvas;
      }
      return item;
    }
    const instances = {};
    const getChart = (key) => {
      const canvas = getCanvas(key);
      return Object.values(instances).filter((c) => c.canvas === canvas).pop();
    };
    class Chart {
      constructor(item, config) {
        const me = this;
        this.config = config = new Config(config);
        const initialCanvas = getCanvas(item);
        const existingChart = getChart(initialCanvas);
        if (existingChart) {
          throw new Error(
            'Canvas is already in use. Chart with ID \'' + existingChart.id + '\'' +
    				' must be destroyed before the canvas can be reused.'
          );
        }
        const options = config.createResolver(config.chartOptionScopes(), me.getContext());
        this.platform = me._initializePlatform(initialCanvas, config);
        const context = me.platform.acquireContext(initialCanvas, options.aspectRatio);
        const canvas = context && context.canvas;
        const height = canvas && canvas.height;
        const width = canvas && canvas.width;
        this.id = uid();
        this.ctx = context;
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this._options = options;
        this._aspectRatio = this.aspectRatio;
        this._layers = [];
        this._metasets = [];
        this._stacks = undefined;
        this.boxes = [];
        this.currentDevicePixelRatio = undefined;
        this.chartArea = undefined;
        this._active = [];
        this._lastEvent = undefined;
        this._listeners = {};
        this._sortedMetasets = [];
        this.scales = {};
        this.scale = undefined;
        this._plugins = new PluginService();
        this.$proxies = {};
        this._hiddenIndices = {};
        this.attached = false;
        this._animationsDisabled = undefined;
        this.$context = undefined;
        this._doResize = debounce(() => this.update('resize'), options.resizeDelay || 0);
        instances[me.id] = me;
        if (!context || !canvas) {
          console.error("Failed to create chart: can't acquire context from the given item");
          return;
        }
        animator.listen(me, 'complete', onAnimationsComplete);
        animator.listen(me, 'progress', onAnimationProgress);
        me._initialize();
        if (me.attached) {
          me.update();
        }
      }
      get aspectRatio() {
        const {options: {aspectRatio, maintainAspectRatio}, width, height, _aspectRatio} = this;
        if (!isNullOrUndef(aspectRatio)) {
          return aspectRatio;
        }
        if (maintainAspectRatio && _aspectRatio) {
          return _aspectRatio;
        }
        return height ? width / height : null;
      }
      get data() {
        return this.config.data;
      }
      set data(data) {
        this.config.data = data;
      }
      get options() {
        return this._options;
      }
      set options(options) {
        this.config.options = options;
      }
      _initialize() {
        const me = this;
        me.notifyPlugins('beforeInit');
        if (me.options.responsive) {
          me.resize();
        } else {
          retinaScale(me, me.options.devicePixelRatio);
        }
        me.bindEvents();
        me.notifyPlugins('afterInit');
        return me;
      }
      _initializePlatform(canvas, config) {
        if (config.platform) {
          return new config.platform();
        } else if (!isDomSupported() || (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas)) {
          return new BasicPlatform();
        }
        return new DomPlatform();
      }
      clear() {
        clearCanvas(this.canvas, this.ctx);
        return this;
      }
      stop() {
        animator.stop(this);
        return this;
      }
      resize(width, height) {
        if (!animator.running(this)) {
          this._resize(width, height);
        } else {
          this._resizeBeforeDraw = {width, height};
        }
      }
      _resize(width, height) {
        const me = this;
        const options = me.options;
        const canvas = me.canvas;
        const aspectRatio = options.maintainAspectRatio && me.aspectRatio;
        const newSize = me.platform.getMaximumSize(canvas, width, height, aspectRatio);
        const oldRatio = me.currentDevicePixelRatio;
        const newRatio = options.devicePixelRatio || me.platform.getDevicePixelRatio();
        if (me.width === newSize.width && me.height === newSize.height && oldRatio === newRatio) {
          return;
        }
        me.width = newSize.width;
        me.height = newSize.height;
        me._aspectRatio = me.aspectRatio;
        retinaScale(me, newRatio, true);
        me.notifyPlugins('resize', {size: newSize});
        callback(options.onResize, [me, newSize], me);
        if (me.attached) {
          if (me._doResize()) {
            me.render();
          }
        }
      }
      ensureScalesHaveIDs() {
        const options = this.options;
        const scalesOptions = options.scales || {};
        each(scalesOptions, (axisOptions, axisID) => {
          axisOptions.id = axisID;
        });
      }
      buildOrUpdateScales() {
        const me = this;
        const options = me.options;
        const scaleOpts = options.scales;
        const scales = me.scales;
        const updated = Object.keys(scales).reduce((obj, id) => {
          obj[id] = false;
          return obj;
        }, {});
        let items = [];
        if (scaleOpts) {
          items = items.concat(
            Object.keys(scaleOpts).map((id) => {
              const scaleOptions = scaleOpts[id];
              const axis = determineAxis(id, scaleOptions);
              const isRadial = axis === 'r';
              const isHorizontal = axis === 'x';
              return {
                options: scaleOptions,
                dposition: isRadial ? 'chartArea' : isHorizontal ? 'bottom' : 'left',
                dtype: isRadial ? 'radialLinear' : isHorizontal ? 'category' : 'linear'
              };
            })
          );
        }
        each(items, (item) => {
          const scaleOptions = item.options;
          const id = scaleOptions.id;
          const axis = determineAxis(id, scaleOptions);
          const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
          if (scaleOptions.position === undefined || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
            scaleOptions.position = item.dposition;
          }
          updated[id] = true;
          let scale = null;
          if (id in scales && scales[id].type === scaleType) {
            scale = scales[id];
          } else {
            const scaleClass = registry.getScale(scaleType);
            scale = new scaleClass({
              id,
              type: scaleType,
              ctx: me.ctx,
              chart: me
            });
            scales[scale.id] = scale;
          }
          scale.init(scaleOptions, options);
        });
        each(updated, (hasUpdated, id) => {
          if (!hasUpdated) {
            delete scales[id];
          }
        });
        each(scales, (scale) => {
          layouts.configure(me, scale, scale.options);
          layouts.addBox(me, scale);
        });
      }
      _updateMetasetIndex(meta, index) {
        const metasets = this._metasets;
        const oldIndex = meta.index;
        if (oldIndex !== index) {
          metasets[oldIndex] = metasets[index];
          metasets[index] = meta;
          meta.index = index;
        }
      }
      _updateMetasets() {
        const me = this;
        const metasets = me._metasets;
        const numData = me.data.datasets.length;
        const numMeta = metasets.length;
        if (numMeta > numData) {
          for (let i = numData; i < numMeta; ++i) {
            me._destroyDatasetMeta(i);
          }
          metasets.splice(numData, numMeta - numData);
        }
        me._sortedMetasets = metasets.slice(0).sort(compare2Level('order', 'index'));
      }
      _removeUnreferencedMetasets() {
        const me = this;
        const {_metasets: metasets, data: {datasets}} = me;
        if (metasets.length > datasets.length) {
          delete me._stacks;
        }
        metasets.forEach((meta, index) => {
          if (datasets.filter(x => x === meta._dataset).length === 0) {
            me._destroyDatasetMeta(index);
          }
        });
      }
      buildOrUpdateControllers() {
        const me = this;
        const newControllers = [];
        const datasets = me.data.datasets;
        let i, ilen;
        me._removeUnreferencedMetasets();
        for (i = 0, ilen = datasets.length; i < ilen; i++) {
          const dataset = datasets[i];
          let meta = me.getDatasetMeta(i);
          const type = dataset.type || me.config.type;
          if (meta.type && meta.type !== type) {
            me._destroyDatasetMeta(i);
            meta = me.getDatasetMeta(i);
          }
          meta.type = type;
          meta.indexAxis = dataset.indexAxis || getIndexAxis(type, me.options);
          meta.order = dataset.order || 0;
          me._updateMetasetIndex(meta, i);
          meta.label = '' + dataset.label;
          meta.visible = me.isDatasetVisible(i);
          if (meta.controller) {
            meta.controller.updateIndex(i);
            meta.controller.linkScales();
          } else {
            const ControllerClass = registry.getController(type);
            const {datasetElementType, dataElementType} = defaults.datasets[type];
            Object.assign(ControllerClass.prototype, {
              dataElementType: registry.getElement(dataElementType),
              datasetElementType: datasetElementType && registry.getElement(datasetElementType)
            });
            meta.controller = new ControllerClass(me, i);
            newControllers.push(meta.controller);
          }
        }
        me._updateMetasets();
        return newControllers;
      }
      _resetElements() {
        const me = this;
        each(me.data.datasets, (dataset, datasetIndex) => {
          me.getDatasetMeta(datasetIndex).controller.reset();
        }, me);
      }
      reset() {
        this._resetElements();
        this.notifyPlugins('reset');
      }
      update(mode) {
        const me = this;
        const config = me.config;
        config.update();
        me._options = config.createResolver(config.chartOptionScopes(), me.getContext());
        each(me.scales, (scale) => {
          layouts.removeBox(me, scale);
        });
        const animsDisabled = me._animationsDisabled = !me.options.animation;
        me.ensureScalesHaveIDs();
        me.buildOrUpdateScales();
        const existingEvents = new Set(Object.keys(me._listeners));
        const newEvents = new Set(me.options.events);
        if (!setsEqual(existingEvents, newEvents)) {
          me.unbindEvents();
          me.bindEvents();
        }
        me._plugins.invalidate();
        if (me.notifyPlugins('beforeUpdate', {mode, cancelable: true}) === false) {
          return;
        }
        const newControllers = me.buildOrUpdateControllers();
        me.notifyPlugins('beforeElementsUpdate');
        let minPadding = 0;
        for (let i = 0, ilen = me.data.datasets.length; i < ilen; i++) {
          const {controller} = me.getDatasetMeta(i);
          const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
          controller.buildOrUpdateElements(reset);
          minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
        }
        me._minPadding = minPadding;
        me._updateLayout(minPadding);
        if (!animsDisabled) {
          each(newControllers, (controller) => {
            controller.reset();
          });
        }
        me._updateDatasets(mode);
        me.notifyPlugins('afterUpdate', {mode});
        me._layers.sort(compare2Level('z', '_idx'));
        if (me._lastEvent) {
          me._eventHandler(me._lastEvent, true);
        }
        me.render();
      }
      _updateLayout(minPadding) {
        const me = this;
        if (me.notifyPlugins('beforeLayout', {cancelable: true}) === false) {
          return;
        }
        layouts.update(me, me.width, me.height, minPadding);
        const area = me.chartArea;
        const noArea = area.width <= 0 || area.height <= 0;
        me._layers = [];
        each(me.boxes, (box) => {
          if (noArea && box.position === 'chartArea') {
            return;
          }
          if (box.configure) {
            box.configure();
          }
          me._layers.push(...box._layers());
        }, me);
        me._layers.forEach((item, index) => {
          item._idx = index;
        });
        me.notifyPlugins('afterLayout');
      }
      _updateDatasets(mode) {
        const me = this;
        const isFunction = typeof mode === 'function';
        if (me.notifyPlugins('beforeDatasetsUpdate', {mode, cancelable: true}) === false) {
          return;
        }
        for (let i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
          me._updateDataset(i, isFunction ? mode({datasetIndex: i}) : mode);
        }
        me.notifyPlugins('afterDatasetsUpdate', {mode});
      }
      _updateDataset(index, mode) {
        const me = this;
        const meta = me.getDatasetMeta(index);
        const args = {meta, index, mode, cancelable: true};
        if (me.notifyPlugins('beforeDatasetUpdate', args) === false) {
          return;
        }
        meta.controller._update(mode);
        args.cancelable = false;
        me.notifyPlugins('afterDatasetUpdate', args);
      }
      render() {
        const me = this;
        if (me.notifyPlugins('beforeRender', {cancelable: true}) === false) {
          return;
        }
        if (animator.has(me)) {
          if (me.attached && !animator.running(me)) {
            animator.start(me);
          }
        } else {
          me.draw();
          onAnimationsComplete({chart: me});
        }
      }
      draw() {
        const me = this;
        let i;
        if (me._resizeBeforeDraw) {
          const {width, height} = me._resizeBeforeDraw;
          me._resize(width, height);
          me._resizeBeforeDraw = null;
        }
        me.clear();
        if (me.width <= 0 || me.height <= 0) {
          return;
        }
        if (me.notifyPlugins('beforeDraw', {cancelable: true}) === false) {
          return;
        }
        const layers = me._layers;
        for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
          layers[i].draw(me.chartArea);
        }
        me._drawDatasets();
        for (; i < layers.length; ++i) {
          layers[i].draw(me.chartArea);
        }
        me.notifyPlugins('afterDraw');
      }
      _getSortedDatasetMetas(filterVisible) {
        const me = this;
        const metasets = me._sortedMetasets;
        const result = [];
        let i, ilen;
        for (i = 0, ilen = metasets.length; i < ilen; ++i) {
          const meta = metasets[i];
          if (!filterVisible || meta.visible) {
            result.push(meta);
          }
        }
        return result;
      }
      getSortedVisibleDatasetMetas() {
        return this._getSortedDatasetMetas(true);
      }
      _drawDatasets() {
        const me = this;
        if (me.notifyPlugins('beforeDatasetsDraw', {cancelable: true}) === false) {
          return;
        }
        const metasets = me.getSortedVisibleDatasetMetas();
        for (let i = metasets.length - 1; i >= 0; --i) {
          me._drawDataset(metasets[i]);
        }
        me.notifyPlugins('afterDatasetsDraw');
      }
      _drawDataset(meta) {
        const me = this;
        const ctx = me.ctx;
        const clip = meta._clip;
        const area = me.chartArea;
        const args = {
          meta,
          index: meta.index,
          cancelable: true
        };
        if (me.notifyPlugins('beforeDatasetDraw', args) === false) {
          return;
        }
        clipArea(ctx, {
          left: clip.left === false ? 0 : area.left - clip.left,
          right: clip.right === false ? me.width : area.right + clip.right,
          top: clip.top === false ? 0 : area.top - clip.top,
          bottom: clip.bottom === false ? me.height : area.bottom + clip.bottom
        });
        meta.controller.draw();
        unclipArea(ctx);
        args.cancelable = false;
        me.notifyPlugins('afterDatasetDraw', args);
      }
      getElementsAtEventForMode(e, mode, options, useFinalPosition) {
        const method = Interaction.modes[mode];
        if (typeof method === 'function') {
          return method(this, e, options, useFinalPosition);
        }
        return [];
      }
      getDatasetMeta(datasetIndex) {
        const me = this;
        const dataset = me.data.datasets[datasetIndex];
        const metasets = me._metasets;
        let meta = metasets.filter(x => x && x._dataset === dataset).pop();
        if (!meta) {
          meta = metasets[datasetIndex] = {
            type: null,
            data: [],
            dataset: null,
            controller: null,
            hidden: null,
            xAxisID: null,
            yAxisID: null,
            order: dataset && dataset.order || 0,
            index: datasetIndex,
            _dataset: dataset,
            _parsed: [],
            _sorted: false
          };
        }
        return meta;
      }
      getContext() {
        return this.$context || (this.$context = {chart: this, type: 'chart'});
      }
      getVisibleDatasetCount() {
        return this.getSortedVisibleDatasetMetas().length;
      }
      isDatasetVisible(datasetIndex) {
        const dataset = this.data.datasets[datasetIndex];
        if (!dataset) {
          return false;
        }
        const meta = this.getDatasetMeta(datasetIndex);
        return typeof meta.hidden === 'boolean' ? !meta.hidden : !dataset.hidden;
      }
      setDatasetVisibility(datasetIndex, visible) {
        const meta = this.getDatasetMeta(datasetIndex);
        meta.hidden = !visible;
      }
      toggleDataVisibility(index) {
        this._hiddenIndices[index] = !this._hiddenIndices[index];
      }
      getDataVisibility(index) {
        return !this._hiddenIndices[index];
      }
      _updateDatasetVisibility(datasetIndex, visible) {
        const me = this;
        const mode = visible ? 'show' : 'hide';
        const meta = me.getDatasetMeta(datasetIndex);
        const anims = meta.controller._resolveAnimations(undefined, mode);
        me.setDatasetVisibility(datasetIndex, visible);
        anims.update(meta, {visible});
        me.update((ctx) => ctx.datasetIndex === datasetIndex ? mode : undefined);
      }
      hide(datasetIndex) {
        this._updateDatasetVisibility(datasetIndex, false);
      }
      show(datasetIndex) {
        this._updateDatasetVisibility(datasetIndex, true);
      }
      _destroyDatasetMeta(datasetIndex) {
        const me = this;
        const meta = me._metasets && me._metasets[datasetIndex];
        if (meta && meta.controller) {
          meta.controller._destroy();
          delete me._metasets[datasetIndex];
        }
      }
      destroy() {
        const me = this;
        const {canvas, ctx} = me;
        let i, ilen;
        me.stop();
        animator.remove(me);
        for (i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
          me._destroyDatasetMeta(i);
        }
        me.config.clearCache();
        if (canvas) {
          me.unbindEvents();
          clearCanvas(canvas, ctx);
          me.platform.releaseContext(ctx);
          me.canvas = null;
          me.ctx = null;
        }
        me.notifyPlugins('destroy');
        delete instances[me.id];
      }
      toBase64Image(...args) {
        return this.canvas.toDataURL(...args);
      }
      bindEvents() {
        const me = this;
        const listeners = me._listeners;
        const platform = me.platform;
        const _add = (type, listener) => {
          platform.addEventListener(me, type, listener);
          listeners[type] = listener;
        };
        const _remove = (type, listener) => {
          if (listeners[type]) {
            platform.removeEventListener(me, type, listener);
            delete listeners[type];
          }
        };
        let listener = function(e, x, y) {
          e.offsetX = x;
          e.offsetY = y;
          me._eventHandler(e);
        };
        each(me.options.events, (type) => _add(type, listener));
        if (me.options.responsive) {
          listener = (width, height) => {
            if (me.canvas) {
              me.resize(width, height);
            }
          };
          let detached;
          const attached = () => {
            _remove('attach', attached);
            me.attached = true;
            me.resize();
            _add('resize', listener);
            _add('detach', detached);
          };
          detached = () => {
            me.attached = false;
            _remove('resize', listener);
            _add('attach', attached);
          };
          if (platform.isAttached(me.canvas)) {
            attached();
          } else {
            detached();
          }
        } else {
          me.attached = true;
        }
      }
      unbindEvents() {
        const me = this;
        const listeners = me._listeners;
        if (!listeners) {
          return;
        }
        me._listeners = {};
        each(listeners, (listener, type) => {
          me.platform.removeEventListener(me, type, listener);
        });
      }
      updateHoverStyle(items, mode, enabled) {
        const prefix = enabled ? 'set' : 'remove';
        let meta, item, i, ilen;
        if (mode === 'dataset') {
          meta = this.getDatasetMeta(items[0].datasetIndex);
          meta.controller['_' + prefix + 'DatasetHoverStyle']();
        }
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          item = items[i];
          const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
          if (controller) {
            controller[prefix + 'HoverStyle'](item.element, item.datasetIndex, item.index);
          }
        }
      }
      getActiveElements() {
        return this._active || [];
      }
      setActiveElements(activeElements) {
        const me = this;
        const lastActive = me._active || [];
        const active = activeElements.map(({datasetIndex, index}) => {
          const meta = me.getDatasetMeta(datasetIndex);
          if (!meta) {
            throw new Error('No dataset found at index ' + datasetIndex);
          }
          return {
            datasetIndex,
            element: meta.data[index],
            index,
          };
        });
        const changed = !_elementsEqual(active, lastActive);
        if (changed) {
          me._active = active;
          me._updateHoverStyles(active, lastActive);
        }
      }
      notifyPlugins(hook, args, filter) {
        return this._plugins.notify(this, hook, args, filter);
      }
      _updateHoverStyles(active, lastActive, replay) {
        const me = this;
        const hoverOptions = me.options.hover;
        const diff = (a, b) => a.filter(x => !b.some(y => x.datasetIndex === y.datasetIndex && x.index === y.index));
        const deactivated = diff(lastActive, active);
        const activated = replay ? active : diff(active, lastActive);
        if (deactivated.length) {
          me.updateHoverStyle(deactivated, hoverOptions.mode, false);
        }
        if (activated.length && hoverOptions.mode) {
          me.updateHoverStyle(activated, hoverOptions.mode, true);
        }
      }
      _eventHandler(e, replay) {
        const me = this;
        const args = {event: e, replay, cancelable: true};
        const eventFilter = (plugin) => (plugin.options.events || this.options.events).includes(e.type);
        if (me.notifyPlugins('beforeEvent', args, eventFilter) === false) {
          return;
        }
        const changed = me._handleEvent(e, replay);
        args.cancelable = false;
        me.notifyPlugins('afterEvent', args, eventFilter);
        if (changed || args.changed) {
          me.render();
        }
        return me;
      }
      _handleEvent(e, replay) {
        const me = this;
        const {_active: lastActive = [], options} = me;
        const hoverOptions = options.hover;
        const useFinalPosition = replay;
        let active = [];
        let changed = false;
        let lastEvent = null;
        if (e.type !== 'mouseout') {
          active = me.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
          lastEvent = e.type === 'click' ? me._lastEvent : e;
        }
        me._lastEvent = null;
        if (_isPointInArea(e, me.chartArea, me._minPadding)) {
          callback(options.onHover, [e, active, me], me);
          if (e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu') {
            callback(options.onClick, [e, active, me], me);
          }
        }
        changed = !_elementsEqual(active, lastActive);
        if (changed || replay) {
          me._active = active;
          me._updateHoverStyles(active, lastActive, replay);
        }
        me._lastEvent = lastEvent;
        return changed;
      }
    }
    const invalidatePlugins = () => each(Chart.instances, (chart) => chart._plugins.invalidate());
    const enumerable = true;
    Object.defineProperties(Chart, {
      defaults: {
        enumerable,
        value: defaults
      },
      instances: {
        enumerable,
        value: instances
      },
      overrides: {
        enumerable,
        value: overrides
      },
      registry: {
        enumerable,
        value: registry
      },
      version: {
        enumerable,
        value: version
      },
      getChart: {
        enumerable,
        value: getChart
      },
      register: {
        enumerable,
        value: (...items) => {
          registry.add(...items);
          invalidatePlugins();
        }
      },
      unregister: {
        enumerable,
        value: (...items) => {
          registry.remove(...items);
          invalidatePlugins();
        }
      }
    });

    function clipArc(ctx, element) {
      const {startAngle, endAngle, pixelMargin, x, y, outerRadius, innerRadius} = element;
      let angleMargin = pixelMargin / outerRadius;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
      if (innerRadius > pixelMargin) {
        angleMargin = pixelMargin / innerRadius;
        ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
      } else {
        ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
      }
      ctx.closePath();
      ctx.clip();
    }
    function toRadiusCorners(value) {
      return _readValueToProps(value, ['outerStart', 'outerEnd', 'innerStart', 'innerEnd']);
    }
    function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
      const o = toRadiusCorners(arc.options.borderRadius);
      const halfThickness = (outerRadius - innerRadius) / 2;
      const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
      const computeOuterLimit = (val) => {
        const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
        return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
      };
      return {
        outerStart: computeOuterLimit(o.outerStart),
        outerEnd: computeOuterLimit(o.outerEnd),
        innerStart: _limitValue(o.innerStart, 0, innerLimit),
        innerEnd: _limitValue(o.innerEnd, 0, innerLimit),
      };
    }
    function rThetaToXY(r, theta, x, y) {
      return {
        x: x + r * Math.cos(theta),
        y: y + r * Math.sin(theta),
      };
    }
    function pathArc(ctx, element) {
      const {x, y, startAngle, endAngle, pixelMargin} = element;
      const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
      const innerRadius = element.innerRadius + pixelMargin;
      const {outerStart, outerEnd, innerStart, innerEnd} = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
      const outerStartAdjustedRadius = outerRadius - outerStart;
      const outerEndAdjustedRadius = outerRadius - outerEnd;
      const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
      const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
      const innerStartAdjustedRadius = innerRadius + innerStart;
      const innerEndAdjustedRadius = innerRadius + innerEnd;
      const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
      const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, outerStartAdjustedAngle, outerEndAdjustedAngle);
      if (outerEnd > 0) {
        const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
      }
      const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x, y);
      ctx.lineTo(p4.x, p4.y);
      if (innerEnd > 0) {
        const pCenter = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
      }
      ctx.arc(x, y, innerRadius, endAngle - (innerEnd / innerRadius), startAngle + (innerStart / innerRadius), true);
      if (innerStart > 0) {
        const pCenter = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
      }
      const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x, y);
      ctx.lineTo(p8.x, p8.y);
      if (outerStart > 0) {
        const pCenter = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
      }
      ctx.closePath();
    }
    function drawArc(ctx, element) {
      if (element.fullCircles) {
        element.endAngle = element.startAngle + TAU;
        pathArc(ctx, element);
        for (let i = 0; i < element.fullCircles; ++i) {
          ctx.fill();
        }
      }
      if (!isNaN(element.circumference)) {
        element.endAngle = element.startAngle + element.circumference % TAU;
      }
      pathArc(ctx, element);
      ctx.fill();
    }
    function drawFullCircleBorders(ctx, element, inner) {
      const {x, y, startAngle, endAngle, pixelMargin} = element;
      const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
      const innerRadius = element.innerRadius + pixelMargin;
      let i;
      if (inner) {
        element.endAngle = element.startAngle + TAU;
        clipArc(ctx, element);
        element.endAngle = endAngle;
        if (element.endAngle === element.startAngle) {
          element.endAngle += TAU;
          element.fullCircles--;
        }
      }
      ctx.beginPath();
      ctx.arc(x, y, innerRadius, startAngle + TAU, startAngle, true);
      for (i = 0; i < element.fullCircles; ++i) {
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle, startAngle + TAU);
      for (i = 0; i < element.fullCircles; ++i) {
        ctx.stroke();
      }
    }
    function drawBorder(ctx, element) {
      const {options} = element;
      const inner = options.borderAlign === 'inner';
      if (!options.borderWidth) {
        return;
      }
      if (inner) {
        ctx.lineWidth = options.borderWidth * 2;
        ctx.lineJoin = 'round';
      } else {
        ctx.lineWidth = options.borderWidth;
        ctx.lineJoin = 'bevel';
      }
      if (element.fullCircles) {
        drawFullCircleBorders(ctx, element, inner);
      }
      if (inner) {
        clipArc(ctx, element);
      }
      pathArc(ctx, element);
      ctx.stroke();
    }
    class ArcElement extends Element {
      constructor(cfg) {
        super();
        this.options = undefined;
        this.circumference = undefined;
        this.startAngle = undefined;
        this.endAngle = undefined;
        this.innerRadius = undefined;
        this.outerRadius = undefined;
        this.pixelMargin = 0;
        this.fullCircles = 0;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      inRange(chartX, chartY, useFinalPosition) {
        const point = this.getProps(['x', 'y'], useFinalPosition);
        const {angle, distance} = getAngleFromPoint(point, {x: chartX, y: chartY});
        const {startAngle, endAngle, innerRadius, outerRadius, circumference} = this.getProps([
          'startAngle',
          'endAngle',
          'innerRadius',
          'outerRadius',
          'circumference'
        ], useFinalPosition);
        const betweenAngles = circumference >= TAU || _angleBetween(angle, startAngle, endAngle);
        const withinRadius = (distance >= innerRadius && distance <= outerRadius);
        return (betweenAngles && withinRadius);
      }
      getCenterPoint(useFinalPosition) {
        const {x, y, startAngle, endAngle, innerRadius, outerRadius} = this.getProps([
          'x',
          'y',
          'startAngle',
          'endAngle',
          'innerRadius',
          'outerRadius'
        ], useFinalPosition);
        const halfAngle = (startAngle + endAngle) / 2;
        const halfRadius = (innerRadius + outerRadius) / 2;
        return {
          x: x + Math.cos(halfAngle) * halfRadius,
          y: y + Math.sin(halfAngle) * halfRadius
        };
      }
      tooltipPosition(useFinalPosition) {
        return this.getCenterPoint(useFinalPosition);
      }
      draw(ctx) {
        const me = this;
        const options = me.options;
        const offset = options.offset || 0;
        me.pixelMargin = (options.borderAlign === 'inner') ? 0.33 : 0;
        me.fullCircles = Math.floor(me.circumference / TAU);
        if (me.circumference === 0 || me.innerRadius < 0 || me.outerRadius < 0) {
          return;
        }
        ctx.save();
        if (offset && me.circumference < TAU) {
          const halfAngle = (me.startAngle + me.endAngle) / 2;
          ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
        }
        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        drawArc(ctx, me);
        drawBorder(ctx, me);
        ctx.restore();
      }
    }
    ArcElement.id = 'arc';
    ArcElement.defaults = {
      borderAlign: 'center',
      borderColor: '#fff',
      borderRadius: 0,
      borderWidth: 2,
      offset: 0,
      angle: undefined,
    };
    ArcElement.defaultRoutes = {
      backgroundColor: 'backgroundColor'
    };

    function setStyle(ctx, options, style = options) {
      ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
      ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
      ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
      ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
      ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
      ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
    }
    function lineTo(ctx, previous, target) {
      ctx.lineTo(target.x, target.y);
    }
    function getLineMethod(options) {
      if (options.stepped) {
        return _steppedLineTo;
      }
      if (options.tension) {
        return _bezierCurveTo;
      }
      return lineTo;
    }
    function pathVars(points, segment, params = {}) {
      const count = points.length;
      const {start: paramsStart = 0, end: paramsEnd = count - 1} = params;
      const {start: segmentStart, end: segmentEnd} = segment;
      const start = Math.max(paramsStart, segmentStart);
      const end = Math.min(paramsEnd, segmentEnd);
      const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
      return {
        count,
        start,
        loop: segment.loop,
        ilen: end < start && !outside ? count + end - start : end - start
      };
    }
    function pathSegment(ctx, line, segment, params) {
      const {points, options} = line;
      const {count, start, loop, ilen} = pathVars(points, segment, params);
      const lineMethod = getLineMethod(options);
      let {move = true, reverse} = params || {};
      let i, point, prev;
      for (i = 0; i <= ilen; ++i) {
        point = points[(start + (reverse ? ilen - i : i)) % count];
        if (point.skip) {
          continue;
        } else if (move) {
          ctx.moveTo(point.x, point.y);
          move = false;
        } else {
          lineMethod(ctx, prev, point, reverse, options.stepped);
        }
        prev = point;
      }
      if (loop) {
        point = points[(start + (reverse ? ilen : 0)) % count];
        lineMethod(ctx, prev, point, reverse, options.stepped);
      }
      return !!loop;
    }
    function fastPathSegment(ctx, line, segment, params) {
      const points = line.points;
      const {count, start, ilen} = pathVars(points, segment, params);
      const {move = true, reverse} = params || {};
      let avgX = 0;
      let countX = 0;
      let i, point, prevX, minY, maxY, lastY;
      const pointIndex = (index) => (start + (reverse ? ilen - index : index)) % count;
      const drawX = () => {
        if (minY !== maxY) {
          ctx.lineTo(avgX, maxY);
          ctx.lineTo(avgX, minY);
          ctx.lineTo(avgX, lastY);
        }
      };
      if (move) {
        point = points[pointIndex(0)];
        ctx.moveTo(point.x, point.y);
      }
      for (i = 0; i <= ilen; ++i) {
        point = points[pointIndex(i)];
        if (point.skip) {
          continue;
        }
        const x = point.x;
        const y = point.y;
        const truncX = x | 0;
        if (truncX === prevX) {
          if (y < minY) {
            minY = y;
          } else if (y > maxY) {
            maxY = y;
          }
          avgX = (countX * avgX + x) / ++countX;
        } else {
          drawX();
          ctx.lineTo(x, y);
          prevX = truncX;
          countX = 0;
          minY = maxY = y;
        }
        lastY = y;
      }
      drawX();
    }
    function _getSegmentMethod(line) {
      const opts = line.options;
      const borderDash = opts.borderDash && opts.borderDash.length;
      const useFastPath = !line._decimated && !line._loop && !opts.tension && !opts.stepped && !borderDash;
      return useFastPath ? fastPathSegment : pathSegment;
    }
    function _getInterpolationMethod(options) {
      if (options.stepped) {
        return _steppedInterpolation;
      }
      if (options.tension) {
        return _bezierInterpolation;
      }
      return _pointInLine;
    }
    function strokePathWithCache(ctx, line, start, count) {
      let path = line._path;
      if (!path) {
        path = line._path = new Path2D();
        if (line.path(path, start, count)) {
          path.closePath();
        }
      }
      setStyle(ctx, line.options);
      ctx.stroke(path);
    }
    function strokePathDirect(ctx, line, start, count) {
      const {segments, options} = line;
      const segmentMethod = _getSegmentMethod(line);
      for (const segment of segments) {
        setStyle(ctx, options, segment.style);
        ctx.beginPath();
        if (segmentMethod(ctx, line, segment, {start, end: start + count - 1})) {
          ctx.closePath();
        }
        ctx.stroke();
      }
    }
    const usePath2D = typeof Path2D === 'function';
    function draw(ctx, line, start, count) {
      if (usePath2D && line.segments.length === 1) {
        strokePathWithCache(ctx, line, start, count);
      } else {
        strokePathDirect(ctx, line, start, count);
      }
    }
    class LineElement extends Element {
      constructor(cfg) {
        super();
        this.animated = true;
        this.options = undefined;
        this._loop = undefined;
        this._fullLoop = undefined;
        this._path = undefined;
        this._points = undefined;
        this._segments = undefined;
        this._decimated = false;
        this._pointsUpdated = false;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      updateControlPoints(chartArea) {
        const me = this;
        const options = me.options;
        if (options.tension && !options.stepped && !me._pointsUpdated) {
          const loop = options.spanGaps ? me._loop : me._fullLoop;
          _updateBezierControlPoints(me._points, options, chartArea, loop);
          me._pointsUpdated = true;
        }
      }
      set points(points) {
        const me = this;
        me._points = points;
        delete me._segments;
        delete me._path;
        me._pointsUpdated = false;
      }
      get points() {
        return this._points;
      }
      get segments() {
        return this._segments || (this._segments = _computeSegments(this, this.options.segment));
      }
      first() {
        const segments = this.segments;
        const points = this.points;
        return segments.length && points[segments[0].start];
      }
      last() {
        const segments = this.segments;
        const points = this.points;
        const count = segments.length;
        return count && points[segments[count - 1].end];
      }
      interpolate(point, property) {
        const me = this;
        const options = me.options;
        const value = point[property];
        const points = me.points;
        const segments = _boundSegments(me, {property, start: value, end: value});
        if (!segments.length) {
          return;
        }
        const result = [];
        const _interpolate = _getInterpolationMethod(options);
        let i, ilen;
        for (i = 0, ilen = segments.length; i < ilen; ++i) {
          const {start, end} = segments[i];
          const p1 = points[start];
          const p2 = points[end];
          if (p1 === p2) {
            result.push(p1);
            continue;
          }
          const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
          const interpolated = _interpolate(p1, p2, t, options.stepped);
          interpolated[property] = point[property];
          result.push(interpolated);
        }
        return result.length === 1 ? result[0] : result;
      }
      pathSegment(ctx, segment, params) {
        const segmentMethod = _getSegmentMethod(this);
        return segmentMethod(ctx, this, segment, params);
      }
      path(ctx, start, count) {
        const me = this;
        const segments = me.segments;
        const segmentMethod = _getSegmentMethod(me);
        let loop = me._loop;
        start = start || 0;
        count = count || (me.points.length - start);
        for (const segment of segments) {
          loop &= segmentMethod(ctx, me, segment, {start, end: start + count - 1});
        }
        return !!loop;
      }
      draw(ctx, chartArea, start, count) {
        const me = this;
        const options = me.options || {};
        const points = me.points || [];
        if (!points.length || !options.borderWidth) {
          return;
        }
        ctx.save();
        draw(ctx, me, start, count);
        ctx.restore();
        if (me.animated) {
          me._pointsUpdated = false;
          me._path = undefined;
        }
      }
    }
    LineElement.id = 'line';
    LineElement.defaults = {
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0,
      borderJoinStyle: 'miter',
      borderWidth: 3,
      capBezierPoints: true,
      cubicInterpolationMode: 'default',
      fill: false,
      spanGaps: false,
      stepped: false,
      tension: 0,
    };
    LineElement.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    };
    LineElement.descriptors = {
      _scriptable: true,
      _indexable: (name) => name !== 'borderDash' && name !== 'fill',
    };

    function inRange$1(el, pos, axis, useFinalPosition) {
      const options = el.options;
      const {[axis]: value} = el.getProps([axis], useFinalPosition);
      return (Math.abs(pos - value) < options.radius + options.hitRadius);
    }
    class PointElement extends Element {
      constructor(cfg) {
        super();
        this.options = undefined;
        this.parsed = undefined;
        this.skip = undefined;
        this.stop = undefined;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      inRange(mouseX, mouseY, useFinalPosition) {
        const options = this.options;
        const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
        return ((Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) < Math.pow(options.hitRadius + options.radius, 2));
      }
      inXRange(mouseX, useFinalPosition) {
        return inRange$1(this, mouseX, 'x', useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
        return inRange$1(this, mouseY, 'y', useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
        const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
        return {x, y};
      }
      size(options) {
        options = options || this.options || {};
        let radius = options.radius || 0;
        radius = Math.max(radius, radius && options.hoverRadius || 0);
        const borderWidth = radius && options.borderWidth || 0;
        return (radius + borderWidth) * 2;
      }
      draw(ctx) {
        const me = this;
        const options = me.options;
        if (me.skip || options.radius < 0.1) {
          return;
        }
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.fillStyle = options.backgroundColor;
        drawPoint(ctx, options, me.x, me.y);
      }
      getRange() {
        const options = this.options || {};
        return options.radius + options.hitRadius;
      }
    }
    PointElement.id = 'point';
    PointElement.defaults = {
      borderWidth: 1,
      hitRadius: 1,
      hoverBorderWidth: 1,
      hoverRadius: 4,
      pointStyle: 'circle',
      radius: 3,
      rotation: 0
    };
    PointElement.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    };

    function getBarBounds(bar, useFinalPosition) {
      const {x, y, base, width, height} = bar.getProps(['x', 'y', 'base', 'width', 'height'], useFinalPosition);
      let left, right, top, bottom, half;
      if (bar.horizontal) {
        half = height / 2;
        left = Math.min(x, base);
        right = Math.max(x, base);
        top = y - half;
        bottom = y + half;
      } else {
        half = width / 2;
        left = x - half;
        right = x + half;
        top = Math.min(y, base);
        bottom = Math.max(y, base);
      }
      return {left, top, right, bottom};
    }
    function parseBorderSkipped(bar) {
      let edge = bar.options.borderSkipped;
      const res = {};
      if (!edge) {
        return res;
      }
      edge = bar.horizontal
        ? parseEdge(edge, 'left', 'right', bar.base > bar.x)
        : parseEdge(edge, 'bottom', 'top', bar.base < bar.y);
      res[edge] = true;
      return res;
    }
    function parseEdge(edge, a, b, reverse) {
      if (reverse) {
        edge = swap(edge, a, b);
        edge = startEnd(edge, b, a);
      } else {
        edge = startEnd(edge, a, b);
      }
      return edge;
    }
    function swap(orig, v1, v2) {
      return orig === v1 ? v2 : orig === v2 ? v1 : orig;
    }
    function startEnd(v, start, end) {
      return v === 'start' ? start : v === 'end' ? end : v;
    }
    function skipOrLimit(skip, value, min, max) {
      return skip ? 0 : Math.max(Math.min(value, max), min);
    }
    function parseBorderWidth(bar, maxW, maxH) {
      const value = bar.options.borderWidth;
      const skip = parseBorderSkipped(bar);
      const o = toTRBL(value);
      return {
        t: skipOrLimit(skip.top, o.top, 0, maxH),
        r: skipOrLimit(skip.right, o.right, 0, maxW),
        b: skipOrLimit(skip.bottom, o.bottom, 0, maxH),
        l: skipOrLimit(skip.left, o.left, 0, maxW)
      };
    }
    function parseBorderRadius(bar, maxW, maxH) {
      const {enableBorderRadius} = bar.getProps(['enableBorderRadius']);
      const value = bar.options.borderRadius;
      const o = toTRBLCorners(value);
      const maxR = Math.min(maxW, maxH);
      const skip = parseBorderSkipped(bar);
      const enableBorder = enableBorderRadius || isObject(value);
      return {
        topLeft: skipOrLimit(!enableBorder || skip.top || skip.left, o.topLeft, 0, maxR),
        topRight: skipOrLimit(!enableBorder || skip.top || skip.right, o.topRight, 0, maxR),
        bottomLeft: skipOrLimit(!enableBorder || skip.bottom || skip.left, o.bottomLeft, 0, maxR),
        bottomRight: skipOrLimit(!enableBorder || skip.bottom || skip.right, o.bottomRight, 0, maxR)
      };
    }
    function boundingRects(bar) {
      const bounds = getBarBounds(bar);
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      const border = parseBorderWidth(bar, width / 2, height / 2);
      const radius = parseBorderRadius(bar, width / 2, height / 2);
      return {
        outer: {
          x: bounds.left,
          y: bounds.top,
          w: width,
          h: height,
          radius
        },
        inner: {
          x: bounds.left + border.l,
          y: bounds.top + border.t,
          w: width - border.l - border.r,
          h: height - border.t - border.b,
          radius: {
            topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
            topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
            bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
            bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r)),
          }
        }
      };
    }
    function inRange(bar, x, y, useFinalPosition) {
      const skipX = x === null;
      const skipY = y === null;
      const skipBoth = skipX && skipY;
      const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
      return bounds
    		&& (skipX || x >= bounds.left && x <= bounds.right)
    		&& (skipY || y >= bounds.top && y <= bounds.bottom);
    }
    function hasRadius(radius) {
      return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
    }
    function addNormalRectPath(ctx, rect) {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    class BarElement extends Element {
      constructor(cfg) {
        super();
        this.options = undefined;
        this.horizontal = undefined;
        this.base = undefined;
        this.width = undefined;
        this.height = undefined;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      draw(ctx) {
        const options = this.options;
        const {inner, outer} = boundingRects(this);
        const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
        ctx.save();
        if (outer.w !== inner.w || outer.h !== inner.h) {
          ctx.beginPath();
          addRectPath(ctx, outer);
          ctx.clip();
          addRectPath(ctx, inner);
          ctx.fillStyle = options.borderColor;
          ctx.fill('evenodd');
        }
        ctx.beginPath();
        addRectPath(ctx, inner);
        ctx.fillStyle = options.backgroundColor;
        ctx.fill();
        ctx.restore();
      }
      inRange(mouseX, mouseY, useFinalPosition) {
        return inRange(this, mouseX, mouseY, useFinalPosition);
      }
      inXRange(mouseX, useFinalPosition) {
        return inRange(this, mouseX, null, useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
        return inRange(this, null, mouseY, useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
        const {x, y, base, horizontal} = this.getProps(['x', 'y', 'base', 'horizontal'], useFinalPosition);
        return {
          x: horizontal ? (x + base) / 2 : x,
          y: horizontal ? y : (y + base) / 2
        };
      }
      getRange(axis) {
        return axis === 'x' ? this.width / 2 : this.height / 2;
      }
    }
    BarElement.id = 'bar';
    BarElement.defaults = {
      borderSkipped: 'start',
      borderWidth: 0,
      borderRadius: 0,
      enableBorderRadius: true,
      pointStyle: undefined
    };
    BarElement.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    };

    var elements = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ArcElement: ArcElement,
    LineElement: LineElement,
    PointElement: PointElement,
    BarElement: BarElement
    });

    function lttbDecimation(data, start, count, availableWidth, options) {
      const samples = options.samples || availableWidth;
      if (samples >= count) {
        return data.slice(start, start + count);
      }
      const decimated = [];
      const bucketWidth = (count - 2) / (samples - 2);
      let sampledIndex = 0;
      const endIndex = start + count - 1;
      let a = start;
      let i, maxAreaPoint, maxArea, area, nextA;
      decimated[sampledIndex++] = data[a];
      for (i = 0; i < samples - 2; i++) {
        let avgX = 0;
        let avgY = 0;
        let j;
        const avgRangeStart = Math.floor((i + 1) * bucketWidth) + 1 + start;
        const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketWidth) + 1, count) + start;
        const avgRangeLength = avgRangeEnd - avgRangeStart;
        for (j = avgRangeStart; j < avgRangeEnd; j++) {
          avgX += data[j].x;
          avgY += data[j].y;
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;
        const rangeOffs = Math.floor(i * bucketWidth) + 1 + start;
        const rangeTo = Math.floor((i + 1) * bucketWidth) + 1 + start;
        const {x: pointAx, y: pointAy} = data[a];
        maxArea = area = -1;
        for (j = rangeOffs; j < rangeTo; j++) {
          area = 0.5 * Math.abs(
            (pointAx - avgX) * (data[j].y - pointAy) -
            (pointAx - data[j].x) * (avgY - pointAy)
          );
          if (area > maxArea) {
            maxArea = area;
            maxAreaPoint = data[j];
            nextA = j;
          }
        }
        decimated[sampledIndex++] = maxAreaPoint;
        a = nextA;
      }
      decimated[sampledIndex++] = data[endIndex];
      return decimated;
    }
    function minMaxDecimation(data, start, count, availableWidth) {
      let avgX = 0;
      let countX = 0;
      let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY;
      const decimated = [];
      const endIndex = start + count - 1;
      const xMin = data[start].x;
      const xMax = data[endIndex].x;
      const dx = xMax - xMin;
      for (i = start; i < start + count; ++i) {
        point = data[i];
        x = (point.x - xMin) / dx * availableWidth;
        y = point.y;
        const truncX = x | 0;
        if (truncX === prevX) {
          if (y < minY) {
            minY = y;
            minIndex = i;
          } else if (y > maxY) {
            maxY = y;
            maxIndex = i;
          }
          avgX = (countX * avgX + point.x) / ++countX;
        } else {
          const lastIndex = i - 1;
          if (!isNullOrUndef(minIndex) && !isNullOrUndef(maxIndex)) {
            const intermediateIndex1 = Math.min(minIndex, maxIndex);
            const intermediateIndex2 = Math.max(minIndex, maxIndex);
            if (intermediateIndex1 !== startIndex && intermediateIndex1 !== lastIndex) {
              decimated.push({
                ...data[intermediateIndex1],
                x: avgX,
              });
            }
            if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) {
              decimated.push({
                ...data[intermediateIndex2],
                x: avgX
              });
            }
          }
          if (i > 0 && lastIndex !== startIndex) {
            decimated.push(data[lastIndex]);
          }
          decimated.push(point);
          prevX = truncX;
          countX = 0;
          minY = maxY = y;
          minIndex = maxIndex = startIndex = i;
        }
      }
      return decimated;
    }
    function cleanDecimatedDataset(dataset) {
      if (dataset._decimated) {
        const data = dataset._data;
        delete dataset._decimated;
        delete dataset._data;
        Object.defineProperty(dataset, 'data', {value: data});
      }
    }
    function cleanDecimatedData(chart) {
      chart.data.datasets.forEach((dataset) => {
        cleanDecimatedDataset(dataset);
      });
    }
    function getStartAndCountOfVisiblePointsSimplified(meta, points) {
      const pointCount = points.length;
      let start = 0;
      let count;
      const {iScale} = meta;
      const {min, max, minDefined, maxDefined} = iScale.getUserBounds();
      if (minDefined) {
        start = _limitValue(_lookupByKey(points, iScale.axis, min).lo, 0, pointCount - 1);
      }
      if (maxDefined) {
        count = _limitValue(_lookupByKey(points, iScale.axis, max).hi + 1, start, pointCount) - start;
      } else {
        count = pointCount - start;
      }
      return {start, count};
    }
    var plugin_decimation = {
      id: 'decimation',
      defaults: {
        algorithm: 'min-max',
        enabled: false,
      },
      beforeElementsUpdate: (chart, args, options) => {
        if (!options.enabled) {
          cleanDecimatedData(chart);
          return;
        }
        const availableWidth = chart.width;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const {_data, indexAxis} = dataset;
          const meta = chart.getDatasetMeta(datasetIndex);
          const data = _data || dataset.data;
          if (resolve([indexAxis, chart.options.indexAxis]) === 'y') {
            return;
          }
          if (meta.type !== 'line') {
            return;
          }
          const xAxis = chart.scales[meta.xAxisID];
          if (xAxis.type !== 'linear' && xAxis.type !== 'time') {
            return;
          }
          if (chart.options.parsing) {
            return;
          }
          let {start, count} = getStartAndCountOfVisiblePointsSimplified(meta, data);
          if (count <= 4 * availableWidth) {
            cleanDecimatedDataset(dataset);
            return;
          }
          if (isNullOrUndef(_data)) {
            dataset._data = data;
            delete dataset.data;
            Object.defineProperty(dataset, 'data', {
              configurable: true,
              enumerable: true,
              get: function() {
                return this._decimated;
              },
              set: function(d) {
                this._data = d;
              }
            });
          }
          let decimated;
          switch (options.algorithm) {
          case 'lttb':
            decimated = lttbDecimation(data, start, count, availableWidth, options);
            break;
          case 'min-max':
            decimated = minMaxDecimation(data, start, count, availableWidth);
            break;
          default:
            throw new Error(`Unsupported decimation algorithm '${options.algorithm}'`);
          }
          dataset._decimated = decimated;
        });
      },
      destroy(chart) {
        cleanDecimatedData(chart);
      }
    };

    function getLineByIndex(chart, index) {
      const meta = chart.getDatasetMeta(index);
      const visible = meta && chart.isDatasetVisible(index);
      return visible ? meta.dataset : null;
    }
    function parseFillOption(line) {
      const options = line.options;
      const fillOption = options.fill;
      let fill = valueOrDefault(fillOption && fillOption.target, fillOption);
      if (fill === undefined) {
        fill = !!options.backgroundColor;
      }
      if (fill === false || fill === null) {
        return false;
      }
      if (fill === true) {
        return 'origin';
      }
      return fill;
    }
    function decodeFill(line, index, count) {
      const fill = parseFillOption(line);
      if (isObject(fill)) {
        return isNaN(fill.value) ? false : fill;
      }
      let target = parseFloat(fill);
      if (isNumberFinite(target) && Math.floor(target) === target) {
        if (fill[0] === '-' || fill[0] === '+') {
          target = index + target;
        }
        if (target === index || target < 0 || target >= count) {
          return false;
        }
        return target;
      }
      return ['origin', 'start', 'end', 'stack'].indexOf(fill) >= 0 && fill;
    }
    function computeLinearBoundary(source) {
      const {scale = {}, fill} = source;
      let target = null;
      let horizontal;
      if (fill === 'start') {
        target = scale.bottom;
      } else if (fill === 'end') {
        target = scale.top;
      } else if (isObject(fill)) {
        target = scale.getPixelForValue(fill.value);
      } else if (scale.getBasePixel) {
        target = scale.getBasePixel();
      }
      if (isNumberFinite(target)) {
        horizontal = scale.isHorizontal();
        return {
          x: horizontal ? target : null,
          y: horizontal ? null : target
        };
      }
      return null;
    }
    class simpleArc {
      constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.radius = opts.radius;
      }
      pathSegment(ctx, bounds, opts) {
        const {x, y, radius} = this;
        bounds = bounds || {start: 0, end: TAU};
        ctx.arc(x, y, radius, bounds.end, bounds.start, true);
        return !opts.bounds;
      }
      interpolate(point) {
        const {x, y, radius} = this;
        const angle = point.angle;
        return {
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
          angle
        };
      }
    }
    function computeCircularBoundary(source) {
      const {scale, fill} = source;
      const options = scale.options;
      const length = scale.getLabels().length;
      const target = [];
      const start = options.reverse ? scale.max : scale.min;
      const end = options.reverse ? scale.min : scale.max;
      let i, center, value;
      if (fill === 'start') {
        value = start;
      } else if (fill === 'end') {
        value = end;
      } else if (isObject(fill)) {
        value = fill.value;
      } else {
        value = scale.getBaseValue();
      }
      if (options.grid.circular) {
        center = scale.getPointPositionForValue(0, start);
        return new simpleArc({
          x: center.x,
          y: center.y,
          radius: scale.getDistanceFromCenterForValue(value)
        });
      }
      for (i = 0; i < length; ++i) {
        target.push(scale.getPointPositionForValue(i, value));
      }
      return target;
    }
    function computeBoundary(source) {
      const scale = source.scale || {};
      if (scale.getPointPositionForValue) {
        return computeCircularBoundary(source);
      }
      return computeLinearBoundary(source);
    }
    function pointsFromSegments(boundary, line) {
      const {x = null, y = null} = boundary || {};
      const linePoints = line.points;
      const points = [];
      line.segments.forEach((segment) => {
        const first = linePoints[segment.start];
        const last = linePoints[segment.end];
        if (y !== null) {
          points.push({x: first.x, y});
          points.push({x: last.x, y});
        } else if (x !== null) {
          points.push({x, y: first.y});
          points.push({x, y: last.y});
        }
      });
      return points;
    }
    function buildStackLine(source) {
      const {chart, scale, index, line} = source;
      const points = [];
      const segments = line.segments;
      const sourcePoints = line.points;
      const linesBelow = getLinesBelow(chart, index);
      linesBelow.push(createBoundaryLine({x: null, y: scale.bottom}, line));
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        for (let j = segment.start; j <= segment.end; j++) {
          addPointsBelow(points, sourcePoints[j], linesBelow);
        }
      }
      return new LineElement({points, options: {}});
    }
    const isLineAndNotInHideAnimation = (meta) => meta.type === 'line' && !meta.hidden;
    function getLinesBelow(chart, index) {
      const below = [];
      const metas = chart.getSortedVisibleDatasetMetas();
      for (let i = 0; i < metas.length; i++) {
        const meta = metas[i];
        if (meta.index === index) {
          break;
        }
        if (isLineAndNotInHideAnimation(meta)) {
          below.unshift(meta.dataset);
        }
      }
      return below;
    }
    function addPointsBelow(points, sourcePoint, linesBelow) {
      const postponed = [];
      for (let j = 0; j < linesBelow.length; j++) {
        const line = linesBelow[j];
        const {first, last, point} = findPoint(line, sourcePoint, 'x');
        if (!point || (first && last)) {
          continue;
        }
        if (first) {
          postponed.unshift(point);
        } else {
          points.push(point);
          if (!last) {
            break;
          }
        }
      }
      points.push(...postponed);
    }
    function findPoint(line, sourcePoint, property) {
      const point = line.interpolate(sourcePoint, property);
      if (!point) {
        return {};
      }
      const pointValue = point[property];
      const segments = line.segments;
      const linePoints = line.points;
      let first = false;
      let last = false;
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const firstValue = linePoints[segment.start][property];
        const lastValue = linePoints[segment.end][property];
        if (pointValue >= firstValue && pointValue <= lastValue) {
          first = pointValue === firstValue;
          last = pointValue === lastValue;
          break;
        }
      }
      return {first, last, point};
    }
    function getTarget(source) {
      const {chart, fill, line} = source;
      if (isNumberFinite(fill)) {
        return getLineByIndex(chart, fill);
      }
      if (fill === 'stack') {
        return buildStackLine(source);
      }
      const boundary = computeBoundary(source);
      if (boundary instanceof simpleArc) {
        return boundary;
      }
      return createBoundaryLine(boundary, line);
    }
    function createBoundaryLine(boundary, line) {
      let points = [];
      let _loop = false;
      if (isArray(boundary)) {
        _loop = true;
        points = boundary;
      } else {
        points = pointsFromSegments(boundary, line);
      }
      return points.length ? new LineElement({
        points,
        options: {tension: 0},
        _loop,
        _fullLoop: _loop
      }) : null;
    }
    function resolveTarget(sources, index, propagate) {
      const source = sources[index];
      let fill = source.fill;
      const visited = [index];
      let target;
      if (!propagate) {
        return fill;
      }
      while (fill !== false && visited.indexOf(fill) === -1) {
        if (!isNumberFinite(fill)) {
          return fill;
        }
        target = sources[fill];
        if (!target) {
          return false;
        }
        if (target.visible) {
          return fill;
        }
        visited.push(fill);
        fill = target.fill;
      }
      return false;
    }
    function _clip(ctx, target, clipY) {
      ctx.beginPath();
      target.path(ctx);
      ctx.lineTo(target.last().x, clipY);
      ctx.lineTo(target.first().x, clipY);
      ctx.closePath();
      ctx.clip();
    }
    function getBounds(property, first, last, loop) {
      if (loop) {
        return;
      }
      let start = first[property];
      let end = last[property];
      if (property === 'angle') {
        start = _normalizeAngle(start);
        end = _normalizeAngle(end);
      }
      return {property, start, end};
    }
    function _getEdge(a, b, prop, fn) {
      if (a && b) {
        return fn(a[prop], b[prop]);
      }
      return a ? a[prop] : b ? b[prop] : 0;
    }
    function _segments(line, target, property) {
      const segments = line.segments;
      const points = line.points;
      const tpoints = target.points;
      const parts = [];
      for (const segment of segments) {
        const bounds = getBounds(property, points[segment.start], points[segment.end], segment.loop);
        if (!target.segments) {
          parts.push({
            source: segment,
            target: bounds,
            start: points[segment.start],
            end: points[segment.end]
          });
          continue;
        }
        const targetSegments = _boundSegments(target, bounds);
        for (const tgt of targetSegments) {
          const subBounds = getBounds(property, tpoints[tgt.start], tpoints[tgt.end], tgt.loop);
          const fillSources = _boundSegment(segment, points, subBounds);
          for (const fillSource of fillSources) {
            parts.push({
              source: fillSource,
              target: tgt,
              start: {
                [property]: _getEdge(bounds, subBounds, 'start', Math.max)
              },
              end: {
                [property]: _getEdge(bounds, subBounds, 'end', Math.min)
              }
            });
          }
        }
      }
      return parts;
    }
    function clipBounds(ctx, scale, bounds) {
      const {top, bottom} = scale.chart.chartArea;
      const {property, start, end} = bounds || {};
      if (property === 'x') {
        ctx.beginPath();
        ctx.rect(start, top, end - start, bottom - top);
        ctx.clip();
      }
    }
    function interpolatedLineTo(ctx, target, point, property) {
      const interpolatedPoint = target.interpolate(point, property);
      if (interpolatedPoint) {
        ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
      }
    }
    function _fill(ctx, cfg) {
      const {line, target, property, color, scale} = cfg;
      const segments = _segments(line, target, property);
      for (const {source: src, target: tgt, start, end} of segments) {
        const {style: {backgroundColor = color} = {}} = src;
        ctx.save();
        ctx.fillStyle = backgroundColor;
        clipBounds(ctx, scale, getBounds(property, start, end));
        ctx.beginPath();
        const lineLoop = !!line.pathSegment(ctx, src);
        if (lineLoop) {
          ctx.closePath();
        } else {
          interpolatedLineTo(ctx, target, end, property);
        }
        const targetLoop = !!target.pathSegment(ctx, tgt, {move: lineLoop, reverse: true});
        const loop = lineLoop && targetLoop;
        if (!loop) {
          interpolatedLineTo(ctx, target, start, property);
        }
        ctx.closePath();
        ctx.fill(loop ? 'evenodd' : 'nonzero');
        ctx.restore();
      }
    }
    function doFill(ctx, cfg) {
      const {line, target, above, below, area, scale} = cfg;
      const property = line._loop ? 'angle' : cfg.axis;
      ctx.save();
      if (property === 'x' && below !== above) {
        _clip(ctx, target, area.top);
        _fill(ctx, {line, target, color: above, scale, property});
        ctx.restore();
        ctx.save();
        _clip(ctx, target, area.bottom);
      }
      _fill(ctx, {line, target, color: below, scale, property});
      ctx.restore();
    }
    function drawfill(ctx, source, area) {
      const target = getTarget(source);
      const {line, scale, axis} = source;
      const lineOpts = line.options;
      const fillOption = lineOpts.fill;
      const color = lineOpts.backgroundColor;
      const {above = color, below = color} = fillOption || {};
      if (target && line.points.length) {
        clipArea(ctx, area);
        doFill(ctx, {line, target, above, below, area, scale, axis});
        unclipArea(ctx);
      }
    }
    var plugin_filler = {
      id: 'filler',
      afterDatasetsUpdate(chart, _args, options) {
        const count = (chart.data.datasets || []).length;
        const sources = [];
        let meta, i, line, source;
        for (i = 0; i < count; ++i) {
          meta = chart.getDatasetMeta(i);
          line = meta.dataset;
          source = null;
          if (line && line.options && line instanceof LineElement) {
            source = {
              visible: chart.isDatasetVisible(i),
              index: i,
              fill: decodeFill(line, i, count),
              chart,
              axis: meta.controller.options.indexAxis,
              scale: meta.vScale,
              line,
            };
          }
          meta.$filler = source;
          sources.push(source);
        }
        for (i = 0; i < count; ++i) {
          source = sources[i];
          if (!source || source.fill === false) {
            continue;
          }
          source.fill = resolveTarget(sources, i, options.propagate);
        }
      },
      beforeDraw(chart, _args, options) {
        const draw = options.drawTime === 'beforeDraw';
        const metasets = chart.getSortedVisibleDatasetMetas();
        const area = chart.chartArea;
        for (let i = metasets.length - 1; i >= 0; --i) {
          const source = metasets[i].$filler;
          if (!source) {
            continue;
          }
          source.line.updateControlPoints(area);
          if (draw) {
            drawfill(chart.ctx, source, area);
          }
        }
      },
      beforeDatasetsDraw(chart, _args, options) {
        if (options.drawTime !== 'beforeDatasetsDraw') {
          return;
        }
        const metasets = chart.getSortedVisibleDatasetMetas();
        for (let i = metasets.length - 1; i >= 0; --i) {
          const source = metasets[i].$filler;
          if (source) {
            drawfill(chart.ctx, source, chart.chartArea);
          }
        }
      },
      beforeDatasetDraw(chart, args, options) {
        const source = args.meta.$filler;
        if (!source || source.fill === false || options.drawTime !== 'beforeDatasetDraw') {
          return;
        }
        drawfill(chart.ctx, source, chart.chartArea);
      },
      defaults: {
        propagate: true,
        drawTime: 'beforeDatasetDraw'
      }
    };

    const getBoxSize = (labelOpts, fontSize) => {
      let {boxHeight = fontSize, boxWidth = fontSize} = labelOpts;
      if (labelOpts.usePointStyle) {
        boxHeight = Math.min(boxHeight, fontSize);
        boxWidth = Math.min(boxWidth, fontSize);
      }
      return {
        boxWidth,
        boxHeight,
        itemHeight: Math.max(fontSize, boxHeight)
      };
    };
    const itemsEqual = (a, b) => a !== null && b !== null && a.datasetIndex === b.datasetIndex && a.index === b.index;
    class Legend extends Element {
      constructor(config) {
        super();
        this._added = false;
        this.legendHitBoxes = [];
        this._hoveredItem = null;
        this.doughnutMode = false;
        this.chart = config.chart;
        this.options = config.options;
        this.ctx = config.ctx;
        this.legendItems = undefined;
        this.columnSizes = undefined;
        this.lineWidths = undefined;
        this.maxHeight = undefined;
        this.maxWidth = undefined;
        this.top = undefined;
        this.bottom = undefined;
        this.left = undefined;
        this.right = undefined;
        this.height = undefined;
        this.width = undefined;
        this._margins = undefined;
        this.position = undefined;
        this.weight = undefined;
        this.fullSize = undefined;
      }
      update(maxWidth, maxHeight, margins) {
        const me = this;
        me.maxWidth = maxWidth;
        me.maxHeight = maxHeight;
        me._margins = margins;
        me.setDimensions();
        me.buildLabels();
        me.fit();
      }
      setDimensions() {
        const me = this;
        if (me.isHorizontal()) {
          me.width = me.maxWidth;
          me.left = 0;
          me.right = me.width;
        } else {
          me.height = me.maxHeight;
          me.top = 0;
          me.bottom = me.height;
        }
      }
      buildLabels() {
        const me = this;
        const labelOpts = me.options.labels || {};
        let legendItems = callback(labelOpts.generateLabels, [me.chart], me) || [];
        if (labelOpts.filter) {
          legendItems = legendItems.filter((item) => labelOpts.filter(item, me.chart.data));
        }
        if (labelOpts.sort) {
          legendItems = legendItems.sort((a, b) => labelOpts.sort(a, b, me.chart.data));
        }
        if (me.options.reverse) {
          legendItems.reverse();
        }
        me.legendItems = legendItems;
      }
      fit() {
        const me = this;
        const {options, ctx} = me;
        if (!options.display) {
          me.width = me.height = 0;
          return;
        }
        const labelOpts = options.labels;
        const labelFont = toFont(labelOpts.font);
        const fontSize = labelFont.size;
        const titleHeight = me._computeTitleHeight();
        const {boxWidth, itemHeight} = getBoxSize(labelOpts, fontSize);
        let width, height;
        ctx.font = labelFont.string;
        if (me.isHorizontal()) {
          width = me.maxWidth;
          height = me._fitRows(titleHeight, fontSize, boxWidth, itemHeight) + 10;
        } else {
          height = me.maxHeight;
          width = me._fitCols(titleHeight, fontSize, boxWidth, itemHeight) + 10;
        }
        me.width = Math.min(width, options.maxWidth || me.maxWidth);
        me.height = Math.min(height, options.maxHeight || me.maxHeight);
      }
      _fitRows(titleHeight, fontSize, boxWidth, itemHeight) {
        const me = this;
        const {ctx, maxWidth, options: {labels: {padding}}} = me;
        const hitboxes = me.legendHitBoxes = [];
        const lineWidths = me.lineWidths = [0];
        const lineHeight = itemHeight + padding;
        let totalHeight = titleHeight;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let row = -1;
        let top = -lineHeight;
        me.legendItems.forEach((legendItem, i) => {
          const itemWidth = boxWidth + (fontSize / 2) + ctx.measureText(legendItem.text).width;
          if (i === 0 || lineWidths[lineWidths.length - 1] + itemWidth + 2 * padding > maxWidth) {
            totalHeight += lineHeight;
            lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
            top += lineHeight;
            row++;
          }
          hitboxes[i] = {left: 0, top, row, width: itemWidth, height: itemHeight};
          lineWidths[lineWidths.length - 1] += itemWidth + padding;
        });
        return totalHeight;
      }
      _fitCols(titleHeight, fontSize, boxWidth, itemHeight) {
        const me = this;
        const {ctx, maxHeight, options: {labels: {padding}}} = me;
        const hitboxes = me.legendHitBoxes = [];
        const columnSizes = me.columnSizes = [];
        const heightLimit = maxHeight - titleHeight;
        let totalWidth = padding;
        let currentColWidth = 0;
        let currentColHeight = 0;
        let left = 0;
        let top = 0;
        let col = 0;
        me.legendItems.forEach((legendItem, i) => {
          const itemWidth = boxWidth + (fontSize / 2) + ctx.measureText(legendItem.text).width;
          if (i > 0 && currentColHeight + fontSize + 2 * padding > heightLimit) {
            totalWidth += currentColWidth + padding;
            columnSizes.push({width: currentColWidth, height: currentColHeight});
            left += currentColWidth + padding;
            col++;
            top = 0;
            currentColWidth = currentColHeight = 0;
          }
          currentColWidth = Math.max(currentColWidth, itemWidth);
          currentColHeight += fontSize + padding;
          hitboxes[i] = {left, top, col, width: itemWidth, height: itemHeight};
          top += itemHeight + padding;
        });
        totalWidth += currentColWidth;
        columnSizes.push({width: currentColWidth, height: currentColHeight});
        return totalWidth;
      }
      adjustHitBoxes() {
        const me = this;
        if (!me.options.display) {
          return;
        }
        const titleHeight = me._computeTitleHeight();
        const {legendHitBoxes: hitboxes, options: {align, labels: {padding}}} = me;
        if (this.isHorizontal()) {
          let row = 0;
          let left = _alignStartEnd(align, me.left + padding, me.right - me.lineWidths[row]);
          for (const hitbox of hitboxes) {
            if (row !== hitbox.row) {
              row = hitbox.row;
              left = _alignStartEnd(align, me.left + padding, me.right - me.lineWidths[row]);
            }
            hitbox.top += me.top + titleHeight + padding;
            hitbox.left = left;
            left += hitbox.width + padding;
          }
        } else {
          let col = 0;
          let top = _alignStartEnd(align, me.top + titleHeight + padding, me.bottom - me.columnSizes[col].height);
          for (const hitbox of hitboxes) {
            if (hitbox.col !== col) {
              col = hitbox.col;
              top = _alignStartEnd(align, me.top + titleHeight + padding, me.bottom - me.columnSizes[col].height);
            }
            hitbox.top = top;
            hitbox.left += me.left + padding;
            top += hitbox.height + padding;
          }
        }
      }
      isHorizontal() {
        return this.options.position === 'top' || this.options.position === 'bottom';
      }
      draw() {
        const me = this;
        if (me.options.display) {
          const ctx = me.ctx;
          clipArea(ctx, me);
          me._draw();
          unclipArea(ctx);
        }
      }
      _draw() {
        const me = this;
        const {options: opts, columnSizes, lineWidths, ctx} = me;
        const {align, labels: labelOpts} = opts;
        const defaultColor = defaults.color;
        const rtlHelper = getRtlAdapter(opts.rtl, me.left, me.width);
        const labelFont = toFont(labelOpts.font);
        const {color: fontColor, padding} = labelOpts;
        const fontSize = labelFont.size;
        const halfFontSize = fontSize / 2;
        let cursor;
        me.drawTitle();
        ctx.textAlign = rtlHelper.textAlign('left');
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 0.5;
        ctx.font = labelFont.string;
        const {boxWidth, boxHeight, itemHeight} = getBoxSize(labelOpts, fontSize);
        const drawLegendBox = function(x, y, legendItem) {
          if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
            return;
          }
          ctx.save();
          const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
          ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
          ctx.lineCap = valueOrDefault(legendItem.lineCap, 'butt');
          ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
          ctx.lineJoin = valueOrDefault(legendItem.lineJoin, 'miter');
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
          ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
          if (labelOpts.usePointStyle) {
            const drawOptions = {
              radius: boxWidth * Math.SQRT2 / 2,
              pointStyle: legendItem.pointStyle,
              rotation: legendItem.rotation,
              borderWidth: lineWidth
            };
            const centerX = rtlHelper.xPlus(x, boxWidth / 2);
            const centerY = y + halfFontSize;
            drawPoint(ctx, drawOptions, centerX, centerY);
          } else {
            const yBoxTop = y + Math.max((fontSize - boxHeight) / 2, 0);
            const xBoxLeft = rtlHelper.leftForLtr(x, boxWidth);
            const borderRadius = toTRBLCorners(legendItem.borderRadius);
            ctx.beginPath();
            if (Object.values(borderRadius).some(v => v !== 0)) {
              addRoundedRectPath(ctx, {
                x: xBoxLeft,
                y: yBoxTop,
                w: boxWidth,
                h: boxHeight,
                radius: borderRadius,
              });
            } else {
              ctx.rect(xBoxLeft, yBoxTop, boxWidth, boxHeight);
            }
            ctx.fill();
            if (lineWidth !== 0) {
              ctx.stroke();
            }
          }
          ctx.restore();
        };
        const fillText = function(x, y, legendItem) {
          renderText(ctx, legendItem.text, x, y + (itemHeight / 2), labelFont, {
            strikethrough: legendItem.hidden,
            textAlign: legendItem.textAlign
          });
        };
        const isHorizontal = me.isHorizontal();
        const titleHeight = this._computeTitleHeight();
        if (isHorizontal) {
          cursor = {
            x: _alignStartEnd(align, me.left + padding, me.right - lineWidths[0]),
            y: me.top + padding + titleHeight,
            line: 0
          };
        } else {
          cursor = {
            x: me.left + padding,
            y: _alignStartEnd(align, me.top + titleHeight + padding, me.bottom - columnSizes[0].height),
            line: 0
          };
        }
        overrideTextDirection(me.ctx, opts.textDirection);
        const lineHeight = itemHeight + padding;
        me.legendItems.forEach((legendItem, i) => {
          ctx.strokeStyle = legendItem.fontColor || fontColor;
          ctx.fillStyle = legendItem.fontColor || fontColor;
          const textWidth = ctx.measureText(legendItem.text).width;
          const textAlign = rtlHelper.textAlign(legendItem.textAlign || (legendItem.textAlign = labelOpts.textAlign));
          const width = boxWidth + (fontSize / 2) + textWidth;
          let x = cursor.x;
          let y = cursor.y;
          rtlHelper.setWidth(me.width);
          if (isHorizontal) {
            if (i > 0 && x + width + padding > me.right) {
              y = cursor.y += lineHeight;
              cursor.line++;
              x = cursor.x = _alignStartEnd(align, me.left + padding, me.right - lineWidths[cursor.line]);
            }
          } else if (i > 0 && y + lineHeight > me.bottom) {
            x = cursor.x = x + columnSizes[cursor.line].width + padding;
            cursor.line++;
            y = cursor.y = _alignStartEnd(align, me.top + titleHeight + padding, me.bottom - columnSizes[cursor.line].height);
          }
          const realX = rtlHelper.x(x);
          drawLegendBox(realX, y, legendItem);
          x = _textX(textAlign, x + boxWidth + halfFontSize, me.right);
          fillText(rtlHelper.x(x), y, legendItem);
          if (isHorizontal) {
            cursor.x += width + padding;
          } else {
            cursor.y += lineHeight;
          }
        });
        restoreTextDirection(me.ctx, opts.textDirection);
      }
      drawTitle() {
        const me = this;
        const opts = me.options;
        const titleOpts = opts.title;
        const titleFont = toFont(titleOpts.font);
        const titlePadding = toPadding(titleOpts.padding);
        if (!titleOpts.display) {
          return;
        }
        const rtlHelper = getRtlAdapter(opts.rtl, me.left, me.width);
        const ctx = me.ctx;
        const position = titleOpts.position;
        const halfFontSize = titleFont.size / 2;
        const topPaddingPlusHalfFontSize = titlePadding.top + halfFontSize;
        let y;
        let left = me.left;
        let maxWidth = me.width;
        if (this.isHorizontal()) {
          maxWidth = Math.max(...me.lineWidths);
          y = me.top + topPaddingPlusHalfFontSize;
          left = _alignStartEnd(opts.align, left, me.right - maxWidth);
        } else {
          const maxHeight = me.columnSizes.reduce((acc, size) => Math.max(acc, size.height), 0);
          y = topPaddingPlusHalfFontSize + _alignStartEnd(opts.align, me.top, me.bottom - maxHeight - opts.labels.padding - me._computeTitleHeight());
        }
        const x = _alignStartEnd(position, left, left + maxWidth);
        ctx.textAlign = rtlHelper.textAlign(_toLeftRightCenter(position));
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = titleOpts.color;
        ctx.fillStyle = titleOpts.color;
        ctx.font = titleFont.string;
        renderText(ctx, titleOpts.text, x, y, titleFont);
      }
      _computeTitleHeight() {
        const titleOpts = this.options.title;
        const titleFont = toFont(titleOpts.font);
        const titlePadding = toPadding(titleOpts.padding);
        return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
      }
      _getLegendItemAt(x, y) {
        const me = this;
        let i, hitBox, lh;
        if (x >= me.left && x <= me.right && y >= me.top && y <= me.bottom) {
          lh = me.legendHitBoxes;
          for (i = 0; i < lh.length; ++i) {
            hitBox = lh[i];
            if (x >= hitBox.left && x <= hitBox.left + hitBox.width && y >= hitBox.top && y <= hitBox.top + hitBox.height) {
              return me.legendItems[i];
            }
          }
        }
        return null;
      }
      handleEvent(e) {
        const me = this;
        const opts = me.options;
        if (!isListened(e.type, opts)) {
          return;
        }
        const hoveredItem = me._getLegendItemAt(e.x, e.y);
        if (e.type === 'mousemove') {
          const previous = me._hoveredItem;
          const sameItem = itemsEqual(previous, hoveredItem);
          if (previous && !sameItem) {
            callback(opts.onLeave, [e, previous, me], me);
          }
          me._hoveredItem = hoveredItem;
          if (hoveredItem && !sameItem) {
            callback(opts.onHover, [e, hoveredItem, me], me);
          }
        } else if (hoveredItem) {
          callback(opts.onClick, [e, hoveredItem, me], me);
        }
      }
    }
    function isListened(type, opts) {
      if (type === 'mousemove' && (opts.onHover || opts.onLeave)) {
        return true;
      }
      if (opts.onClick && (type === 'click' || type === 'mouseup')) {
        return true;
      }
      return false;
    }
    var plugin_legend = {
      id: 'legend',
      _element: Legend,
      start(chart, _args, options) {
        const legend = chart.legend = new Legend({ctx: chart.ctx, options, chart});
        layouts.configure(chart, legend, options);
        layouts.addBox(chart, legend);
      },
      stop(chart) {
        layouts.removeBox(chart, chart.legend);
        delete chart.legend;
      },
      beforeUpdate(chart, _args, options) {
        const legend = chart.legend;
        layouts.configure(chart, legend, options);
        legend.options = options;
      },
      afterUpdate(chart) {
        const legend = chart.legend;
        legend.buildLabels();
        legend.adjustHitBoxes();
      },
      afterEvent(chart, args) {
        if (!args.replay) {
          chart.legend.handleEvent(args.event);
        }
      },
      defaults: {
        display: true,
        position: 'top',
        align: 'center',
        fullSize: true,
        reverse: false,
        weight: 1000,
        onClick(e, legendItem, legend) {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index)) {
            ci.hide(index);
            legendItem.hidden = true;
          } else {
            ci.show(index);
            legendItem.hidden = false;
          }
        },
        onHover: null,
        onLeave: null,
        labels: {
          color: (ctx) => ctx.chart.options.color,
          boxWidth: 40,
          padding: 10,
          generateLabels(chart) {
            const datasets = chart.data.datasets;
            const {labels: {usePointStyle, pointStyle, textAlign, color}} = chart.legend.options;
            return chart._getSortedDatasetMetas().map((meta) => {
              const style = meta.controller.getStyle(usePointStyle ? 0 : undefined);
              const borderWidth = toPadding(style.borderWidth);
              return {
                text: datasets[meta.index].label,
                fillStyle: style.backgroundColor,
                fontColor: color,
                hidden: !meta.visible,
                lineCap: style.borderCapStyle,
                lineDash: style.borderDash,
                lineDashOffset: style.borderDashOffset,
                lineJoin: style.borderJoinStyle,
                lineWidth: (borderWidth.width + borderWidth.height) / 4,
                strokeStyle: style.borderColor,
                pointStyle: pointStyle || style.pointStyle,
                rotation: style.rotation,
                textAlign: textAlign || style.textAlign,
                borderRadius: 0,
                datasetIndex: meta.index
              };
            }, this);
          }
        },
        title: {
          color: (ctx) => ctx.chart.options.color,
          display: false,
          position: 'center',
          text: '',
        }
      },
      descriptors: {
        _scriptable: (name) => !name.startsWith('on'),
        labels: {
          _scriptable: (name) => !['generateLabels', 'filter', 'sort'].includes(name),
        }
      },
    };

    class Title extends Element {
      constructor(config) {
        super();
        this.chart = config.chart;
        this.options = config.options;
        this.ctx = config.ctx;
        this._padding = undefined;
        this.top = undefined;
        this.bottom = undefined;
        this.left = undefined;
        this.right = undefined;
        this.width = undefined;
        this.height = undefined;
        this.position = undefined;
        this.weight = undefined;
        this.fullSize = undefined;
      }
      update(maxWidth, maxHeight) {
        const me = this;
        const opts = me.options;
        me.left = 0;
        me.top = 0;
        if (!opts.display) {
          me.width = me.height = me.right = me.bottom = 0;
          return;
        }
        me.width = me.right = maxWidth;
        me.height = me.bottom = maxHeight;
        const lineCount = isArray(opts.text) ? opts.text.length : 1;
        me._padding = toPadding(opts.padding);
        const textSize = lineCount * toFont(opts.font).lineHeight + me._padding.height;
        if (me.isHorizontal()) {
          me.height = textSize;
        } else {
          me.width = textSize;
        }
      }
      isHorizontal() {
        const pos = this.options.position;
        return pos === 'top' || pos === 'bottom';
      }
      _drawArgs(offset) {
        const {top, left, bottom, right, options} = this;
        const align = options.align;
        let rotation = 0;
        let maxWidth, titleX, titleY;
        if (this.isHorizontal()) {
          titleX = _alignStartEnd(align, left, right);
          titleY = top + offset;
          maxWidth = right - left;
        } else {
          if (options.position === 'left') {
            titleX = left + offset;
            titleY = _alignStartEnd(align, bottom, top);
            rotation = PI * -0.5;
          } else {
            titleX = right - offset;
            titleY = _alignStartEnd(align, top, bottom);
            rotation = PI * 0.5;
          }
          maxWidth = bottom - top;
        }
        return {titleX, titleY, maxWidth, rotation};
      }
      draw() {
        const me = this;
        const ctx = me.ctx;
        const opts = me.options;
        if (!opts.display) {
          return;
        }
        const fontOpts = toFont(opts.font);
        const lineHeight = fontOpts.lineHeight;
        const offset = lineHeight / 2 + me._padding.top;
        const {titleX, titleY, maxWidth, rotation} = me._drawArgs(offset);
        renderText(ctx, opts.text, 0, 0, fontOpts, {
          color: opts.color,
          maxWidth,
          rotation,
          textAlign: _toLeftRightCenter(opts.align),
          textBaseline: 'middle',
          translation: [titleX, titleY],
        });
      }
    }
    function createTitle(chart, titleOpts) {
      const title = new Title({
        ctx: chart.ctx,
        options: titleOpts,
        chart
      });
      layouts.configure(chart, title, titleOpts);
      layouts.addBox(chart, title);
      chart.titleBlock = title;
    }
    var plugin_title = {
      id: 'title',
      _element: Title,
      start(chart, _args, options) {
        createTitle(chart, options);
      },
      stop(chart) {
        const titleBlock = chart.titleBlock;
        layouts.removeBox(chart, titleBlock);
        delete chart.titleBlock;
      },
      beforeUpdate(chart, _args, options) {
        const title = chart.titleBlock;
        layouts.configure(chart, title, options);
        title.options = options;
      },
      defaults: {
        align: 'center',
        display: false,
        font: {
          weight: 'bold',
        },
        fullSize: true,
        padding: 10,
        position: 'top',
        text: '',
        weight: 2000
      },
      defaultRoutes: {
        color: 'color'
      },
      descriptors: {
        _scriptable: true,
        _indexable: false,
      },
    };

    const positioners = {
      average(items) {
        if (!items.length) {
          return false;
        }
        let i, len;
        let x = 0;
        let y = 0;
        let count = 0;
        for (i = 0, len = items.length; i < len; ++i) {
          const el = items[i].element;
          if (el && el.hasValue()) {
            const pos = el.tooltipPosition();
            x += pos.x;
            y += pos.y;
            ++count;
          }
        }
        return {
          x: x / count,
          y: y / count
        };
      },
      nearest(items, eventPosition) {
        if (!items.length) {
          return false;
        }
        let x = eventPosition.x;
        let y = eventPosition.y;
        let minDistance = Number.POSITIVE_INFINITY;
        let i, len, nearestElement;
        for (i = 0, len = items.length; i < len; ++i) {
          const el = items[i].element;
          if (el && el.hasValue()) {
            const center = el.getCenterPoint();
            const d = distanceBetweenPoints(eventPosition, center);
            if (d < minDistance) {
              minDistance = d;
              nearestElement = el;
            }
          }
        }
        if (nearestElement) {
          const tp = nearestElement.tooltipPosition();
          x = tp.x;
          y = tp.y;
        }
        return {
          x,
          y
        };
      }
    };
    function pushOrConcat(base, toPush) {
      if (toPush) {
        if (isArray(toPush)) {
          Array.prototype.push.apply(base, toPush);
        } else {
          base.push(toPush);
        }
      }
      return base;
    }
    function splitNewlines(str) {
      if ((typeof str === 'string' || str instanceof String) && str.indexOf('\n') > -1) {
        return str.split('\n');
      }
      return str;
    }
    function createTooltipItem(chart, item) {
      const {element, datasetIndex, index} = item;
      const controller = chart.getDatasetMeta(datasetIndex).controller;
      const {label, value} = controller.getLabelAndValue(index);
      return {
        chart,
        label,
        parsed: controller.getParsed(index),
        raw: chart.data.datasets[datasetIndex].data[index],
        formattedValue: value,
        dataset: controller.getDataset(),
        dataIndex: index,
        datasetIndex,
        element
      };
    }
    function getTooltipSize(tooltip, options) {
      const ctx = tooltip._chart.ctx;
      const {body, footer, title} = tooltip;
      const {boxWidth, boxHeight} = options;
      const bodyFont = toFont(options.bodyFont);
      const titleFont = toFont(options.titleFont);
      const footerFont = toFont(options.footerFont);
      const titleLineCount = title.length;
      const footerLineCount = footer.length;
      const bodyLineItemCount = body.length;
      const padding = toPadding(options.padding);
      let height = padding.height;
      let width = 0;
      let combinedBodyLength = body.reduce((count, bodyItem) => count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
      combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
      if (titleLineCount) {
        height += titleLineCount * titleFont.lineHeight
    			+ (titleLineCount - 1) * options.titleSpacing
    			+ options.titleMarginBottom;
      }
      if (combinedBodyLength) {
        const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
        height += bodyLineItemCount * bodyLineHeight
    			+ (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight
    			+ (combinedBodyLength - 1) * options.bodySpacing;
      }
      if (footerLineCount) {
        height += options.footerMarginTop
    			+ footerLineCount * footerFont.lineHeight
    			+ (footerLineCount - 1) * options.footerSpacing;
      }
      let widthPadding = 0;
      const maxLineWidth = function(line) {
        width = Math.max(width, ctx.measureText(line).width + widthPadding);
      };
      ctx.save();
      ctx.font = titleFont.string;
      each(tooltip.title, maxLineWidth);
      ctx.font = bodyFont.string;
      each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
      widthPadding = options.displayColors ? (boxWidth + 2) : 0;
      each(body, (bodyItem) => {
        each(bodyItem.before, maxLineWidth);
        each(bodyItem.lines, maxLineWidth);
        each(bodyItem.after, maxLineWidth);
      });
      widthPadding = 0;
      ctx.font = footerFont.string;
      each(tooltip.footer, maxLineWidth);
      ctx.restore();
      width += padding.width;
      return {width, height};
    }
    function determineYAlign(chart, size) {
      const {y, height} = size;
      if (y < height / 2) {
        return 'top';
      } else if (y > (chart.height - height / 2)) {
        return 'bottom';
      }
      return 'center';
    }
    function doesNotFitWithAlign(xAlign, chart, options, size) {
      const {x, width} = size;
      const caret = options.caretSize + options.caretPadding;
      if (xAlign === 'left' && x + width + caret > chart.width) {
        return true;
      }
      if (xAlign === 'right' && x - width - caret < 0) {
        return true;
      }
    }
    function determineXAlign(chart, options, size, yAlign) {
      const {x, width} = size;
      const {width: chartWidth, chartArea: {left, right}} = chart;
      let xAlign = 'center';
      if (yAlign === 'center') {
        xAlign = x <= (left + right) / 2 ? 'left' : 'right';
      } else if (x <= width / 2) {
        xAlign = 'left';
      } else if (x >= chartWidth - width / 2) {
        xAlign = 'right';
      }
      if (doesNotFitWithAlign(xAlign, chart, options, size)) {
        xAlign = 'center';
      }
      return xAlign;
    }
    function determineAlignment(chart, options, size) {
      const yAlign = options.yAlign || determineYAlign(chart, size);
      return {
        xAlign: options.xAlign || determineXAlign(chart, options, size, yAlign),
        yAlign
      };
    }
    function alignX(size, xAlign) {
      let {x, width} = size;
      if (xAlign === 'right') {
        x -= width;
      } else if (xAlign === 'center') {
        x -= (width / 2);
      }
      return x;
    }
    function alignY(size, yAlign, paddingAndSize) {
      let {y, height} = size;
      if (yAlign === 'top') {
        y += paddingAndSize;
      } else if (yAlign === 'bottom') {
        y -= height + paddingAndSize;
      } else {
        y -= (height / 2);
      }
      return y;
    }
    function getBackgroundPoint(options, size, alignment, chart) {
      const {caretSize, caretPadding, cornerRadius} = options;
      const {xAlign, yAlign} = alignment;
      const paddingAndSize = caretSize + caretPadding;
      const radiusAndPadding = cornerRadius + caretPadding;
      let x = alignX(size, xAlign);
      const y = alignY(size, yAlign, paddingAndSize);
      if (yAlign === 'center') {
        if (xAlign === 'left') {
          x += paddingAndSize;
        } else if (xAlign === 'right') {
          x -= paddingAndSize;
        }
      } else if (xAlign === 'left') {
        x -= radiusAndPadding;
      } else if (xAlign === 'right') {
        x += radiusAndPadding;
      }
      return {
        x: _limitValue(x, 0, chart.width - size.width),
        y: _limitValue(y, 0, chart.height - size.height)
      };
    }
    function getAlignedX(tooltip, align, options) {
      const padding = toPadding(options.padding);
      return align === 'center'
        ? tooltip.x + tooltip.width / 2
        : align === 'right'
          ? tooltip.x + tooltip.width - padding.right
          : tooltip.x + padding.left;
    }
    function getBeforeAfterBodyLines(callback) {
      return pushOrConcat([], splitNewlines(callback));
    }
    function createTooltipContext(parent, tooltip, tooltipItems) {
      return Object.assign(Object.create(parent), {
        tooltip,
        tooltipItems,
        type: 'tooltip'
      });
    }
    function overrideCallbacks(callbacks, context) {
      const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
      return override ? callbacks.override(override) : callbacks;
    }
    class Tooltip extends Element {
      constructor(config) {
        super();
        this.opacity = 0;
        this._active = [];
        this._chart = config._chart;
        this._eventPosition = undefined;
        this._size = undefined;
        this._cachedAnimations = undefined;
        this._tooltipItems = [];
        this.$animations = undefined;
        this.$context = undefined;
        this.options = config.options;
        this.dataPoints = undefined;
        this.title = undefined;
        this.beforeBody = undefined;
        this.body = undefined;
        this.afterBody = undefined;
        this.footer = undefined;
        this.xAlign = undefined;
        this.yAlign = undefined;
        this.x = undefined;
        this.y = undefined;
        this.height = undefined;
        this.width = undefined;
        this.caretX = undefined;
        this.caretY = undefined;
        this.labelColors = undefined;
        this.labelPointStyles = undefined;
        this.labelTextColors = undefined;
      }
      initialize(options) {
        this.options = options;
        this._cachedAnimations = undefined;
        this.$context = undefined;
      }
      _resolveAnimations() {
        const me = this;
        const cached = me._cachedAnimations;
        if (cached) {
          return cached;
        }
        const chart = me._chart;
        const options = me.options.setContext(me.getContext());
        const opts = options.enabled && chart.options.animation && options.animations;
        const animations = new Animations(me._chart, opts);
        if (opts._cacheable) {
          me._cachedAnimations = Object.freeze(animations);
        }
        return animations;
      }
      getContext() {
        const me = this;
        return me.$context ||
    			(me.$context = createTooltipContext(me._chart.getContext(), me, me._tooltipItems));
      }
      getTitle(context, options) {
        const me = this;
        const {callbacks} = options;
        const beforeTitle = callbacks.beforeTitle.apply(me, [context]);
        const title = callbacks.title.apply(me, [context]);
        const afterTitle = callbacks.afterTitle.apply(me, [context]);
        let lines = [];
        lines = pushOrConcat(lines, splitNewlines(beforeTitle));
        lines = pushOrConcat(lines, splitNewlines(title));
        lines = pushOrConcat(lines, splitNewlines(afterTitle));
        return lines;
      }
      getBeforeBody(tooltipItems, options) {
        return getBeforeAfterBodyLines(options.callbacks.beforeBody.apply(this, [tooltipItems]));
      }
      getBody(tooltipItems, options) {
        const me = this;
        const {callbacks} = options;
        const bodyItems = [];
        each(tooltipItems, (context) => {
          const bodyItem = {
            before: [],
            lines: [],
            after: []
          };
          const scoped = overrideCallbacks(callbacks, context);
          pushOrConcat(bodyItem.before, splitNewlines(scoped.beforeLabel.call(me, context)));
          pushOrConcat(bodyItem.lines, scoped.label.call(me, context));
          pushOrConcat(bodyItem.after, splitNewlines(scoped.afterLabel.call(me, context)));
          bodyItems.push(bodyItem);
        });
        return bodyItems;
      }
      getAfterBody(tooltipItems, options) {
        return getBeforeAfterBodyLines(options.callbacks.afterBody.apply(this, [tooltipItems]));
      }
      getFooter(tooltipItems, options) {
        const me = this;
        const {callbacks} = options;
        const beforeFooter = callbacks.beforeFooter.apply(me, [tooltipItems]);
        const footer = callbacks.footer.apply(me, [tooltipItems]);
        const afterFooter = callbacks.afterFooter.apply(me, [tooltipItems]);
        let lines = [];
        lines = pushOrConcat(lines, splitNewlines(beforeFooter));
        lines = pushOrConcat(lines, splitNewlines(footer));
        lines = pushOrConcat(lines, splitNewlines(afterFooter));
        return lines;
      }
      _createItems(options) {
        const me = this;
        const active = me._active;
        const data = me._chart.data;
        const labelColors = [];
        const labelPointStyles = [];
        const labelTextColors = [];
        let tooltipItems = [];
        let i, len;
        for (i = 0, len = active.length; i < len; ++i) {
          tooltipItems.push(createTooltipItem(me._chart, active[i]));
        }
        if (options.filter) {
          tooltipItems = tooltipItems.filter((element, index, array) => options.filter(element, index, array, data));
        }
        if (options.itemSort) {
          tooltipItems = tooltipItems.sort((a, b) => options.itemSort(a, b, data));
        }
        each(tooltipItems, (context) => {
          const scoped = overrideCallbacks(options.callbacks, context);
          labelColors.push(scoped.labelColor.call(me, context));
          labelPointStyles.push(scoped.labelPointStyle.call(me, context));
          labelTextColors.push(scoped.labelTextColor.call(me, context));
        });
        me.labelColors = labelColors;
        me.labelPointStyles = labelPointStyles;
        me.labelTextColors = labelTextColors;
        me.dataPoints = tooltipItems;
        return tooltipItems;
      }
      update(changed, replay) {
        const me = this;
        const options = me.options.setContext(me.getContext());
        const active = me._active;
        let properties;
        let tooltipItems = [];
        if (!active.length) {
          if (me.opacity !== 0) {
            properties = {
              opacity: 0
            };
          }
        } else {
          const position = positioners[options.position].call(me, active, me._eventPosition);
          tooltipItems = me._createItems(options);
          me.title = me.getTitle(tooltipItems, options);
          me.beforeBody = me.getBeforeBody(tooltipItems, options);
          me.body = me.getBody(tooltipItems, options);
          me.afterBody = me.getAfterBody(tooltipItems, options);
          me.footer = me.getFooter(tooltipItems, options);
          const size = me._size = getTooltipSize(me, options);
          const positionAndSize = Object.assign({}, position, size);
          const alignment = determineAlignment(me._chart, options, positionAndSize);
          const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, me._chart);
          me.xAlign = alignment.xAlign;
          me.yAlign = alignment.yAlign;
          properties = {
            opacity: 1,
            x: backgroundPoint.x,
            y: backgroundPoint.y,
            width: size.width,
            height: size.height,
            caretX: position.x,
            caretY: position.y
          };
        }
        me._tooltipItems = tooltipItems;
        me.$context = undefined;
        if (properties) {
          me._resolveAnimations().update(me, properties);
        }
        if (changed && options.external) {
          options.external.call(me, {chart: me._chart, tooltip: me, replay});
        }
      }
      drawCaret(tooltipPoint, ctx, size, options) {
        const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
        ctx.lineTo(caretPosition.x1, caretPosition.y1);
        ctx.lineTo(caretPosition.x2, caretPosition.y2);
        ctx.lineTo(caretPosition.x3, caretPosition.y3);
      }
      getCaretPosition(tooltipPoint, size, options) {
        const {xAlign, yAlign} = this;
        const {cornerRadius, caretSize} = options;
        const {x: ptX, y: ptY} = tooltipPoint;
        const {width, height} = size;
        let x1, x2, x3, y1, y2, y3;
        if (yAlign === 'center') {
          y2 = ptY + (height / 2);
          if (xAlign === 'left') {
            x1 = ptX;
            x2 = x1 - caretSize;
            y1 = y2 + caretSize;
            y3 = y2 - caretSize;
          } else {
            x1 = ptX + width;
            x2 = x1 + caretSize;
            y1 = y2 - caretSize;
            y3 = y2 + caretSize;
          }
          x3 = x1;
        } else {
          if (xAlign === 'left') {
            x2 = ptX + cornerRadius + (caretSize);
          } else if (xAlign === 'right') {
            x2 = ptX + width - cornerRadius - caretSize;
          } else {
            x2 = this.caretX;
          }
          if (yAlign === 'top') {
            y1 = ptY;
            y2 = y1 - caretSize;
            x1 = x2 - caretSize;
            x3 = x2 + caretSize;
          } else {
            y1 = ptY + height;
            y2 = y1 + caretSize;
            x1 = x2 + caretSize;
            x3 = x2 - caretSize;
          }
          y3 = y1;
        }
        return {x1, x2, x3, y1, y2, y3};
      }
      drawTitle(pt, ctx, options) {
        const me = this;
        const title = me.title;
        const length = title.length;
        let titleFont, titleSpacing, i;
        if (length) {
          const rtlHelper = getRtlAdapter(options.rtl, me.x, me.width);
          pt.x = getAlignedX(me, options.titleAlign, options);
          ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
          ctx.textBaseline = 'middle';
          titleFont = toFont(options.titleFont);
          titleSpacing = options.titleSpacing;
          ctx.fillStyle = options.titleColor;
          ctx.font = titleFont.string;
          for (i = 0; i < length; ++i) {
            ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
            pt.y += titleFont.lineHeight + titleSpacing;
            if (i + 1 === length) {
              pt.y += options.titleMarginBottom - titleSpacing;
            }
          }
        }
      }
      _drawColorBox(ctx, pt, i, rtlHelper, options) {
        const me = this;
        const labelColors = me.labelColors[i];
        const labelPointStyle = me.labelPointStyles[i];
        const {boxHeight, boxWidth} = options;
        const bodyFont = toFont(options.bodyFont);
        const colorX = getAlignedX(me, 'left', options);
        const rtlColorX = rtlHelper.x(colorX);
        const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
        const colorY = pt.y + yOffSet;
        if (options.usePointStyle) {
          const drawOptions = {
            radius: Math.min(boxWidth, boxHeight) / 2,
            pointStyle: labelPointStyle.pointStyle,
            rotation: labelPointStyle.rotation,
            borderWidth: 1
          };
          const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
          const centerY = colorY + boxHeight / 2;
          ctx.strokeStyle = options.multiKeyBackground;
          ctx.fillStyle = options.multiKeyBackground;
          drawPoint(ctx, drawOptions, centerX, centerY);
          ctx.strokeStyle = labelColors.borderColor;
          ctx.fillStyle = labelColors.backgroundColor;
          drawPoint(ctx, drawOptions, centerX, centerY);
        } else {
          ctx.lineWidth = labelColors.borderWidth || 1;
          ctx.strokeStyle = labelColors.borderColor;
          ctx.setLineDash(labelColors.borderDash || []);
          ctx.lineDashOffset = labelColors.borderDashOffset || 0;
          const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth);
          const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - 2);
          const borderRadius = toTRBLCorners(labelColors.borderRadius);
          if (Object.values(borderRadius).some(v => v !== 0)) {
            ctx.beginPath();
            ctx.fillStyle = options.multiKeyBackground;
            addRoundedRectPath(ctx, {
              x: outerX,
              y: colorY,
              w: boxWidth,
              h: boxHeight,
              radius: borderRadius,
            });
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = labelColors.backgroundColor;
            ctx.beginPath();
            addRoundedRectPath(ctx, {
              x: innerX,
              y: colorY + 1,
              w: boxWidth - 2,
              h: boxHeight - 2,
              radius: borderRadius,
            });
            ctx.fill();
          } else {
            ctx.fillStyle = options.multiKeyBackground;
            ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
            ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
            ctx.fillStyle = labelColors.backgroundColor;
            ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
          }
        }
        ctx.fillStyle = me.labelTextColors[i];
      }
      drawBody(pt, ctx, options) {
        const me = this;
        const {body} = me;
        const {bodySpacing, bodyAlign, displayColors, boxHeight, boxWidth} = options;
        const bodyFont = toFont(options.bodyFont);
        let bodyLineHeight = bodyFont.lineHeight;
        let xLinePadding = 0;
        const rtlHelper = getRtlAdapter(options.rtl, me.x, me.width);
        const fillLineOfText = function(line) {
          ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
          pt.y += bodyLineHeight + bodySpacing;
        };
        const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
        let bodyItem, textColor, lines, i, j, ilen, jlen;
        ctx.textAlign = bodyAlign;
        ctx.textBaseline = 'middle';
        ctx.font = bodyFont.string;
        pt.x = getAlignedX(me, bodyAlignForCalculation, options);
        ctx.fillStyle = options.bodyColor;
        each(me.beforeBody, fillLineOfText);
        xLinePadding = displayColors && bodyAlignForCalculation !== 'right'
          ? bodyAlign === 'center' ? (boxWidth / 2 + 1) : (boxWidth + 2)
          : 0;
        for (i = 0, ilen = body.length; i < ilen; ++i) {
          bodyItem = body[i];
          textColor = me.labelTextColors[i];
          ctx.fillStyle = textColor;
          each(bodyItem.before, fillLineOfText);
          lines = bodyItem.lines;
          if (displayColors && lines.length) {
            me._drawColorBox(ctx, pt, i, rtlHelper, options);
            bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
          }
          for (j = 0, jlen = lines.length; j < jlen; ++j) {
            fillLineOfText(lines[j]);
            bodyLineHeight = bodyFont.lineHeight;
          }
          each(bodyItem.after, fillLineOfText);
        }
        xLinePadding = 0;
        bodyLineHeight = bodyFont.lineHeight;
        each(me.afterBody, fillLineOfText);
        pt.y -= bodySpacing;
      }
      drawFooter(pt, ctx, options) {
        const me = this;
        const footer = me.footer;
        const length = footer.length;
        let footerFont, i;
        if (length) {
          const rtlHelper = getRtlAdapter(options.rtl, me.x, me.width);
          pt.x = getAlignedX(me, options.footerAlign, options);
          pt.y += options.footerMarginTop;
          ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
          ctx.textBaseline = 'middle';
          footerFont = toFont(options.footerFont);
          ctx.fillStyle = options.footerColor;
          ctx.font = footerFont.string;
          for (i = 0; i < length; ++i) {
            ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
            pt.y += footerFont.lineHeight + options.footerSpacing;
          }
        }
      }
      drawBackground(pt, ctx, tooltipSize, options) {
        const {xAlign, yAlign} = this;
        const {x, y} = pt;
        const {width, height} = tooltipSize;
        const radius = options.cornerRadius;
        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        if (yAlign === 'top') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        if (yAlign === 'center' && xAlign === 'right') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        if (yAlign === 'bottom') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        if (yAlign === 'center' && xAlign === 'left') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        if (options.borderWidth > 0) {
          ctx.stroke();
        }
      }
      _updateAnimationTarget(options) {
        const me = this;
        const chart = me._chart;
        const anims = me.$animations;
        const animX = anims && anims.x;
        const animY = anims && anims.y;
        if (animX || animY) {
          const position = positioners[options.position].call(me, me._active, me._eventPosition);
          if (!position) {
            return;
          }
          const size = me._size = getTooltipSize(me, options);
          const positionAndSize = Object.assign({}, position, me._size);
          const alignment = determineAlignment(chart, options, positionAndSize);
          const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
          if (animX._to !== point.x || animY._to !== point.y) {
            me.xAlign = alignment.xAlign;
            me.yAlign = alignment.yAlign;
            me.width = size.width;
            me.height = size.height;
            me.caretX = position.x;
            me.caretY = position.y;
            me._resolveAnimations().update(me, point);
          }
        }
      }
      draw(ctx) {
        const me = this;
        const options = me.options.setContext(me.getContext());
        let opacity = me.opacity;
        if (!opacity) {
          return;
        }
        me._updateAnimationTarget(options);
        const tooltipSize = {
          width: me.width,
          height: me.height
        };
        const pt = {
          x: me.x,
          y: me.y
        };
        opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
        const padding = toPadding(options.padding);
        const hasTooltipContent = me.title.length || me.beforeBody.length || me.body.length || me.afterBody.length || me.footer.length;
        if (options.enabled && hasTooltipContent) {
          ctx.save();
          ctx.globalAlpha = opacity;
          me.drawBackground(pt, ctx, tooltipSize, options);
          overrideTextDirection(ctx, options.textDirection);
          pt.y += padding.top;
          me.drawTitle(pt, ctx, options);
          me.drawBody(pt, ctx, options);
          me.drawFooter(pt, ctx, options);
          restoreTextDirection(ctx, options.textDirection);
          ctx.restore();
        }
      }
      getActiveElements() {
        return this._active || [];
      }
      setActiveElements(activeElements, eventPosition) {
        const me = this;
        const lastActive = me._active;
        const active = activeElements.map(({datasetIndex, index}) => {
          const meta = me._chart.getDatasetMeta(datasetIndex);
          if (!meta) {
            throw new Error('Cannot find a dataset at index ' + datasetIndex);
          }
          return {
            datasetIndex,
            element: meta.data[index],
            index,
          };
        });
        const changed = !_elementsEqual(lastActive, active);
        const positionChanged = me._positionChanged(active, eventPosition);
        if (changed || positionChanged) {
          me._active = active;
          me._eventPosition = eventPosition;
          me.update(true);
        }
      }
      handleEvent(e, replay) {
        const me = this;
        const options = me.options;
        const lastActive = me._active || [];
        let changed = false;
        let active = [];
        if (e.type !== 'mouseout') {
          active = me._chart.getElementsAtEventForMode(e, options.mode, options, replay);
          if (options.reverse) {
            active.reverse();
          }
        }
        const positionChanged = me._positionChanged(active, e);
        changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
        if (changed) {
          me._active = active;
          if (options.enabled || options.external) {
            me._eventPosition = {
              x: e.x,
              y: e.y
            };
            me.update(true, replay);
          }
        }
        return changed;
      }
      _positionChanged(active, e) {
        const {caretX, caretY, options} = this;
        const position = positioners[options.position].call(this, active, e);
        return position !== false && (caretX !== position.x || caretY !== position.y);
      }
    }
    Tooltip.positioners = positioners;
    var plugin_tooltip = {
      id: 'tooltip',
      _element: Tooltip,
      positioners,
      afterInit(chart, _args, options) {
        if (options) {
          chart.tooltip = new Tooltip({_chart: chart, options});
        }
      },
      beforeUpdate(chart, _args, options) {
        if (chart.tooltip) {
          chart.tooltip.initialize(options);
        }
      },
      reset(chart, _args, options) {
        if (chart.tooltip) {
          chart.tooltip.initialize(options);
        }
      },
      afterDraw(chart) {
        const tooltip = chart.tooltip;
        const args = {
          tooltip
        };
        if (chart.notifyPlugins('beforeTooltipDraw', args) === false) {
          return;
        }
        if (tooltip) {
          tooltip.draw(chart.ctx);
        }
        chart.notifyPlugins('afterTooltipDraw', args);
      },
      afterEvent(chart, args) {
        if (chart.tooltip) {
          const useFinalPosition = args.replay;
          if (chart.tooltip.handleEvent(args.event, useFinalPosition)) {
            args.changed = true;
          }
        }
      },
      defaults: {
        enabled: true,
        external: null,
        position: 'average',
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        titleFont: {
          weight: 'bold',
        },
        titleSpacing: 2,
        titleMarginBottom: 6,
        titleAlign: 'left',
        bodyColor: '#fff',
        bodySpacing: 2,
        bodyFont: {
        },
        bodyAlign: 'left',
        footerColor: '#fff',
        footerSpacing: 2,
        footerMarginTop: 6,
        footerFont: {
          weight: 'bold',
        },
        footerAlign: 'left',
        padding: 6,
        caretPadding: 2,
        caretSize: 5,
        cornerRadius: 6,
        boxHeight: (ctx, opts) => opts.bodyFont.size,
        boxWidth: (ctx, opts) => opts.bodyFont.size,
        multiKeyBackground: '#fff',
        displayColors: true,
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 0,
        animation: {
          duration: 400,
          easing: 'easeOutQuart',
        },
        animations: {
          numbers: {
            type: 'number',
            properties: ['x', 'y', 'width', 'height', 'caretX', 'caretY'],
          },
          opacity: {
            easing: 'linear',
            duration: 200
          }
        },
        callbacks: {
          beforeTitle: noop,
          title(tooltipItems) {
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              const labels = item.chart.data.labels;
              const labelCount = labels ? labels.length : 0;
              if (this && this.options && this.options.mode === 'dataset') {
                return item.dataset.label || '';
              } else if (item.label) {
                return item.label;
              } else if (labelCount > 0 && item.dataIndex < labelCount) {
                return labels[item.dataIndex];
              }
            }
            return '';
          },
          afterTitle: noop,
          beforeBody: noop,
          beforeLabel: noop,
          label(tooltipItem) {
            if (this && this.options && this.options.mode === 'dataset') {
              return tooltipItem.label + ': ' + tooltipItem.formattedValue || tooltipItem.formattedValue;
            }
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = tooltipItem.formattedValue;
            if (!isNullOrUndef(value)) {
              label += value;
            }
            return label;
          },
          labelColor(tooltipItem) {
            const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
            const options = meta.controller.getStyle(tooltipItem.dataIndex);
            return {
              borderColor: options.borderColor,
              backgroundColor: options.backgroundColor,
              borderWidth: options.borderWidth,
              borderDash: options.borderDash,
              borderDashOffset: options.borderDashOffset,
              borderRadius: 0,
            };
          },
          labelTextColor() {
            return this.options.bodyColor;
          },
          labelPointStyle(tooltipItem) {
            const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
            const options = meta.controller.getStyle(tooltipItem.dataIndex);
            return {
              pointStyle: options.pointStyle,
              rotation: options.rotation,
            };
          },
          afterLabel: noop,
          afterBody: noop,
          beforeFooter: noop,
          footer: noop,
          afterFooter: noop
        }
      },
      defaultRoutes: {
        bodyFont: 'font',
        footerFont: 'font',
        titleFont: 'font'
      },
      descriptors: {
        _scriptable: (name) => name !== 'filter' && name !== 'itemSort' && name !== 'external',
        _indexable: false,
        callbacks: {
          _scriptable: false,
          _indexable: false,
        },
        animation: {
          _fallback: false
        },
        animations: {
          _fallback: 'animation'
        }
      },
      additionalOptionScopes: ['interaction']
    };

    var plugins = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Decimation: plugin_decimation,
    Filler: plugin_filler,
    Legend: plugin_legend,
    Title: plugin_title,
    Tooltip: plugin_tooltip
    });

    const addIfString = (labels, raw, index) => typeof raw === 'string'
      ? labels.push(raw) - 1
      : isNaN(raw) ? null : index;
    function findOrAddLabel(labels, raw, index) {
      const first = labels.indexOf(raw);
      if (first === -1) {
        return addIfString(labels, raw, index);
      }
      const last = labels.lastIndexOf(raw);
      return first !== last ? index : first;
    }
    const validIndex = (index, max) => index === null ? null : _limitValue(Math.round(index), 0, max);
    class CategoryScale extends Scale {
      constructor(cfg) {
        super(cfg);
        this._startValue = undefined;
        this._valueRange = 0;
      }
      parse(raw, index) {
        if (isNullOrUndef(raw)) {
          return null;
        }
        const labels = this.getLabels();
        index = isFinite(index) && labels[index] === raw ? index
          : findOrAddLabel(labels, raw, valueOrDefault(index, raw));
        return validIndex(index, labels.length - 1);
      }
      determineDataLimits() {
        const me = this;
        const {minDefined, maxDefined} = me.getUserBounds();
        let {min, max} = me.getMinMax(true);
        if (me.options.bounds === 'ticks') {
          if (!minDefined) {
            min = 0;
          }
          if (!maxDefined) {
            max = me.getLabels().length - 1;
          }
        }
        me.min = min;
        me.max = max;
      }
      buildTicks() {
        const me = this;
        const min = me.min;
        const max = me.max;
        const offset = me.options.offset;
        const ticks = [];
        let labels = me.getLabels();
        labels = (min === 0 && max === labels.length - 1) ? labels : labels.slice(min, max + 1);
        me._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
        me._startValue = me.min - (offset ? 0.5 : 0);
        for (let value = min; value <= max; value++) {
          ticks.push({value});
        }
        return ticks;
      }
      getLabelForValue(value) {
        const me = this;
        const labels = me.getLabels();
        if (value >= 0 && value < labels.length) {
          return labels[value];
        }
        return value;
      }
      configure() {
        const me = this;
        super.configure();
        if (!me.isHorizontal()) {
          me._reversePixels = !me._reversePixels;
        }
      }
      getPixelForValue(value) {
        const me = this;
        if (typeof value !== 'number') {
          value = me.parse(value);
        }
        return value === null ? NaN : me.getPixelForDecimal((value - me._startValue) / me._valueRange);
      }
      getPixelForTick(index) {
        const me = this;
        const ticks = me.ticks;
        if (index < 0 || index > ticks.length - 1) {
          return null;
        }
        return me.getPixelForValue(ticks[index].value);
      }
      getValueForPixel(pixel) {
        const me = this;
        return Math.round(me._startValue + me.getDecimalForPixel(pixel) * me._valueRange);
      }
      getBasePixel() {
        return this.bottom;
      }
    }
    CategoryScale.id = 'category';
    CategoryScale.defaults = {
      ticks: {
        callback: CategoryScale.prototype.getLabelForValue
      }
    };

    function generateTicks$1(generationOptions, dataRange) {
      const ticks = [];
      const MIN_SPACING = 1e-14;
      const {step, min, max, precision, count, maxTicks} = generationOptions;
      const unit = step || 1;
      const maxSpaces = maxTicks - 1;
      const {min: rmin, max: rmax} = dataRange;
      const minDefined = !isNullOrUndef(min);
      const maxDefined = !isNullOrUndef(max);
      const countDefined = !isNullOrUndef(count);
      let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
      let factor, niceMin, niceMax, numSpaces;
      if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
        return [{value: rmin}, {value: rmax}];
      }
      numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
      if (numSpaces > maxSpaces) {
        spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
      }
      if (!isNullOrUndef(precision)) {
        factor = Math.pow(10, precision);
        spacing = Math.ceil(spacing * factor) / factor;
      }
      niceMin = Math.floor(rmin / spacing) * spacing;
      niceMax = Math.ceil(rmax / spacing) * spacing;
      if (minDefined && maxDefined && step && almostWhole((max - min) / step, spacing / 1000)) {
        numSpaces = Math.min((max - min) / spacing, maxTicks);
        spacing = (max - min) / numSpaces;
        niceMin = min;
        niceMax = max;
      } else if (countDefined) {
        niceMin = minDefined ? min : niceMin;
        niceMax = maxDefined ? max : niceMax;
        numSpaces = count - 1;
        spacing = (niceMax - niceMin) / numSpaces;
      } else {
        numSpaces = (niceMax - niceMin) / spacing;
        if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1000)) {
          numSpaces = Math.round(numSpaces);
        } else {
          numSpaces = Math.ceil(numSpaces);
        }
      }
      factor = Math.pow(10, isNullOrUndef(precision) ? _decimalPlaces(spacing) : precision);
      niceMin = Math.round(niceMin * factor) / factor;
      niceMax = Math.round(niceMax * factor) / factor;
      let j = 0;
      if (minDefined) {
        ticks.push({value: min});
        if (niceMin <= min) {
          j++;
        }
        if (almostEquals(Math.round((niceMin + j * spacing) * factor) / factor, min, spacing / 10)) {
          j++;
        }
      }
      for (; j < numSpaces; ++j) {
        ticks.push({value: Math.round((niceMin + j * spacing) * factor) / factor});
      }
      if (maxDefined) {
        if (almostEquals(ticks[ticks.length - 1].value, max, spacing / 10)) {
          ticks[ticks.length - 1].value = max;
        } else {
          ticks.push({value: max});
        }
      } else {
        ticks.push({value: niceMax});
      }
      return ticks;
    }
    class LinearScaleBase extends Scale {
      constructor(cfg) {
        super(cfg);
        this.start = undefined;
        this.end = undefined;
        this._startValue = undefined;
        this._endValue = undefined;
        this._valueRange = 0;
      }
      parse(raw, index) {
        if (isNullOrUndef(raw)) {
          return null;
        }
        if ((typeof raw === 'number' || raw instanceof Number) && !isFinite(+raw)) {
          return null;
        }
        return +raw;
      }
      handleTickRangeOptions() {
        const me = this;
        const {beginAtZero, stacked} = me.options;
        const {minDefined, maxDefined} = me.getUserBounds();
        let {min, max} = me;
        const setMin = v => (min = minDefined ? min : v);
        const setMax = v => (max = maxDefined ? max : v);
        if (beginAtZero || stacked) {
          const minSign = sign(min);
          const maxSign = sign(max);
          if (minSign < 0 && maxSign < 0) {
            setMax(0);
          } else if (minSign > 0 && maxSign > 0) {
            setMin(0);
          }
        }
        if (min === max) {
          setMax(max + 1);
          if (!beginAtZero) {
            setMin(min - 1);
          }
        }
        me.min = min;
        me.max = max;
      }
      getTickLimit() {
        const me = this;
        const tickOpts = me.options.ticks;
        let {maxTicksLimit, stepSize} = tickOpts;
        let maxTicks;
        if (stepSize) {
          maxTicks = Math.ceil(me.max / stepSize) - Math.floor(me.min / stepSize) + 1;
        } else {
          maxTicks = me.computeTickLimit();
          maxTicksLimit = maxTicksLimit || 11;
        }
        if (maxTicksLimit) {
          maxTicks = Math.min(maxTicksLimit, maxTicks);
        }
        return maxTicks;
      }
      computeTickLimit() {
        return Number.POSITIVE_INFINITY;
      }
      buildTicks() {
        const me = this;
        const opts = me.options;
        const tickOpts = opts.ticks;
        let maxTicks = me.getTickLimit();
        maxTicks = Math.max(2, maxTicks);
        const numericGeneratorOptions = {
          maxTicks,
          min: opts.min,
          max: opts.max,
          precision: tickOpts.precision,
          step: tickOpts.stepSize,
          count: tickOpts.count,
        };
        const dataRange = me._range || me;
        const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
        if (opts.bounds === 'ticks') {
          _setMinAndMaxByKey(ticks, me, 'value');
        }
        if (opts.reverse) {
          ticks.reverse();
          me.start = me.max;
          me.end = me.min;
        } else {
          me.start = me.min;
          me.end = me.max;
        }
        return ticks;
      }
      configure() {
        const me = this;
        const ticks = me.ticks;
        let start = me.min;
        let end = me.max;
        super.configure();
        if (me.options.offset && ticks.length) {
          const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
          start -= offset;
          end += offset;
        }
        me._startValue = start;
        me._endValue = end;
        me._valueRange = end - start;
      }
      getLabelForValue(value) {
        return formatNumber(value, this.chart.options.locale);
      }
    }

    class LinearScale extends LinearScaleBase {
      determineDataLimits() {
        const me = this;
        const {min, max} = me.getMinMax(true);
        me.min = isNumberFinite(min) ? min : 0;
        me.max = isNumberFinite(max) ? max : 1;
        me.handleTickRangeOptions();
      }
      computeTickLimit() {
        const me = this;
        if (me.isHorizontal()) {
          return Math.ceil(me.width / 40);
        }
        const tickFont = me._resolveTickFontOptions(0);
        return Math.ceil(me.height / tickFont.lineHeight);
      }
      getPixelForValue(value) {
        return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
        return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
      }
    }
    LinearScale.id = 'linear';
    LinearScale.defaults = {
      ticks: {
        callback: Ticks.formatters.numeric
      }
    };

    function isMajor(tickVal) {
      const remain = tickVal / (Math.pow(10, Math.floor(log10(tickVal))));
      return remain === 1;
    }
    function generateTicks(generationOptions, dataRange) {
      const endExp = Math.floor(log10(dataRange.max));
      const endSignificand = Math.ceil(dataRange.max / Math.pow(10, endExp));
      const ticks = [];
      let tickVal = finiteOrDefault(generationOptions.min, Math.pow(10, Math.floor(log10(dataRange.min))));
      let exp = Math.floor(log10(tickVal));
      let significand = Math.floor(tickVal / Math.pow(10, exp));
      let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
      do {
        ticks.push({value: tickVal, major: isMajor(tickVal)});
        ++significand;
        if (significand === 10) {
          significand = 1;
          ++exp;
          precision = exp >= 0 ? 1 : precision;
        }
        tickVal = Math.round(significand * Math.pow(10, exp) * precision) / precision;
      } while (exp < endExp || (exp === endExp && significand < endSignificand));
      const lastTick = finiteOrDefault(generationOptions.max, tickVal);
      ticks.push({value: lastTick, major: isMajor(tickVal)});
      return ticks;
    }
    class LogarithmicScale extends Scale {
      constructor(cfg) {
        super(cfg);
        this.start = undefined;
        this.end = undefined;
        this._startValue = undefined;
        this._valueRange = 0;
      }
      parse(raw, index) {
        const value = LinearScaleBase.prototype.parse.apply(this, [raw, index]);
        if (value === 0) {
          this._zero = true;
          return undefined;
        }
        return isNumberFinite(value) && value > 0 ? value : null;
      }
      determineDataLimits() {
        const me = this;
        const {min, max} = me.getMinMax(true);
        me.min = isNumberFinite(min) ? Math.max(0, min) : null;
        me.max = isNumberFinite(max) ? Math.max(0, max) : null;
        if (me.options.beginAtZero) {
          me._zero = true;
        }
        me.handleTickRangeOptions();
      }
      handleTickRangeOptions() {
        const me = this;
        const {minDefined, maxDefined} = me.getUserBounds();
        let min = me.min;
        let max = me.max;
        const setMin = v => (min = minDefined ? min : v);
        const setMax = v => (max = maxDefined ? max : v);
        const exp = (v, m) => Math.pow(10, Math.floor(log10(v)) + m);
        if (min === max) {
          if (min <= 0) {
            setMin(1);
            setMax(10);
          } else {
            setMin(exp(min, -1));
            setMax(exp(max, +1));
          }
        }
        if (min <= 0) {
          setMin(exp(max, -1));
        }
        if (max <= 0) {
          setMax(exp(min, +1));
        }
        if (me._zero && me.min !== me._suggestedMin && min === exp(me.min, 0)) {
          setMin(exp(min, -1));
        }
        me.min = min;
        me.max = max;
      }
      buildTicks() {
        const me = this;
        const opts = me.options;
        const generationOptions = {
          min: me._userMin,
          max: me._userMax
        };
        const ticks = generateTicks(generationOptions, me);
        if (opts.bounds === 'ticks') {
          _setMinAndMaxByKey(ticks, me, 'value');
        }
        if (opts.reverse) {
          ticks.reverse();
          me.start = me.max;
          me.end = me.min;
        } else {
          me.start = me.min;
          me.end = me.max;
        }
        return ticks;
      }
      getLabelForValue(value) {
        return value === undefined ? '0' : formatNumber(value, this.chart.options.locale);
      }
      configure() {
        const me = this;
        const start = me.min;
        super.configure();
        me._startValue = log10(start);
        me._valueRange = log10(me.max) - log10(start);
      }
      getPixelForValue(value) {
        const me = this;
        if (value === undefined || value === 0) {
          value = me.min;
        }
        if (value === null || isNaN(value)) {
          return NaN;
        }
        return me.getPixelForDecimal(value === me.min
          ? 0
          : (log10(value) - me._startValue) / me._valueRange);
      }
      getValueForPixel(pixel) {
        const me = this;
        const decimal = me.getDecimalForPixel(pixel);
        return Math.pow(10, me._startValue + decimal * me._valueRange);
      }
    }
    LogarithmicScale.id = 'logarithmic';
    LogarithmicScale.defaults = {
      ticks: {
        callback: Ticks.formatters.logarithmic,
        major: {
          enabled: true
        }
      }
    };

    function getTickBackdropHeight(opts) {
      const tickOpts = opts.ticks;
      if (tickOpts.display && opts.display) {
        const padding = toPadding(tickOpts.backdropPadding);
        return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding.height;
      }
      return 0;
    }
    function measureLabelSize(ctx, lineHeight, label) {
      if (isArray(label)) {
        return {
          w: _longestText(ctx, ctx.font, label),
          h: label.length * lineHeight
        };
      }
      return {
        w: ctx.measureText(label).width,
        h: lineHeight
      };
    }
    function determineLimits(angle, pos, size, min, max) {
      if (angle === min || angle === max) {
        return {
          start: pos - (size / 2),
          end: pos + (size / 2)
        };
      } else if (angle < min || angle > max) {
        return {
          start: pos - size,
          end: pos
        };
      }
      return {
        start: pos,
        end: pos + size
      };
    }
    function fitWithPointLabels(scale) {
      const furthestLimits = {
        l: 0,
        r: scale.width,
        t: 0,
        b: scale.height - scale.paddingTop
      };
      const furthestAngles = {};
      let i, textSize, pointPosition;
      const labelSizes = [];
      const padding = [];
      const valueCount = scale.getLabels().length;
      for (i = 0; i < valueCount; i++) {
        const opts = scale.options.pointLabels.setContext(scale.getContext(i));
        padding[i] = opts.padding;
        pointPosition = scale.getPointPosition(i, scale.drawingArea + padding[i]);
        const plFont = toFont(opts.font);
        scale.ctx.font = plFont.string;
        textSize = measureLabelSize(scale.ctx, plFont.lineHeight, scale._pointLabels[i]);
        labelSizes[i] = textSize;
        const angleRadians = scale.getIndexAngle(i);
        const angle = toDegrees(angleRadians);
        const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
        const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
        if (hLimits.start < furthestLimits.l) {
          furthestLimits.l = hLimits.start;
          furthestAngles.l = angleRadians;
        }
        if (hLimits.end > furthestLimits.r) {
          furthestLimits.r = hLimits.end;
          furthestAngles.r = angleRadians;
        }
        if (vLimits.start < furthestLimits.t) {
          furthestLimits.t = vLimits.start;
          furthestAngles.t = angleRadians;
        }
        if (vLimits.end > furthestLimits.b) {
          furthestLimits.b = vLimits.end;
          furthestAngles.b = angleRadians;
        }
      }
      scale._setReductions(scale.drawingArea, furthestLimits, furthestAngles);
      scale._pointLabelItems = [];
      const opts = scale.options;
      const tickBackdropHeight = getTickBackdropHeight(opts);
      const outerDistance = scale.getDistanceFromCenterForValue(opts.ticks.reverse ? scale.min : scale.max);
      for (i = 0; i < valueCount; i++) {
        const extra = (i === 0 ? tickBackdropHeight / 2 : 0);
        const pointLabelPosition = scale.getPointPosition(i, outerDistance + extra + padding[i]);
        const angle = toDegrees(scale.getIndexAngle(i));
        const size = labelSizes[i];
        adjustPointPositionForLabelHeight(angle, size, pointLabelPosition);
        const textAlign = getTextAlignForAngle(angle);
        let left;
        if (textAlign === 'left') {
          left = pointLabelPosition.x;
        } else if (textAlign === 'center') {
          left = pointLabelPosition.x - (size.w / 2);
        } else {
          left = pointLabelPosition.x - size.w;
        }
        const right = left + size.w;
        scale._pointLabelItems[i] = {
          x: pointLabelPosition.x,
          y: pointLabelPosition.y,
          textAlign,
          left,
          top: pointLabelPosition.y,
          right,
          bottom: pointLabelPosition.y + size.h,
        };
      }
    }
    function getTextAlignForAngle(angle) {
      if (angle === 0 || angle === 180) {
        return 'center';
      } else if (angle < 180) {
        return 'left';
      }
      return 'right';
    }
    function adjustPointPositionForLabelHeight(angle, textSize, position) {
      if (angle === 90 || angle === 270) {
        position.y -= (textSize.h / 2);
      } else if (angle > 270 || angle < 90) {
        position.y -= textSize.h;
      }
    }
    function drawPointLabels(scale, labelCount) {
      const {ctx, options: {pointLabels}} = scale;
      for (let i = labelCount - 1; i >= 0; i--) {
        const optsAtIndex = pointLabels.setContext(scale.getContext(i));
        const plFont = toFont(optsAtIndex.font);
        const {x, y, textAlign, left, top, right, bottom} = scale._pointLabelItems[i];
        const {backdropColor} = optsAtIndex;
        if (!isNullOrUndef(backdropColor)) {
          const padding = toPadding(optsAtIndex.backdropPadding);
          ctx.fillStyle = backdropColor;
          ctx.fillRect(left - padding.left, top - padding.top, right - left + padding.width, bottom - top + padding.height);
        }
        renderText(
          ctx,
          scale._pointLabels[i],
          x,
          y + (plFont.lineHeight / 2),
          plFont,
          {
            color: optsAtIndex.color,
            textAlign: textAlign,
            textBaseline: 'middle'
          }
        );
      }
    }
    function pathRadiusLine(scale, radius, circular, labelCount) {
      const {ctx} = scale;
      if (circular) {
        ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
      } else {
        let pointPosition = scale.getPointPosition(0, radius);
        ctx.moveTo(pointPosition.x, pointPosition.y);
        for (let i = 1; i < labelCount; i++) {
          pointPosition = scale.getPointPosition(i, radius);
          ctx.lineTo(pointPosition.x, pointPosition.y);
        }
      }
    }
    function drawRadiusLine(scale, gridLineOpts, radius, labelCount) {
      const ctx = scale.ctx;
      const circular = gridLineOpts.circular;
      const {color, lineWidth} = gridLineOpts;
      if ((!circular && !labelCount) || !color || !lineWidth || radius < 0) {
        return;
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(gridLineOpts.borderDash);
      ctx.lineDashOffset = gridLineOpts.borderDashOffset;
      ctx.beginPath();
      pathRadiusLine(scale, radius, circular, labelCount);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    function numberOrZero(param) {
      return isNumber(param) ? param : 0;
    }
    class RadialLinearScale extends LinearScaleBase {
      constructor(cfg) {
        super(cfg);
        this.xCenter = undefined;
        this.yCenter = undefined;
        this.drawingArea = undefined;
        this._pointLabels = [];
        this._pointLabelItems = [];
      }
      setDimensions() {
        const me = this;
        me.width = me.maxWidth;
        me.height = me.maxHeight;
        me.paddingTop = getTickBackdropHeight(me.options) / 2;
        me.xCenter = Math.floor(me.width / 2);
        me.yCenter = Math.floor((me.height - me.paddingTop) / 2);
        me.drawingArea = Math.min(me.height - me.paddingTop, me.width) / 2;
      }
      determineDataLimits() {
        const me = this;
        const {min, max} = me.getMinMax(false);
        me.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
        me.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
        me.handleTickRangeOptions();
      }
      computeTickLimit() {
        return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
      }
      generateTickLabels(ticks) {
        const me = this;
        LinearScaleBase.prototype.generateTickLabels.call(me, ticks);
        me._pointLabels = me.getLabels().map((value, index) => {
          const label = callback(me.options.pointLabels.callback, [value, index], me);
          return label || label === 0 ? label : '';
        });
      }
      fit() {
        const me = this;
        const opts = me.options;
        if (opts.display && opts.pointLabels.display) {
          fitWithPointLabels(me);
        } else {
          me.setCenterPoint(0, 0, 0, 0);
        }
      }
      _setReductions(largestPossibleRadius, furthestLimits, furthestAngles) {
        const me = this;
        let radiusReductionLeft = furthestLimits.l / Math.sin(furthestAngles.l);
        let radiusReductionRight = Math.max(furthestLimits.r - me.width, 0) / Math.sin(furthestAngles.r);
        let radiusReductionTop = -furthestLimits.t / Math.cos(furthestAngles.t);
        let radiusReductionBottom = -Math.max(furthestLimits.b - (me.height - me.paddingTop), 0) / Math.cos(furthestAngles.b);
        radiusReductionLeft = numberOrZero(radiusReductionLeft);
        radiusReductionRight = numberOrZero(radiusReductionRight);
        radiusReductionTop = numberOrZero(radiusReductionTop);
        radiusReductionBottom = numberOrZero(radiusReductionBottom);
        me.drawingArea = Math.max(largestPossibleRadius / 2, Math.min(
          Math.floor(largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2),
          Math.floor(largestPossibleRadius - (radiusReductionTop + radiusReductionBottom) / 2)));
        me.setCenterPoint(radiusReductionLeft, radiusReductionRight, radiusReductionTop, radiusReductionBottom);
      }
      setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
        const me = this;
        const maxRight = me.width - rightMovement - me.drawingArea;
        const maxLeft = leftMovement + me.drawingArea;
        const maxTop = topMovement + me.drawingArea;
        const maxBottom = (me.height - me.paddingTop) - bottomMovement - me.drawingArea;
        me.xCenter = Math.floor(((maxLeft + maxRight) / 2) + me.left);
        me.yCenter = Math.floor(((maxTop + maxBottom) / 2) + me.top + me.paddingTop);
      }
      getIndexAngle(index) {
        const angleMultiplier = TAU / this.getLabels().length;
        const startAngle = this.options.startAngle || 0;
        return _normalizeAngle(index * angleMultiplier + toRadians(startAngle));
      }
      getDistanceFromCenterForValue(value) {
        const me = this;
        if (isNullOrUndef(value)) {
          return NaN;
        }
        const scalingFactor = me.drawingArea / (me.max - me.min);
        if (me.options.reverse) {
          return (me.max - value) * scalingFactor;
        }
        return (value - me.min) * scalingFactor;
      }
      getValueForDistanceFromCenter(distance) {
        if (isNullOrUndef(distance)) {
          return NaN;
        }
        const me = this;
        const scaledDistance = distance / (me.drawingArea / (me.max - me.min));
        return me.options.reverse ? me.max - scaledDistance : me.min + scaledDistance;
      }
      getPointPosition(index, distanceFromCenter) {
        const me = this;
        const angle = me.getIndexAngle(index) - HALF_PI;
        return {
          x: Math.cos(angle) * distanceFromCenter + me.xCenter,
          y: Math.sin(angle) * distanceFromCenter + me.yCenter,
          angle
        };
      }
      getPointPositionForValue(index, value) {
        return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
      }
      getBasePosition(index) {
        return this.getPointPositionForValue(index || 0, this.getBaseValue());
      }
      getPointLabelPosition(index) {
        const {left, top, right, bottom} = this._pointLabelItems[index];
        return {
          left,
          top,
          right,
          bottom,
        };
      }
      drawBackground() {
        const me = this;
        const {backgroundColor, grid: {circular}} = me.options;
        if (backgroundColor) {
          const ctx = me.ctx;
          ctx.save();
          ctx.beginPath();
          pathRadiusLine(me, me.getDistanceFromCenterForValue(me._endValue), circular, me.getLabels().length);
          ctx.closePath();
          ctx.fillStyle = backgroundColor;
          ctx.fill();
          ctx.restore();
        }
      }
      drawGrid() {
        const me = this;
        const ctx = me.ctx;
        const opts = me.options;
        const {angleLines, grid} = opts;
        const labelCount = me.getLabels().length;
        let i, offset, position;
        if (opts.pointLabels.display) {
          drawPointLabels(me, labelCount);
        }
        if (grid.display) {
          me.ticks.forEach((tick, index) => {
            if (index !== 0) {
              offset = me.getDistanceFromCenterForValue(tick.value);
              const optsAtIndex = grid.setContext(me.getContext(index - 1));
              drawRadiusLine(me, optsAtIndex, offset, labelCount);
            }
          });
        }
        if (angleLines.display) {
          ctx.save();
          for (i = me.getLabels().length - 1; i >= 0; i--) {
            const optsAtIndex = angleLines.setContext(me.getContext(i));
            const {color, lineWidth} = optsAtIndex;
            if (!lineWidth || !color) {
              continue;
            }
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.setLineDash(optsAtIndex.borderDash);
            ctx.lineDashOffset = optsAtIndex.borderDashOffset;
            offset = me.getDistanceFromCenterForValue(opts.ticks.reverse ? me.min : me.max);
            position = me.getPointPosition(i, offset);
            ctx.beginPath();
            ctx.moveTo(me.xCenter, me.yCenter);
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      drawBorder() {}
      drawLabels() {
        const me = this;
        const ctx = me.ctx;
        const opts = me.options;
        const tickOpts = opts.ticks;
        if (!tickOpts.display) {
          return;
        }
        const startAngle = me.getIndexAngle(0);
        let offset, width;
        ctx.save();
        ctx.translate(me.xCenter, me.yCenter);
        ctx.rotate(startAngle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        me.ticks.forEach((tick, index) => {
          if (index === 0 && !opts.reverse) {
            return;
          }
          const optsAtIndex = tickOpts.setContext(me.getContext(index));
          const tickFont = toFont(optsAtIndex.font);
          offset = me.getDistanceFromCenterForValue(me.ticks[index].value);
          if (optsAtIndex.showLabelBackdrop) {
            width = ctx.measureText(tick.label).width;
            ctx.fillStyle = optsAtIndex.backdropColor;
            const padding = toPadding(optsAtIndex.backdropPadding);
            ctx.fillRect(
              -width / 2 - padding.left,
              -offset - tickFont.size / 2 - padding.top,
              width + padding.width,
              tickFont.size + padding.height
            );
          }
          renderText(ctx, tick.label, 0, -offset, tickFont, {
            color: optsAtIndex.color,
          });
        });
        ctx.restore();
      }
      drawTitle() {}
    }
    RadialLinearScale.id = 'radialLinear';
    RadialLinearScale.defaults = {
      display: true,
      animate: true,
      position: 'chartArea',
      angleLines: {
        display: true,
        lineWidth: 1,
        borderDash: [],
        borderDashOffset: 0.0
      },
      grid: {
        circular: false
      },
      startAngle: 0,
      ticks: {
        showLabelBackdrop: true,
        callback: Ticks.formatters.numeric
      },
      pointLabels: {
        backdropColor: undefined,
        backdropPadding: 2,
        display: true,
        font: {
          size: 10
        },
        callback(label) {
          return label;
        },
        padding: 5
      }
    };
    RadialLinearScale.defaultRoutes = {
      'angleLines.color': 'borderColor',
      'pointLabels.color': 'color',
      'ticks.color': 'color'
    };
    RadialLinearScale.descriptors = {
      angleLines: {
        _fallback: 'grid'
      }
    };

    const INTERVALS = {
      millisecond: {common: true, size: 1, steps: 1000},
      second: {common: true, size: 1000, steps: 60},
      minute: {common: true, size: 60000, steps: 60},
      hour: {common: true, size: 3600000, steps: 24},
      day: {common: true, size: 86400000, steps: 30},
      week: {common: false, size: 604800000, steps: 4},
      month: {common: true, size: 2.628e9, steps: 12},
      quarter: {common: false, size: 7.884e9, steps: 4},
      year: {common: true, size: 3.154e10}
    };
    const UNITS = (Object.keys(INTERVALS));
    function sorter(a, b) {
      return a - b;
    }
    function parse(scale, input) {
      if (isNullOrUndef(input)) {
        return null;
      }
      const adapter = scale._adapter;
      const {parser, round, isoWeekday} = scale._parseOpts;
      let value = input;
      if (typeof parser === 'function') {
        value = parser(value);
      }
      if (!isNumberFinite(value)) {
        value = typeof parser === 'string'
          ? adapter.parse(value, parser)
          : adapter.parse(value);
      }
      if (value === null) {
        return null;
      }
      if (round) {
        value = round === 'week' && (isNumber(isoWeekday) || isoWeekday === true)
          ? adapter.startOf(value, 'isoWeek', isoWeekday)
          : adapter.startOf(value, round);
      }
      return +value;
    }
    function determineUnitForAutoTicks(minUnit, min, max, capacity) {
      const ilen = UNITS.length;
      for (let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i) {
        const interval = INTERVALS[UNITS[i]];
        const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
        if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
          return UNITS[i];
        }
      }
      return UNITS[ilen - 1];
    }
    function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
      for (let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--) {
        const unit = UNITS[i];
        if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
          return unit;
        }
      }
      return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
    }
    function determineMajorUnit(unit) {
      for (let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i) {
        if (INTERVALS[UNITS[i]].common) {
          return UNITS[i];
        }
      }
    }
    function addTick(ticks, time, timestamps) {
      if (!timestamps) {
        ticks[time] = true;
      } else if (timestamps.length) {
        const {lo, hi} = _lookup(timestamps, time);
        const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
        ticks[timestamp] = true;
      }
    }
    function setMajorTicks(scale, ticks, map, majorUnit) {
      const adapter = scale._adapter;
      const first = +adapter.startOf(ticks[0].value, majorUnit);
      const last = ticks[ticks.length - 1].value;
      let major, index;
      for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
        index = map[major];
        if (index >= 0) {
          ticks[index].major = true;
        }
      }
      return ticks;
    }
    function ticksFromTimestamps(scale, values, majorUnit) {
      const ticks = [];
      const map = {};
      const ilen = values.length;
      let i, value;
      for (i = 0; i < ilen; ++i) {
        value = values[i];
        map[value] = i;
        ticks.push({
          value,
          major: false
        });
      }
      return (ilen === 0 || !majorUnit) ? ticks : setMajorTicks(scale, ticks, map, majorUnit);
    }
    class TimeScale extends Scale {
      constructor(props) {
        super(props);
        this._cache = {
          data: [],
          labels: [],
          all: []
        };
        this._unit = 'day';
        this._majorUnit = undefined;
        this._offsets = {};
        this._normalized = false;
        this._parseOpts = undefined;
      }
      init(scaleOpts, opts) {
        const time = scaleOpts.time || (scaleOpts.time = {});
        const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
        mergeIf(time.displayFormats, adapter.formats());
        this._parseOpts = {
          parser: time.parser,
          round: time.round,
          isoWeekday: time.isoWeekday
        };
        super.init(scaleOpts);
        this._normalized = opts.normalized;
      }
      parse(raw, index) {
        if (raw === undefined) {
          return null;
        }
        return parse(this, raw);
      }
      beforeLayout() {
        super.beforeLayout();
        this._cache = {
          data: [],
          labels: [],
          all: []
        };
      }
      determineDataLimits() {
        const me = this;
        const options = me.options;
        const adapter = me._adapter;
        const unit = options.time.unit || 'day';
        let {min, max, minDefined, maxDefined} = me.getUserBounds();
        function _applyBounds(bounds) {
          if (!minDefined && !isNaN(bounds.min)) {
            min = Math.min(min, bounds.min);
          }
          if (!maxDefined && !isNaN(bounds.max)) {
            max = Math.max(max, bounds.max);
          }
        }
        if (!minDefined || !maxDefined) {
          _applyBounds(me._getLabelBounds());
          if (options.bounds !== 'ticks' || options.ticks.source !== 'labels') {
            _applyBounds(me.getMinMax(false));
          }
        }
        min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
        max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
        me.min = Math.min(min, max - 1);
        me.max = Math.max(min + 1, max);
      }
      _getLabelBounds() {
        const arr = this.getLabelTimestamps();
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        if (arr.length) {
          min = arr[0];
          max = arr[arr.length - 1];
        }
        return {min, max};
      }
      buildTicks() {
        const me = this;
        const options = me.options;
        const timeOpts = options.time;
        const tickOpts = options.ticks;
        const timestamps = tickOpts.source === 'labels' ? me.getLabelTimestamps() : me._generate();
        if (options.bounds === 'ticks' && timestamps.length) {
          me.min = me._userMin || timestamps[0];
          me.max = me._userMax || timestamps[timestamps.length - 1];
        }
        const min = me.min;
        const max = me.max;
        const ticks = _filterBetween(timestamps, min, max);
        me._unit = timeOpts.unit || (tickOpts.autoSkip
          ? determineUnitForAutoTicks(timeOpts.minUnit, me.min, me.max, me._getLabelCapacity(min))
          : determineUnitForFormatting(me, ticks.length, timeOpts.minUnit, me.min, me.max));
        me._majorUnit = !tickOpts.major.enabled || me._unit === 'year' ? undefined
          : determineMajorUnit(me._unit);
        me.initOffsets(timestamps);
        if (options.reverse) {
          ticks.reverse();
        }
        return ticksFromTimestamps(me, ticks, me._majorUnit);
      }
      initOffsets(timestamps) {
        const me = this;
        let start = 0;
        let end = 0;
        let first, last;
        if (me.options.offset && timestamps.length) {
          first = me.getDecimalForValue(timestamps[0]);
          if (timestamps.length === 1) {
            start = 1 - first;
          } else {
            start = (me.getDecimalForValue(timestamps[1]) - first) / 2;
          }
          last = me.getDecimalForValue(timestamps[timestamps.length - 1]);
          if (timestamps.length === 1) {
            end = last;
          } else {
            end = (last - me.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
          }
        }
        const limit = timestamps.length < 3 ? 0.5 : 0.25;
        start = _limitValue(start, 0, limit);
        end = _limitValue(end, 0, limit);
        me._offsets = {start, end, factor: 1 / (start + 1 + end)};
      }
      _generate() {
        const me = this;
        const adapter = me._adapter;
        const min = me.min;
        const max = me.max;
        const options = me.options;
        const timeOpts = options.time;
        const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, me._getLabelCapacity(min));
        const stepSize = valueOrDefault(timeOpts.stepSize, 1);
        const weekday = minor === 'week' ? timeOpts.isoWeekday : false;
        const hasWeekday = isNumber(weekday) || weekday === true;
        const ticks = {};
        let first = min;
        let time, count;
        if (hasWeekday) {
          first = +adapter.startOf(first, 'isoWeek', weekday);
        }
        first = +adapter.startOf(first, hasWeekday ? 'day' : minor);
        if (adapter.diff(max, min, minor) > 100000 * stepSize) {
          throw new Error(min + ' and ' + max + ' are too far apart with stepSize of ' + stepSize + ' ' + minor);
        }
        const timestamps = options.ticks.source === 'data' && me.getDataTimestamps();
        for (time = first, count = 0; time < max; time = +adapter.add(time, stepSize, minor), count++) {
          addTick(ticks, time, timestamps);
        }
        if (time === max || options.bounds === 'ticks' || count === 1) {
          addTick(ticks, time, timestamps);
        }
        return Object.keys(ticks).sort((a, b) => a - b).map(x => +x);
      }
      getLabelForValue(value) {
        const me = this;
        const adapter = me._adapter;
        const timeOpts = me.options.time;
        if (timeOpts.tooltipFormat) {
          return adapter.format(value, timeOpts.tooltipFormat);
        }
        return adapter.format(value, timeOpts.displayFormats.datetime);
      }
      _tickFormatFunction(time, index, ticks, format) {
        const me = this;
        const options = me.options;
        const formats = options.time.displayFormats;
        const unit = me._unit;
        const majorUnit = me._majorUnit;
        const minorFormat = unit && formats[unit];
        const majorFormat = majorUnit && formats[majorUnit];
        const tick = ticks[index];
        const major = majorUnit && majorFormat && tick && tick.major;
        const label = me._adapter.format(time, format || (major ? majorFormat : minorFormat));
        const formatter = options.ticks.callback;
        return formatter ? callback(formatter, [label, index, ticks], me) : label;
      }
      generateTickLabels(ticks) {
        let i, ilen, tick;
        for (i = 0, ilen = ticks.length; i < ilen; ++i) {
          tick = ticks[i];
          tick.label = this._tickFormatFunction(tick.value, i, ticks);
        }
      }
      getDecimalForValue(value) {
        const me = this;
        return value === null ? NaN : (value - me.min) / (me.max - me.min);
      }
      getPixelForValue(value) {
        const me = this;
        const offsets = me._offsets;
        const pos = me.getDecimalForValue(value);
        return me.getPixelForDecimal((offsets.start + pos) * offsets.factor);
      }
      getValueForPixel(pixel) {
        const me = this;
        const offsets = me._offsets;
        const pos = me.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
        return me.min + pos * (me.max - me.min);
      }
      _getLabelSize(label) {
        const me = this;
        const ticksOpts = me.options.ticks;
        const tickLabelWidth = me.ctx.measureText(label).width;
        const angle = toRadians(me.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
        const cosRotation = Math.cos(angle);
        const sinRotation = Math.sin(angle);
        const tickFontSize = me._resolveTickFontOptions(0).size;
        return {
          w: (tickLabelWidth * cosRotation) + (tickFontSize * sinRotation),
          h: (tickLabelWidth * sinRotation) + (tickFontSize * cosRotation)
        };
      }
      _getLabelCapacity(exampleTime) {
        const me = this;
        const timeOpts = me.options.time;
        const displayFormats = timeOpts.displayFormats;
        const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
        const exampleLabel = me._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(me, [exampleTime], me._majorUnit), format);
        const size = me._getLabelSize(exampleLabel);
        const capacity = Math.floor(me.isHorizontal() ? me.width / size.w : me.height / size.h) - 1;
        return capacity > 0 ? capacity : 1;
      }
      getDataTimestamps() {
        const me = this;
        let timestamps = me._cache.data || [];
        let i, ilen;
        if (timestamps.length) {
          return timestamps;
        }
        const metas = me.getMatchingVisibleMetas();
        if (me._normalized && metas.length) {
          return (me._cache.data = metas[0].controller.getAllParsedValues(me));
        }
        for (i = 0, ilen = metas.length; i < ilen; ++i) {
          timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(me));
        }
        return (me._cache.data = me.normalize(timestamps));
      }
      getLabelTimestamps() {
        const me = this;
        const timestamps = me._cache.labels || [];
        let i, ilen;
        if (timestamps.length) {
          return timestamps;
        }
        const labels = me.getLabels();
        for (i = 0, ilen = labels.length; i < ilen; ++i) {
          timestamps.push(parse(me, labels[i]));
        }
        return (me._cache.labels = me._normalized ? timestamps : me.normalize(timestamps));
      }
      normalize(values) {
        return _arrayUnique(values.sort(sorter));
      }
    }
    TimeScale.id = 'time';
    TimeScale.defaults = {
      bounds: 'data',
      adapters: {},
      time: {
        parser: false,
        unit: false,
        round: false,
        isoWeekday: false,
        minUnit: 'millisecond',
        displayFormats: {}
      },
      ticks: {
        source: 'auto',
        major: {
          enabled: false
        }
      }
    };

    function interpolate(table, val, reverse) {
      let prevSource, nextSource, prevTarget, nextTarget;
      if (reverse) {
        prevSource = Math.floor(val);
        nextSource = Math.ceil(val);
        prevTarget = table[prevSource];
        nextTarget = table[nextSource];
      } else {
        const result = _lookup(table, val);
        prevTarget = result.lo;
        nextTarget = result.hi;
        prevSource = table[prevTarget];
        nextSource = table[nextTarget];
      }
      const span = nextSource - prevSource;
      return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
    }
    class TimeSeriesScale extends TimeScale {
      constructor(props) {
        super(props);
        this._table = [];
        this._maxIndex = undefined;
      }
      initOffsets() {
        const me = this;
        const timestamps = me._getTimestampsForTable();
        me._table = me.buildLookupTable(timestamps);
        me._maxIndex = me._table.length - 1;
        super.initOffsets(timestamps);
      }
      buildLookupTable(timestamps) {
        const me = this;
        const {min, max} = me;
        if (!timestamps.length) {
          return [
            {time: min, pos: 0},
            {time: max, pos: 1}
          ];
        }
        const items = [min];
        let i, ilen, curr;
        for (i = 0, ilen = timestamps.length; i < ilen; ++i) {
          curr = timestamps[i];
          if (curr > min && curr < max) {
            items.push(curr);
          }
        }
        items.push(max);
        return items;
      }
      _getTimestampsForTable() {
        const me = this;
        let timestamps = me._cache.all || [];
        if (timestamps.length) {
          return timestamps;
        }
        const data = me.getDataTimestamps();
        const label = me.getLabelTimestamps();
        if (data.length && label.length) {
          timestamps = me.normalize(data.concat(label));
        } else {
          timestamps = data.length ? data : label;
        }
        timestamps = me._cache.all = timestamps;
        return timestamps;
      }
      getPixelForValue(value, index) {
        const me = this;
        const offsets = me._offsets;
        const pos = me._normalized && me._maxIndex > 0 && !isNullOrUndef(index)
          ? index / me._maxIndex : me.getDecimalForValue(value);
        return me.getPixelForDecimal((offsets.start + pos) * offsets.factor);
      }
      getDecimalForValue(value) {
        return interpolate(this._table, value) / this._maxIndex;
      }
      getValueForPixel(pixel) {
        const me = this;
        const offsets = me._offsets;
        const decimal = me.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
        return interpolate(me._table, decimal * this._maxIndex, true);
      }
    }
    TimeSeriesScale.id = 'timeseries';
    TimeSeriesScale.defaults = TimeScale.defaults;

    var scales = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CategoryScale: CategoryScale,
    LinearScale: LinearScale,
    LogarithmicScale: LogarithmicScale,
    RadialLinearScale: RadialLinearScale,
    TimeScale: TimeScale,
    TimeSeriesScale: TimeSeriesScale
    });

    const registerables = [
      controllers,
      elements,
      plugins,
      scales,
    ];

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$1;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop$1;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (209:0) {:else}
    function create_else_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/auth/routes/Login.svelte generated by Svelte v3.37.0 */
    const file$f = "src/auth/routes/Login.svelte";

    function create_fragment$g(ctx) {
    	let div12;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t2;
    	let div11;
    	let div10;
    	let div9;
    	let div2;
    	let label0;
    	let t4;
    	let div1;
    	let input0;
    	let t5;
    	let div4;
    	let label1;
    	let t7;
    	let div3;
    	let input1;
    	let t8;
    	let div7;
    	let div5;
    	let input2;
    	let t9;
    	let label2;
    	let t11;
    	let div6;
    	let a;
    	let t13;
    	let div8;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Sign in to your account";
    			t2 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email address";
    			t4 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t5 = space();
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t7 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t8 = space();
    			div7 = element("div");
    			div5 = element("div");
    			input2 = element("input");
    			t9 = space();
    			label2 = element("label");
    			label2.textContent = "Remember me";
    			t11 = space();
    			div6 = element("div");
    			a = element("a");
    			a.textContent = "Forgot your password?";
    			t13 = space();
    			div8 = element("div");
    			button = element("button");
    			button.textContent = "Sign in";
    			attr_dev(img, "class", "mx-auto h-12 w-auto");
    			if (img.src !== (img_src_value = "https://energify.pt/logo-small.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Workflow");
    			add_location(img, file$f, 26, 4, 1214);
    			attr_dev(h2, "class", "mt-6 text-center text-3xl font-extrabold text-gray-900");
    			add_location(h2, file$f, 27, 4, 1310);
    			attr_dev(div0, "class", "sm:mx-auto sm:w-full sm:max-w-md");
    			add_location(div0, file$f, 25, 2, 1163);
    			attr_dev(label0, "for", "email");
    			attr_dev(label0, "class", "block text-sm font-medium text-gray-700");
    			add_location(label0, file$f, 34, 10, 1591);
    			attr_dev(input0, "id", "email");
    			attr_dev(input0, "name", "email");
    			attr_dev(input0, "autocomplete", "off");
    			attr_dev(input0, "type", "email");
    			input0.required = true;
    			attr_dev(input0, "class", "input");
    			add_location(input0, file$f, 36, 12, 1723);
    			attr_dev(div1, "class", "mt-1");
    			add_location(div1, file$f, 35, 10, 1692);
    			add_location(div2, file$f, 33, 8, 1575);
    			attr_dev(label1, "for", "password");
    			attr_dev(label1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label1, file$f, 49, 10, 1998);
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "type", "password");
    			input1.required = true;
    			attr_dev(input1, "class", "input");
    			add_location(input1, file$f, 51, 12, 2128);
    			attr_dev(div3, "class", "mt-1");
    			add_location(div3, file$f, 50, 10, 2097);
    			add_location(div4, file$f, 48, 8, 1982);
    			attr_dev(input2, "id", "remember_me");
    			attr_dev(input2, "name", "remember_me");
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded");
    			add_location(input2, file$f, 64, 12, 2468);
    			attr_dev(label2, "for", "remember_me");
    			attr_dev(label2, "class", "ml-2 block text-sm text-gray-900");
    			add_location(label2, file$f, 70, 12, 2686);
    			attr_dev(div5, "class", "flex items-center");
    			add_location(div5, file$f, 63, 10, 2424);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "font-medium text-green-600 hover:text-green-500");
    			add_location(a, file$f, 74, 12, 2836);
    			attr_dev(div6, "class", "text-sm");
    			add_location(div6, file$f, 73, 10, 2802);
    			attr_dev(div7, "class", "flex items-center justify-between");
    			add_location(div7, file$f, 62, 8, 2366);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "w-full flex justify-center btn");
    			add_location(button, file$f, 81, 10, 3015);
    			add_location(div8, file$f, 80, 8, 2999);
    			attr_dev(div9, "class", "space-y-6");
    			add_location(div9, file$f, 32, 6, 1543);
    			attr_dev(div10, "class", "bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10");
    			add_location(div10, file$f, 31, 4, 1474);
    			attr_dev(div11, "class", "mt-8 sm:mx-auto sm:w-full sm:max-w-md");
    			add_location(div11, file$f, 30, 2, 1418);
    			attr_dev(div12, "class", "min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8");
    			add_location(div12, file$f, 24, 0, 1072);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, h2);
    			append_dev(div12, t2);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*email*/ ctx[0]);
    			append_dev(div9, t5);
    			append_dev(div9, div4);
    			append_dev(div4, label1);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(div9, t8);
    			append_dev(div9, div7);
    			append_dev(div7, div5);
    			append_dev(div5, input2);
    			append_dev(div5, t9);
    			append_dev(div5, label2);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			append_dev(div6, a);
    			append_dev(div9, t13);
    			append_dev(div9, div8);
    			append_dev(div8, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*handleLogin*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*email*/ 1 && input0.value !== /*email*/ ctx[0]) {
    				set_input_value(input0, /*email*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let { email = "" } = $$props;
    	let { password = "" } = $$props;

    	function handleLogin() {
    		return __awaiter(this, void 0, void 0, function* () {
    			try {
    				yield authService.login({ email, password });
    				push("#/trading");
    			} catch(_a) {
    				
    			}
    		});
    	}

    	const writable_props = ["email", "password"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	$$self.$$set = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		push,
    		authService,
    		email,
    		password,
    		handleLogin
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [email, password, handleLogin, input0_input_handler, input1_input_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { email: 0, password: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get email() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set email(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get password() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set password(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/auth/routes/Register.svelte generated by Svelte v3.37.0 */

    const file$e = "src/auth/routes/Register.svelte";

    function create_fragment$f(ctx) {
    	let div14;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t2;
    	let div13;
    	let div12;
    	let form;
    	let div2;
    	let label0;
    	let t4;
    	let div1;
    	let input0;
    	let t5;
    	let div4;
    	let label1;
    	let t7;
    	let div3;
    	let input1;
    	let t8;
    	let div6;
    	let label2;
    	let t10;
    	let div5;
    	let input2;
    	let t11;
    	let div8;
    	let label3;
    	let t13;
    	let div7;
    	let input3;
    	let t14;
    	let div10;
    	let label4;
    	let t16;
    	let div9;
    	let input4;
    	let t17;
    	let div11;
    	let button;

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Create a new account";
    			t2 = space();
    			div13 = element("div");
    			div12 = element("div");
    			form = element("form");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Name";
    			t4 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t5 = space();
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Birthday";
    			t7 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t8 = space();
    			div6 = element("div");
    			label2 = element("label");
    			label2.textContent = "Email address";
    			t10 = space();
    			div5 = element("div");
    			input2 = element("input");
    			t11 = space();
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Password";
    			t13 = space();
    			div7 = element("div");
    			input3 = element("input");
    			t14 = space();
    			div10 = element("div");
    			label4 = element("label");
    			label4.textContent = "Citizen No";
    			t16 = space();
    			div9 = element("div");
    			input4 = element("input");
    			t17 = space();
    			div11 = element("div");
    			button = element("button");
    			button.textContent = "Sign up";
    			attr_dev(img, "class", "mx-auto h-12 w-auto");
    			if (img.src !== (img_src_value = "https://energify.pt/logo-small.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Workflow");
    			add_location(img, file$e, 2, 4, 142);
    			attr_dev(h2, "class", "mt-6 text-center text-3xl font-extrabold text-gray-900");
    			add_location(h2, file$e, 3, 4, 238);
    			attr_dev(div0, "class", "sm:mx-auto sm:w-full sm:max-w-md");
    			add_location(div0, file$e, 1, 2, 91);
    			attr_dev(label0, "for", "name");
    			attr_dev(label0, "class", "block text-sm font-medium text-gray-700");
    			add_location(label0, file$e, 10, 10, 542);
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "name", "name");
    			input0.required = true;
    			attr_dev(input0, "class", "input");
    			add_location(input0, file$e, 12, 12, 664);
    			attr_dev(div1, "class", "mt-1");
    			add_location(div1, file$e, 11, 10, 633);
    			add_location(div2, file$e, 9, 8, 526);
    			attr_dev(label1, "for", "birthday");
    			attr_dev(label1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label1, file$e, 17, 10, 776);
    			attr_dev(input1, "id", "birthday");
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "name", "birthday");
    			input1.required = true;
    			attr_dev(input1, "class", "input");
    			add_location(input1, file$e, 19, 12, 906);
    			attr_dev(div3, "class", "mt-1");
    			add_location(div3, file$e, 18, 10, 875);
    			add_location(div4, file$e, 16, 8, 760);
    			attr_dev(label2, "for", "email");
    			attr_dev(label2, "class", "block text-sm font-medium text-gray-700");
    			add_location(label2, file$e, 24, 10, 1038);
    			attr_dev(input2, "id", "email");
    			attr_dev(input2, "name", "email");
    			attr_dev(input2, "type", "email");
    			input2.required = true;
    			attr_dev(input2, "class", "input");
    			add_location(input2, file$e, 26, 12, 1170);
    			attr_dev(div5, "class", "mt-1");
    			add_location(div5, file$e, 25, 10, 1139);
    			add_location(div6, file$e, 23, 8, 1022);
    			attr_dev(label3, "for", "password");
    			attr_dev(label3, "class", "block text-sm font-medium text-gray-700");
    			add_location(label3, file$e, 31, 10, 1297);
    			attr_dev(input3, "id", "password");
    			attr_dev(input3, "name", "password");
    			attr_dev(input3, "type", "password");
    			input3.required = true;
    			attr_dev(input3, "class", "input");
    			add_location(input3, file$e, 33, 12, 1427);
    			attr_dev(div7, "class", "mt-1");
    			add_location(div7, file$e, 32, 10, 1396);
    			add_location(div8, file$e, 30, 8, 1281);
    			attr_dev(label4, "for", "cc");
    			attr_dev(label4, "class", "block text-sm font-medium text-gray-700");
    			add_location(label4, file$e, 38, 10, 1563);
    			attr_dev(input4, "id", "cc");
    			attr_dev(input4, "name", "cc");
    			input4.required = true;
    			attr_dev(input4, "class", "input");
    			add_location(input4, file$e, 40, 12, 1689);
    			attr_dev(div9, "class", "mt-1");
    			add_location(div9, file$e, 39, 10, 1658);
    			add_location(div10, file$e, 37, 8, 1547);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "w-full flex justify-center btn");
    			add_location(button, file$e, 45, 10, 1797);
    			add_location(div11, file$e, 44, 8, 1781);
    			attr_dev(form, "class", "space-y-6");
    			attr_dev(form, "action", "#");
    			attr_dev(form, "method", "POST");
    			add_location(form, file$e, 8, 6, 468);
    			attr_dev(div12, "class", "bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10");
    			add_location(div12, file$e, 7, 4, 399);
    			attr_dev(div13, "class", "mt-8 sm:mx-auto sm:w-full sm:max-w-md");
    			add_location(div13, file$e, 6, 2, 343);
    			attr_dev(div14, "class", "min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8");
    			add_location(div14, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, h2);
    			append_dev(div14, t2);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, form);
    			append_dev(form, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			append_dev(form, t5);
    			append_dev(form, div4);
    			append_dev(div4, label1);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, input1);
    			append_dev(form, t8);
    			append_dev(form, div6);
    			append_dev(div6, label2);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, input2);
    			append_dev(form, t11);
    			append_dev(form, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			append_dev(div7, input3);
    			append_dev(form, t14);
    			append_dev(form, div10);
    			append_dev(div10, label4);
    			append_dev(div10, t16);
    			append_dev(div10, div9);
    			append_dev(div9, input4);
    			append_dev(form, t17);
    			append_dev(form, div11);
    			append_dev(div11, button);
    		},
    		p: noop$1,
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Register", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Register> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    var authRoutes = {
        "/auth/login": wrap$1({
            component: Login,
            conditions: [async () => !(await authService.isLoggedIn())],
        }),
        "/auth/register": wrap$1({
            component: Register,
            conditions: [async () => !(await authService.isLoggedIn())],
        }),
    };

    /* node_modules/svelte-hero-icons/dist/Icon.svelte generated by Svelte v3.37.0 */

    const file$d = "node_modules/svelte-hero-icons/dist/Icon.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (22:0) {#if src && src != []}
    function create_if_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*solid*/ ctx[2]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(22:0) {#if src && src != []}",
    		ctx
    	});

    	return block;
    }

    // (37:2) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let svg_class_value;
    	let each_value_1 = /*src*/ ctx[1][1] ?? [];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", svg_class_value = "heroicon outline " + /*customClass*/ ctx[3]);
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			add_location(svg, file$d, 37, 4, 759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 2) {
    				each_value_1 = /*src*/ ctx[1][1] ?? [];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*customClass*/ 8 && svg_class_value !== (svg_class_value = "heroicon outline " + /*customClass*/ ctx[3])) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(37:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:2) {#if solid}
    function create_if_block_1(ctx) {
    	let svg;
    	let svg_class_value;
    	let each_value = /*src*/ ctx[1][0] ?? [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", svg_class_value = "heroicon solid " + /*customClass*/ ctx[3]);
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			add_location(svg, file$d, 23, 4, 446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 2) {
    				each_value = /*src*/ ctx[1][0] ?? [];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*customClass*/ 8 && svg_class_value !== (svg_class_value = "heroicon solid " + /*customClass*/ ctx[3])) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(23:2) {#if solid}",
    		ctx
    	});

    	return block;
    }

    // (47:6) {#each src[1] ?? [] as att}
    function create_each_block_1(ctx) {
    	let path;
    	let path_levels = [/*att*/ ctx[4]];
    	let path_data = {};

    	for (let i = 0; i < path_levels.length; i += 1) {
    		path_data = assign(path_data, path_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			set_svg_attributes(path, path_data);
    			add_location(path, file$d, 48, 8, 1037);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			set_svg_attributes(path, path_data = get_spread_update(path_levels, [dirty & /*src*/ 2 && /*att*/ ctx[4]]));
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(47:6) {#each src[1] ?? [] as att}",
    		ctx
    	});

    	return block;
    }

    // (32:6) {#each src[0] ?? [] as att}
    function create_each_block(ctx) {
    	let path;
    	let path_levels = [/*att*/ ctx[4]];
    	let path_data = {};

    	for (let i = 0; i < path_levels.length; i += 1) {
    		path_data = assign(path_data, path_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			set_svg_attributes(path, path_data);
    			add_location(path, file$d, 33, 8, 702);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			set_svg_attributes(path, path_data = get_spread_update(path_levels, [dirty & /*src*/ 2 && /*att*/ ctx[4]]));
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(32:6) {#each src[0] ?? [] as att}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;
    	let if_block = /*src*/ ctx[1] && /*src*/ ctx[1] != [] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*src*/ ctx[1] && /*src*/ ctx[1] != []) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { src = [] } = $$props;
    	let { size = "100%" } = $$props;
    	let { solid = false } = $$props;
    	let { class: customClass = "" } = $$props;

    	if (size !== "100%") {
    		if (size.slice(-1) != "x" && size.slice(-1) != "m" && size.slice(-1) != "%") {
    			try {
    				size = parseInt(size) + "px";
    			} catch(error) {
    				size = "100%";
    			}
    		}
    	}

    	const writable_props = ["src", "size", "solid", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("solid" in $$props) $$invalidate(2, solid = $$props.solid);
    		if ("class" in $$props) $$invalidate(3, customClass = $$props.class);
    	};

    	$$self.$capture_state = () => ({ src, size, solid, customClass });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("solid" in $$props) $$invalidate(2, solid = $$props.solid);
    		if ("customClass" in $$props) $$invalidate(3, customClass = $$props.customClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, src, solid, customClass];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { src: 1, size: 0, solid: 2, class: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get src() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get solid() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set solid(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ArrowUp = [
    	[
    		{
    			"fill-rule": "evenodd",
    			d: "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z",
    			"clip-rule": "evenodd"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M5 10l7-7m0 0l7 7m-7-7v18"
    		}
    	]
    ];

    var Cash = [
    	[
    		{
    			"fill-rule": "evenodd",
    			d: "M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z",
    			"clip-rule": "evenodd"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    		}
    	]
    ];

    var ChartBar = [
    	[
    		{
    			d: "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    		}
    	]
    ];

    var ChevronDown = [
    	[
    		{
    			"fill-rule": "evenodd",
    			d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
    			"clip-rule": "evenodd"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M19 9l-7 7-7-7"
    		}
    	]
    ];

    var Download = [
    	[
    		{
    			"fill-rule": "evenodd",
    			d: "M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z",
    			"clip-rule": "evenodd"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    		}
    	]
    ];

    var Home = [
    	[
    		{
    			d: "M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    		}
    	]
    ];

    var Plus = [
    	[
    		{
    			"fill-rule": "evenodd",
    			d: "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z",
    			"clip-rule": "evenodd"
    		}
    	],
    	[
    		{
    			"stroke-linecap": "round",
    			"stroke-linejoin": "round",
    			"stroke-width": "2",
    			d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
    		}
    	]
    ];

    // List of nodes to update
    const nodes = [];

    // Current location
    let location;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        const matchesLocation = el.pattern.test(location);
        toggleClasses(el, el.className, matchesLocation);
        toggleClasses(el, el.inactiveClassName, !matchesLocation);
    }

    function toggleClasses(el, className, shouldAdd) {
        (className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the class firsts
            el.node.classList.remove(cls);

            // If the pattern doesn't match, then set the class
            if (shouldAdd) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            regexparam(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            inactiveClassName: opts.inactiveClassName,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /* src/common/components/sidebar/SidebarItem.svelte generated by Svelte v3.37.0 */
    const file$c = "src/common/components/sidebar/SidebarItem.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let a;
    	let icon_1;
    	let t0;
    	let t1;
    	let active_action;
    	let current;
    	let mounted;
    	let dispose;

    	icon_1 = new Icon({
    			props: {
    				src: /*icon*/ ctx[1],
    				solid: true,
    				class: "w-6 h-6 mr-2"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			create_component(icon_1.$$.fragment);
    			t0 = space();
    			t1 = text(/*name*/ ctx[0]);
    			attr_dev(a, "href", /*link*/ ctx[2]);
    			attr_dev(a, "class", "mx-1 group flex items-center px-4 py-2 text-md font-medium rounded-md");
    			add_location(a, file$c, 8, 2, 186);
    			attr_dev(div, "class", "py-1");
    			add_location(div, file$c, 7, 0, 165);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			mount_component(icon_1, a, null);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(active_action = active.call(null, a, {
    					path: /*link*/ ctx[2].replace("#", ""),
    					className: "bg-gray-100 text-gray-900",
    					inactiveClassName: "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    				}));

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const icon_1_changes = {};
    			if (dirty & /*icon*/ 2) icon_1_changes.src = /*icon*/ ctx[1];
    			icon_1.$set(icon_1_changes);
    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (!current || dirty & /*link*/ 4) {
    				attr_dev(a, "href", /*link*/ ctx[2]);
    			}

    			if (active_action && is_function(active_action.update) && dirty & /*link*/ 4) active_action.update.call(null, {
    				path: /*link*/ ctx[2].replace("#", ""),
    				className: "bg-gray-100 text-gray-900",
    				inactiveClassName: "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon_1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SidebarItem", slots, []);
    	let { name } = $$props;
    	let { icon } = $$props;
    	let { link } = $$props;
    	const writable_props = ["name", "icon", "link"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SidebarItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("link" in $$props) $$invalidate(2, link = $$props.link);
    	};

    	$$self.$capture_state = () => ({ Icon, active, name, icon, link });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("link" in $$props) $$invalidate(2, link = $$props.link);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, icon, link];
    }

    class SidebarItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { name: 0, icon: 1, link: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SidebarItem",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<SidebarItem> was created without expected prop 'name'");
    		}

    		if (/*icon*/ ctx[1] === undefined && !("icon" in props)) {
    			console.warn("<SidebarItem> was created without expected prop 'icon'");
    		}

    		if (/*link*/ ctx[2] === undefined && !("link" in props)) {
    			console.warn("<SidebarItem> was created without expected prop 'link'");
    		}
    	}

    	get name() {
    		throw new Error("<SidebarItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SidebarItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<SidebarItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<SidebarItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<SidebarItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<SidebarItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/common/components/sidebar/Sidebar.svelte generated by Svelte v3.37.0 */
    const file$b = "src/common/components/sidebar/Sidebar.svelte";

    function create_fragment$c(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div4;
    	let div1;
    	let button;
    	let span0;
    	let t2;
    	let svg;
    	let path;
    	let t3;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div3;
    	let nav0;
    	let t5;
    	let div5;
    	let t6;
    	let div11;
    	let div10;
    	let div9;
    	let div7;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let span1;
    	let t9;
    	let div8;
    	let nav1;
    	let span2;
    	let t11;
    	let sidebaritem0;
    	let t12;
    	let sidebaritem1;
    	let t13;
    	let sidebaritem2;
    	let current;

    	sidebaritem0 = new SidebarItem({
    			props: {
    				name: "Dashboard",
    				icon: Home,
    				link: "#/dashboard/"
    			},
    			$$inline: true
    		});

    	sidebaritem1 = new SidebarItem({
    			props: {
    				name: "Trading",
    				icon: ChartBar,
    				link: "#/trading/"
    			},
    			$$inline: true
    		});

    	sidebaritem2 = new SidebarItem({
    			props: {
    				name: "Wallet",
    				icon: Cash,
    				link: "#/wallet/"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "Close sidebar";
    			t2 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t3 = space();
    			div2 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div3 = element("div");
    			nav0 = element("nav");
    			t5 = space();
    			div5 = element("div");
    			t6 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div7 = element("div");
    			img1 = element("img");
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = "Energify";
    			t9 = space();
    			div8 = element("div");
    			nav1 = element("nav");
    			span2 = element("span");
    			span2.textContent = "Navigation";
    			t11 = space();
    			create_component(sidebaritem0.$$.fragment);
    			t12 = space();
    			create_component(sidebaritem1.$$.fragment);
    			t13 = space();
    			create_component(sidebaritem2.$$.fragment);
    			attr_dev(div0, "class", "fixed inset-0 bg-gray-600 bg-opacity-75");
    			attr_dev(div0, "aria-hidden", "true");
    			add_location(div0, file$b, 17, 2, 672);
    			attr_dev(span0, "class", "sr-only");
    			add_location(span0, file$b, 44, 8, 1747);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M6 18L18 6M6 6l12 12");
    			add_location(path, file$b, 54, 10, 2060);
    			attr_dev(svg, "class", "h-6 w-6 text-white");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "aria-hidden", "true");
    			add_location(svg, file$b, 46, 8, 1840);
    			attr_dev(button, "class", "ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white");
    			add_location(button, file$b, 41, 6, 1580);
    			attr_dev(div1, "class", "absolute top-0 right-0 -mr-12 pt-2");
    			add_location(div1, file$b, 40, 4, 1525);
    			attr_dev(img0, "class", "h-8 w-auto");
    			if (img0.src !== (img0_src_value = "https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Workflow");
    			add_location(img0, file$b, 65, 6, 2320);
    			attr_dev(div2, "class", "flex-shrink-0 flex items-center px-4");
    			add_location(div2, file$b, 64, 4, 2263);
    			attr_dev(nav0, "class", "px-2 space-y-1");
    			add_location(nav0, file$b, 72, 6, 2543);
    			attr_dev(div3, "class", "mt-5 flex-1 h-0 overflow-y-auto");
    			add_location(div3, file$b, 71, 4, 2491);
    			attr_dev(div4, "class", "relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-800");
    			add_location(div4, file$b, 29, 2, 1118);
    			attr_dev(div5, "class", "flex-shrink-0 w-14");
    			attr_dev(div5, "aria-hidden", "true");
    			add_location(div5, file$b, 76, 2, 2597);
    			attr_dev(div6, "class", "fixed inset-0 flex z-40 md:hidden");
    			attr_dev(div6, "role", "dialog");
    			attr_dev(div6, "aria-modal", "true");
    			add_location(div6, file$b, 6, 0, 238);
    			attr_dev(img1, "class", "h-8 w-auto");
    			if (img1.src !== (img1_src_value = "https://energify.pt/logo-small.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Workflow");
    			add_location(img1, file$b, 87, 8, 3090);
    			attr_dev(span1, "class", "ml-2 text-2xl font-medium");
    			add_location(span1, file$b, 88, 8, 3181);
    			attr_dev(div7, "class", "flex items-center h-16 flex-shrink-0 px-7 pt-8 bg-white");
    			add_location(div7, file$b, 86, 6, 3012);
    			attr_dev(span2, "class", "uppercase text-sm text-gray-400 font-medium px-4");
    			add_location(span2, file$b, 92, 10, 3376);
    			attr_dev(nav1, "class", "flex-1 px-2 py-12 bg-white space-y-1");
    			add_location(nav1, file$b, 91, 8, 3315);
    			attr_dev(div8, "class", "flex-1 flex flex-col overflow-y-auto");
    			add_location(div8, file$b, 90, 6, 3256);
    			attr_dev(div9, "class", "flex flex-col h-0 flex-1");
    			add_location(div9, file$b, 85, 4, 2967);
    			attr_dev(div10, "class", "flex flex-col w-64");
    			add_location(div10, file$b, 83, 2, 2847);
    			attr_dev(div11, "class", "hidden md:flex md:flex-shrink-0 border-r border-gray-200");
    			add_location(div11, file$b, 82, 0, 2774);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div4);
    			append_dev(div4, div1);
    			append_dev(div1, button);
    			append_dev(button, span0);
    			append_dev(button, t2);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, img0);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, nav0);
    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, img1);
    			append_dev(div7, t7);
    			append_dev(div7, span1);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
    			append_dev(div8, nav1);
    			append_dev(nav1, span2);
    			append_dev(nav1, t11);
    			mount_component(sidebaritem0, nav1, null);
    			append_dev(nav1, t12);
    			mount_component(sidebaritem1, nav1, null);
    			append_dev(nav1, t13);
    			mount_component(sidebaritem2, nav1, null);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebaritem0.$$.fragment, local);
    			transition_in(sidebaritem1.$$.fragment, local);
    			transition_in(sidebaritem2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebaritem0.$$.fragment, local);
    			transition_out(sidebaritem1.$$.fragment, local);
    			transition_out(sidebaritem2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div11);
    			destroy_component(sidebaritem0);
    			destroy_component(sidebaritem1);
    			destroy_component(sidebaritem2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, []);
    	let isMenuOpen = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		SidebarItem,
    		ChartBar,
    		Cash,
    		Home,
    		isMenuOpen
    	});

    	$$self.$inject_state = $$props => {
    		if ("isMenuOpen" in $$props) isMenuOpen = $$props.isMenuOpen;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/common/components/shell/ShellUser.svelte generated by Svelte v3.37.0 */
    const file$a = "src/common/components/shell/ShellUser.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let span0;
    	let t1_value = /*$user*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let span1;
    	let t4;
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				src: ChevronDown,
    				class: "w-6 h-6 ml-2 text-gray-900",
    				solid: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "$40.12";
    			t4 = space();
    			create_component(icon.$$.fragment);
    			attr_dev(img, "alt", "Profile");
    			if (img.src !== (img_src_value = "https://uifaces.co/our-content/donated/gPZwCbdS.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "w-12 h-12 rounded-full");
    			add_location(img, file$a, 6, 2, 193);
    			attr_dev(span0, "class", "text-md text-gray-900");
    			add_location(span0, file$a, 12, 4, 357);
    			attr_dev(span1, "class", "text-base text-gray-400");
    			add_location(span1, file$a, 13, 4, 417);
    			attr_dev(div0, "class", "flex flex-col ml-2");
    			add_location(div0, file$a, 11, 2, 320);
    			attr_dev(div1, "class", "flex items-center");
    			add_location(div1, file$a, 5, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, span1);
    			append_dev(div1, t4);
    			mount_component(icon, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$user*/ 1) && t1_value !== (t1_value = /*$user*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $user;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ShellUser", slots, []);
    	const { user } = authService;
    	validate_store(user, "user");
    	component_subscribe($$self, user, value => $$invalidate(0, $user = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShellUser> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Icon,
    		ChevronDown,
    		authService,
    		user,
    		$user
    	});

    	return [$user, user];
    }

    class ShellUser extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShellUser",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/common/components/shell/Shell.svelte generated by Svelte v3.37.0 */
    const file$9 = "src/common/components/shell/Shell.svelte";

    function create_fragment$a(ctx) {
    	let div2;
    	let sidebar;
    	let t0;
    	let main;
    	let div0;
    	let h1;
    	let t1;
    	let t2;
    	let shelluser;
    	let t3;
    	let div1;
    	let current;
    	sidebar = new Sidebar({ $$inline: true });
    	shelluser = new ShellUser({ $$inline: true });
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			create_component(shelluser.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", "text-3xl font-semibold text-gray-900");
    			add_location(h1, file$9, 11, 6, 399);
    			attr_dev(div0, "class", "flex border-b border-gray-200 justify-between items-center bg-white mx-auto px-8 py-5");
    			add_location(div0, file$9, 8, 4, 282);
    			attr_dev(div1, "class", "mx-auto px-4 sm:px-6 md:px-8 py-6");
    			add_location(div1, file$9, 14, 4, 496);
    			attr_dev(main, "class", "flex-1 relative overflow-y-auto focus:outline-none");
    			add_location(main, file$9, 7, 2, 212);
    			attr_dev(div2, "class", "h-screen flex overflow-hidden bg-gray-100");
    			add_location(div2, file$9, 5, 0, 140);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			mount_component(sidebar, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, main);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t1);
    			append_dev(div0, t2);
    			mount_component(shelluser, div0, null);
    			append_dev(main, t3);
    			append_dev(main, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(shelluser.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(shelluser.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(sidebar);
    			destroy_component(shelluser);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Shell", slots, ['default']);
    	let { title } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shell> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Sidebar, ShellUser, title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, $$scope, slots];
    }

    class Shell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shell",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Shell> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Shell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Shell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/common/components/card/Card.svelte generated by Svelte v3.37.0 */

    const file$8 = "src/common/components/card/Card.svelte";

    // (5:2) {#if title}
    function create_if_block(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let h3;
    	let t;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t = text(/*title*/ ctx[0]);
    			attr_dev(h3, "class", "text-xl leading-6 font-medium text-gray-900");
    			add_location(h3, file$8, 8, 10, 306);
    			attr_dev(div0, "class", "ml-4 mt-2");
    			add_location(div0, file$8, 7, 8, 272);
    			attr_dev(div1, "class", "-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap");
    			add_location(div1, file$8, 6, 6, 179);
    			attr_dev(div2, "class", "mx-4 pt-6 pb-3 sm:mx-6");
    			add_location(div2, file$8, 5, 4, 136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(5:2) {#if title}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current;
    	let if_block = /*title*/ ctx[0] && create_if_block(ctx);
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "px-4 py-5 sm:px-6");
    			add_location(div0, file$8, 13, 2, 424);
    			attr_dev(div1, "class", "bg-white shadow overflow-hidden rounded-md w-full h-full");
    			add_location(div1, file$8, 3, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*title*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	let { title } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, $$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Card> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createChart(ctx, type, labels, datasets, options) {
        return new Chart(ctx, {
            type,
            data: { labels, datasets },
            options: Object.assign(Object.assign({}, options), { plugins: {
                    legend: { display: false, labels: { font: { size: 18 } } },
                    tooltip: { enabled: false },
                }, scales: {
                    x: {
                        grid: { display: false, borderColor: "#F3F4F6" },
                        ticks: { font: { size: 16, family: "Inter" }, color: "rgb(156, 163, 175)" },
                    },
                    y: {
                        grid: { drawBorder: false, color: "#F3F4F6" },
                        ticks: { font: { size: 16, family: "Inter" }, color: "rgb(156, 163, 175)" },
                    },
                } }),
        });
    }

    function toInteger(dirtyNumber) {
      if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
        return NaN;
      }

      var number = Number(dirtyNumber);

      if (isNaN(number)) {
        return number;
      }

      return number < 0 ? Math.ceil(number) : Math.floor(number);
    }

    function requiredArgs(required, args) {
      if (args.length < required) {
        throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
      }
    }

    /**
     * @name toDate
     * @category Common Helpers
     * @summary Convert the given argument to an instance of Date.
     *
     * @description
     * Convert the given argument to an instance of Date.
     *
     * If the argument is an instance of Date, the function returns its clone.
     *
     * If the argument is a number, it is treated as a timestamp.
     *
     * If the argument is none of the above, the function returns Invalid Date.
     *
     * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
     *
     * @param {Date|Number} argument - the value to convert
     * @returns {Date} the parsed date in the local time zone
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // Clone the date:
     * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
     * //=> Tue Feb 11 2014 11:30:30
     *
     * @example
     * // Convert the timestamp to date:
     * const result = toDate(1392098430000)
     * //=> Tue Feb 11 2014 11:30:30
     */

    function toDate(argument) {
      requiredArgs(1, arguments);
      var argStr = Object.prototype.toString.call(argument); // Clone the date

      if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
        // Prevent the date to lose the milliseconds when passed to new Date() in IE10
        return new Date(argument.getTime());
      } else if (typeof argument === 'number' || argStr === '[object Number]') {
        return new Date(argument);
      } else {
        if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"); // eslint-disable-next-line no-console

          console.warn(new Error().stack);
        }

        return new Date(NaN);
      }
    }

    /**
     * @name addMilliseconds
     * @category Millisecond Helpers
     * @summary Add the specified number of milliseconds to the given date.
     *
     * @description
     * Add the specified number of milliseconds to the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of milliseconds to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} the new date with the milliseconds added
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
     * const result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
     * //=> Thu Jul 10 2014 12:45:30.750
     */

    function addMilliseconds(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var timestamp = toDate(dirtyDate).getTime();
      var amount = toInteger(dirtyAmount);
      return new Date(timestamp + amount);
    }

    var MILLISECONDS_IN_HOUR = 3600000;
    /**
     * @name addHours
     * @category Hour Helpers
     * @summary Add the specified number of hours to the given date.
     *
     * @description
     * Add the specified number of hours to the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of hours to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} the new date with the hours added
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Add 2 hours to 10 July 2014 23:00:00:
     * const result = addHours(new Date(2014, 6, 10, 23, 0), 2)
     * //=> Fri Jul 11 2014 01:00:00
     */

    function addHours(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var amount = toInteger(dirtyAmount);
      return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_HOUR);
    }

    /**
     * @name subHours
     * @category Hour Helpers
     * @summary Subtract the specified number of hours from the given date.
     *
     * @description
     * Subtract the specified number of hours from the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of hours to be subtracted. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} the new date with the hours subtracted
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Subtract 2 hours from 11 July 2014 01:00:00:
     * const result = subHours(new Date(2014, 6, 11, 1, 0), 2)
     * //=> Thu Jul 10 2014 23:00:00
     */

    function subHours(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var amount = toInteger(dirtyAmount);
      return addHours(dirtyDate, -amount);
    }

    function arrayFromRange(j, k) {
        return Array.apply(null, Array(k - j + 1)).map(function (_, n) {
            return n + j;
        });
    }

    /* src/trading/components/TradingPriceHistory.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file$7 = "src/trading/components/TradingPriceHistory.svelte";

    // (30:0) <Card title="Price History" headerBg="bg-white" headerBorder="border-0">
    function create_default_slot$7(ctx) {
    	let canvas;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "id", "priceHistoryChart");
    			attr_dev(canvas, "class", "w-full");
    			add_location(canvas, file$7, 30, 2, 900);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(30:0) <Card title=\\\"Price History\\\" headerBg=\\\"bg-white\\\" headerBorder=\\\"border-0\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				title: "Price History",
    				headerBg: "bg-white",
    				headerBorder: "border-0",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TradingPriceHistory", slots, []);
    	
    	let chart;
    	let interval = 1;

    	let labels = arrayFromRange(1, 10).map((_, i) => {
    		const date = subHours(new Date(), i * interval);
    		return `${date.getHours()} h`;
    	}).reverse();

    	console.log(labels);

    	let dataset = [
    		{
    			fill: true,
    			backgroundColor: "#00966922",
    			borderColor: "#009669",
    			data: [0, 10, 5, 2, 20, 30, 45, 30, 30, 50]
    		}
    	];

    	onMount(() => {
    		const canvas = document.getElementById("priceHistoryChart");
    		chart = createChart(canvas.getContext("2d"), "line", labels, dataset);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TradingPriceHistory> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Card,
    		onMount,
    		createChart,
    		subHours,
    		arrayFromRange,
    		chart,
    		interval,
    		labels,
    		dataset
    	});

    	$$self.$inject_state = $$props => {
    		if ("chart" in $$props) chart = $$props.chart;
    		if ("interval" in $$props) interval = $$props.interval;
    		if ("labels" in $$props) labels = $$props.labels;
    		if ("dataset" in $$props) dataset = $$props.dataset;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class TradingPriceHistory extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TradingPriceHistory",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/trading/components/TradingPricesLatest.svelte generated by Svelte v3.37.0 */
    const file$6 = "src/trading/components/TradingPricesLatest.svelte";

    // (6:0) <Card>
    function create_default_slot$6(ctx) {
    	let div2;
    	let div0;
    	let span1;
    	let t0;
    	let span0;
    	let t2;
    	let span2;
    	let t4;
    	let div1;
    	let span3;
    	let icon;
    	let t5;
    	let current;

    	icon = new Icon({
    			props: {
    				src: ArrowUp,
    				class: "w-4 h-4 text-green-500 mr-2",
    				solid: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span1 = element("span");
    			t0 = text("$1.18 ");
    			span0 = element("span");
    			span0.textContent = "/ kWh";
    			t2 = space();
    			span2 = element("span");
    			span2.textContent = "Last 24 hours";
    			t4 = space();
    			div1 = element("div");
    			span3 = element("span");
    			create_component(icon.$$.fragment);
    			t5 = text("\n        3.53%");
    			attr_dev(span0, "class", "text-sm text-gray-500 font-normal");
    			add_location(span0, file$6, 9, 14, 283);
    			attr_dev(span1, "class", "text-2xl font-semibold");
    			add_location(span1, file$6, 8, 6, 231);
    			attr_dev(span2, "class", "text-md text-gray-500");
    			add_location(span2, file$6, 11, 6, 365);
    			attr_dev(div0, "class", "flex flex-col");
    			add_location(div0, file$6, 7, 4, 197);
    			attr_dev(span3, "class", "flex bg-green-100 text-green-800 px-2 rounded-full font-semibold items-center");
    			add_location(span3, file$6, 14, 6, 449);
    			add_location(div1, file$6, 13, 4, 437);
    			attr_dev(div2, "class", "flex justify-between items-center");
    			add_location(div2, file$6, 6, 2, 145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span1);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(div0, t2);
    			append_dev(div0, span2);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, span3);
    			mount_component(icon, span3, null);
    			append_dev(span3, t5);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(6:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TradingPricesLatest", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TradingPricesLatest> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Card, Icon, ArrowUp });
    	return [];
    }

    class TradingPricesLatest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TradingPricesLatest",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/trading/components/TradingPricesSettings.svelte generated by Svelte v3.37.0 */
    const file$5 = "src/trading/components/TradingPricesSettings.svelte";

    // (6:0) <Card title="My Prices">
    function create_default_slot$5(ctx) {
    	let form;
    	let div0;
    	let label0;
    	let t0;
    	let span0;
    	let t2;
    	let input0;
    	let t3;
    	let div1;
    	let label1;
    	let t4;
    	let span1;
    	let t6;
    	let input1;
    	let t7;
    	let div2;
    	let button;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Sell Price ");
    			span0 = element("span");
    			span0.textContent = "$ / kWh";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t4 = text("Buy Price ");
    			span1 = element("span");
    			span1.textContent = "$ / kWh";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Save";
    			attr_dev(span0, "class", "text-sm text-gray-500");
    			add_location(span0, file$5, 9, 20, 277);
    			attr_dev(label0, "for", "sellPrice");
    			attr_dev(label0, "class", "text-gray-800");
    			add_location(label0, file$5, 8, 6, 212);
    			attr_dev(input0, "class", "input mt-1");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "0.01");
    			attr_dev(input0, "step", "0.01");
    			attr_dev(input0, "placeholder", "1.02");
    			add_location(input0, file$5, 11, 6, 350);
    			attr_dev(div0, "class", "mb-8");
    			add_location(div0, file$5, 7, 4, 187);
    			attr_dev(span1, "class", "text-sm text-gray-500");
    			add_location(span1, file$5, 15, 19, 539);
    			attr_dev(label1, "for", "sellPrice");
    			attr_dev(label1, "class", "text-gray-800");
    			add_location(label1, file$5, 14, 6, 475);
    			attr_dev(input1, "class", "input mt-1");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0.01");
    			attr_dev(input1, "step", "0.01");
    			attr_dev(input1, "placeholder", "1.02");
    			add_location(input1, file$5, 17, 6, 612);
    			attr_dev(div1, "class", "mb-8");
    			add_location(div1, file$5, 13, 4, 450);
    			attr_dev(button, "class", "btn text-lg");
    			add_location(button, file$5, 20, 6, 733);
    			attr_dev(div2, "class", "");
    			add_location(div2, file$5, 19, 4, 712);
    			add_location(form, file$5, 6, 2, 176);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, span0);
    			append_dev(div0, t2);
    			append_dev(div0, input0);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(label1, t4);
    			append_dev(label1, span1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			append_dev(form, t7);
    			append_dev(form, div2);
    			append_dev(div2, button);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(6:0) <Card title=\\\"My Prices\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				title: "My Prices",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TradingPricesSettings", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TradingPricesSettings> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Card, TradingPricesLatest });
    	return [];
    }

    class TradingPricesSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TradingPricesSettings",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/trading/routes/Trading.svelte generated by Svelte v3.37.0 */
    const file$4 = "src/trading/routes/Trading.svelte";

    // (8:0) <Shell title="Trading">
    function create_default_slot$4(ctx) {
    	let div4;
    	let div0;
    	let tradingpricehistory;
    	let t0;
    	let div3;
    	let div2;
    	let div1;
    	let tradingpriceslatest;
    	let t1;
    	let tradingpricessettings;
    	let current;
    	tradingpricehistory = new TradingPriceHistory({ $$inline: true });
    	tradingpriceslatest = new TradingPricesLatest({ $$inline: true });
    	tradingpricessettings = new TradingPricesSettings({ $$inline: true });

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			create_component(tradingpricehistory.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			create_component(tradingpriceslatest.$$.fragment);
    			t1 = space();
    			create_component(tradingpricessettings.$$.fragment);
    			attr_dev(div0, "class", "col-span-12 lg:col-span-8");
    			add_location(div0, file$4, 9, 4, 392);
    			attr_dev(div1, "class", "pb-8");
    			add_location(div1, file$4, 14, 8, 559);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$4, 13, 6, 523);
    			attr_dev(div3, "class", "col-span-12 lg:col-span-4");
    			add_location(div3, file$4, 12, 4, 477);
    			attr_dev(div4, "class", "grid grid-cols-12 gap-8");
    			add_location(div4, file$4, 8, 2, 350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(tradingpricehistory, div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			mount_component(tradingpriceslatest, div1, null);
    			append_dev(div2, t1);
    			mount_component(tradingpricessettings, div2, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tradingpricehistory.$$.fragment, local);
    			transition_in(tradingpriceslatest.$$.fragment, local);
    			transition_in(tradingpricessettings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tradingpricehistory.$$.fragment, local);
    			transition_out(tradingpriceslatest.$$.fragment, local);
    			transition_out(tradingpricessettings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(tradingpricehistory);
    			destroy_component(tradingpriceslatest);
    			destroy_component(tradingpricessettings);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(8:0) <Shell title=\\\"Trading\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let shell;
    	let current;

    	shell = new Shell({
    			props: {
    				title: "Trading",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Trading", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Trading> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		TradingPriceHistory,
    		TradingPricesLatest,
    		TradingPricesSettings
    	});

    	return [];
    }

    class Trading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Trading",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var tradingRoutes = {
        "/trading": wrap$1({
            component: Trading,
            conditions: [async () => await authService.isLoggedIn()],
        }),
    };

    /* src/wallet/components/WalletBalance.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/wallet/components/WalletBalance.svelte";

    // (5:0) <Card>
    function create_default_slot$3(ctx) {
    	let div2;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let div1;
    	let button;
    	let icon;
    	let t4;
    	let current;

    	icon = new Icon({
    			props: { src: Plus, class: "w-6 h-6 mr-1" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "150.00 ℏ";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "≈ $15.0";
    			t3 = space();
    			div1 = element("div");
    			button = element("button");
    			create_component(icon.$$.fragment);
    			t4 = text("\n        Funds");
    			attr_dev(span0, "class", "text-3xl text-gray-800 font-semibold");
    			add_location(span0, file$3, 7, 6, 233);
    			attr_dev(span1, "class", "text-lg text-gray-400 font-medium");
    			add_location(span1, file$3, 8, 6, 306);
    			attr_dev(div0, "class", "flex flex-col");
    			add_location(div0, file$3, 6, 4, 199);
    			attr_dev(button, "class", "btn flex items-center");
    			add_location(button, file$3, 11, 6, 396);
    			add_location(div1, file$3, 10, 4, 384);
    			attr_dev(div2, "class", "flex justify-between items-center");
    			add_location(div2, file$3, 5, 2, 147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			mount_component(icon, button, null);
    			append_dev(button, t4);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(5:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WalletBalance", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WalletBalance> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Card, Icon, Plus });
    	return [];
    }

    class WalletBalance extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WalletBalance",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/wallet/components/WalletInformation.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/wallet/components/WalletInformation.svelte";

    // (6:0) <Card title="Informations">
    function create_default_slot$2(ctx) {
    	let dl0;
    	let div0;
    	let dt0;
    	let t1;
    	let dd0;
    	let t3;
    	let dl1;
    	let div1;
    	let dt1;
    	let t5;
    	let dd1;
    	let t7;
    	let button;
    	let icon;
    	let t8;
    	let current;

    	icon = new Icon({
    			props: { src: Download, class: "w-6 h-6 mr-1" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			dl0 = element("dl");
    			div0 = element("div");
    			dt0 = element("dt");
    			dt0.textContent = "Account Id";
    			t1 = space();
    			dd0 = element("dd");
    			dd0.textContent = "0.0.14240";
    			t3 = space();
    			dl1 = element("dl");
    			div1 = element("div");
    			dt1 = element("dt");
    			dt1.textContent = "Public Key";
    			t5 = space();
    			dd1 = element("dd");
    			dd1.textContent = "1291hfubasfuabsu";
    			t7 = space();
    			button = element("button");
    			create_component(icon.$$.fragment);
    			t8 = text("\n    Private Key");
    			attr_dev(dt0, "class", "text-sm font-medium text-gray-500");
    			add_location(dt0, file$2, 8, 6, 275);
    			attr_dev(dd0, "class", "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2");
    			add_location(dd0, file$2, 9, 6, 343);
    			attr_dev(div0, "class", "py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 ");
    			add_location(div0, file$2, 7, 4, 209);
    			attr_dev(dl0, "class", "border-b border-gray-200");
    			add_location(dl0, file$2, 6, 2, 167);
    			attr_dev(dt1, "class", "text-sm font-medium text-gray-500");
    			add_location(dt1, file$2, 14, 6, 528);
    			attr_dev(dd1, "class", "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2");
    			add_location(dd1, file$2, 15, 6, 596);
    			attr_dev(div1, "class", "py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 ");
    			add_location(div1, file$2, 13, 4, 462);
    			attr_dev(dl1, "class", "mb-8");
    			add_location(dl1, file$2, 12, 2, 440);
    			attr_dev(button, "class", "btn-secundary flex items-center");
    			add_location(button, file$2, 18, 2, 700);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dl0, anchor);
    			append_dev(dl0, div0);
    			append_dev(div0, dt0);
    			append_dev(div0, t1);
    			append_dev(div0, dd0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, dl1, anchor);
    			append_dev(dl1, div1);
    			append_dev(div1, dt1);
    			append_dev(div1, t5);
    			append_dev(div1, dd1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button, anchor);
    			mount_component(icon, button, null);
    			append_dev(button, t8);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dl0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(dl1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(6:0) <Card title=\\\"Informations\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				title: "Informations",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WalletInformation", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WalletInformation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Card, Icon, Download });
    	return [];
    }

    class WalletInformation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WalletInformation",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/wallet/components/WalletTransactions.svelte generated by Svelte v3.37.0 */

    // (5:0) <Card title="Transactions">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("1234");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(5:0) <Card title=\\\"Transactions\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				title: "Transactions",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WalletTransactions", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WalletTransactions> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Card });
    	return [];
    }

    class WalletTransactions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WalletTransactions",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/wallet/routes/Wallet.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/wallet/routes/Wallet.svelte";

    // (8:0) <Shell title="Wallet">
    function create_default_slot(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let walletbalance;
    	let t0;
    	let walletinformation;
    	let t1;
    	let div2;
    	let wallettransactions;
    	let current;
    	walletbalance = new WalletBalance({ $$inline: true });
    	walletinformation = new WalletInformation({ $$inline: true });
    	wallettransactions = new WalletTransactions({ $$inline: true });

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(walletbalance.$$.fragment);
    			t0 = space();
    			create_component(walletinformation.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(wallettransactions.$$.fragment);
    			attr_dev(div0, "class", "mb-8");
    			add_location(div0, file$1, 10, 6, 429);
    			attr_dev(div1, "class", "flex flex-col col-span-12 lg:col-span-4");
    			add_location(div1, file$1, 9, 4, 369);
    			attr_dev(div2, "class", "col-span-12 lg:col-span-8");
    			add_location(div2, file$1, 15, 4, 530);
    			attr_dev(div3, "class", "grid grid-cols-12 gap-8");
    			add_location(div3, file$1, 8, 2, 327);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			mount_component(walletbalance, div0, null);
    			append_dev(div1, t0);
    			mount_component(walletinformation, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(wallettransactions, div2, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(walletbalance.$$.fragment, local);
    			transition_in(walletinformation.$$.fragment, local);
    			transition_in(wallettransactions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(walletbalance.$$.fragment, local);
    			transition_out(walletinformation.$$.fragment, local);
    			transition_out(wallettransactions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(walletbalance);
    			destroy_component(walletinformation);
    			destroy_component(wallettransactions);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(8:0) <Shell title=\\\"Wallet\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let shell;
    	let current;

    	shell = new Shell({
    			props: {
    				title: "Wallet",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Wallet", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Wallet> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		WalletBalance,
    		WalletInformation,
    		WalletTransactions
    	});

    	return [];
    }

    class Wallet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wallet",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var walletRoutes = {
        "/wallet": wrap$1({
            component: Wallet,
            conditions: [async () => await authService.isLoggedIn()],
        }),
    };

    /* src/App.svelte generated by Svelte v3.37.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				routes: {
    					...authRoutes,
    					...tradingRoutes,
    					...walletRoutes
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(router.$$.fragment);
    			add_location(div, file, 11, 0, 360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(router, div, null);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	onMount(() => {
    		Chart.register(...registerables);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Chart,
    		registerables,
    		onMount,
    		Router,
    		authRoutes,
    		tradingRoutes,
    		walletRoutes
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    let baseUrl = "http://localhost:8080";
    async function request(endpoint, method, body) {
        try {
            const req = await fetch(`${baseUrl}${endpoint}`, {
                method: method,
                body: body ? JSON.stringify(body) : undefined,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
            });
            if (req.ok) {
                return { status: req.status, data: await req.json().catch(() => { }) };
            }
            return { status: req.status, error: await req.json().catch(() => { }) };
        }
        catch (e) {
            console.error(e);
        }
    }

    class AuthService {
        constructor() {
            this.user = writable({});
        }
        async login(dto) {
            const { data } = await request("/users/login", "POST", dto);
            localStorage.setItem("token", data.accessToken);
        }
        async register(dto) {
            return request("/users/register", "POST", dto);
        }
        async details() {
            return request("/users/details", "GET");
        }
        async isLoggedIn() {
            if (!localStorage.getItem("token")) {
                return false;
            }
            try {
                if (!get_store_value(this.user).email) {
                    const { data } = await this.details();
                    this.user.set(data);
                    console.log(this.user);
                }
                return true;
            }
            catch (e) {
                return false;
            }
        }
    }

    const authService = new AuthService();
    const app = new App({ target: document.body });

    exports.authService = authService;
    exports.default = app;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
