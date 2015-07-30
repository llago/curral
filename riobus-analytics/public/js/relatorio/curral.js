var coordinate = new google.maps.LatLng(-22.907073, -43.320531);                                                                                                                                                                                                       

var retanguloTesteCoords = [
	new google.maps.LatLng(-23.00084,-43.3675),
	new google.maps.LatLng(-23.00074,-43.3648),
	new google.maps.LatLng(-23.00173,-43.36461),
	new google.maps.LatLng(-23.00184,-43.36618),
	new google.maps.LatLng(-23.00187,-43.36746)
  ];

var analysesData = function(data) {
		var newData = [];
		data.map(function(data) {
			if(JSON.stringify(data) != "{}") {
				newData.push(data);
			}
		});
		return newData;
	}

var	poligonoteste = new google.maps.Polygon({
	    paths: retanguloTesteCoords,
	    strokeColor: '#FF0000',
	    strokeOpacity: 0.8,
	    strokeWeight: 3,
	    fillColor: '#FF0000',
	    fillOpacity: 0.35
  	});

var isWithinPolygon = poligonoteste.containsLatLng(coordinate);






function startLoadingAnimation(){
    // Starts the loading animation
    $('#main-container').fadeTo("fast",0.1,function(){
    });//
}

function endLoadingAnimation(){
    // Finishes the loading animation
    $('#main-container').fadeTo("fast",1,function(){
    });//
}



function runSearch() {
    startLoadingAnimation();
    
    //TODO should check if the date is not to big...
    //TODO should check if the initialDate < finalDate
    //TODO should check if the query is in the same month

    var initialDate = $("#initialDate").val();
    var finalDate = $("#finalDate").val();

    if (!initialDate || !finalDate){
        alert("Por favor, preencha as datas")
        return;
    }
    //var month = moment(initialDate,"DD/MM/YYYY HH:mm:ss").format("YYYYMM");
    //initialDate = moment(initialDate,"DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    //finalDate = moment(finalDate,"DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
	initialDate = moment(initialDate,"DD/MM/YYYY - HH").format("YYYYMMDDHH");
    finalDate = moment(finalDate,"DD/MM/YYYY - HH").format("YYYYMMDDHH");
    url = "http://rest.riob.us:81/api/" + initialDate + "/" + finalDate + "?callback=?"

	$.getJSON(url, function(data, status){
		data = [data];
		data = analysesData(data);
		var contador = 0;
		var onibusdentro = [];
		//var linha = data[4].ORDEM;
		for(var j=0;j<data[0].length;j++){
			for(var i=0;i<data[0][j].DATA.length;i++){
				var lat = data[0][j].DATA[i][3];
				var longi = data[0][j].DATA[i][4];
				var coordinate = new google.maps.LatLng(lat,longi); 
				var isWithinPolygon = poligonoteste.containsLatLng(coordinate);

				if(isWithinPolygon){
					//console.log(+lat+","+longi);
					onibusdentro[contador] = data[0][j].DATA[i];
					contador++;
				}
			}
		}
	
	
		for(var z=0;z<onibusdentro.length;z++){
			
			onibus = onibusdentro[z];
			var title = '' + onibus[1];
            if(onibus[2]){
            var desc = ' <div class="col-sm-3"> '+ onibus[2] + ' </div>';
            }
            else{
            	var desc = ' <div class="col-sm-3"> ônibus sem linha </div>';
            }

            desc += ' <div class="col-sm-3"> '+  onibus[0] + '  </div>';
            
            var response = '<div class="col-sm-12">';
            response += '<h4 class="col-sm-3"><span class="col-sm-6">'+title+'</span>';
            
            response += '</h4>';
            response += ''+desc + '</div>';

            response += "</div>";
            document.getElementById("resposta").innerHTML += response;
  		
		}
		console.log("Numero de onibus:"+contador);
		endLoadingAnimation();
	});
       
 }

