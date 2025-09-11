const Usuario = require('../models/User')

class UserRepository {
    async findByEmail(email) {
        return await Usuario.findOne({ where: {email}})   
    }

    async create(usuario) {
        return await Usuario.create(usuario)
    }
}

module.exports = new UserRepository()