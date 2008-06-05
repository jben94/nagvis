<?PHP
/*****************************************************************************
 *
 * index.php - Main page of NagVis
 *
 * Copyright (c) 2004-2008 NagVis Project (Contact: lars@vertical-visions.de)
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

// Start the user session (This is needed by some caching mechanism)
@session_start();

// Include defines
require("./includes/defines/global.php");
require("./includes/defines/matches.php");

// Include functions
require("./includes/functions/debug.php");
require("./includes/functions/oldPhpVersionFixes.php");

// Include needed global classes
require("./includes/classes/GlobalMainCfg.php");
require("./includes/classes/GlobalMapCfg.php");
require("./includes/classes/GlobalLanguage.php");
require("./includes/classes/GlobalPage.php");
require("./includes/classes/GlobalMap.php");
require("./includes/classes/GlobalBackground.php");
require("./includes/classes/GlobalGraphic.php");
require("./includes/classes/GlobalBackendMgmt.php");

// Include needed nagvis classes
require("./includes/classes/NagVisMapCfg.php");
require("./includes/classes/NagVisMap.php");
require("./includes/classes/NagVisFrontend.php");
require("./includes/classes/NagVisAutoMap.php");

// Include needed nagvis object classes
require("./includes/classes/objects/NagVisObject.php");
require("./includes/classes/objects/NagVisStatefulObject.php");
require("./includes/classes/objects/NagVisStatelessObject.php");
require("./includes/classes/objects/NagiosHost.php");
require("./includes/classes/objects/NagVisHost.php");
require("./includes/classes/objects/NagiosService.php");
require("./includes/classes/objects/NagVisService.php");
require("./includes/classes/objects/NagiosHostgroup.php");
require("./includes/classes/objects/NagVisHostgroup.php");
require("./includes/classes/objects/NagiosServicegroup.php");
require("./includes/classes/objects/NagVisServicegroup.php");
require("./includes/classes/objects/NagVisMapObj.php");
require("./includes/classes/objects/NagVisShape.php");
require("./includes/classes/objects/NagVisTextbox.php");

// Load the main configuration
$MAINCFG = new GlobalMainCfg(CONST_MAINCFG);

// If not set, initialize the map var
if(!isset($_GET['map'])) {
	$_GET['map'] = '';
}

// Initialize map configuration
$MAPCFG = new NagVisMapCfg($MAINCFG,$_GET['map']);
// Read the map configuration file
$MAPCFG->readMapConfig();

// Initialize backend(s)
$BACKEND = new GlobalBackendMgmt($MAINCFG);

// Initialize the frontend
$FRONTEND = new NagVisFrontend($MAINCFG,$MAPCFG,$BACKEND);

if(isset($_GET['map']) && $_GET['map'] != '') {
	// Build the page
	$FRONTEND->addBodyLines($FRONTEND->getRefresh());
	$FRONTEND->getHeaderMenu();
	$FRONTEND->getMap();
	$FRONTEND->getMessages();
} elseif(isset($_GET['url'])) {
	// Build the page
	$FRONTEND->addBodyLines($FRONTEND->getRefresh());
	$FRONTEND->getHeaderMenu();
	$arrFile = file($_GET['url']);
	$FRONTEND->addBodyLines($arrFile);
} elseif(isset($_GET['automap']) && $_GET['automap'] != '') {
	// Initialize the possible vars
	if(!isset($_GET['backend'])) {
		$_GET['backend'] = '';
	}
	if(!isset($_GET['root'])) {
		$_GET['root'] = '';
	}
	if(!isset($_GET['maxLayers'])) {
		$_GET['maxLayers'] = '';
	}
	if(!isset($_GET['renderMode'])) {
		$_GET['renderMode'] = '';
	}
	if(!isset($_GET['width'])) {
		$_GET['width'] = '';
	}
	if(!isset($_GET['height'])) {
		$_GET['height'] = '';
	}
	if(!isset($_GET['ignoreHosts'])) {
		$_GET['ignoreHosts'] = '';
	}
	if(!isset($_GET['filterGroup'])) {
		$_GET['filterGroup'] = '';
	}
	
	// Build the page
	$FRONTEND->addBodyLines($FRONTEND->getRefresh());
	$FRONTEND->getHeaderMenu();
	$FRONTEND->getAutoMap(Array('backend' => $_GET['backend'], 'root' => $_GET['root'], 'maxLayers' => $_GET['maxLayers'], 'renderMode' => $_GET['renderMode'], 'ignoreHosts' => $_GET['ignoreHosts'], 'filterGroup' => $_GET['filterGroup'], 'width' => $_GET['width'], 'height' => $_GET['height']));
	$FRONTEND->getMessages();
} elseif(isset($_GET['rotation']) && $_GET['rotation'] != '' && (!isset($_GET['url']) || $_GET['url'] == '') && (!isset($_GET['map']) || $_GET['map'] == '')) {
	// Redirect to next page
	header('Location: '.$FRONTEND->getNextRotationUrl());
} elseif(isset($_GET['info'])) {
	// Build the page
	$FRONTEND->getInstInformations();
} else {
	// Build the page
	$FRONTEND->addBodyLines($FRONTEND->getRefresh());
	$FRONTEND->getHeaderMenu();
	$FRONTEND->addBodyLines($FRONTEND->getIndexPage());
	$FRONTEND->getMessages();
}

// Print the page
$FRONTEND->printPage();
?>
