const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerOptions = require('./doc/extend')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET = 'PenaltiFoiPIX'


const app = express()
const port = 3000

const specs = swaggerJsdoc(swaggerOptions)

app.use(express.json())

let usuariosAuth = []

const authenticationToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('---- authHeader', authHeader)
    const token = authHeader && authHeader.split(' ')[1];
    console.log('---- token', token)
    
    if(!token) {
        return res.status(401).json({ message: 'Token Invalido'})
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({message: 'Acesso negado'})
        }
        req.user = user;
        next()
    })
}

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
app.get("/aluno", authenticationToken, (req, res) => {
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
app.post("/aluno", authenticationToken, (req, res) => {
    const novoAluno = { id: alunos.length + 1, ...req.body }
    alunos.push(novoAluno)
    res.status(201).json(novoAluno)
})

/**
 * @swagger
 * /aluno/{id}:
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
app.put("/aluno/:id", authenticationToken, (req, res) => {
    const {id} = req.params
    const alunoIndex = alunos.findIndex(a => a.id == id)

    if (alunoIndex > -1) {
        alunos[alunoIndex] = {id: Number(id),...req.body }
        res.json(alunos[alunoIndex])
    } else {
        res.status(404).json({"message": "Cara tem certeza que é esse id?"})
    }
})

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Usuário já existe
 */
app.post('/auth/register', async (req, res) => {
    const {nome, email, senha} = req.body

    const usuarioExistente = usuariosAuth.find(u => u.email === email)
    if(usuarioExistente) {
        return res.status(400).json({message: 'E-mail já existente'})
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    const novoUsuario = {
        id: usuariosAuth.length + 1,
        nome,
        email,
        senha: senhaHash
    }

    usuariosAuth.push(novoUsuario)
    res.status(201).json({message: 'Usuario Cadastrado'})
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Credenciais inválidas
 */
app.post('/auth/login', async(req, res) => {
    const {email, senha} = req.body

    const usuario = usuariosAuth.find(u => u.email === email)
    if(!usuario){
        return res.status(401).json({message: 'Credenciais Invalidas'})
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
        return res.status(401).json({message: 'Credenciais Invalidas'})
    }

    const token = jwt.sign(
        { nomeUsuario: usuario.nome },
        JWT_SECRET,
        { expiresIn: '1h'}
    )

    res.json({token: token})
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

app.listen(port, () => {
    console.log("Servidor de API rodando")
})