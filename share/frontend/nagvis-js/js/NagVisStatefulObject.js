/*****************************************************************************
 *
 * NagVisObject.js - This class handles the visualisation of statefull objects
 *
 * Copyright (c) 2004-2011 NagVis Project (Contact: info@nagvis.org)
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
 
/**
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */

var NagVisStatefulObject = NagVisObject.extend({
	// Stores the information from last refresh (Needed for change detection)
	last_state: null,
	// Array of member objects
	members: [],
	
	constructor: function(oConf) {
		// Call parent constructor
		this.base(oConf);
	},
	
	getMembers: function() {
		// Clear member array on every launch
		this.members = [];
		
		if(this.conf && this.conf.members && this.conf.members.length > 0) {
			for(var i = 0, len = this.conf.members.length; i < len; i++) {
				var oMember = this.conf.members[i];
				var oObj;
				
				switch (oMember.type) {
					case 'host':
						oObj = new NagVisHost(oMember);
					break;
					case 'service':
						oObj = new NagVisService(oMember);
					break;
					case 'hostgroup':
						oObj = new NagVisHostgroup(oMember);
					break;
					case 'servicegroup':
						oObj = new NagVisServicegroup(oMember);
					break;
					case 'map':
						oObj = new NagVisMap(oMember);
					break;
					case 'textbox':
						oObj = new NagVisTextbox(oMember);
					break;
					case 'shape':
						oObj = new NagVisShape(oMember);
					break;
					case 'line':
						oObj = new NagVisLine(oMember);
					break;
					default:
						alert('Error: Unknown member object type ('+oMember.type+')');
					break;
				}
				
				if(oObj !== null) {
					this.members.push(oObj);
				}
				
				oObj = null;
				oMember = null;
			}
		}
	},
	
	/**
	 * PUBLIC saveLastState()
	 *
	 * Saves the current state in last state array for later change detection
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	saveLastState: function() {
		this.last_state = {
		  'summary_state': this.conf.summary_state,
			'summary_in_downtime': this.conf.summary_in_downtime,
			'summary_problem_has_been_acknowledged': this.conf.summary_problem_has_been_acknowledged,
			'output': this.conf.output,
			'perfdata': this.conf.perfdata
		};
	},
	
	/**
	 * PUBLIC stateChanged()
	 *
	 * Check if a state change occured since last refresh
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	stateChanged: function() {
		if(this.conf.summary_state != this.last_state.summary_state || 
		   this.conf.summary_problem_has_been_acknowledged != this.last_state.summary_problem_has_been_acknowledged || 
		   this.conf.summary_in_downtime != this.last_state.summary_in_downtime) {
			return true;
		} else {
			return false;
		}
	},
	
	/**
	 * PUBLIC stateChangedToWorse()
	 *
	 * Check if a state change occured to a worse state
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	stateChangedToWorse: function() {
		var lastSubState = 'normal';
		if(this.last_state.summary_problem_has_been_acknowledged && this.last_state.summary_problem_has_been_acknowledged === 1) {
			lastSubState = 'ack';
		} else if(this.last_state.summary_in_downtime && this.last_state.summary_in_downtime == 1) {
			lastSubState = 'downtime';
		}

		// If there is no "last state" return true here
		if(!this.last_state.summary_state) {
			return true;
		}
		
		var lastWeight = oStates[this.last_state.summary_state][lastSubState];
		
		var subState = 'normal';
		if(this.conf.summary_problem_has_been_acknowledged && this.conf.summary_problem_has_been_acknowledged === 1) {
			subState = 'ack';
		} else if(this.conf.summary_in_downtime && this.conf.summary_in_downtime === 1) {
			subState = 'downtime';
		}
		
		var weight = oStates[this.conf.summary_state][subState];
		
		return lastWeight < weight;
	},
	
	/**
	 * PUBLIC outputChanged()
	 *
	 * Check if an output/perfdata change occured since last refresh
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	outputOrPerfdataChanged: function() {
		return this.conf.output != this.last_state.output || this.conf.perfdata != this.last_state.perfdata;
	},
	
	/**
	 * PUBLIC parseAutomap()
	 *
	 * Parses the object on the automap
	 *
	 * @return	String		HTML code of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseAutomap: function () {
		if(!this.parsedObject) {
			// Only replace the macros on first parse
			this.replaceMacros();
		}
		
		// When this is an update, remove the object first
		this.remove();
		
		// Create container div
		var doc = document;
		var oContainerDiv = doc.createElement('div');
		oContainerDiv.setAttribute('id', this.conf.object_id);
		
		// Parse icon on automap
		var oIcon = this.parseAutomapIcon();
		oContainerDiv.appendChild(oIcon);
		oIcon = null;
		
		// Parse label when configured
		if(this.conf.label_show && this.conf.label_show == '1') {
			var oLabel = this.parseLabel();
			oContainerDiv.appendChild(oLabel);
			oLabel = null;
		}
    
    // Append child to map and save reference in parsedObject
		var oMap = doc.getElementById('map');
		if(oMap) {
			this.parsedObject = oMap.appendChild(oContainerDiv);
			oMap = null;
		}
		oContainerDiv = null;
		doc = null
	},
	
	/**
	 * PUBLIC parse()
	 *
	 * Parses the object
	 *
	 * @return	String		HTML code of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parse: function () {
		// Only replace the macros on first parse
		if(!this.parsedObject) {
			this.replaceMacros();
		}
		
		// When this is an update, remove the object first
		this.remove();
		
		// Create container div
		var doc = document;
		var oContainerDiv = doc.createElement('div');
		oContainerDiv.setAttribute('id', this.conf.object_id);
		
		// Parse object depending on line or normal icon
		switch(this.conf.view_type) {
			case 'line':
				oContainerDiv.appendChild(this.parseLine());
			break;
			case 'gadget':
				oContainerDiv.appendChild(this.parseGadget());
			break;
			default:
				oContainerDiv.appendChild(this.parseIcon());
			break;
		}
		
		// Parse label when configured
		if(this.conf.label_show && this.conf.label_show == '1') {
			var oLabel = this.parseLabel();
			oContainerDiv.appendChild(oLabel);
			oLabel = null;
		}
    
    // Append child to map and save reference in parsedObject
		var oMap = doc.getElementById('map');
		if(oMap) {
			this.parsedObject = oMap.appendChild(oContainerDiv);
			oMap = null;
		}
		oContainerDiv = null;
		doc = null;
		
		// Now really draw the line when this is one
		if(this.conf.view_type && this.conf.view_type == 'line')
			this.drawLine();

		// Enable the controls when the object is not locked
		if(!this.bIsLocked)
			this.parseControls();
	},
	
	remove: function () {
		if(this.parsedObject) {
			var doc = document;
			var oMap = doc.getElementById('map');
			if(!oMap) {
				doc = null;
				return;
			}

			var oObj;
			if(this.conf.view_type && this.conf.view_type === 'line') {
				oObj = doc.getElementById(this.conf.object_id+'-linediv');
			} else {
				oObj = doc.getElementById(this.conf.object_id+'-icon');
			}
			
			if(oObj) {
				// Remove event listeners
				oObj.onmousedown = null;
				oObj.oncontextmenu = null;
				oObj.onmouseover = null;
				oObj.onmouseout = null;
				oObj = null;
			}

			var oContext = doc.getElementById(this.conf.object_id+'-context');
			// Remove context menu
			// Needs to be removed after unsetting the eventhandlers
			if(oContext) {
				this.parsedObject.removeChild(oContext);
				oContext = null;
			}
			
			// Remove object from DOM
			oMap.removeChild(this.parsedObject);
			
			// Remove object reference
			this.parsedObject = null;
			
			oMap = null;
			doc = null;
		}
	},
	
	/**
	 * PUBLIC parseHoverMenu()
	 *
	 * Parses the hover menu. Don't add this functionality to the normal icon
	 * parsing
	 *
	 * @return	String		HTML code of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseHoverMenu: function () {
		if(this.conf.view_type && this.conf.view_type === 'line')
			this.getHoverMenu(this.conf.object_id+'-linelink');
		else
			this.getHoverMenu(this.conf.object_id+'-icon');
	},
	
	/**
	 * PUBLIC parseContextMenu()
	 *
	 * Parses the context menu. Don't add this functionality to the normal icon
	 * parsing
	 *
	 * @return	String		HTML code of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseContextMenu: function () {
    // Add a context menu to the object when enabled
    if(this.conf.context_menu && this.conf.context_menu == '1') {
      if(this.conf.view_type && this.conf.view_type == 'line') {
        this.getContextMenu(this.conf.object_id+'-linelink');
      } else {
        this.getContextMenu(this.conf.object_id+'-icon');
			}
    }
	},
	
	/**
	 * Replaces macros of urls and hover_urls
	 *
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	replaceMacros: function () {
		var name = '';
		if(this.conf.type == 'service') {
			name = 'host_name';
		} else {
			name = this.conf.type + '_name';
		}
		
		if(this.conf.url && this.conf.url !== '') {
			if(this.conf.htmlcgi && this.conf.htmlcgi !== '') {
				this.conf.url = this.conf.url.replace(getRegEx('htmlcgi', '\\[htmlcgi\\]', 'g'), this.conf.htmlcgi);
			} else {
				this.conf.url = this.conf.url.replace(getRegEx('htmlcgi', '\\[htmlcgi\\]', 'g'), oGeneralProperties.path_cgi);
			}
			
			this.conf.url = this.conf.url.replace(getRegEx('htmlbase', '\\[htmlbase\\]', 'g'), oGeneralProperties.path_base);
			
			this.conf.url = this.conf.url.replace(getRegEx(name, '\\['+name+'\\]', 'g'), this.conf.name);
			if(this.conf.type == 'service') {
				this.conf.url = this.conf.url.replace(getRegEx('service_description', '\\[service_description\\]', 'g'), this.conf.service_description);
			}

			if(this.conf.type != 'map') {
				this.conf.url = this.conf.url.replace(getRegEx('backend_id', '\\[backend_id\\]', 'g'), this.conf.backend_id);
			}
		}
		
		if(this.conf.hover_url && this.conf.hover_url !== '') {
			this.conf.hover_url = this.conf.hover_url.replace(getRegEx(name, '\\['+name+'\\]', 'g'), this.conf.name);
			if(this.conf.type == 'service') {
				this.conf.hover_url = this.conf.hover_url.replace(getRegEx('service_description', '\\[service_description\\]', 'g'), this.conf.service_description);
			}
		}
		
		// Replace static macros in label_text when needed
		if(this.conf.label_text && this.conf.label_text !== '') {
			var objName;
			// For maps use the alias as display string
			if(this.conf.type == 'map') {
				objName = this.conf.alias;   
			} else {
				objName = this.conf.name;
			}
			
			this.conf.label_text = this.conf.label_text.replace(getRegEx('name', '\\[name\\]', 'g'), objName);
			this.conf.label_text = this.conf.label_text.replace(getRegEx('alias', '\\[alias\\]', 'g'), this.conf.alias);
			
			if(this.conf.type == 'service') {
				this.conf.label_text = this.conf.label_text.replace(getRegEx('service_description', '\\[service_description\\]', 'g'), this.conf.service_description);
			}
		}
	},
	
	/**
	 * Replaces dynamic macros which need to be updated on every state refresh
	 *
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	replaceLabelTextDynamicMacros: function () {
		var sReturn = this.conf.label_text;
		
		// Replace static macros in label_text when needed
		if(sReturn && sReturn !== '') {
			sReturn = sReturn.replace(getRegEx('output', '\\[output\\]', 'g'), this.conf.output);
			
			if(this.conf.type == 'service' || this.conf.type == 'host') {
				sReturn = sReturn.replace(getRegEx('perfdata', '\\[perfdata\\]', 'g'), this.conf.perfdata);
			}
		}
		
		return sReturn;
	},
	
	/**
	 * Parses the HTML-Code of a line
	 *
	 * @return	String		HTML code
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseLine: function () {
		// Create container div
		var doc = document;
		var oContainerDiv = doc.createElement('div');
		oContainerDiv.setAttribute('id', this.conf.object_id+'-linediv');
		
		// Create line div
		var oLineDiv = doc.createElement('div');
		oLineDiv.setAttribute('id', this.conf.object_id+'-line');
		oLineDiv.style.zIndex = this.conf.z;
		
		oContainerDiv.appendChild(oLineDiv);
		oLineDiv = null;
		
		// Parse hover/link area only when needed. This is only the container
		// The real area or labels are added later
		if((this.conf.url && this.conf.url !== '' && this.conf.url !== '#') || (this.conf.hover_menu && this.conf.hover_menu !== '')) {
			var oLink = doc.createElement('a');
			oLink.setAttribute('id', this.conf.object_id+'-linelink');
			oLink.setAttribute('class', 'linelink');
			oLink.setAttribute('className', 'linelink');
			oLink.href = this.conf.url;
			oLink.target = this.conf.url_target;
			
			oContainerDiv.appendChild(oLink);
			oLink = null;
		}
		
		doc = null;
		return oContainerDiv;
	},
	
	/**
	 * Draws the NagVis lines on the already added divs.
	 *
	 * @return	String		HTML code
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	drawLine: function() {
		var x = this.parseCoords(this.conf.x, 'x');
		var y = this.parseCoords(this.conf.y, 'y');
		
		var width = this.conf.line_width;
		
		var colorFill = '';
		var colorFill2 = '';
		var colorBorder = '#000000';

		var setPerfdata = [];
		setPerfdata[0] = Array('dummyPercentIn', 88, '%', 85, 98, 0, 100);
		setPerfdata[1] = Array('dummyPercentOut', 99, '%', 85, 98, 0, 100);
		setPerfdata[2] = Array('dummyActualIn', 88.88, 'mB/s', 850, 980, 0, 1000);
		setPerfdata[3] = Array('dummyActualOut', 99.99, 'mB/s', 850, 980, 0, 1000);
		
		// Get the fill color depending on the object state
		switch (this.conf.summary_state) {
	    case 'UNREACHABLE':
			case 'DOWN':
			case 'CRITICAL':
			case 'WARNING':
			case 'UNKNOWN':
			case 'ERROR':
			case 'UP':
			case 'OK':
			case 'PENDING':
				colorFill = oStates[this.conf.summary_state].color;
			break;
			default:
				colorFill = '#FFCC66';
			break;
	  }

		// Adjust fill color based on perfdata for weathermap lines
		if(this.conf.line_type == 13 || this.conf.line_type == 14) {
			colorFill = '#000000';
			colorFill2 = '#000000';

			// Convert perfdata to structured array
			setPerfdata = splicePerfdata(this.conf.perfdata);

			// array index returned from splice function
			/* 0 = label
			   1 = value
			   2 = unit of measure (UOM)
			   3 = warning
			   4 = critical
			   5 = minimum
			   6 = maximum
			*/

			// Check perfdata array, did we get usable data back
			if(setPerfdata == 'empty'
			   || !isset(setPerfdata[0]) || setPerfdata[0][0] == 'dummyPercentIn'
			   || !isset(setPerfdata[1]) || setPerfdata[1][0] == 'dummyPercentOut'
			   || (this.conf.line_type == 14 && (
			       !isset(setPerfdata[2]) || setPerfdata[2][0] == 'dummyActualIn'
			       || !isset(setPerfdata[3]) || setPerfdata[3][0] == 'dummyActualOut'))) {

				var msg = "Missing performance data - ";
				if(setPerfdata == 'empty')
						msg += "perfdata string is empty";	
				else {
					if(isset(setPerfdata[0]) && setPerfdata[0][0] == 'dummyPercentIn')
				  	msg += "value 1 is \'" + setPerfdata[0][1] + "\'";

					if(isset(setPerfdata[1]) && setPerfdata[1][0] == 'dummyPercentOut')
				  	msg += " value 2 is \'" + setPerfdata[1][1] + "\'";

					if(this.conf.line_type == 14) {
						if(isset(setPerfdata[2]) && setPerfdata[2][0] == 'dummyActualIn')
							msg += " value 3 is \'" + setPerfdata[2][1] + "\'";

						if(isset(setPerfdata[3]) && setPerfdata[3][0] == 'dummyActualOut')
							msg += " value 4 is \'" + setPerfdata[3][1] + "\'";
					}
				}
				
				this.conf.summary_output += ' (Weathermap Line Error: ' + msg + ')';
			} else {
				// This is the correct place to handle other perfdata format than the percent value

				// When no UOM is set try to calculate something...
				// This can fix the perfdata values from Check_MKs if and if64 checks.
				// The assumption is that there are perfdata values 'in' and 'out' with byte rates
				// and maximum values given to be able to calculate the percentage usage
				if(setPerfdata[0][2] === null || setPerfdata[0][2] === ''
           || setPerfdata[1][2] === null || setPerfdata[1][2] === '') {
					setPerfdata = this.calculateUsage(setPerfdata);
				}

				// Get colorFill #1 (in)
				if(setPerfdata[0][2] !== null && setPerfdata[0][2] == '%' && setPerfdata[0][1] !== null && setPerfdata[0][1] >= 0 && setPerfdata[0][1] <= 100)
					colorFill = this.getColorFill(setPerfdata[0][1]);
				else {
					colorFill = '#000000';
					this.perfdataError('First', setPerfdata[0][1], this.conf.name, this.conf.service_description);
				}
				
				// Get colorFill #2 (out)
				if(setPerfdata[1][2] !== null && setPerfdata[1][2] == '%' && setPerfdata [1][1] !== null && setPerfdata[1][1] >= 0 && setPerfdata[1][1] <= 100)
					colorFill2 = this.getColorFill(setPerfdata[1][1]);
				else {
					colorFill = '#000000';
					this.perfdataError('Second', setPerfdata[1][1], this.conf.name, this.conf.service_description);
				}
			}
		}

		// Get the border color depending on ack/downtime
		if(this.conf.summary_problem_has_been_acknowledged === 1 || this.conf.summary_in_downtime === 1) {
			colorBorder = '#666666';
			colorFill = lightenColor(colorFill, 100, 100, 100);
		}

		// Cuts
		var cuts = [this.conf.line_cut, this.conf.line_label_pos_in, this.conf.line_label_pos_out];

		// Parse the line object
		drawNagVisLine(this.conf.object_id, this.conf.line_type, cuts, x, y,
		               this.conf.z, width, colorFill, colorFill2, setPerfdata, colorBorder,
		               ((this.conf.url && this.conf.url !== '') || (this.conf.hover_menu && this.conf.hover_menu !== '')),
									 (this.conf.line_label_show && this.conf.line_label_show === '1'));
	},

	/**
	 * PRIVATE getColorFill()
	 *
	 * This function returns the color to use for this line depending on the
	 * given percentage usage and on the configured options for this object
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	getColorFill: function(perc) {
		var ranges = this.conf.line_weather_colors.split(',');
		for(var i = 0; i < ranges.length; i++) {
			// 0 contains the percentage until this color is used
			// 1 contains the color to be used
			var parts = ranges[i].split(':');
			if(perc <= parts[0])
				return parts[1];
			parts = null;
		}
		ranges = null;
		return '#000000';
	},

	/**
	 * PRIVATE calculateUsage()
	 *
	 * Loops all perfdata sets and searches for labels "in" and "out"
	 * with an empty UOM. If found it uses the current value and max value
	 * for calculating the percentage usage and also the current usage.
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	calculateUsage: function(oldPerfdata) {
		var newPerfdata = [];
		var foundNew = false;
		
		// This loop takes perfdata with the labels "in" and "out" and uses the current value
		// and maximum values to parse the percentage usage of the line
		for(var i = 0; i < oldPerfdata.length; i++) {
			if(oldPerfdata[i][0] == 'in' && (oldPerfdata[i][2] === null || oldPerfdata[i][2] === '')) {
				newPerfdata[0] = this.perfdataCalcPerc(oldPerfdata[i]);
				newPerfdata[2] = this.perfdataCalcBytesReadable(oldPerfdata[i]);
				foundNew = true;
			}
			if(oldPerfdata[i][0] == 'out' && (oldPerfdata[i][2] === null || oldPerfdata[i][2] === '')) {
				newPerfdata[1] = this.perfdataCalcPerc(oldPerfdata[i]);
				newPerfdata[3] = this.perfdataCalcBytesReadable(oldPerfdata[i]);
				foundNew = true;
			}
		}
		if(foundNew)
			return newPerfdata;
		else
			return oldPerfdata;
	},

	/**
	 * PRIVATE perfdataCalcBytesReadable()
	 *
	 * Transform bytes in a perfdata set to a human readable value
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	perfdataCalcBytesReadable: function(set) {
		// Check if all needed information are present
		if(set[1] === null || set[6] === null || set[1] == '' || set[6] == '')
			return set;

		var KB   = 1024;
		var MB   = 1024 * 1024;
		var GB   = 1024 * 1024 * 1024;
		var val  = set[1];
		var crit = set[6];
		var uom  = 'B';
		if(val > GB) {
			val  /= GB
			uom   = 'GB'
			crit /= GB
		} else if(val > MB) {
			val  /= MB
			uom  = 'MB'
			crit /= MB
		} else if(val > KB) {
			val  /= KB
			uom   = 'KB'
			crit /= KB
		}

		// Calculate percentages with 2 decimals and reset other options
		return Array(set[0], Math.round(val*100)/100, uom, set[3], set[4], 0, Math.round(crit*100)/100);
	},

	/**
	 * PRIVATE perfdataCalcPerc()
	 *
	 * Calculates the percentage usage of a line when the current value
	 *  and the max value are given in the perfdata string
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	perfdataCalcPerc: function(set) {
		// Check if all needed information are present
		if(set[1] === null || set[6] === null || set[1] == '' || set[6] == '')
			return set;

		// Calculate percentages with 2 decimals and reset other options
		return Array(set[0], Math.round((set[1]*100/set[6]*100)/100), '%', set[3], set[4], 0, 100);
	},

	/**
	 * PRIVATE perfdataError()
	 *
	 * Tells the user about wrong perfdata information
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	perfdataError: function(type, value, name1, name2) {
		this.conf.summary_output += ' (Weathermap Line Error: ' + type+' set of performance data ('+value+') for  '+name1+' ['+name2+'] is not a percentage value)';
	},
	
	/**
	 * PUBLIC parseAutomapIcon()
	 *
	 * Parses the HTML-Code of an automap icon
	 *
	 * @return	String		String with Html Code
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseAutomapIcon: function () {
		var alt = '';
		
		if(this.type == 'service') {
			alt = this.conf.name+'-'+this.conf.service_description;
		} else {
			alt = this.conf.name;
		}
		
		var doc = document;
		var oIcon = doc.createElement('img');
		oIcon.setAttribute('id', this.conf.object_id+'-icon');
		oIcon.src = oGeneralProperties.path_iconsets + this.conf.icon;
		oIcon.alt = this.conf.type + '-' + alt;
		
		var oIconDiv = doc.createElement('div');
		oIconDiv.setAttribute('id', this.conf.object_id+'-icondiv');
		oIconDiv.setAttribute('class', 'icon');
		oIconDiv.setAttribute('className', 'icon');
		oIconDiv.style.position = 'absolute';
		oIconDiv.style.top    = this.parseCoord(this.conf.y, 'y') + 'px';
		oIconDiv.style.left   = this.parseCoord(this.conf.x, 'x') + 'px';
		oIconDiv.style.zIndex = this.conf.z;
		
		// Parse link only when set
		if(this.conf.url && this.conf.url !== '' && this.conf.url !== '#') {
			var oIconLink = doc.createElement('a');
			oIconLink.href = this.conf.url;
			oIconLink.target = this.conf.url_target;
			oIconLink.appendChild(oIcon);
			oIcon = null;
			
			oIconDiv.appendChild(oIconLink);
			oIconLink = null;
		} else {
			oIconDiv.appendChild(oIcon);
			oIcon = null;
		}
		
		doc = null;
		return oIconDiv;
	},
	
	/**
	 * PUBLIC parseIcon()
	 *
	 * Parses the HTML-Code of an icon
	 *
	 * @return	String		String with Html Code
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseIcon: function () {
		var alt = '';
		
		if(this.type == 'service') {
			alt = this.conf.name+'-'+this.conf.service_description;
		} else {
			alt = this.conf.name;
		}
		
		var doc = document;
		var oIcon = doc.createElement('img');
		oIcon.setAttribute('id', this.conf.object_id+'-icon');
		oIcon.src = oGeneralProperties.path_iconsets + this.conf.icon;
		oIcon.alt = this.conf.type + '-' + alt;
		
		var oIconDiv = doc.createElement('div');
		oIconDiv.setAttribute('id', this.conf.object_id+'-icondiv');
		oIconDiv.setAttribute('class', 'icon');
		oIconDiv.setAttribute('className', 'icon');
		oIconDiv.style.position = 'absolute';
		oIconDiv.style.top  = this.parseCoord(this.conf.y, 'y') + 'px';
		oIconDiv.style.left = this.parseCoord(this.conf.x, 'x') + 'px';
		oIconDiv.style.zIndex = this.conf.z;
		
		// Parse link only when set
		if(this.conf.url && this.conf.url !== '' && this.conf.url !== '#') {
			var oIconLink = doc.createElement('a');
			oIconLink.href = this.conf.url;
			oIconLink.target = this.conf.url_target;
			oIconLink.appendChild(oIcon);
			oIcon = null;
			
			oIconDiv.appendChild(oIconLink);
			oIconLink = null;
		} else {
			oIconDiv.appendChild(oIcon);
			oIcon = null;
		}
		
		doc = null;
		return oIconDiv;
	},

	/**
	 * Moves the icon to it's location as described by this js object
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	moveIcon: function () {
		var container = document.getElementById(this.conf.object_id + '-icondiv');
		container.style.top  = this.parseCoord(this.conf.y, 'y') + 'px';
		container.style.left = this.parseCoord(this.conf.x, 'x') + 'px';
		container = null;
	},

	/**
	 * Moves the label of the object
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	moveLabel: function () {
		var label  = document.getElementById(this.conf.object_id + '-label');
		var coords = this.getLabelPos();
		label.style.top  = coords[1] + 'px';
		label.style.left = coords[0] + 'px';
		coords = null;
		label  = null;
	},

	/**
	 * Calculates and returns the positions of the objects label
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	getLabelPos: function () {
		var x = this.conf.label_x,
		    y = this.conf.label_y;

		// If there is a presign it should be relative to the objects x/y
		if(this.conf.label_x && this.conf.label_x.toString().match(/^(?:\+|\-)/)) 
			x = this.parseCoord(this.conf.x, 'x') + parseFloat(this.conf.label_x);
		if(this.conf.label_y && this.conf.label_y.toString().match(/^(?:\+|\-)/))
			y = this.parseCoord(this.conf.y, 'y') + parseFloat(this.conf.label_y);
		
		// If no x/y coords set, fallback to object x/y
		if(!this.conf.label_x || this.conf.label_x === '' || this.conf.label_x === '0')
			x = this.parseCoord(this.conf.x, 'x');
		if(!this.conf.label_y || this.conf.label_y === '' || this.conf.label_y === '0')
			y = this.parseCoord(this.conf.y, 'y');

		return [ x, y ];
	},
	
	/**
	 * Parses the HTML-Code of a label
	 *
	 * @return	String		HTML code of the label
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	parseLabel: function () {
		var coords = this.getLabelPos();
		return drawNagVisTextbox(this.conf.object_id + '-label', 'object_label',
		                         this.conf.label_background, this.conf.label_border,
		                         coords[0], coords[1], this.conf.z,
		                         this.conf.label_width, '', this.replaceLabelTextDynamicMacros(),
		                         this.conf.label_style);
	},

	parseControls: function () {
		// Ensure the controls container exists
		var oControls = document.getElementById(this.conf.object_id+'-controls');
		if(!oControls) {
			oControls = document.createElement('div');
			oControls.setAttribute('id', this.conf.object_id+'-controls');
			this.parsedObject.appendChild(oControls);
		}
		oControls = null;
		
		if(this.conf.view_type === 'line')
			this.parseLineControls();
		else if(this.conf.view_type === 'icon')
			this.parseIconControls();
	},

	parseControlDrag: function (num, objX, objY, offX, offY, size) {
		var drag = document.createElement('div');
		drag.setAttribute('id',         this.conf.object_id+'-drag-' + num);
		drag.setAttribute('class',     'control drag' + size);
		drag.setAttribute('className', 'control drag' + size);
		drag.style.zIndex   = parseInt(this.conf.z)+1;
		drag.style.width    = size + 'px';
		drag.style.height   = size + 'px';
		drag.style.left     = (objX + offX) + 'px';
		drag.style.top      = (objY + offY) + 'px';
		drag.objOffsetX     = offX;
		drag.objOffsetY     = offY;

		// Add to DOM
		document.getElementById(this.conf.object_id+'-controls').appendChild(drag);
		// Add to controls list
		this.objControls.push(drag);
		drag = null;
	},

	getObjWidth: function () {
		return parseInt(document.getElementById(this.conf.object_id + '-icondiv').clientWidth);
	},

	getObjHeight: function () {
		return parseInt(document.getElementById(this.conf.object_id + '-icondiv').clientHeight);
	},

	parseIconControls: function () {
		this.getObjWidth();
		var size = 10;
		this.parseControlDrag(0, this.parseCoord(this.conf.x, 'x'), this.parseCoord(this.conf.y, 'y'),
		                         this.getObjWidth() + 5, - size / 2, size);
		size = null;

		// Simply make it dragable. Maybe will be extended in the future...
		makeDragable([this.conf.object_id+'-drag-0'], this.saveObject, this.moveObject);
	},

	parseLineControls: function () {
		var x = this.parseCoords(this.conf.x, 'x');
		var y = this.parseCoords(this.conf.y, 'y');

		var size = 20;
		for(var i = 0, l = x.length; i < l; i++) {
			this.parseControlDrag(i, x[i], y[i], - size / 2, - size / 2, size);
			makeDragable([this.conf.object_id+'-drag-'+i], this.saveObject, this.moveObject);
		}
		size = null;
		x = null;
		y = null;
	},

	removeControls: function() {
		var oControls = document.getElementById(this.conf.object_id+'-controls');
		if(oControls)
			for(var i = oControls.childNodes.length; i > 0; i--)
				oControls.removeChild(oControls.childNodes[0]);
		this.objControls = [];
		oControls = null;
	},

	reposition: function() {
		if(this.conf.view_type === 'line')
			this.drawLine();
		else
			this.moveIcon();

		// Move the objects label when enabled
		if(this.conf.label_show && this.conf.label_show == '1')
			this.moveLabel();

		// Move child objects
		for(var i = 0, l = this.childs.length; i < l; i++)
			this.childs[i].reposition();

		// redraw the controls
		if(!this.bIsLocked) {
			this.removeControls();
			this.parseControls();
		}
	},

	/**
	 * Important: This is called from an event handler
	 * the 'this.' keyword can not be used here.
	 */
  moveObject: function(obj) {
		var arr        = obj.id.split('-');
		var objId      = arr[0];
		var anchorType = arr[1];

		var newPos;
		var viewType = getDomObjViewType(objId);

		var jsObj = getMapObjByDomObjId(objId);

		if(viewType === 'line') {
			newPos = getMidOfAnchor(obj);

			// Get current positions and replace only the current one
		  var anchorId   = arr[2];
			newPos = [ jsObj.calcNewCoord(newPos[0], 'x', anchorId),
			           jsObj.calcNewCoord(newPos[1], 'y', anchorId) ];
		  anchorId   = null;
		} else {
			newPos = [ jsObj.calcNewCoord(obj.x - obj.objOffsetX, 'x'),
			           jsObj.calcNewCoord(obj.y - obj.objOffsetY, 'y') ];
		}

		jsObj.conf.x = newPos[0];
		jsObj.conf.y = newPos[1];

		jsObj.reposition();

		jsObj      = null;	
		objId      = null;
		anchorType = null;
		newPos     = null;
		viewType   = null;
	},

	saveObject: function(obj, oParent) {
		var arr        = obj.id.split('-');
		var objId      = arr[0];
		var anchorId   = arr[2];
		var viewType   = getDomObjViewType(objId);
		var jsObj      = getMapObjByDomObjId(objId);

		if(viewType !== 'line')
			anchorId = -1

		// Make relative when oParent set and not already relative
		if(isset(oParent))
			jsObj.makeRelativeCoords(oParent, anchorId);

		saveObjectAfterAnchorAction(obj);

		arr      = null;
		objId    = null;
		anchorId = null;
		jsObj    = null;
	},

	/**
	 * Toggles the position of the line middle. The mid of the line
	 * can either be the 2nd of three line coords or is automaticaly
	 * the middle between two line coords.
	 */
	toggleLineMidLock: function() {
		// What is the current state?
		var x = this.conf.x.split(',');
		var y = this.conf.y.split(',')

		if(this.conf.line_type != 10 && this.conf.line_type != 13 && this.conf.line_type != 14) {
			alert('Not available for this line. Only lines with 2 line parts have a middle coordinate.');
			return;
		}

		if(x.length == 2) {
			// The line has 2 coords configured
			// - Calculate and add the 3rd coord as 2nd
			// - Add a drag control for the 2nd coord
			this.conf.x = [
				x[0],
			  middle(this.parseCoords(this.conf.x, 'x')[0], this.parseCoords(this.conf.x, 'x')[1], this.conf.line_cut),
			  x[1],
			].join(',');
			this.conf.y = [
				y[0],
				middle(this.parseCoords(this.conf.y, 'y')[0], this.parseCoords(this.conf.y, 'y')[1], this.conf.line_cut),
				y[1],
			].join(',');
		} else {
			// The line has 3 coords configured
			// - Remove the 2nd coord
			// - Remove the drag control for the 2nd coord
			this.conf.x = [ x[0], x[2] ].join(',');
			this.conf.y = [ y[0], y[2] ].join(',');
		}

		// send to server
		saveObjectAttr(this.conf.object_id, { 'x': this.conf.x, 'y': this.conf.y});
			
		// redraw the controls
		if(!this.bIsLocked) {
			this.removeControls();
			this.parseControls();
		}

		// redraw the line
		this.drawLine();
	},

	highlight: function(show) {
		// FIXME: Highlight lines in the future too
		if(this.conf.view_type !== 'icon')
			return;

		var oObjIcon = document.getElementById(this.conf.object_id + '-icon');
		var oObjIconDiv = document.getElementById(this.conf.object_id + '-icondiv');
		
		var sColor = oStates[this.conf.summary_state].color;

		this.bIsFlashing = show;
		if(show) {
			oObjIcon.style.border  = "5px solid " + sColor;
			oObjIconDiv.style.top  = (this.conf.y - 5)+'px';
			oObjIconDiv.style.left = (this.conf.x - 5)+'px';
		} else {
			oObjIcon.style.border  = "none";
			oObjIconDiv.style.top  = this.conf.y + 'px';
			oObjIconDiv.style.left = this.conf.x + 'px';
		}

		sColor      = null;
		oObjIconDiv = null;
		oObjIcon    = null;
	}
});
