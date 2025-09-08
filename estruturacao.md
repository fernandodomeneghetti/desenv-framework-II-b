# Plano de Aula: Refatoração e Estruturação de API Node.js

**Professor:** Especialista em Programação Backend e JavaScript  
**Disciplina:** Desenvolvimento de Frameworks II  
**Carga Horária:** 4 horas/aula  
**Objetivo:** Refatorar uma API monolítica para arquitetura em camadas com banco de dados

## 📋 Situação Atual do Projeto

O projeto atual possui toda a lógica concentrada no arquivo `index.js`, incluindo:
- Rotas e controladores
- Lógica de negócio
- Armazenamento em memória (arrays)
- Autenticação e middleware
- Configuração do Swagger

## 🎯 Objetivos da Refatoração

1. **Separação de Responsabilidades**: Implementar arquitetura em camadas
2. **Persistência de Dados**: Migrar de arrays em memória para SQLite
3. **Organização do Código**: Estrutura modular e escalável
4. **Boas Práticas**: Aplicar padrões de desenvolvimento backend

---

# 🚀 IMPLEMENTAÇÃO PASSO A PASSO

## **PASSO 1: Instalação de Dependências**

**Execute no terminal:**
```bash
npm install sequelize sqlite3 dotenv
```

## **PASSO 2: Criar Estrutura de Pastas**

**Execute no terminal:**
```bash
mkdir -p src/config src/models src/repositories src/services src/controllers src/middlewares src/routes
```

## **PASSO 3: Configuração do Banco de Dados**

**Crie o arquivo:** `src/config/database.js`
```javascript
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
})

module.exports = sequelize
```

## **PASSO 4: Criar Models**

### **Crie o arquivo:** `src/models/User.js`
```javascript
const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

module.exports = User
```

### **Crie o arquivo:** `src/models/Aluno.js`
```javascript
const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Aluno = sequelize.define('Aluno', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ra: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

module.exports = Aluno
```

## **PASSO 5: Criar Repositories**

### **Crie o arquivo:** `src/repositories/userRepository.js`
```javascript
const User = require('../models/User')

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ where: { email } })
    }

    async create(userData) {
        return await User.create(userData)
    }
}

module.exports = new UserRepository()
```

### **Crie o arquivo:** `src/repositories/alunoRepository.js`
```javascript
const Aluno = require('../models/Aluno')

class AlunoRepository {
    async findAll() {
        return await Aluno.findAll()
    }

    async findById(id) {
        return await Aluno.findByPk(id)
    }

    async create(alunoData) {
        return await Aluno.create(alunoData)
    }

    async update(id, alunoData) {
        const [updated] = await Aluno.update(alunoData, { where: { id } })
        if (updated) {
            return await this.findById(id)
        }
        return null
    }

    async delete(id) {
        return await Aluno.destroy({ where: { id } })
    }
}

module.exports = new AlunoRepository()
```

## **PASSO 6: Criar Services**

### **Crie o arquivo:** `src/services/authService.js`
```javascript
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userRepository = require('../repositories/userRepository')

const JWT_SECRET = 'PenaltiFoiPIX'

class AuthService {
    async register(userData) {
        const { nome, email, senha } = userData

        const usuarioExistente = await userRepository.findByEmail(email)
        if (usuarioExistente) {
            throw new Error('E-mail já existente')
        }

        const senhaHash = await bcrypt.hash(senha, 10)
        const novoUsuario = await userRepository.create({
            nome,
            email,
            senha: senhaHash
        })

        return { message: 'Usuario Cadastrado' }
    }

    async login(loginData) {
        const { email, senha } = loginData

        const usuario = await userRepository.findByEmail(email)
        if (!usuario) {
            throw new Error('Credenciais Invalidas')
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if (!senhaValida) {
            throw new Error('Credenciais Invalidas')
        }

        const token = jwt.sign(
            { nomeUsuario: usuario.nome },
            JWT_SECRET,
            { expiresIn: '1h' }
        )

        return { token }
    }
}

module.exports = new AuthService()
```

### **Crie o arquivo:** `src/services/alunoService.js`
```javascript
const alunoRepository = require('../repositories/alunoRepository')

class AlunoService {
    async findAll() {
        return await alunoRepository.findAll()
    }

    async findById(id) {
        const aluno = await alunoRepository.findById(id)
        if (!aluno) {
            throw new Error('Cara tem certeza que é esse id?')
        }
        return aluno
    }

    async create(alunoData) {
        const { nome, ra } = alunoData
        
        if (!nome || !ra) {
            throw new Error('Nome e RA são obrigatórios')
        }

        return await alunoRepository.create(alunoData)
    }

    async update(id, alunoData) {
        const aluno = await alunoRepository.update(id, alunoData)
        if (!aluno) {
            throw new Error('Cara tem certeza que é esse id?')
        }
        return aluno
    }

    async delete(id) {
        const deleted = await alunoRepository.delete(id)
        if (!deleted) {
            throw new Error('Cara tem certeza que é esse id?')
        }
        return { message: 'Aluno removido com sucesso' }
    }
}

module.exports = new AlunoService()
```

## **PASSO 7: Criar Controllers**

### **Crie o arquivo:** `src/controllers/authController.js`
```javascript
const authService = require('../services/authService')

class AuthController {
    async register(req, res) {
        try {
            const result = await authService.register(req.body)
            res.status(201).json(result)
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }

    async login(req, res) {
        try {
            const result = await authService.login(req.body)
            res.json(result)
        } catch (error) {
            res.status(401).json({ message: error.message })
        }
    }
}

module.exports = new AuthController()
```

### **Crie o arquivo:** `src/controllers/alunoController.js`
```javascript
const alunoService = require('../services/alunoService')

class AlunoController {
    async getAll(req, res) {
        try {
            const alunos = await alunoService.findAll()
            res.json(alunos)
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    }

    async getById(req, res) {
        try {
            const aluno = await alunoService.findById(req.params.id)
            res.json(aluno)
        } catch (error) {
            res.status(404).json({ message: error.message })
        }
    }

    async create(req, res) {
        try {
            const aluno = await alunoService.create(req.body)
            res.status(201).json(aluno)
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }

    async update(req, res) {
        try {
            const aluno = await alunoService.update(req.params.id, req.body)
            res.json(aluno)
        } catch (error) {
            res.status(404).json({ message: error.message })
        }
    }

    async delete(req, res) {
        try {
            const result = await alunoService.delete(req.params.id)
            res.json(result)
        } catch (error) {
            res.status(404).json({ message: error.message })
        }
    }
}

module.exports = new AlunoController()
```

## **PASSO 8: Criar Middleware de Autenticação**

### **Crie o arquivo:** `src/middlewares/auth.js`
```javascript
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'PenaltiFoiPIX'

const authenticationToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) {
        return res.status(401).json({ message: 'Token Invalido' })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Acesso negado' })
        }
        req.user = user
        next()
    })
}

module.exports = authenticationToken
```

## **PASSO 9: Criar Rotas**

### **Crie o arquivo:** `src/routes/authRoutes.js`
```javascript
const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router()

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
router.post('/register', authController.register.bind(authController))

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
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', authController.login.bind(authController))

module.exports = router
```

### **Crie o arquivo:** `src/routes/alunoRoutes.js`
```javascript
const express = require('express')
const alunoController = require('../controllers/alunoController')
const authenticationToken = require('../middlewares/auth')

const router = express.Router()

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
router.get('/', authenticationToken, alunoController.getAll.bind(alunoController))

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
router.post('/', authenticationToken, alunoController.create.bind(alunoController))

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
router.put('/:id', authenticationToken, alunoController.update.bind(alunoController))

module.exports = router
```

## **PASSO 10: Refatorar o index.js**

### **Substitua COMPLETAMENTE o conteúdo do arquivo:** `index.js`
```javascript
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerOptions = require('./doc/extend')
const sequelize = require('./src/config/database')

// Importar rotas
const authRoutes = require('./src/routes/authRoutes')
const alunoRoutes = require('./src/routes/alunoRoutes')

const app = express()
const port = 3000

const specs = swaggerJsdoc(swaggerOptions)

app.use(express.json())

// Configurar rotas
app.use('/auth', authRoutes)
app.use('/aluno', alunoRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// Sincronizar banco de dados e iniciar servidor
sequelize.sync({ force: false }).then(() => {
    console.log('Banco de dados sincronizado')
    app.listen(port, () => {
        console.log("Servidor de API rodando")
    })
}).catch(err => {
    console.error('Erro ao sincronizar banco:', err)
})
```

## **PASSO 11: Testar a Aplicação**

### **Execute no terminal:**
```bash
node index.js
```

### **Teste os endpoints:**

1. **Registrar usuário:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","email":"joao@teste.com","senha":"123456"}'
```

2. **Fazer login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","senha":"123456"}'
```

3. **Criar aluno (use o token do login):**
```bash
curl -X POST http://localhost:3000/aluno \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome":"Maria","ra":12345}'
```

4. **Listar alunos:**
```bash
curl -X GET http://localhost:3000/aluno \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🎯 Resultado Final

✅ **Estrutura organizada em camadas**  
✅ **Banco de dados SQLite funcionando**  
✅ **Separação de responsabilidades**  
✅ **Código reutilizável e testável**  
✅ **API REST completa**  

## 📁 Estrutura Final do Projeto

```
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── alunoController.js
│   │   └── authController.js
│   ├── middlewares/
│   │   └── auth.js
│   ├── models/
│   │   ├── Aluno.js
│   │   └── User.js
│   ├── repositories/
│   │   ├── alunoRepository.js
│   │   └── userRepository.js
│   ├── routes/
│   │   ├── alunoRoutes.js
│   │   └── authRoutes.js
│   └── services/
│       ├── alunoService.js
│       └── authService.js
├── doc/
├── resquest/
├── database.sqlite (será criado automaticamente)
├── index.js
├── package.json
└── package-lock.json
```

---

**🎓 Parabéns! Você refatorou com sucesso uma API monolítica para arquitetura em camadas!**