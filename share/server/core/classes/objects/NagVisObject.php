<?php
/*****************************************************************************
 *
 * NagVisObject.php - Abstract class of an object in NagVis with all necessary 
 *                  information which belong to the object handling in NagVis
 *
 * Copyright (c) 2004-2009 NagVis Project (Contact: info@nagvis.org)
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
class NagVisObject {
	protected $CORE;
	
	protected $conf;
	
	// "Global" Configuration variables for all objects
	protected $type;
	protected $object_id;
	protected $x;
	protected $y;
	protected $z;
	protected $icon;
	
	protected $view_type;
	protected $hover_menu;
	protected $hover_childs_show;
	protected $hover_childs_sort;
	protected $hover_childs_order;
	protected $hover_childs_limit;
	protected $label_show;
	
	protected $iconPath;
	protected $iconHtmlPath;
	
	private static $sSortOrder = 'asc';
	
	/**
	 * Class constructor
	 *
	 * @param		Object 		Object of class GlobalMainCfg
	 * @param		Object 		Object of class GlobalBackendMgmt
	 * @param		Object 		Object of class GlobalLanguage
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function __construct($CORE) {
		$this->CORE = $CORE;
		
		// Initialize object_id (Should be overriden later)
		$this->object_id = rand(0, 1000);
		
		$this->conf = Array();
	}
	
	/**
	 * Get method for all options
	 *
	 * @return	Value  Value of the given option
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function get($option) {
		return $this->{$option};
	}
	
	/**
	 * Get method for x coordinate of the object
	 *
	 * @return	Integer		x coordinate on the map
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getX() {
		return $this->x;
	}
	
	/**
	 * Get method for y coordinate of the object
	 *
	 * @return	Integer		y coordinate on the map
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getY() {
		return $this->y;
	}
	
	/**
	 * Get method for z coordinate of the object
	 *
	 * @return	Integer		z coordinate on the map
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getZ() {
		return $this->z;
	}
	
	/**
	 * Get method for type of the object
	 *
	 * @return	String		Type of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getType() {
		return $this->type;
	}
	
	/**
	 * PUBLIC getObjectId()
	 *
	 * Get method for the object id
	 *
	 * @return	Integer		Object ID
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getObjectId() {
		return $this->object_id;
	}
	
	/**
	 * PUBLIC setObjectId()
	 *
	 * Set method for the object id
	 *
	 * @param   Integer    Object id to set for the object
	 * @author  Lars Michelsen <lars@vertical-visions.de>
	 */
	public function setObjectId($id) {
		$this->object_id = $id;
	}
	
	/**
	 * Get method for the name of the object
	 *
	 * @return	String		Name of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getName() {
		if($this->type == 'service') {
			return $this->host_name;
		} else {
			return $this->{$this->getType().'_name'};
		}
	}
	
	/**
	 * Get method for the hover template of the object
	 *
	 * @return	String		Hover template of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getHoverTemplate() {
		return $this->hover_template;
	}
	
	/**
	 * Set method for the object coords
	 *
	 * @return	Array		Array of the objects coords
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function setMapCoords($arrCoords) {
		$this->x = $arrCoords['x'];
		$this->y = $arrCoords['y'];
		$this->z = $arrCoords['z'];
	}
	
	/**
	 * PUBLIC setConfiguration()
	 *
	 * Sets options of the object
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function setConfiguration($obj) {
		foreach($obj AS $key => $val) {
			$this->conf[$key] = $val;
			$this->{$key} = $val;
		}
	}
	
	/**
	 * PUBLIC setObjectInformation()
	 *
	 * Sets extended information of the object
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function setObjectInformation($obj) {
		foreach($obj AS $key => $val) {
			$this->{$key} = $val;
		}
	}
	
	/**
	 * PULBLIC getObjectInformation()
	 *
	 * Gets all necessary information of the object as array
	 *
	 * @return	Array		Object configuration
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getObjectInformation($bFetchChilds=true) {
		$arr = Array();
		
		// Need to remove some options which are not relevant
		$arrDenyKeys = Array('CORE' => '', 'BACKEND' => '', 'MAPCFG' => '',
			'MAP' => '', 'GRAPHIC' => '', 'conf' => '', 'services' => '',
			'fetchedChildObjects' => '', 'childObjects' => '', 'parentObjects' => '',
			'members' => '', 'objects' => '', 'linkedMaps' => '');
		
		foreach($this AS $key => $val) {
			if(!isset($arrDenyKeys[$key])) {
				$arr[$key] = $val;
			}
		}
		
		// Save the number of members
		switch($this->getType()) {
			case 'host':
			case 'hostgroup':
			case 'servicegroup':
				$arr['num_members'] = $this->getNumMembers();
			break;
			case 'map':
				$arr['num_members'] = $this->getNumStatefulMembers();
			break;
		}
		
		/**
		 * FIXME: Find another place for that! This is a bad place for language strings!
		 */
		
		// Get the child name label
		switch($this->type) {
			case 'host':
				$sName = $this->CORE->getLang()->getText('hostname');
				$sChildName = $this->CORE->getLang()->getText('servicename');
			break;
			case 'hostgroup':
				$sName = $this->CORE->getLang()->getText('hostgroupname');
				$sChildName = $this->CORE->getLang()->getText('hostname');
			break;
			case 'servicegroup':
				$sName = $this->CORE->getLang()->getText('servicegroupname');
				$sChildName = $this->CORE->getLang()->getText('servicename');
			break;
			default:
				$sName = $this->CORE->getLang()->getText('mapname');
				$sChildName = $this->CORE->getLang()->getText('objectname');
			break;
		}
		
		$arr['lang_obj_type'] = $this->CORE->getLang()->getText($this->type);
		$arr['lang_name'] = $sName;
		$arr['lang_child_name'] = $sChildName;
		$arr['lang_child_name1'] = $this->CORE->getLang()->getText('hostname');
		
		// I want only "name" in js
		if($this->type != 'shape' && $this->type != 'textbox' && $this->type != 'line') {
			$arr['name'] = $this->getName();
			
			if($this->type == 'service') {
				unset($arr['host_name']);
			} else {
				unset($arr[$this->getType().'_name']);
			}
			
			if(isset($this->alias) && $this->alias != '') {
				$arr['alias'] = $this->alias;
			} else {
				$arr['alias'] = '';
			}
			
			if(isset($this->display_name) && $this->display_name != '') {
				$arr['display_name'] = $this->display_name;
			} else {
				$arr['display_name'] = '';
			}
			
			// Add the custom htmlcgi path for the object
			$arr['htmlcgi'] = $this->CORE->getMainCfg()->getValue('backend_'.$this->backend_id, 'htmlcgi');
			
			if($this->CORE->getMainCfg()->getValue('backend_'.$this->backend_id,'backendtype') == 'ndomy') {
				$arr['backend_instancename'] = $this->CORE->getMainCfg()->getValue('backend_'.$this->backend_id,'dbinstancename');
			} else {
				$arr['backend_instancename'] = '';
			}
			
			// Little hack: Overwrite the options with correct state information
			$arr = array_merge($arr, $this->getObjectStateInformations(false));
		}
    
    // On children only return the following options to lower the bandwidth,
    // memory and cpu usage. If someone wants more information in hover menu
    // children, this is the place to change
    if(!$bFetchChilds) {
      $aChild = Array('type' => $arr['type'],
                      'name' => $arr['name'],
                      'summary_state' => $arr['summary_state'],
                      'summary_in_downtime' => $arr['summary_in_downtime'],
                      'summary_problem_has_been_acknowledged' => $arr['summary_problem_has_been_acknowledged'],
                      'summary_output' => $arr['summary_output']);
      if($this->type == 'service') {
        $aChild['service_description'] = $arr['service_description'];
      }
      
      $arr = $aChild;
    }
    
		// Only do this for parents
		if($bFetchChilds && isset($arr['num_members']) && $arr['num_members'] > 0) {
			$arr['members'] = Array();
			foreach($this->getSortedObjectMembers() AS $OBJ) {
				$arr['members'][] = $OBJ->getObjectInformation(false);
			}
		}
		
		return $arr;
	}
	
	/**
	 * PULBLIC getSortedObjectMembers()
	 *
	 * Gets an array of member objects
	 *
	 * @return	Array		Member object information
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getSortedObjectMembers() {
		$arr = Array();
		
		$aTmpMembers = $this->getStateRelevantMembers();
		
		// Set the sort order
		self::$sSortOrder = $this->hover_childs_order;
		
		// Sort the array of child objects by the sort option
		switch($this->hover_childs_sort) {
			case 's':
				// Order by State
				usort($aTmpMembers, Array("NagVisObject", "sortObjectsByState"));
			break;
			case 'a':
			default:
				// Order alhpabetical
				usort($aTmpMembers, Array("NagVisObject", "sortObjectsAlphabetical"));
			break;
		}
		
		// Count only once, not in loop header
		$iNumObjects = count($aTmpMembers);
		
		// Loop all child object until all looped or the child limit is reached
		for($i = 0, $iEnum = 0; $iEnum <= $this->hover_childs_limit && $i < $iNumObjects; $i++) {
			$arr[] = $aTmpMembers[$i];
			
			// Only count objects which are added to the list for checking
			// reached hover_childs_limit
			$iEnum++;
		}
		
		return $arr;
	}
	
	/**
	 * PULBLIC getObjectConfiguration()
	 *
	 * Gets the configuration of the object
	 *
	 * @return	Array		Object configuration
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	public function getObjectConfiguration() {
		// Some options have to be removed which are only for this object
		$arr = $this->conf;
		unset($arr['id']);
		unset($arr['object_id']);
		unset($arr['type']);
		unset($arr['host_name']);
		unset($arr[$this->getType().'_name']);
		unset($arr['service_description']);
		return $arr;
	}
	
	# End public methods
	# #########################################################################
	
	/**
	 * PROTECTED getUrl()
	 *
	 * Returns the url for the object link
	 *
	 * @return	String	URL
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	protected function getUrl() {
		if(isset($this->url)) {
			return $this->url;
		} else {
			return '';
		}
	}
	
	/**
	 * PROTECTED getUrlTarget()
	 *
	 * Returns the target frame for the object link
	 *
	 * @return	String	Target
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	protected function getUrlTarget() {
		return $this->url_target;
	}
	
	/**
	 * PRIVATE STATIC sortObjectsAlphabetical()
	 *
	 * Sorts both objects alphabetically by name
	 *
	 * @param	OBJ		First object to sort
	 * @param	OBJ		Second object to sort
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	private static function sortObjectsAlphabetical($OBJ1, $OBJ2) {
		if($OBJ1->getType() == 'service') {
			$name1 = strtolower($OBJ1->getName().$OBJ1->getServiceDescription());
		} else {
			$name1 = strtolower($OBJ1->getName());
		}
		
		if($OBJ2->getType() == 'service') {
			$name2 = strtolower($OBJ2->getName().$OBJ2->getServiceDescription());
		} else {
			$name2 = strtolower($OBJ2->getName());
		}

		if ($name1 == $name2) {
			return 0;
		} elseif($name1 > $name2) {
			// Sort depending on configured direction
			if(self::$sSortOrder === 'asc') {
				return +1;
			} else {
				return -1;
			}
		} else {
			// Sort depending on configured direction
			if(self::$sSortOrder === 'asc') {
				return -1;
			} else {
				return +1;
			}
		}
	}
	
	/**
	 * PRIVATE STATIC sortObjectsByState()
	 *
	 * Sorts both by state of the object
	 *
	 * @param	OBJ		First object to sort
	 * @param	OBJ		Second object to sort
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	private static function sortObjectsByState($OBJ1, $OBJ2) {
		$state1 = $OBJ1->getSummaryState();
		$state2 = $OBJ2->getSummaryState();

		// Quit when nothing to compare
		if($state1 == '' || $state2 == '') {
			return 0;
		}

		$stateWeight = $OBJ1->CORE->getMainCfg()->getStateWeight();
		
		// Handle normal/ack/downtime states
		
		$stubState1 = 'normal';
		if($OBJ1->getSummaryAcknowledgement() == 1 && isset($stateWeight[$state1]['ack'])) {
			$stubState1 = 'ack';
		} elseif($OBJ1->getSummaryInDowntime() == 1 && isset($stateWeight[$state1]['downtime'])) {
			$stubState1 = 'downtime';
		}
		
		$stubState2 = 'normal';
		if($OBJ2->getSummaryAcknowledgement() == 1 && isset($stateWeight[$state2]['ack'])) {
			$stubState2 = 'ack';
		} elseif($OBJ2->getSummaryInDowntime() == 1 && isset($stateWeight[$state2]['downtime'])) {
			$stubState2 = 'downtime';
		}
				
		if($stateWeight[$state1][$stubState1] == $stateWeight[$state2][$stubState2]) {
			return 0;
		} elseif($stateWeight[$state1][$stubState1] < $stateWeight[$state2][$stubState2]) {
			// Sort depending on configured direction
			if(self::$sSortOrder === 'asc') {
				return +1;
			} else {
				return -1;
			}
		} else {
			// Sort depending on configured direction
			if(self::$sSortOrder === 'asc') {
				return -1;
			} else {
				return +1;
			}
		}
	}
}
?>