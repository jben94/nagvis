/*****************************************************************************
 *
 * ViewWorldmap.js - All NagVis worldmap related top level code
 *
 * Copyright (c) 2004-2015 NagVis Project (Contact: info@nagvis.org)
 *
 * License:
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 *****************************************************************************/

var ViewWorldmap = ViewMap.extend({
    constructor: function(id) {
        this.base(id);
    },

    init: function() {
        this.initWorldmap();
        this.base();
    },

    drawObject: function(obj) {
        var latlng = g_map.containerPointToLatLng(L.point(0, 0));
        L.nagVisMarker(latlng, {
            icon: L.nagVisObj({node: obj.dom_obj, obj: obj}),
            // prevent using leaflets event handlers
            clickable: false,
            // Would be nice to use but is problematic with the line canvas objects
            // which will hide objects which are located behind them
            //riseOnHover: true,
            // Put lines one layer behind all other objects to fix canvas hiding
            // the other objects
            zIndexOffset: obj.conf.view_type === 'line' ? -1 : 0
        }).addTo(g_map_objects);
    },

    eraseObject: function(obj) {},

    /**
     * END OF PUBLIC METHODS
     */

    initWorldmap: function() {
        L.Icon.Default.imagePath = oGeneralProperties.path_base+'/frontend/nagvis-js/images/leaflet';
        g_map = L.map('map', {
            markerZoomAnimation: false,
            maxBounds: [ [-85,-180.0], [85,180.0] ],
            minZoom: 2
        }).setView(getViewParam('worldmap_center').split(','), parseInt(getViewParam('worldmap_zoom')));
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            noWrap: true, // don't repeat the world on horizontal axe
            detectRetina: true, // look nice on high resolution screens
        }).addTo(g_map);

        g_map_objects = L.layerGroup().addTo(g_map);

        // The worldmap is showing it's objects depending on the objects
        // which are visible on the screen. This is realized by issueing
        // an ajax call with the current viewport to the core code, which
        // then returns a list of objects to add to the map depending on
        // this viewport.
        g_map.on('moveend', this.handleMoveEnd.bind(this));

        // hide eventual open header dropdown menus when clicking on the map
        g_map.on('mousedown', checkHideMenu);
        g_map.on('mousedown', context_handle_global_mousedown);
    },

    // Is used to update the objects to show on the worldmap
    handleMoveEnd: function(e) {
        this.render(); // re-render the whole map

        // Update the related view properties
        var ll = g_map.getCenter();
        setViewParam('worldmap_center', ll.lat+','+ll.lng);
        setViewParam('worldmap_zoom', g_map.getZoom());
    },

    saveView: function() {
        call_ajax(oGeneralProperties.path_server+'?mod=Map&act=modifyObject&map='
                  + this.id + '&type=global&id=0'
                  + '&worldmap_center='+getViewParam('worldmap_center')
                  + '&worldmap_zoom='+getViewParam('worldmap_zoom'));
    },

    // Scale the map to a viewport showing all objects at once
    scaleToAll: function() {
        call_ajax(oGeneralProperties.path_server+'?mod=Map&act=getWorldmapBounds'
                  + '&show=' + this.id, {
            response_handler: this.handleScaleToAll.bind(this),
        });
    },

    handleScaleToAll: function(data) {
        g_map.fitBounds(data);
    },

    project: function(lat, lng) {
        var new_coord, x = [], y = [];
        for (var i = 0; i < lat.length; i++) {
            new_coord = g_map.latLngToContainerPoint(L.latLng(parseFloat(lat[i]), parseFloat(lng[i])));
            x.push(new_coord.x);
            y.push(new_coord.y);
        }
        return [x, y];
    },

    // converts an a single or an array of XY coordinates to latlng coordinates
    // based on the current visible viewport
    unproject: function(x, y) {
        if (typeof x !== 'object') {
            x = [x];
            y = [y];
        }

        var latlng, lat = [], lng = [];
        for (var i = 0, l = x.length; i < l; i++) {
            latlng = g_map.containerPointToLatLng(L.point(x[i], y[i]));
            lat[i] = latlng.lat;
            lng[i] = latlng.lng;
        }

        return [lat, lng];
    }
});

// Wrapper object for the worldmap (similar to leaflet js DivIcon, but
// support adding an existing domNode)
L.NagVisObj = L.Icon.extend({
    options: {
        // Is set later by onAdd function to respect the real icon size
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        className: 'leaflet-nagvis-obj',
        node: null,
        obj: null,
    },

    createIcon: function (oldIcon) {
        var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
            options = this.options;

        // remove all existing childs
        for(var i = div.childNodes.length; i > 0; i--)
            div.removeChild(div.childNodes[0]);

        if (options.node !== null) {
            div.appendChild(options.node);
        }

        this._setIconStyles(div, 'icon');
        this._applyOffset();
        return div;
    },

    _applyOffset: function() {
        // Fix icon position which is not automatically fixed by this._setIconStyles because we
        // enforce iconAnchor: [0, 0].
        var offset = L.point(this.options.iconSize);
        offset._divideBy(2);
        this.options.obj.trigger_obj.style.marginLeft = (-offset.x) + 'px';
        this.options.obj.trigger_obj.style.marginTop  = (-offset.y) + 'px';
    },

    createShadow: function () {
        return null;
    }
});

L.nagVisObj = function (options) {
    return new L.NagVisObj(options);
};

L.NagVisMarker = L.Marker.extend({
    initialize: function (latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);

        this.on('add', this._onAdd, this);
        //this.on('mousemove', this._onMouseMove, this);
    },

    // Update the size off the icon to make the object being centered
    _onAdd: function(lEvent) {
        var icon = this.options.icon,
            obj = icon.options.obj,
            trigger_obj = icon.options.obj.trigger_obj,
            w = trigger_obj.clientWidth,
            h = trigger_obj.clientHeight;

        icon.options.iconSize = [w, h];
        icon._applyOffset();
    },

    //_onMouseMove: function (event) {
    //    console.log('hover');
    //    var element = this.options.icon.options.obj.trigger_obj;
    //    console.log(element);
    //    //if (document.createEvent) {
    //    //    element.dispatchEvent(event.originalEvent);
    //    //} else {
    //    //    element.fireEvent("onmousemove", event.originalEvent);
    //    //}
    //}
});

L.nagVisMarker = function (ll, options) {
    return new L.NagVisMarker(ll, options);
};