const structure = (success, message = '', data = []) => {
    return {success, message, data}
}

const token_structure = (success, message = '', data = [], token) => {
    return {success, message, data, token_type:'bearer', token}
}

const action_structure = (success, message = '', data = [], action) => {
    return {success, message, data, action}
}

const action_with_token_structure = (success, message = '', data = [], token, action) => {
    return {success, message, data, token_type:'bearer', token, action}
}

module.exports = {
    structure,
    token_structure,
    action_structure,
    action_with_token_structure
}