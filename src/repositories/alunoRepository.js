const Aluno = require('../models/Aluno')

class AlunoRepository {
    async findAll() {
        return await Aluno.findAll();
    }

    async create(aluno) {
        return await Aluno.create(aluno)
    }
}

module.exports = new AlunoRepository()