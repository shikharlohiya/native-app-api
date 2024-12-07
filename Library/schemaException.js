const schemaException = (e) => {
    var message = 'Internal server error!'
    if('errors' in e){
        const erros = e.errors;
        const firstError = Object.keys(erros)[0];
        var message = erros[firstError]['message'];
    }

    return message;
}

module.exports = {
    schemaException,
}