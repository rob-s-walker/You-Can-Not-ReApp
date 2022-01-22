import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Magnetometer, DeviceMotion, Gyroscope } from 'expo-sensors';
import MagVar from 'magvar';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import AppLoading from 'expo-app-loading';
import * as Font from 'expo-font';
import LPF from 'lpf';

export default function App() {
  //[assets, err] = useAssets([require("./assets/fonts/FOT-MatissePro-EB_0.otf"),require("./assets/fonts/SevenSegment.ttf"),require("./assets/fonts/Helvetica.ttf")])
  const [Fl] = Font.useFonts({
    Font1: require("./assets/fonts/FOT-MatissePro-EB_0.otf"),
    Font2: require("./assets/fonts/SevenSegment.ttf"),
    Font3: require("./assets/fonts/Helvetica.ttf")})
    const [mv, SetMV] = useState([0,0,0]);
    const [gv, SetGV] = useState([0,0,0]);
    const [rx, SetR] = useState([0,0,0]);
    const [jd, SetJD] = useState(0);
    const [l, SetL] = useState([0,0]);
    const [status, requestPermission] = Location.useBackgroundPermissions();
    const [errorMsg, setErrorMsg] = useState(null);
    const [bstyle, setBstyle] = useState(styles.buttonOFFtext);
    const [btext, setBText] = useState("GPS");
    const [ns, setNS] = useState('0.00');
    const [ew, setEW] = useState('0.00');
    const [map, setMap] = useState([]);
    const [s, setS] = useState([]);
    const [mCompass,setMCompass] = useState(false);
    const [h, setH] = useState(0);
    const [camera,setCamera] = useState({
        center:{
            latitude:40.76604,
            longitude:-111.89058
        },
        heading:180,
        pitch:0,
        zoom: 15,
        altitude: 0
    });
    LPF.smoothing=.2;

  useEffect(
    () => {
     if (!Fl) {
      Magnetometer.setUpdateInterval(1000);
      DeviceMotion.setUpdateInterval(1000);
      Gyroscope.setUpdateInterval(1000);
      (async () => {
        var p = await Location.getCurrentPositionAsync();
        SetL(p.latitude, p.longitude);
      })();
      setJulianDays();
      LPF.init([]);
      tog();
      console.log(Fl)
    }
  return () => {
      unsub();
  };
},[]);

  sub = () => {
    setS([Magnetometer.addListener((result) => {
      SetMV([result.x,result.y,result.z]);
      setH(CalcMagHeading());
    }), Gyroscope.addListener((result) => {
      //console.log(result);
      setH(CalcMagHeading());
    })
    
    
    , DeviceMotion.addListener((result) => {
      var a = result.rotation.alpha;
      var b = result.rotation.beta;
      var g = result.rotation.gamma;
      
      var A = a * (180 / Math.PI);
      var B = b * (180 / Math.PI);
      var G = g * (180 / Math.PI);

      //console.log([A,B,G]);
      SetR([a,b,g]);

    })]
    );
    
}
unsub = () => {
    s && s.remove;
    setS(null);
}

tog = () => {
    if(s){
        unsub();
    }else{
        sub();
    }
}

CalcMagHeading = () => {
  var hx = 0;
  var roll = Math.PI + rx[0];       //x  beta
  var pitch = Math.PI + rx[2];      //z  alpha
  //console.log(pitch);
  console.log(pitch * (180 / Math.PI));
  var x = mv[2];
  var y = mv[0];
  var z = mv[1];
  // var cx = (x*Math.cos(pitch)+ y*Math.sin(roll)*Math.sin(pitch) + z*Math.cos(roll)*Math.sin(pitch));
  // var cy = (y*Math.cos(roll) + z*Math.sin(roll));

  if (Math.atan2(y, x) >= 0) {
    hx = Math.atan2(y, x) * (180 / Math.PI);
  } else {
    hx = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
  }

  // if(cx < 0){
  //   hx = (Math.PI - Math.atan(cy/cx)) * (180 / Math.PI);
  // }else if(cx > 0 && cy < 0){
  //   hx = (-Math.atan(cy/cx)) * (180 / Math.PI);
  // }else if(cx > 0 && cy > 0){
  //   hx = (360-Math.atan(cy/cx)) * (180 / Math.PI);
  // }else if(cx = 0 && cy < 0){
  //   hx = 90;
  // }else if(cx = 0 && cy > 0){
  //   hx = 270;
  // }

  hx = Math.round(LPF.next(hx) + MagVar.get(jd,l[0],l[1]));
  hx = hx ;
  hx = hx % 360;
  hx = Math.ceil(hx/30)*30
  hx = Math.floor(hx/90)*90
  if(hx > 180){
    hx = -360 + hx
  } else if (hx < -180){
    hx = 360 + hx;
  }
  // if(-hx - h >= 30){
    
  //console.log(180 - Math.abs(hx));
  //   return -hx
  //   //console.log("\n");
  // }
  return hx;
}


setJulianDays = () => {
  var today = new Date(Date.now());
  var d = today.getDay();
  var m = today.getMonth();
  var y = today.getFullYear() - 2000;
  console.log(y);
  var j = MagVar.yymmdd_to_julian_days(d,m,y);
  //console.log(j);
  SetJD(j);
}

locationCameraChange = (event) => {
  var c = map.getCamera();
  var location = event.nativeEvent.coordinate;
  SetL([location.latitude, location.longitude]);
    if(mCompass){
      var cam = {
        center: {
            latitude: location.latitude,
            longitude: location.longitude
        },
        heading: h,
        pitch: 0,
        altitude: 0,
        zoom: c.zoom
    }
    }else{
      var cam = {
        center: {
            latitude: location.latitude,
            longitude: location.longitude
        },
        heading: location.heading,
        pitch: 0,
        altitude: 0,
        zoom: c.zoom
    }
  }
  if(location.latitude  > 0){
    setNS(toDegMS(location.latitude)+" N")
  }else{
    setNS(toDegMS(location.latitude*-1)+" S")
  }
  if(location.longitude  > 0){
    setEW(toDegMS(location.longitude)+" E");
  }else{
    setEW(toDegMS(location.longitude*-1)+" W");
  }
   if(map !== undefined){
     map.animateCamera(cam);
   } 
    
}

  toDegMS = (num) => {
    var d = Math.floor(num);
    var m = Math.floor((num - d)*60);
    var s = Math.floor((((num - d)*60) - m) * 600000)/10000;
    var sx = ""
    var dx = ""
    var mx = ""
    if(d < 10){
      dx = "0" + d.toString();
    }else{
      dx = d.toString();
    }
    if(m < 10){
      mx = "0" + m.toString();
    }else{
      mx = m.toString();
    }
    if(s < 10){
      sx = "0" + s.toFixed(4).toString();
    }else{
      sx = s.toFixed(4).toString();
    }

    return dx + "°" + mx + "'" + sx  + '"';
  }

  ChangeHeading = () => {
    setMCompass(!mCompass)
    tog();
    tog();
  }

  if (!Fl) {
      return <AppLoading onError={console.warn}/>;
  }
  return(
      <View style={styles.container}>
          <View style={{flexDirection: 'row', marginHorizontal:10, marginTop: 20}}>
            <View >
              <View style={styles.stepsbox}>
                
                <View style={styles.labelview}>
                  <Text style={styles.labeltext}>緯度</Text>
                </View>
                <View style={styles.rowA}>
                  <Text style={styles.elabeltextA}>LATITUDE</Text>
                  <Text style={styles.stepstext}>{ns}</Text>
                </View>
              </View>
              <View style={styles.stepsbox}>
                
                <View style={styles.labelview}>
                  <Text style={styles.labeltext}>経度</Text>
                  </View>
                <View style={styles.rowB}>
                  <Text style={styles.elabeltextB}>LONGITUDE</Text>
                  <Text style={styles.stepstext}>{ew}</Text>
                </View>
              </View>
              
            </View>
            <View style={styles.buttonview}>
              <Text style={styles.buttonlabel}>HEADING</Text>
              <Text onPress={ChangeHeading} style={mCompass?styles.buttonONtext: styles.buttonOFFtext}>{mCompass ? "GYRO":"GPS"}</Text>
            </View>
            </View>
            <View style={styles.mapbox}>
          <MapView 
              style={styles.mapstyle}
              camera={camera}
              ref={(maps) => { setMap(maps) }}
              provider={"google"}
              customMapStyle={mapsettings}
              showsBuildings={false}
              showsMyLocationButton={false}
              showsTraffic={false}
              showsIndoors={false}
              pitchEnabled={false}
              scrollEnabled={false}
              rotateEnabled={false}
              toolbarEnabled={false}
              onUserLocationChange={event => locationCameraChange(event)}
              userLocationPriority={"high"}
              showsUserLocation={true}
              tintColor={"#5bf7ae"}/>
              </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelview:{
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    width: 300,
  },
  labeltext: {
    marginTop: -10,
    marginLeft: -220,
    marginRight: 0,
    padding: -5,
    fontFamily: 'Font1',
    color:"#c51110",
    //transform: [{scaleX: .8}],
    fontSize: 72,
    alignSelf: 'flex-start',
    textAlignVertical: "top",
    textAlign: 'right',
    transform: [{scaleX: .5},{scaleY: 1.1}],
    
  },
  elabeltextA:{
    width: 400,
    marginTop: -35,
    marginLeft: -20,
    height: 50,
    //marginLeft: 30,
    fontFamily: 'Font3',
    fontSize: 36,
    color:"#f19902",
    transform: [{scaleX: .45},{ scaleY: .45}],
    alignSelf: 'flex-start',
    textAlign: 'left',
    textAlignVertical: 'bottom',
    marginBottom: 1
  },
  elabeltextB:{
    width: 400,
    marginTop: -35,
    marginLeft: -20,
    height: 50,
    //marginLeft: 30,
    fontFamily: 'Font3',
    fontSize: 36,
    color:"#f19902",
    transform: [{scaleX: .45},{ scaleY: .45}],
    alignSelf: 'flex-start',
    textAlign: 'left',
    textAlignVertical: 'bottom',
    marginBottom: 2
  },
  buttonview: {
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 185,
    borderColor: "#f19902",
    borderRadius: 1,
    padding: 0,
    alignItems: "center",
    alignSelf:"flex-start",
    borderWidth: 3,
    margin: 5
    
  },
  buttonONtext:{
    margin: 0,
    padding: 0,
    textAlign:"center",
    fontFamily: 'Font1',
    transform: [{scaleX: .4},{scaleY: .8}],
    fontSize: 20,
    padding: 5,
    backgroundColor: "#c51110",
    width: 150
  },
  buttonOFFtext:{
    textAlign:"center",
    margin: 5,
    padding: 0,
    fontFamily: 'Font1',
    transform: [{scaleX: .5},{scaleY: 1}],
    fontSize: 20,
    backgroundColor: "#5bf7ae",
    width: 125
  },
  buttonlabel:{
    margin: 0,
    textAlign: "center",
    fontFamily: 'Font1',
    transform: [{scaleX: .5}],
    fontSize: 20,
    color: "#f19902",
    width: 125
  },
  stepstext: {
    marginTop: 25,
    fontFamily: 'Font2',
    color:"#f19902",
    fontSize: 30,
    maxWidth: 300,
    transform: [{scaleX: 1},{scaleY: 1.7}],
    alignSelf:'center',
    textAlign:'right',
    marginTop: -10,
  },
  otherview:{
    marginTop:30,
    backgroundColor: '#000',
    height: 300
  },
  mapstyle:
  {   
      alignSelf:"stretch",
      height: 400,
      width: 410,
     
      
  },
  mapbox:{

    margin: 15,
    marginBottom: -175,
    borderColor:"#f19902",
      borderRadius: 10,
      padding: 5,
      borderWidth: 2
  },
  stepsbox:{
    flexDirection: 'row',
    borderColor: "#f19902",
    borderRadius: 1,
    padding: 0,
    alignItems: 'center',
    alignSelf:"flex-start",
    borderWidth: 3,
    margin: 5,
    maxWidth: 300,
    maxHeight: 125
  },
  rowA: {
    flexDirection: "column",
    flexWrap: 'nowrap',
    alignItems:'center',
    marginLeft: -300,
    marginVertical: 15
  },
  rowB: {
    flexDirection: "column",
    flexWrap: 'nowrap',
    alignItems:'center',
    marginLeft: -300,
    marginVertical: 15
  }

  
});


var mapsettings = [
  {
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#000000"
      },
      {
        "weight": 1.5
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "landscape",
    "stylers": [
      {
        "color": "#f19902"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "weight": 1.5
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "color": "#5bf7ae"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#000000"
      },
      {
        "weight": 1.5
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "road",
    "stylers": [
      {
        "color": "#c51110"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "simplified"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  }
]

