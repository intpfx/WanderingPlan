'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var gpio = require('gpio');

var iot = require('iot');

var network = require('network');

var uart = require('uart');

var i2c = require('i2c');

function _interopDefaultLegacy(e) {
  return e && _typeof(e) === 'object' && 'default' in e ? e : {
    'default': e
  };
}

var gpio__default = /*#__PURE__*/_interopDefaultLegacy(gpio);

var iot__default = /*#__PURE__*/_interopDefaultLegacy(iot);

var network__default = /*#__PURE__*/_interopDefaultLegacy(network);

var uart__default = /*#__PURE__*/_interopDefaultLegacy(uart);

var i2c__default = /*#__PURE__*/_interopDefaultLegacy(i2c);

function createCommonjsModule(fn) {
  var module = {
    exports: {}
  };
  return fn(module, module.exports), module.exports;
}
/**
 * @license GPS.js v0.6.0 26/01/2016
 *
 * Copyright (c) 2016, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/


var gnss$1 = createCommonjsModule(function (module, exports) {
  (function (root) {
    var D2R = Math.PI / 180;
    var collectSats = {};
    var lastSeenSat = {};

    function updateState(state, data) {
      // TODO: can we really use RMC time here or is it the time of fix?
      if (data['type'] === 'RMC' || data['type'] === 'GGA' || data['type'] === 'GLL' || data['type'] === 'GNS') {
        state['time'] = data['time'];
        state['lat'] = data['lat'];
        state['lon'] = data['lon'];
      }

      if (data['type'] === 'ZDA') {
        state['time'] = data['time'];
      }

      if (data['type'] === 'GGA') {
        state['alt'] = data['alt'];
      }

      if (data['type'] === 'RMC'
      /* || data['type'] === 'VTG'*/
      ) {
          // TODO: is rmc speed/track really interchangeable with vtg speed/track?
          state['speed'] = data['speed'];
          state['track'] = data['track'];
        }

      if (data['type'] === 'GSA') {
        state['satsActive'] = data['satellites'];
        state['fix'] = data['fix'];
        state['hdop'] = data['hdop'];
        state['pdop'] = data['pdop'];
        state['vdop'] = data['vdop'];
      }

      if (data['type'] === 'GSV') {
        var now = new Date().getTime();
        var sats = data['satellites'];

        for (var i = 0; i < sats.length; i++) {
          var prn = sats[i].prn;
          lastSeenSat[prn] = now;
          collectSats[prn] = sats[i];
        }

        var ret = [];

        for (var prn in collectSats) {
          if (now - lastSeenSat[prn] < 3000) // Sats are visible for 3 seconds
            ret.push(collectSats[prn]);
        }

        state['satsVisible'] = ret;
      }
    }
    /**
     *
     * @param {String} time
     * @param {String=} date
     * @returns {Date}
     */


    function parseTime(time, date) {
      if (time === '') {
        return null;
      }

      var ret = new Date();

      if (date) {
        var year = date.slice(4);
        var month = date.slice(2, 4) - 1;
        var day = date.slice(0, 2);

        if (year.length === 4) {
          ret.setUTCFullYear(Number(year), Number(month), Number(day));
        } else {
          // If we need to parse older GPRMC data, we should hack something like
          // year < 73 ? 2000+year : 1900+year
          // Since GPS appeared in 1973
          ret.setUTCFullYear(Number('20' + year), Number(month), Number(day));
        }
      }

      ret.setUTCHours(Number(time.slice(0, 2)));
      ret.setUTCMinutes(Number(time.slice(2, 4)));
      ret.setUTCSeconds(Number(time.slice(4, 6))); // Extract the milliseconds, since they can be not present, be 3 decimal place, or 2 decimal places, or other?

      var msStr = time.slice(7);
      var msExp = msStr.length;
      var ms = 0;

      if (msExp !== 0) {
        ms = parseFloat(msStr) * Math.pow(10, 3 - msExp);
      }

      ret.setUTCMilliseconds(Number(ms));
      return ret;
    }

    function parseCoord(coord, dir) {
      // Latitude can go from 0 to 90; longitude can go from -180 to 180.
      if (coord === '') return null;
      var n,
          sgn = 1;

      switch (dir) {
        case 'S':
          sgn = -1;

        case 'N':
          n = 2;
          break;

        case 'W':
          sgn = -1;

        case 'E':
          n = 3;
          break;
      }
      /*
       * Mathematically, but more expensive and not numerical stable:
       *
       * raw = 4807.038
       * deg = Math.floor(raw / 100)
       *
       * dec = (raw - (100 * deg)) / 60
       * res = deg + dec // 48.1173
       */


      return sgn * (parseFloat(coord.slice(0, n)) + parseFloat(coord.slice(n)) / 60);
    }

    function parseNumber(num) {
      if (num === '') {
        return null;
      }

      return parseFloat(num);
    }

    function parseKnots(knots) {
      if (knots === '') return null;
      return parseFloat(knots) * 1.852;
    }

    function parseGSAMode(mode) {
      switch (mode) {
        case 'M':
          return 'manual';

        case 'A':
          return 'automatic';

        case '':
          return null;
      }

      throw new Error('INVALID GSA MODE: ' + mode);
    }

    function parseGGAFix(fix) {
      if (fix === '') return null;

      switch (parseInt(fix, 10)) {
        case 0:
          return null;

        case 1:
          return 'fix';
        // valid SPS fix

        case 2:
          return 'dgps-fix';
        // valid DGPS fix

        case 3:
          return 'pps-fix';
        // valid PPS fix

        case 4:
          return 'rtk';
        // valid (real time kinematic) RTK fix

        case 5:
          return 'rtk-float';
        // valid (real time kinematic) RTK float

        case 6:
          return 'estimated';
        // dead reckoning

        case 7:
          return 'manual';

        case 8:
          return 'simulated';
      }

      throw new Error('INVALID GGA FIX: ' + fix);
    }

    function parseGSAFix(fix) {
      switch (fix) {
        case '1':
        case '':
          return null;

        case '2':
          return '2D';

        case '3':
          return '3D';
      }

      throw new Error('INVALID GSA FIX: ' + fix);
    }

    function parseRMC_GLLStatus(status) {
      switch (status) {
        case 'A':
          return 'active';

        case 'V':
          return 'void';

        case '':
          return null;
      }

      throw new Error('INVALID RMC/GLL STATUS: ' + status);
    }

    function parseFAA(faa) {
      // Only A and D will correspond to an Active and reliable Sentence
      switch (faa) {
        case '':
          return null;

        case 'A':
          return 'autonomous';

        case 'D':
          return 'differential';

        case 'E':
          return 'estimated';
        // dead reckoning

        case 'M':
          return 'manual input';

        case 'S':
          return 'simulated';

        case 'N':
          return 'not valid';

        case 'P':
          return 'precise';

        case 'R':
          return 'rtk';
        // valid (real time kinematic) RTK fix

        case 'F':
          return 'rtk-float';
        // valid (real time kinematic) RTK float
      }

      throw new Error('INVALID FAA MODE: ' + faa);
    }

    function parseRMCVariation(vari, dir) {
      if (vari === '' || dir === '') return null;
      var q = dir === 'W' ? -1.0 : 1.0;
      return parseFloat(vari) * q;
    }

    function isValid(str, crc) {
      var checksum = 0;

      for (var i = 1; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c === 42) // Asterisk: *
          break;
        checksum ^= c;
      }

      return checksum === parseInt(crc, 16);
    }

    function parseDist(num, unit) {
      if (unit === 'M' || unit === '') {
        return parseNumber(num);
      }

      throw new Error('Unknown unit: ' + unit);
    }
    /**
     *
     * @constructor
     */


    function GPS() {
      if (!(this instanceof GPS)) {
        return new GPS();
      }

      this['events'] = {};
      this['state'] = {
        'errors': 0,
        'processed': 0
      };
    }

    GPS.prototype['events'] = null;
    GPS.prototype['state'] = null;
    GPS['mod'] = {
      // Global Positioning System Fix Data
      'GGA': function GGA(str, gga) {
        if (gga.length !== 16 && gga.length !== 14) {
          throw new Error("Invalid GGA length: " + str);
        }
        /*
         11
         1         2       3 4        5 6 7  8   9  10 |  12 13  14  15
         |         |       | |        | | |  |   |   | |   | |   |   |
         $--GGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh
         
         1) Time (UTC)
         2) Latitude
         3) N or S (North or South)
         4) Longitude
         5) E or W (East or West)
         6) GPS Quality Indicator,
         0 = Invalid, 1 = Valid SPS, 2 = Valid DGPS, 3 = Valid PPS
         7) Number of satellites in view, 00 - 12
         8) Horizontal Dilution of precision, lower is better
         9) Antenna Altitude above/below mean-sea-level (geoid)
         10) Units of antenna altitude, meters
         11) Geoidal separation, the difference between the WGS-84 earth
         ellipsoid and mean-sea-level (geoid), '-' means mean-sea-level below ellipsoid
         12) Units of geoidal separation, meters
         13) Age of differential GPS data, time in seconds since last SC104
         type 1 or 9 update, null field when DGPS is not used
         14) Differential reference station ID, 0000-1023
         15) Checksum
         */


        return {
          'time': parseTime(gga[1]),
          'lat': parseCoord(gga[2], gga[3]),
          'lon': parseCoord(gga[4], gga[5]),
          'alt': parseDist(gga[9], gga[10]),
          'quality': parseGGAFix(gga[6]),
          'satellites': parseNumber(gga[7]),
          'hdop': parseNumber(gga[8]),
          // dilution
          'geoidal': parseDist(gga[11], gga[12]),
          // aboveGeoid
          'age': gga[13] === undefined ? null : parseNumber(gga[13]),
          // dgps time since update
          'stationID': gga[14] === undefined ? null : parseNumber(gga[14]) // dgpsReference??

        };
      },
      // GPS DOP and active satellites
      'GSA': function GSA(str, gsa) {
        if (gsa.length !== 19 && gsa.length !== 20) {
          throw new Error('Invalid GSA length: ' + str);
        }
        /*
         eg1. $GPGSA,A,3,,,,,,16,18,,22,24,,,3.6,2.1,2.2*3C
         eg2. $GPGSA,A,3,19,28,14,18,27,22,31,39,,,,,1.7,1.0,1.3*35
         
         
         1    = Mode:
         M=Manual, forced to operate in 2D or 3D
         A=Automatic, 3D/2D
         2    = Mode:
         1=Fix not available
         2=2D
         3=3D
         3-14 = PRNs of Satellite Vehicles (SVs) used in position fix (null for unused fields)
         15   = PDOP
         16   = HDOP
         17   = VDOP
         (18) = systemID NMEA 4.10
         18   = Checksum
         */


        var sats = [];

        for (var i = 3; i < 15; i++) {
          if (gsa[i] !== '') {
            sats.push(parseInt(gsa[i], 10));
          }
        }

        return {
          'mode': parseGSAMode(gsa[1]),
          'fix': parseGSAFix(gsa[2]),
          'satellites': sats,
          'pdop': parseNumber(gsa[15]),
          'hdop': parseNumber(gsa[16]),
          'vdop': parseNumber(gsa[17]),
          'systemId': gsa.length > 19 ? parseNumber(gsa[18]) : null
        };
      },
      // Recommended Minimum data for gps
      'RMC': function RMC(str, rmc) {
        if (rmc.length !== 13 && rmc.length !== 14 && rmc.length !== 15) {
          throw new Error('Invalid RMC length: ' + str);
        }
        /*
         $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh
         
         RMC  = Recommended Minimum Specific GPS/TRANSIT Data
         1    = UTC of position fix
         2    = Data status (A-ok, V-invalid)
         3    = Latitude of fix
         4    = N or S
         5    = Longitude of fix
         6    = E or W
         7    = Speed over ground in knots
         8    = Track made good in degrees True
         9    = UT date
         10   = Magnetic variation degrees (Easterly var. subtracts from true course)
         11   = E or W
         (12) = NMEA 2.3 introduced FAA mode indicator (A=Autonomous, D=Differential, E=Estimated, N=Data not valid)
         (13) = NMEA 4.10 introduced nav status
         12   = Checksum
         */


        return {
          'time': parseTime(rmc[1], rmc[9]),
          'status': parseRMC_GLLStatus(rmc[2]),
          'lat': parseCoord(rmc[3], rmc[4]),
          'lon': parseCoord(rmc[5], rmc[6]),
          'speed': parseKnots(rmc[7]),
          'track': parseNumber(rmc[8]),
          // heading
          'variation': parseRMCVariation(rmc[10], rmc[11]),
          'faa': rmc.length > 13 ? parseFAA(rmc[12]) : null,
          'navStatus': rmc.length > 14 ? rmc[13] : null
        };
      },
      // Track info
      'VTG': function VTG(str, vtg) {
        if (vtg.length !== 10 && vtg.length !== 11) {
          throw new Error('Invalid VTG length: ' + str);
        }
        /*
         ------------------------------------------------------------------------------
         1  2  3  4  5  6  7  8 9   10
         |  |  |  |  |  |  |  | |   |
         $--VTG,x.x,T,x.x,M,x.x,N,x.x,K,m,*hh<CR><LF>
         ------------------------------------------------------------------------------
         
         1    = Track made good (degrees true)
         2    = Fixed text 'T' indicates that track made good is relative to true north
         3    = optional: Track made good (degrees magnetic)
         4    = optional: M: track made good is relative to magnetic north
         5    = Speed over ground in knots
         6    = Fixed text 'N' indicates that speed over ground in in knots
         7    = Speed over ground in kilometers/hour
         8    = Fixed text 'K' indicates that speed over ground is in kilometers/hour
         (9)   = FAA mode indicator (NMEA 2.3 and later)
         9/10 = Checksum
         */


        if (vtg[2] === '' && vtg[8] === '' && vtg[6] === '') {
          return {
            'track': null,
            'trackMagetic': null,
            'speed': null,
            'faa': null
          };
        }

        if (vtg[2] !== 'T') {
          throw new Error('Invalid VTG track mode: ' + str);
        }

        if (vtg[8] !== 'K' || vtg[6] !== 'N') {
          throw new Error('Invalid VTG speed tag: ' + str);
        }

        return {
          'track': parseNumber(vtg[1]),
          // heading
          'trackMagnetic': vtg[3] === '' ? null : parseNumber(vtg[3]),
          // heading uncorrected to magnetic north
          'speed': parseKnots(vtg[5]),
          'faa': vtg.length === 11 ? parseFAA(vtg[9]) : null
        };
      },
      // satellites in view
      'GSV': function GSV(str, gsv) {
        if (gsv.length % 4 % 3 === 0) {
          throw new Error('Invalid GSV length: ' + str);
        }
        /*
         $GPGSV,1,1,13,02,02,213,,03,-3,000,,11,00,121,,14,13,172,05*67
         
         1    = Total number of messages of this type in this cycle
         2    = Message number
         3    = Total number of SVs in view
         repeat [
         4    = SV PRN number
         5    = Elevation in degrees, 90 maximum
         6    = Azimuth, degrees from true north, 000 to 359
         7    = SNR (signal to noise ratio), 00-99 dB (null when not tracking, higher is better)
         ]
         N+1   = signalID NMEA 4.10
         N+2   = Checksum
         */


        var sats = [];

        for (var i = 4; i < gsv.length - 3; i += 4) {
          var prn = parseNumber(gsv[i]);
          var snr = parseNumber(gsv[i + 3]);
          /*
           Plot satellites in Radar chart with north on top
           by linear map elevation from 0° to 90° into r to 0
           
           centerX + cos(azimuth - 90) * (1 - elevation / 90) * radius
           centerY + sin(azimuth - 90) * (1 - elevation / 90) * radius
           */

          sats.push({
            'prn': prn,
            'elevation': parseNumber(gsv[i + 1]),
            'azimuth': parseNumber(gsv[i + 2]),
            'snr': snr,
            'status': prn !== null ? snr !== null ? 'tracking' : 'in view' : null
          });
        }

        return {
          'msgNumber': parseNumber(gsv[2]),
          'msgsTotal': parseNumber(gsv[1]),
          //'satsInView'  : parseNumber(gsv[3]), // Can be obtained by satellites.length
          'satellites': sats,
          'signalId': gsv.length % 4 === 2 ? parseNumber(gsv[gsv.length - 2]) : null // NMEA 4.10 addition

        };
      },
      // Geographic Position - Latitude/Longitude
      'GLL': function GLL(str, gll) {
        if (gll.length !== 9 && gll.length !== 8) {
          throw new Error('Invalid GLL length: ' + str);
        }
        /*
         ------------------------------------------------------------------------------
         1       2 3        4 5         6 7   8
         |       | |        | |         | |   |
         $--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,a,m,*hh<CR><LF>
         ------------------------------------------------------------------------------
         
         1. Latitude
         2. N or S (North or South)
         3. Longitude
         4. E or W (East or West)
         5. Universal Time Coordinated (UTC)
         6. Status A - Data Valid, V - Data Invalid
         7. FAA mode indicator (NMEA 2.3 and later)
         8. Checksum
         */


        return {
          'time': parseTime(gll[5]),
          'status': parseRMC_GLLStatus(gll[6]),
          'lat': parseCoord(gll[1], gll[2]),
          'lon': parseCoord(gll[3], gll[4]),
          'faa': gll.length === 9 ? parseFAA(gll[7]) : null
        };
      },
      // UTC Date / Time and Local Time Zone Offset
      'ZDA': function ZDA(str, zda) {
        /*
         1    = hhmmss.ss = UTC
         2    = xx = Day, 01 to 31
         3    = xx = Month, 01 to 12
         4    = xxxx = Year
         5    = xx = Local zone description, 00 to +/- 13 hours
         6    = xx = Local zone minutes description (same sign as hours)
         */
        // TODO: incorporate local zone information
        return {
          'time': parseTime(zda[1], zda[2] + zda[3] + zda[4]) //'delta': time === null ? null : (Date.now() - time) / 1000

        };
      },
      'GST': function GST(str, gst) {
        if (gst.length !== 10) {
          throw new Error('Invalid GST length: ' + str);
        }
        /*
         1    = Time (UTC)
         2    = RMS value of the pseudorange residuals; includes carrier phase residuals during periods of RTK (float) and RTK (fixed) processing
         3    = Error ellipse semi-major axis 1 sigma error, in meters
         4    = Error ellipse semi-minor axis 1 sigma error, in meters
         5    = Error ellipse orientation, degrees from true north
         6    = Latitude 1 sigma error, in meters
         7    = Longitude 1 sigma error, in meters
         8    = Height 1 sigma error, in meters
         9    = Checksum
         */


        return {
          'time': parseTime(gst[1]),
          'rms': parseNumber(gst[2]),
          'ellipseMajor': parseNumber(gst[3]),
          'ellipseMinor': parseNumber(gst[4]),
          'ellipseOrientation': parseNumber(gst[5]),
          'latitudeError': parseNumber(gst[6]),
          'longitudeError': parseNumber(gst[7]),
          'heightError': parseNumber(gst[8])
        };
      },
      // add HDT
      'HDT': function HDT(str, hdt) {
        if (hdt.length !== 4) {
          throw new Error('Invalid HDT length: ' + str);
        }
        /*
         ------------------------------------------------------------------------------
         1      2  3
         |      |  |
         $--HDT,hhh.hhh,T*XX<CR><LF>
         ------------------------------------------------------------------------------
         
         1. Heading in degrees
         2. T: indicates heading relative to True North
         3. Checksum
         */


        return {
          'heading': parseFloat(hdt[1]),
          'trueNorth': hdt[2] === 'T'
        };
      },
      'GRS': function GRS(str, grs) {
        if (grs.length !== 18) {
          throw new Error('Invalid GRS length: ' + str);
        }

        var res = [];

        for (var i = 3; i <= 14; i++) {
          var tmp = parseNumber(grs[i]);
          if (tmp !== null) res.push(tmp);
        }

        return {
          'time': parseTime(grs[1]),
          'mode': parseNumber(grs[2]),
          'res': res
        };
      },
      'GBS': function GBS(str, gbs) {
        if (gbs.length !== 10 && gbs.length !== 12) {
          throw new Error('Invalid GBS length: ' + str);
        }
        /*
         0      1   2   3   4   5   6   7   8
         |      |   |   |   |   |   |   |   |
         $--GBS,hhmmss.ss,x.x,x.x,x.x,x.x,x.x,x.x,x.x*hh<CR><LF>
         
         1. UTC time of the GGA or GNS fix associated with this sentence
         2. Expected error in latitude (meters)
         3. Expected error in longitude (meters)
         4. Expected error in altitude (meters)
         5. PRN (id) of most likely failed satellite
         6. Probability of missed detection for most likely failed satellite
         7. Estimate of bias in meters on most likely failed satellite
         8. Standard deviation of bias estimate
         --
         9. systemID (NMEA 4.10)
         10. signalID (NMEA 4.10)
         */


        return {
          'time': parseTime(gbs[1]),
          'errLat': parseNumber(gbs[2]),
          'errLon': parseNumber(gbs[3]),
          'errAlt': parseNumber(gbs[4]),
          'failedSat': parseNumber(gbs[5]),
          'probFailedSat': parseNumber(gbs[6]),
          'biasFailedSat': parseNumber(gbs[7]),
          'stdFailedSat': parseNumber(gbs[8]),
          'systemId': gbs.length === 12 ? parseNumber(gbs[9]) : null,
          'signalId': gbs.length === 12 ? parseNumber(gbs[10]) : null
        };
      },
      'GNS': function GNS(str, gns) {
        if (gns.length !== 14 && gns.length !== 15) {
          throw new Error('Invalid GNS length: ' + str);
        }

        return {
          'time': parseTime(gns[1]),
          'lat': parseCoord(gns[2], gns[3]),
          'lon': parseCoord(gns[4], gns[5]),
          'mode': gns[6],
          'satsUsed': parseNumber(gns[7]),
          'hdop': parseNumber(gns[8]),
          'alt': parseNumber(gns[9]),
          'sep': parseNumber(gns[10]),
          'diffAge': parseNumber(gns[11]),
          'diffStation': parseNumber(gns[12]),
          'navStatus': gns.length === 15 ? gns[13] : null // NMEA 4.10

        };
      }
    };

    GPS['Parse'] = function (line) {
      if (typeof line !== 'string') return false;
      var nmea = line.split(',');
      var last = nmea.pop(); // HDT is 2 items length

      if (nmea.length < 2 || line.charAt(0) !== '$' || last.indexOf('*') === -1) {
        return false;
      }

      last = last.split('*');
      nmea.push(last[0]);
      nmea.push(last[1]); // Remove $ character and first two chars from the beginning

      nmea[0] = nmea[0].slice(3);

      if (GPS['mod'][nmea[0]] !== undefined) {
        // set raw data here as well?
        var data = this['mod'][nmea[0]](line, nmea);
        data['raw'] = line;
        data['valid'] = isValid(line, nmea[nmea.length - 1]);
        data['type'] = nmea[0];
        return data;
      }

      return false;
    }; // Heading (N=0, E=90, S=189, W=270) from point 1 to point 2


    GPS['Heading'] = function (lat1, lon1, lat2, lon2) {
      var dlon = (lon2 - lon1) * D2R;
      lat1 = lat1 * D2R;
      lat2 = lat2 * D2R;
      var sdlon = Math.sin(dlon);
      var cdlon = Math.cos(dlon);
      var slat1 = Math.sin(lat1);
      var clat1 = Math.cos(lat1);
      var slat2 = Math.sin(lat2);
      var clat2 = Math.cos(lat2);
      var y = sdlon * clat2;
      var x = clat1 * slat2 - slat1 * clat2 * cdlon;
      var head = Math.atan2(y, x) * 180 / Math.PI;
      return (head + 360) % 360;
    };

    GPS['Distance'] = function (lat1, lon1, lat2, lon2) {
      // Haversine Formula
      // R.W. Sinnott, "Virtues of the Haversine", Sky and Telescope, vol. 68, no. 2, 1984, p. 159
      // Because Earth is no exact sphere, rounding errors may be up to 0.5%.
      // var RADIUS = 6371; // Earth radius average
      // var RADIUS = 6378.137; // Earth radius at equator
      var RADIUS = 6372.8; // Earth radius in km

      var hLat = (lat2 - lat1) * D2R * 0.5; // Half of lat difference

      var hLon = (lon2 - lon1) * D2R * 0.5; // Half of lon difference

      lat1 = lat1 * D2R;
      lat2 = lat2 * D2R;
      var shLat = Math.sin(hLat);
      var shLon = Math.sin(hLon);
      var clat1 = Math.cos(lat1);
      var clat2 = Math.cos(lat2);
      var tmp = shLat * shLat + clat1 * clat2 * shLon * shLon; //return RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

      return RADIUS * 2 * Math.asin(Math.sqrt(tmp));
    };

    GPS['TotalDistance'] = function (path) {
      if (path.length < 2) return 0;
      var len = 0;

      for (var i = 0; i < path.length - 1; i++) {
        var c = path[i];
        var n = path[i + 1];
        len += GPS['Distance'](c['lat'], c['lon'], n['lat'], n['lon']);
      }

      return len;
    };

    GPS.prototype['update'] = function (line) {
      var parsed = GPS['Parse'](line);
      this['state']['processed']++;

      if (parsed === false) {
        this['state']['errors']++;
        return false;
      }

      updateState(this['state'], parsed);
      this['emit']('data', parsed);
      this['emit'](parsed.type, parsed);
      return true;
    };

    GPS.prototype['partial'] = "";

    GPS.prototype['updatePartial'] = function (chunk) {
      this['partial'] += chunk;

      while (true) {
        var pos = this['partial'].indexOf("\r\n");
        if (pos === -1) break;
        var line = this['partial'].slice(0, pos);

        if (line.charAt(0) === '$') {
          this['update'](line);
        }

        this['partial'] = this['partial'].slice(pos + 2);
      }
    };

    GPS.prototype['on'] = function (ev, cb) {
      if (this['events'][ev] === undefined) {
        this['events'][ev] = cb;
        return this;
      }

      return null;
    };

    GPS.prototype['off'] = function (ev) {
      if (this['events'][ev] !== undefined) {
        this['events'][ev] = undefined;
      }

      return this;
    };

    GPS.prototype['emit'] = function (ev, data) {
      if (this['events'][ev] !== undefined) {
        this['events'][ev].call(this, data);
      }
    };

    {
      Object.defineProperty(exports, "__esModule", {
        'value': true
      });
      GPS['default'] = GPS;
      GPS['GPS'] = GPS;
      module['exports'] = GPS;
    }
  })();
});
/*
version: 1.0.0
**/

/****************************************加载依赖模块开始*******************************************************/
// 加载GPIO模块 获取GPIO对象
// 加载IOT模块 获取物联网平台相关操作所用对象
// 加载NETWORK模块 获取网络状态所用对象
// 加载UART模块 获取串口对象
// 加载i2c模块 获取i2c对象
//加载GNSS模块 获取GNSS对象

/****************************************加载依赖模块结束*******************************************************/

/****************************************公共函数模块开始*******************************************************/
//定义函数 [数组转字符串]

function ArrayToString(fileData) {
  var dataString = "";

  for (var i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }

  return dataString;
}
/****************************************公共函数模块结束*******************************************************/

/****************************************温度传感模块开始*******************************************************/
//初始化板上LM75A温度传感器


var lm75 = i2c__default['default'].open({
  id: "I2C1"
}); //初始化温度值

var temperature = 0; //定义函数 [温度传感器读取温度值]

function lm75tmpGet() {
  var sig = 1;
  var temp;
  var regval = lm75.readMem(0x00, 2);
  var tempAll = (regval[0] << 8) + regval[1];

  if (regval[0] & 0x80 != 0) {
    tempAll = ~tempAll + 1;
    sig = -1;
  }

  tempAll = tempAll >> 5;
  temp = tempAll * 0.125 * sig;
  return temp;
}
/****************************************温度传感模块结束*******************************************************/

/****************************************人体检测模块开始*******************************************************/
//初始化LED灯数据[发送]io口


var ledBlue = gpio__default['default'].open({
  id: "D2"
});
var ledGreen = gpio__default['default'].open({
  id: "D3"
}); // 初始化人体检测传感器数据[接收]io口

var sensor = gpio__default['default'].open({
  id: "D4"
}); //初始化LED灯状态值

var sensorValue = 0;
var blueValue = 1;
var greenValue = 1;
ledBlue.writeValue(blueValue);
ledGreen.writeValue(greenValue);
/****************************************人体检测模块结束*******************************************************/

/****************************************GPS模块开始*******************************************************/
//打开并初始化UART1 用于连接GNSS模块

var uart1 = uart__default['default'].open({
  id: "UART1"
}); //创建GNSS解析器

var gnss = new gnss$1(); //初始化地理位置信息

var geoLocation_data = {
  lat: 0,
  lon: 0,
  alt: 0
}; //初始化GGA数据

var GGA; //GNSS解析器 监听data事件

gnss.on("data", function (parsed) {
  geoLocation_data["lat"] = parsed["lat"];
  geoLocation_data["lon"] = parsed["lon"];
  geoLocation_data["alt"] = parsed["alt"];
}); //获取UART1串口数据 把数据转换成字符串 解析成GGA数据 然后上传至GNSS解析器

uart1.on("data", function (data) {
  var aaa = ArrayToString(data);
  var bbb = aaa.split("$");
  GGA = "$" + bbb[1];
  gnss.update(GGA);
});
/****************************************GPS模块结束*******************************************************/

/****************************************摄像头模块开始*******************************************************/
//打开并初始化UART2

var uart2 = uart__default['default'].open({
  id: "UART2"
}); //初始化摄像头指令控制数据

var commandData = []; //初始化图片数据

var photoData = ""; //定义函数 [摄像头指令写入及读取]

function writeAndRead() {
  //摄像头指令写入
  uart2.write(commandData); //摄像头指令读取

  uart2.on("data", function (data) {
    photoData = ArrayToString(data);
    console.log(photoData);
  });
} //定义函数 [拍照]


function take() {
  commandData = [0x56, 0x00, 0x36, 0x01, 0x00];
  writeAndRead();
  console.log("take");
} //定义函数 [读取长度]


function readlenth() {
  commandData = [0x56, 0x00, 0x34, 0x01, 0x00];
  writeAndRead();
  console.log("readlenth");
} //定义函数 [读数]


function readnum() {
  commandData = [0x56, 0x00, 0x32, 0x0c, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x4b, 0xc6, 0x00, 0xff];
  writeAndRead();
  console.log("readnum");
} //定义函数 [停止拍照]


function stop() {
  commandData = [0x56, 0x00, 0x36, 0x01, 0x03];
  writeAndRead();
  console.log("stop");
} //定义函数 [拍一次照片]


function takephoto() {
  take();
  readlenth();
  readnum();
  stop();
  console.log("done!");
}
/****************************************摄像头模块结束*******************************************************/

/****************************************磁力锁模块开始*******************************************************/
//初始化MOS模块[发送]io口


var sig = gpio__default['default'].open({
  id: "D1"
}); //初始化磁力锁上电状态

var sigValue = 1;
sig.writeValue(sigValue);
/****************************************磁力锁模块结束*******************************************************/

/****************************************业务逻辑编写开始*******************************************************/
//函数定义 [数据上传至阿里云]

function uploadData(iotdev) {
  // 收到物联网下发的服务调用消息
  iotdev.onService(function (service) {
    console.log("received cloud service id " + service.service_id);
    console.log("received cloud service param  " + service.params);
    console.log("received cloud service param len  " + service.params_len);
  }); // 收到物联网平台下发的属性控制消息

  iotdev.onProps(function (properity) {
    console.log("received cloud properity param " + properity.params);
    console.log("received cloud properity param len " + properity.params_len);
    var payload = JSON.parse(properity.params); //收到磁力锁的控制信息 执行指令 并上报状态

    if (payload.LockSwitch !== undefined) {
      sigValue = parseInt(payload.LockSwitch);
      sig.writeValue(sigValue);
      iotdev.postProps(JSON.stringify({
        LockSwitch: sigValue
      }));
    } //收到LED灯的控制信息 执行指令 并上报状态


    if (payload.Blue !== undefined || payload.Green !== undefined) {
      blueValue = parseInt(payload.Blue);
      greenValue = parseInt(payload.Green);
      ledBlue.writeValue(blueValue);
      ledGreen.writeValue(greenValue);
      iotdev.postProps(JSON.stringify({
        Blue: blueValue,
        Green: greenValue
      }));
    }
  }); // 定时检测 将数据保存到iotdev

  setInterval(function () {
    //更新GPS数据
    gnss.update(GGA);
    console.log("location: " + geoLocation_data["lat"] + "," + geoLocation_data["lon"] + "," + geoLocation_data["alt"]); //更新温度数据

    temperature = lm75tmpGet();
    console.log("temperature: " + temperature); //更新LED灯状态值

    sensorValue = sensor.readValue();

    if (sensorValue == 1) {
      blueValue = 0;
      greenValue = 1;
      ledBlue.writeValue(blueValue);
      ledGreen.writeValue(greenValue);
      console.log("someone is coming!"); //更新图片数据

      takephoto();
      console.log("photodata=" + photoData);
    } else {
      blueValue = 1;
      greenValue = 1;
      ledBlue.writeValue(blueValue);
      ledGreen.writeValue(greenValue);
    } //将数据保存到iotdev


    iotdev.postProps(JSON.stringify({
      PIR: sensorValue,
      ImgHex: photoData,
      CurrentTemperature: temperature,
      GeoLocation: {
        Longitude: geoLocation_data["lon"],
        Latitude: geoLocation_data["lat"],
        Altitude: geoLocation_data["alt"],
        CoordinateSystem: 1
      },
      LockSwitch: sigValue,
      Blue: blueValue,
      Green: greenValue
    }));
  }, 5000);
} //函数定义 [创建物联网设备]


function iotDeviceCreate() {
  //初始化设备三元组
  var productKey = "a1mrB2wyKr6";
  var deviceName = "SAZGtcVUlMClGBcPGeGN";
  var deviceSecret = "81af76416445865193e20e23ed65c9c1"; // 初始化IoT连接

  var iotdev = iot__default['default'].device({
    productKey: productKey,
    deviceName: deviceName,
    deviceSecret: deviceSecret
  }); // IoT连接成功事件的回调函数注册

  iotdev.on("connect", function () {
    console.log("success connect to aliyun iot server"); // 上报数据

    uploadData(iotdev);
  }); // IoT重新连接成功的回调函数注册

  iotdev.on("reconnect", function () {
    console.log("success reconnect to aliyun iot server");
  }); // IoT断开连接事件的回调函数注册

  iotdev.on("disconnect", function () {
    console.log("aliyun iot server disconnected");
  });
} //初始化网络模块


var networkClient = network__default['default'].openNetWorkClient(); //获取网络连接状态

var netStatus = networkClient.getStatus(); //网络注册连接的判断业务

if (netStatus == "connect") {
  console.log("network connected, create iot connection");
  iotDeviceCreate(); // 网络连接成功后，连接物联网平台
} else {
  // 如果网络当前连线状态为未联网状态则注册连接成功的回调函数，一旦连接成功则连接物联网平台
  networkClient.on("connect", function () {
    console.log("network connected, create iot connection");
    iotDeviceCreate();
  });
}
/****************************************业务逻辑编写结束*******************************************************/


var app = {};
var __amp_module = app;
