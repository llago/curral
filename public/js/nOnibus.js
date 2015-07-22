	$('#linea').val('321');
	$("#initialDate").val('01/06/2015 11:45:00');
	$("#finalDate").val('01/06/2015 17:45:00');
	//$('#button').on('submit', function(){
		runQuery();
    //});


function getBaseUrl() {
    var re = new RegExp(/^.*\//);
    return re.exec(window.location.href);
}



function runQuery() {
    startLoadingAnimation();

    if($('#linea').val())
        line =  $('#linea').val();


    var initialDate = $("#initialDate").val();
    var finalDate = $("#finalDate").val();

    if (!initialDate || !finalDate)
    {
        alert("Por favor, preencha as datas")
        return;
    }
    var month = moment(initialDate,"DD/MM/YYYY HH:mm:ss").format("YYYYMM");
    initialDate = moment(initialDate,"DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    finalDate = moment(finalDate,"DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");


    //Making the query
    var where ="";
    var and = false;
    if($('#linea').val()){
        where += 'LINHA = "'+ $('#linea').val()+'"';
        and = true;
    }
    if($('#idBus').val()){
        if(and) where += " AND ";else and=true;
        where += 'ORDEM ="'+$('#idBus').val()+'"';
    }
    if(and) where+= " AND ";

    /*var query = 'SELECT * FROM [riobus-analytics:onibus.gps_'+month+'] '+
        'WHERE  '+where+' VELOCIDADE >0 AND TIMESTAMP(DATAHORA) > "'+initialDate+'" '+
        'AND TIMESTAMP(DATAHORA) < "'+finalDate+'" ORDER BY ORDEM,DATAHORA';*/

	var query = "SELECT * FROM ";
	for (var hour =0 ;hour <23; hour ++){
		query = query + " ( SELECT COUNT (*), "+hour+" FROM ";
		query = query + "( Select   ORDEM";
		query = query + " FROM [riobus-analytics:onibus.gps_"+month+"]";
		query = query + " WHERE LINHA = '"+ $('#linea').val()+"'";
		if(hour <10){
			query = query + " and DATAHORA >= '"+initialDate+" 0"+hour+":00:00 UTC' ";
		}else{
			query = query + " and DATAHORA >= '"+initialDate+" "+hour+":00:00 UTC' ";
		}if((hour+1) <10){
			query = query + " and DATAHORA <= '"+initialDate+" 0"+(hour+1)+":00:00 UTC' ";
		}else{
			query = query + " and DATAHORA <= '"+initialDate+" "+(hour+1)+":00:00 UTC' ";
		}
		query = query + " Group By ORDEM)),"
	}
	for (var hour2 =0 ;hour2 <23; hour2 ++) {
        query = query + "( select count (*), " + (hour2) + " from (( Select  ORDEM"
        query = query + " FROM [riobus-analytics:onibus.gps_" + month + "]";
        query = query + "  WHERE LINHA = '" + $('#linea').val() + "'";
        if (hour2 < 10) {
            query = query + " and DATAHORA >= '" + initialDate + " 0" + (hour2) + ":00:00 UTC' "
        } else {
            query = query + " and DATAHORA >= '" + initialDate + " " + (hour2) + ":00:00 UTC' "
        }
        if ((hour2 + 1) < 10) {
            query = query + " and DATAHORA <= '" + initialDate + " 0" + (hour2 + 1) + ":00:00 UTC' "
        } else {
            query = query + " and DATAHORA <= '" + initialDate + " " + (hour2 + 1) + ":00:00 UTC' "
        }
        if (hour2 == 22) {
            query = query + "Group By ORDEM having avg(velocidade) > 5)))"
        } else {
            query = query + "Group By ORDEM having avg(velocidade) > 5))),"
        }

        query = query + " LIMIT 1000 ;"
    }
    //TODO should send something nicer;;;

	$('#content').append(query);

    var url = getBaseUrl()+'api/bigquery?query='+query;

    console.log("querying...");
   // console.log(url);
    $.getJSON(url, function(data, status) {

        var stateValues = data;

        endLoadingAnimation();
        $('#content').append(data);


    });


}



function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function createArrow(latlng, direcao, color){
    var bool = true;
    if(direcao > 0 && direcao < 360){
        var lat = latlng.lat()+Math.cos(toRadians(direcao))*0.0005;
        var lng = latlng.lng()+Math.sin(toRadians(direcao))*0.0005;
        var latlng2 =  new google.maps.LatLng(lat,lng);
    }else{
        bool = false;
        console.log("dir "+ direcao);
    }
    if(bool){

        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };

        var lineCoordinates = [
            latlng,
            latlng2
        ];

        var line = new google.maps.Polyline({
            path: lineCoordinates,
            icons: [{
                icon: lineSymbol,
                offset: '100%',
                strokeColor: color,
                fillColor : color
            }],
            map: _map
        });
    }

}

function calculateDistanceWithDatetime(previousDataHora,previousVelocidade, currentDataHora, currentVelocidade){

    var previous = moment.unix(previousDataHora);
    var current = moment.unix(currentDataHora);
    var time = (moment.duration(current - previous)._milliseconds );  //got the time in milliseconds

    previousVelocidade = ( previousVelocidade * 1000 ) / 3600; // in meters/seconds
    currentVelocidade =  ( currentVelocidade  * 1000 ) / 3600; // in meters/seconds
    var velocidadeMedia = (previousVelocidade + currentVelocidade) / 2

    var distanciaPercorrida = velocidadeMedia * time  / 1000 ;

    return distanciaPercorrida;
}

function isSameHour(previousDataHora,currentDataHora){
    var previous = moment.unix(previousDataHora);
    var current = moment.unix(currentDataHora);
    var time = (moment.duration(current - previous)._milliseconds );
    return (time/1000 < 1); // > 1 second

}

function getReadableHora(hora){
    return moment.unix(hora).format("DD/MM/YYYY HH:mm:ss");
}



//events listener
function startLoadingAnimation(){
    // Starts the loading animation
    $('#main-container').fadeTo("fast",0.1,function(){
        $('#dvLoading').fadeIn("fast");
    });
}

function endLoadingAnimation(){
    // Finishes the loading animation
    $('#dvLoading').fadeOut("fast", function() {
        $('#main-container').fadeTo("fast",1);
    });
}


$(function(){
    endLoadingAnimation();
    //generating datetimepicker for initialDate and finalDate
    $('[id*=Date]').datetimepicker({format: "DD/MM/YYYY HH:mm:ss",language: 'pt-br'});
});


