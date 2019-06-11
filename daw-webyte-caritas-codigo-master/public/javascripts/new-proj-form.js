
$('select').formSelect();

let root = {
    "ASISTENCIA SOCIAL": [],
    "PROMOCION HUMANA": [],
    
}

//Organizarlos en un arbol quien sabe como
$.getJSON("/dashboard/proyectos/programAPI", data => {
    for(const i in data){
        const sub = data[i];
        const la = sub.lineadeaccion;
        const prog = sub.prog;
        if(!(prog in root[la])){
            //this is a new program
            root[la][prog] = [];
        }

        root[la][prog].push(sub);

    }
});

//Dinamizar el formato de los estados
$('#state').change(e => {
    //get the cities
    const cities = mx[$('#state').val()];
    //we have the cities
    //clear the select
    $('#city').empty();
    //populate the cities
    for(const c in cities){
        const city = cities[c];
        $('#city').append('<option value="'+city.id+'">'+city.nombre+'</option>');
    }

});

//Dinamizar el LA, PROG y SUB
$('#lineadeaccion').change(e => {
    const progs = root[$('#lineadeaccion').val()];
    //clear the select
    $('#program').empty();
    //populate the program
    $('#program').append('<option value="" disabled selected>Seleccione...</option>')
    for(const p in progs){
        $('#program').append(
            '<option value="'+p+'">'+p+'</option>'
        );
    }

});

$('#program').change(e => {
    const la = $('#lineadeaccion').val();
    const pr = $('#program').val();

    const subs = root[la][pr];

    $('#sub').empty();

    for(i in subs){
        const sub = subs[i];
        console.log(sub);
        $('#sub').append(
            '<option value="'+sub.id+'">'+sub.sub+'</option>'
        )
    }
});

