const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerOptions = require('./doc/extend')

const app = express()
const port = 3000

const specs = swaggerJsdoc(swaggerOptions)

app.use(express.json())


/**
 * @swagger
 * components:
 *  schemas:
 *      Aluno:
 *          type: object
 *          required:
 *              - id
 *              - ra
 *              - nome
 *          properties:
 *              id:
 *                  type: integer
 *                  description: Identificador unico do aluno
 *              nome:
 *                  type: string
 *                  description: Nome do aluno
 *              ra:
 *                  type: integer
 *                  description: Número da matrícula
 *          example:
 *              id: 1
 *              nome: Fulano
 *              ra: 123    
 */
let alunos = [
    { "id": 1, "ra": 123, "nome": "Fulano" }
]

/**
 * @swagger
 * /aluno:
 *  get:
 *      summary: Retorna todos os alunos
 *      tags: [Alunos]
 *      responses:
 *          200:
 *              description: Lista de alunos
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/Aluno'
 */
app.get("/aluno", (req, res) => {
    res.json(alunos)
})

/**
 * @swagger
 * /aluno:
 *  post:
 *      summary: Cadastros de aluno
 *      tags: [Alunos]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          nome:
 *                              type: string
 *                          ra:
 *                              type: integer
 *      responses:
 *          201:
 *              description: Cadastro de alunos
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Aluno'
 */
app.post("/aluno", (req, res) => {
    const novoAluno = { id: alunos.length + 1, ...req.body }
    alunos.push(novoAluno)
    res.status(201).json(novoAluno)
})

/**
 * @swagger
 * /aluno:
 *  put:
 *      summary: Atualização de aluno
 *      tags: [Alunos]
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: integer
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          nome:
 *                              type: string
 *                          ra:
 *                              type: integer
 *      responses:
 *          200:
 *              description: Aluno atualizado
 *          404:
 *              description: Cara tem certeza que é esse id?               
 */
app.put("/aluno/:id", (req, res) => {
    const {id} = req.params
    const alunoIndex = alunos.findIndex(a => a.id == id)

    if (alunoIndex > -1) {
        alunos[alunoIndex] = {id: Number(id),...req.body }
        res.json(alunos[alunoIndex])
    } else {
        res.status(404).json({"message": "Cara tem certeza que é esse id?"})
    }
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

app.listen(port, () => {
    console.log("Servidor de API rodando")
})