const validator = require('validator')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const res = require('express/lib/response')

const UserSchema = new mongoose.Schema({
  nome: String,
  email: String,
  cpf: String,
  estado: String,
  municipio: String,
  telefone: String,
  senha: String,
})

UserSchema.set("toObject", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.senha;
  }
})

const User = mongoose.model('user', UserSchema)

const hashCompare = (senhaNormal, hash) => {
  const result = bcrypt.compareSync(senhaNormal, hash)
  return result
}

class UserModel {

  constructor(body) {
    this.body = body
    this.user
    this.error = []
  }

  validate() {
    for(let i in this.body) {
      if(typeof this.body[i] === 'string') {
        this.body[i] = String(this.body[i])
      }
    }

    if(!validator.isEmail(this.body.email)) {
      this.error.push('Email inválido')
    }
  }

  hashPass() {
      const passwordHash = bcrypt.hashSync(this.body.senha, 10);
      this.body.senha = passwordHash;
  }

  static async loginUser(dataUser) {
    const user = await User.findOne({"cpf": dataUser.cpf})
    
    if(!user) return {status: 401, message: "Usuário não existe"}

    const result = hashCompare(dataUser.senha, user.senha)
    if(result) {
      return user.toObject()
    } else {
      return 'não passou'
    }
  }

  async registerUser() {
    this.validate()

    if(this.error.length > 0) return

    this.hashPass()

    const newUser = new User(this.body)

    const user = await newUser.save()
    const {senha, ...resto} = this.body
    resto.id = user.id
    return resto

  }

}

module.exports = UserModel