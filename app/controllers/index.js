var TiBeacons = null;

// Change these to change where beacon config is fetched from
var DDL_URL = 'http://training-21.liferay.com/api/jsonws/skinny-web.skinny/get-skinny-ddl-records';
var DDL_RECORD_SET_ID = '53815';
var FETCH_FROM_LIFERAY = false;

var UUID = 'B9407F30-F5F8-466E-AFF9-25556B57FE6D';
var REGION_NAME = "Sample Region";
var OS_VERSION = Ti.Platform.version.split('.');
var IS_IOS = (Ti.Platform.osname == 'iphone' || Ti.Platform.osname == 'ipad');
var IS_IOS7_OR_GREATER = (IS_IOS && OS_VERSION && OS_VERSION[0] && parseInt(OS_VERSION[0], 10) >= 7);
var IS_IOS8_OR_GREATER = (IS_IOS && OS_VERSION && OS_VERSION[0] && parseInt(OS_VERSION[0], 10) >= 8);
var line = 1;

if (Ti.Platform.name === 'android' && Ti.Platform.Android.API_LEVEL >= 18) {
    TiBeacons = require('com.liferay.beacons');
    if (!TiBeacons.checkAvailability()) {
        TiBeacons = null;
        $.log.value = "Bluetooth LE not supported or you have switched off Bluetooth. Enable Bluetooth and try again!";
    }
} else if (Ti.Platform.name === 'iPhone OS') {
    if (IS_IOS7_OR_GREATER) {
        TiBeacons = require('org.beuckman.tibeacons');
    } else {
    	    $.log.value = "Sorry, beacons only supported on iOS 7 or later!";
    }
} else {
    $.log.value = "Sorry, beacons not supported on this platform.";
}

function log(color, msg) {
    $.log.borderColor = color;
    $.log.backgroundColor = color;
    $.log.value = ($.log.value + '\n' + line + ' ' + msg);
    line++;
    $.log.setSelection($.log.value.length, $.log.value.length);
    setTimeout(function() {
        $.log.borderColor = '#bbb';
        $.log.backgroundColor = '#dddddd';
    }, 500);
}
function handleRegionEnter(e) {
    log("green", "ENTER: " + e.identifier);
    
    TiBeacons.startRangingForBeacons({
        identifier : e.identifier,
        uuid : UUID
    });
}

function handleRegionExit(e) {
    log("red", "EXIT: " + e.identifier);
    TiBeacons.stopRangingForAllBeacons();
}

function handleRegionDeterminedState(e) {
    log("blue", "STATE: " + e.regionState + ' ' + e.identifier);
    if (e.regionState === 'inside') {
        TiBeacons.startRangingForBeacons({
            identifier : e.identifier,
            uuid : UUID
        });

    }
}
function handleProximityEvent(e) {
        log("orange", "PROX: " + e.proximity + ' ' + e.uuid + '/' + e.major + '/' + e.minor);
}
function handleRangeEvent(e) {
        log("orange", "RANGE: " + e.identifier + e.beacons.length + " BEACONS RANGED");
        e.beacons.forEach(function(e) {
            log("orange", "  -  " + e.uuid + '/' + e.major + '/' + e.minor + '/' + e.proximity + '/' + e.rssi + '/' + e.accuracy);
        });
}

function getRegionFromLiferay(callback) {
    
        var util = require('util');
        
        util.loadDDL(DDL_URL, {
            ddlRecordSetId : DDL_RECORD_SET_ID,
            success : function(records) {
                callback(records[0]);
            },
            error : function(errmsg) {
                alert("uh oh: " + errmsg);
            }
        }, 3);
    
}

function start(e) {
    if (TiBeacons) {
        $.log.value = "Started at " + new Date() + "\n-------------------------------";
        line = 1;
        if (IS_IOS) {
	        Ti.Geolocation.setPurpose(L('GEO_PERMISSION_PURPOSE'));
	        Ti.Geolocation.getCurrentPosition(function(result) {});
		}
		    
        TiBeacons.addEventListener("enteredRegion", handleRegionEnter);
        TiBeacons.addEventListener("exitedRegion", handleRegionExit);
        TiBeacons.addEventListener("determinedRegionState", handleRegionDeterminedState);
        TiBeacons.addEventListener("beaconProximity", handleProximityEvent);
        TiBeacons.addEventListener("beaconRanges", handleRangeEvent);
    
    
        if (!FETCH_FROM_LIFERAY) {
           log("orange", "Using hard-coded region: " + REGION_NAME + "/" + UUID);
            TiBeacons.startMonitoringForRegion({
                identifier: REGION_NAME,
                uuid: UUID        
            });
        } else {
            getRegionFromLiferay(function(region) {
               REGION_NAME = region.title;
               UUID = region.proximity_uuid;
               log("green", "Got region from Liferay: " + JSON.stringify(region));
               TiBeacons.startMonitoringForRegion({
                   uuid: UUID,
                   identifier: REGION_NAME
               });
            });
        }        
    } else {
        alert("Beacons not supported on this device or Bluetooth switched off");
    }
}

function stop(e) {
    log("orange", "Stopped at " + new Date() + "\n-------------------------------");
    if (TiBeacons) {
        TiBeacons.removeEventListener("enteredRegion", handleRegionEnter);
        TiBeacons.removeEventListener("exitedRegion", handleRegionExit);
        TiBeacons.removeEventListener("determinedRegionState", handleRegionDeterminedState);
        TiBeacons.removeEventListener("beaconProximity", handleProximityEvent);
        TiBeacons.removeEventListener("beaconRanges", handleRangeEvent);
    }
}

$.index.open();