const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerOptions = require('./doc/extend')
const sequelize = require('./src/config/database')

const app = express()
const port = 3000
const specs = swaggerJsdoc(swaggerOptions)

const userRoutes = require('./src/routes/userRoute')
const alunoRoutes = require('./src/routes/alunoRoute')

app.use(express.json())

app.use('/auth', userRoutes)
app.use('/aluno', alunoRoutes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

sequelize.sync({force: false}).then(() => {
    app.listen(port, () => {
        console.log("Servidor APi rodando http://localhost:3000/api-docs")
    })
})