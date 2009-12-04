<?php
/*******************************************************************************
 *
 * CoreAuthorisationModSQLite.php - Authorsiation module based on SQLite
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
 ******************************************************************************/

/**
 * @author Lars Michelsen <lars@vertical-visions.de>
 */
class CoreAuthorisationModSQLite extends CoreAuthorisationModule {
	private $AUTHENTICATION = null;
	private $CORE = null;
	private $DB = null;
	
	public function __construct(GlobalCore $CORE, CoreAuthHandler $AUTHENTICATION) {
		$this->AUTHENTICATION = $AUTHENTICATION;
		$this->CORE = $CORE;
		
		$this->DB = new CoreSQLiteHandler();
		
		// Open sqlite database
		if(!$this->DB->open($this->CORE->getMainCfg()->getValue('paths', 'cfg').'auth.db')) {
			// FIXME: Errorhandling
		}
	}
	
	public function deleteRole($roleId) {
		// Delete user
		$this->DB->query('DELETE FROM roles WHERE roleId=\''.sqlite_escape_string($roleId).'\'');
		
		// Delete role permissions
		$this->DB->query('DELETE FROM roles2perms WHERE roleId=\''.sqlite_escape_string($roleId).'\'');
		
		// Check result
		if(!$this->checkRoleExists($roleId)) {
			return true;
		} else {
			return false;
		}
	}
	
	public function deleteUser($userId) {
		// Delete user
		$this->DB->query('DELETE FROM users WHERE userId=\''.sqlite_escape_string($userId).'\'');
		
		// Delete user roles
		$this->DB->query('DELETE FROM users2roles WHERE userId=\''.sqlite_escape_string($userId).'\'');
		
		// Check result
		if($this->checkUserExistsById($userId) <= 0) {
			return true;
		} else {
			return false;
		}
	}
	
	public function updateUserRoles($userId, $roles) {
		// First delete all role perms
		$this->DB->query('DELETE FROM users2roles WHERE userId=\''.sqlite_escape_string($userId).'\'');
		
		// insert new user roles
		foreach($roles AS $roleId) {
			$this->DB->query('INSERT INTO users2roles (userId, roleId) VALUES ('.sqlite_escape_string($userId).', '.sqlite_escape_string($roleId).')');
		}
		
		return true;
	}
	
	public function getUserRoles($userId) {
		$aRoles = Array();
		
		// Get all the roles of the user
	  $RES = $this->DB->query('SELECT users2roles.roleId AS roleId, roles.name AS name FROM users2roles LEFT JOIN roles ON users2roles.roleId=roles.roleId WHERE userId=\''.sqlite_escape_string($userId).'\'');
	  while($data = $this->DB->fetchAssoc($RES)) {
	  	$aRoles[] = $data;
	  }
	  
	  return $aRoles;
	}
	
	public function getAllRoles() {
		$aRoles = Array();
		
		// Get all the roles of the user
	  $RES = $this->DB->query('SELECT roleId, name FROM roles ORDER BY name');
	  while($data = $this->DB->fetchAssoc($RES)) {
	  	$aRoles[] = $data;
	  }
	  
	  return $aRoles;
	}
	
	public function getAllPerms() {
		$aPerms = Array();
		
		// Get all the roles of the user
	  $RES = $this->DB->query('SELECT permId, mod, act, obj FROM perms ORDER BY mod,act,obj');
	  while($data = $this->DB->fetchAssoc($RES)) {
	  	$aPerms[] = $data;
	  }
	  
	  return $aPerms;
	}
	
	public function getRolePerms($roleId) {
		$aRoles = Array();
		
		// Get all the roles of the user
	  $RES = $this->DB->query('SELECT permId FROM roles2perms WHERE roleId=\''.sqlite_escape_string($roleId).'\'');
	  while($data = $this->DB->fetchAssoc($RES)) {
	  	$aRoles[$data['permId']] = true;
	  }
	  
	  return $aRoles;
	}
	
	public function updateRolePerms($roleId, $perms) {
		// First delete all role perms
		$this->DB->query('DELETE FROM roles2perms WHERE roleId=\''.sqlite_escape_string($roleId).'\'');
		
		// insert new role perms
		foreach($perms AS $permId => $val) {
			if($val === true) {
				$this->DB->query('INSERT INTO roles2perms (roleId, permId) VALUES ('.sqlite_escape_string($roleId).', '.sqlite_escape_string($permId).')');
			}
		}
		
		return true;
	}
	
	public function checkRoleExists($name) {
		$RES = $this->DB->query('SELECT roleId FROM roles WHERE name=\''.sqlite_escape_string($name).'\'');
		if(intval($RES->fetchSingle()) > 0) {
			return true;
		} else {
			return false;
		}
	}
	
	public function createRole($name) {
		$this->DB->query('INSERT INTO roles (name) VALUES (\''.sqlite_escape_string($name).'\')');
		
		// Check result
		if($this->checkRoleExists($name)) {
			return true;
		} else {
			return false;
		}
	}
	
	public function parsePermissions() {
		$aPerms = Array();
		
		$sUsername = $this->AUTHENTICATION->getUser();
		
		// Only handle known users
		$userId = $this->checkUserExists($sUsername);
		if($userId > 0) {
		  // Get all the roles of the user
		  $RES = $this->DB->query('SELECT perms.mod AS mod, perms.act AS act, perms.obj AS obj '.
		                          'FROM users2roles '.
		                          'INNER JOIN roles2perms ON roles2perms.roleId = users2roles.roleId '.
		                          'INNER JOIN perms ON perms.permId = roles2perms.permId '.
		                          'WHERE users2roles.userId = \''.sqlite_escape_string($userId).'\'');
		  
			while($data = $this->DB->fetchAssoc($RES)) {
				if(!isset($aPerms[$data['mod']])) {
					$aPerms[$data['mod']] = Array();
				}
				
				if(!isset($aPerms[$data['mod']][$data['act']])) {
					$aPerms[$data['mod']][$data['act']] = Array();
				}
				
				if(!isset($aPerms[$data['mod']][$data['act']][$data['obj']])) {
					$aPerms[$data['mod']][$data['act']][$data['obj']] = Array();
				}
			}
		}
		
		return $aPerms;
	}
	
	private function checkUserExistsById($id) {
		$RES = $this->DB->query('SELECT userId FROM users WHERE userId=\''.sqlite_escape_string($id).'\'');
		return intval($RES->fetchSingle());
	}
	
	private function checkUserExists($sUsername) {
		$RES = $this->DB->query('SELECT userId FROM users WHERE name=\''.sqlite_escape_string($sUsername).'\'');
		return intval($RES->fetchSingle());
	}
}
?>